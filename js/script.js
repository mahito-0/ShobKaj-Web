 // script.js — shared interactivity, theme & language handling, nav, form validation

// Local storage keys
const STORAGE = { theme: "theme", lang: "lang" };
const DEFAULT_LANG = "bn";

// Helper: current language
function currentLang() {
  return localStorage.getItem(STORAGE.lang) || DEFAULT_LANG;
}

// Translations dictionary
const t = {
  bn: {
    global: {
      brand: "Nova",
      tagline: "মিনিমাল, রেসপনসিভ মাল্টিপেজ স্টার্টার",
      nav: { home: "হোম", about: "সম্পর্কে", services: "সার্ভিসেস", projects: "প্রজেক্টস", contact: "যোগাযোগ" },
      footerText: "সর্বস্বত্ব সংরক্ষিত।",
      builtWith: "HTML, CSS ও JavaScript দিয়ে তৈরি।",
      socialLabel: "সোশ্যাল লিঙ্ক",
      skipToContent: "মূল কনটেন্টে যান",
      backToTop: "শীর্ষে ফিরুন",
      menu: { open: "মেনু খুলুন", close: "মেনু বন্ধ করুন" },
      themeToggle: { lightAria: "লাইট থিমে যান", darkAria: "ডার্ক থিমে যান" },
      langToggle: { toEn: "ইংরেজিতে দেখুন", toBn: "বাংলায় দেখুন" },
    },
    home: {
      headTitle: "হোম | Nova",
      hero: {
        title: "স্বাগতম — আপনার আধুনিক ওয়েবসাইট এখানে।",
        subtitle: "পরিষ্কার UI, ডার্ক/লাইট থিম, বাংলা/English টগল—সব একসাথে।",
        cta: "সার্ভিস দেখুন",
      },
      features: { title: "কেন Nova?", f1: "রেসপনসিভ ডিজাইন", f2: "স্মুথ অ্যানিমেশন", f3: "পারফরম্যান্স-ফার্স্ট" },
      featuresDesc: {
        f1: "ডিভাইস জুড়ে অটো-ফিট গ্রিড লেআউট।",
        f2: "হোভার ও থিম ট্রানজিশন অন্তর্ভুক্ত।",
        f3: "মিনিমাল অ্যাসেট ও স্মার্ট ইন্টারঅ্যাকশন।",
      },
      projectsPreview: { title: "নির্বাচিত প্রজেক্ট", viewAll: "সব দেখুন" },
    },
    about: {
      headTitle: "সম্পর্কে | Nova",
      title: "আমাদের সম্পর্কে",
      body:
        "Nova একটি মিনিমাল মাল্টিপেজ স্টার্টার—পরিষ্কার কোড, রেসপনসিভ লেআউট, থিম ও ভাষা টগলসহ। আপনি চাইলে সহজেই নিজের কনটেন্ট ও ব্র্যান্ডিং বসাতে পারবেন।",
    },
    services: {
      headTitle: "সার্ভিসেস | Nova",
      title: "আমাদের সার্ভিস",
      subtitle: "আপনার ব্যবসার প্রয়োজন অনুযায়ী কাস্টম সমাধান",
      cards: {
        web: { title: "ওয়েব ডেভেলপমেন্ট", desc: "দ্রুত, নিরাপদ ও এসইও-বন্ধু ওয়েবসাইট।" },
        ui: { title: "UI/UX ডিজাইন", desc: "সহজবোধ্য ইন্টারফেস ও অ্যাক্সেসিবিলিটি।" },
        perf: { title: "পারফরম্যান্স", desc: "লেজি-লোডিং, অপ্টিমাইজেশন ও বেস্ট প্র্যাকটিস।" },
        seo: { title: "SEO & অ্যানালিটিক্স", desc: "স্কিমা, ওপেনগ্রাফ, মেজারমেন্ট সেটআপ।" },
      },
    },
    projects: {
      headTitle: "প্রজেক্টস | Nova",
      title: "আমাদের কাজ",
      subtitle: "কিছু নমুনা প্রজেক্ট",
      more: "বিশদ",
      cards: {
        alpha: { title: "প্রজেক্ট আলফা", desc: "ল্যান্ডিং পেজ · রেসপনসিভ" },
        beta: { title: "ড্যাশবোর্ড বেটা", desc: "অ্যানালিটিক্স · ডার্ক মোড" },
        gamma: { title: "পোর্টফোলিও গামা", desc: "গ্রিড গ্যালারি · অ্যাক্সেসিবিলিটি" },
        delta: { title: "কমার্স ডেল্টা", desc: "শপ · পারফরম্যান্স" },
        epsilon: { title: "ডকস এপসিলন", desc: "কনটেন্ট · i18n" },
        zeta: { title: "অ্যাপ জিটা", desc: "PWA · অফলাইন" },
      },
    },
    contact: {
      headTitle: "যোগাযোগ | Nova",
      title: "যোগাযোগ করুন",
      subtitle: "মেসেজ দিন—আমরা শীঘ্রই উত্তর দেব।",
      form: {
        name: "নাম",
        email: "ইমেইল",
        phone: "ফোন (ঐচ্ছিক)",
        message: "বার্তা",
        submit: "বার্তা পাঠান",
        success: "ধন্যবাদ! আপনার বার্তা পাঠানো হয়েছে (ডেমো)।",
        errors: {
          name: "অনুগ্রহ করে নাম লিখুন।",
          email: "সঠিক ইমেইল দিন।",
          message: "অনুগ্রহ করে বার্তা লিখুন।",
        },
      },
      info: { heading: "যোগাযোগের তথ্য", emailLabel: "ইমেইল", phoneLabel: "ফোন" },
      map: "ম্যাপ প্লেসহোল্ডার",
    },
  },
  en: {
    global: {
      brand: "Nova",
      tagline: "Minimal, responsive multipage starter",
      nav: { home: "Home", about: "About", services: "Services", projects: "Projects", contact: "Contact" },
      footerText: "All rights reserved.",
      builtWith: "Built with HTML, CSS & JavaScript.",
      socialLabel: "Social links",
      skipToContent: "Skip to main content",
      backToTop: "Back to top",
      menu: { open: "Open menu", close: "Close menu" },
      themeToggle: { lightAria: "Switch to light theme", darkAria: "Switch to dark theme" },
      langToggle: { toEn: "View in English", toBn: "View in Bangla" },
    },
    home: {
      headTitle: "Home | Nova",
      hero: {
        title: "Welcome — build a modern website.",
        subtitle: "Clean UI with dark/light theme and Bangla/English toggle—built-in.",
        cta: "Explore Services",
      },
      features: { title: "Why Nova?", f1: "Responsive layouts", f2: "Smooth animations", f3: "Performance-first" },
      featuresDesc: {
        f1: "Auto-fit grid layouts across devices.",
        f2: "Hover and theme transitions included.",
        f3: "Minimal assets and smart interactivity.",
      },
      projectsPreview: { title: "Featured Projects", viewAll: "View all" },
    },
    about: {
      headTitle: "About | Nova",
      title: "About the project",
      body:
        "Nova is a minimal multipage starter with clean code, responsive layout, theming and i18n. Swap in your own content and brand with ease.",
    },
    services: {
      headTitle: "Services | Nova",
      title: "Our Services",
      subtitle: "Custom solutions for your business",
      cards: {
        web: { title: "Web Development", desc: "Fast, secure and SEO-friendly websites." },
        ui: { title: "UI/UX Design", desc: "Intuitive interfaces with accessibility." },
        perf: { title: "Performance", desc: "Lazy-loading, optimization and best practices." },
        seo: { title: "SEO & Analytics", desc: "Schema, OpenGraph and measurement setup." },
      },
    },
    projects: {
      headTitle: "Projects | Nova",
      title: "Our Work",
      subtitle: "A few sample projects",
      more: "Details",
      cards: {
        alpha: { title: "Project Alpha", desc: "Landing page · Responsive" },
        beta: { title: "Dashboard Beta", desc: "Analytics · Dark Mode" },
        gamma: { title: "Portfolio Gamma", desc: "Grid Gallery · Accessibility" },
        delta: { title: "Commerce Delta", desc: "Shop · Performance" },
        epsilon: { title: "Docs Epsilon", desc: "Content · i18n" },
        zeta: { title: "App Zeta", desc: "PWA · Offline" },
      },
    },
    contact: {
      headTitle: "Contact | Nova",
      title: "Get in touch",
      subtitle: "Send a message—we'll reply shortly.",
      form: {
        name: "Name",
        email: "Email",
        phone: "Phone (optional)",
        message: "Message",
        submit: "Send Message",
        success: "Thanks! Your message has been sent (demo).",
        errors: { name: "Please enter your name.", email: "Please provide a valid email.", message: "Please enter a message." },
      },
      info: { heading: "Contact Info", emailLabel: "Email", phoneLabel: "Phone" },
      map: "Map placeholder",
    },
  },
};

