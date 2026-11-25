/* Claire+ : annonce vocale avant la prière (programmée sur le téléphone, dite avec la voix choisie) */
var cxAnnonce = null, cxAnnT = 0;
var cxNomPriere = { Fajr: "le Sobh", Dhuhr: "le Dohr", Asr: "l'Asr", Maghrib: "le Maghrib", Isha: "l'Icha" };
async function cxPrieresProg() {
  var A = window.ClaireApp, code = Xe.get("cle", "");
  if (!A || !A.prayer || !code) return;
  try {
    var r = await fetch(cxURL, { method: "POST", headers: { "content-type": "application/json", "x-claire-app": code }, body: JSON.stringify({ op: "prieres" }) });
    if (!r.ok) return;
    var j = await r.json(), ids = [];
    (Xe.get("prieres_ids", []) || []).forEach(function (id) { try { A.cancelPrayer(id); } catch (e) {} });
    if (j.actif && j.voix) (j.jours || []).forEach(function (d) {
      var p = d.date.split("-").map(Number);
      Object.keys(d.t || {}).forEach(function (k) {
        var hm = String(d.t[k]).split(":").map(Number); if (hm.length < 2 || isNaN(hm[0])) return;
        var heure = new Date(p[0], p[1] - 1, p[2], hm[0], hm[1]).getTime(), when = heure - (j.avant || 0) * 60000;
        if (when < Date.now() + 30000) return;
        var nom = cxNomPriere[k] || k, h = hm[0] + " h " + (hm[1] < 10 ? "0" : "") + hm[1];
        var txt = j.avant > 0 ? "Ahmed, " + nom + " est dans " + j.avant + " minutes, à " + h + ". Prépare-toi pour la prière." : "Ahmed, c'est l'heure de la prière : " + nom + ".";
        var id = "p" + d.date + k;
        try { A.prayer(id, when, txt); ids.push(id); } catch (e) {}
      });
    });
    Xe.set("prieres_ids", ids);
  } catch (e) {}
}
function cxAnnonceFin() {
  if (!cxAnnonce && !cxAnnT) return;
  cxAnnonce = null; cxAnnT = 0;
  setTimeout(function () { rk(); setTimeout(function () { try { window.ClaireApp && window.ClaireApp.done(); } catch (e) {} }, 600); }, 400);
}
function cxModeAnnonce(m) {
  if (!cxAnnonce) return;
  if (m === "speaking") cxAnnT = 1;
  else if (cxAnnT === 1) cxAnnonceFin();   // elle a fini de parler : on raccroche
}
window.claireAnnonce = function (t, lock) {
  t = String(t || ""); if (!t) return;
  if (fe || Bi) { St("🕌 " + t, 8000); return; }   // déjà en conversation : juste un message à l'écran
  Ms(!!lock); cxAnnonce = t; cxAnnT = 0; St("🕌 " + t, 8000); Vi();
  setTimeout(function () { if (cxAnnonce) cxAnnonceFin(); }, 40000);   // sécurité
};
(function () {
  var m = location.search.match(/[?&]annonce=([^&]*)/);
  if (m) { var t = decodeURIComponent(m[1].replace(/\+/g, " ")), l = /[?&]lock=1/.test(location.search); history.replaceState(null, "", location.pathname); setTimeout(function () { window.claireAnnonce(t, l); }, 900); }
})();
setTimeout(cxPrieresProg, 3000); setInterval(cxPrieresProg, 3 * 3600e3);
