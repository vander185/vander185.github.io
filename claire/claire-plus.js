/* Claire+ : ajouts à l'appli (inséré à la fin de claire.js, dans la même portée).
   - données du serveur avec le code personnel : appels reçus, contacts partagés, état Google / WhatsApp
   - onglet « Appels », contacts partagés avec Claire au téléphone, bouton Réglages
   - numéros belges mieux reconnus (fixes et mobiles), vérification du code personnel */
var cxURL = "https://vmhznuivhwwfphmypsic.supabase.co/functions/v1/claire-plus/web/reglages",
  cxS = Xe.get("srv", { appels: [], contacts: [], google: "", wa: false }),
  cxBusy = !1;

function cxTel(s) {
  var t = String(s || "").replace(/[^\d+]/g, "");
  if (!t) return "";
  if (t.slice(0, 2) === "00") t = "+" + t.slice(2);
  else if (t[0] === "0") t = "+32" + t.slice(1);
  else if (t[0] !== "+" && t.length >= 10) t = "+" + t;
  return t;
}
function cxTelVu(t) {
  t = cxTel(t);
  return t.indexOf("+32") === 0 ? ("0" + t.slice(3)).replace(/^(0\d{3})(\d{2})(\d{2})(\d{2})$/, "$1 $2 $3 $4") : t;
}

/* appeler / WhatsApp : contacts du téléphone ET contacts partagés avec Claire */
id = function (n) {
  var e = String(n || "").trim();
  if (/^[+\d][\d\s./-]{5,}$/.test(e)) return cxTel(e);
  var q = e.toLowerCase(), all = dt.concat((cxS.contacts || []).map(function (c) { return { nom: c.nom, tel: c.tel }; }));
  var t = all.find(function (i) { return i.nom.toLowerCase() === q; }) || all.find(function (i) { return i.nom.toLowerCase().indexOf(q) >= 0; });
  return t && t.tel ? cxTel(t.tel) : null;
};

async function cxSrv(op, data) {
  var code = Xe.get("cle", "");
  if (!code) return null;
  try {
    var r = await fetch(cxURL, { method: "POST", headers: { "content-type": "application/json", "x-claire-app": code }, body: JSON.stringify(Object.assign({ op: op || "get" }, data || {})) });
    var j = await r.json().catch(function () { return {}; });
    if (r.status === 403) return { faux: !0 };
    if (!r.ok) { if (j.erreur) St(j.erreur, 4e3); return null; }
    cxS = { appels: j.appels || [], contacts: j.contacts || [], google: j.google || "", wa: !!j.wa_key, tg: !!j.tg, tgBot: !!j.tg_bot };
    Xe.set("srv", cxS);
    if (j.msg) St(j.msg, 3e3);
    cxEtat(); cd();
    return j;
  } catch (e) { return null; }
}
function cxRefresh() {
  if (cxBusy || document.hidden || !Xe.get("cle", "") || fn) return;
  cxBusy = !0;
  cxSrv("get").finally(function () { cxBusy = !1; });
}

/* petites pastilles d'état sous la date */
function cxEtat() {
  var el = ne("#etat");
  if (!el) return;
  var code = !!Xe.get("cle", ""), p = [];
  if (!code) p.push('<button data-go="key" class="pill warn">🔑 Entrer mon code</button>');
  else {
    p.push(cxS.google ? '<span class="pill ok">Google relié</span>' : '<button data-go="reg" class="pill warn">Google à relier</button>');
    p.push(cxS.tg ? '<span class="pill ok">Telegram relié</span>' : cxS.wa ? '<span class="pill ok">WhatsApp relié</span>' : cxS.tgBot ? '<button data-go="tg" class="pill warn">Telegram : envoie ton code</button>' : '<button data-go="reg" class="pill warn">Messages à relier</button>');
    var n = (cxS.appels || []).filter(function (a) { return a.urgence === "haute"; }).length;
    if (n) p.push('<button data-go="appels" class="pill hot">🚨 ' + n + " appel" + (n > 1 ? "s" : "") + " urgent" + (n > 1 ? "s" : "") + "</button>");
  }
  el.innerHTML = p.join("");
}
ne("#etat").addEventListener("click", function (e) {
  var b = e.target.closest("[data-go]");
  if (!b) return;
  if (b.dataset.go === "key") ne("#key").click();
  else if (b.dataset.go === "reg") location.href = "reglages.html";
  else if (b.dataset.go === "tg") St("Dans Telegram, ouvre ton robot Claire et envoie-lui ton code personnel. Ensuite rouvre l'appli.", 7e3);
  else { Qn = "appels"; cd(); ne(".panel").scrollIntoView({ behavior: "smooth" }); }
});

