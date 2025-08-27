(function(){
  const DEFAULT_LANG = 'bn';

  const messages = {
    bn: {
      appName: 'ShobKaaj',

      // Nav
      'nav.jobs': 'কাজ', 'nav.myJobs': 'আমার কাজ', 'nav.workers': 'ওয়ার্কারস',
      'nav.dashboard': 'ড্যাশবোর্ড', 'nav.chat': 'চ্যাট', 'nav.postJob': 'কাজ পোস্ট',
      'nav.profile': 'প্রোফাইল', 'nav.admin': 'অ্যাডমিন', 'nav.login': 'লগইন',
      'nav.register': 'রেজিস্টার', 'nav.logout': 'লগআউট',

      // Hero
      'hero.title': 'ShobKaaj — সবার কাজ, এক প্ল্যাটফর্মে',
      'hero.subtitle': 'লোকাল সার্ভিস, টিউশন, ডেলিভারি, মেরামত, ইভেন্ট সাপোর্ট—সবকিছু এক অ্যাপে।',
      'hero.ctaStart': 'শুরু করুন', 'hero.ctaJobs': 'কাজ দেখুন',

      // Common
      'common.search': 'সার্চ', 'common.back': 'পেছনে যান', 'common.post': 'পোস্ট',
      'common.save': 'সংরক্ষণ', 'common.useMyLocation': 'আমার লোকেশন ব্যবহার করুন',
      'common.loading': 'লোড হচ্ছে...', 'common.noData': 'কিছু পাওয়া যায়নি',
      'common.locationDenied': 'লোকেশন অনুমতি পাওয়া যায়নি',
      'common.openChat': 'চ্যাট খুলুন',

      // Jobs
      'jobs.title': 'কাজের তালিকা', 'jobs.near': 'কাছের কাজ দেখুন', 'jobs.post': 'কাজ পোস্ট করুন',
      'jobs.search.placeholder': 'কীওয়ার্ড লিখুন (যেমন: টিউশন, ডেলিভারি)', 'jobs.radius': 'রেডিয়াস (কিমি)',
      'jobs.noJobs': 'কোনো কাজ নেই',
      'jobs.chatClient': 'ক্লায়েন্টের সাথে চ্যাট', 'jobs.chatWorker': 'চ্যাট (অ্যাসাইনড)',
      'jobs.apply': 'আবেদন করুন', 'jobs.manage': 'ম্যানেজ',
      'jobs.applyNotePrompt': 'আবেদন নোট (ঐচ্ছিক):', 'jobs.appliedSuccess': 'আবেদন সম্পন্ন!',

      // Workers
      'workers.title': 'ওয়ার্কার খুঁজুন',
      'workers.placeholder': 'স্কিল লিখুন (যেমন: plumbing, tuition)',
      'workers.findNear': 'কাছের ওয়ার্কার', 'workers.radius': 'রেডিয়াস',
      'workers.search': 'সার্চ', 'workers.startChat': 'চ্যাট শুরু করুন',
      'workers.noWorkers': 'কোনো ওয়ার্কার পাওয়া যায়নি',

      // Chat
      'chat.conversations': 'কথোপকথন', 'chat.select': 'একটি কথোপকথন নির্বাচন করুন', 'chat.send': 'পাঠান',
      'chat.startNew': 'নতুন চ্যাট শুরু করুন (User ID)', 'chat.enterUserId': 'অন্য ইউজারের আইডি লিখুন',
      'chat.typing': 'টাইপ করা হচ্ছে...',

      // My Jobs
      'myJobs.title': 'আমার কাজ',
      'myJobs.client': 'আমি যে কাজগুলো পোস্ট করেছি',
      'myJobs.worker.assigned': 'আমার অ্যাসাইন করা কাজ',
      'myJobs.worker.applied': 'আমি যে কাজগুলোতে আবেদন করেছি',
      'myJobs.viewApps': 'আবেদনগুলো দেখুন',
      'myJobs.assign': 'অ্যাসাইন',
      'myJobs.openChat': 'চ্যাট খুলুন',
      'myJobs.complete': 'সম্পন্ন করুন',
      'myJobs.noPosted': 'এখনও কোনো কাজ পোস্ট করেননি।',
      'myJobs.noApplications': 'এখনও কোনো আবেদন নেই।',
      'myJobs.assignConfirm': 'এই ওয়ার্কারকে অ্যাসাইন করবেন?',
      'myJobs.assigned': 'অ্যাসাইন করা হয়েছে!',
      'myJobs.completed': 'কাজ সম্পন্ন এবং রেট দেওয়া হয়েছে।',
      'myJobs.reviewPlaceholder': 'সংক্ষিপ্ত রিভিউ লিখুন (ঐচ্ছিক)',

      // Profile
      'profile.updated': 'প্রোফাইল আপডেট হয়েছে',
      'profile.pictureUpdated': 'প্রোফাইল ছবি আপডেট হয়েছে।',
    },
    en: {
      appName: 'ShobKaaj',

      'nav.jobs': 'Jobs', 'nav.myJobs': 'My Jobs', 'nav.workers': 'Workers',
      'nav.dashboard': 'Dashboard', 'nav.chat': 'Chat', 'nav.postJob': 'Post Job',
      'nav.profile': 'Profile', 'nav.admin': 'Admin', 'nav.login': 'Login',
      'nav.register': 'Register', 'nav.logout': 'Logout',

      'hero.title': 'ShobKaaj — Everyone’s work, one platform',
      'hero.subtitle': 'Find local help for tutoring, delivery, repairs, events — in one app.',
      'hero.ctaStart': 'Get Started', 'hero.ctaJobs': 'Browse Jobs',

      'common.search': 'Search', 'common.back': 'Back', 'common.post': 'Post',
      'common.save': 'Save', 'common.useMyLocation': 'Use my location',
      'common.loading': 'Loading...', 'common.noData': 'No data found',
      'common.locationDenied': 'Location permission denied',
      'common.openChat': 'Open Chat',

      'jobs.title': 'Jobs', 'jobs.near': 'Show nearby jobs', 'jobs.post': 'Post Job',
      'jobs.search.placeholder': 'Search keywords (e.g., tuition, delivery)', 'jobs.radius': 'Radius (km)',
      'jobs.noJobs': 'No jobs found',
      'jobs.chatClient': 'Chat with Client', 'jobs.chatWorker': 'Chat (Assigned)',
      'jobs.apply': 'Apply', 'jobs.manage': 'Manage',
      'jobs.applyNotePrompt': 'Application note (optional):', 'jobs.appliedSuccess': 'Applied successfully!',

      'workers.title': 'Find Workers',
      'workers.placeholder': 'Enter skill (e.g., plumbing, tuition)',
      'workers.findNear': 'Nearby workers', 'workers.radius': 'Radius',
      'workers.search': 'Search', 'workers.startChat': 'Start Chat',
      'workers.noWorkers': 'No workers found',

      'chat.conversations': 'Conversations', 'chat.select': 'Select a conversation', 'chat.send': 'Send',
      'chat.startNew': 'Start new chat (User ID)', 'chat.enterUserId': 'Enter other user\'s ID',
      'chat.typing': 'Typing...',

      'myJobs.title': 'My Jobs',
      'myJobs.client': 'Jobs I posted',
      'myJobs.worker.assigned': 'Jobs assigned to me',
      'myJobs.worker.applied': 'Jobs I applied to',
      'myJobs.viewApps': 'View applications',
      'myJobs.assign': 'Assign',
      'myJobs.openChat': 'Open Chat',
      'myJobs.complete': 'Mark Complete',
      'myJobs.noPosted': 'No jobs posted yet.',
      'myJobs.noApplications': 'No applications yet.',
      'myJobs.assignConfirm': 'Assign this worker?',
      'myJobs.assigned': 'Assigned!',
      'myJobs.completed': 'Job completed and worker rated.',
      'myJobs.reviewPlaceholder': 'Write a short review (optional)',

      'profile.updated': 'Profile updated',
      'profile.pictureUpdated': 'Profile picture updated.',
    }
  };

  let lang = null;

  function t(key) {
    return (messages[lang]?.[key] ?? messages.bn?.[key] ?? messages.en?.[key] ?? key);
  }

  function setHtmlLang(code) {
    document.documentElement.setAttribute('lang', code);
  }

  function apply(root = document) {
    root.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      el.textContent = t(key);
    });
    root.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      el.setAttribute('placeholder', t(key));
    });
    root.querySelectorAll('[data-i18n-title]').forEach(el => {
      const key = el.getAttribute('data-i18n-title');
      el.setAttribute('title', t(key));
    });
  }

  function setLang(next, opts = {}) {
    lang = next || DEFAULT_LANG;
    localStorage.setItem('lang', lang);
    setHtmlLang(lang);
    if (!opts.silent) {
      apply(document);
      window.dispatchEvent(new CustomEvent('i18n:change', { detail: { lang } }));
    }
  }

  function init() {
    setLang(localStorage.getItem('lang') || DEFAULT_LANG, { silent: true });
    apply(document);

    // Translate any dynamically inserted nodes with data-i18n*
    const mo = new MutationObserver(muts => {
      for (const m of muts) {
        m.addedNodes && m.addedNodes.forEach(node => {
          if (node.nodeType === 1) apply(node);
        });
      }
    });
    mo.observe(document.documentElement, { childList: true, subtree: true });
  }

  window.i18n = { t, setLang, apply, init, get lang(){ return lang; } };
})();