// Renders Credly badges from assets/credly.json
document.addEventListener('DOMContentLoaded', function () {
  const credlySection = document.getElementById('credly');
  if (!credlySection) return;

  const headerHtml = `
    <div class="section-header">
      <h2><i class="fas fa-award"></i> CREDLY BADGES</h2>
      <p>Explore my certifications and earned badges. Click "See Info" to open the badge or profile on Credly.</p>
    </div>
    <div class="credly-controls">
      <div class="credly-filters" id="credly-filters"></div>
      <div class="credly-search-wrapper">
        <input id="credly-search" class="credly-search" placeholder="Search badges..." aria-label="Search badges" />
      </div>
    </div>
    <div id="credly-grid" class="credly-grid"></div>
    <div style="text-align:center; margin-top:1rem;"><a class="btn btn-primary" id="credly-profile-link" target="_blank">Access All My Credly Badges</a></div>
  `;

  credlySection.innerHTML = headerHtml;

  const filtersContainer = document.getElementById('credly-filters');
  const grid = document.getElementById('credly-grid');
  const searchInput = document.getElementById('credly-search');
  const profileLinkBtn = document.getElementById('credly-profile-link');
  // show only a random sample initially
  const initialSampleSize = 8;
  let initialSample = [];
  let showAll = false;

  let badges = [];
  let activeFilter = 'all';

  const filterKeys = ['all','microsoft','cisco','isc2','ibm','google','fortinet','credly','skillfront'];
  const filterLabels = {
    all: 'All',
    microsoft: 'Microsoft',
    cisco: 'Cisco',
    isc2: 'ISC2',
    ibm: 'IBM',
    google: 'Google',
    fortinet: 'Fortinet',
    credly: 'Credly',
    skillfront: 'SkillFront'
  };

  function renderFilters() {
    filtersContainer.innerHTML = '';
    filterKeys.forEach(key => {
      const btn = document.createElement('button');
      btn.className = 'filter-btn' + (key === activeFilter ? ' active' : '');
      btn.textContent = filterLabels[key] || key;
      btn.dataset.key = key;
      btn.addEventListener('click', () => {
        activeFilter = key;
        // user is explicitly filtering — show full filtered results
        showAll = true;
        document.querySelectorAll('#credly-filters .filter-btn').forEach(b=>b.classList.remove('active'));
        btn.classList.add('active');
        renderGrid();
      });
      filtersContainer.appendChild(btn);
    });
  }

  function renderGrid() {
    const q = (searchInput.value || '').toLowerCase().trim();
    grid.innerHTML = '';
    const filtered = badges.filter(b => {
      if (activeFilter !== 'all' && b.issuerKey !== activeFilter) return false;
      if (q && !(b.title.toLowerCase().includes(q) || b.issuer.toLowerCase().includes(q))) return false;
      return true;
    });

    // Decide which list to render:
    // - If not showing all, no active search, and no filter (default), show a randomized initial sample
    // - Otherwise show the filtered/full list
    let list = [];
    if (!showAll && !q && activeFilter === 'all') {
      list = initialSample.length ? initialSample : filtered.slice(0, initialSampleSize);
    } else {
      list = filtered;
    }

    if (list.length === 0) {
      grid.innerHTML = '<p class="no-results">No badges match your search/filter.</p>';
      return;
    }

    list.forEach(b => {
      const card = document.createElement('div');
      card.className = 'credly-card';

      const imgWrap = document.createElement('div');
      imgWrap.className = 'credly-card-img';
      // If an image URL is present, use it; otherwise show initials
      if (b.image) {
        const img = document.createElement('img');
        img.src = b.image;
        img.alt = b.title;
        imgWrap.appendChild(img);
      } else {
        const placeholder = document.createElement('div');
        placeholder.className = 'credly-badge-placeholder';
        placeholder.textContent = b.issuer.split(' ')[0].charAt(0) || 'B';
        imgWrap.appendChild(placeholder);
      }

      const body = document.createElement('div');
      body.className = 'credly-card-body';
      const title = document.createElement('h3');
      title.className = 'credly-card-title';
      title.textContent = b.title;
      const issuer = document.createElement('div');
      issuer.className = 'credly-card-issuer';
      issuer.textContent = b.issuer;

      const actions = document.createElement('div');
      actions.className = 'credly-card-actions';
      const link = document.createElement('a');
      link.className = 'btn btn-secondary';
      link.textContent = 'See Info';
      link.href = b.url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      actions.appendChild(link);

      body.appendChild(title);
      body.appendChild(issuer);
      body.appendChild(actions);

      card.appendChild(imgWrap);
      card.appendChild(body);

      grid.appendChild(card);
    });

    // Show more / Show less control
    const showMoreWrapId = 'credly-showmore-wrap';
    let showMoreWrap = document.getElementById(showMoreWrapId);
    if (!showMoreWrap) {
      showMoreWrap = document.createElement('div');
      showMoreWrap.id = showMoreWrapId;
      showMoreWrap.className = 'credly-showmore-wrap';
      grid.parentNode.insertBefore(showMoreWrap, grid.nextSibling);
    }

    // Only show the toggle when there are more badges than the initial sample and we're on the default filter/search
    if (badges.length > initialSampleSize && activeFilter === 'all' && !q) {
      showMoreWrap.innerHTML = '';
      const btn = document.createElement('button');
      btn.className = 'btn btn-primary credly-showmore-btn';
      btn.textContent = showAll ? 'Show less' : `Show all ${badges.length} badges`;
      btn.addEventListener('click', () => {
        showAll = !showAll;
        renderGrid();
        // scroll into view a bit for UX
        grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      showMoreWrap.appendChild(btn);
    } else {
      showMoreWrap.innerHTML = '';
    }
  }

  function init() {
    fetch('assets/credly.json')
      .then(r => r.json())
      .then(data => {
        badges = data;
        // create a randomized initial sample for first sight
        function shuffle(arr) {
          const a = arr.slice();
          for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
          }
          return a;
        }
        initialSample = shuffle(badges).slice(0, initialSampleSize);
        // if profile link exists, set the profile button
        const profile = badges.find(b => b.issuerKey === 'credly' && b.url);
        if (profile) {
          profileLinkBtn.href = profile.url;
          profileLinkBtn.target = '_blank';
        } else {
          profileLinkBtn.style.display = 'none';
        }
        renderFilters();
        renderGrid();
      })
      .catch(err => {
        console.error('Failed to load credly.json', err);
        grid.innerHTML = '<p class="no-results">Failed to load badges. Try reloading the page.</p>';
      });

    searchInput.addEventListener('input', () => {
      // if user searches, show full results to not hide matches
      showAll = true;
      renderGrid();
    });
  }

  init();
});