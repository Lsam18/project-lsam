document.addEventListener('DOMContentLoaded', () => {
  const section = document.getElementById('credentials');
  if (!section) return;

  const profileUrl = 'https://www.credly.com/users/lakshan-sameera-sameer';
  const featuredFallback = [
    { title: 'Fortinet Certified Associate Cybersecurity', issuer: 'Fortinet', issuerKey: 'fortinet', url: 'https://www.credly.com/earner/earned/badge/a35d4655-d29e-4cc1-ae51-1ecba92baaa4', image: 'https://cdn.simpleicons.org/fortinet/ED1C24' },
    { title: 'Google Cybersecurity Certificate', issuer: 'Coursera · Authorized by Google', issuerKey: 'google', url: profileUrl, image: 'https://cdn.simpleicons.org/google/4285F4' },
    { title: 'IBM Cybersecurity Analyst Professional Certificate', issuer: 'Coursera · Authorized by IBM', issuerKey: 'ibm', url: profileUrl, image: 'assets/images/ibm.png' },
    { title: 'ISO/IEC 27001 Information Security Associate™', issuer: 'SkillFront', issuerKey: 'skillfront', url: 'https://www.skillfront.com/Badges/93688541505521', image: 'https://cdn.simpleicons.org/skillshare/FF6F00' },
    { title: 'Kusto Detective Gold Star!', issuer: 'Microsoft Azure Data Explorer', issuerKey: 'microsoft', url: 'https://www.credly.com/badges/96c0d6a5-9f8d-4a32-affc-c2ce1a496b40', image: 'assets/images/microsoft.png' },
    { title: 'Kusto Detective Agency — Complete', issuer: 'Microsoft Azure Data Explorer', issuerKey: 'microsoft', url: 'https://www.credly.com/badges/bbcea4d9-9e8f-4d4e-9021-5e2ac410e05b', image: 'assets/images/microsoft.png' },
    { title: 'ISC2 Candidate', issuer: 'ISC2', issuerKey: 'isc2', url: profileUrl, image: 'https://cdn.simpleicons.org/isc2/003366' },
    { title: 'Junior Cybersecurity Analyst Career Path', issuer: 'Cisco', issuerKey: 'cisco', url: profileUrl, image: 'https://cdn.simpleicons.org/cisco/1BA0D8' },
    { title: 'Cyber Threat Management', issuer: 'Cisco', issuerKey: 'cisco', url: profileUrl, image: 'https://cdn.simpleicons.org/cisco/1BA0D8' },
    { title: 'Endpoint Security', issuer: 'Cisco', issuerKey: 'cisco', url: profileUrl, image: 'https://cdn.simpleicons.org/cisco/1BA0D8' },
    { title: 'Penetration Testing, Incident Response and Forensics', issuer: 'Coursera · Authorized by IBM', issuerKey: 'ibm', url: profileUrl, image: 'assets/images/ibm.png' },
    { title: 'Cyber Threat Intelligence', issuer: 'Coursera · Authorized by IBM', issuerKey: 'ibm', url: profileUrl, image: 'assets/images/ibm.png' },
    { title: 'New Rank: Senior Detective Agent', issuer: 'Microsoft Azure Data Explorer', issuerKey: 'microsoft', url: 'https://www.credly.com/badges/d1b893c8-d1c2-42a6-93be-bd68e4d71808', image: 'assets/images/microsoft.png' },
    { title: 'New Rank: Special Detective Agent II', issuer: 'Microsoft Azure Data Explorer', issuerKey: 'microsoft', url: 'https://www.credly.com/badges/1d8af4da-c397-4de2-a7ec-f2d6b69fd340', image: 'assets/images/microsoft.png' },
    { title: 'New Rank: Special Detective Agent', issuer: 'Microsoft Azure Data Explorer', issuerKey: 'microsoft', url: 'https://www.credly.com/badges/4640575b-44f6-4bb0-9636-63bf3030878b', image: 'assets/images/microsoft.png' },
    { title: 'New Rank: Principal Detective', issuer: 'Microsoft Azure Data Explorer', issuerKey: 'microsoft', url: 'https://www.credly.com/badges/3f0d3823-ad28-4150-a578-0833660cb4fe', image: 'assets/images/microsoft.png' },
    { title: 'Kusto Detective Agency — Case #5 Badge', issuer: 'Microsoft Azure Data Explorer', issuerKey: 'microsoft', url: 'https://www.credly.com/badges/95617670-c476-499f-ad44-694683da099e', image: 'assets/images/microsoft.png' },
    { title: 'Kusto Detective Agency — Case #4 Badge', issuer: 'Microsoft Azure Data Explorer', issuerKey: 'microsoft', url: 'https://www.credly.com/badges/bad79263-985e-4f3b-aeb2-7e1db327664b', image: 'assets/images/microsoft.png' },
    { title: 'Introduction to the Threat Landscape 1.0', issuer: 'Fortinet', issuerKey: 'fortinet', url: 'https://www.credly.com/earner/earned/badge/b342189b-7da9-4261-aba2-6024e2e0a504', image: 'https://cdn.simpleicons.org/fortinet/ED1C24' },
    { title: 'Security Analyst Fundamentals Specialization', issuer: 'Coursera · Authorized by IBM', issuerKey: 'ibm', url: profileUrl, image: 'assets/images/ibm.png' },
    { title: 'Introduction to Cybersecurity', issuer: 'Cisco', issuerKey: 'cisco', url: profileUrl, image: 'https://cdn.simpleicons.org/cisco/1BA0D8' },
    { title: 'Networking Essentials', issuer: 'Cisco', issuerKey: 'cisco', url: profileUrl, image: 'https://cdn.simpleicons.org/cisco/1BA0D8' },
    { title: 'Cybersecurity Essentials', issuer: 'Cisco', issuerKey: 'cisco', url: profileUrl, image: 'https://cdn.simpleicons.org/cisco/1BA0D8' },
    { title: 'Python Essentials 1', issuer: 'Cisco', issuerKey: 'cisco', url: profileUrl, image: 'https://cdn.simpleicons.org/cisco/1BA0D8' },
    { title: 'Cybersecurity Breach Case Studies', issuer: 'Coursera · Authorized by IBM', issuerKey: 'ibm', url: profileUrl, image: 'assets/images/ibm.png' },
    { title: 'Introduction to Cybersecurity Tools & Cyber Attacks', issuer: 'Coursera · Authorized by IBM', issuerKey: 'ibm', url: profileUrl, image: 'assets/images/ibm.png' },
    { title: 'Cybersecurity Compliance Framework & System Administration', issuer: 'Coursera · Authorized by IBM', issuerKey: 'ibm', url: profileUrl, image: 'assets/images/ibm.png' },
    { title: 'Network Security & Database Vulnerabilities', issuer: 'Coursera · Authorized by IBM', issuerKey: 'ibm', url: profileUrl, image: 'assets/images/ibm.png' }
  ];
  const featuredOrder = featuredFallback.map((item) => item.title);
  const filterLabels = { all: 'All', microsoft: 'Microsoft', cisco: 'Cisco', ibm: 'IBM', google: 'Google', fortinet: 'Fortinet', other: 'Other' };
  const grid = document.getElementById('credly-grid');
  const filters = document.getElementById('credly-filters');
  const search = document.getElementById('credly-search');
  const showMore = document.getElementById('credly-showmore');
  const status = document.getElementById('credential-status');
  let credentials = [];
  let activeFilter = 'all';
  let expanded = false;
  let isFallback = false;

  const escapeHtml = (value = '') => String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]);
  const safeUrl = (value, fallback = profileUrl) => {
    try { const url = new URL(value, location.href); return /^(https?:|file:)$/.test(url.protocol) ? url.href : fallback; } catch (_) { return fallback; }
  };
  const keyFor = (item) => String(item.issuerKey || item.issuer || 'other').toLowerCase();
  const groupFor = (item) => Object.prototype.hasOwnProperty.call(filterLabels, keyFor(item)) ? keyFor(item) : 'other';
  const initialsFor = (item) => ({ microsoft: 'MS', cisco: 'CS', ibm: 'IBM', google: 'G', fortinet: 'FT', isc2: 'ISC', skillfront: 'ISO' })[keyFor(item)] || keyFor(item).slice(0, 3).toUpperCase();
  const sortCredentials = (items) => [...items].sort((a, b) => {
    const aRank = featuredOrder.indexOf(a.title);
    const bRank = featuredOrder.indexOf(b.title);
    if (aRank !== -1 || bRank !== -1) return (aRank === -1 ? 999 : aRank) - (bRank === -1 ? 999 : bRank);
    return String(a.title).localeCompare(String(b.title));
  });

  const renderFilters = () => {
    const present = new Set(credentials.map(groupFor));
    const keys = ['all', 'microsoft', 'cisco', 'ibm', 'google', 'fortinet', 'other'].filter((key) => key === 'all' || present.has(key));
    filters.innerHTML = keys.map((key) => `<button type="button" data-filter="${key}" class="${key === activeFilter ? 'active' : ''}">${filterLabels[key]}</button>`).join('');
    filters.querySelectorAll('button').forEach((button) => button.addEventListener('click', () => {
      activeFilter = button.dataset.filter;
      expanded = true;
      renderFilters();
      renderGrid();
    }));
  };

  const renderGrid = () => {
    const term = search.value.trim().toLowerCase();
    const matches = credentials.filter((item) => {
      const filterMatch = activeFilter === 'all' || groupFor(item) === activeFilter;
      const searchMatch = !term || `${item.title} ${item.issuer} ${item.issuerKey}`.toLowerCase().includes(term);
      return filterMatch && searchMatch;
    });
    const visible = (!expanded && !term && activeFilter === 'all') ? matches.slice(0, 9) : matches;
    if (!visible.length) {
      grid.innerHTML = '<div class="credential-empty">NO CREDENTIALS MATCH THIS QUERY.</div>';
    } else {
      grid.innerHTML = visible.map((item, index) => {
        const image = item.image ? `<img src="${escapeHtml(safeUrl(item.image, ''))}" alt="" loading="lazy">` : `<span>${escapeHtml(initialsFor(item))}</span>`;
        return `<article class="credential-card" style="--card-delay:${index * 35}ms"><div class="credential-index">${String(index + 1).padStart(2, '0')}</div><div class="credential-mark" data-fallback="${escapeHtml(initialsFor(item))}">${image}</div><div class="credential-copy"><small>${escapeHtml(item.issuer)}</small><h3>${escapeHtml(item.title)}</h3><a href="${escapeHtml(safeUrl(item.url))}" target="_blank" rel="noopener">VERIFY RECORD <span>↗</span></a></div></article>`;
      }).join('');
      grid.querySelectorAll('.credential-mark img').forEach((image) => image.addEventListener('error', () => { image.parentElement.innerHTML = `<span>${escapeHtml(image.parentElement.dataset.fallback)}</span>`; }, { once: true }));
    }
    const canExpand = !term && activeFilter === 'all' && matches.length > 9;
    showMore.hidden = !canExpand && !(isFallback && !expanded);
    if (isFallback) showMore.textContent = 'OPEN COMPLETE CREDLY PROFILE ↗';
    else showMore.textContent = expanded ? 'SHOW FEATURED RECORDS' : `SHOW ALL ${matches.length} CREDENTIALS`;
  };

  const initialise = (items, fallbackMode) => {
    isFallback = fallbackMode;
    credentials = sortCredentials(items.filter((item) => item && item.title && item.issuerKey !== 'credly'));
    const issuers = new Set(credentials.map(keyFor));
    status.textContent = `${credentials.length} ${fallbackMode ? 'FEATURED' : 'CREDENTIAL'} RECORDS · ${issuers.size} ISSUERS`;
    renderFilters();
    renderGrid();
    window.__CREDENTIALS__ = credentials;
    window.setTimeout(() => document.dispatchEvent(new CustomEvent('credentials:loaded', { detail: credentials })), 0);
  };

  search.addEventListener('input', () => { expanded = true; renderGrid(); });
  search.addEventListener('keydown', (event) => { if (event.key === 'Escape') { search.value = ''; expanded = false; renderGrid(); search.blur(); } });
  document.addEventListener('keydown', (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k' && section.getBoundingClientRect().top < innerHeight && section.getBoundingClientRect().bottom > 0) {
      event.preventDefault();
      search.focus();
    }
  });
  showMore.addEventListener('click', () => {
    if (isFallback) { window.open(profileUrl, '_blank', 'noopener'); return; }
    expanded = !expanded;
    renderGrid();
  });

  if (location.protocol === 'file:') initialise(featuredFallback, false);
  else fetch('assets/credly.json', { cache: 'no-store' })
    .then((response) => { if (!response.ok) throw new Error('Credential data unavailable'); return response.json(); })
    .then((items) => initialise(Array.isArray(items) ? items : featuredFallback, !Array.isArray(items)))
    .catch(() => initialise(featuredFallback, false));
});
