/* Claire+ : sensibilité du micro (inséré à la fin de claire.js, dans la même portée).
   Le son du micro passe par un amplificateur réglable avant d'être envoyé à Claire :
   moins sensible = Claire entend moins les bruits autour ; plus sensible = elle t'entend même si tu parles bas.
   Au réglage « Normal », le micro n'est pas touché du tout. */
var cxMicNiv = [
    { n: "Très faible", g: 0.4, d: "Pour les endroits très bruyants : parle près du téléphone." },
    { n: "Faible", g: 0.65, d: "Ignore mieux les bruits autour de toi." },
    { n: "Normal", g: 1, d: "Le réglage conseillé." },
    { n: "Forte", g: 1.7, d: "Si Claire t'entend mal ou si tu parles doucement." },
    { n: "Très forte", g: 2.8, d: "Si tu es loin du téléphone (voiture, pièce calme)." }
  ],
  cxMic = Math.max(0, Math.min(4, Xe.get("micro", 2))),
  cxGains = [];

/* on intercepte la demande de micro pour y brancher l'amplificateur */
(function () {
  var md = navigator.mediaDevices;
  if (!md || !md.getUserMedia || md.cxPatched) return;
  var brut = md.getUserMedia.bind(md);
  md.cxPatched = !0;
  md.getUserMedia = async function (c) {
    var s = await brut(c);
    if (!c || !c.audio || cxMicNiv[cxMic].g === 1 || !s.getAudioTracks().length) return s;
    try {
      var AC = window.AudioContext || window.webkitAudioContext, ctx = new AC();
      if (ctx.state === "suspended") ctx.resume().catch(function () {});
      var src = ctx.createMediaStreamSource(s), g = ctx.createGain(), comp = ctx.createDynamicsCompressor(), dst = ctx.createMediaStreamDestination();
      g.gain.value = cxMicNiv[cxMic].g;
      comp.threshold.value = -6; comp.knee.value = 6; comp.ratio.value = 12; comp.attack.value = 0.003; comp.release.value = 0.15;   // évite la saturation
      src.connect(g); g.connect(comp); comp.connect(dst);
      cxGains.push(g);
      var t = dst.stream.getAudioTracks()[0], stopT = t.stop.bind(t);
      t.stop = function () {
        stopT();
        s.getTracks().forEach(function (x) { x.stop(); });
        cxGains = cxGains.filter(function (x) { return x !== g; });
        ctx.close().catch(function () {});
      };
      s.getVideoTracks().forEach(function (v) { dst.stream.addTrack(v); });
      return dst.stream;
    } catch (e) { return s; }
  };
})();

function cxMicSet(i) {
  cxMic = i; Xe.set("micro", i);
  cxGains.forEach(function (g) { try { g.gain.value = cxMicNiv[i].g; } catch (e) {} });   // change aussi pendant une conversation
  cxEtat();
}

/* pastille « Micro » sous la date */
var cxEtatBase = cxEtat;
cxEtat = function () {
  cxEtatBase();
  var el = ne("#etat");
  if (el) el.insertAdjacentHTML("beforeend", cxIco("micro", "mic", "Micro", cxMic === 2 ? "ok" : "set", "Sensibilité : " + cxMicNiv[cxMic].n));
};
ne("#etat").addEventListener("click", function (e) {
  var b = e.target.closest('[data-go="micro"]');
  if (b) { e.stopPropagation(); cxMicOuvrir(); }
}, !0);

/* fenêtre de réglage avec jauge en direct */
var cxMeter = null;
function cxMicOuvrir() {
  var box = ne("#micbox");
  box.hidden = !1;
  cxMicDessin();
  cxMeterStart();
}
function cxMicFermer() { ne("#micbox").hidden = !0; cxMeterStop(); }
function cxMicDessin() {
  ne("#micr").value = cxMic;
  ne("#micn").textContent = cxMicNiv[cxMic].n;
  ne("#micd").textContent = cxMicNiv[cxMic].d;
}
async function cxMeterStart() {
  cxMeterStop();
  try {
    var s = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: !0, noiseSuppression: !0, autoGainControl: !0 } });
    var AC = window.AudioContext || window.webkitAudioContext, ctx = new AC(), src = ctx.createMediaStreamSource(s), an = ctx.createAnalyser();
    an.fftSize = 512; src.connect(an);
    var buf = new Float32Array(an.fftSize), bar = ne("#micbar"), on = !0;
    cxMeter = { stop: function () { on = !1; s.getTracks().forEach(function (t) { t.stop(); }); ctx.close().catch(function () {}); } };
    (function boucle() {
      if (!on) return;
      an.getFloatTimeDomainData(buf);
      var m = 0; for (var i = 0; i < buf.length; i++) m = Math.max(m, Math.abs(buf[i]));
      var v = Math.min(1, m * 2.2);   // la jauge écoute déjà à travers l'amplificateur
      bar.style.width = (v * 100).toFixed(0) + "%";
      bar.className = v > 0.85 ? "fort" : v > 0.12 ? "ok" : "";
      requestAnimationFrame(boucle);
    })();
  } catch (e) { ne("#micd").textContent = "Autorise le micro pour voir le niveau."; }
}
function cxMeterStop() { if (cxMeter) { cxMeter.stop(); cxMeter = null; } var b = ne("#micbar"); b && (b.style.width = "0"); }
ne("#micr").addEventListener("input", function () { cxMicSet(+this.value); cxMicDessin(); });
ne("#micr").addEventListener("change", function () { cxMeterStart(); });   // la jauge reprend avec le nouveau réglage
ne("#micok").onclick = function () { cxMicFermer(); St("Micro : " + cxMicNiv[cxMic].n); };
ne("#micbox").addEventListener("click", function (e) { e.target === this && cxMicFermer(); });
document.addEventListener("visibilitychange", function () { document.hidden && cxMicFermer(); });
cxEtat();
