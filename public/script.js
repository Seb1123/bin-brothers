// Date for copyright
document.getElementById('year').textContent = new Date().getFullYear();

// Rotating Favicon
const fav = document.querySelector("link#favicon");
let iconArr = ['♻️','🧽','👷‍♂️','🚮','🧼'];
let count = 0;
function changeFavicon() {
    count = count%5;
    fav.setAttribute("href",`data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>${iconArr[count]}</text></svg>`);
    count++;
    setTimeout(()=>{
        changeFavicon();
    }, 3000);
}
changeFavicon();

// Logo change ----------------------------------------------------------------------------------------------

// --- SELECTORS (unchanged) ---
const svg = document.querySelector("svg#logoinitial");
const img  = svg.querySelector("#logo");

// --- MEDIA QUERY: phone vs laptop ---
const mq = window.matchMedia("(max-width: 650px)");

// --- HELPER: set href for both modern & older Safari ---
function setHref(el, url) {
  el.setAttribute("href", url);
  el.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", url);
}

// --- Resolve sources (with fallbacks) ---
// You can define these in HTML as data-attrs on the <image id="logo">:
//   data-desktop-initial, data-desktop-final, data-mobile-initial, data-mobile-final, data-final
// If not present, we fall back to your current files.
function resolveSources() {
  const ds = img.dataset;

  const desktopInitial = ds.desktopInitial || img.getAttribute("href") || "./trashbin.png";
  const desktopFinal   = ds.desktopFinal   || ds.final || "./logo.png";

  // If you don’t have special mobile files yet, these will just use desktop ones.
  const mobileInitial  = ds.mobileInitial  || desktopInitial;
  const mobileFinal    = ds.mobileFinal    || desktopFinal;

  const isMobile = mq.matches;
  return {
    initial: isMobile ? mobileInitial : desktopInitial,
    final:   isMobile ? mobileFinal   : desktopFinal
  };
}

// --- Apply initial image for current viewport & preload final ---
let current = resolveSources();
setHref(img, current.initial);

const preload = new Image();
preload.src = current.final;

// Optional: if viewport crosses 650px, update initial (only if not already swapped)
mq.addEventListener?.("change", () => {
  if (swapped) return;
  current = resolveSources();
  setHref(img, current.initial);
  preload.src = current.final;
});

// --- YOUR EXISTING STATE & LISTENERS (kept) ---
let swapped  = false;
let hovering = false;

svg.addEventListener("mouseenter", () => (hovering = true));
svg.addEventListener("mouseleave", () => (hovering = false));

img.addEventListener("transitionend", (e) => {
  if (e.propertyName !== "transform" || swapped) {
    e.preventDefault();
    return;
  }
  if (!hovering) return;

  // ⬇️ Only change here: use the resolved "final" for this viewport
  setHref(img, current.final);

  // your size/position tweaks (kept as-is)
  img.setAttribute("width", "155");
  img.setAttribute("height", "155");
  img.setAttribute("x", "28");
  img.setAttribute("y", "27");
  img.setAttribute("id", "logofinal");

  swapped = true;
});

// Checks for JS injections in achor element --------------------------------------------------
document.addEventListener('click', (e) => {
  const a = e.target.closest('a');
  if (!a) return;

  const href = a.getAttribute('href') || '';
  if (/^\s*javascript:/i.test(href)) {
    console.warn('Blocked dangerous link:', href);
    e.preventDefault();
    return;
  }
});

// Section Generator -------------------------------------------------------------------------
const ALLOWED = new Set(['./home.html','./about.html','./contact.html','./signup.html','./gallery.html']);
const cache = new Map();
const mainRight = document.querySelector('div.main-right');

function sanitizeToFragment(html) {
    const range = document.createRange();
    const frag = range.createContextualFragment(html);

    // remove inline event handlers everywhere
    frag.querySelectorAll('*').forEach(el => {
        [...el.attributes].forEach(attr => {
            const name = attr.name.toLowerCase();
            const val  = (attr.value || '').trim();
            if (name.startsWith('on')) el.removeAttribute(attr.name);

            // strip scriptable URLs in common URL-bearing attrs
            if (['href','xlink:href','src','action','formaction'].includes(name)) {
                if (/^\s*javascript:/i.test(val) || /^\s*data:text\/html/i.test(val)) {
                    el.removeAttribute(attr.name);
                }
            }
        });
    });
  return frag;
}

async function loadPage(url, push = true) {
  if (!ALLOWED.has(url)) {
    mainRight.textContent = 'ERROR: unrecognized link.';
    return;
  }
  try {
    let html = cache.get(url);
    if (!html) {
      // optional cache-bust on deploy: const bust = `?v=${BUILD_VERSION}`;
      const res = await fetch(url /* no credentials needed for static */);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      html = await res.text();
      cache.set(url, html);
    }
    mainRight.replaceChildren(sanitizeToFragment(html));
    if (push) history.pushState({ url }, '', `#${url}`);
  } catch (err) {
    mainRight.textContent = 'Sorry, that page failed to load. Please try again.';
    console.error(err);
  }
}

// Buttons → DRY
[
  ['#home', './home.html'],
  ['#about', './about.html'],
  ['#signup', './signup.html'],
  ['#contact', './contact.html'],
  ['#gallery', './gallery.html'],
].forEach(([sel, url]) => {
  const btn = document.querySelector(`button${sel}`);
  btn?.addEventListener('click', () => loadPage(url));
});

// Delegate clicks inside mainRight
mainRight.addEventListener('click', (e) => {
  const a = e.target.closest('a');
  if (!a) return;

  const href = a.getAttribute('href') || '';
  // Allow mailto/tel/hash/external to behave normally
  if (/^(mailto:|tel:|#)/.test(href)) return;
  const absolute = new URL(href, location.href);
  if (absolute.origin !== location.origin) return;

  if (ALLOWED.has(href)) {
    e.preventDefault();
    loadPage(href);
  }
});

// Stops bot submitions in on our company email------------------------------------------
const form = document.querySelector('form');
if(form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault(); // stop submission
    const honeypot = document.querySelector('input[name="company"]');
    if (honeypot.value.trim() !== '') {
      console.warn('Spam submission blocked 🚫');
    }
  });
};

// Back/forward support
// window.addEventListener('popstate', (ev) => {
//   const url = ev.state.url || './home.html';
//   loadPage(url, /* push */ false);
// });