function cxAv(nom) {
  var l = String(nom || "?").trim().charAt(0).toUpperCase() || "?";
  return '<i class="av">' + $n(l) + "</i>";
}
var cxCdBase = cd;
cd = function () {
  if (Qn !== "appels" && Qn !== "contacts") return cxCdBase();
  var L = ne("#list"), h = "";
  if (Qn === "appels") {
    var ap = cxS.appels || [];
    if (!Xe.get("cle", "")) h = '<p class="empty">🔑 Entre ton code personnel pour voir les appels pris par Claire.</p>';
    else h = ap.length ? ap.map(function (a) {
      var tel = a.tel ? cxTel(a.tel) : "";
      return '<div class="it rw call' + (a.urgence === "haute" ? " hot" : "") + '">' + cxAv(a.nom) + '<div class="tx"><b>' + (a.urgence === "haute" ? "🚨 " : "") + $n(a.nom || "Inconnu") + "</b>" +
        "<p>" + $n(a.motif || "Sans motif") + "</p>" + (a.message ? '<p class="msgx">« ' + $n(a.message) + " »</p>" : "") + (a.action ? '<p class="todo">✅ ' + $n(a.action) + "</p>" : "") +
        "<em>" + $n(a.quand || "") + (a.tel ? " · " + $n(a.tel) : "") + "</em></div>" +
        (tel ? '<div class="acts"><a class="ab" href="tel:' + $n(tel) + '" aria-label="Rappeler">📞</a><a class="ab" href="https://wa.me/' + $n(tel.replace("+", "")) + '" aria-label="WhatsApp">💬</a></div>' : "") + "</div>";
    }).join("") : '<p class="empty">📞 Aucun appel pour le moment.<br>Quand Claire répondra au téléphone pour toi, tu verras ici qui a appelé et pourquoi.</p>';
  } else {
    var sc = cxS.contacts || [];
    h = '<form id="cf"><input id="cn" placeholder="Nom" autocomplete="off" required><input id="ct" placeholder="Téléphone" inputmode="tel" required><button>Ajouter</button></form>';
    if (Xe.get("cle", "")) h += '<p class="hint">Partagés avec Claire au téléphone. ⭐ = elle te passe directement l’appel.</p>';
    h += sc.map(function (c) {
      return '<div class="it rw">' + cxAv(c.nom) + '<div class="tx"><b>' + (c.vip ? '<span class="vip">⭐</span> ' : "") + $n(c.nom) + "</b><em>" + $n(c.tel || "") + (c.note ? " · " + $n(c.note) : "") + "</em></div>" +
        '<div class="acts"><button class="ab" data-vip="' + $n(c.id) + '" data-v="' + (c.vip ? 0 : 1) + '" aria-label="VIP">' + (c.vip ? "★" : "☆") + '</button><button class="ab" data-sdel="' + $n(c.id) + '" aria-label="Supprimer">×</button></div></div>';
    }).join("");
    h += dt.map(function (i) {
      return '<div class="it rw">' + cxAv(i.nom) + '<div class="tx"><b>' + $n(i.nom) + "</b><em>" + $n(cxTelVu(i.tel)) + ' · sur ce téléphone</em></div><div class="acts"><button class="x" data-k="contacts" data-id="' + i.id + '" aria-label="Supprimer">×</button></div></div>';
    }).join("");
    if (!sc.length && !dt.length) h += '<p class="empty">Ajoute ici les gens que Claire peut appeler, à qui elle peut écrire, et qu’elle reconnaîtra quand ils t’appellent.</p>';
  }
  L.innerHTML = h;
  var f = ne("#cf");
  f && (f.onsubmit = function (e) {
    e.preventDefault();
    var nom = ne("#cn").value.trim(), tel = cxTel(ne("#ct").value);
    if (!nom || tel.length < 8) { St("Numéro invalide"); return; }
    if (Xe.get("cle", "")) cxSrv("add", { nom: nom, tel: tel });
    else { dt.push({ id: As(), nom: nom, tel: tel }); dt.sort(function (s, a) { return s.nom.localeCompare(a.nom, "fr"); }); qi(); }
  });
  document.querySelectorAll(".tabs button").forEach(function (b) { b.classList.toggle("on", b.dataset.t === Qn); });
  ne("#nr").textContent = Tt.filter(function (i) { return !i.fait; }).length || "";
};
ne("#list").addEventListener("click", function (e) {
  var b = e.target.closest("[data-vip],[data-sdel]");
  if (!b) return;
  if (b.dataset.vip) cxSrv("vip", { id: b.dataset.vip, v: b.dataset.v === "1" });
  else if (confirm("Supprimer ce contact pour Claire ?")) cxSrv("del", { id: b.dataset.sdel });
});

/* vibration légère quand on touche le cercle */
ne("#orb").addEventListener("pointerdown", function () { try { navigator.vibrate && navigator.vibrate(12); } catch (e) {} });

/* le code personnel est vérifié auprès du serveur avant d'être gardé */
ne("#keyform").onsubmit = async function (e) {
  e.preventDefault();
  var inp = ne("#keyin"), v = inp.value.toUpperCase().replace(/[^A-Z0-9]/g, ""), old = Xe.get("cle", "");
  if (v.length < 6) { St("Code trop court"); return; }
  Xe.set("cle", v);
  var r = await cxSrv("get");
  if (r && r.faux) { Xe.set("cle", old); St("Code faux, vérifie-le"); inp.select(); return; }
  ne("#keybox").hidden = !0; ne("#key").classList.add("ok"); cxEtat();
  St(r ? "Code vérifié ✓" : "Code enregistré (pas de connexion pour le vérifier)");
};

cxEtat(); cxRefresh();
setInterval(cxRefresh, 120e3);
document.addEventListener("visibilitychange", function () { document.hidden || cxRefresh(); });
