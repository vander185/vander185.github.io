/* Claire+ : ajouts à l'appli (inséré à la fin de claire.js, dans la même portée).
   - données du serveur avec le code personnel : appels reçus, contacts partagés, état Google / WhatsApp
   - onglet « Appels », contacts partagés avec Claire au téléphone, bouton Réglages
   - numéros belges mieux reconnus (fixes et mobiles), vérification du code personnel */
var cxURL = "https://vmhznuivhwwfphmypsic.supabase.co/functions/v1/claire-plus/web/reglages",
  cxS = Xe.get("srv", { appels: [], contacts: [], google: "", wa: false }),
  cxBusy = !1, cxFaux = !1, cxPause = 0;   // code refusé ou trop d'essais : on arrête d'interroger le serveur

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
    if (r.status === 403) { cxFaux = !0; cxEtat(); return { faux: !0 }; }
    if (r.status === 429) { cxPause = Date.now() + 3600e3; if (j.erreur) St(j.erreur, 4e3); return null; }
    if (!r.ok) { if (j.erreur) St(j.erreur, 4e3); return null; }
    cxFaux = !1;
    cxS = { appels: j.appels || [], contacts: j.contacts || [], google: j.google || "", wa: !!j.wa_key, tg: !!j.tg, tgBot: !!j.tg_bot };
    Xe.set("srv", cxS);
    if (j.msg) St(j.msg, 3e3);
    cxEtat(); cd();
    return j;
  } catch (e) { return null; }
}
function cxRefresh() {
  if (cxBusy || cxFaux || Date.now() < cxPause || document.hidden || !Xe.get("cle", "") || fn) return;
  cxBusy = !0;
  cxSrv("get").finally(function () { cxBusy = !1; });
}

