// Format long descriptions: convert plaintext into paragraphs and simple lists
function formatLongDescription(text) {
  if (!text) return '';
  // Normalize line endings and trim
  const t = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
  const lines = t.split('\n');
  let out = '';
  let inUl = false, inOl = false;

  const escapeHtml = s => s.replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":"&#39;"})[c]);

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const line = raw.trim();

    // blank line -> close lists and create paragraph break
    if (line === '') {
      if (inUl) { out += '</ul>'; inUl = false; }
      if (inOl) { out += '</ol>'; inOl = false; }
      // add spacing paragraph (empty) to keep visual gaps if desired
      continue;
    }

    // unordered list markers: -, *, •
    if (/^(?:[-*•])\s+/.test(line)) {
      if (!inUl) { out += '<ul>'; inUl = true; }
      out += `<li>${escapeHtml(line.replace(/^(?:[-*•])\s+/,''))}</li>`;
      continue;
    }

    // ordered list markers: 1. or 1)
    if (/^\d+[\.)]\s+/.test(line)) {
      if (!inOl) { out += '<ol>'; inOl = true; }
      out += `<li>${escapeHtml(line.replace(/^\d+[\.)]\s+/,''))}</li>`;
      continue;
    }

    // regular paragraph: close any open lists first
    if (inUl) { out += '</ul>'; inUl = false; }
    if (inOl) { out += '</ol>'; inOl = false; }

    // gather consecutive non-empty non-list lines into one paragraph, preserving single-line breaks as <br>
    let para = escapeHtml(line);
    while (i + 1 < lines.length) {
      const nxt = lines[i+1].trim();
      if (nxt === '') break;
      if (/^(?:[-*•]|\d+[\.)])\s+/.test(nxt)) break;
      para += '<br>' + escapeHtml(nxt);
      i++;
    }
    out += `<p>${para}</p>`;
  }

  if (inUl) out += '</ul>';
  if (inOl) out += '</ol>';

  return out;
}

