/* Écrire à Claire */
var cxT=!1;
(function(){
  var f=document.getElementById("cxw"),i=document.getElementById("cxi");
  if(!f||!i)return;
  function envoyer(q){
    q=(q||"").trim(); if(!q)return;
    i.value=""; i.style.height="";
    if(fe){try{fe.sendUserMessage(q);rd("user",q)}catch(e){St("Message non envoyé")}return}
    if(Bi){St("Patiente une seconde…");i.value=q;return}
    cxT=!0; Is=q; Vi();
  }
  f.onsubmit=function(e){e.preventDefault();envoyer(i.value)};
  i.addEventListener("keydown",function(e){if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();envoyer(i.value)}});
  i.addEventListener("input",function(){i.style.height="";i.style.height=Math.min(i.scrollHeight,96)+"px";try{fe&&fe.sendUserActivity&&fe.sendUserActivity()}catch(e){}});
})();
