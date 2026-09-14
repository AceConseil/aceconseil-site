/* Page appels-offres : chaque schéma (.ao) s'anime quand il entre dans l'écran,
   et se remet en place quand il en sort, pour rejouer au retour.
   Sans JavaScript ou en mouvement réduit, la classe ao-js n'est jamais posée :
   les schémas restent dans leur état final, complet et lisible. */
(function(){
  "use strict";
  if(window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)){ return; }
  document.documentElement.classList.add("ao-js");
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(e){ e.target.classList.toggle("ao-joue", e.isIntersecting); });
  }, { threshold: 0.2 });
  document.querySelectorAll(".ao").forEach(function(el){ io.observe(el); });
})();
