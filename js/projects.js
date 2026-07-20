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

// Direct file:// previews cannot fetch JSON in most browsers. This compact,
// complete register keeps all project cards available without a web server.
const LOCAL_PROJECT_ROWS = [
  ['AWS GuardDuty → Splunk SIEM: Real-Time Cloud Threat Detection Pipeline','2026-01-12',['Defensive - Blue Teaming'],['AWS','GuardDuty','Splunk','SIEM','Cloud Security','Detection Engineering'],'https://miro.medium.com/v2/resize:fit:1010/format:webp/1*r4lPNBfAIxHd04VTmpNZAw.png','https://medium.com/@lakshan.sam28/building-an-aws-guardduty-siem-pipeline-into-splunk-s3-sqs-soc-dashboard-784d31db9ce7'],
  ['UNIFIED HYBRID SIEM ARCHITECTURE WITH CLOUD - LOCAL HONEYPOTS AND ANALYST DRIVEN AUTOMATION','2025-09-29',['Defensive - Blue Teaming','Offensive - Red Teaming'],['Azure Sentinel','Logic Apps','Python','Docker','KQL','MITRE ATT&CK'],'https://files.elfsightcdn.com/eafe4a4d-3436-495d-b748-5bdce62d911d/2d1e2f25-6beb-4b6a-8a07-981cc7e75ad0/Sentinel-X-Final-Project-Demo-Cover.jpg','https://github.com/Lsam18/SentinelX-Hybrid-SIEM'],
  ['Global Threat Intelligence Lab – End-to-End SOC & Automation Project','2025-09-20',['Defensive - Blue Teaming'],['Wazuh','Threat Intelligence','VirusTotal','MalwareBazaar','AbuseIPDB','AlienVault OTX'],'https://files.elfsightcdn.com/eafe4a4d-3436-495d-b748-5bdce62d911d/314d0a57-28b7-43e4-8ed2-bd728f980c8b/Screenshot-2025-09-10-at-00-13-05.png','https://medium.com/@lakshan.sam28/i-built-a-global-threat-intel-lab-from-scratch-then-deleted-half-of-it-by-accident-68ccf22fdb1c'],
  ['AI-Powered Threat Detection Pipeline using AWS GuardDuty, Lambda & Amazon Bedrock','2025-08-09',['Defensive - Blue Teaming','Offensive - Red Teaming'],['GuardDuty','AWS','Lambda','Amazon Bedrock','MITRE ATT&CK','AI/LLM Integration'],'https://files.elfsightcdn.com/eafe4a4d-3436-495d-b748-5bdce62d911d/eacce538-52a2-40a3-9442-87f3f1e59817/Screenshot-2025-08-02-at-17-46-47.png','https://medium.com/@lakshan.sam28/i-hacked-my-own-aws-cloud-legally-fee8b8727ddd'],
  ['Full-Spectrum Cloud Security: AWS Threat Detection with Wazuh SIEM & Automated Remediation','2025-07-19',['Defensive - Blue Teaming','Offensive - Red Teaming'],['Wazuh','AWS','SIEM','Lambda','FIM','CloudWatch'],'https://files.elfsightcdn.com/eafe4a4d-3436-495d-b748-5bdce62d911d/3a7fee48-42d7-4e46-ba32-b16d773c4e18/Screenshot-2025-07-20-at-19-10-32.png','https://medium.com/@lakshan.sam28/i-hacked-my-own-aws-cloud-legally-fee8b8727ddd'],
  ['Advanced Penetration Testing – Student Enrollment System Full-Stack Test','2025-06-29',['Offensive - Red Teaming','Websites - Security'],['Penetration Testing','Nmap','SQLmap','PHP','MySQL','OWASP Top 10'],'https://files.elfsightcdn.com/eafe4a4d-3436-495d-b748-5bdce62d911d/362bcd90-133a-4758-8126-74800d7489dd/Screenshot-2025-07-05-at-13-25-52.png','https://drive.google.com/file/d/1WmPIwKx64sB26f0vOTFtyMXUDCxS0PFo/view?usp=sharing'],
  ['DevSecOps Vulnerable Pipeline — CI/CD Security Automation with GitHub Actions','2025-06-21',['Defensive - Blue Teaming','Websites - Security'],['CI/CD','SAST','DAST','Gitleaks','GitHub Actions','OWASP ZAP'],'https://files.elfsightcdn.com/eafe4a4d-3436-495d-b748-5bdce62d911d/a0605323-71e8-4a56-bf03-1276bb07a998/Screenshot-2025-06-20-at-17-23-58.png','https://medium.com/@lakshan.sam28/unveiling-ossec-hids-detecting-the-eternalblue-exploitation-275c6a243904'],
  ['Cloud-Based Load Balancing and SDN-Powered Adaptive Video Streaming','2025-04-13',['Defensive - Blue Teaming'],['AWS EC2','Docker Compose','NGINX','OpenDaylight','Mininet','Linux'],'https://files.elfsightcdn.com/eafe4a4d-3436-495d-b748-5bdce62d911d/e69a8c18-97c9-45f8-9c3d-44918376fbc4/1748080299346.jpg','https://www.linkedin.com/posts/lsam_aws-docker-sdn-activity-7331980256393736192-CO1A'],
  ['Mastercard Cybersecurity Virtual Experience Program','2025-02-25',['Hands-On Security Case Studies & Simulations'],['Mastercard','Forage','Security Simulation'],'https://files.elfsightcdn.com/eafe4a4d-3436-495d-b748-5bdce62d911d/7ea2207a-eccd-4a7f-af69-ad73a3aaea43/vcKAB5yYAgvemepGQ_mfxGwGDp6WkQmtmTf_2GSb4zoBWf4AFKqAf_1738678627646_completion_certificate.jpg','https://www.theforage.com/simulations/mastercard/cybersecurity-t8ye'],
  ['PwC Switzerland Cybersecurity Job Simulation','2025-02-23',['Hands-On Security Case Studies & Simulations'],['PwC','Digital Intelligence','Security Simulation'],'https://files.elfsightcdn.com/eafe4a4d-3436-495d-b748-5bdce62d911d/f193286d-01ec-47d4-a76a-85b83573fd9f/f9H4CHchzrKQbnbmK_4sLyCPgmsy8DA6Dh3_2GSb4zoBWf4AFKqAf_1738684243537_completion_certificate.jpg','https://www.theforage.com/simulations/pwc-ch/cybersecurity-9iwh'],
  ['Tata Group Cybersecurity Analyst Virtual Experience','2025-02-20',['Hands-On Security Case Studies & Simulations'],['IAM','Access Management','Security Simulation'],'https://files.elfsightcdn.com/eafe4a4d-3436-495d-b748-5bdce62d911d/220aa954-cec8-41ac-bdc8-3614d1d9876c/gmf3ypEXBj2wvfQWC_ifobHAoMjQs9s6bKS_2GSb4zoBWf4AFKqAf_1738729054435_completion_certificate.jpg','https://www.theforage.com/simulations/tata/cybersecurity-sbda'],
  ['Security Operations — Network Intrusion Analysis and Detection for DevonCinema','2025-01-23',['Defensive - Blue Teaming'],['Network Security','Wireshark','Snort'],'https://files.elfsightcdn.com/eafe4a4d-3436-495d-b748-5bdce62d911d/1ec17497-f1b1-41ee-9e6e-8ff4c450babf/Screenshot-2025-01-10-at-15-08-18.png','https://drive.google.com/file/d/1MTIOb-VboC4ix-D8asxCPMVTNjqlUy95/view?usp=share_link'],
  ['Security Operations — OSSEC HIDS: Detecting the EternalBlue Exploitation','2025-01-22',['Defensive - Blue Teaming'],['Security Operations','HIDS','EternalBlue'],'https://files.elfsightcdn.com/eafe4a4d-3436-495d-b748-5bdce62d911d/d97e97fe-99cd-4870-a482-30581c381d96/How-To-Install-OSSEC-HIDS-Agent-on-Ubuntu-24-0422-04.png','https://medium.com/@lakshan.sam28/unveiling-ossec-hids-detecting-the-eternalblue-exploitation-275c6a243904'],
  ['Penetration Testing Simulation for Securing Organizational Systems','2024-09-29',['Offensive - Red Teaming'],['Penetration Testing','Red Team','Vulnerability Assessment'],'https://files.elfsightcdn.com/eafe4a4d-3436-495d-b748-5bdce62d911d/9960a94c-7450-466d-b278-30d6670329eb/WhatsApp-Image-2024-11-30-at-17-24-45.jpg','https://drive.google.com/file/d/1su0VYpCo_uA5Cqt72cM-U48rPjYZEWlj/view?usp=share_link'],
  ['Comprehensive Digital Forensics Report for Cybersecurity Incident Response','2024-09-23',['Defensive - Blue Teaming'],['Digital Forensics','Incident Response','Investigation'],'https://files.elfsightcdn.com/eafe4a4d-3436-495d-b748-5bdce62d911d/161d2243-5c9e-47be-80ee-82561090565f/Screenshot-2024-12-12-at-21-45-05.png','https://drive.google.com/file/d/1s8JWNwQjh_jxCIxMu2s3t1l9ufVEIJWq/view?usp=share_link'],
  ['Azure & OpenVAS Cybersecurity Vulnerability Management Project','2024-07-23',['Defensive - Blue Teaming'],['Azure','OpenVAS','Vulnerability Management'],'https://files.elfsightcdn.com/eafe4a4d-3436-495d-b748-5bdce62d911d/21b32b6d-715a-4b6d-abf1-25b7f526075b/1719157274663.jpg','https://medium.com/@lakshan.sam28/enhancing-security-through-vulnerability-management-48e19df63ac1'],
  ['A Backdoor Reverse Shell — Remote Administration Tool','2024-06-27',['Offensive - Red Teaming'],['RAT','Reverse Shell','Remote Access'],'https://www.offsec.com/wp-content/uploads/2016/04/Screen-Shot-2016-04-05-at-12.17.19-PM.png','https://github.com/Lsam18/Backdoor_Reverse_Shell'],
  ['Key Logger Application','2024-05-23',['Offensive - Red Teaming'],['Key Logger','Monitoring','Awareness','PowerShell'],'https://files.elfsightcdn.com/eafe4a4d-3436-495d-b748-5bdce62d911d/2023eff3-edc9-4b7f-ac73-f45195522fce/1716200118033-2.jpg','https://medium.com/@lakshan.sam28/building-a-key-logger-with-email-notifications-a-comprehensive-guide-824e2137ad17'],
  ['Azure Sentinel SIEM Lab','2024-04-23',['Defensive - Blue Teaming'],['SIEM','Azure Sentinel','PowerShell'],'https://files.elfsightcdn.com/eafe4a4d-3436-495d-b748-5bdce62d911d/1bc4c394-d9ae-40e6-81bd-d9f1f7a80543/incident-severity.png','https://medium.com/@lakshan.sam28/enhancing-cybersecurity-with-azure-sentinel-and-powershell-a-real-time-rdp-attack-detection-system-bdb994ba67aa'],
  ['A Strong Password Generator','2023-10-23',['Defensive - Blue Teaming','Websites - Security'],['HTML','CSS','JavaScript'],'https://files.elfsightcdn.com/eafe4a4d-3436-495d-b748-5bdce62d911d/2ff19e5c-8fd7-4673-952c-e96ca025c949/Screenshot-2024-09-23-at-14-44-13.png','https://github.com/Lsam18/SPG'],
  ['A File Integrity Monitor','2023-08-09',['Defensive - Blue Teaming'],['FIM','PowerShell','Monitoring'],'https://files.elfsightcdn.com/eafe4a4d-3436-495d-b748-5bdce62d911d/3d181550-0dc0-422c-b277-574a1e76f82b/1692979282561-2.jpg','https://medium.com/@lakshan.sam28/building-a-file-integrity-monitoring-fim-system-for-enhanced-security-9e8a666de655']
];
const LOCAL_PROJECTS = LOCAL_PROJECT_ROWS.map(([title,date,categories,skills,thumbnail,link]) => ({
  title, date, categories, skills, thumbnail, link,
  description: `Hands-on ${categories.join(' and ')} project featuring ${skills.slice(0, 5).join(', ')}.`
}));
const loadProjectsData = async () => {
  if (location.protocol === 'file:') return LOCAL_PROJECTS.map((project) => ({ ...project, categories: [...project.categories], skills: [...project.skills] }));
  try {
    const response = await fetch(`assets/projects.json?v=${Date.now()}`);
    if (!response.ok) throw new Error('Project data unavailable');
    const data = await response.json();
    if (!Array.isArray(data) || !data.length) throw new Error('Project data empty');
    return data;
  } catch (_) {
    return LOCAL_PROJECTS.map((project) => ({ ...project, categories: [...project.categories], skills: [...project.skills] }));
  }
};

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
        <div class="project-depth" aria-label="Project explanation depth">
          <button class="depth-btn active" data-depth="executive">EXECUTIVE</button>
          <button class="depth-btn" data-depth="analyst">SOC ANALYST</button>
          <button class="depth-btn" data-depth="technical">TECHNICAL</button>
        </div>
        <div class="depth-content" id="depth-content"></div>
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

  const rawDescription = (project.long_description || project.description || '').replace(/\s+/g, ' ').trim();
  const skillsList = (project.skills || []).join(', ') || 'security engineering technologies';
  const depthViews = {
    executive: `<strong>Why it matters</strong><p>${rawDescription.slice(0, 360)}${rawDescription.length > 360 ? '…' : ''}</p>`,
    analyst: `<strong>SOC analyst view</strong><p>This work demonstrates practical investigation, detection coverage and operational decision-making. Key capabilities include ${skillsList}. The focus is measurable visibility, faster triage and defensible response.</p>`,
    technical: `<strong>Technical view</strong><p>Architecture and implementation combine ${skillsList}. Open the full description below for engineering decisions, integrations, detection logic and validation detail.</p>`
  };
  const depthContent = modal.querySelector('#depth-content');
  const setDepth = (depth) => {
    if (depthContent) depthContent.innerHTML = depthViews[depth];
    modal.querySelectorAll('.depth-btn').forEach(button => button.classList.toggle('active', button.dataset.depth === depth));
  };
  modal.querySelectorAll('.depth-btn').forEach(button => button.addEventListener('click', () => setDepth(button.dataset.depth)));
  setDepth('executive');
  
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
  const projects = await loadProjectsData();
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

  const newestYear = projects.reduce((latest, project) => Math.max(latest, new Date(project.date).getFullYear() || 0), 0);
  const setText = (id, value) => { const element = document.getElementById(id); if (element) element.textContent = value; };
  setText('project-count', projects.length.toString().padStart(2, '0'));
  setText('project-category-count', categories.length.toString().padStart(2, '0'));
  setText('project-newest', newestYear || 'LIVE');
  window.__PROJECTS__ = projects;
  window.setTimeout(() => document.dispatchEvent(new CustomEvent('projects:loaded', { detail: projects })), 0);

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