/* petites pastilles d'état sous la date */
/* styles des boutons d'état : injectés par le script, pour rester d'accord avec lui même si la page est encore en cache */
(function () { var st = document.createElement("style"); st.textContent = "#etat{display:flex;align-items:center;flex-wrap:nowrap;gap:8px;margin-top:12px;overflow-x:auto;scrollbar-width:none;padding:2px 0}#etat::-webkit-scrollbar{display:none}#etat,#chips{-webkit-mask-image:linear-gradient(90deg,#000 88%,transparent);mask-image:linear-gradient(90deg,#000 88%,transparent);padding-right:22px}body.locked #reg,body.locked #key,body.locked #wake,body.locked #etat,body.locked #voixbox,body.locked #micbox,body.locked #keybox{visibility:hidden!important;pointer-events:none!important}.ico{flex:none}#etat:empty{display:none}\n.ico{position:relative;display:inline-flex;align-items:center;gap:7px;height:34px;padding:0 12px 0 10px;border-radius:99px;background:var(--card);border:1px solid var(--line);color:#d9e6ff;font:600 12.5px/1 inherit;cursor:pointer;-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);transition:transform .15s,background .2s}\n.ico:active{transform:scale(.95);background:var(--card2)}\n.ico .ic{display:grid;place-items:center;position:relative}\n.ico svg{width:16px;height:16px;color:#9fd4ff}\n.ico small{font:inherit;max-width:90px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}\n.ico .dot{width:7px;height:7px;border-radius:50%;background:#8b96c4;order:3;flex:none}\n.ico.ok .dot{background:#3ddc84;box-shadow:0 0 6px #3ddc8488}\n.ico.set .dot{background:var(--p)}\n.ico.warn{border-color:#ffc78f66;color:#ffe2bd}.ico.warn svg{color:#ffc78f}.ico.warn .dot{background:#ffa53d;animation:cxpulse 1.6s infinite}\n.ico.hot{background:linear-gradient(135deg,#ff4d6d,#ff7a59);border-color:transparent;color:#fff}.ico.hot svg{color:#fff}\n.ico .bd{order:3;min-width:18px;height:18px;padding:0 5px;border-radius:9px;background:#fff;color:#e8364f;font:800 11px/18px inherit;text-align:center}\n.ico.only{width:34px;padding:0;justify-content:center}.ico.only .dot{position:absolute;top:3px;right:3px;width:7px;height:7px;border:1.5px solid #0f1a40}\n.ico .gsep{width:1px;height:18px;background:var(--line)}\n@keyframes cxpulse{50%{box-shadow:0 0 0 4px #ffa53d33}}\n"; document.head.appendChild(st); })();
/* touches de couleur : douces et assorties, pour une appli plus accueillante */
(function () { var st = document.createElement("style"); st.textContent = "#chips button{--c:#7cc4ff;background:linear-gradient(135deg,color-mix(in srgb,var(--c) 16%,transparent),color-mix(in srgb,var(--c) 6%,transparent));border-color:color-mix(in srgb,var(--c) 30%,transparent)}\n#chips button svg{color:var(--c)}\n#chips button:nth-child(1){--c:#ffb84d}#chips button:nth-child(2){--c:#4fd18b}#chips button:nth-child(3){--c:#5aa9ff}#chips button:nth-child(4){--c:#b28cff}#chips button:nth-child(5){--c:#5fd0ff}\n#chips button:nth-child(6){--c:#3fd6c4}#chips button:nth-child(7){--c:#ffd54d}#chips button:nth-child(8){--c:#ff9a5c}#chips button:nth-child(9){--c:#ff7eb6}#chips button:nth-child(10){--c:#4fd18b}\n.ico{--c:#9fd4ff}.ico svg{color:var(--c)!important}.ico.hot svg{color:#fff!important}.ico.warn{--c:#ffc78f}\n.ico:not(.hot):not(.warn){background:linear-gradient(135deg,color-mix(in srgb,var(--c) 18%,transparent),color-mix(in srgb,var(--c) 6%,transparent));border-color:color-mix(in srgb,var(--c) 32%,transparent)}\n.ico[data-ico=google]{--c:#6aa8ff}.ico[data-ico=tg]{--c:#4cc3ff}.ico[data-ico=wa]{--c:#4fd18b}.ico[data-ico=mic]{--c:#b28cff}.ico[data-ico=voix]{--c:#ff8fc7}.ico[data-ico=key]{--c:#ffd54d}\n#reg{background:linear-gradient(135deg,#7cc4ff22,#7cc4ff0a);border-color:#7cc4ff44}#reg svg{color:#9fd4ff}\n#key{background:linear-gradient(135deg,#ffd54d22,#ffd54d0a)}#key svg{color:#ffd76a}\n#cxw button{background:linear-gradient(135deg,#45c8ff,#8a7dff 60%,#c58cff)}\n"; document.head.appendChild(st); })();
var cxSvg = {
  google: '<svg viewBox="0 0 24 24"><text x="12" y="17" text-anchor="middle" font-size="18" font-weight="800" font-family="Arial,sans-serif" fill="currentColor">G</text></svg>',
  tg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M21 4 3 11l6 2 2 6 3-4 5 4z"/><path d="m9 13 8-6"/></svg>',
  wa: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M4 20l1.3-3.9A8 8 0 1 1 8 19z"/></svg>',
  key: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="8" cy="15" r="4"/><path d="m11 12 9-9m-3 3 3 3m-5-1 2 2"/></svg>',
  mic: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>',
  voix: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 10v4M8 7v10M12 4v16M16 8v8M20 11v2"/></svg>',
  urg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/></svg>'
};
/** bouton-icône d'état : vert = OK, orange = à faire, rouge = urgent */
function cxIco(go, ico, nom, etat, info, badge) {
  var seul = go === "info" || go === "micro";   // connexion OK : juste l'icône et un point vert
  return '<button data-go="' + go + '" data-ico="' + ico + '" data-info="' + $n(info || "") + '" class="ico ' + (etat || "") + (seul ? " only" : "") + '" aria-label="' + $n(nom + " : " + (info || "")) + '" title="' + $n(info || nom) + '">' +
    '<span class="ic">' + cxSvg[ico] + "</span>" + (seul ? "" : "<small>" + $n(nom) + "</small>") + (badge ? '<b class="bd">' + badge + "</b>" : etat === "nodot" ? "" : '<i class="dot"></i>') + "</button>";
}
function cxEtat() {
  var el = ne("#etat");
  if (!el) return;
  var code = !!Xe.get("cle", ""), p = [];
  if (!code) p.push(cxIco("key", "key", "Code", "warn", "Touche pour entrer ton code personnel"));
  else if (cxFaux) p.push(cxIco("key", "key", "Code refusé", "warn", "Ton code personnel a été refusé : touche pour le corriger"));
  else {
    p.push(cxS.google ? cxIco("info", "google", "Google", "ok", "Google relié : agenda et e-mails accessibles") : cxIco("reg", "google", "Google", "warn", "Google à relier : touche pour ouvrir les réglages"));
    p.push(cxS.tg ? cxIco("info", "tg", "Telegram", "ok", "Telegram relié : tu reçois tes messages de Claire") : cxS.wa ? cxIco("info", "wa", "WhatsApp", "ok", "WhatsApp relié") : cxS.tgBot ? cxIco("tg", "tg", "Telegram", "warn", "Telegram : envoie ton code à ton robot") : cxIco("reg", "tg", "Messages", "warn", "Messages à relier : touche pour ouvrir les réglages"));
    var n = (cxS.appels || []).filter(function (a) { return a.urgence === "haute"; }).length;
    if (n) p.push(cxIco("appels", "urg", "Urgent", "hot", n + " appel" + (n > 1 ? "s" : "") + " urgent" + (n > 1 ? "s" : ""), n));
  }
  el.innerHTML = p.join("");
}
ne("#etat").addEventListener("click", function (e) {
  var b = e.target.closest("[data-go]");
  if (!b) return;
  if (b.dataset.go === "key") ne("#key").click();
  else if (b.dataset.go === "reg") location.href = "reglages.html";
  else if (b.dataset.go === "tg") St("Dans Telegram, ouvre ton robot Claire et envoie-lui ton code personnel. Ensuite rouvre l'appli.", 7e3);
  else if (b.dataset.go === "info") St(b.dataset.info, 3500);
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
  cxFaux = !1; ne("#keybox").hidden = !0; ne("#key").classList.add("ok"); cxEtat();
  St(r ? "Code vérifié ✓" : "Code enregistré (pas de connexion pour le vérifier)");
};

cxEtat(); cxRefresh();
setInterval(cxRefresh, 120e3);
document.addEventListener("visibilitychange", function () { document.hidden || cxRefresh(); });
