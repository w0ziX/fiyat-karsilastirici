const paraBicimi = new Intl.NumberFormat("tr-TR", {
  style: "currency",
  currency: "TRY",
  maximumFractionDigits: 0,
});

function kacisliMetin(metin) {
  const kutu = document.createElement("div");
  kutu.textContent = metin == null ? "" : String(metin);
  return kutu.innerHTML;
}

function urunKarti(urun, enUcuzMu, secili) {
  const gorsel = urun.gorsel
    ? `<img src="${kacisliMetin(urun.gorsel)}" alt="">`
    : `<div class="gorsel-yok">Görsel yok</div>`;

  const rozetler = [];
  if (enUcuzMu) {
    rozetler.push(`<span class="rozet rozet-ucuz">En ucuz</span>`);
  }
  if (urun.indirimli && urun.eskiFiyat) {
    const oran = Math.round((1 - urun.fiyat / urun.eskiFiyat) * 100);
    if (oran > 0) {
      rozetler.push(`<span class="rozet rozet-indirim">%${oran} indirim</span>`);
    }
  }

  const puan = urun.puan
    ? `<p class="kart-puan">★ ${urun.puan.toFixed(1)} <span>(${urun.yorumSayisi || 0} yorum)</span></p>`
    : `<p class="kart-puan"><span>Puan yok</span></p>`;

  const eskiFiyat = urun.eskiFiyat && urun.eskiFiyat > urun.fiyat
    ? `<p class="kart-eski-fiyat">${paraBicimi.format(urun.eskiFiyat)}</p>`
    : "";

  return `
    <li class="kart ${enUcuzMu ? "en-ucuz" : ""}">
      <div class="kart-gorsel">${gorsel}</div>
      <div class="rozetler">${rozetler.join("")}</div>
      <h3 class="kart-baslik">${kacisliMetin(urun.baslik)}</h3>
      ${puan}
      <div class="kart-alt">
        ${eskiFiyat}
        <p class="kart-fiyat">${paraBicimi.format(urun.fiyat)}</p>
        <p class="kart-magaza">${kacisliMetin(urun.magaza)}</p>
        <button type="button" class="kart-link" data-detay="${kacisliMetin(urun.id)}">Satıcıları gör</button>
        <label class="kart-karsilastir">
          <input type="checkbox" data-karsilastir="${kacisliMetin(urun.id)}" ${secili ? "checked" : ""}>
          Karşılaştır
        </label>
      </div>
    </li>
  `;
}

function teklifTablosu(teklifler) {
  const satirlar = teklifler
    .map((t, sira) => {
      const logo = t.logo
        ? `<img class="teklif-logo" src="${kacisliMetin(t.logo)}" alt="">`
        : "";
      const eski =
        t.eskiFiyat && t.eskiFiyat > t.fiyat
          ? `<span class="teklif-eski">${paraBicimi.format(t.eskiFiyat)}</span>`
          : "";

      return `
        <tr class="${sira === 0 ? "teklif-en-ucuz" : ""}">
          <td>${logo}${kacisliMetin(t.magaza)}${sira === 0 ? ' <span class="rozet rozet-ucuz">En ucuz</span>' : ""}</td>
          <td class="teklif-fiyat">${eski}${paraBicimi.format(t.fiyat)}</td>
          <td class="teklif-kargo">${kacisliMetin(t.kargo || "—")}</td>
          <td>${kacisliMetin(t.durum)}</td>
          <td><a href="${kacisliMetin(t.link)}" target="_blank" rel="noopener">Git</a></td>
        </tr>
      `;
    })
    .join("");

  return `
    <div class="tablo-sarmal teklif-kutu">
      <table class="teklif-tablosu">
        <thead>
          <tr>
            <th scope="col">Satıcı</th>
            <th scope="col">Fiyat</th>
            <th scope="col">Kargo</th>
            <th scope="col">Durum</th>
            <th scope="col"><span class="gorunmez">Bağlantı</span></th>
          </tr>
        </thead>
        <tbody>${satirlar}</tbody>
      </table>
    </div>
  `;
}

function fiyatAraligi(teklifler, tipikAralik) {
  if (!tipikAralik) return "";

  const [alt, ust] = tipikAralik;
  const enUcuz = Math.min(...teklifler.map((t) => t.fiyat));
  const genislik = ust - alt;
  const konum = genislik > 0 ? Math.min(100, Math.max(0, ((enUcuz - alt) / genislik) * 100)) : 50;

  let sinif = "aralik-icinde";
  let yorum = `Bulunan en ucuz teklif <strong>${paraBicimi.format(enUcuz)}</strong> — tipik aralığın içinde.`;

  if (enUcuz > ust) {
    sinif = "aralik-ustunde";
    const fark = Math.round(((enUcuz - ust) / ust) * 100);
    yorum = `Bulunan en ucuz teklif <strong>${paraBicimi.format(enUcuz)}</strong> — tipik aralığın <strong>%${fark} üzerinde</strong>. Beklemek mantıklı olabilir.`;
  } else if (enUcuz < alt) {
    sinif = "aralik-altinda";
    const fark = Math.round(((alt - enUcuz) / alt) * 100);
    yorum = `Bulunan en ucuz teklif <strong>${paraBicimi.format(enUcuz)}</strong> — tipik aralığın <strong>%${fark} altında</strong>. İyi fırsat.`;
  }

  return `
    <div class="aralik-kutu ${sinif}">
      <p class="aralik-baslik">Bu ürün genelde ${paraBicimi.format(alt)} – ${paraBicimi.format(ust)} arasında satılıyor</p>
      <div class="aralik-cubuk">
        <div class="aralik-isaret" style="left: ${konum.toFixed(1)}%"></div>
      </div>
      <div class="aralik-uclar">
        <span>${paraBicimi.format(alt)}</span>
        <span>${paraBicimi.format(ust)}</span>
      </div>
      <p class="aralik-not">${yorum}</p>
    </div>
  `;
}