// Utility: deep getter using dot path
function getT(lang, key) {
  return key.split(".").reduce((acc, k) => (acc && acc[k] != null ? acc[k] : undefined), t[lang]);
}

function updateThemeToggleLabel() {
  const btn = document.getElementById("themeToggle");
  if (!btn) return;
  const isDark = document.documentElement.getAttribute("data-theme") === "dark";
  const label = getT(currentLang(), isDark ? "global.themeToggle.lightAria" : "global.themeToggle.darkAria");
  btn.setAttribute("aria-label", label);
  btn.setAttribute("title", label);
}

function updateNavToggleAriaState() {
  const navToggle = document.getElementById("navToggle");
  if (!navToggle) return;
  const expanded = navToggle.getAttribute("aria-expanded") === "true";
  const label = getT(currentLang(), expanded ? "global.menu.close" : "global.menu.open");
  navToggle.setAttribute("aria-label", label);
}

function updateLangToggle(lang) {
  const btn = document.getElementById("langToggle");
  if (!btn) return;
  btn.textContent = lang === "bn" ? "BN" : "EN";
  const label = lang === "bn" ? getT(lang, "global.langToggle.toEn") : getT(lang, "global.langToggle.toBn");
  btn.setAttribute("title", label);
  btn.setAttribute("aria-label", label);
}

