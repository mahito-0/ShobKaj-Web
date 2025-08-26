(function(){
  const messages = {
    bn: {
      appName: 'ShobKaaj',
      'nav.jobs': 'কাজ', 'nav.myJobs': 'আমার কাজ', 'nav.workers': 'ওয়ার্কারস',
      'nav.dashboard': 'ড্যাশবোর্ড', 'nav.chat': 'চ্যাট', 'nav.postJob': 'কাজ পোস্ট',
      'nav.profile': 'প্রোফাইল', 'nav.admin': 'অ্যাডমিন', 'nav.login': 'লগইন',
      'nav.register': 'রেজিস্টার', 'nav.logout': 'লগআউট',
      'hero.title': 'ShobKaaj — সবার কাজ, এক প্ল্যাটফর্মে',
      'hero.subtitle': 'লোকাল সার্ভিস, টিউশন, ডেলিভারি, মেরামত, ইভেন্ট সাপোর্ট—সবকিছু এক অ্যাপে।',
      'hero.ctaStart': 'শুরু করুন', 'hero.ctaJobs': 'কাজ দেখুন',
      'jobs.title': 'কাজের তালিকা', 'jobs.near': 'কাছের কাজ দেখুন', 'jobs.post': 'কাজ পোস্ট করুন',
      'jobs.search.placeholder': 'কীওয়ার্ড লিখুন (যেমন: টিউশন, ডেলিভারি)', 'jobs.radius': 'রেডিয়াস (কিমি)',
      'chat.conversations': 'কথোপকথন', 'chat.select': 'একটি কথোপকথন নির্বাচন করুন', 'chat.send': 'পাঠান',
      'workers.title': 'ওয়ার্কার খুঁজুন', 'workers.placeholder': 'স্কিল লিখুন (যেমন: plumbing, tuition)',
      'workers.findNear': 'কাছের ওয়ার্কার', 'workers.radius': 'রেডিয়াস', 'workers.search': 'সার্চ', 'workers.startChat': 'চ্যাট শুরু করুন',
      'myJobs.title': 'আমার কাজ', 'myJobs.client': 'আমি যে কাজগুলো পোস্ট করেছি',
      'myJobs.worker.assigned': 'আমার অ্যাসাইন করা কাজ', 'myJobs.worker.applied': 'আমি যে কাজগুলোতে আবেদন করেছি',
      'myJobs.viewApps': 'আবেদনগুলো দেখুন', 'myJobs.assign': 'অ্যাসাইন',
      'myJobs.openChat': 'চ্যাট খুলুন', 'myJobs.complete': 'সম্পন্ন করুন', 'myJobs.rateWorker': 'ওয়ার্কার রেট দিন'
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
      'jobs.title': 'Jobs', 'jobs.near': 'Show nearby jobs', 'jobs.post': 'Post Job',
      'jobs.search.placeholder': 'Search keywords (e.g., tuition, delivery)', 'jobs.radius': 'Radius (km)',
      'chat.conversations': 'Conversations', 'chat.select': 'Select a conversation', 'chat.send': 'Send',
      'workers.title': 'Find Workers', 'workers.placeholder': 'Enter skill (e.g., plumbing, tuition)',
      'workers.findNear': 'Nearby workers', 'workers.radius': 'Radius', 'workers.search': 'Search', 'workers.startChat': 'Start Chat',
      'myJobs.title': 'My Jobs', 'myJobs.client': 'Jobs I posted', 'myJobs.worker.assigned': 'Jobs assigned to me',
      'myJobs.worker.applied': 'Jobs I applied to', 'myJobs.viewApps': 'View applications', 'myJobs.assign': 'Assign',
      'myJobs.openChat': 'Open Chat', 'myJobs.complete': 'Mark Complete', 'myJobs.rateWorker': 'Rate Worker'
    }
  };
  let lang = localStorage.getItem('lang') || 'bn';
  function t(key) { return messages[lang]?.[key] ?? messages['en']?.[key] ?? key; }
  function setLang(next) { lang = next; localStorage.setItem('lang', lang); apply(); }
  function apply(root=document) {
    root.querySelectorAll('[data-i18n]').forEach(el=>{
      const key = el.getAttribute('data-i18n');
      el.textContent = t(key);
    });
    root.querySelectorAll('[data-i18n-placeholder]').forEach(el=>{
      const key = el.getAttribute('data-i18n-placeholder');
      el.setAttribute('placeholder', t(key));
    });
  }
  window.i18n = { t, setLang, apply, get lang(){ return lang; } };
})();