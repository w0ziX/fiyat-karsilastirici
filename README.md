# Fiyat Karşılaştırıcı

Bir ürün adı yazınca Türkiye'deki mağazalardaki fiyatları toplayan, yapay zekâ ile alakasız sonuçları eleyen ve ucuzdan pahalıya sıralayan web uygulaması.

## Nasıl çalışıyor

```
Tarayıcı  →  Express sunucusu  →  RapidAPI (Google Shopping, country=tr)
                    ↓
              Gemini ile filtreleme (aksesuar / taklit eleme)
                    ↓
              Fiyatlar sayıya çevrilir, sıralanır  →  Tarayıcı
```

API anahtarları yalnızca sunucuda durur; tarayıcıya hiç gönderilmez.

## Özellikler

- Türkiye mağazalarında ürün arama
- Yapay zekâ ile aksesuar, taklit ve alakasız ürünleri eleme
- Satıcı, fiyat aralığı ve indirim filtreleri; 5 farklı sıralama
- Ürün detayında satıcı bazlı fiyat tablosu ve tipik fiyat aralığı göstergesi
- Birden fazla ürünü yan yana karşılaştırma
- 5 tema (aydınlık, karanlık, cyberpunk, sıcak, pastel), tercih tarayıcıda saklanır
- Mobil uyumlu, WCAG AA kontrast eşiğini geçen renk paletleri

## Kurulum

```bash
npm install
cp .env.example .env
```

`.env` dosyasını aç ve iki anahtarı doldur:

- `RAPIDAPI_KEY` — [Real-Time Product Search](https://rapidapi.com/letscrape-6bRBa3QguO5/api/real-time-product-search) API'sine abone ol (ücretsiz plan yeterli)
- `GEMINI_API_KEY` — [Google AI Studio](https://aistudio.google.com/apikey)'dan ücretsiz al

## Çalıştırma

```bash
node server.js
```

Tarayıcıda `http://localhost:3000` adresini aç.

## Proje yapısı

```
server.js              Express sunucusu ve API uç noktaları
public/
  index.html           Tek sayfa: ana sayfa, sonuçlar, ürün detayı
  css/style.css        Tasarım değişkenleri ve 5 tema
  js/
    tema.js            Tema seçimi ve kalıcılık
    api.js             Backend çağrıları ve oturum önbelleği
    bilesenler.js      HTML üreten saf fonksiyonlar
    arama.js           Sayfa mantığı, filtreler, karşılaştırma
```

## API uç noktaları

| Uç nokta | Açıklama |
|---|---|
| `GET /api/search?urun=<ad>` | Ürün arar, AI ile filtreler, fiyata göre sıralı liste döner |
| `GET /api/offers?id=<ürün id>` | Bir ürünü satan mağazaların tekliflerini döner |

## Bilinen kısıtlar

- Satıcı teklifleri sayfa başına 3 kayıt geliyor; sayfalama henüz eklenmedi.
- Kategori filtresi yok — API ürün kategorisi döndürmüyor. Ana sayfadaki başlıklar hazır arama kısayolu.
- Fiyat geçmişi grafiği yok — RapidAPI'nin ilgili uç noktası ücretsiz planda bulunmuyor. Yerine tipik fiyat aralığı gösteriliyor.