function karsilastirmaTablosu(urunler) {
  const enUcuz = Math.min(...urunler.map((u) => u.fiyat));
  const enIyiPuan = Math.max(...urunler.map((u) => u.puan ?? 0));

  const basliklar = urunler
    .map((u) => {
      const gorsel = u.gorsel
        ? `<img src="${kacisliMetin(u.gorsel)}" alt="">`
        : `<div class="gorsel-yok">Görsel yok</div>`;
      return `<th scope="col"><div class="karsilastir-gorsel">${gorsel}</div>${kacisliMetin(u.baslik)}</th>`;
    })
    .join("");

  const satir = (etiket, hucreler) =>
    `<tr><th scope="row">${etiket}</th>${hucreler.join("")}</tr>`;

  return `
    <div class="tablo-sarmal">
      <table class="karsilastir-tablosu">
        <thead><tr><td></td>${basliklar}</tr></thead>
        <tbody>
          ${satir("Fiyat", urunler.map((u) =>
            `<td class="${u.fiyat === enUcuz ? "en-iyi" : ""}">${paraBicimi.format(u.fiyat)}</td>`))}
          ${satir("Mağaza", urunler.map((u) => `<td>${kacisliMetin(u.magaza)}</td>`))}
          ${satir("Puan", urunler.map((u) =>
            `<td class="${u.puan && u.puan === enIyiPuan ? "en-iyi" : ""}">${u.puan ? u.puan.toFixed(1) : "—"}</td>`))}
          ${satir("Yorum", urunler.map((u) => `<td>${u.yorumSayisi ?? 0}</td>`))}
          ${satir("İndirim", urunler.map((u) => `<td>${u.indirimli ? "Var" : "Yok"}</td>`))}
        </tbody>
      </table>
    </div>
  `;
}

const SIRALAMA_SECENEKLERI = [
  { id: "fiyat-artan", ad: "Fiyat: önce ucuz" },
  { id: "fiyat-azalan", ad: "Fiyat: önce pahalı" },
  { id: "puan", ad: "Puan: yüksekten düşüğe" },
  { id: "yorum", ad: "Popülerlik: çok yorumlu" },
  { id: "magaza", ad: "Mağaza adı: A-Z" },
];

function filtrePaneli(urunler, secili) {
  const magazalar = [...new Set(urunler.map((u) => u.magaza))].sort((a, b) =>
    a.localeCompare(b, "tr")
  );

  const fiyatlar = urunler.map((u) => u.fiyat);
  const enAz = Math.floor(Math.min(...fiyatlar));
  const enCok = Math.ceil(Math.max(...fiyatlar));

  const siralamaSecenekleri = SIRALAMA_SECENEKLERI.map((s) => {
    const isaret = s.id === secili.siralama ? " selected" : "";
    return `<option value="${s.id}"${isaret}>${s.ad}</option>`;
  }).join("");

  const magazaKutulari = magazalar
    .map((magaza) => {
      const isaret = secili.magazalar.has(magaza) ? " checked" : "";
      return `
        <label class="magaza-kutu">
          <input type="checkbox" data-magaza="${kacisliMetin(magaza)}"${isaret}>
          ${kacisliMetin(magaza)}
        </label>
      `;
    })
    .join("");

  return `
    <div class="filtre-paneli">
      <div class="filtre-satir">
        <label class="filtre-alan">
          <span>Sırala</span>
          <select id="siralamaSecimi">${siralamaSecenekleri}</select>
        </label>

        <label class="filtre-alan">
          <span>En az (TL)</span>
          <input type="number" id="minFiyat" min="0" placeholder="${enAz}" value="${secili.minFiyat ?? ""}">
        </label>

        <label class="filtre-alan">
          <span>En çok (TL)</span>
          <input type="number" id="maxFiyat" min="0" placeholder="${enCok}" value="${secili.maxFiyat ?? ""}">
        </label>

        <label class="filtre-anahtar">
          <input type="checkbox" id="sadeceIndirim"${secili.sadeceIndirim ? " checked" : ""}>
          Sadece indirimdekiler
        </label>

        <button type="button" id="filtreTemizle" class="filtre-temizle">Filtreleri temizle</button>
      </div>

      <fieldset class="magaza-listesi" id="magazaListesi">
        <legend>Satıcı</legend>
        ${magazaKutulari}
      </fieldset>
    </div>
  `;
}

function durumEkrani(baslik, aciklama) {
  return `
    <div class="durum">
      <strong>${kacisliMetin(baslik)}</strong>
      ${kacisliMetin(aciklama)}
    </div>
  `;
}
