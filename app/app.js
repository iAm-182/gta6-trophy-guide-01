// Leonida Trophy Atlas — offline GTA 6 trophy tracker.
// Static files only: fetches data/trophies.json, saves progress in localStorage,
// exports/imports it as a file. No network requests besides the local JSON fetch.
const KEY = 'leonida-trophy-atlas-v1';
const SEED_IDS = [2, 3, 8, 16, 20, 21, 29, 36, 44, 45, 46, 51, 53]; // demo progress (?seed=13)

const STAGES = [
  { n: 1, title: 'Story first — Chapters 1–4 & the finale', ids: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 33, 34, 37, 44, 45, 46, 47, 49],
    text: 'Play the story in order. The 12 story trophies pop as you go — chapters, the final mission and the named missions. The 8 missables live here too: each one is a specific moment, a partner who is only around in certain story phases, or a one-time retry. Do them when they appear; after the credits, several may be gone for this playthrough.' },
  { n: 2, title: 'Strangers across Leonida', ids: [22, 23, 24, 25, 26, 27],
    text: 'Six stranger strands, each ending in its own trophy, plus the silver for completing any 8 strands. Andy, Kenton, Billy, Randy and Tyrone are the named ones — find their markers, play each strand to its final mission, then pick up three more strands anywhere on the map.' },
  { n: 3, title: 'Activities & challenges', ids: [16, 17, 18, 19, 20, 21, 29, 32, 48],
    text: 'The skill and sampler trophies: gold in all 42 shooting range challenges, 20 different race wins, drone races at all 14 locations, fishing against Cal, one arcade game, the unique-animal hunt for Bret, 50 challenges, 500 choices — and trying all 9 activity types once.' },
  { n: 4, title: 'Collectibles & exploration', ids: [15, 28, 30, 31, 35, 42, 50, 54, 55],
    text: 'The big counts, done region by region so nothing is missed: 250 stunts, 18 meditation spots, 3 card sets, 100 WAiNK locations, 100 vehicles, all 52 areas of Leonida, 8 garage properties, 10 Scooter Bros registrations — plus the secret event. Pair the sweeps: WAiNK, meditation and exploration cover the same ground.' },
  { n: 5, title: 'Money & crime', ids: [36, 38, 39, 40, 41, 43, 51, 52, 53],
    text: 'The criminal economy: 5 bank vaults, the armored truck, one illegal operation per gang (9), a jewelry store robbed clean, 5 takedowns in one Combat Focus, the Rhino, the melee drive-by — and the money loop: launder $250,000 in Marked Bills, spend $100,000 across all shops.' },
  { n: 6, title: 'The platinum', ids: [14, 1],
    text: 'Last: 100% completion (A Long Road), then the platinum pops on its own. 100% is the final sweep — story, strangers, activities, collectibles — and the stats screen tells you exactly what is left. When the checklist reads 54 of 55, the one remaining trophy is your platinum.' },
];

const KIND_FILTERS = {
  story: (t) => t.kind === 'story',
  missable: (t) => t.missable,
  collectible: (t) => t.kind === 'collectible' || t.kind === 'exploration',
  activity: (t) => ['activity', 'side', 'combat', 'money'].includes(t.kind),
  online: () => false,
};
const KIND_LABEL = { story: 'Story', side: 'Stranger', collectible: 'Collectible', exploration: 'Exploration', activity: 'Activity', combat: 'Combat', money: 'Money', completion: 'Completion', secret: 'Secret' };

const params = new URLSearchParams(location.search);
const $ = (id) => document.getElementById(id);
const doc = await (await fetch('data/trophies.json')).json();
const trophies = doc.trophies;
const byId = new Map(trophies.map((t) => [t.id, t]));

let earned = new Set(JSON.parse(localStorage.getItem(KEY) ?? '[]'));
if (params.get('seed') && earned.size === 0) {
  const n = Math.min(parseInt(params.get('seed'), 10) || 0, SEED_IDS.length);
  earned = new Set(SEED_IDS.slice(0, n));
  save();
}
let kindFilter = 'all';
let gradeFilter = 'all';
let query = '';
let spoiler = params.get('spoiler') === 'on';
let selectedId = parseInt(params.get('trophy') ?? '15', 10);
if (!byId.has(selectedId)) selectedId = 15;

