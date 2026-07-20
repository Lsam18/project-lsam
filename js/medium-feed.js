document.addEventListener('DOMContentLoaded', () => {
  const currentProfile = 'https://medium.com/@lakshan.sam28';
  const expectedHandle = '@lakshan.sam28';
  const feedUrl = `${currentProfile.replace('medium.com/', 'medium.com/feed/')}`;
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
      const feedOwner = String(data.feed?.link || '').toLowerCase();
      if (!feedOwner.includes(expectedHandle)) throw new Error('Unexpected Medium feed owner');
      return data.items.filter((item) => {
        try {
          const url = new URL(item.link);
          return url.hostname === 'medium.com' && url.pathname.toLowerCase().startsWith(`/${expectedHandle}/`);
        } catch (_) { return false; }
      });
    } finally { window.clearTimeout(timer); }
  };

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
    const results = await Promise.allSettled([fetchFeed(feedUrl)]);
    const fetched = results.flatMap((result) => result.status === 'fulfilled' ? result.value : []);
    const unique = [...new Map(fetched.map((item) => [String(item.guid || item.link).replace(/\?.*$/, ''), item])).values()]
      .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
    const articles = unique;
    if (!articles.length) {
      const feature = document.getElementById('medium-feature');
      const grid = document.getElementById('medium-feed');
      if (feature) feature.innerHTML = `<div class="medium-error">The verified <a href="${currentProfile}" target="_blank" rel="noopener">@lakshan.sam28</a> feed is temporarily unavailable. No substitute authors are being displayed.</div>`;
      if (grid) grid.innerHTML = '';
    } else {
      renderFeature(articles[0]);
      renderGrid(articles.slice(1, 7));
    }
    window.__MEDIUM_ARTICLES__ = articles;
    document.dispatchEvent(new CustomEvent('medium:loaded', { detail: articles }));
    if (status) status.textContent = `${articles.length ? 'LIVE RSS · @LAKSHAN.SAM28' : 'VERIFIED PROFILE · FEED UNAVAILABLE'} · ${articles.length} PUBLISHED ARTICLE${articles.length === 1 ? '' : 'S'}`;
  };
  loadMediumFeed();
  window.setInterval(loadMediumFeed, 30 * 60 * 1000);
});
