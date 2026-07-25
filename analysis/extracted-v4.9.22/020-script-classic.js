
(function(){
  'use strict';
  function textFrom(id){ const el=document.getElementById(id); return el ? el.textContent : ''; }
  async function copyText(text, statusId, ok){
    const status=document.getElementById(statusId);
    if(!text){ if(status) status.textContent='Text not found.'; return; }
    try { await navigator.clipboard.writeText(text); if(status) status.textContent=ok || 'Copied.'; }
    catch(_) { if(status) status.textContent='Select the text manually and copy it.'; }
  }
  function downloadText(text, filename){
    if(!text) return;
    const blob = new Blob([text], {type:'text/plain;charset=utf-8'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(()=>URL.revokeObjectURL(a.href), 500);
  }
  function rec(type,id,meta){ try{ window.MLUXStats && window.MLUXStats.record(type,id,meta); }catch(_){} }
  document.addEventListener('DOMContentLoaded', function(){
    const promptText = () => textFrom('dev-prompt-text') || textFrom('prompt-json-lesson-v12');
    const roadmapText = () => textFrom('dev-roadmap-text');
    document.getElementById('copy-json-lesson-prompt-v12')?.addEventListener('click', ()=>{ rec('prompt','prompt-copy-guide',{stream:'prompt-for-json-lesson', version:'v1.5'}); copyText(textFrom('prompt-json-lesson-v12'), 'copy-json-lesson-prompt-status', 'Copied Prompt v1.5.'); });
    document.getElementById('download-json-lesson-prompt-v12')?.addEventListener('click', ()=>{ rec('prompt','prompt-download-guide',{stream:'prompt-for-json-lesson', version:'v1.5'}); downloadText(textFrom('prompt-json-lesson-v12'), 'prompt-for-JSON-lesson-v1.5.txt'); });
    document.getElementById('dev-copy-prompt-btn')?.addEventListener('click', ()=>{ rec('prompt','dev-copy-prompt-btn',{stream:'prompt-for-json-lesson', version:'v1.5'}); copyText(promptText(), 'dev-prompt-status', 'Prompt copied.'); });
    document.getElementById('dev-download-prompt-btn')?.addEventListener('click', ()=>{ rec('prompt','dev-download-prompt-btn',{stream:'prompt-for-json-lesson', version:'v1.5'}); downloadText(promptText(), 'prompt-for-JSON-lesson-v1.5.txt'); const st=document.getElementById('dev-prompt-status'); if(st) st.textContent='Prompt download started.'; });
    document.getElementById('dev-open-guide-prompt-btn')?.addEventListener('click', ()=>{ rec('prompt','dev-open-guide-prompt-btn',{stream:'prompt-for-json-lesson', version:'v1.5'}); goPanel('guide'); setTimeout(()=>document.getElementById('copy-json-lesson-prompt-v12')?.scrollIntoView({behavior:'smooth',block:'center'}), 100); });
    document.getElementById('dev-copy-roadmap-btn')?.addEventListener('click', ()=>{ rec('roadmap','dev-copy-roadmap-btn',{stream:'roadmap', version:'v4.9.16'}); copyText(roadmapText(), 'dev-roadmap-status', 'Roadmap copied.'); });
    document.getElementById('dev-download-roadmap-btn')?.addEventListener('click', ()=>{ rec('roadmap','dev-download-roadmap-btn',{stream:'roadmap', version:'v4.9.16'}); downloadText(roadmapText(), 'mathlesson-roadmap-v4.9.16-jsxgraph-mobile-layout-hotfix.md'); const st=document.getElementById('dev-roadmap-status'); if(st) st.textContent='Roadmap download started.'; });
  });
})();
