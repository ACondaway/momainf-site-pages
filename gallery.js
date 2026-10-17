(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  let lang = 'zh', data = {scenes:[]}, active = null, index = 0, opener = null;
  try { lang = localStorage.getItem('momainf-lang') || (navigator.language.startsWith('zh') ? 'zh' : 'en'); } catch {}
  const text = (value) => typeof value === 'string' ? value : value?.[lang] || value?.zh || value?.en || '';
  const label = (zh,en) => lang === 'zh' ? zh : en;
  function setLanguage() { document.documentElement.dataset.lang=lang;document.documentElement.lang=lang==='zh'?'zh-CN':'en';$('showcase-caption').textContent=text(data.video_caption);render();if(active)showView(); }
  function node(tag,content,cls) { const n=document.createElement(tag);if(content)n.textContent=content;if(cls)n.className=cls;return n; }
  function status(scene) { return text(scene.status_label) || label('场景候选 · 尚未完成任务验收','Scene candidate · task execution not validated'); }
  function render() {
    const term=$('search').value.trim().toLowerCase(), collection=$('collection').value;
    const rows=data.scenes.filter(s=>(collection==='all'||s.mode===collection)&&JSON.stringify([s.title,s.caption,s.id]).toLowerCase().includes(term));
    $('scenes').replaceChildren();$('count').textContent=label(`${rows.length} 个场景`,`${rows.length} ${rows.length===1?'scene':'scenes'}`);
    for(const scene of rows) {
      const card=node('article',null,'scene-card'),button=node('button'),img=node('img');
      button.type='button';button.setAttribute('aria-label',label('查看','Open')+' '+text(scene.title));img.src=scene.overview;img.alt=text(scene.title);img.loading='lazy';img.width=960;img.height=600;button.append(img);button.addEventListener('click',()=>open(scene,button));
      const copy=node('div',null,'scene-copy');copy.append(node('small',`${scene.mode==='deepseek'?'DeepSeek':scene.mode==='external'?'Agent comparison':'Archive'} · ${scene.views.length} ${label('视角','views')}`),node('h2',text(scene.title)),node('p',text(scene.caption)),node('span',status(scene),'scene-state'));card.append(button,copy);copy.addEventListener('click',()=>open(scene,button));$('scenes').append(card);
    }
  }
  function open(scene,button) { active=scene;index=Math.max(0,scene.views.findIndex(v=>v.src===scene.overview));opener=button;showView();$('viewer').showModal();history.replaceState(null,'','#'+scene.id); }
  function showView() {
    const view=active.views[index];$('scene-title').textContent=text(active.title);$('scene-meta').textContent=active.mode==='deepseek'?'DeepSeek / SceneGen':active.mode==='external'?'Agent / SceneGen':'MoMaInf / Archive';$('scene-image').src=view.src;$('scene-image').alt=text(view.caption);$('view-caption').textContent=`${index+1} / ${active.views.length} · ${text(view.caption)}`;$('scene-caption').textContent=text(active.caption);$('scene-status').textContent=status(active);$('thumbnails').replaceChildren();$('scene-issues').replaceChildren(...(active.issues||[]).map(issue=>node('li',issue)));
    active.views.forEach((v,i)=>{const b=node('button'),im=node('img');b.type='button';b.setAttribute('aria-label',text(v.caption));b.setAttribute('aria-current',String(i===index));im.src=v.src;im.alt='';im.loading='lazy';b.append(im);b.onclick=()=>{index=i;showView();};$('thumbnails').append(b);});
    $('previous').disabled=$('next').disabled=active.views.length<2;
  }
  $('close').onclick=()=>$('viewer').close();$('viewer').addEventListener('close',()=>{history.replaceState(null,'',location.pathname);opener?.focus();active=null;});
  $('viewer').addEventListener('click',e=>{if(e.target===$('viewer')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close();}});
  function move(delta){if(active){index=(index+delta+active.views.length)%active.views.length;showView();}}
  $('previous').onclick=()=>move(-1);$('next').onclick=()=>move(1);$('viewer').addEventListener('keydown',e=>{if(e.key==='ArrowLeft'){e.preventDefault();move(-1);}if(e.key==='ArrowRight'){e.preventDefault();move(1);}});
  $('language').onclick=()=>{lang=lang==='zh'?'en':'zh';try{localStorage.setItem('momainf-lang',lang);}catch{}setLanguage();};$('search').oninput=render;$('collection').onchange=render;
  fetch('gallery-data.json').then(r=>{if(!r.ok)throw Error();return r.json();}).then(d=>{data=d;setLanguage();if(d.video){$('showcase').hidden=false;$('showcase-video').src=d.video;if(d.video_poster)$('showcase-video').poster=d.video_poster;}const scene=d.scenes.find(s=>s.id===location.hash.slice(1));if(scene)open(scene,null);}).catch(()=>$('load-error').hidden=false);
})();
