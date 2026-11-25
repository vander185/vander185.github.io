/* Claire+ : navigation GPS et ouverture d'applis sur le téléphone */
var cxAndroid = !!window.ClaireApp;
var cxAPPS = {
  whatsapp: "com.whatsapp", telegram: "org.telegram.messenger", maps: "com.google.android.apps.maps", "google maps": "com.google.android.apps.maps",
  waze: "com.waze", youtube: "com.google.android.youtube", spotify: "com.spotify.music", gmail: "com.google.android.gm",
  agenda: "com.google.android.calendar", calendrier: "com.google.android.calendar", instagram: "com.instagram.android",
  facebook: "com.facebook.katana", messenger: "com.facebook.orca", snapchat: "com.snapchat.android", tiktok: "com.zhiliaoapp.musically",
  chrome: "com.android.chrome", uber: "com.ubercab", bolt: "ee.mtakso.client", netflix: "com.netflix.mediaclient",
  messages: "com.google.android.apps.messaging", sms: "com.google.android.apps.messaging", "play store": "com.android.vending",
  photos: "com.google.android.apps.photos", galerie: "com.google.android.apps.photos", drive: "com.google.android.apps.docs",
  "deliveroo": "com.deliveroo.orderapp", "uber eats": "com.ubercab.eats", itsme: "be.bmid.itsme", stib: "be.stib.mivb.mobile", sncb: "be.sncbnmbs.b2cmobapp",
  linkedin: "com.linkedin.android", x: "com.twitter.android", twitter: "com.twitter.android", shazam: "com.shazam.android",
  calculatrice: "com.google.android.calculator", fichiers: "com.google.android.apps.nbu.files", contacts: "com.google.android.contacts", "téléphone": "com.google.android.dialer"
};
var cxACTIONS = {
  "appareil photo": "android.media.action.STILL_IMAGE_CAMERA", camera: "android.media.action.STILL_IMAGE_CAMERA", "caméra": "android.media.action.STILL_IMAGE_CAMERA", photo: "android.media.action.STILL_IMAGE_CAMERA",
  "réglages": "android.settings.SETTINGS", parametres: "android.settings.SETTINGS", "paramètres": "android.settings.SETTINGS",
  horloge: "android.intent.action.SHOW_ALARMS", alarmes: "android.intent.action.SHOW_ALARMS", "réveil": "android.intent.action.SHOW_ALARMS",
  wifi: "android.settings.WIFI_SETTINGS", bluetooth: "android.settings.BLUETOOTH_SETTINGS"
};
function cxSans(s) { return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/^(l'|la |le |les |mon |ma |mes |appli |application )+/g, "").trim(); }
function cxLieux() { return Xe.get("lieux", {}) || {}; }
var cxLieuAlias = { domicile: "maison", "chez moi": "maison", home: "maison", bureau: "travail", boulot: "travail", taf: "travail" };
function cxCle(d) {
  var k = cxSans(d), av;
  if (cxLieuAlias[k]) return cxLieuAlias[k];
  do { av = k; k = k.replace(/^((a|au|aux|vers|jusqu'a|chez|la|le|les|mon|ma|mes)\s+|l')/, "").trim(); if (cxLieuAlias[k]) return cxLieuAlias[k]; } while (k !== av);
  return k;
}
tk.enregistrer_lieu = function (p) {
  if (Np()) return "Erreur : téléphone verrouillé, je n'enregistre pas d'adresse. Déverrouille d'abord.";
  var n = cxCle(p.nom), a = String(p.adresse || "").trim();
  if (!n || a.length < 4) return "Erreur : il me faut le nom du lieu et une adresse complète.";
  var l = cxLieux(); l[n] = a; Xe.set("lieux", l); St("📍 " + n + " : " + a);
  return "C'est enregistré : « " + n + " » = " + a + ". Ahmed peut maintenant dire « emmène-moi à " + n + " ».";
};
tk.itineraire = function (p) {
  var d = String(p.destination || "").trim(), k = cxCle(d);
  var l = cxLieux(), adr = l[k];
  if (adr && Np()) return "Erreur : téléphone verrouillé, je ne montre pas le chemin vers un lieu enregistré. Déverrouille d'abord.";
  if (!adr && /^(maison|travail)$/.test(k)) return "Erreur : je ne connais pas encore l'adresse de « " + k + " ». Demande-la à Ahmed, puis enregistre-la avec enregistrer_lieu." + (Object.keys(l).length ? " Lieux connus : " + Object.keys(l).join(", ") + "." : "");
  var but = adr || d; if (!but) return "Erreur : destination manquante.";
  var m = { pied: "w", velo: "b", voiture: "d" }[p.mode || "voiture"], q = encodeURIComponent(but), url;
  if (p.appli === "waze" || p.appli === "maps") Xe.set("gps", p.appli);
  var gps = Xe.get("gps", "maps");
  if (p.mode === "transport") url = "https://www.google.com/maps/dir/?api=1&travelmode=transit&destination=" + q;
  else if (gps === "waze" && (!p.mode || p.mode === "voiture")) url = "https://waze.com/ul?navigate=yes&q=" + q;
  else url = cxAndroid ? "google.navigation:q=" + q + "&mode=" + m : "https://www.google.com/maps/dir/?api=1&dir_action=navigate&travelmode=" + ({ w: "walking", b: "bicycling", d: "driving" }[m]) + "&destination=" + q;
  setTimeout(function () { td(url); }, 700);
  St("🧭 " + (adr ? k : but));
  return "La navigation s'ouvre vers " + (adr ? k + " (" + adr + ")" : but) + ". Dis-le en une phrase courte, puis laisse Ahmed conduire.";
};
tk.ouvrir_app = function (p) {
  var n = cxSans(p.nom), r = String(p.recherche || "").trim(), url = "";
  if (r && n === "youtube") url = "https://www.youtube.com/results?search_query=" + encodeURIComponent(r);
  else if (r && n === "spotify") url = "spotify:search:" + encodeURIComponent(r);
  else if (r && /maps/.test(n)) url = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(r);
  else if (cxACTIONS[n]) url = "intent:#Intent;action=" + cxACTIONS[n] + ";end";
  else {
    var pk = cxAPPS[n]; if (!pk) for (var x in cxAPPS) if (n.indexOf(x) >= 0 || x.indexOf(n) >= 0) { pk = cxAPPS[x]; break; }
    if (!pk) return "Erreur : je ne connais pas l'appli « " + p.nom + " ». Applis connues : WhatsApp, Telegram, Maps, Waze, YouTube, Spotify, Gmail, Agenda, Instagram, Facebook, Snapchat, TikTok, Chrome, Uber, Bolt, Netflix, Messages, Photos, Appareil photo, Horloge, Réglages.";
    url = "intent:#Intent;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;package=" + pk + ";end";
  }
  if (!cxAndroid && url.indexOf("intent:") === 0) return "Erreur : ouvrir une appli ne marche que dans l'appli Claire installée sur Android.";
  setTimeout(function () { td(url); }, 600);
  St("📱 " + p.nom);
  return "J'ouvre " + p.nom + (r ? " (recherche : " + r + ")" : "") + ". Si rien ne s'ouvre, l'appli n'est sans doute pas installée.";
};
