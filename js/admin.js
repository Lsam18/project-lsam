// Simple admin UI script — add projects (no auth)
document.addEventListener('DOMContentLoaded', () => {
  const $ = id => document.getElementById(id);
  const preview = $('preview');
  const result = $('result');
  const projectList = $('projectList');
  let editingId = null;
  const editBanner = document.getElementById('editBanner');
  const cancelEditBtn = document.getElementById('cancelEdit');
  const toastEl = document.getElementById('toast');

  function showToast(msg, timeout = 3000) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastEl._t);
    toastEl._t = setTimeout(() => toastEl.classList.remove('show'), timeout);
  }

  function getFormData() {
    const title = $('title').value.trim();
    const thumbnail = $('thumbnail').value.trim() || undefined;
    // categories: use select + custom field; combine and split by commas if needed
    const sel = $('categorySelect').value || '';
    const custom = $('customCategory').value || '';
    let categories = [];
    if (sel) categories.push(sel.trim());
    if (custom) categories = categories.concat(custom.split(',').map(s => s.trim()).filter(Boolean));

    const description = $('description').value.trim();
    const long_description = $('long_description').value.trim() || undefined;
    const skills = ($('skills').value || '').split(',').map(s => s.trim()).filter(Boolean);
    const link = $('link').value.trim() || undefined;
    const date = $('date').value || undefined;
    const images = ($('images').value || '').split(',').map(s => s.trim()).filter(Boolean);

    return { title, thumbnail, categories, description, long_description, skills, link, date, images };
  }

  function renderPreview(obj) {
    preview.innerHTML = '';
    const h = document.createElement('h4'); h.textContent = obj.title || '(no title)';
    const p = document.createElement('p'); p.textContent = obj.description || '';
    preview.appendChild(h); preview.appendChild(p);
    if (obj.categories && obj.categories.length) {
      const c = document.createElement('p'); c.textContent = 'Categories: ' + obj.categories.join(', '); preview.appendChild(c);
    }
    if (obj.skills && obj.skills.length) {
      const s = document.createElement('p'); s.textContent = 'Skills: ' + obj.skills.join(', '); preview.appendChild(s);
    }
    if (obj.long_description) {
      const d = document.createElement('pre'); d.style.whiteSpace = 'pre-wrap'; d.textContent = obj.long_description; preview.appendChild(d);
    }
  }

  async function fetchProjects() {
    try {
      const resp = await fetch('/api/projects');
      if (!resp.ok) return [];
      const arr = await resp.json();
      return Array.isArray(arr) ? arr : [];
    } catch (err) {
      console.error('fetchProjects error', err);
      return [];
    }
  }

  async function renderProjectList() {
    const projects = await fetchProjects();
    projectList.innerHTML = '';
    if (!projects.length) { projectList.innerHTML = '<em class="label-muted">No projects published yet.</em>'; return; }
    projects.forEach(p => {
      const div = document.createElement('div');
      div.className = 'project-item';
      const thumb = document.createElement('img');
      thumb.className = 'project-thumb';
      thumb.src = (p.thumbnail || (p.images && p.images[0]) || '');
      thumb.alt = p.title || 'thumb';

      const meta = document.createElement('div');
      meta.className = 'project-meta';
      const title = document.createElement('div');
      title.innerHTML = `<strong>${p.title || '(untitled)'}</strong>`;
      const date = document.createElement('div');
      date.className = 'label-muted'; date.textContent = p.date || '';
      const badges = document.createElement('div'); badges.className = 'badges';
      const cats = (Array.isArray(p.categories) ? p.categories : (p.category ? [p.category] : []));
      cats.forEach(c => { const b = document.createElement('span'); b.className = 'badge'; b.textContent = c; badges.appendChild(b); });
      meta.appendChild(title); meta.appendChild(date); meta.appendChild(badges);

      const actions = document.createElement('div'); actions.className = 'project-actions';
      const viewBtn = document.createElement('button'); viewBtn.className = 'view'; viewBtn.textContent = 'View'; viewBtn.onclick = () => alert(JSON.stringify(p, null, 2));
      const editBtn = document.createElement('button'); editBtn.className = 'edit'; editBtn.textContent = 'Edit'; editBtn.onclick = () => startEditProject(p);
      const delBtn = document.createElement('button'); delBtn.className = 'del'; delBtn.textContent = 'Delete'; delBtn.onclick = () => deleteProject(p.id);
      actions.appendChild(viewBtn); actions.appendChild(editBtn); actions.appendChild(delBtn);

      div.appendChild(thumb); div.appendChild(meta); div.appendChild(actions);
      projectList.appendChild(div);
    });
  }

  function populateForm(p) {
    $('title').value = p.title || '';
    $('thumbnail').value = p.thumbnail || '';
    $('categorySelect').value = (p.categories && p.categories[0]) || p.category || '';
    $('customCategory').value = (p.categories && p.categories.slice(1).join(', ')) || '';
    $('description').value = p.description || '';
    $('long_description').value = p.long_description || '';
    $('skills').value = (p.skills || []).join(', ');
    $('link').value = p.link || '';
    $('date').value = p.date || '';
    $('images').value = (p.images || []).join(', ');
  }

  function startEditProject(p) {
    editingId = p.id;
    populateForm(p);
    if (editBanner) { editBanner.style.display = 'block'; editBanner.textContent = 'Editing — ' + (p.title || '(untitled)'); }
    if (cancelEditBtn) { cancelEditBtn.style.display = 'inline-block'; }
    result.textContent = 'Editing project id: ' + (p.id || 'n/a');
    document.getElementById('submit').textContent = 'Update Project';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function deleteProject(id) {
    if (!confirm('Delete this project? This action cannot be undone.')) return;
    try {
      const resp = await fetch('/api/projects/' + encodeURIComponent(id), { method: 'DELETE' });
      const data = await resp.json();
      if (!resp.ok || !data.ok) {
        showToast('Delete failed: ' + (data.error || resp.statusText));
      } else {
        result.textContent = 'Deleted project: ' + id;
        showToast('Deleted project');
        // clear editing state if that was the deleted one
        if (editingId === id) {
          editingId = null;
          document.getElementById('submit').textContent = 'Save Project';
          document.querySelectorAll('#title,#thumbnail,#customCategory,#description,#long_description,#skills,#link,#date,#images').forEach(el => el.value = '');
          $('categorySelect').selectedIndex = 0;
          if (editBanner) editBanner.style.display = 'none';
          if (cancelEditBtn) cancelEditBtn.style.display = 'none';
        }
        renderProjectList();
      }
    } catch (err) {
      console.error('delete error', err);
      showToast('Network error deleting project');
    }
  }

  $('submit').addEventListener('click', async () => {
    result.textContent = '';
    const payload = getFormData();
    if (!payload.title || !payload.description) return result.textContent = 'Title and description are required';
    renderPreview(payload);
    try {
      let resp, data;
      if (editingId) {
        // update
        resp = await fetch('/api/projects/' + encodeURIComponent(editingId), {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
        });
        data = await resp.json();
        if (!resp.ok || !data.ok) {
          result.textContent = 'Error updating: ' + (data.error || resp.statusText || 'unknown');
          showToast('Update failed');
        } else {
          result.textContent = 'Project updated — id: ' + (data.id || editingId);
          editingId = null;
          document.getElementById('submit').textContent = 'Save Project';
          document.querySelectorAll('#title,#thumbnail,#customCategory,#description,#long_description,#skills,#link,#date,#images').forEach(el => el.value = '');
          $('categorySelect').selectedIndex = 0;
          if (editBanner) editBanner.style.display = 'none';
          if (cancelEditBtn) cancelEditBtn.style.display = 'none';
          renderProjectList();
          showToast('Project updated');
        }
      } else {
        resp = await fetch('/api/projects', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
        });
        data = await resp.json();
        if (!resp.ok || !data.ok) {
          result.textContent = 'Error: ' + (data.error || resp.statusText || 'unknown');
          showToast('Create failed');
        } else {
          result.textContent = 'Project added — id: ' + (data.id || 'n/a');
          // clear form
          document.querySelectorAll('#title,#thumbnail,#customCategory,#description,#long_description,#skills,#link,#date,#images').forEach(el => el.value = '');
          $('categorySelect').selectedIndex = 0;
          renderProjectList();
          showToast('Project added');
        }
      }
    } catch (err) {
      console.error('submit error', err);
      result.textContent = 'Network or server error';
      showToast('Network or server error');
    }
  });

  if (cancelEditBtn) {
    cancelEditBtn.onclick = () => {
      editingId = null;
      document.getElementById('submit').textContent = 'Save Project';
      document.querySelectorAll('#title,#thumbnail,#customCategory,#description,#long_description,#skills,#link,#date,#images').forEach(el => el.value = '');
      $('categorySelect').selectedIndex = 0;
      if (editBanner) editBanner.style.display = 'none';
      cancelEditBtn.style.display = 'none';
      result.textContent = '';
    };
  }

  // initial
  renderProjectList();
});