// --- Modal Popup ---
function createProjectModal(project) {
  const oldModal = document.getElementById('project-modal');
  if (oldModal) oldModal.remove();
  const modal = document.createElement('div');
  modal.id = 'project-modal';
  modal.className = 'project-modal';
  modal.innerHTML = `
    <div class="modal-content">
      <button class="close-modal" id="close-modal" aria-label="Close modal">&times;</button>
      
      <div class="modal-header">
        <h2 class="modal-title">${project.title}</h2>
        <div class="modal-meta">
          <span class="modal-category">${(Array.isArray(project.categories) ? project.categories.join(' • ') : (project.category || ''))}</span>
          <span class="modal-date">${project.date || 'N/A'}</span>
        </div>
      </div>

      ${project.image || (project.images && project.images.length) ? `
        <div class="modal-gallery">
          <img 
            src="${project.image || project.images[0]}" 
            alt="${project.title}" 
            class="modal-main-image"
          />
          ${project.images && project.images.length > 0 ? `
            <div class="modal-thumbnails">
              ${project.images.map(img => `
                <img src='${img}' class='modal-thumb' alt="Project screenshot" />
              `).join('')}
            </div>
          ` : ''}
        </div>
      ` : ''}

      <div class="modal-body">
        <div class="modal-description">
          ${formatLongDescription(project.long_description ? project.long_description : project.description)}
        </div>

        <div class="modal-skills-section">
          <h3>Technologies & Skills</h3>
          <div class="modal-skills">
            ${(project.skills || []).map(skill => `<span class="project-skill">${skill}</span>`).join('')}
          </div>
        </div>

        <a href="${project.link}" target="_blank" rel="noopener" class="modal-link">
          View Full Project
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
            <polyline points="15 3 21 3 21 9"></polyline>
            <line x1="10" y1="14" x2="21" y2="3"></line>
          </svg>
        </a>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  
  // Handle thumbnail clicks to update main image
  const thumbs = modal.querySelectorAll('.modal-thumb');
  const mainImg = modal.querySelector('.modal-main-image');
  if (thumbs.length && mainImg) {
    thumbs.forEach(thumb => {
      thumb.onclick = () => {
        mainImg.src = thumb.src;
        thumbs.forEach(t => t.classList.remove('active'));
        thumb.classList.add('active');
      };
    });
    // Activate first thumb
    thumbs[0].classList.add('active');
  }

  document.getElementById('close-modal').onclick = () => modal.remove();
  modal.onclick = e => { if (e.target === modal) modal.remove(); };
}

// --- Main Render Logic ---
async function renderProjectsSection() {
  const response = await fetch(`assets/projects.json?v=${Date.now()}`);
  const projects = await response.json();
  const nav = document.getElementById('projects-nav');
  const content = document.getElementById('projects-content');
  const paginationContainer = document.getElementById('projects-pagination');
  nav.innerHTML = '';
  content.innerHTML = '';

  // Ensure a `.projects-inner` wrapper exists to apply consistent padding and centering.
  const section = document.getElementById('projects');
  if (section && !section.querySelector('.projects-inner')) {
    const inner = document.createElement('div');
    inner.className = 'projects-inner';
    // Move existing header/nav/content/pagination into inner wrapper
    while (section.firstChild) {
      inner.appendChild(section.firstChild);
    }
    section.appendChild(inner);
  }

  // Sort by date descending (robust): newest first. If a project has an invalid/missing date,
  // treat it as very old so it appears at the end.
  function dateToMillis(p) {
    if (!p || !p.date) return 0;
    // Try Date.parse first (fast for ISO strings)
    const parsed = Date.parse(p.date);
    if (isFinite(parsed)) return parsed;
    // Fallback to new Date() for non-ISO date strings
    const alt = new Date(p.date).getTime();
    return isFinite(alt) ? alt : 0;
  }

  projects.sort((a, b) => dateToMillis(b) - dateToMillis(a));

  // Get unique categories (preserve insertion order)
  // Handle both new `categories` arrays and legacy `category` strings
  const categories = [...new Set(projects.flatMap(p => (Array.isArray(p.categories) && p.categories.length) ? p.categories : (p.category ? [p.category] : [])).filter(Boolean))];
  const navItems = ['All', 'Recent', ...categories];

  // Build navigation bar
  nav.innerHTML = navItems.map(cat => `<button class='category-btn' data-category='${cat}'>${cat}</button>`).join('');

  // Pagination state and logic
  const pageSize = 6; // projects per page in grid view
  let currentCategory = 'Recent';
  let currentPage = 1;

  function clearPagination() {
    if (paginationContainer) paginationContainer.innerHTML = '';
  }

  function renderPagination(totalItems) {
    if (!paginationContainer) return;
    paginationContainer.innerHTML = '';
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

    // If only one page, hide pagination
    if (totalPages <= 1) return;

    const nav = document.createElement('div');
    nav.className = 'pagination-nav';

    const prevBtn = document.createElement('button');
    prevBtn.className = 'pagination-btn';
    prevBtn.textContent = 'Prev';
    prevBtn.disabled = currentPage === 1;
    prevBtn.onclick = () => {
      if (currentPage > 1) {
        currentPage -= 1;
        renderCurrentCategory();
        window.scrollTo({ top: document.getElementById('projects-content').offsetTop - 120, behavior: 'smooth' });
      }
    };
    nav.appendChild(prevBtn);

    // Create numeric page buttons (simple approach: show all pages)
    for (let p = 1; p <= totalPages; p++) {
      const btn = document.createElement('button');
      btn.className = 'pagination-btn';
      if (p === currentPage) btn.classList.add('active');
      btn.textContent = p;
      btn.onclick = () => {
        currentPage = p;
        renderCurrentCategory();
        window.scrollTo({ top: document.getElementById('projects-content').offsetTop - 120, behavior: 'smooth' });
      };
      nav.appendChild(btn);
    }

    const nextBtn = document.createElement('button');
    nextBtn.className = 'pagination-btn';
    nextBtn.textContent = 'Next';
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.onclick = () => {
      if (currentPage < totalPages) {
        currentPage += 1;
        renderCurrentCategory();
        window.scrollTo({ top: document.getElementById('projects-content').offsetTop - 120, behavior: 'smooth' });
      }
    };
    nav.appendChild(nextBtn);

    paginationContainer.appendChild(nav);
  }

  // Filtering / rendering
  function showCategory(cat) {
    currentCategory = cat;
    currentPage = 1;
    document.querySelectorAll('.category-btn').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.querySelector(`.category-btn[data-category='${cat}']`);
    if (activeBtn) activeBtn.classList.add('active');
    renderCurrentCategory();
  }

  function renderCurrentCategory() {
    content.innerHTML = '';
    clearPagination();
    if (currentCategory === 'Recent') {
      // Show 4 most recent projects in a responsive row/grid
      const row = document.createElement('div');
      row.className = 'projects-row';
      projects.slice(0, 4).forEach(project => {
        const card = createProjectCard(project);
        row.appendChild(card);
      });
      content.appendChild(row);
    } else if (currentCategory === 'All') {
      // Show all projects with pagination
      const filtered = projects.slice();
      const totalItems = filtered.length;
      const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
      if (currentPage > totalPages) currentPage = totalPages;
      const start = (currentPage - 1) * pageSize;
      const end = start + pageSize;
      const pageItems = filtered.slice(start, end);

      const grid = document.createElement('div');
      grid.className = 'projects-grid';
      pageItems.forEach(project => {
        const card = createProjectCard(project);
        grid.appendChild(card);
      });
      content.appendChild(grid);
      renderPagination(totalItems);
    } else {
      const filtered = projects.filter(p => {
        if (Array.isArray(p.categories) && p.categories.length) return p.categories.includes(currentCategory);
        if (p.category) return p.category === currentCategory;
        return false;
      });
      if (filtered.length === 0) {
        const msg = document.createElement('p');
        msg.style.textAlign = 'center';
        msg.style.color = '#bbb';
        msg.textContent = 'No projects found in this category.';
        content.appendChild(msg);
        return;
      }

      const totalItems = filtered.length;
      const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
      // clamp currentPage
      if (currentPage > totalPages) currentPage = totalPages;

      const start = (currentPage - 1) * pageSize;
      const end = start + pageSize;
      const pageItems = filtered.slice(start, end);

      const grid = document.createElement('div');
      grid.className = 'projects-grid';
      pageItems.forEach(project => {
        const card = createProjectCard(project);
        grid.appendChild(card);
      });
      content.appendChild(grid);
      renderPagination(totalItems);
    }
  }

  // Card builder
  function createProjectCard(project) {
    const card = document.createElement('div');
    card.className = 'project-card';
    // build card content with safer image fallback and optional thumbnail
    // main visible image: prefer `thumbnail` (author-provided small image) then `image` (full image)
    const img = document.createElement('img');
    img.className = 'project-image';
    img.src = project.thumbnail || project.image || '';
    img.alt = project.title || 'Project image';
    // if the image fails to load, replace it with a styled placeholder so the card still shows an image area
    img.onerror = () => {
      const ph = document.createElement('div');
      ph.className = 'project-image-placeholder';
      // optional simple initial or icon could be added; keep blank for minimalism
      ph.setAttribute('aria-hidden', 'true');
      img.replaceWith(ph);
    };

    const info = document.createElement('div');
    info.className = 'project-info';

    const title = document.createElement('h3');
    title.className = 'project-title';
    title.textContent = project.title || 'Untitled Project';

  const desc = document.createElement('p');
  desc.className = 'project-description';
  // Use long_description for modal/full copy when available, but show a shorter preview on the card
  const fullText = (project.long_description && project.long_description.trim().length > 0) ? project.long_description : (project.description || '');
  // Shorter preview for cards to keep them concise
  const previewMax = 150;
  const preview = fullText.length > previewMax ? fullText.slice(0, previewMax).trim() + '...' : fullText;
  desc.textContent = preview;

    // Show only the first 3 skills with a count indicator if there are more
    const skillsWrap = document.createElement('div');
    skillsWrap.className = 'project-skills-preview';
    const skills = project.skills || [];
    const displayedSkills = skills.slice(0, 3);
    const remainingCount = skills.length - 3;

    if (skills.length > 0) {
      const skillsText = document.createElement('span');
      skillsText.className = 'skills-preview-text';
      skillsText.textContent = displayedSkills.join(' • ');
      if (remainingCount > 0) {
        const more = document.createElement('span');
        more.className = 'skills-more-count';
        more.textContent = `+${remainingCount} more`;
        skillsText.appendChild(more);
      }
      skillsWrap.appendChild(skillsText);
    }

    info.appendChild(title);
    info.appendChild(desc);
    info.appendChild(skillsWrap);

  card.appendChild(img);
  card.appendChild(info);
    card.onclick = () => createProjectModal(project);
    card.style.cursor = 'pointer';
    return card;
  }

  // Navigation click events
  nav.querySelectorAll('.category-btn').forEach(btn => {
    btn.onclick = () => showCategory(btn.getAttribute('data-category'));
  });
  showCategory('Recent');
}

document.addEventListener('DOMContentLoaded', renderProjectsSection);