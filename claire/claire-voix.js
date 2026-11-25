/* Claire+ : choix de la voix (femme / homme) et du prénom de l'assistant */
var cxVoix = [
  { id: "NEjemlRxgWmL5ZGJetsB", p: "Claire", t: "Femme · la voix actuelle", ex: "" },
  { id: "gP52hjM48hyNoVCbizxO", p: "Sam", t: "Homme · calme et chaleureux", ex: "https://api.us.elevenlabs.io/v1/voices/gP52hjM48hyNoVCbizxO/previews/audio?payload=eyJ2b2ljZV9zb3VyY2UiOiJjdXN0b20iLCJ3b3Jrc3BhY2VfaWQiOiIwNThhYWI1NDc5M2Q0ZjZhYWJhNjk4OGE0NTUyMWZlZiIsImZpbGVuYW1lIjoiSDBjcFpyREtFOFpmTzZ5aDRURUoubXAzIiwidGltZXN0YW1wIjoxNzk1NTg2NDAwMDAwMDAwfQ%3D%3D" },
  { id: "n24Kl6ZWrQlkVB6peOGu", p: "Adam", t: "Homme · posé, très clair", ex: "https://storage.googleapis.com/eleven-public-prod/database/workspace/6a24b9bc4e85481e9466766e22e01a91/voices/n24Kl6ZWrQlkVB6peOGu/8j1hzrELTvMAOMDlo7cZ.mp3" },
  { id: "sCxRkJWiniGABTB4AaNW", p: "Noah", t: "Homme · jeune et dynamique", ex: "https://storage.googleapis.com/eleven-public-prod/database/workspace/7752c5ee4c8a432a9a69a798d359eba0/voices/sCxRkJWiniGABTB4AaNW/90b937a0-bd0e-418b-a09b-081c82b3c4f5.mp3" }
];
var cxVx = Math.max(0, Math.min(cxVoix.length - 1, Xe.get("voix", 0))), cxAudio = null;
function cxVoixCur() {
  var v = cxVoix[cxVx], n = String(Xe.get("prenom_" + cxVx, "") || "").trim().slice(0, 20);
  return { id: v.id, p: cxVx === 0 ? "Claire" : (n || v.p) };
}
var cxEtatV = cxEtat;
cxEtat = function () {
  cxEtatV();
  var el = ne("#etat");
  if (el) el.insertAdjacentHTML("beforeend", cxIco("voix", "voix", cxVoixCur().p, "ok", "Voix : " + cxVoixCur().p));
};
ne("#etat").addEventListener("click", function (e) {
  var b = e.target.closest('[data-go="voix"]');
  if (b) { e.stopPropagation(); cxVoixOuvrir(); }
}, !0);
function cxEcoute(i, btn) {
  try { cxAudio && cxAudio.pause(); } catch (e) {}
  document.querySelectorAll(".vxplay").forEach(function (x) { x.textContent = "▶"; });
  if (!cxVoix[i].ex) return;
  if (cxAudio && cxAudio.cxI === i && !cxAudio.cxFin) { cxAudio = null; return; }
  cxAudio = new Audio(cxVoix[i].ex); cxAudio.cxI = i; btn.textContent = "⏸";
  cxAudio.onended = function () { cxAudio.cxFin = !0; btn.textContent = "▶"; };
  cxAudio.play().catch(function () { btn.textContent = "▶"; St("Extrait indisponible pour cette voix"); });
}
function cxVoixDessin() {
  var l = ne("#vxl"); l.innerHTML = "";
  cxVoix.forEach(function (v, i) {
    var d = document.createElement("div"); d.className = "vx" + (i === cxVx ? " on" : "");
    var nom = i === 0 ? "Claire" : (String(Xe.get("prenom_" + i, "") || "").trim() || v.p);
    d.innerHTML = '<span class="vxr"></span><span class="vxt"><b></b><small></small></span>' + (v.ex ? '<button type="button" class="vxplay" aria-label="Écouter">▶</button>' : "");
    d.querySelector("b").textContent = nom; d.querySelector("small").textContent = v.t;
    d.onclick = function (e) {
      if (e.target.classList.contains("vxplay")) { e.stopPropagation(); cxEcoute(i, e.target); return; }
      cxVx = i; Xe.set("voix", i); cxVoixDessin(); cxEtat();
    };
    l.appendChild(d);
  });
  var pn = ne("#vxn"), w = ne("#vxnw");
  w.hidden = cxVx === 0;
  pn.value = cxVx === 0 ? "" : cxVoixCur().p;
}
function cxVoixOuvrir() { ne("#voixbox").hidden = !1; cxVoixDessin(); }
function cxVoixFermer() {
  try { cxAudio && cxAudio.pause(); } catch (e) {}
  ne("#voixbox").hidden = !0; cxEtat();
  var c = cxVoixCur(); if (Xe.get("voix_srv", "") !== c.id + "|" + c.p) cxSrv("voix", { voix_id: c.id, prenom: c.p }).then(function (r) { r && !r.faux && Xe.set("voix_srv", c.id + "|" + c.p); });   // même voix au téléphone et sur Telegram
  St("Voix : " + cxVoixCur().p + (fe ? " (à la prochaine conversation)" : ""));
}
ne("#vxn").addEventListener("input", function () {
  var n = this.value.replace(/[^\p{L} '\-]/gu, "").slice(0, 20); if (n !== this.value) this.value = n;
  Xe.set("prenom_" + cxVx, n.trim()); var b = ne("#vxl .vx.on b"); b && (b.textContent = n.trim() || cxVoix[cxVx].p);
});
ne("#vxok").onclick = cxVoixFermer;
ne("#voixbox").addEventListener("click", function (e) { e.target === this && cxVoixFermer(); });
cxEtat();
