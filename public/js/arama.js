const POPULER_ARAMALAR = [
  "airpods pro",
  "iphone 15",
  "playstation 5",
  "robot süpürge",
  "kahve makinesi",
  "akıllı saat",
];

const anaSayfa = document.getElementById("anaSayfa");
const sonucSayfasi = document.getElementById("sonucSayfasi");
const anaForm = document.getElementById("anaForm");
const anaInput = document.getElementById("anaInput");
const sonucForm = document.getElementById("sonucForm");
const sonucInput = document.getElementById("sonucInput");
const sonucBaslik = document.getElementById("sonucBaslik");
const sonucSayisi = document.getElementById("sonucSayisi");
const durumAlani = document.getElementById("durumAlani");
const kartIzgara = document.getElementById("kartIzgara");
const filtrePaneliAlani = document.getElementById("filtrePaneli");
const kategoriListesi = document.getElementById("kategoriListesi");
const logoDugmesi = document.getElementById("logoDugmesi");
const karsilastirmaAlani = document.getElementById("karsilastirmaAlani");
const detaySayfasi = document.getElementById("detaySayfasi");
const detayIcerik = document.getElementById("detayIcerik");
const geriDugmesi = document.getElementById("geriDugmesi");

let tumUrunler = [];
let filtreler = varsayilanFiltreler();
let karsilastirilanlar = new Set();

function varsayilanFiltreler() {
  return {
    magazalar: new Set(),
    minFiyat: null,
    maxFiyat: null,
    sadeceIndirim: false,
    siralama: "fiyat-artan",
  };
}

function siralamayiUygula(urunler, siralama) {
  const kopya = [...urunler];

  if (siralama === "fiyat-azalan") {
    return kopya.sort((a, b) => b.fiyat - a.fiyat);
  }
  if (siralama === "puan") {
    return kopya.sort((a, b) => (b.puan ?? 0) - (a.puan ?? 0));
  }
  if (siralama === "yorum") {
    return kopya.sort((a, b) => (b.yorumSayisi ?? 0) - (a.yorumSayisi ?? 0));
  }
  if (siralama === "magaza") {
    return kopya.sort((a, b) => a.magaza.localeCompare(b.magaza, "tr"));
  }

  return kopya.sort((a, b) => a.fiyat - b.fiyat);
}

function gosterilecekleriHesapla() {
  const suzulmus = tumUrunler
    .filter((u) => filtreler.magazalar.size === 0 || filtreler.magazalar.has(u.magaza))
    .filter((u) => filtreler.minFiyat === null || u.fiyat >= filtreler.minFiyat)
    .filter((u) => filtreler.maxFiyat === null || u.fiyat <= filtreler.maxFiyat)
    .filter((u) => !filtreler.sadeceIndirim || u.indirimli);

  return siralamayiUygula(suzulmus, filtreler.siralama);
}

function sonuclariCiz() {
  const gosterilenler = gosterilecekleriHesapla();

  if (gosterilenler.length === 0) {
    kartIzgara.innerHTML = "";
    sonucSayisi.textContent = `${tumUrunler.length} sonuçtan hiçbiri gösterilmiyor`;
    durumAlani.innerHTML = durumEkrani(
      "Filtrelerine uyan ürün yok",
      "Fiyat aralığını genişletmeyi veya satıcı seçimini kaldırmayı dene."
    );
    return;
  }

  const enDusukFiyat = Math.min(...gosterilenler.map((u) => u.fiyat));

  durumAlani.innerHTML = "";
  sonucSayisi.textContent =
    gosterilenler.length === tumUrunler.length
      ? `${tumUrunler.length} sonuç`
      : `${tumUrunler.length} sonuçtan ${gosterilenler.length} tanesi gösteriliyor`;

  kartIzgara.innerHTML = gosterilenler
    .map((urun) =>
      urunKarti(urun, urun.fiyat === enDusukFiyat, karsilastirilanlar.has(urun.id))
    )
    .join("");

  karsilastirmayiCiz();
}

function karsilastirmayiCiz() {
  const secilenler = tumUrunler.filter((u) => karsilastirilanlar.has(u.id));

  if (secilenler.length === 0) {
    karsilastirmaAlani.innerHTML = "";
    return;
  }

  if (secilenler.length === 1) {
    karsilastirmaAlani.innerHTML = `
      <div class="karsilastir-ipucu">
        1 ürün seçildi — karşılaştırma için en az 2 ürün seç.
        <button type="button" id="karsilastirTemizle">Seçimi kaldır</button>
      </div>
    `;
    return;
  }

  karsilastirmaAlani.innerHTML = `
    <div class="karsilastir-kutu">
      <div class="karsilastir-ust">
        <h3>${secilenler.length} ürün karşılaştırılıyor</h3>
        <button type="button" id="karsilastirTemizle">Seçimi temizle</button>
      </div>
      ${karsilastirmaTablosu(secilenler)}
    </div>
  `;
}

