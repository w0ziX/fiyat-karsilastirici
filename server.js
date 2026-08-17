require("dotenv").config();
const express = require("express");

const { GoogleGenAI, Type } = require("@google/genai");
const ai = new GoogleGenAI ({apiKey: process.env.GEMINI_API_KEY});

const app = express();
const PORT = 3000;

app.use(express.static(__dirname + "/public"));


function fiyatiSayiyaCevir(fiyatMetni) {
  if (!fiyatMetni) return null;

  const temiz = String(fiyatMetni)
    .replace(/[^\d.,]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");

  const sayi = parseFloat(temiz);
  return Number.isNaN(sayi) ? null : sayi;
}

async function alakaliUrunleriSec(aranan, urunler) {
  const liste = urunler
    .map((u, i) => `${i}: ${u.baslik}`)
    .join("\n");

  const response = await ai.models.generateContent({
    model: "gemini-3.6-flash",
    contents: `Kullanıcı "${aranan}" ürününü arıyor.

Aşağıda numaralı ürün listesi var. Kullanıcının aradığı ürün ailesine ait olan tüm ürünleri seç.

DAHİL ET:
- Aranan ürünün farklı nesilleri ve sürümleri (örn. "airpods pro" araması için AirPods Pro 2, AirPods Pro 3)
- Farklı renk, kapasite ve paket seçenekleri
- İkinci el veya yenilenmiş olanlar

ELEME:
- Aksesuarlar: kılıf, kablo, adaptör, askı, koruyucu, yedek parça
- Taklit veya muadil ürünler (örn. "Pro 6S", "i12" gibi jenerik kopyalar)
- Farklı bir ürün ailesi (örn. "airpods pro" araması için Pro olmayan düz AirPods 4)

${liste}

Sadece eşleşen numaraları döndür.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          eslesenler: {
            type: Type.ARRAY,
            items: { type: Type.INTEGER },
          },
        },
        required: ["eslesenler"],
      },
    },
  });

  const sonuc = JSON.parse(response.text);

  return sonuc.eslesenler.map((i) => urunler[i]).filter(Boolean);
}

const RAPIDAPI_HOST = "real-time-product-search.p.rapidapi.com";

async function rapidApiCagir(yol, parametreler) {
  const url = new URL(`https://${RAPIDAPI_HOST}${yol}`);
  url.searchParams.set("country", "tr");
  url.searchParams.set("language", "tr");

  for (const [anahtar, deger] of Object.entries(parametreler)) {
    url.searchParams.set(anahtar, deger);
  }

  const response = await fetch(url, {
    headers: {
      "X-RapidAPI-Key": process.env.RAPIDAPI_KEY,
      "X-RapidAPI-Host": RAPIDAPI_HOST,
    },
  });

  if (!response.ok) {
    throw new Error(`RapidAPI ${yol} isteği ${response.status} döndü`);
  }

  return response.json();
}

app.get("/api/search", async (req, res) => {
  const urunAdi = req.query.urun;

  if (!urunAdi) {
    return res.status(400).json({ hata: "urun parametresi gerekli" });
  }

  try {
    const veri = await rapidApiCagir("/search", { q: urunAdi });

    const urunler = veri.data.products.map((p) => {
      const hamPuan = p.product_rating;

      return {
        id: p.product_id,
        baslik: p.product_title,
        magaza: p.store_name,
        fiyat: fiyatiSayiyaCevir(p.price),
        eskiFiyat: fiyatiSayiyaCevir(p.original_price),
        indirimli: Boolean(p.on_sale),
        gorsel: p.product_photos ? p.product_photos[0] : null,
        puan: hamPuan > 5 ? hamPuan / 10 : hamPuan,
        yorumSayisi: p.product_num_reviews,
        link: p.product_page_url,
      };
    } );

    const siraliUrunler = urunler.sort((a, b) => a.fiyat - b.fiyat);

    let sonuc = siraliUrunler;
    try { 
      sonuc = await alakaliUrunleriSec (urunAdi,siraliUrunler)
   } catch (aiHatasi) {
    console.error("AI filtreleme başarısız, ham liste dönülüyor:", aiHatasi);
   }

   res.json(sonuc);

  } catch (hata) {
    console.error(hata);
    res.status(500).json({ hata: "Sunucu tarafında bir sorun oluştu" });
  }
});

app.get("/api/offers", async (req, res) => {
  const urunId = req.query.id;

  if (!urunId) {
    return res.status(400).json({ hata: "id parametresi gerekli" });
  }

  try {
    const veri = await rapidApiCagir("/product-offers", { product_id: urunId });
    const d = veri.data;

    const teklifler = (d.offers || [])
      .map((o) => {
        return {
          magaza: o.store_name,
          fiyat: fiyatiSayiyaCevir(o.price),
          eskiFiyat: fiyatiSayiyaCevir(o.original_price),
          indirimli: Boolean(o.on_sale),
          kargo: o.shipping,
          durum: o.product_condition === "NEW" ? "Sıfır" : "İkinci el",
          logo: o.store_favicon,
          link: o.offer_page_url,
        };
      })
      .filter((o) => o.fiyat !== null)
      .sort((a, b) => a.fiyat - b.fiyat);

    const aralik = (d.typical_price_range || []).map(fiyatiSayiyaCevir);

    res.json({
      baslik: d.product_title,
      gorsel: d.product_photos ? d.product_photos[0] : null,
      toplamTeklif: d.product_num_offers ?? teklifler.length,
      tipikAralik: aralik.length === 2 && aralik.every((s) => s !== null) ? aralik : null,
      teklifler,
    });
  } catch (hata) {
    console.error(hata);
    res.status(500).json({ hata: "Satıcı teklifleri alınamadı" });
  }
});

app.listen(PORT, () => {
  console.log(`Sunucu çalışıyor: http://localhost:${PORT}`);
});
