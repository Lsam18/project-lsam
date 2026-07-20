document.addEventListener('DOMContentLoaded', () => {
  const currentProfile = 'https://medium.com/@Lakshan_Sameera';
  const archiveProfile = 'https://medium.com/@lakshan.sam28';
  const feedUrls = [`${currentProfile.replace('medium.com/', 'medium.com/feed/')}`, `${archiveProfile.replace('medium.com/', 'medium.com/feed/')}`];
  const escapeHtml = (value = '') => String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]);
  const stripHtml = (value = '') => {
    const doc = new DOMParser().parseFromString(String(value), 'text/html');
    return (doc.body.textContent || '').replace(/\s+/g, ' ').trim();
  };
  const safeUrl = (value, fallback = currentProfile) => {
    try { const url = new URL(value); return url.protocol === 'https:' ? url.href : fallback; } catch (_) { return fallback; }
  };
  const articleImage = (item) => {
    if (item.thumbnail) return safeUrl(item.thumbnail, '');
    const html = item.content || item.description || '';
    const matches = [...html.matchAll(/<img[^>]+src=["']([^"']+)["']/gi)].map((match) => match[1]);
    return safeUrl(matches.find((url) => !url.includes('/_/stat?') && !url.includes('medium.com/_/stat')) || '', '');
  };
  const readTime = (item) => Math.max(1, Math.round(stripHtml(item.content || item.description).split(/\s+/).filter(Boolean).length / 210));
  const formatDate = (value) => {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? 'DATE UNAVAILABLE' : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase();
  };
  const fetchFeed = async (feedUrl) => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 12000);
    try {
      const endpoint = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrl)}`;
      const response = await fetch(endpoint, { cache: 'no-store', signal: controller.signal });
      if (!response.ok) throw new Error(`Medium feed ${response.status}`);
      const data = await response.json();
      if (data.status !== 'ok' || !Array.isArray(data.items)) throw new Error('Invalid Medium feed');
      return data.items;
    } finally { window.clearTimeout(timer); }
  };

  // Real published articles used only if the public RSS relay is unavailable.
  const verifiedFallback = [
    { title: 'Marimo Pre-Auth RCE (CVE-2026–39987): From One WebSocket to Shell', pubDate: '2026-04-14 13:31:02', link: 'https://medium.com/@Lakshan_Sameera/marimo-pre-auth-rce-cve-2026-39987-ghsa-2679-6mx9-h9xc-from-one-websocket-to-shell-64ef00cf19bf', author: 'Lakshan Sameera', description: 'A step-by-step reproduction using a custom Dockerfile and reliable proof of concept in an isolated lab.', categories: ['RCE', 'Vulnerability Research'] },
    { title: 'Critical Prototype Pollution Flaw in Adobe Reader (CVE-2026–34621)', pubDate: '2026-04-14 05:10:29', link: 'https://medium.com/@Lakshan_Sameera/critical-prototype-pollution-flaw-in-adobe-reader-cve-2026-34621-under-attack-since-late-2025-89e91016688e', author: 'Lakshan Sameera', description: 'Technical analysis of an Adobe Reader prototype-pollution chain observed in active attacks.', categories: ['CVE', 'Exploit Analysis'] },
    { title: 'Critical n8n Vulnerability CVE-2026–33696: Prototype Pollution Leads to RCE', pubDate: '2026-03-28 12:00:00', link: 'https://medium.com/@Lakshan_Sameera/critical-n8n-vulnerability-cve-2026-33696-prototype-pollution-leads-to-rce-in-xml-and-gsuiteadmin-49833ed5e54a', author: 'Lakshan Sameera', description: 'A defensive technical breakdown of prototype pollution affecting n8n workflow nodes.', categories: ['n8n', 'RCE'] },
    { title: 'Building a SOC from Scratch: The Part Tutorials Never Show', pubDate: '2026-01-07 12:00:00', link: 'https://medium.com/@lakshan.sam28/building-a-soc-from-scratch-the-part-tutorials-never-show-80655b2332fd', author: 'Lakshan Sameera (Sameer)', description: 'Production lessons about log onboarding, broken mappings, detection context and building a usable SOC.', categories: ['SOC', 'SIEM'] },
    { title: 'I Built a Global Threat Intel Lab From Scratch', pubDate: '2025-09-10 12:00:00', link: 'https://medium.com/@lakshan.sam28/i-built-a-global-threat-intel-lab-from-scratch-then-deleted-half-of-it-by-accident-68ccf22fdb1c', author: 'Lakshan Sameera (Sameer)', description: 'Building an open-source threat-intelligence pipeline using MISP, Python, SIEM integrations and enrichment.', categories: ['Threat Intelligence', 'MISP'] }
  ];

  const renderFeature = (item) => {
    const container = document.getElementById('medium-feature');
    if (!container) return;
    const image = articleImage(item);
    const excerpt = stripHtml(item.description || item.content).slice(0, 250);
    const category = item.categories?.[0] || 'CYBERSECURITY';
    container.innerHTML = `<article class="medium-feature-card">
      <a class="medium-feature-image ${image ? '' : 'no-image'}" href="${safeUrl(item.link)}" target="_blank" rel="noopener">${image ? `<img src="${image}" alt="" loading="lazy">` : '<span>LSAM<br>RESEARCH</span>'}<i>01 / FEATURED</i></a>
      <div class="medium-feature-copy"><div class="medium-meta"><span>${escapeHtml(String(category).toUpperCase())}</span><time>${escapeHtml(formatDate(item.pubDate))}</time><b>${readTime(item)} MIN READ</b></div><h3><a href="${safeUrl(item.link)}" target="_blank" rel="noopener">${escapeHtml(item.title)}</a></h3><p>${escapeHtml(excerpt)}${excerpt.length >= 250 ? '…' : ''}</p><a class="medium-read" href="${safeUrl(item.link)}" target="_blank" rel="noopener">READ FIELD NOTE <span>↗</span></a></div>
    </article>`;
  };
  const renderGrid = (items) => {
    const container = document.getElementById('medium-feed');
    if (!container) return;
    container.innerHTML = items.length ? items.map((item, index) => {
      const image = articleImage(item);
      const category = item.categories?.[0] || 'SECURITY RESEARCH';
      return `<article class="medium-card reveal visible"><a class="medium-card-image ${image ? '' : 'no-image'}" href="${safeUrl(item.link)}" target="_blank" rel="noopener">${image ? `<img src="${image}" alt="" loading="lazy">` : '<span>LS / NOTE</span>'}<b>${String(index + 2).padStart(2, '0')}</b></a><div class="medium-card-copy"><div class="medium-meta"><span>${escapeHtml(String(category).toUpperCase())}</span><time>${escapeHtml(formatDate(item.pubDate))}</time></div><h3><a href="${safeUrl(item.link)}" target="_blank" rel="noopener">${escapeHtml(item.title)}</a></h3><div><em>${readTime(item)} MIN READ</em><a href="${safeUrl(item.link)}" target="_blank" rel="noopener" aria-label="Read ${escapeHtml(item.title)}">↗</a></div></div></article>`;
    }).join('') : '<div class="medium-error">No published articles were returned by the feed.</div>';
  };
  const loadMediumFeed = async () => {
    const status = document.getElementById('medium-status');
    if (status) status.textContent = 'CONNECTING TO MEDIUM RSS…';
    const results = await Promise.allSettled(feedUrls.map(fetchFeed));
    const fetched = results.flatMap((result) => result.status === 'fulfilled' ? result.value : []);
    const unique = [...new Map(fetched.map((item) => [String(item.guid || item.link).replace(/\?.*$/, ''), item])).values()]
      .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
    const articles = unique.length ? unique : verifiedFallback;
    renderFeature(articles[0]);
    renderGrid(articles.slice(1, 7));
    window.__MEDIUM_ARTICLES__ = articles;
    document.dispatchEvent(new CustomEvent('medium:loaded', { detail: articles }));
    if (status) status.textContent = `${unique.length ? 'LIVE RSS' : 'VERIFIED FALLBACK'} · ${articles.length} PUBLISHED ARTICLE${articles.length === 1 ? '' : 'S'}`;
  };
  loadMediumFeed();
  window.setInterval(loadMediumFeed, 30 * 60 * 1000);
});
