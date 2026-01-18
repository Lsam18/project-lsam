// Smooth scroll polyfill and enhancements
document.addEventListener('DOMContentLoaded', () => {
    // Handle all internal links for smooth scrolling
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').slice(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                const headerOffset = 80; // Adjust based on your fixed header height
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Optimize scroll performance
    let ticking = false;
    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                // Handle any scroll-based animations or updates here
                ticking = false;
            });
            ticking = true;
        }
    }, { passive: true });
});

// Update date and time
function updateDateTime() {
    const now = new Date();
    const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const timeOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit' };
    
    document.getElementById('current-date').textContent = now.toLocaleDateString('en-US', dateOptions);
    document.getElementById('current-time').textContent = now.toLocaleTimeString('en-US', timeOptions);
}

// Fetch real cybersecurity news from The Hacker News RSS
async function fetchSecurityNews() {
    try {
        // Using RSS2JSON proxy to avoid CORS issues
        const response = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=https://feeds.feedburner.com/TheHackersNews`);
        const data = await response.json();
        
        if (data.items && data.items.length > 0) {
            // collect the first 5 titles
            const titles = data.items.slice(0, 5).map(i => i.title);
            startTicker(titles);
            lastTickerItems = titles;
        }
    } catch (error) {
        console.error('Error fetching security news:', error);
        // Fallback to placeholder news if API fails
        const fallbackNews = [
            "Cybersecurity Alert: Stay updated with latest threats",
            "New vulnerabilities discovered in enterprise software",
            "Global security teams combat emerging threats",
            "Zero-day exploits on the rise - patch immediately"
        ];
        
        // show fallback using the same ticker helper
        startTicker(fallbackNews);
        lastTickerItems = fallbackNews;
    }
}

// ticker state
let tickerInterval = null;
let lastTickerItems = null;

// Theme helpers
function applyTheme(theme) {
    const root = document.documentElement;
    if (theme === 'light') {
        root.classList.add('theme-light');
    } else {
        root.classList.remove('theme-light');
    }
    const btn = document.getElementById('theme-toggle');
    if (btn) {
        btn.setAttribute('aria-pressed', String(theme === 'light'));
        btn.innerHTML = theme === 'light' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    }
}

function initTheme() {
    try {
        const saved = localStorage.getItem('lsam_theme');
        const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
        const theme = saved || (prefersLight ? 'light' : 'dark');
        applyTheme(theme);

        const btn = document.getElementById('theme-toggle');
        if (btn) {
            btn.addEventListener('click', () => {
                const currentIsLight = document.documentElement.classList.contains('theme-light');
                const next = currentIsLight ? 'dark' : 'light';
                applyTheme(next);
                localStorage.setItem('lsam_theme', next);
            });
        }
    } catch (e) {
        console.warn('Theme init failed', e);
    }
}

function startTicker(items) {
    const newsTicker = document.querySelector('.news-ticker');
    if (!newsTicker || !items || items.length === 0) return;
    // clear any previous
    if (tickerInterval) {
        clearInterval(tickerInterval);
        tickerInterval = null;
    }

    // mobile: show single item and rotate every 3.5s
    if (window.innerWidth <= 520) {
        newsTicker.innerHTML = `<span class="mobile-ticker-item">${items[0]}</span>`;
        let idx = 0;
        tickerInterval = setInterval(() => {
            idx = (idx + 1) % items.length;
            const el = newsTicker.querySelector('.mobile-ticker-item');
            if (el) el.textContent = items[idx];
        }, 3500);
    } else {
        // desktop/tablet: populate spans and let CSS marquee animate
        newsTicker.innerHTML = '';
        items.forEach(title => {
            const span = document.createElement('span');
            span.textContent = title;
            newsTicker.appendChild(span);
        });
    }
}

// restart ticker on resize with current items
window.addEventListener('resize', () => {
    if (lastTickerItems) startTicker(lastTickerItems);
});

// Initialize everything when page loads
// Smooth scroll to section when clicking nav links
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').slice(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
                
                // Update URL without jumping
                history.pushState(null, null, `#${targetId}`);
            }
        });
    });
}

