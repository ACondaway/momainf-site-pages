fetch('gallery-data.json').then(r=>r.json()).then(data=>{
  const root=document.getElementById('featured-scenes');if(!root)return;
  const selected=data.scenes.filter(s=>s.featured).slice(0,3);
  (selected.length?selected:data.scenes.slice(0,3)).forEach(s=>{
    const a=document.createElement('a'),img=document.createElement('img'),p=document.createElement('p');a.href='gallery.html#'+encodeURIComponent(s.id);img.src=s.overview;img.loading='lazy';img.alt=s.title.zh||s.title.en;for(const lang of ['zh','en']){const span=document.createElement('span');span.lang=lang;span.textContent=s.title[lang]||s.title.zh;p.append(span);}a.append(img,p);root.append(a);
  });
}).catch(()=>{});
