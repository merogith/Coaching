/* ============================================================
   Meriç Erler — Financial Coaching · interactions
   No dependencies. Progressive enhancement only.
   ============================================================ */
(function () {
  "use strict";
  var root = document.documentElement;

  /* Theme: saved choice, else system preference (shares the key with the portfolio) */
  var saved = localStorage.getItem("theme");
  var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  root.setAttribute("data-theme", saved || (prefersDark ? "dark" : "light"));

  var toggle = document.getElementById("themeToggle");
  if (toggle) {
    toggle.addEventListener("click", function () {
      var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      localStorage.setItem("theme", next);
    });
  }

  /* Sticky nav shadow */
  var nav = document.getElementById("nav");
  var onScroll = function () { if (nav) nav.classList.toggle("is-scrolled", window.scrollY > 8); };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* Mobile menu */
  var burger = document.getElementById("navBurger");
  var links = document.querySelector(".nav__links");
  if (burger && links) {
    var closeMenu = function () {
      links.classList.remove("is-open");
      burger.setAttribute("aria-expanded", "false");
    };
    burger.addEventListener("click", function () {
      var open = links.classList.toggle("is-open");
      burger.setAttribute("aria-expanded", String(open));
    });
    links.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", closeMenu);
    });
    /* Close on Escape, and on a click/tap outside the menu */
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && links.classList.contains("is-open")) {
        closeMenu();
        burger.focus();
      }
    });
    document.addEventListener("click", function (e) {
      if (links.classList.contains("is-open") &&
          !links.contains(e.target) && !burger.contains(e.target)) {
        closeMenu();
      }
    });
  }

  /* Reveal on scroll */
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add("is-visible"); io.unobserve(entry.target); }
      });
    }, { threshold: 0.1, rootMargin: "0px 0px -40px 0px" });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* Scroll-spy: highlight the nav link for the section in view */
  var spyLinks = Array.prototype.slice.call(document.querySelectorAll('.nav__links a[href^="#"]'));
  var spyMap = new Map();
  spyLinks.forEach(function (a) {
    var id = a.getAttribute("href").slice(1);
    var sec = id && document.getElementById(id);
    if (sec) spyMap.set(sec, a);
  });
  if (spyMap.size && "IntersectionObserver" in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        spyLinks.forEach(function (l) { l.classList.remove("is-active"); l.removeAttribute("aria-current"); });
        var link = spyMap.get(entry.target);
        if (link) { link.classList.add("is-active"); link.setAttribute("aria-current", "true"); }
      });
    }, { rootMargin: "-45% 0px -50% 0px", threshold: 0 });
    spyMap.forEach(function (_l, sec) { spy.observe(sec); });
  }

  /* Booking form: submit via fetch so people stay on the page.
     Falls back to a normal POST if JS or fetch is unavailable. */
  var form = document.querySelector("form.book");
  if (form && window.fetch) {
    var isTR = (document.documentElement.lang || "").toLowerCase().indexOf("tr") === 0;
    var msg = {
      ok: isTR
        ? "Teşekkürler — mesajın bana ulaştı. En kısa sürede bir zaman önerisiyle döneceğim."
        : "Thank you — your message reached me. I'll reply soon with a time that works.",
      err: isTR
        ? "Bir şeyler ters gitti. Lütfen doğrudan mericerler@gmail.com adresine yaz."
        : "Something went wrong. Please email me directly at mericerler@gmail.com."
    };
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var btn = form.querySelector('button[type="submit"]');
      var label = btn ? btn.textContent : "";
      if (btn) { btn.disabled = true; btn.textContent = isTR ? "Gönderiliyor…" : "Sending…"; }
      fetch(form.action, {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" }
      })
        .then(function (res) {
          if (!res.ok) throw new Error("bad status");
          var note = document.createElement("p");
          note.className = "form-note";
          note.setAttribute("role", "status");
          note.style.color = "var(--accent)";
          note.style.fontWeight = "600";
          note.textContent = msg.ok;
          form.replaceWith(note);
        })
        .catch(function () {
          if (btn) { btn.disabled = false; btn.textContent = label; }
          var err = form.querySelector(".form-error") || document.createElement("p");
          err.className = "form-note form-error";
          err.setAttribute("role", "alert");
          err.style.color = "var(--warm)";
          err.textContent = msg.err;
          form.appendChild(err);
        });
    });
  }

  /* Footer year */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
})();