document.addEventListener('DOMContentLoaded', function() {
    updateDateTime();
    setInterval(updateDateTime, 1000);
    fetchSecurityNews();
    recordVisit();
    initSmoothScroll();
    
    // Refresh news every 5 minutes
    setInterval(fetchSecurityNews, 300000);
    
    // Mobile nav toggle
    const mobileToggle = document.getElementById('mobile-menu-toggle');
    const mainNav = document.getElementById('main-nav');
    if (mobileToggle && mainNav) {
        mobileToggle.addEventListener('click', () => {
            mainNav.classList.toggle('mobile-open');
            // toggle aria-expanded
            const expanded = mainNav.classList.contains('mobile-open');
            mobileToggle.setAttribute('aria-expanded', expanded ? 'true' : 'false');
            // lock body scroll while nav overlay is open
            document.body.classList.toggle('nav-locked', expanded);
        });
        // close mobile nav on outside click
        document.addEventListener('click', (ev) => {
            if (!mainNav.contains(ev.target) && !mobileToggle.contains(ev.target)) {
                if (mainNav.classList.contains('mobile-open')) {
                    mainNav.classList.remove('mobile-open');
                    mobileToggle.setAttribute('aria-expanded', 'false');
                    document.body.classList.remove('nav-locked');
                }
            }
        });

        // Add an in-overlay close button for better UX/accessibility only on small screens
        function ensureCloseBtn() {
            let cb = document.getElementById('mobile-nav-close');
            if (window.innerWidth <= 860) {
                if (!cb) {
                    cb = document.createElement('button');
                    cb.id = 'mobile-nav-close';
                    cb.className = 'mobile-nav-close';
                    cb.setAttribute('aria-label', 'Close navigation');
                    cb.innerHTML = '&times;';
                    // append to nav so it sits inside the overlay
                    mainNav.appendChild(cb);

                    cb.addEventListener('click', (e) => {
                        e.stopPropagation();
                        if (mainNav.classList.contains('mobile-open')) {
                            mainNav.classList.remove('mobile-open');
                            mobileToggle.setAttribute('aria-expanded', 'false');
                            document.body.classList.remove('nav-locked');
                            cb.blur();
                        }
                    });
                }
            } else {
                // remove the close button on larger screens to avoid leakage
                if (cb && cb.parentElement) cb.parentElement.removeChild(cb);
            }
        }

        // initial create/remove based on current width
        ensureCloseBtn();

        // Close the overlay on Escape key for accessibility
        document.addEventListener('keydown', (ev) => {
            if (ev.key === 'Escape' || ev.key === 'Esc') {
                if (mainNav.classList.contains('mobile-open')) {
                    mainNav.classList.remove('mobile-open');
                    mobileToggle.setAttribute('aria-expanded', 'false');
                    document.body.classList.remove('nav-locked');
                }
            }
        });

        // Ensure nav is closed and scroll unlocked when resizing to desktop and recreate/remove close button
        window.addEventListener('resize', () => {
            if (window.innerWidth > 860 && mainNav.classList.contains('mobile-open')) {
                mainNav.classList.remove('mobile-open');
                mobileToggle.setAttribute('aria-expanded', 'false');
                document.body.classList.remove('nav-locked');
            }
            ensureCloseBtn();
        });
    }

    // Smooth scrolling for in-page anchors
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (!href || href === '#') return;
            // If link is an in-page anchor, smooth scroll
            if (href.startsWith('#')) {
                const target = document.querySelector(href);
                if (target) {
                    e.preventDefault();
                    const top = target.getBoundingClientRect().top + window.pageYOffset - 90; // offset for header
                    window.scrollTo({ top, behavior: 'smooth' });
                    // close mobile nav after navigation
                    if (mainNav && mainNav.classList.contains('mobile-open')) mainNav.classList.remove('mobile-open');
                }
            }
        });
    });

        // Sticky navigation: show the nav fixed at top when the page is scrolled past its original position.
        // We compute the nav's original offset, then toggle .sticky on the nav and add body padding to avoid layout jump.
        (function setupStickyNav(){
            const nav = document.getElementById('main-nav');
            if (!nav) return;

            let navOffset = nav.getBoundingClientRect().top + window.pageYOffset;

            // Use requestAnimationFrame to keep scroll handling cheap
            let ticking = false;
            function onScroll(){
                if (ticking) return;
                ticking = true;
                window.requestAnimationFrame(() => {
                    const scrolled = window.pageYOffset || document.documentElement.scrollTop;
                    const shouldStick = scrolled >= navOffset;

                    if (shouldStick && !nav.classList.contains('sticky')){
                        nav.classList.add('sticky');
                        document.body.classList.add('nav-fixed');
                        // set exact padding-top so content doesn't jump (use nav height)
                        const navH = Math.ceil(nav.getBoundingClientRect().height);
                        document.body.style.paddingTop = navH + 'px';
                    } else if (!shouldStick && nav.classList.contains('sticky')){
                        nav.classList.remove('sticky');
                        document.body.classList.remove('nav-fixed');
                        document.body.style.paddingTop = '';
                    }

                    ticking = false;
                });
            }

            // Recompute navOffset on resize (and temporarily clear sticky so measurement is correct)
            window.addEventListener('resize', () => {
                // If nav is sticky, remove it so we can compute the original offset in-flow
                const wasSticky = nav.classList.contains('sticky');
                if (wasSticky){
                    nav.classList.remove('sticky');
                    document.body.classList.remove('nav-fixed');
                    document.body.style.paddingTop = '';
                }
                navOffset = nav.getBoundingClientRect().top + window.pageYOffset;
                if (wasSticky) onScroll();
            });

            window.addEventListener('scroll', onScroll, { passive: true });
            // initial check in case user reloads mid-page
            onScroll();
        })();

    // Initialize theme after DOM loaded
    initTheme();

        // Back-to-top button behavior
        const backBtn = document.getElementById('back-to-top');
        if (backBtn) {
            const checkVisibility = () => {
                if ((window.pageYOffset || document.documentElement.scrollTop) > 400) {
                    backBtn.classList.add('show');
                } else {
                    backBtn.classList.remove('show');
                }
            };

            window.addEventListener('scroll', checkVisibility, { passive: true });
            backBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
            // initial state
            checkVisibility();
        }
});

// Server-backed visit recorder (global count)
async function recordVisit() {
    const el = document.getElementById('visit-count');
    if (!el) return;
    const API_BASE = (window.PUBLIC_API_BASE || window.ADMIN_API_BASE || '').replace(/\/$/, '');
    const url = API_BASE ? `${API_BASE}/api/visits` : '/api/visits';
    try {
        const resp = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: '{}'
        });
        const data = await resp.json().catch(() => ({}));
        if (!resp.ok || typeof data.count !== 'number') throw new Error('bad response');
        el.textContent = data.count;
    } catch (e) {
        console.error('Visit recorder error', e);
        el.textContent = '—';
    }
}