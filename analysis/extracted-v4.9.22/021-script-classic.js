
(function(){
'use strict';
const TRACKING_VERSION = 'ml-ux-stats.v1.1';
const MATHLESSON_VERSION = (window.MATHLESSON_APP_VERSION || 'mathlesson.v4.9.22');
const PROMPT_VERSION = 'prompt-for-JSON-lesson-v1.5';
const ROADMAP_VERSION = 'mathlesson-roadmap-v4.9.16-jsxgraph-mobile-layout-hotfix';
const PREFIX = 'ml_ux_stats_';
const KEY_EVENTS = PREFIX + 'events';
const KEY_COUNTS = PREFIX + 'counts';
const KEY_SEQ = PREFIX + 'seq';
const KEY_SESSIONS = PREFIX + 'sessions';
const KEY_MODE = PREFIX + 'mode';
const MAX_EVENTS = 2000;
const MAX_SESSIONS = 100;
let sessionStart = Date.now();
let sessionEvents = 0;
let lastId = null;
let lastPanel = null;
let activeTab = 'freq';
let activeUXMode = 'mixed-development';
const UX_MODES = {
  'learner':'Learner / student',
  'author':'Author / superuser',
  'mixed-development':'Mixed / development'
};
const LABELS = {
  hamburger:'Menu', 'layout-sidebar-toggle':'Sidebar layout', 'layout-wide-toggle':'Wide mode', 'theme-toggle':'Theme toggle',
  'quick-import-label':'Import JSON', 'quick-import-input':'Import JSON file picker', 'print-btn':'Print', 'lesson-select':'Lesson selector',
  'nav-toc-btn':'TOC navigation', 'nav-editor-btn':'Lesson Editor', 'advanced-toggle':'Advanced / Reference toggle',
  'btn-submit':'Quiz Submit / Recheck', 'btn-reset':'Quiz reset', 'btn-review':'Quiz review', 'btn-retake':'Quiz retake',
  'ed-save-btn':'Editor save', 'ed-new-btn':'Editor new', 'ed-load-btn':'Editor load saved', 'ed-export-btn':'Export Editor JSON',
  'ed-export-active-btn':'Export Active Lesson JSON', 'ed-export-student-btn':'Export Student Lesson + Quiz', 'ed-import-input':'Editor import input',
  'ed-delete-btn':'Editor delete', 'ed-add-sec':'Add section', 'ed-add-q':'Add quiz question', 'ed-clear-imports-btn':'Clear imported lessons/state',
  'tool-scan-btn':'Reveal scan', 'print-scan-btn':'Print scan', 'stress-copy-log-btn':'Stress log copy', 'stress-clear-log-btn':'Stress log clear',
  'copy-json-lesson-prompt-v12':'Copy Prompt v1.5 from Guide', 'download-json-lesson-prompt-v12':'Download Prompt v1.5 from Guide',
  'dev-copy-prompt-btn':'Copy current prompt', 'dev-download-prompt-btn':'Download current prompt', 'dev-open-guide-prompt-btn':'Open guide prompt',
  'dev-copy-roadmap-btn':'Copy current roadmap', 'dev-download-roadmap-btn':'Download current roadmap', 'ml-ux-stats-pill':'UX Stats pill'
};
function safeGet(k, fallback){ try{ const raw=localStorage.getItem(k); return raw ? JSON.parse(raw) : fallback; }catch(_){ return fallback; } }
function safeSet(k,v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(_){} }
try{ activeUXMode = safeGet(KEY_MODE, 'mixed-development') || 'mixed-development'; }catch(_){}
function uxModeLabel(m){ return UX_MODES[m] || UX_MODES['mixed-development']; }
function modeOptionsHTML(){ return Object.keys(UX_MODES).map(k=>`<option value="${k}" ${k===activeUXMode?'selected':''}>${UX_MODES[k]}</option>`).join(''); }
function setUXMode(m){ if(!UX_MODES[m]) m='mixed-development'; activeUXMode=m; safeSet(KEY_MODE,m); record('telemetry','ux-mode-change',{stream:'mathlesson', mode:m, modeLabel:uxModeLabel(m)}); const pill=document.getElementById('ml-ux-stats-pill'); if(pill) pill.title='Open UX Stats dashboard (Shift+T). Current mode: '+uxModeLabel(m); }
function nowISO(){ return new Date().toISOString(); }
function label(id){ if(!id) return '—'; if(LABELS[id]) return LABELS[id]; if(id.indexOf('panel-')===0) return 'Panel: ' + id.replace(/^panel-/,''); return id; }
function streamFor(id, type, meta){
  if(meta && meta.stream) return meta.stream;
  const ss = String(id||'');
  if(ss.includes('prompt')) return 'prompt-for-json-lesson';
  if(ss.includes('roadmap')) return 'roadmap';
  return 'mathlesson';
}
function storeEvent(ev){ const events=safeGet(KEY_EVENTS, []); events.push(ev); if(events.length>MAX_EVENTS) events.splice(0, events.length-MAX_EVENTS); safeSet(KEY_EVENTS, events); }
function record(type, id, meta){
  try{
    if(!id) return;
    id = String(id);
    sessionEvents++;
    const stream = streamFor(id,type,meta||{});
    const ev = { t: nowISO(), type: type||'event', id, label: label(id), stream, uxMode: activeUXMode, uxModeLabel: uxModeLabel(activeUXMode), meta: meta||null };
    storeEvent(ev);
    const counts=safeGet(KEY_COUNTS, {}); counts[id]=(counts[id]||0)+1; safeSet(KEY_COUNTS, counts);
    if(lastId && lastId !== id){ const seq=safeGet(KEY_SEQ, {}); const pair=lastId+'→'+id; seq[pair]=(seq[pair]||0)+1; safeSet(KEY_SEQ, seq); }
    lastId=id;
  }catch(_){ }
}
window.MLUXStats = { record, buildDashboard: toggleDashboard, version: TRACKING_VERSION };
function saveSession(){
  const sessions=safeGet(KEY_SESSIONS, []);
  const rec = { start:new Date(sessionStart).toISOString(), end:nowISO(), duration_s:Math.round((Date.now()-sessionStart)/1000), events:sessionEvents, last_panel:lastPanel, uxMode:activeUXMode, uxModeLabel:uxModeLabel(activeUXMode), mathlessonVersion:MATHLESSON_VERSION, promptVersion:PROMPT_VERSION, roadmapVersion:ROADMAP_VERSION, trackingVersion:TRACKING_VERSION };
  sessions.push(rec); if(sessions.length>MAX_SESSIONS) sessions.splice(0, sessions.length-MAX_SESSIONS); safeSet(KEY_SESSIONS, sessions);
}
window.addEventListener('beforeunload', saveSession);
const structural = new Set(['app','content','sidebar','topbar','topbar-right','sidebar-backdrop','editor-overlay','section-nav','section-progress-wrap','section-progress-bar-bg','section-progress-fill']);
document.addEventListener('click', function(e){
  const el = e.target && e.target.closest ? e.target.closest('[id]') : null;
  if(!el || !el.id || structural.has(el.id) || el.id === 'ml-ux-stats-overlay') return;
  if(el.closest && el.closest('#ml-ux-stats-overlay')) return;
  record('click', el.id, { tag: el.tagName, text: (el.innerText||el.value||'').trim().slice(0,80) });
}, true);
document.addEventListener('change', function(e){
  const id=e.target && e.target.id;
  if(!id) return;
  const meta = { value: (e.target.value||'').slice(0,120) };
  if(e.target.files && e.target.files[0]) meta.file = e.target.files[0].name;
  record('change', id, meta);
}, true);
function wrapNavigation(){
  if(typeof window.goPanel === 'function' && !window.goPanel._mlUxWrapped){
    const old = window.goPanel;
    window.goPanel = function(id){ const from=lastPanel; lastPanel='panel-'+id; record('panel','panel-'+id,{from, to:'panel-'+id, stream: id==='devassets'?'roadmap':'mathlesson'}); return old.apply(this, arguments); };
    window.goPanel._mlUxWrapped = true;
  }
  if(typeof window.openEditor === 'function' && !window.openEditor._mlUxWrapped){
    const oldOpen = window.openEditor;
    window.openEditor = function(){ record('panel','panel-editor-modal',{from:lastPanel, to:'editor-modal'}); return oldOpen.apply(this, arguments); };
    window.openEditor._mlUxWrapped = true;
  }
}
wrapNavigation();
document.addEventListener('DOMContentLoaded', wrapNavigation);
setTimeout(wrapNavigation, 1000);
document.addEventListener('toggle', function(e){
  if(!e.target.open) return;
  const txt = (e.target.querySelector('summary')?.textContent || '').toLowerCase();
  if(txt.includes('prompt')) record('prompt','prompt-preview-opened',{stream:'prompt-for-json-lesson', version:'v1.5'});
  if(txt.includes('roadmap')) record('roadmap','roadmap-preview-opened',{stream:'roadmap', version:'v4.9.16'});
}, true);
function exportData(){ return { metadata:{ mathlessonVersion:MATHLESSON_VERSION, promptVersion:PROMPT_VERSION, roadmapVersion:ROADMAP_VERSION, trackingVersion:TRACKING_VERSION, uxMode:activeUXMode, uxModeLabel:uxModeLabel(activeUXMode), modeDefinitions:UX_MODES, exportedAt:nowISO(), currentSession:{ start:new Date(sessionStart).toISOString(), duration_s:Math.round((Date.now()-sessionStart)/1000), events:sessionEvents, last_panel:lastPanel } }, counts:safeGet(KEY_COUNTS,{}), seq:safeGet(KEY_SEQ,{}), events:safeGet(KEY_EVENTS,[]), sessions:safeGet(KEY_SESSIONS,[]) }; }
function topCounts(counts){ return Object.entries(counts).sort((a,b)=>b[1]-a[1]); }
function tier(count,max){ if(!max) return 'T4'; const r=count/max; return r>=.6?'T1':r>=.3?'T2':r>=.1?'T3':'T4'; }
function computeMarkov(){
  const counts=safeGet(KEY_COUNTS,{}), seq=safeGet(KEY_SEQ,{}); const nodes=topCounts(counts).slice(0,12).map(x=>x[0]);
  const P={}, raw={}; nodes.forEach(a=>{ raw[a]={}; P[a]={}; nodes.forEach(b=>{ raw[a][b]=0; P[a][b]=0; }); });
  Object.entries(seq).forEach(([pair,c])=>{ const i=pair.indexOf('→'); if(i<0)return; const a=pair.slice(0,i), b=pair.slice(i+1); if(raw[a] && raw[a][b]!==undefined) raw[a][b]+=c; });
  nodes.forEach(a=>{ const sum=nodes.reduce((sum,b)=>sum+(a===b?0:raw[a][b]),0); nodes.forEach(b=>{ P[a][b]=(a===b||!sum)?0:raw[a][b]/sum; }); });
  const strong=[]; nodes.forEach(a=>nodes.forEach(b=>{ if(a!==b && P[a][b]>=.4) strong.push([a,b,P[a][b]]); }));
  strong.sort((x,y)=>y[2]-x[2]);
  const clusters=[]; const used=new Set(); nodes.forEach(a=>{ if(used.has(a))return; let group=[a]; used.add(a); nodes.forEach(b=>{ if(!used.has(b) && ((P[a][b]||0)+(P[b][a]||0))>=.15){ group.push(b); used.add(b); } }); clusters.push(group); });
  const deadEnds=nodes.filter(a=>Math.max(0,...nodes.filter(b=>b!==a).map(b=>P[a][b]||0))<.10);
  const inbound={}; nodes.forEach(b=>{ inbound[b]=nodes.filter(a=>a!==b && (P[a][b]||0)>.15).length; });
  const bottlenecks=nodes.filter(b=>inbound[b]>=3).sort((a,b)=>inbound[b]-inbound[a]);
  const total=Object.values(counts).reduce((sum,v)=>sum+v,0)||1; const orphans=nodes.filter(b=>inbound[b]===0 && ((counts[b]||0)/total)<.03);
  return {nodes,P,raw,strong,clusters,deadEnds,bottlenecks,orphans,inbound};
}
function esc(v){ return String(v == null ? '' : v).replace(/[&<>"']/g, ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch])); }
function probColor(p){ if(p>=.75)return '#2563eb'; if(p>=.50)return '#1d4ed8'; if(p>=.25)return '#1e40af'; if(p>=.10)return '#172554'; if(p>0)return '#111827'; return '#05070b'; }
function tabButton(id, txt){ return `<button data-ml-tab="${id}" style="border:1px solid ${activeTab===id?'#60a5fa':'#263244'};background:${activeTab===id?'#1e3a8a':'#0b1020'};color:${activeTab===id?'#fff':'#94a3b8'};border-radius:7px;padding:6px 10px;font-family:inherit;cursor:pointer;">${txt}</button>`; }
function renderDashboard(tab){
  activeTab=tab||activeTab; const data=exportData(); const counts=data.counts, seq=data.seq, events=data.events, sessions=data.sessions; const ranked=topCounts(counts); const max=ranked[0]?.[1]||0; const mk=computeMarkov();
  let body='';
  if(activeTab==='freq') body = `<div style="display:grid;gap:7px;">${ranked.map(([id,c])=>`<div style="display:grid;grid-template-columns:220px 1fr 52px 36px;gap:8px;align-items:center;"><div title="${esc(id)}" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#dbeafe;">${esc(label(id))}</div><div style="height:11px;background:#111827;border-radius:99px;overflow:hidden;"><div style="width:${Math.max(2,Math.round(c/max*100))}%;height:100%;background:#60a5fa;"></div></div><div style="color:#cbd5e1;text-align:right;">${c}</div><div style="color:#fbbf24;">${tier(c,max)}</div></div>`).join('') || '<p>No events yet.</p>'}</div>`;
  else if(activeTab==='trans') body = `<div style="display:grid;gap:6px;">${Object.entries(seq).sort((a,b)=>b[1]-a[1]).slice(0,120).map(([pair,c])=>{const [a,b]=pair.split('→');return `<div style="display:grid;grid-template-columns:1fr 22px 1fr 44px;gap:8px;align-items:center;background:#070b13;border:1px solid #1f2937;border-radius:7px;padding:6px 8px;"><span>${esc(label(a))}</span><span style="color:#60a5fa;">→</span><span>${esc(label(b))}</span><strong style="text-align:right;color:#a7f3d0;">${c}</strong></div>`}).join('') || '<p>No transitions yet.</p>'}</div>`;
  else if(activeTab==='markov') body = mk.nodes.length ? `<div style="overflow:auto;"><table style="border-collapse:collapse;font-size:10px;min-width:720px;"><thead><tr><th style="position:sticky;left:0;background:#111827;padding:6px;">FROM \\ TO</th>${mk.nodes.map(n=>`<th style="padding:6px;max-width:90px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(label(n))}</th>`).join('')}</tr></thead><tbody>${mk.nodes.map(a=>`<tr><th style="position:sticky;left:0;background:#111827;text-align:left;padding:6px;max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(label(a))}</th>${mk.nodes.map(b=>`<td title="${esc(label(a))} → ${esc(label(b))}: ${(mk.P[a][b]*100).toFixed(1)}%" style="text-align:center;padding:6px;background:${probColor(mk.P[a][b])};color:${mk.P[a][b]>.35?'#fff':'#94a3b8'};">${mk.P[a][b] ? Math.round(mk.P[a][b]*100)+'%' : '·'}</td>`).join('')}</tr>`).join('')}</tbody></table></div>` : '<p>Need at least two tracked elements.</p>';
  else if(activeTab==='insights') body = `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:14px;"><div><h3>Strong couplings</h3>${mk.strong.slice(0,10).map(([a,b,p])=>`<p>${esc(label(a))} → ${esc(label(b))}: <strong>${Math.round(p*100)}%</strong></p>`).join('')||'<p>None yet.</p>'}</div><div><h3>Behavioral clusters</h3>${mk.clusters.map(g=>`<p>${g.map(x=>esc(label(x))).join(' · ')}</p>`).join('')||'<p>None yet.</p>'}</div><div><h3>Dead ends</h3>${mk.deadEnds.map(x=>`<p>${esc(label(x))}</p>`).join('')||'<p>None.</p>'}</div><div><h3>Bottlenecks</h3>${mk.bottlenecks.map(x=>`<p>${esc(label(x))} (${mk.inbound[x]} inbound)</p>`).join('')||'<p>None yet.</p>'}</div><div><h3>Orphans</h3>${mk.orphans.map(x=>`<p>${esc(label(x))}</p>`).join('')||'<p>None yet.</p>'}</div><div><h3>Salience tiers</h3><p>T1 dominant, T2 frequent, T3 moderate, T4 rare. Use this for later color/contrast decisions.</p></div></div>`;
  else if(activeTab==='events') body = `<div style="display:grid;gap:5px;">${events.slice(-150).reverse().map(e=>`<div style="display:grid;grid-template-columns:82px 130px 135px 1fr 84px;gap:8px;background:#070b13;border:1px solid #1f2937;border-radius:7px;padding:5px 8px;"><span style="color:#60a5fa;">${esc(e.type)}</span><span style="color:#fbbf24;">${esc(e.stream)}</span><span style="color:#a7f3d0;">${esc(e.uxMode || 'mixed-development')}</span><span>${esc(e.label || label(e.id))}</span><span style="color:#64748b;">${esc((e.t||'').slice(11,19))}</span></div>`).join('')||'<p>No events yet.</p>'}</div>`;
  else body = `<div style="display:grid;gap:7px;">${sessions.slice(-60).reverse().map(s=>`<div style="display:grid;grid-template-columns:160px 90px 80px 1fr;gap:8px;background:#070b13;border:1px solid #1f2937;border-radius:7px;padding:6px 8px;"><span>${esc((s.start||'').replace('T',' ').slice(0,16))}</span><span>${esc(s.duration_s)}s</span><span>${esc(s.events)} events</span><span>${esc(label(s.last_panel))}</span></div>`).join('')||'<p>No completed sessions yet.</p>'}</div>`;
  const old=document.getElementById('ml-ux-stats-overlay'); if(old) old.remove();
  const overlay=document.createElement('div'); overlay.id='ml-ux-stats-overlay'; overlay.innerHTML=`<div style="position:fixed;inset:0;z-index:100000;background:rgba(0,0,0,.72);display:flex;align-items:center;justify-content:center;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:12px;color:#e5e7eb;"><div style="width:min(1120px,96vw);max-height:92vh;background:#0b1020;border:1px solid #263244;border-radius:14px;box-shadow:0 24px 80px rgba(0,0,0,.75);display:flex;flex-direction:column;overflow:hidden;"><div style="padding:14px 18px;background:#070b13;border-bottom:1px solid #263244;display:flex;gap:12px;align-items:center;"><strong style="color:#60a5fa;">UX Stats · ${esc(TRACKING_VERSION)}</strong><span style="color:#94a3b8;">${events.length} events · ${sessions.length} sessions · ${sessionEvents} this session</span><label style="margin-left:auto;color:#cbd5e1;display:flex;gap:6px;align-items:center;">Mode <select id="ml-ux-mode-select" style="background:#111827;color:#e5e7eb;border:1px solid #334155;border-radius:6px;padding:3px 6px;font-family:inherit;font-size:11px;">${modeOptionsHTML()}</select></label><span style="color:#fbbf24;">localStorage only · development-only</span><button id="ml-ux-close" style="background:transparent;color:#cbd5e1;border:1px solid #334155;border-radius:7px;padding:4px 9px;cursor:pointer;">✕</button></div><div style="display:flex;gap:6px;flex-wrap:wrap;padding:10px 18px;border-bottom:1px solid #1f2937;background:#0a0f1d;">${tabButton('freq','Frequency')}${tabButton('trans','Transitions')}${tabButton('markov','Markov Matrix')}${tabButton('insights','Insights')}${tabButton('events','Recent Events')}${tabButton('sessions','Sessions')}</div><div style="padding:16px 18px;overflow:auto;min-height:360px;">${body}</div><div style="padding:10px 18px;background:#070b13;border-top:1px solid #263244;display:flex;gap:10px;align-items:center;"><span style="color:#64748b;">Shift+T toggles dashboard. Paste Copy JSON output into ChatGPT for UX analysis.</span><button id="ml-ux-clear" style="margin-left:auto;background:transparent;color:#fca5a5;border:1px solid #7f1d1d;border-radius:7px;padding:5px 10px;cursor:pointer;">Clear all data</button><button id="ml-ux-copy" style="background:#1d4ed8;color:white;border:1px solid #3b82f6;border-radius:7px;padding:5px 10px;cursor:pointer;">Copy JSON</button></div></div></div>`;
  document.body.appendChild(overlay);
  overlay.querySelector('#ml-ux-close').onclick=()=>overlay.remove();
  overlay.querySelectorAll('[data-ml-tab]').forEach(btn=>btn.onclick=()=>renderDashboard(btn.dataset.mlTab));
  const modeSel=overlay.querySelector('#ml-ux-mode-select'); if(modeSel) modeSel.onchange=()=>{ setUXMode(modeSel.value); renderDashboard(activeTab); };
  overlay.querySelector('#ml-ux-clear').onclick=()=>{ if(confirm('Clear all local UX stats data?')){ [KEY_EVENTS,KEY_COUNTS,KEY_SEQ,KEY_SESSIONS].forEach(k=>{try{localStorage.removeItem(k)}catch(_){}}); overlay.remove(); } };
  overlay.querySelector('#ml-ux-copy').onclick=async function(){ const text=JSON.stringify(exportData(),null,2); try{ await navigator.clipboard.writeText(text); this.textContent='Copied'; setTimeout(()=>this.textContent='Copy JSON',1500); }catch(_){ const ta=document.createElement('textarea'); ta.value=text; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove(); this.textContent='Copied'; } };
}
function toggleDashboard(){ const old=document.getElementById('ml-ux-stats-overlay'); if(old){ old.remove(); } else { renderDashboard(activeTab); } }
document.addEventListener('keydown', function(e){
  if(!(e.shiftKey && (e.key==='T'||e.key==='t')) || e.ctrlKey || e.metaKey || e.altKey) return;
  const tag=document.activeElement && document.activeElement.tagName;
  if(['INPUT','TEXTAREA','SELECT'].includes(tag) || document.activeElement?.closest?.('math-field')) return;
  e.preventDefault(); record('telemetry','ux-stats-shortcut',{stream:'mathlesson'}); toggleDashboard();
});
document.addEventListener('DOMContentLoaded', function(){
  if(document.getElementById('ml-ux-stats-pill')) return;
  const pill=document.createElement('button'); pill.id='ml-ux-stats-pill'; pill.type='button'; pill.textContent='UX Stats'; pill.title='Open local UX Stats dashboard (Shift+T). Current mode: '+uxModeLabel(activeUXMode);
  pill.style.cssText='position:fixed;right:14px;bottom:14px;z-index:9998;border:1px solid #60a5fa;background:#0b1020;color:#bfdbfe;border-radius:999px;padding:7px 10px;font:12px ui-monospace,monospace;box-shadow:0 10px 28px rgba(37,99,235,.35);cursor:pointer;opacity:.82;';
  pill.onmouseenter=()=>pill.style.opacity='1'; pill.onmouseleave=()=>pill.style.opacity='.82'; pill.onclick=()=>{ record('telemetry','ml-ux-stats-pill',{stream:'mathlesson'}); toggleDashboard(); };
  document.body.appendChild(pill);
});
})();
