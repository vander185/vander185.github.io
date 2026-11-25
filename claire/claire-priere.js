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
var cxAnnAttente = 0;
function cxModeAnnonce(m) {
  if (!cxAnnonce) return;
  clearTimeout(cxAnnAttente);
  if (m === "speaking") cxAnnT = 1;
  else if (cxAnnT === 1) cxAnnAttente = setTimeout(cxAnnonceFin, 1800);   // elle a fini de parler (petite marge si le son arrive par morceaux) : on raccroche
}
/* briefing du matin dit à voix haute, chaque jour à l'heure choisie dans les réglages */
var cxBriefTxt = "☀️ Briefing du matin";
function cxBriefProg() {
  var A = window.ClaireApp; if (!A || !A.prayer) return;
  var o = {}; try { o = JSON.parse(localStorage.getItem("claire_brief_voix") || "{}") || {}; } catch (e) {}
  (Xe.get("brief_ids", []) || []).forEach(function (id) { try { A.cancelPrayer(id); } catch (e) {} });
  var ids = [];
  if (o.on && Xe.get("cle", "")) {
    var hm = String(o.h || "07:30").split(":").map(Number);
    for (var i = 0; i < 7; i++) {
      var d = new Date(); d.setDate(d.getDate() + i); d.setHours(hm[0] || 7, hm[1] || 0, 0, 0);
      if (d.getTime() < Date.now() + 30000) continue;
      var id = "b" + d.toISOString().slice(0, 10);
      try { A.prayer(id, d.getTime(), cxBriefTxt); ids.push(id); } catch (e) {}
    }
  }
  Xe.set("brief_ids", ids);
}
window.claireAnnonce = async function (t, lock) {
  t = String(t || ""); if (!t) return;
  var brief = t.indexOf("☀") === 0, ic = brief ? "" : "🕌 ";
  if (fe || Bi) { St(ic + t, 8000); return; }   // déjà en conversation : juste un message à l'écran
  Ms(!!lock);
  if (brief) {   // téléphone verrouillé : version courte, sans rien de personnel
    St("☀️ Bonjour Ahmed !", 4000);
    var j = await cxOp("briefing_texte", { court: !!lock });
    t = (j && j.texte) || "Bonjour Ahmed ! Je n'arrive pas à préparer ton briefing pour l'instant. Bonne journée !";
    if (fe || Bi) return;
  }
  cxAnnonce = t; cxAnnT = 0; St(ic + t, brief ? 15000 : 8000); Vi();
  setTimeout(function () { if (cxAnnonce) cxAnnonceFin(); }, brief ? 150000 : 40000);   // sécurité
};
(function () {
  var m = location.search.match(/[?&]annonce=([^&]*)/);
  if (m) { var t = decodeURIComponent(m[1].replace(/\+/g, " ")), l = /[?&]lock=1/.test(location.search); history.replaceState(null, "", location.pathname); setTimeout(function () { window.claireAnnonce(t, l); }, 900); }
})();
setTimeout(cxPrieresProg, 3000); setInterval(cxPrieresProg, 3 * 3600e3);
setTimeout(cxBriefProg, 3500); setInterval(cxBriefProg, 6 * 3600e3);
