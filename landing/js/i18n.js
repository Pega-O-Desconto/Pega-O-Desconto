// Pega O Desconto — idioma (PT padrão / EN)
// Português vive no HTML; o dicionário abaixo só guarda o inglês.
(function () {
  const STORE_KEY = 'pod-lang';
  const SUPPORTED = ['pt', 'en'];

  const EN = {
    // chrome compartilhado
    'brand': 'Get The Discount',
    'skip': 'Skip to content',
    'lang.label': 'Language',
    'nav.label': 'Main navigation',
    'nav.aria.open': 'Open menu',
    'nav.aria.close': 'Close menu',
    'nav.features': 'Features',
    'nav.points': 'Points',
    'nav.how': 'How it works',
    'nav.stores': 'Stores',
    'nav.faq': 'FAQ',
    'nav.deals': 'Deals',
    'nav.privacy': 'Privacy',
    'nav.cta': 'Add to Chrome',

    // index
    'meta.title': 'Get The Discount — coupons, deals and the best price while you shop',
    'meta.desc': 'The Get The Discount extension finds coupons, cashback and the best price in one click. Free for Chrome — and you earn PegaPoints for staying installed.',
    'og.title': 'Get The Discount — coupons and the best price while you shop',
    'og.desc': 'Coupons, deals, cashback and price history in one click. Earn 100 PegaPoints when you install and keep earning every day. Free for Chrome.',

    'hero.title': 'Get The <span class="violet">Discount</span>',
    'hero.kicker': 'Free Chrome extension',
    'hero.lead': 'Coupons, deals, cashback and the best price — one click away, while you shop at your favorite stores.',
    'hero.cta': 'Add to Chrome',
    'hero.cta2': 'See how it works',
    'hero.note': 'No sign-up to use coupons · Earn 100 PegaPoints on install · Works at major stores in Brazil and abroad',
    'hero.idx.1': 'Features',
    'hero.idx.2': 'PegaPoints',
    'hero.idx.3': 'How it works',
    'hero.idx.4': 'Stores',
    'hero.foot.1': 'Scroll to discover',
    'hero.foot.2': 'Coupons · Price · Cashback',

    'features.kicker': '01 — Features',
    'features.title': 'Everything to pay less, effortlessly',
    'features.lead': 'The extension works in the background and lets you know when there is a way to save on the page you are on.',
    'features.link': 'See how it works <span aria-hidden="true">&#8599;</span>',
    'f1.t': 'Tested coupons',
    'f1.d': "We find and apply valid discount coupons at the store you are on, so you don't have to search.",
    'f2.t': 'Price history',
    'f2.d': "See whether the current price is really a good deal compared to the product's price history.",
    'f3.t': 'Price drop alerts',
    'f3.d': 'Get a heads-up when the price of a product you follow drops.',
    'f4.t': 'Cashback',
    'f4.d': 'At participating stores, part of your purchase comes back to you.',
    'f5.t': 'Free shipping and deals',
    'f5.d': 'We highlight free-shipping promotions, deal of the day and categories with the best prices.',
    'f6.t': 'International shopping',
    'f6.d': 'We also track prices and deals at international stores such as AliExpress.',

    'points.kicker': '02 — PegaPoints',
    'points.title': 'Earn points just by sticking around',
    'points.lead': 'Installing is already worth 100 points. For every day the extension stays installed your balance grows, and the streak increases the daily bonus.',
    'p1.t': '+100 on install',
    'p1.d': 'One-time bonus for adding the extension.',
    'p2.t': '+10 per day',
    'p2.d': 'Daily presence, no need to open the popup.',
    'p3.t': '+2 extra per consecutive day',
    'p3.d': 'Up to +14 daily bonus from the streak.',
    'p4.t': '+50 to +2,500 at milestones',
    'p4.d': 'On completing 7, 30, 90, 180 and 365 days.',
    'points.note': 'PegaPoints are symbolic, stored only in your browser and cannot be exchanged for money.',
    'dash.label': 'Balance example: 628 PegaPoints, Gold level, 24-day streak',
    'dash.balance': 'PegaPoints balance',
    'dash.level': 'Gold level',
    'dash.next': '13% to Diamond level',
    'dash.streak': 'day streak',
    'dash.install': 'install bonus',

    'how.kicker': '03 — How it works',
    'mock.label': 'Illustration of the extension popup showing coupons found',
    'mock.tag': '3 coupons',
    'coupon1.t': 'Discount coupon',
    'coupon1.d': 'Valid sitewide',
    'coupon2.t': 'First purchase',
    'coupon2.d': 'Applied at checkout',
    'coupon3.t': 'Free shipping',
    'coupon3.d': 'Orders over R$ 199',
    'mock.foot': 'Product illustration · coupons vary by store',
    'how.title': 'Three steps and the extension starts saving for you.',
    'how.lead': 'No sign-up, no spreadsheets and no hunting for coupon codes. The extension does the work while you shop.',
    's1.t': 'Install the extension',
    's1.d': 'Add Get The Discount to Chrome from the Chrome Web Store. It takes seconds.',
    's2.t': 'Open the store and click the icon',
    's2.d': 'Go to your favorite store and find the product. Click the Get The Discount icon so it can recognize the page.',
    's3.t': 'Save',
    's3.d': 'See coupons, price history and alerts in the popup, then apply the best offer at checkout.',

    'scene.kicker': 'Between the storefront and the cart',
    'scene.word': 'Pay less.',
    'scene.caption': 'Coupons · Price history · Cashback',
    'scene.rail': 'Brazil · 2026',

    'stores.kicker': '04 — Stores',
    'stores.title': 'Where you save',
    'stores.lead': 'We cover the main categories and stores in Brazil and abroad. A few examples of what you will find:',
    'chip.fashion': 'Fashion',
    'chip.laptops': 'Laptops',
    'chip.phones': 'Phones',
    'chip.tvs': 'TVs',
    'chip.cashback': 'Cashback',
    'chip.free': 'Free shipping',
    'chip.intl': 'International',
    'chip.under': 'Under R$ 100',
    'chip.daily': 'Deal of the day',
    'chip.coupons': 'Coupons',

    'faq.kicker': '05 — FAQ',
    'faq.title': 'Frequently asked questions',
    'faq.q1': 'Is the extension free?',
    'faq.a1': 'Yes. Installing and using Get The Discount to find coupons and track prices is free.',
    'faq.q2': 'What are PegaPoints?',
    'faq.a2': 'It is a symbolic score for using the extension: you start with 100 on install, earn points every day and get bonuses for streaks and loyalty milestones. The balance is stored only in your browser and cannot be exchanged for money.',
    'faq.q3': 'Do I need an account?',
    'faq.a3': 'No, not to use coupons and see prices. Some features, such as personalized alerts and cashback, may require an account to work best.',
    'faq.q4': 'Which stores does it work with?',
    'faq.a4': 'At major stores in Brazil and selected international stores such as AliExpress. The list of participating stores is inside the extension.',
    'faq.q5': 'Is my data sold?',
    'faq.a5': 'No. We use data only to run the discount and price features. See the details in our <a href="privacidade.html">Privacy Policy</a>.',
    'faq.q6': 'How do I remove the extension?',
    'faq.a6': 'In chrome://extensions, find Get The Discount and click Remove. You can also disable it at any time.',

    'cta.kicker': 'Start now',
    'cta.title': 'Ready to pay less?',
    'cta.body': 'Install Get The Discount and let the extension find coupons and the best price for you. You also earn 100 PegaPoints on install and keep earning every day.',
    'cta.btn': "Add to Chrome — it's free",

    'footer.about': 'Coupons, deals, cashback and the best price while you shop — right in your browser.',
    'footer.browse': 'Browse',
    'footer.company': 'Company',
    'footer.home': 'Home',
    'footer.deals': 'Game Deals',
    'footer.privacy': 'Privacy',
    'footer.terms': 'Terms',
    'footer.made': 'Made in Brazil.',
    'footer.trademarks': 'All trademarks and stores mentioned belong to their respective owners.',

    // ofertas.html
    'feed.meta.title': 'Game Deals — Get The Discount',
    'feed.meta.desc': 'Shortcuts to the deals pages of the main game stores: Nuuvem, Fanatical, Green Man Gaming, GamersGate, Eneba, Amazon and Cuponomia.',
    'feed.kicker': 'Deals feed',
    'feed.title': 'Game Deals',
    'feed.lead': 'Shortcuts to the deals pages of the main game stores. Pick a store to see the promotions of the moment.',
    'feed.kicker.alt': 'Feed de ofertas',
    'feed.search.ph': 'Search store (e.g. Nuuvem, Eneba)',
    'feed.search.aria': 'Search store',
    'feed.filters.aria': 'Filter by category',
    'feed.loading': 'Loading deals…',
    'feed.empty': 'No stores found for this search.',
    'feed.store.fallback': 'Store',
    'feed.deal.fallback': 'Deal',
    'feed.cta.store': 'See deals →',
    'feed.cta.deal': 'See deal →',
    'feed.all': 'All',
    'feed.foot': "Links lead to the stores' official deals pages.",
    'feed.updated': ' · Updated on ',
    'feed.price.from': 'Was R$ ',
    'feed.price.to': 'now R$ ',
    'footer.word.brand': 'GET THE DISCOUNT',
    'footer.word.deals': 'DEALS',
    'footer.word.terms': 'TERMS',
    'footer.word.privacy': 'PRIVACY',

    // privacidade.html
    'priv.meta.title': 'Privacy Policy — Get The Discount',
    'priv.meta.desc': 'How the Get The Discount extension collects, uses and protects your data.',
    'priv.kicker': 'Institutional',
    'priv.title': 'Privacy Policy',
    'priv.updated': 'Last updated: November 13, 2026 · Applies to the Get The Discount extension (v1.1) and this website.',
    'priv.intro1': 'This policy explains what data the <strong>Get The Discount</strong> extension ("we") collects, why it collects it and how you can exercise your rights. The extension is developed by the <strong>X-OS</strong> initiative. By installing and using the extension, you agree to the practices described here.',
    'priv.summary': 'Summary: we use data only to run the coupon, price, alert and cashback features. <strong>We do not sell your data</strong> and we do not use third-party advertising trackers.',
    'priv.h1': '1. Data we collect',
    'priv.th.cat': 'Category',
    'priv.th.ex': 'Examples',
    'priv.th.pur': 'Purpose',
    'priv.r1c1': 'Shopping activity at stores',
    'priv.r1c2': 'Store page address (URL/hostname), product and displayed price',
    'priv.r1c3': 'Find coupons, show price history and generate drop alerts',
    'priv.r2c1': 'Account data (optional)',
    'priv.r2c2': 'Email and phone number, when you create an account or log in',
    'priv.r2c3': 'Personalized alerts, cashback and preference sync',
    'priv.r3c1': 'Identifiers and usage',
    'priv.r3c2': 'Installation/extension identifier and usage events (analytics)',
    'priv.r3c3': 'Measure and improve the service; diagnose errors',
    'priv.r4c1': 'Tabs and store content',
    'priv.r4c2': 'URL of the tabs you visit ("tabs" permission), processed locally; page content only after you click the extension icon ("activeTab" permission)',
    'priv.r4c3': 'Recognize participating stores and offer the right deal',
    'priv.p1': 'The extension does not request broad access to all websites. Page content is read only after you click the extension icon on the tab, and only at recognized stores. <strong>We do not collect</strong> passwords, payment card data or the content of pages that are not shopping pages.',
    'priv.p2': 'In the <strong>Game Deals</strong> feature, the extension loads a public list of stores (<code>/deals.json</code> at <code>pegaodesconto.x-os.org</code>) and opens the official deals pages only when you click. Search and filters are processed locally, and this feature does not collect additional data or send your preferences.',
    'priv.p3': 'The <strong>PegaPoints</strong> is a symbolic score calculated and stored only in your browser (<code>chrome.storage.local</code>). The balance, streak and transaction history are not sent to our servers and are erased when you remove the extension. Points cannot be exchanged for money.',
    'priv.h2': '2. How we use data',
    'priv.li1': 'Provide the contracted features: coupons, price comparison and history, alerts and cashback.',
    'priv.li2': 'Improve deal accuracy and extension stability.',
    'priv.li3': 'Comply with legal obligations and prevent abuse.',
    'priv.p4': 'Legal bases (LGPD): performance of a contract and preliminary procedures; legitimate interest in improving and securing the service; and consent when you opt into features that require an account.',
    'priv.h3': '3. Who we share with',
    'priv.p5': 'Get The Discount is an X-OS initiative. To operate the service, data is processed on the service infrastructure and by technology partners that operate the coupon, price, alert and cashback features.',
    'priv.li4': '<code>poupeai.com</code> (cashback/deals partner, when you use that feature)',
    'priv.p6': 'We do not sell or rent your data. We do not share it with advertising networks. We may disclose data if required by law.',
    'priv.h4': '4. Storage and retention',
    'priv.p7': 'Preferences and cache stay in the browser local storage and are removed when you uninstall the extension. Account data and server history are kept while your account is active or for as long as necessary for the purposes above; you can request deletion at any time.',
    'priv.h5': '5. Security',
    'priv.p8': 'Communications with our servers use HTTPS. We adopt technical and organizational measures to protect data against unauthorized access.',
    'priv.h6': '6. Your rights (LGPD)',
    'priv.p9': 'You can request: confirmation and access to data; correction; anonymization, blocking or deletion; portability; information about sharing; and withdrawal of consent. To exercise them, use the channel below.',
    'priv.h7': '7. Children',
    'priv.p10': 'The service is not directed at children under 13 and we do not intentionally collect their data.',
    'priv.h8': '8. Changes',
    'priv.p11': 'We may update this policy. The date at the top indicates the current version; relevant changes will be communicated in the extension or on this website.',
    'priv.h9': '9. Contact / Data Protection Officer (DPO)',
    'priv.p12': 'Questions or privacy requests: <a href="mailto:dev@x-os.org">dev@x-os.org</a>.',
    'priv.h10': '10. Controller',
    'priv.p13': '<strong>The Jony Peixoto</strong><br />Address: Internet<br />Email: <a href="mailto:dev@x-os.org">dev@x-os.org</a>',
    'priv.back': '← Back to home',

    // termos.html
    'terms.meta.title': 'Terms of Use — Get The Discount',
    'terms.meta.desc': 'Rules for using the Get The Discount extension, third-party coupons, PegaPoints and operator contact.',
    'terms.kicker': 'Institutional',
    'terms.title': 'Terms of Use',
    'terms.updated': 'Last updated: November 13, 2026 · Applies to the Get The Discount extension (v1.1) and this website.',
    'terms.intro': 'These terms govern the use of the <strong>GET THE DISCOUNT</strong> extension and this website, offered by the <strong>X-OS</strong> initiative. By installing or using the service, you agree to the conditions below.',
    'terms.h1': '1. Acceptance',
    'terms.p1': 'By installing or using the Get The Discount extension, you agree to these Terms of Use and to the Privacy Policy. If you do not agree, do not install or use the service.',
    'terms.h2': '2. What Get The Discount does',
    'terms.p2': 'The extension finds coupons, shows price history, warns about price drops, offers cashback at partner stores and gathers links to game deals. Features may be changed, expanded or discontinued over time.',
    'terms.h3': '3. Permitted use',
    'terms.p3': 'You may use the extension for personal and lawful purposes. You may not use the service for fraud, to bypass security measures of stores or third parties, to overload our servers or to interfere with the extension and other users.',
    'terms.h4': '4. Account (optional)',
    'terms.p4': 'Some features, such as personalized alerts and cashback, may require an account. You are responsible for keeping your credentials safe and providing accurate data. You may request account closure at any time.',
    'terms.h5': '5. Third-party coupons, prices and deals',
    'terms.p5': 'Coupons, promotions and prices are set by partner stores and may expire, change or stop being valid without notice. The extension helps find and apply deals, but it does not guarantee that a coupon is available or that the displayed price will remain the same at checkout. Purchases are made directly at the store, under its own terms.',
    'terms.h6': '6. PegaPoints',
    'terms.p6': 'PegaPoints is a symbolic score calculated and stored only in your browser. It is not currency, has no monetary value and cannot be exchanged for money, credit or any other financial benefit. The balance may be erased when you remove the extension or clear your browser data.',
    'terms.h7': '7. Intellectual property and trademarks',
    'terms.p7': 'The brand, name and code of the extension belong to the X-OS initiative and its licensors. The trademarks, logos and names of the stores mentioned belong to their respective owners and are used only to identify the services.',
    'terms.h8': '8. Privacy',
    'terms.p8': 'Data processing is described in the <a href="privacidade.html">Privacy Policy</a>, which is part of these terms.',
    'terms.h9': '9. Availability and limitations',
    'terms.p9': 'The service is provided as is. We may suspend, change or discontinue features, including for maintenance, technical issues or changes at partner stores. To the extent permitted by law, we are not liable for unavailability, for purchase decisions made based on the information shown or for indirect damages arising from use of the service.',
    'terms.h10': '10. Changes and termination',
    'terms.p10': 'We may update these terms. The date at the top indicates the current version; relevant changes will be communicated in the extension or on this website. You may stop using the service at any time by uninstalling the extension.',
    'terms.h11': '11. Governing law and venue',
    'terms.p11': 'These terms are governed by Brazilian law. The venue of the consumer\'s domicile is elected where applicable, without prejudice to other mandatory consumer protection rules.',
    'terms.h12': '12. Contact and operator',
    'terms.p12': 'Get The Discount is an <strong>X-OS</strong> initiative.<br />Operator: <strong>The Jony Peixoto</strong><br />Address: Internet<br />Email: <a href="mailto:dev@x-os.org">dev@x-os.org</a>',
    'terms.back': '← Back to home'
  };

  function readLang() {
    try {
      const q = new URLSearchParams(location.search).get('lang');
      if (SUPPORTED.includes(q)) {
        try { localStorage.setItem(STORE_KEY, q); } catch (e) {}
        return q;
      }
    } catch (e) {}
    try {
      const v = localStorage.getItem(STORE_KEY);
      if (SUPPORTED.includes(v)) return v;
    } catch (e) {}
    return 'pt';
  }

  let lang = readLang();
  window.POD_LANG = lang;

  // Evita piscar em português para quem já escolheu inglês.
  if (lang === 'en') document.documentElement.classList.add('i18n-wait');
  document.documentElement.dataset.lang = lang;

  window.podT = (key, fallback) => {
    if (lang === 'en' && Object.prototype.hasOwnProperty.call(EN, key)) return EN[key];
    return fallback == null ? null : fallback;
  };
  window.podIsEN = () => lang === 'en';

  // Original em português, guardado fora do DOM: usar data-* colidiria com os
  // próprios atributos que carregam a chave (data-i18n-html, data-i18n-aria...).
  const PT_CACHE = new WeakMap();
  const cache = (el, attr) => {
    let store = PT_CACHE.get(el);
    if (!store) {
      store = {};
      PT_CACHE.set(el, store);
    }
    if (store[attr] === undefined) {
      store[attr] = (attr === 'aria-label' ? el.getAttribute(attr) : el[attr]) || '';
    }
    return store[attr];
  };

  function apply() {
    const en = lang === 'en';
    document.documentElement.lang = en ? 'en' : 'pt-BR';
    document.documentElement.dataset.lang = lang;

    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const pt = cache(el, 'textContent');
      const key = el.getAttribute('data-i18n');
      el.textContent = en && EN[key] != null ? EN[key] : pt;
    });
    document.querySelectorAll('[data-i18n-html]').forEach((el) => {
      const pt = cache(el, 'innerHTML');
      const key = el.getAttribute('data-i18n-html');
      el.innerHTML = en && EN[key] != null ? EN[key] : pt;
    });
    document.querySelectorAll('[data-i18n-aria]').forEach((el) => {
      const pt = cache(el, 'aria-label');
      const key = el.getAttribute('data-i18n-aria');
      el.setAttribute('aria-label', en && EN[key] != null ? EN[key] : pt);
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
      const pt = cache(el, 'placeholder');
      const key = el.getAttribute('data-i18n-placeholder');
      el.setAttribute('placeholder', en && EN[key] != null ? EN[key] : pt);
    });
    document.querySelectorAll('[data-i18n-content]').forEach((el) => {
      const pt = cache(el, 'content');
      const key = el.getAttribute('data-i18n-content');
      el.setAttribute('content', en && EN[key] != null ? EN[key] : pt);
    });

    document.querySelectorAll('.lang [data-lang-btn]').forEach((btn) => {
      btn.setAttribute('aria-pressed', String(btn.getAttribute('data-lang-btn') === lang));
    });

    document.documentElement.classList.remove('i18n-wait');
    document.dispatchEvent(new CustomEvent('pod:langchange', { detail: { lang } }));
  }

  function setLang(next) {
    if (!SUPPORTED.includes(next) || next === lang) return;
    lang = next;
    window.POD_LANG = lang;
    try { localStorage.setItem(STORE_KEY, lang); } catch (e) {}
    apply();
    try {
      const url = new URL(location.href);
      if (url.searchParams.has('lang')) {
        url.searchParams.set('lang', lang);
        history.replaceState(null, '', url);
      }
    } catch (e) {}
  }

  window.podSetLang = setLang;

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-lang-btn]');
    if (btn) setLang(btn.getAttribute('data-lang-btn'));
  });

  const start = () => {
    apply();
    // rede de segurança: nunca deixar a página escondida
    setTimeout(() => document.documentElement.classList.remove('i18n-wait'), 1500);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
