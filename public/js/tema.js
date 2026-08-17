const TEMALAR = [
  { id: "aydinlik", ad: "Aydınlık" },
  { id: "karanlik", ad: "Karanlık" },
  { id: "cyberpunk", ad: "Cyberpunk" },
  { id: "sicak", ad: "Sıcak" },
  { id: "pastel", ad: "Pastel" },
];

const temaSecici = document.getElementById("temaSecici");

function temayiUygula(temaId) {
  document.documentElement.dataset.tema = temaId;
  localStorage.setItem("tema", temaId);

  temaSecici.querySelectorAll("button").forEach((dugme) => {
    dugme.setAttribute("aria-pressed", dugme.dataset.tema === temaId);
  });
}

function temaSeciciyiKur() {
  temaSecici.innerHTML = TEMALAR.map((tema) => {
    return `<button class="tema-dugme" data-tema="${tema.id}" aria-pressed="false">${tema.ad}</button>`;
  }).join("");

  temaSecici.addEventListener("click", (olay) => {
    const dugme = olay.target.closest("button");
    if (dugme) temayiUygula(dugme.dataset.tema);
  });

  temayiUygula(localStorage.getItem("tema") || "aydinlik");
}

temaSeciciyiKur();
