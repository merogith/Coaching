/* ============================================================
   Meriç Erler — Financial Coaching · interactions
   No dependencies. Progressive enhancement only.
   ============================================================ */
(function () {
  "use strict";
  var root = document.documentElement;
  var isTR = (root.lang || "").toLowerCase().indexOf("tr") === 0;

  /* Theme: saved choice, else system preference (shares the key with the portfolio) */
  var saved;
  try { saved = localStorage.getItem("theme"); } catch (_error) { /* use system preference */ }
  if (saved !== "light" && saved !== "dark") saved = null;
  var prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  root.setAttribute("data-theme", saved || (prefersDark ? "dark" : "light"));

  var toggle = document.getElementById("themeToggle");
  if (toggle) {
    var updateThemeLabel = function () {
      var dark = root.getAttribute("data-theme") === "dark";
      toggle.setAttribute("aria-pressed", String(dark));
      toggle.setAttribute("aria-label", isTR
        ? (dark ? "Açık temaya geç" : "Koyu temaya geç")
        : (dark ? "Switch to light theme" : "Switch to dark theme"));
    };
    updateThemeLabel();
    toggle.addEventListener("click", function () {
      var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      try { localStorage.setItem("theme", next); } catch (_error) { /* keep this page usable */ }
      updateThemeLabel();
    });
    toggle.hidden = false;
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
    root.classList.add("menu-ready");
    var setMenuLabel = function (open) {
      burger.setAttribute("aria-label", isTR
        ? (open ? "Menüyü kapat" : "Menüyü aç")
        : (open ? "Close menu" : "Open menu"));
    };
    var closeMenu = function () {
      links.classList.remove("is-open");
      burger.setAttribute("aria-expanded", "false");
      setMenuLabel(false);
    };
    burger.addEventListener("click", function () {
      var open = links.classList.toggle("is-open");
      burger.setAttribute("aria-expanded", String(open));
      setMenuLabel(open);
    });
    links.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        var target = document.querySelector(a.getAttribute("href"));
        closeMenu();
        if (target) {
          target.setAttribute("tabindex", "-1");
          target.focus({ preventScroll: true });
        }
      });
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
  // Content stays visible until this enhancement is ready to animate it.
  root.classList.add("reveal-ready");
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
    var msg = {
      ok: isTR
        ? "İsteğin Formspree tarafından kabul edildi. Bir zaman belirlemek için e-postayla yanıt bekleyebilirsin. Henüz kesinleşmiş bir randevun yok."
        : "Your request was accepted by Formspree. Look out for an email reply to agree a time. Your appointment is not scheduled yet.",
      err: isTR
        ? "İsteğin gönderildiğini doğrulayamadık. Bilgilerin burada duruyor; yeniden deneyebilir veya aşağıdaki e-posta bağlantısını kullanabilirsin."
        : "We couldn’t confirm that your request was sent. Your details are still here; try again or use the email link below.",
      pending: isTR ? "İsteğin gönderiliyor…" : "Sending your request…",
      again: isTR ? "Yeni bir istek yaz" : "Write another request"
    };
    var sending = false;
    var status = document.createElement("p");
    status.className = "form-note form-status";
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");
    status.setAttribute("tabindex", "-1");
    form.appendChild(status);
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (sending || !form.reportValidity()) return;
      sending = true;
      var btn = form.querySelector('button[type="submit"]');
      var label = btn ? btn.textContent : "";
      form.setAttribute("aria-busy", "true");
      status.classList.remove("form-error");
      status.textContent = msg.pending;
      if (btn) { btn.disabled = true; btn.textContent = isTR ? "Gönderiliyor…" : "Sending…"; }
      var controller = window.AbortController ? new AbortController() : null;
      var timeout;
      var expiry = new Promise(function (_resolve, reject) {
        timeout = setTimeout(function () {
          if (controller) controller.abort();
          reject(new Error("request timeout"));
        }, 15000);
      });
      var request = fetch(form.action, {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" },
        signal: controller ? controller.signal : undefined
      });
      Promise.race([request, expiry])
        .then(function (res) {
          if (!res.ok) throw new Error("bad status");
          form.querySelector(".book__grid").hidden = true;
          if (btn) btn.hidden = true;
          status.textContent = msg.ok;
          var again = document.createElement("button");
          again.type = "button";
          again.className = "btn btn--ghost";
          again.textContent = msg.again;
          again.addEventListener("click", function () {
            form.reset();
            form.querySelector(".book__grid").hidden = false;
            if (btn) btn.hidden = false;
            status.textContent = "";
            again.remove();
            document.getElementById("cname").focus();
          });
          form.appendChild(again);
          status.focus();
        })
        .catch(function () {
          status.classList.add("form-error");
          status.textContent = msg.err;
          status.focus();
        })
        .finally(function () {
          clearTimeout(timeout);
          sending = false;
          form.removeAttribute("aria-busy");
          if (btn) { btn.disabled = false; btn.textContent = label; }
        });
    });
  }

  /* Footer year */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
})();
