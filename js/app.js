// Gasthof Driland – Entwurf. Formulare verschicken nichts.
(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  // Kopf mit Schatten beim Scrollen
  var kopf = $("#kopf");
  var onScroll = function () { kopf.classList.toggle("scrolled", window.scrollY > 8); };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // Ruhiges Einblenden, nur einmal
  var rev = $$(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    rev.forEach(function (el) { io.observe(el); });
  } else {
    rev.forEach(function (el) { el.classList.add("in"); });
  }

  var heute = new Date();
  var iso = function (d) { return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
  $$('input[type=date]').forEach(function (i) { i.min = iso(heute); });
  var datumText = function (v) {
    if (!v) return "";
    var d = new Date(v + "T12:00:00");
    return d.toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long" });
  };

  // ---------- Tisch anfragen ----------
  var tisch = $("#tisch");
  var zeiten = {
    "Frühstück": ["7:00", "7:30", "8:00", "8:30", "9:00", "9:30", "10:00", "10:30"],
    "Mittag": ["12:00", "12:30", "13:00", "13:30"],
    "Kuchen": ["14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30"],
    "Dinner": ["18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00"],
    "Martinsgans": ["18:00", "18:30", "19:00", "19:30", "20:00", "20:30"]
  };
  var zeitSel = $("#t-zeit", tisch);
  var datum = $("#t-datum", tisch);
  var persOut = $("#t-pers", tisch);
  var tipp = $("#t-tipp", tisch);
  var anlass = function () { var c = $('input[name=anlass]:checked', tisch); return c ? c.value : "Dinner"; };
  var fuelleZeiten = function () {
    var alt = zeitSel.value;
    zeitSel.innerHTML = "";
    zeiten[anlass()].forEach(function (z) { var o = document.createElement("option"); o.textContent = z + " Uhr"; o.value = z; zeitSel.appendChild(o); });
    if (zeiten[anlass()].indexOf(alt) > -1) zeitSel.value = alt;
    else if (anlass() === "Dinner" || anlass() === "Martinsgans") zeitSel.value = "19:00";
  };
  var pruefeTipp = function () {
    var t = [];
    if (datum.value) {
      var d = new Date(datum.value + "T12:00:00");
      if (d.getDay() === 2 && anlass() !== "Frühstück") t.push("Dienstags kocht unsere Küche nur für Hotelgäste. Gern finden wir einen anderen Tag für Sie.");
      if (anlass() === "Martinsgans" && datum.value < heute.getFullYear() + "-11-11") t.push("Die Martinsgans gibt es ab dem 11. November.");
    }
    if (anlass() === "Martinsgans" && Number(persOut.value) >= 4) t.push("Schön: Ab 4 Personen wird die Gans am Tisch tranchiert.");
    tipp.textContent = t.join(" ");
    tipp.classList.toggle("zeigen", t.length > 0);
  };
  $$('input[name=anlass]', tisch).forEach(function (r) { r.addEventListener("change", function () { fuelleZeiten(); pruefeTipp(); }); });
  datum.addEventListener("change", pruefeTipp);
  $$(".stepper button", tisch).forEach(function (b) {
    b.addEventListener("click", function () {
      var n = Math.min(40, Math.max(1, Number(persOut.value) + Number(b.dataset.step)));
      persOut.value = n; persOut.textContent = n; pruefeTipp();
    });
  });
  fuelleZeiten();

  // Vorauswahl aus „Aktuell“
  $$("[data-preset-tisch]").forEach(function (a) {
    a.addEventListener("click", function () {
      var r = $('input[name=anlass][value="' + a.dataset.presetTisch + '"]', tisch);
      if (r) { r.checked = true; fuelleZeiten(); }
      if (a.dataset.datum) datum.value = a.dataset.datum;
      else if (a.dataset.presetTisch === "Martinsgans" && !datum.value) datum.value = heute.getFullYear() + "-11-11" < iso(heute) ? "" : heute.getFullYear() + "-11-11";
      pruefeTipp();
    });
  });

  // ---------- Feier oder Tagung ----------
  var feier = $("#anfrage");
  var art = "feier";
  $$(".umschalter button", feier).forEach(function (b) {
    b.addEventListener("click", function () {
      art = b.dataset.art;
      $$(".umschalter button", feier).forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
      $$("[data-teil]", feier).forEach(function (f) { f.classList.toggle("versteckt", f.dataset.teil !== art); });
    });
  });
  $$("[data-preset-feier]").forEach(function (a) {
    a.addEventListener("click", function () {
      $('.umschalter button[data-art="feier"]', feier).click();
      var r = $('input[name="anlass-f"][value="' + a.dataset.presetFeier + '"]', feier);
      if (r) r.checked = true;
    });
  });

  // ---------- Bewerbung in 3 Schritten ----------
  var bew = $('[data-form="bewerbung"]');
  var schritt = 1;
  var zeige = function (n) {
    schritt = n;
    $$(".schritt", bew).forEach(function (s) { s.classList.toggle("aktiv", Number(s.dataset.schritt) === n); });
    $$(".fortschritt i", bew).forEach(function (i, k) { i.classList.toggle("an", k < n); });
  };
  $$("[data-weiter]", bew).forEach(function (b) {
    b.addEventListener("click", function () {
      if (schritt === 1 && !$('input[name=job]:checked', bew)) {
        var w = $(".wahl", bew); w.animate([{ transform: "translateX(0)" }, { transform: "translateX(-5px)" }, { transform: "translateX(5px)" }, { transform: "translateX(0)" }], { duration: 300 });
        return;
      }
      if (schritt === 1 && $('input[name=job]:checked', bew).value === "Ausbildung") $('input[name=ab][value="August 2027"]', bew).checked = true;
      zeige(schritt + 1);
    });
  });
  $$("[data-zurueck]", bew).forEach(function (b) { b.addEventListener("click", function () { zeige(schritt - 1); }); });
  $$("[data-job]").forEach(function (b) {
    b.addEventListener("click", function () {
      var r = $('input[name=job][value="' + b.dataset.job + '"]', bew);
      if (r) r.checked = true;
      zeige(1);
      document.getElementById("bewerbung").scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  // ---------- Absenden (Entwurf) ----------
  var fertig = function (form, text) {
    var box = form.querySelector(".danke");
    form.querySelector(".inhalt").classList.add("versteckt");
    box.querySelector("[data-zusammenfassung]").textContent = text;
    box.classList.add("zeigen");
  };
  tisch.addEventListener("submit", function (e) {
    e.preventDefault();
    var n = Number(persOut.value);
    var txt = anlass() + " für " + n + (n === 1 ? " Person" : " Personen") + (datum.value ? " am " + datumText(datum.value) : "") + " um " + zeitSel.value + " Uhr.";
    fertig(tisch, txt);
  });
  feier.addEventListener("submit", function (e) {
    e.preventDefault();
    var a = art === "feier" ? $('input[name="anlass-f"]:checked', feier).value : $('input[name="anlass-t"]:checked', feier).value;
    var d = $("#f-datum").value;
    fertig(feier, a + ", " + $("#f-pers").value + " Gäste" + (d ? ", " + datumText(d) : "") + ". Wir melden uns mit einem Vorschlag für Raum und Menü.");
  });
  bew.addEventListener("submit", function (e) {
    e.preventDefault();
    var job = $('input[name=job]:checked', bew).value;
    fertig(bew, job + ", ab " + $('input[name=ab]:checked', bew).value + ". Birgit Berning meldet sich bei dir.");
  });
})();