function save() { localStorage.setItem(KEY, JSON.stringify([...earned].sort((a, b) => a - b))); }
function isHidden(t) { return spoiler && t.kind === 'story' && !earned.has(t.id); }
function medal(t) { return `<span class="t-medal ${t.grade}" title="${t.grade}"></span>`; }
function tags(t) {
  const out = [`<span class="tag grade-${t.grade}">${t.grade}</span>`, `<span class="tag">${KIND_LABEL[t.kind] ?? t.kind}</span>`];
  if (t.missable) out.push('<span class="tag missable">Missable</span>');
  if (t.target) out.push(`<span class="tag target">PSN target: ${t.target.toLocaleString()} ${t.targetUnit}</span>`);
  return out.join('');
}
function fmt(n) { return n.toLocaleString('en-US'); }

function renderProgress() {
  const total = trophies.length;
  const pct = Math.round((earned.size / total) * 100);
  $('earnedCount').textContent = earned.size;
  $('progressFill').style.width = `${pct}%`;
  const g = (grade) => trophies.filter((t) => t.grade === grade && earned.has(t.id)).length;
  const gc = (grade) => trophies.filter((t) => t.grade === grade).length;
  $('progressSub').textContent = `${pct}% · ${g('platinum')} of ${gc('platinum')} platinum · ${g('gold')} of ${gc('gold')} gold · ${g('silver')} of ${gc('silver')} silver · ${g('bronze')} of ${gc('bronze')} bronze`;
}

function visibleTrophies() {
  return trophies.filter((t) => {
    if (gradeFilter !== 'all' && t.grade !== gradeFilter) return false;
    if (kindFilter !== 'all' && !KIND_FILTERS[kindFilter](t)) return false;
    if (query) {
      const hay = isHidden(t) ? '' : `${t.name} ${t.description}`.toLowerCase();
      if (!hay.includes(query)) return false;
    }
    return true;
  });
}

function renderList() {
  const list = visibleTrophies();
  $('listMeta').textContent = `Showing ${list.length} of ${trophies.length} trophies · ${earned.size} earned`;
  $('emptyMsg').hidden = list.length > 0;
  $('trophyList').replaceChildren();
  for (const t of list) {
    const li = document.createElement('li');
    li.className = 'trophy-row' + (earned.has(t.id) ? ' earned' : '') + (t.id === selectedId ? ' selected' : '');
    const hidden = isHidden(t);
    li.innerHTML = `${medal(t)}<div class="t-body">
        <div class="t-name">${hidden ? 'Hidden trophy' : t.name}</div>
        <div class="t-desc">${hidden ? 'Earn this story trophy to reveal its name and description.' : t.description}</div>
        <div class="t-tags">${tags(t)}</div>
      </div>`;
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.className = 'trophy-check';
    box.checked = earned.has(t.id);
    box.setAttribute('aria-label', `Mark ${t.name} as earned`);
    box.addEventListener('click', (e) => {
      e.stopPropagation();
      if (box.checked) earned.add(t.id); else earned.delete(t.id);
      save(); renderAll();
    });
    li.prepend(box);
    li.addEventListener('click', () => { selectedId = t.id; renderAll(); });
    $('trophyList').append(li);
  }
}

function renderDetail() {
  const t = byId.get(selectedId);
  const pane = $('detailPane');
  if (!t) { pane.innerHTML = '<p class="d-empty">Select a trophy to see its guide.</p>'; return; }
  const hidden = isHidden(t);
  const srcItems = (t.sources ?? []).map((k) => {
    const s = doc.sources[k];
    if (!s) return '';
    return s.url ? `<li><a href="${s.url}" target="_blank" rel="noopener">${s.label}</a></li>` : `<li>${s.label}</li>`;
  }).join('');
  pane.innerHTML = `
    <div class="d-kind">${KIND_LABEL[t.kind] ?? t.kind}${t.missable ? ' · Missable' : ''}</div>
    <h2>${hidden ? 'Hidden trophy' : t.name}</h2>
    <p class="d-desc">${hidden ? 'Earn this story trophy to reveal its name and description.' : t.description}</p>
    <div class="d-meta">${tags(t)}</div>
    ${t.target ? `<p class="d-target">PSN progress target: <strong>${fmt(t.target)} ${t.targetUnit}</strong> — tracked by PSNProfiles.</p>` : ''}
    <div class="d-guide"><p>${hidden ? 'This is a story trophy. Its guide is hidden with the spoiler setting — earn it (or turn spoilers off) to read the guide.' : t.guide}</p></div>
    <div class="d-sources"><h3>Sources</h3><ul>${srcItems}</ul></div>
    <p class="d-note">${doc.sources.note.label}</p>
    <div class="d-actions">
      <button type="button" id="toggleEarned">${earned.has(t.id) ? 'Mark as not earned' : 'Mark as earned'}</button>
      <button type="button" class="ghost" id="copyGuide">Copy guide</button>
    </div>`;
  $('toggleEarned').addEventListener('click', () => {
    if (earned.has(t.id)) earned.delete(t.id); else earned.add(t.id);
    save(); renderAll();
  });
  $('copyGuide').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(`${t.name} — ${t.description}\n\n${t.guide}`); $('copyGuide').textContent = 'Copied'; } catch { $('copyGuide').textContent = 'Copy failed'; }
  });
}

