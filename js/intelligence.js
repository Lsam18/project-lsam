document.addEventListener('DOMContentLoaded', () => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const escapeHtml = (value = '') => String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]);
  const formatDate = (value) => {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Named public feeds only. No generated incidents, routes or counters.
  const feedState = { kev: [], news: [], dshield: [], feodo: [], threatMode: 'offline', refreshedAt: null, dshieldUpdatedAt: null };
  const kevUrl = 'https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json';
  const kevOfficialMirror = 'https://raw.githubusercontent.com/cisagov/kev-data/develop/known_exploited_vulnerabilities.json';
  const kevCorsFallback = `https://api.allorigins.win/raw?url=${encodeURIComponent(kevUrl)}`;
  const rssUrl = 'https://feeds.feedburner.com/TheHackersNews';
  const newsProxy = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;
  const microsoftRssUrl = 'https://www.microsoft.com/en-us/security/blog/feed/';
  const microsoftProxy = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(microsoftRssUrl)}`;
  const microsoftCacheKey = 'whoislsam.microsoft-security.v1';
  const microsoftCacheMs = 24 * 60 * 60 * 1000;
  let microsoftItems = [];
  let microsoftFilter = 'all';
  const dshieldUrl = 'https://feeds.dshield.org/feeds/block.txt';
  const dshieldRelay = `https://api.allorigins.win/raw?url=${encodeURIComponent(dshieldUrl)}`;
  const feodoUrl = 'https://feodotracker.abuse.ch/downloads/ipblocklist_recommended.json';
  const feodoRelay = `https://api.allorigins.win/raw?url=${encodeURIComponent(feodoUrl)}`;
  const countryCentroids = {
    US: [-98.6, 39.8], ZA: [24.7, -28.5], TR: [35.2, 39.1], GB: [-3.4, 55.4],
    DE: [10.4, 51.2], ES: [-3.7, 40.4], IR: [53.7, 32.4], RO: [24.9, 45.9]
  };
  const fetchWithTimeout = (url, type = 'json', timeout = 9000) => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), timeout);
    return fetch(url, { cache: 'no-store', signal: controller.signal })
      .then((response) => { if (!response.ok) throw new Error(`${response.status} ${url}`); return type === 'text' ? response.text() : response.json(); })
      .finally(() => window.clearTimeout(timer));
  };
  const parseDshield = (text) => {
    const updated = text.match(/updated:\s*([^\r\n]+)/i)?.[1]?.trim() || null;
    const records = text.split(/\r?\n/).filter((line) => line && !line.startsWith('#')).map((line) => {
      const [start, end, cidr, targets, network, country] = line.split('\t');
      return { start, end, cidr: Number(cidr), targets: Number(targets), network: network === '-' ? 'UNATTRIBUTED' : network, country: country && country !== '-' ? country : null };
    }).filter((item) => item.start && Number.isFinite(item.targets));
    return { updatedAt: updated ? `${updated.replace(/Z$/, '')}Z` : null, records };
  };
  const sourceSnapshot = () => window.__THREAT_SNAPSHOT__ || { dshield: { records: [] }, feodo: { records: [] } };
  const retrieveThreatIntel = async () => {
    // file:// previews cannot call the same-origin relay. Show the last verified
    // provider capture immediately and label it as a snapshot.
    if (location.protocol === 'file:') return sourceSnapshot();
    if (/^https?:$/.test(location.protocol)) {
      try {
        const live = await fetchWithTimeout('/api/threat-intel');
        if (live?.dshield?.records?.length) return { ...live, mode: 'live-api' };
      } catch (_) {}
    }
    try {
      const [dshieldText, feodo] = await Promise.all([fetchWithTimeout(dshieldUrl, 'text'), fetchWithTimeout(feodoUrl)]);
      const dshield = parseDshield(dshieldText);
      if (dshield.records.length) return { mode: 'live-provider', retrievedAt: new Date().toISOString(), dshield, feodo: { records: Array.isArray(feodo) ? feodo : [] } };
    } catch (_) {}
    try {
      const [dshieldText, feodo] = await Promise.all([fetchWithTimeout(dshieldRelay, 'text', 12000), fetchWithTimeout(feodoRelay, 'json', 12000)]);
      const dshield = parseDshield(dshieldText);
      if (dshield.records.length) return { mode: 'live-relay', retrievedAt: new Date().toISOString(), dshield, feodo: { records: Array.isArray(feodo) ? feodo : [] } };
    } catch (_) {}
    return sourceSnapshot();
  };
  const ageLabel = (value) => {
    const time = new Date(value).getTime();
    if (!Number.isFinite(time)) return 'UNKNOWN';
    const hours = Math.max(0, (Date.now() - time) / 36e5);
    if (hours < 1) return '<1H';
    if (hours < 24) return `${Math.floor(hours)}H`;
    return `${Math.floor(hours / 24)}D`;
  };
  const setMapReadout = (kicker, title, detail) => {
    const readout = document.getElementById('map-readout');
    if (readout) readout.innerHTML = `<small>${escapeHtml(kicker)}</small><strong>${escapeHtml(title)}</strong><span>${escapeHtml(detail)}</span>`;
  };
  const selectThreatRecord = (index) => {
    const record = feedState.dshield[index];
    if (!record) return;
    document.querySelectorAll('.network-row').forEach((row) => row.classList.toggle('active', Number(row.dataset.index) === index));
    document.querySelectorAll('.threat-point').forEach((point) => point.classList.toggle('active', point.dataset.country === record.country));
    setMapReadout('VERIFIED DSHIELD RECORD', `${record.start}/${record.cidr} · ${record.network}`, `${record.targets.toLocaleString()} targets reported scans from this netblock · source country ${record.country || 'not supplied'} · no destination route inferred`);
  };
  const renderThreatMap = (payload) => {
    const records = Array.isArray(payload?.dshield?.records) ? payload.dshield.records : [];
    feedState.dshield = records;
    feedState.feodo = Array.isArray(payload?.feodo?.records) ? payload.feodo.records : [];
    feedState.threatMode = payload?.mode || 'verified-snapshot';
    feedState.dshieldUpdatedAt = payload?.dshield?.updatedAt || payload?.snapshotAt || null;
    const mode = document.getElementById('source-mode');
    const isLive = String(feedState.threatMode).startsWith('live');
    if (mode) { mode.textContent = isLive ? 'LIVE PROVIDER RESPONSE' : 'VERIFIED SOURCE SNAPSHOT'; mode.className = isLive ? 'live' : 'snapshot'; }
    const connection = document.getElementById('intel-connection');
    const statusBar = document.querySelector('.intel-status');
    if (connection) connection.innerHTML = `<i></i> ${isLive ? 'LIVE SOURCES VERIFIED' : 'VERIFIED DATA · LIVE REFRESH RETRYING'}`;
    statusBar?.classList.toggle('degraded', !isLive);
    const points = document.getElementById('threat-points');
    const grouped = records.reduce((acc, record) => {
      if (!record.country || !countryCentroids[record.country]) return acc;
      (acc[record.country] ||= []).push(record);
      return acc;
    }, {});
    if (points) points.innerHTML = Object.entries(grouped).map(([country, items], position) => {
      const [lon, lat] = countryCentroids[country];
      const x = ((lon + 180) / 360) * 1000;
      const y = ((90 - lat) / 180) * 500;
      const total = items.reduce((sum, item) => sum + item.targets, 0);
      const radius = Math.min(11, 5 + items.length * 1.2);
      return `<g class="threat-point" data-country="${country}" data-total="${total}" transform="translate(${x.toFixed(1)} ${y.toFixed(1)})" role="button" tabindex="0" aria-label="${country}: ${items.length} networks, ${total} reporting targets"><circle class="point-halo" r="${radius}" style="animation-delay:-${position * .37}s"></circle><circle class="point-core" r="${Math.max(3.5, radius / 2)}"></circle><text class="point-label" x="${radius + 7}" y="4">${country} · ${items.length}</text></g>`;
    }).join('');
    points?.querySelectorAll('.threat-point').forEach((point) => {
      const showCountry = () => {
        const country = point.dataset.country;
        const items = grouped[country] || [];
        const total = items.reduce((sum, item) => sum + item.targets, 0);
        document.querySelectorAll('.threat-point').forEach((item) => item.classList.toggle('active', item === point));
        setMapReadout('COUNTRY-LEVEL AGGREGATE', `${country} · ${items.length} observed netblock${items.length === 1 ? '' : 's'}`, `${total.toLocaleString()} reporting targets across the DShield records shown · marker located at country centroid`);
      };
      point.addEventListener('click', showCountry);
      point.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); showCountry(); } });
    });
    const list = document.getElementById('network-list');
    const maxTargets = Math.max(1, ...records.map((record) => Number(record.targets) || 0));
    if (list) list.innerHTML = records.length ? records.map((record, index) => `<button class="network-row ${record.country ? '' : 'unknown'}" data-index="${index}" data-search="${escapeHtml(`${record.start}/${record.cidr} ${record.network} ${record.country || ''}`.toLowerCase())}" style="--intensity:${Math.round((Number(record.targets) / maxTargets) * 100)}" type="button"><span>${String(index + 1).padStart(2, '0')}</span><span><strong>${escapeHtml(record.start)}/${record.cidr}</strong><small>${escapeHtml(record.network)} · ${escapeHtml(record.country || 'COUNTRY NOT SUPPLIED')}</small></span><em><b>${Number(record.targets).toLocaleString()}</b>TARGETS</em></button>`).join('') : '<div class="feed-error"><strong>NO RECORDS RETURNED</strong>The source returned no usable observations. No fallback points were invented.</div>';
    list?.querySelectorAll('.network-row').forEach((row) => row.addEventListener('click', () => selectThreatRecord(Number(row.dataset.index))));
    const search = document.getElementById('network-search');
    if (search) search.oninput = () => {
      const term = search.value.trim().toLowerCase();
      let visible = 0;
      list?.querySelectorAll('.network-row').forEach((row) => {
        const match = !term || row.dataset.search.includes(term);
        row.hidden = !match;
        if (match) visible += 1;
      });
      const count = document.getElementById('network-count');
      if (count) count.textContent = term ? `${visible} / ${records.length}` : `${records.length} RECORDS`;
    };
    const distribution = document.getElementById('threat-distribution');
    if (distribution) distribution.innerHTML = records.map((record) => `<i style="--level:${Math.max(12, Math.round((Number(record.targets) / maxTargets) * 100))}" title="${escapeHtml(record.start)}/${record.cidr}: ${Number(record.targets).toLocaleString()} targets"></i>`).join('');
    const ticker = document.getElementById('threat-ticker-track');
    if (ticker) {
      const stream = records.slice(0, 10).map((record) => `<b>${escapeHtml(record.start)}/${record.cidr}</b> · ${escapeHtml(record.country || 'N/A')} · ${Number(record.targets).toLocaleString()} TARGETS <i>◆</i>`).join(' ');
      ticker.innerHTML = `${stream} ${stream}`;
    }
    const totalTargets = records.reduce((sum, record) => sum + Number(record.targets || 0), 0);
    const countries = new Set(records.map((record) => record.country).filter(Boolean));
    const setText = (id, value) => { const el = document.getElementById(id); if (el) el.textContent = value; };
    setText('network-count', `${records.length} RECORDS`);
    setText('stat-networks', records.length.toLocaleString());
    setText('stat-targets', totalTargets.toLocaleString());
    setText('stat-countries', countries.size.toLocaleString());
    setText('stat-age', ageLabel(feedState.dshieldUpdatedAt));
    setText('stat-date', feedState.dshieldUpdatedAt ? new Date(feedState.dshieldUpdatedAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'Timestamp unavailable');
    if (records.length) selectThreatRecord(0);
    renderFeodo(feedState.feodo);
  };
  const renderFeodo = (records) => {
    const summary = document.getElementById('feodo-summary');
    const container = document.getElementById('feodo-feed');
    if (summary) summary.textContent = records.length ? `${records.length} record${records.length === 1 ? '' : 's'} returned by the recommended provider feed. Provider status and last-online time are shown exactly.` : 'The recommended provider feed is currently empty. That is a valid result—not a reason to fabricate C2 nodes.';
    if (!container) return;
    container.innerHTML = records.length ? records.slice(0, 3).map((item) => `<article class="c2-record"><i></i><div><strong>${escapeHtml(item.ip_address)}:${escapeHtml(item.port)}</strong><small>${escapeHtml(item.malware)} · ${escapeHtml(item.as_name)} · ${escapeHtml(item.country)}</small></div><span>${escapeHtml(String(item.status).toUpperCase())}<br>LAST ${escapeHtml(item.last_online)}</span></article>`).join('') : '<div class="c2-empty"><strong>0 ACTIVE RECORDS RETURNED</strong><br>No substitute data displayed.</div>';
  };
  const renderKev = (items) => {
    const container = document.getElementById('kev-feed');
    if (!container) return;
    container.innerHTML = items.slice(0, 10).map((item) => `<article class="feed-item"><div><span class="feed-code">${escapeHtml(item.cveID)}</span><time>${escapeHtml(formatDate(item.dateAdded))}</time></div><div><h4>${escapeHtml(item.vendorProject)} · ${escapeHtml(item.product)}</h4><p>${escapeHtml(item.vulnerabilityName)}</p><a href="https://nvd.nist.gov/vuln/detail/${encodeURIComponent(item.cveID)}" target="_blank" rel="noopener">VIEW CVE ↗</a>${item.knownRansomwareCampaignUse === 'Known' ? '<span class="ransomware">RANSOMWARE USE</span>' : ''}</div></article>`).join('');
  };
  const renderNews = (items) => {
    const container = document.getElementById('cyber-news-feed');
    if (!container) return;
    container.innerHTML = items.slice(0, 10).map((item) => `<article class="feed-item"><time>${escapeHtml(formatDate(item.pubDate))}</time><div><h4>${escapeHtml(item.title)}</h4><p>${escapeHtml((item.description || '').replace(/<[^>]+>/g, '').slice(0, 180))}${item.description?.length > 180 ? '…' : ''}</p><a href="${escapeHtml(item.link)}" target="_blank" rel="noopener">READ REPORT ↗</a></div></article>`).join('');
  };
  const renderFeedError = (id, label, href) => {
    const container = document.getElementById(id);
    if (container) container.innerHTML = `<div class="feed-error"><strong>LIVE CONNECTION UNAVAILABLE</strong>The browser or network blocked this cross-origin feed. No placeholder data is being shown.<br><a href="${href}" target="_blank" rel="noopener">OPEN ${label} DIRECTLY ↗</a></div>`;
  };
  const stripMarkup = (value = '') => String(value).replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#8217;|&rsquo;/g, '’').replace(/\s+/g, ' ').trim();
  const microsoftCategory = (item) => {
    const text = `${item.title || ''} ${stripMarkup(item.description || '')} ${(item.categories || []).join(' ')}`.toLowerCase();
    if (/sentinel|siem|kql|security operations center|\bsoc\b/.test(text)) return 'sentinel';
    if (/entra|identity|active directory|authentication|credential/.test(text)) return 'identity';
    if (/defender|xdr|endpoint|office 365/.test(text)) return 'defender';
    if (/azure|cloud security|cloud-native/.test(text)) return 'azure';
    return 'threat';
  };
  const isOfficialMicrosoftLink = (value) => {
    try {
      const host = new URL(value).hostname.toLowerCase();
      return host === 'microsoft.com' || host.endsWith('.microsoft.com');
    } catch (_) { return false; }
  };
  const renderMicrosoftFeed = () => {
    const container = document.getElementById('ms-security-feed');
    if (!container) return;
    const visible = microsoftItems.filter((item) => microsoftFilter === 'all' || item.category === microsoftFilter).slice(0, 9);
    container.innerHTML = visible.length ? visible.map((item, index) => `<article class="ms-story" style="--story-index:${index}"><div class="ms-story-meta"><span>${escapeHtml(item.category.toUpperCase())}</span><time>${escapeHtml(formatDate(item.pubDate))}</time></div><h4>${escapeHtml(item.title)}</h4><p>${escapeHtml(stripMarkup(item.description).slice(0, 210))}${stripMarkup(item.description).length > 210 ? '…' : ''}</p><a href="${escapeHtml(item.link)}" target="_blank" rel="noopener">READ ON MICROSOFT ↗</a></article>`).join('') : `<div class="ms-no-results"><strong>NO MATCHING ITEMS IN THE CURRENT FEED</strong><span>Try “All signals” or open the official specialist source below.</span></div>`;
  };
  const setMicrosoftStatus = (label, timestamp, mode = 'live') => {
    const state = document.getElementById('ms-sync-state');
    const time = document.getElementById('ms-sync-time');
    if (state) { state.className = `ms-sync-state ${mode}`; state.querySelector('span').textContent = label; }
    if (time) time.textContent = timestamp ? `SYNC ${new Date(timestamp).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}` : 'TIMESTAMP UNAVAILABLE';
  };
  const loadMicrosoftCache = () => {
    try {
      const cached = JSON.parse(localStorage.getItem(microsoftCacheKey) || 'null');
      if (!cached || !Array.isArray(cached.items) || !cached.items.length) return null;
      return cached;
    } catch (_) { return null; }
  };
  const refreshMicrosoftSecurity = async (force = false) => {
    const cached = loadMicrosoftCache();
    if (!force && cached && Date.now() - Number(cached.fetchedAt) < microsoftCacheMs) {
      microsoftItems = cached.items;
      renderMicrosoftFeed();
      setMicrosoftStatus('OFFICIAL FEED · DAILY CACHE', cached.fetchedAt, 'cached');
      return;
    }
    setMicrosoftStatus('SYNCING OFFICIAL MICROSOFT FEED', null, 'syncing');
    try {
      const payload = await fetchWithTimeout(microsoftProxy, 'json', 15000);
      if (payload?.status !== 'ok' || !Array.isArray(payload.items)) throw new Error('Microsoft RSS relay returned no items');
      const items = payload.items.filter((item) => isOfficialMicrosoftLink(item.link)).map((item) => ({ title: item.title || 'Untitled Microsoft security update', link: item.link, pubDate: item.pubDate, description: item.description || item.content || '', categories: Array.isArray(item.categories) ? item.categories : [], category: microsoftCategory(item) })).sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
      if (!items.length) throw new Error('No Microsoft-owned article links returned');
      microsoftItems = items;
      const fetchedAt = Date.now();
      localStorage.setItem(microsoftCacheKey, JSON.stringify({ fetchedAt, items }));
      renderMicrosoftFeed();
      setMicrosoftStatus('LIVE · OFFICIAL MICROSOFT RSS', fetchedAt, 'live');
    } catch (_) {
      if (cached) {
        microsoftItems = cached.items;
        renderMicrosoftFeed();
        setMicrosoftStatus('LAST VERIFIED CACHE · LIVE RETRY FAILED', cached.fetchedAt, 'degraded');
      } else {
        const container = document.getElementById('ms-security-feed');
        if (container) container.innerHTML = '<div class="feed-error"><strong>OFFICIAL FEED TEMPORARILY UNAVAILABLE</strong>No synthetic Microsoft headlines are being substituted. Use the verified source links below to view the publishers directly.</div>';
        setMicrosoftStatus('SOURCE UNAVAILABLE · NO FAKE DATA', null, 'degraded');
      }
    }
  };
  document.querySelectorAll('[data-ms-filter]').forEach((button) => button.addEventListener('click', () => {
    microsoftFilter = button.dataset.msFilter;
    document.querySelectorAll('[data-ms-filter]').forEach((item) => item.classList.toggle('active', item === button));
    renderMicrosoftFeed();
  }));
  document.getElementById('ms-refresh')?.addEventListener('click', () => refreshMicrosoftSecurity(true));
  const refreshFeeds = async () => {
    const status = document.getElementById('intel-updated');
    if (status) status.textContent = 'SYNCING FEEDS…';
    const [threatResult, kevResult, newsResult] = await Promise.allSettled([
      retrieveThreatIntel(),
      fetch(kevUrl, { cache: 'no-store' }).then((response) => { if (!response.ok) throw new Error('CISA response failed'); return response.json(); }).catch(() => fetch(kevOfficialMirror, { cache: 'no-store' }).then((response) => { if (!response.ok) throw new Error('CISA mirror failed'); return response.json(); })).catch(() => fetch(kevCorsFallback, { cache: 'no-store' }).then((response) => { if (!response.ok) throw new Error('CISA proxy response failed'); return response.json(); })),
      fetch(newsProxy, { cache: 'no-store' }).then((response) => { if (!response.ok) throw new Error('News response failed'); return response.json(); })
    ]);
    if (threatResult.status === 'fulfilled') renderThreatMap(threatResult.value);
    else renderThreatMap(sourceSnapshot());
    if (kevResult.status === 'fulfilled' && Array.isArray(kevResult.value.vulnerabilities)) {
      feedState.kev = [...kevResult.value.vulnerabilities].sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
      renderKev(feedState.kev);
    } else renderFeedError('kev-feed', 'CISA KEV', 'https://www.cisa.gov/known-exploited-vulnerabilities-catalog');
    if (newsResult.status === 'fulfilled' && Array.isArray(newsResult.value.items)) {
      feedState.news = newsResult.value.items;
      renderNews(feedState.news);
    } else renderFeedError('cyber-news-feed', 'THE HACKER NEWS', 'https://thehackernews.com/');
    feedState.refreshedAt = new Date();
    if (status) status.textContent = `${String(feedState.threatMode).startsWith('live') ? 'LIVE SYNC' : 'SOURCE UPDATE'} ${feedState.dshieldUpdatedAt ? new Date(feedState.dshieldUpdatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : feedState.refreshedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };
  document.getElementById('intel-refresh')?.addEventListener('click', refreshFeeds);
  renderThreatMap(sourceSnapshot());
  refreshFeeds();
  window.setInterval(refreshFeeds, 10 * 60 * 1000);
  refreshMicrosoftSecurity();
  window.setInterval(() => refreshMicrosoftSecurity(true), microsoftCacheMs);

  // Connected capability graph.
  const skillData = {
    'SOC Operations': '24×7 monitoring, SLA-driven triage, shift handover, incident lifecycle and client communication.',
    'Microsoft Sentinel': 'Log onboarding, DCRs, analytics rules, workbooks, automation and hybrid SIEM architecture.',
    'KQL Detection Engineering': 'High-fidelity analytics for identity threats, lateral movement, privilege escalation and anomaly detection.',
    'Defender XDR': 'Endpoint and identity signal correlation, investigation, evidence validation and response recommendations.',
    'Identity Threats': 'Password spray, impossible travel, anomalous authentication, risky sessions and account compromise.',
    'Incident Response': 'Attack timelines, containment guidance, impact assessment, documentation and escalation.',
    'MITRE ATT&CK': 'Detection mapping, coverage analysis, adversary emulation and structured analyst triage.',
    'Splunk & Cloud SIEM': 'SPL, AWS GuardDuty ingestion, dashboards, severity KPIs and cloud threat monitoring.'
  };
  const map = document.getElementById('skill-map');
  const svg = map?.querySelector('.skill-lines');
  const nodes = [...document.querySelectorAll('.skill-node')];
  const drawConnections = () => {
    if (!map || !svg) return;
    const box = map.getBoundingClientRect();
    svg.innerHTML = '';
    const core = nodes.find((node) => node.classList.contains('core'));
    if (!core) return;
    const coreBox = core.getBoundingClientRect();
    nodes.filter((node) => node !== core).forEach((node) => {
      const nodeBox = node.getBoundingClientRect();
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', coreBox.left - box.left + coreBox.width / 2);
      line.setAttribute('y1', coreBox.top - box.top + coreBox.height / 2);
      line.setAttribute('x2', nodeBox.left - box.left + nodeBox.width / 2);
      line.setAttribute('y2', nodeBox.top - box.top + nodeBox.height / 2);
      line.dataset.target = node.dataset.skill;
      svg.appendChild(line);
    });
  };
  nodes.forEach((node) => node.addEventListener('click', () => {
    nodes.forEach((item) => item.classList.toggle('active', item === node));
    svg?.querySelectorAll('line').forEach((line) => line.classList.toggle('active', line.dataset.target === node.dataset.skill || node.classList.contains('core')));
    const intel = document.getElementById('skill-intel');
    if (intel) intel.innerHTML = `<small>CAPABILITY INTELLIGENCE</small><h3>${escapeHtml(node.dataset.skill)}</h3><p>${escapeHtml(skillData[node.dataset.skill])}</p>`;
  }));
  drawConnections();
  window.addEventListener('resize', drawConnections, { passive: true });

  // Local retrieval assistant grounded in the complete portfolio data.
  const panel = document.getElementById('ai-panel');
  const queryInput = document.getElementById('ai-query');
  const log = document.getElementById('ai-log');
  const memory = { lastTopic: '', turns: 0 };
  let projects = [];
  let knowledge = [
    { type: 'profile', title: 'Lakshan Sameer', text: 'Public identity Lakshan Sameer. Legal name Lakshan Sameera. SOC Analyst and Security Engineer based in Sri Lanka.', target: '#about' },
    { type: 'experience', title: 'Security Specialist — MXDR365 | Security Analyst', text: 'Patriot Consulting Technology Group. 24x7 managed SOC, Microsoft Sentinel, Defender XDR, alert triage, identity investigations, Microsoft 365 telemetry, attack timelines, escalation and shift handover.', target: '#journey' },
    { type: 'experience', title: 'DIMIYA Tech Security Engineer', text: 'MSSP multi-tenant SIEM, Adlumin, CrowdStrike, log onboarding, MITRE ATT&CK detection rules, SOAR playbooks, incident response, ticket lifecycle and client communication.', target: '#journey' },
    { type: 'experience', title: 'NOVAIZE Cyber Security Analyst', text: 'Azure Sentinel, Splunk, credential theft, command and control, lateral movement, privilege escalation, anomaly detection, red team and purple team operations.', target: '#journey' },
    { type: 'education', title: 'BSc Computer Security', text: 'University of Plymouth First Class Honours completed May 2025 with final aggregate 70 percent.', target: '#journey' },
    ...Object.entries(skillData).map(([title, text]) => ({ type: 'skill', title, text, target: '#constellation' }))
  ];
  const registerProjects = (data) => {
    projects = Array.isArray(data) ? data : [];
    knowledge = knowledge.filter((item) => item.type !== 'project');
    knowledge.push(...projects.map((project) => ({ type: 'project', title: project.title, text: `${project.description || ''} ${project.long_description || ''} ${(project.skills || []).join(' ')} ${(project.categories || []).join(' ')}`, target: '#work', project })));
  };
  document.addEventListener('projects:loaded', (event) => registerProjects(event.detail));
  if (Array.isArray(window.__PROJECTS__)) registerProjects(window.__PROJECTS__);
  else if (location.protocol !== 'file:') fetch('assets/projects.json').then((response) => response.json()).then(registerProjects).catch(() => {});
  document.addEventListener('medium:loaded', (event) => {
    knowledge = knowledge.filter((item) => item.type !== 'article');
    const articles = Array.isArray(event.detail) ? event.detail : [];
    knowledge.push(...articles.map((article) => ({ type: 'article', title: article.title, text: `${String(article.description || '').replace(/<[^>]+>/g, ' ')} ${(article.categories || []).join(' ')}`, target: '#writing', article })));
  });
  document.addEventListener('credentials:loaded', (event) => {
    knowledge = knowledge.filter((item) => item.type !== 'credential');
    const credentials = Array.isArray(event.detail) ? event.detail : [];
    knowledge.push(...credentials.map((credential) => ({ type: 'credential', title: credential.title, text: `${credential.issuer || ''} ${credential.issuerKey || ''} cybersecurity certification badge`, target: '#credentials', credential })));
  });
  const tokenize = (text) => String(text).toLowerCase().replace(/[^a-z0-9+#.]+/g, ' ').split(/\s+/).filter((word) => word.length > 1);
  const searchKnowledge = (input) => {
    const tokens = tokenize(input);
    return knowledge.map((item) => {
      const title = item.title.toLowerCase();
      const bodyTokens = new Set(tokenize(`${item.title} ${item.text} ${item.type}`));
      const score = tokens.reduce((total, token) => total + (title.includes(token) ? 5 : bodyTokens.has(token) ? 2 : [...bodyTokens].some((word) => word.startsWith(token)) ? 1 : 0), 0);
      return { ...item, score };
    }).filter((item) => item.score > 0).sort((a, b) => b.score - a.score).slice(0, 5);
  };
  const togglePanel = (open) => {
    panel?.classList.toggle('open', open);
    panel?.setAttribute('aria-hidden', String(!open));
    if (open) window.setTimeout(() => queryInput?.focus(), 250);
  };
  document.getElementById('ai-trigger')?.addEventListener('click', () => togglePanel(true));
  document.getElementById('ai-close')?.addEventListener('click', () => togglePanel(false));
  document.addEventListener('keydown', (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); togglePanel(!panel?.classList.contains('open')); }
    if (event.key === 'Escape') togglePanel(false);
  });
  const addMessage = (type, html) => {
    if (!log) return;
    const message = document.createElement('div');
    message.className = `ai-message ${type}`;
    message.innerHTML = `<small>${type === 'user' ? 'YOU / QUERY' : 'LSAM INTELLIGENCE / GROUNDED'}</small><p>${html}</p>`;
    log.appendChild(message);
    log.scrollTop = log.scrollHeight;
  };
  const showThinking = () => {
    if (!log) return null;
    const el = document.createElement('div'); el.className = 'ai-thinking'; el.innerHTML = '<i></i><i></i><i></i>'; log.appendChild(el); log.scrollTop = log.scrollHeight; return el;
  };
  const resultCards = (items) => `<span class="ai-result-list">${items.map((item) => `<a class="ai-result" href="${item.target}"><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.type.toUpperCase())} · MATCH ${item.score}</span></a>`).join('')}</span>`;
  const helpText = 'Commands: <code>/projects keyword</code>, <code>/articles keyword</code>, <code>/credentials keyword</code>, <code>/skills</code>, <code>/experience</code>, <code>/threats</code>, <code>/ioc IP-or-network</code>, <code>/cve CVE-ID</code>, <code>/sources</code>, <code>/news</code>, <code>/contact</code>, <code>/clear</code>. Normal questions and follow-ups work too.';
  const answerQuery = (input) => {
    const clean = input.trim();
    const lower = clean.toLowerCase();
    if (lower === '/clear') { if (log) log.innerHTML = ''; memory.lastTopic = ''; return 'Conversation cleared.'; }
    if (lower === '/help' || lower === 'help') return helpText;
    if (lower.startsWith('/projects')) {
      const term = clean.replace(/^\/projects/i, '').trim();
      const matches = term ? searchKnowledge(`${term} project`).filter((item) => item.type === 'project') : knowledge.filter((item) => item.type === 'project').slice(0, 5);
      return matches.length ? `Found ${matches.length} relevant project${matches.length === 1 ? '' : 's'}.${resultCards(matches)}` : 'No matching project was found. Try Sentinel, AWS, SIEM, threat intelligence or automation.';
    }
    if (lower.startsWith('/articles') || /\b(medium article|my writing|research article)\b/.test(lower)) {
      const term = clean.replace(/^\/articles/i, '').trim();
      const matches = term ? searchKnowledge(`${term} article`).filter((item) => item.type === 'article') : knowledge.filter((item) => item.type === 'article').slice(0, 5);
      return matches.length ? `Found ${matches.length} published Medium article${matches.length === 1 ? '' : 's'}.${resultCards(matches)}` : 'The Medium feed is still connecting, or no article matched that topic. <a href="#writing">Open the writing archive →</a>';
    }
    if (lower.startsWith('/credentials') || /\b(certification|certifications|certificate|credentials|credly badge)\b/.test(lower)) {
      const term = clean.replace(/^\/credentials/i, '').trim();
      const matches = term ? searchKnowledge(`${term} credential`).filter((item) => item.type === 'credential') : knowledge.filter((item) => item.type === 'credential').slice(0, 6);
      return matches.length ? `Found ${matches.length} matching credential${matches.length === 1 ? '' : 's'}.${resultCards(matches)}` : 'The credential register is still loading, or no record matched that issuer. <a href="#credentials">Open the credential vault →</a>';
    }
    if (lower === '/sources' || /\b(data source|where.*data|real or fake|provenance)\b/.test(lower)) {
      return `Threat telemetry is grounded in <a href="https://isc.sans.edu/feeds_doc.html" target="_blank" rel="noopener">SANS ISC / DShield</a>, <a href="https://feodotracker.abuse.ch/blocklist/" target="_blank" rel="noopener">abuse.ch Feodo Tracker</a> and <a href="https://www.cisa.gov/known-exploited-vulnerabilities-catalog" target="_blank" rel="noopener">CISA KEV</a>. Map mode: <code>${escapeHtml(feedState.threatMode)}</code>. DShield source timestamp: <code>${escapeHtml(feedState.dshieldUpdatedAt || 'unavailable')}</code>. There are no generated incidents or random routes.`;
    }
    if (lower.startsWith('/ioc') || /\b(ioc|indicator|netblock|attacking network)\b/.test(lower)) {
      const term = clean.replace(/^\/ioc/i, '').trim().toLowerCase();
      const matches = feedState.dshield.filter((record) => !term || `${record.start}/${record.cidr} ${record.network} ${record.country}`.toLowerCase().includes(term)).slice(0, 5);
      return matches.length ? `Verified DShield observations:${matches.map((record) => `<span class="ai-ioc"><code>${escapeHtml(record.start)}/${record.cidr}</code> · ${escapeHtml(record.network)} · ${Number(record.targets).toLocaleString()} reporting targets · ${escapeHtml(record.country || 'country unavailable')}</span>`).join('')}<a href="#threat-intel">Inspect on the evidence map →</a>` : 'No matching IOC exists in the currently loaded DShield top-networks feed. This assistant will not invent one.';
    }
    if (lower.startsWith('/cve') || /\b(cve-|exploited cve|latest exploited|known exploited)\b/.test(lower)) {
      const id = clean.match(/CVE-\d{4}-\d{4,}/i)?.[0]?.toUpperCase();
      const matches = id ? feedState.kev.filter((item) => item.cveID === id) : feedState.kev.slice(0, 5);
      if (matches.length) return `${id ? `${id} is present in the loaded CISA KEV catalog.` : 'Latest CISA KEV additions:'}${matches.map((item) => `<span class="ai-ioc"><code>${escapeHtml(item.cveID)}</code> · ${escapeHtml(item.vendorProject)} ${escapeHtml(item.product)} · added ${escapeHtml(formatDate(item.dateAdded))}</span>`).join('')}<a href="#threat-intel">Open the CISA feed →</a>`;
      return id ? `${escapeHtml(id)} is not present in the currently loaded CISA KEV catalog. That does not prove it is safe; it only means CISA KEV did not return a match. <a href="https://nvd.nist.gov/vuln/detail/${encodeURIComponent(id)}" target="_blank" rel="noopener">Check NVD →</a>` : 'CISA KEV is not connected in this browser right now.';
    }
    if (lower.includes('/threat') || lower.includes('live threat') || lower.includes('observed threat') || lower.includes('current attack')) {
      memory.lastTopic = 'threat intelligence';
      const top = feedState.dshield.slice(0, 3);
      return top.length ? `The loaded DShield feed contains <strong>${feedState.dshield.length}</strong> observed attacking /24 networks. Highest current records: ${top.map((item) => `<code>${escapeHtml(item.start)}/${item.cidr}</code> ${escapeHtml(item.network)} (${Number(item.targets).toLocaleString()} reporting targets)`).join(' · ')}. Mode: <code>${escapeHtml(feedState.threatMode)}</code>. <a href="#threat-intel">Open evidence map →</a>` : 'No DShield threat records are loaded. The interface is intentionally showing no substitute telemetry. <a href="#threat-intel">Open source status →</a>';
    }
    if (lower.includes('/news') || lower.includes('cyber news') || lower.includes('headline')) {
      const top = feedState.news.slice(0, 3);
      return top.length ? `Current headlines: ${top.map((item) => `<a href="${escapeHtml(item.link)}" target="_blank" rel="noopener">${escapeHtml(item.title)}</a>`).join(' · ')}. <a href="#threat-intel">View full feed →</a>` : 'The news connection is currently unavailable. <a href="#threat-intel">View source status →</a>';
    }
    if (lower.includes('/contact') || /\b(contact|email|hire|available)\b/.test(lower)) return 'Sameer is available to discuss SOC, security engineering and research opportunities. <a href="mailto:lakshan.sam28@gmail.com">lakshan.sam28@gmail.com</a> · <a href="#contact">Open contact section →</a>';
    if (lower === '/skills') return resultCards(knowledge.filter((item) => item.type === 'skill').slice(0, 5));
    if (lower === '/experience') return resultCards(knowledge.filter((item) => item.type === 'experience'));
    if (/how many.*project|project count/.test(lower)) return `The portfolio dataset currently contains <strong>${projects.length}</strong> projects. Use <code>/projects keyword</code> to search them.`;
    const expanded = /\b(it|that|those|this)\b/.test(lower) && memory.lastTopic ? `${memory.lastTopic} ${clean}` : clean;
    const matches = searchKnowledge(expanded);
    if (!matches.length) return `I couldn't ground that question in Sameer’s portfolio or the connected threat feeds. I won’t manufacture an answer. ${helpText}`;
    memory.lastTopic = matches[0].title;
    const lead = matches[0];
    return `<strong>${escapeHtml(lead.title)}</strong> — ${escapeHtml(lead.text.slice(0, 360))}${lead.text.length > 360 ? '…' : ''}${resultCards(matches.slice(0, 4))}`;
  };
  const runQuery = (value) => {
    const clean = value.trim(); if (!clean) return;
    addMessage('user', escapeHtml(clean)); memory.turns += 1;
    const thinking = showThinking();
    window.setTimeout(() => { thinking?.remove(); addMessage('system', answerQuery(clean)); }, reduced ? 0 : 380);
  };
  document.getElementById('ai-form')?.addEventListener('submit', (event) => { event.preventDefault(); runQuery(queryInput?.value || ''); if (queryInput) queryInput.value = ''; });
  document.querySelectorAll('.ai-suggestions button').forEach((button) => button.addEventListener('click', () => runQuery(button.textContent)));
});
