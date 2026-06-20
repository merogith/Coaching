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

  /* Footer year */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
})();
