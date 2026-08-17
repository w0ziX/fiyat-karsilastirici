async function urunAra(aranan) {
  const onbellekAnahtari = `arama:${aranan.toLowerCase()}`;
  const onbellektekiler = sessionStorage.getItem(onbellekAnahtari);

  if (onbellektekiler) {
    return JSON.parse(onbellektekiler);
  }

  const response = await fetch(`/api/search?urun=${encodeURIComponent(aranan)}`);

  if (!response.ok) {
    throw new Error(`Sunucu ${response.status} döndü`);
  }

  const urunler = await response.json();
  sessionStorage.setItem(onbellekAnahtari, JSON.stringify(urunler));

  return urunler;
}

async function teklifleriGetir(urunId) {
  const onbellekAnahtari = `teklif:${urunId}`;
  const onbellektekiler = sessionStorage.getItem(onbellekAnahtari);

  if (onbellektekiler) {
    return JSON.parse(onbellektekiler);
  }

  const response = await fetch(`/api/offers?id=${encodeURIComponent(urunId)}`);

  if (!response.ok) {
    throw new Error(`Sunucu ${response.status} döndü`);
  }

  const veri = await response.json();
  sessionStorage.setItem(onbellekAnahtari, JSON.stringify(veri));

  return veri;
}