function renderRoadmap() {
  $('stages').replaceChildren();
  for (const s of STAGES) {
    const got = s.ids.filter((id) => earned.has(id)).length;
    const div = document.createElement('div');
    div.className = 'stage';
    div.innerHTML = `<div class="stage-head"><h3>Stage ${s.n} — ${s.title}</h3><span class="stage-count">${got} / ${s.ids.length} earned</span></div><p>${s.text}</p>`;
    const chips = document.createElement('div');
    chips.className = 'stage-trophies';
    for (const id of s.ids) {
      const t = byId.get(id);
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'stage-chip' + (earned.has(id) ? ' earned' : '');
      chip.innerHTML = `<span class="dot t-medal ${t.grade}" style="margin:0"></span>${t.name}${t.missable ? ' ⚠' : ''}`;
      chip.addEventListener('click', () => { selectedId = id; switchView('checklist'); });
      chips.append(chip);
    }
    div.append(chips);
    $('stages').append(div);
  }
}

function renderMissables() {
  $('missableCount').textContent = trophies.filter((t) => t.missable).length;
  $('missableList').replaceChildren();
  for (const t of trophies.filter((x) => x.missable)) {
    const li = document.createElement('li');
    li.className = 'trophy-row' + (earned.has(t.id) ? ' earned' : '');
    li.innerHTML = `${medal(t)}<div class="t-body">
        <div class="t-name">${t.name}</div>
        <div class="t-desc">${t.description}</div>
        <div class="t-tags">${tags(t)}</div>
        <div class="t-desc" style="margin-top:6px">${t.guide}</div>
      </div>`;
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.className = 'trophy-check';
    box.checked = earned.has(t.id);
    box.setAttribute('aria-label', `Mark ${t.name} as earned`);
    box.addEventListener('click', (e) => {
      e.stopPropagation();
      if (box.checked) earned.add(t.id); else earned.delete(t.id);
      save(); renderAll();
    });
    li.prepend(box);
    li.addEventListener('click', () => { selectedId = t.id; switchView('checklist'); });
    $('missableList').append(li);
  }
}

function switchView(name) {
  document.querySelectorAll('.tab').forEach((b) => b.classList.toggle('active', b.dataset.view === name));
  document.querySelectorAll('.view').forEach((v) => v.classList.toggle('active', v.id === `view-${name}`));
  $('toolbar').style.display = name === 'checklist' ? '' : 'none';
  if (name === 'roadmap') renderRoadmap();
  if (name === 'missables') renderMissables();
}

function renderAll() { renderProgress(); renderList(); renderDetail(); }

document.querySelectorAll('.tab').forEach((b) => b.addEventListener('click', () => switchView(b.dataset.view)));
document.querySelectorAll('.chip').forEach((c) => c.addEventListener('click', () => {
  document.querySelectorAll('.chip').forEach((x) => x.classList.toggle('active', x === c));
  kindFilter = c.dataset.kind;
  renderList();
}));
$('grade').addEventListener('change', (e) => { gradeFilter = e.target.value; renderList(); });
$('search').addEventListener('input', (e) => { query = e.target.value.trim().toLowerCase(); renderList(); });
$('spoiler').checked = spoiler;
$('spoiler').addEventListener('change', (e) => { spoiler = e.target.checked; renderAll(); });
$('export').addEventListener('click', () => {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify({ game: 'Grand Theft Auto VI', earned: [...earned].sort((x, y) => x - y), exportedAt: new Date().toISOString() }, null, 2)], { type: 'application/json' }));
  a.download = 'gta6-trophy-progress.json';
  a.click();
  URL.revokeObjectURL(a.href);
});
$('import').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    const ids = Array.isArray(data) ? data : data.earned;
    earned = new Set(ids.filter((id) => byId.has(id)));
    save(); renderAll();
  } catch { alert('Could not read that file — it is not a trophy progress export from this guide.'); }
  e.target.value = '';
});

if (params.get('view') && ['checklist', 'roadmap', 'missables', 'about'].includes(params.get('view'))) switchView(params.get('view'));
renderAll();
