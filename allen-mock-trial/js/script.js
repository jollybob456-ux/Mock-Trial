function escapeHtml(str){
    const d = document.createElement('div');
    d.textContent = str == null ? '' : str;
    return d.innerHTML;
  }
  function uid(){ return Date.now().toString(36) + Math.random().toString(36).slice(2,8); }
  async function getList(key){
    try{ const res = await window.storage.get(key, true); return res ? JSON.parse(res.value) : []; }
    catch(e){ return []; }
  }
  async function saveList(key, list){
    try{ await window.storage.set(key, JSON.stringify(list), true); }
    catch(e){ console.error('Storage error saving ' + key, e); }
  }

  let currentFilter = 'open';

  async function seedIfEmpty(){
    const list = await getList('scrimmage-requests');
    if(!list.length){
      const seeded = [{
        id: uid(), school:'Allen High School', captain:'Nick', caseYear:'2025-2026',
        host:'They host', dates:['Sat, Apr 18','Sun, Apr 19','Mon, Apr 20','Tue, Apr 21','Wed, Apr 22','Thu, Apr 23'],
        notes:'Start by 4:30 at the latest. Prosecution side.', status:'open', created: Date.now()
      }];
      await saveList('scrimmage-requests', seeded);
    }
  }

  async function renderScrimmages(){
    const list = await getList('scrimmage-requests');
    list.sort((a,b) => b.created - a.created);
    const filtered = currentFilter === 'all' ? list : list.filter(s => s.status === currentFilter);
    document.getElementById('req-count').textContent = filtered.length + (filtered.length === 1 ? ' request' : ' requests');
    const el = document.getElementById('scrimmage-list');

    if(!filtered.length){
      el.innerHTML = '<div style="padding:30px 0; text-align:center; color:var(--muted); font-style:italic;">No scrimmages match this filter yet.</div>';
    } else {
      el.innerHTML = filtered.map(s => `
        <div class="req-card">
          <div>
            <span class="req-status ${s.status}"><span class="sdot"></span>${s.status}</span>
            ${s.caseYear ? `<span class="mono" style="font-size:11px; color:var(--muted); margin-left:8px;">Case ${escapeHtml(s.caseYear)}</span>` : ''}
            <h4>${escapeHtml(s.school)}</h4>
            <div class="req-meta">${s.captain ? 'Captain: ' + escapeHtml(s.captain) : ''}${s.host ? ' &middot; ' + escapeHtml(s.host) : ''}</div>
            <div class="date-chips">${(s.dates||[]).map(d => `<span class="date-chip">${escapeHtml(d)}</span>`).join('')}</div>
            ${s.notes ? `<div class="req-notes">${escapeHtml(s.notes)}</div>` : ''}
          </div>
          <div class="req-actions">
            ${s.status === 'open' ? `<button class="btn solid" style="font-size:12.5px; padding:9px 16px;" onclick="claimDate('${s.id}')">Claim a date ›</button>` : ''}
            <button class="small-link" onclick="deleteScrimmage('${s.id}')">Remove</button>
          </div>
        </div>
      `).join('');
    }
    renderCalendar(list);
  }

  window.claimDate = async function(id){
    let list = await getList('scrimmage-requests');
    list = list.map(s => s.id === id ? {...s, status:'confirmed'} : s);
    await saveList('scrimmage-requests', list);
    renderScrimmages();
  };
  window.deleteScrimmage = async function(id){
    let list = await getList('scrimmage-requests');
    list = list.filter(s => s.id !== id);
    await saveList('scrimmage-requests', list);
    renderScrimmages();
  };

  document.querySelectorAll('.fbtn').forEach(btn => {
    btn.addEventListener('click', () => {
      currentFilter = btn.dataset.filter;
      document.querySelectorAll('.fbtn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderScrimmages();
    });
  });

  document.getElementById('scrimmage-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const school = document.getElementById('s-school').value.trim();
    const datesRaw = document.getElementById('s-dates').value.trim();
    if(!school || !datesRaw) return;
    const captain = document.getElementById('s-captain').value.trim();
    const caseYear = document.getElementById('s-case').value.trim();
    const host = document.getElementById('s-host').value;
    const notes = document.getElementById('s-notes').value.trim();
    const dates = datesRaw.split(',').map(d => d.trim()).filter(Boolean);
    const list = await getList('scrimmage-requests');
    list.push({ id: uid(), school, captain, caseYear, host, dates, notes, status:'open', created: Date.now() });
    await saveList('scrimmage-requests', list);
    e.target.reset();
    renderScrimmages();
  });

  let calViewDate = new Date();
  function renderCalendar(scrimmageList){
    const y = calViewDate.getFullYear(), m = calViewDate.getMonth();
    document.getElementById('cal-month-label').textContent = calViewDate.toLocaleDateString(undefined,{month:'long', year:'numeric'});
    const firstDow = new Date(y, m, 1).getDay();
    const daysInMonth = new Date(y, m+1, 0).getDate();
    const today = new Date();
    const isCurrentMonth = today.getFullYear() === y && today.getMonth() === m;

    const confirmedDayNums = new Set();
    (scrimmageList||[]).filter(s => s.status === 'confirmed').forEach(s => {
      (s.dates||[]).forEach(dstr => {
        const match = dstr.match(/(\w{3})\s+(\d{1,2})/);
        if(match){
          const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
          const monIdx = monthNames.indexOf(match[1]);
          if(monIdx === m) confirmedDayNums.add(parseInt(match[2],10));
        }
      });
    });

    let html = ['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => `<div class="cal-dow">${d}</div>`).join('');
    for(let i=0;i<firstDow;i++) html += `<div class="cal-day muted"></div>`;
    for(let d=1; d<=daysInMonth; d++){
      let cls = 'cal-day';
      if(isCurrentMonth && d === today.getDate()) cls += ' today';
      else if(confirmedDayNums.has(d)) cls += ' marked';
      html += `<div class="${cls}">${d}</div>`;
    }
    document.getElementById('cal-grid').innerHTML = html;
  }
  document.getElementById('cal-prev').addEventListener('click', async () => {
    calViewDate = new Date(calViewDate.getFullYear(), calViewDate.getMonth()-1, 1);
    renderCalendar(await getList('scrimmage-requests'));
  });
  document.getElementById('cal-next').addEventListener('click', async () => {
    calViewDate = new Date(calViewDate.getFullYear(), calViewDate.getMonth()+1, 1);
    renderCalendar(await getList('scrimmage-requests'));
  });

  document.getElementById('join-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('j-name').value.trim();
    const email = document.getElementById('j-email').value.trim();
    if(!name || !email) return;
    const grade = document.getElementById('j-grade').value;
    const exp = document.getElementById('j-exp').value;
    const role = document.getElementById('j-role').value;
    const why = document.getElementById('j-why').value.trim();
    const list = await getList('club-applications');
    list.push({ id: uid(), name, email, grade, exp, role, why, created: Date.now() });
    await saveList('club-applications', list);
    e.target.reset();
    document.getElementById('join-success').classList.add('show');
  });

  // ---------- Docket ----------
  async function renderDocket(){
    const list = await getList('docket-announcements');
    list.sort((a,b) => b.created - a.created);
    const el = document.getElementById('docket-list');
    if(!list.length){
      el.innerHTML = '<div class="list-empty">No announcements posted yet. Be the first to post one below.</div>';
      return;
    }
    el.innerHTML = list.map(item => `
      <div class="list-item">
        <div>
          <h4>${escapeHtml(item.title)}</h4>
          <div class="li-meta">${new Date(item.created).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'})}</div>
          ${item.body ? `<p>${escapeHtml(item.body)}</p>` : ''}
        </div>
        <div class="li-right"><button class="small-link" onclick="deleteDocket('${item.id}')">Remove</button></div>
      </div>
    `).join('');
  }
  window.deleteDocket = async function(id){
    let list = await getList('docket-announcements');
    list = list.filter(i => i.id !== id);
    await saveList('docket-announcements', list);
    renderDocket();
  };
  document.getElementById('docket-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('d-title').value.trim();
    const body = document.getElementById('d-body').value.trim();
    if(!title) return;
    const list = await getList('docket-announcements');
    list.push({ id: uid(), title, body, created: Date.now() });
    await saveList('docket-announcements', list);
    e.target.reset();
    renderDocket();
  });

  // ---------- Roster ----------
  async function renderRoster(){
    const list = await getList('team-roster');
    const order = {officer:0, attorney:1, witness:2, member:3};
    list.sort((a,b) => (order[a.role]??9) - (order[b.role]??9) || a.name.localeCompare(b.name));
    const el = document.getElementById('roster-list');
    if(!list.length){
      el.innerHTML = '<div class="list-empty">No members added yet. Add the roster below.</div>';
      return;
    }
    el.innerHTML = list.map(m => `
      <div class="list-item">
        <div>
          <h4>${escapeHtml(m.name)}</h4>
          <div class="li-meta">${m.grade ? escapeHtml(m.grade) + ' &middot; ' : ''}${m.ygid ? 'YG ID ' + escapeHtml(m.ygid) : 'No YG ID on file'}</div>
        </div>
        <div class="li-right">
          <span class="role-pill r-${escapeHtml(m.role)}">${escapeHtml(m.role)}</span>
          <button class="small-link" onclick="deleteRoster('${m.id}')">Remove</button>
        </div>
      </div>
    `).join('');
  }
  window.deleteRoster = async function(id){
    let list = await getList('team-roster');
    list = list.filter(i => i.id !== id);
    await saveList('team-roster', list);
    renderRoster();
  };
  document.getElementById('roster-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('r-name').value.trim();
    if(!name) return;
    const role = document.getElementById('r-role').value;
    const ygid = document.getElementById('r-ygid').value.trim();
    const grade = document.getElementById('r-grade').value.trim();
    const list = await getList('team-roster');
    list.push({ id: uid(), name, role, ygid, grade, created: Date.now() });
    await saveList('team-roster', list);
    e.target.reset();
    renderRoster();
  });

  // ---------- Resources ----------
  async function renderResources(){
    const list = await getList('club-resources');
    list.sort((a,b) => a.category.localeCompare(b.category) || a.title.localeCompare(b.title));
    const el = document.getElementById('resources-list');
    if(!list.length){
      el.innerHTML = '<div class="list-empty">No resources added yet. Add one below.</div>';
      return;
    }
    el.innerHTML = list.map(r => `
      <div class="list-item">
        <div>
          <h4>${r.link ? `<a class="res-link" href="${escapeHtml(r.link)}" target="_blank" rel="noopener">${escapeHtml(r.title)}</a>` : escapeHtml(r.title)}</h4>
          <div class="li-meta">${escapeHtml(r.category)}</div>
          ${r.desc ? `<p>${escapeHtml(r.desc)}</p>` : ''}
        </div>
        <div class="li-right"><button class="small-link" onclick="deleteResource('${r.id}')">Remove</button></div>
      </div>
    `).join('');
  }
  window.deleteResource = async function(id){
    let list = await getList('club-resources');
    list = list.filter(i => i.id !== id);
    await saveList('club-resources', list);
    renderResources();
  };
  document.getElementById('resources-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('res-title').value.trim();
    if(!title) return;
    const category = document.getElementById('res-category').value;
    const link = document.getElementById('res-link').value.trim();
    const desc = document.getElementById('res-desc').value.trim();
    const list = await getList('club-resources');
    list.push({ id: uid(), title, category, link, desc, created: Date.now() });
    await saveList('club-resources', list);
    e.target.reset();
    renderResources();
  });

  (async function init(){
    await seedIfEmpty();
    await renderScrimmages();
    await renderDocket();
    await renderRoster();
    await renderResources();
  })();