async function detayiAc(urunId) {
  const urun = tumUrunler.find((u) => u.id === urunId);

  sonucSayfasi.classList.add("gizli");
  detaySayfasi.classList.remove("gizli");
  detayIcerik.innerHTML = durumEkrani("Satıcılar getiriliyor…", "Bu ürünü satan mağazalar taranıyor.");

  try {
    const veri = await teklifleriGetir(urunId);

    if (!veri.teklifler || veri.teklifler.length === 0) {
      detayIcerik.innerHTML = durumEkrani(
        "Satıcı teklifi bulunamadı",
        "Bu ürün için karşılaştırılacak başka satıcı yok."
      );
      return;
    }

    const gorsel = veri.gorsel || (urun && urun.gorsel);

    detayIcerik.innerHTML = `
      <div class="detay-ust">
        <div class="detay-gorsel">
          ${gorsel ? `<img src="${gorsel}" alt="">` : `<div class="gorsel-yok">Görsel yok</div>`}
        </div>
        <div>
          <h2 class="detay-baslik">${veri.baslik || (urun && urun.baslik) || "Ürün"}</h2>
          <p class="detay-alt">${veri.teklifler.length} satıcı listelendi${
            veri.toplamTeklif > veri.teklifler.length ? ` (toplam ${veri.toplamTeklif} teklif)` : ""
          }</p>
          ${fiyatAraligi(veri.teklifler, veri.tipikAralik)}
        </div>
      </div>
      ${teklifTablosu(veri.teklifler)}
    `;
  } catch (hata) {
    console.error(hata);
    detayIcerik.innerHTML = durumEkrani(
      "Satıcılar getirilemedi",
      "Sunucuya ulaşılamadı. Biraz sonra tekrar dene."
    );
  }
}

kartIzgara.addEventListener("click", (olay) => {
  const dugme = olay.target.closest("[data-detay]");
  if (dugme) detayiAc(dugme.dataset.detay);
});

kartIzgara.addEventListener("change", (olay) => {
  const kutu = olay.target.closest("[data-karsilastir]");
  if (!kutu) return;

  if (kutu.checked) {
    karsilastirilanlar.add(kutu.dataset.karsilastir);
  } else {
    karsilastirilanlar.delete(kutu.dataset.karsilastir);
  }

  karsilastirmayiCiz();
});

karsilastirmaAlani.addEventListener("click", (olay) => {
  if (olay.target.id !== "karsilastirTemizle") return;

  karsilastirilanlar.clear();
  sonuclariCiz();
});

geriDugmesi.addEventListener("click", () => {
  detaySayfasi.classList.add("gizli");
  sonucSayfasi.classList.remove("gizli");
});

function filtrePaneliniCiz() {
  filtrePaneliAlani.innerHTML = filtrePaneli(tumUrunler, filtreler);
}

function sayiyaCevirVeyaNull(deger) {
  const sayi = parseFloat(deger);
  return Number.isNaN(sayi) ? null : sayi;
}

filtrePaneliAlani.addEventListener("change", (olay) => {
  const hedef = olay.target;

  if (hedef.id === "siralamaSecimi") {
    filtreler.siralama = hedef.value;
  } else if (hedef.id === "minFiyat") {
    filtreler.minFiyat = sayiyaCevirVeyaNull(hedef.value);
  } else if (hedef.id === "maxFiyat") {
    filtreler.maxFiyat = sayiyaCevirVeyaNull(hedef.value);
  } else if (hedef.id === "sadeceIndirim") {
    filtreler.sadeceIndirim = hedef.checked;
  } else if (hedef.dataset.magaza) {
    if (hedef.checked) {
      filtreler.magazalar.add(hedef.dataset.magaza);
    } else {
      filtreler.magazalar.delete(hedef.dataset.magaza);
    }
  } else {
    return;
  }

  sonuclariCiz();
});

filtrePaneliAlani.addEventListener("click", (olay) => {
  if (olay.target.id !== "filtreTemizle") return;

  filtreler = varsayilanFiltreler();
  filtrePaneliniCiz();
  sonuclariCiz();
});

function anaSayfayiGoster() {
  anaSayfa.classList.remove("gizli");
  sonucSayfasi.classList.add("gizli");
  detaySayfasi.classList.add("gizli");
  anaInput.value = "";
  anaInput.focus();
}

function sonucSayfasiniGoster(aranan) {
  anaSayfa.classList.add("gizli");
  detaySayfasi.classList.add("gizli");
  sonucSayfasi.classList.remove("gizli");
  sonucInput.value = aranan;
  sonucBaslik.textContent = `"${aranan}" sonuçları`;
}

async function aramayiCalistir(aranan) {
  const temiz = aranan.trim();
  if (!temiz) return;

  sonucSayfasiniGoster(temiz);

  tumUrunler = [];
  filtreler = varsayilanFiltreler();
  karsilastirilanlar.clear();
  karsilastirmaAlani.innerHTML = "";
  filtrePaneliAlani.innerHTML = "";
  kartIzgara.innerHTML = "";
  sonucSayisi.textContent = "";
  durumAlani.innerHTML = durumEkrani("Aranıyor…", "Mağazalar taranıyor ve sonuçlar süzülüyor.");

  try {
    const urunler = await urunAra(temiz);

    if (urunler.length === 0) {
      durumAlani.innerHTML = durumEkrani(
        "Sonuç bulunamadı",
        "Farklı bir yazım deneyebilir veya arama terimini kısaltabilirsin."
      );
      return;
    }

    tumUrunler = urunler;
    filtrePaneliniCiz();
    sonuclariCiz();
  } catch (hata) {
    console.error(hata);
    durumAlani.innerHTML = durumEkrani(
      "Bir şeyler ters gitti",
      "Sunucuya ulaşılamadı. Birkaç saniye sonra tekrar dene."
    );
  }
}

function kategorileriKur() {
  kategoriListesi.innerHTML = POPULER_ARAMALAR.map((terim) => {
    return `<button type="button" data-terim="${terim}">${terim}</button>`;
  }).join("");

  kategoriListesi.addEventListener("click", (olay) => {
    const dugme = olay.target.closest("button");
    if (dugme) aramayiCalistir(dugme.dataset.terim);
  });
}

anaForm.addEventListener("submit", (olay) => {
  olay.preventDefault();
  aramayiCalistir(anaInput.value);
});

sonucForm.addEventListener("submit", (olay) => {
  olay.preventDefault();
  aramayiCalistir(sonucInput.value);
});

logoDugmesi.addEventListener("click", anaSayfayiGoster);

kategorileriKur();