function applyTranslations(lang) {
  const root = document.documentElement;
  root.lang = lang === "bn" ? "bn" : "en";

  // Update document title if available in page section
  const page = document.body.getAttribute("data-page");
  const headTitle = getT(lang, `${page}.headTitle`);
  if (headTitle) document.title = headTitle;

  // Elements with data-i18n => textContent
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    const val = getT(lang, key);
    if (typeof val === "string") el.textContent = val;
  });

  // Placeholder translations
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.getAttribute("data-i18n-placeholder");
    const val = getT(lang, key);
    if (typeof val === "string") el.setAttribute("placeholder", val);
  });

  // ARIA label translations
  document.querySelectorAll("[data-i18n-aria-label]").forEach((el) => {
    const key = el.getAttribute("data-i18n-aria-label");
    const val = getT(lang, key);
    if (typeof val === "string") el.setAttribute("aria-label", val);
  });

  updateLangToggle(lang);
  updateThemeToggleLabel();
  updateNavToggleAriaState();
}

function setLanguage(lang) {
  const next = lang === "bn" ? "bn" : "en";
  localStorage.setItem(STORAGE.lang, next);
  applyTranslations(next);
}

function initLanguage() {
  const saved = localStorage.getItem(STORAGE.lang);
  const initial = saved || DEFAULT_LANG;
  applyTranslations(initial);

  const langToggle = document.getElementById("langToggle");
  if (langToggle) {
    langToggle.addEventListener("click", () => {
      const current = localStorage.getItem(STORAGE.lang) || DEFAULT_LANG;
      setLanguage(current === "bn" ? "en" : "bn");
    });
  }
}

function setTheme(theme) {
  const root = document.documentElement;
  const next = theme === "dark" ? "dark" : "light";
  root.setAttribute("data-theme", next);
  localStorage.setItem(STORAGE.theme, next);
  updateThemeToggleLabel();
}

function initTheme() {
  const saved = localStorage.getItem(STORAGE.theme);
  const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  setTheme(saved || (prefersDark ? "dark" : "light"));

  const themeToggle = document.getElementById("themeToggle");
  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const current = document.documentElement.getAttribute("data-theme");
      setTheme(current === "dark" ? "light" : "dark");
    });
  }
}

function initNav() {
  const navToggle = document.getElementById("navToggle");
  const siteNav = document.getElementById("siteNav");
  if (navToggle && siteNav) {
    navToggle.addEventListener("click", () => {
      const expanded = navToggle.getAttribute("aria-expanded") === "true";
      navToggle.setAttribute("aria-expanded", String(!expanded));
      document.body.classList.toggle("nav-open", !expanded);
      updateNavToggleAriaState();
    });

    // Close on link click (mobile)
    siteNav.addEventListener("click", (e) => {
      const target = e.target;
      if (target.tagName === "A") {
        document.body.classList.remove("nav-open");
        navToggle.setAttribute("aria-expanded", "false");
        updateNavToggleAriaState();
      }
    });
  }

  // Active link based on current path
  const path = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  document.querySelectorAll(".nav-links a").forEach((a) => {
    const href = (a.getAttribute("href") || "").toLowerCase();
    if (href === path || (path === "" && href.endsWith("index.html"))) {
      a.classList.add("active");
      a.setAttribute("aria-current", "page");
    }
  });
}

function initSmoothAnchors() {
  document.addEventListener("click", (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute("href");
    if (id === "#") return; // allow top
    const el = document.querySelector(id);
    if (el) {
      e.preventDefault();
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
}

function setYear() {
  const y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();
}

// Contact form validation
function initContactForm() {
  const form = document.getElementById("contactForm");
  if (!form) return;

  const status = document.getElementById("formStatus");

  function err(key) {
    return getT(currentLang(), `contact.form.errors.${key}`) || "Invalid";
  }

  function showError(name, message) {
    const el = form.querySelector(`[data-error-for="${name}"]`);
    if (el) el.textContent = message || "";
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const message = form.message.value.trim();

    let ok = true;

    // Reset previous errors
    ["name", "email", "phone", "message"].forEach((k) => showError(k, ""));

    if (!name) {
      showError("name", err("name"));
      ok = false;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showError("email", err("email"));
      ok = false;
    }
    if (!message) {
      showError("message", err("message"));
      ok = false;
    }

    if (!ok) return;

    // Demo success (no backend)
    if (status) {
      status.textContent = getT(currentLang(), "contact.form.success");
    }
    form.reset();
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  initLanguage();
  initNav();
  initSmoothAnchors();
  setYear();
  initContactForm();
});
