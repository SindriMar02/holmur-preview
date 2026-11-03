/* Hólmur v4 · Hólmur þýðir eyja. Motion spec: _docs/holmur-2026-10-28/v4/MOTION.md. Lenis on fine pointers, native touch; one owner per animated property. */
(() => {
'use strict';
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const root=document.documentElement;
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const fine=matchMedia('(pointer:fine)');
const motion=!!window.gsap;
if(motion) gsap.registerPlugin(ScrollTrigger,Flip,SplitText);
const duration=n=>reduced.matches?0:n;
const syncRm=()=>root.classList.toggle('rm',reduced.matches);syncRm();

/* ---- scroll lock for dialogs ---- */
let scrollState=null,lenis;
function lock(){lenis?.stop();if(scrollState)return;scrollState={y:scrollY,position:document.body.style.position,top:document.body.style.top,width:document.body.style.width};Object.assign(document.body.style,{position:'fixed',top:`-${scrollState.y}px`,width:'100%'});}
function unlock(){if(!scrollState)return;const s=scrollState;scrollState=null;Object.assign(document.body.style,{position:s.position,top:s.top,width:s.width});window.scrollTo(0,s.y);syncDialogScroll();}
function focusPanel(panel,first,viaKey){(viaKey?first||panel:panel).focus({preventScroll:true});}

/* ---- wordmark: fitted to the content width (hero + footer share --wm-fs) ---- */
function fitWordmark(){
 const hero=$('.hero .wm'),box=$('.wordmark');if(!hero||!box)return;
 const probe=document.createRange();hero.style.fontSize='100px';probe.selectNodeContents(hero);
 const natural=probe.getBoundingClientRect().width;hero.style.fontSize='';
 const avail=box.clientWidth;if(natural>0&&avail>0)root.style.setProperty('--wm-fs',`${Math.floor(100*avail/natural*10)/10}px`);
}

/* ---- Lenis: fine pointers only, never reduced motion ---- */
const tickLenis=time=>lenis?.raf(time*1000);
function syncDialogScroll(){
 if(!lenis)return;
 if(scrollState||document.querySelector('dialog[open]'))lenis.stop();
 else{lenis.start();lenis.scrollTo(scrollY,{immediate:true,force:true});}
}
function setupScroll(){
 if(lenis){gsap.ticker.remove(tickLenis);lenis.destroy();lenis=null;}
 if(motion&&window.Lenis&&fine.matches&&!reduced.matches){
  lenis=new Lenis({lerp:.1,wheelMultiplier:1,smoothWheel:true,syncTouch:false});
  lenis.on('scroll',ScrollTrigger.update);gsap.ticker.add(tickLenis);syncDialogScroll();
 }
}
new MutationObserver(syncDialogScroll).observe(document.body,{subtree:true,attributes:true,attributeFilter:['open']});
fine.addEventListener('change',setupScroll);reduced.addEventListener('change',setupScroll);
setupScroll();
document.addEventListener('click',e=>{
 const a=e.target.closest('a[href^="#"]');if(!a||e.defaultPrevented||e.metaKey||e.ctrlKey)return;
 const target=document.getElementById(a.hash.slice(1));if(!target||!lenis)return;
 e.preventDefault();const barH=$('.bar').getBoundingClientRect().height;
 lenis.scrollTo(target,{offset:-barH,duration:1.4,onComplete:()=>{target.setAttribute('tabindex','-1');target.focus({preventScroll:true});}});
 history.pushState(null,'',a.hash);
});

/* ---- buttons: label char roll (M9) ---- */
$$('.btn-t').forEach(t=>{
 const label=t.textContent.trim();t.parentElement.setAttribute('aria-label',label);
 t.innerHTML=`<span class="r" aria-hidden="true">${[...label].map((c,i)=>`<span class="ch" data-c="${c===' '?' ':c}" style="--i:${i}">${c===' '?' ':c}</span>`).join('')}</span>`;
});

/* ---- wordmark letters (M1) ---- */
const wm=$('.hero .wm');
if(wm){const text=wm.textContent;wm.innerHTML=[...text].map(c=>`<span class="c" style="display:inline-block">${c}</span>`).join('');}

/* ---- year numerals ---- */
const rail=$('.year-rail');
$$('.year-rail strong').forEach(s=>{const y=s.textContent;s.setAttribute('aria-label',y);s.innerHTML=[...y].map(d=>`<span class="year-digit-mask" aria-hidden="true"><span class="year-digit">${d}</span></span>`).join('');});

/* ---- bar state + scroll spy ---- */
const bar=$('.bar');
function barAndSpy(){
 ScrollTrigger.create({trigger:'.hero',start:'bottom top+=96',end:()=>document.documentElement.scrollHeight*2,onToggle:s=>bar.classList.toggle('is-solid',s.isActive)});
 $$('.nav a').forEach(a=>{const t=document.getElementById(a.hash.slice(1));if(!t)return;
  ScrollTrigger.create({trigger:t,start:'top 45%',end:'bottom 45%',onToggle:s=>{if(s.isActive)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');}});});
 // the fixed footer is only painted near the end of the page, so it can never show through during fast jumps on iOS
 ScrollTrigger.create({trigger:'.page',start:'bottom bottom+=360',end:()=>ScrollTrigger.maxScroll(window)+20,onToggle:s=>root.classList.toggle('foot-on',s.isActive)});
 if(!reduced.matches)gsap.fromTo('.page-progress',{scaleX:0},{scaleX:1,ease:'none',scrollTrigger:{start:0,end:()=>ScrollTrigger.maxScroll(window),scrub:true}});
}

/* ---- section motion (M3 to M8, M14) ---- */
function sectionMotion(){
 // M3 headings and statements: line masks, accent-safe
 $$('.split').forEach(el=>{
  // the clip exists only while a line rises; once shown, every mask opens so no heading can ever be cut (descenders, accents)
  SplitText.create(el,{type:'lines',mask:'lines',linesClass:'hm-line',autoSplit:true,onSplit(self){
   const masks=self.lines.map(l=>l.parentElement);masks.forEach(m=>m.classList.add('hm-line-mask'));
   if(el._shown){masks.forEach(m=>{m.style.overflow='visible';});return;}
   return gsap.from(self.lines,{yPercent:108,duration:1.2,stagger:.09,ease:'expo.out',scrollTrigger:{trigger:el,start:'top 88%',once:true},onComplete:()=>{el._shown=true;masks.forEach(m=>{m.style.overflow='visible';});}});
  }});
 });
 // M4 paragraphs, labels, rows
 $$('.reveal').forEach(el=>gsap.from(el,{opacity:0,y:26,duration:1.1,ease:'expo.out',scrollTrigger:{trigger:el,start:'top 91%',once:true}}));
 $$('.rooms li').forEach(el=>gsap.from(el,{opacity:0,y:22,duration:1,ease:'expo.out',scrollTrigger:{trigger:el,start:'top 92%',once:true}}));
 // M5 photos: clip reveal + settle, big ones also drift
 $$('.photo').forEach(el=>{
  const img=$('img',el);
  gsap.fromTo(el,{clipPath:'inset(14% 0% 0% 0%)'},{clipPath:'inset(0% 0% 0% 0%)',duration:1.4,ease:'expo.out',scrollTrigger:{trigger:el.parentElement,start:'top 90%',once:true}});
  if(!el.classList.contains('big'))gsap.from(img,{scale:1.16,duration:1.6,ease:'expo.out',scrollTrigger:{trigger:el.parentElement,start:'top 90%',once:true}});
 });
 $$('.big .ph-in img').forEach(img=>gsap.fromTo(img,{yPercent:-6},{yPercent:6,ease:'none',scrollTrigger:{trigger:img.closest('.photo'),start:'top bottom',end:'bottom top',scrub:true}}));
 gsap.fromTo('.area-media',{yPercent:-5},{yPercent:5,ease:'none',scrollTrigger:{trigger:'.area-hero',start:'top bottom',end:'bottom top',scrub:true}});
 gsap.to('.hero-media img',{yPercent:10,ease:'none',scrollTrigger:{trigger:'.hero',start:'top top',end:'bottom top',scrub:true}});
 // M6 river lines
 // dash length is measured in screen px (the strokes do not scale), so the draw is one continuous stroke tied 1:1 to scroll
 const screenLen=path=>{const m=path.ownerSVGElement.getScreenCTM();if(!m)return 0;const total=path.getTotalLength(),N=240;let L=0,prev;
  for(let i=0;i<=N;i++){const pt=path.getPointAtLength(total*i/N),x=pt.x*m.a+pt.y*m.c,y=pt.x*m.b+pt.y*m.d;if(prev)L+=Math.hypot(x-prev[0],y-prev[1]);prev=[x,y];}return L;};
 const riverSets=[];
 $$('.river').forEach(r=>{const lines=$$('.river-line',r);
  const set=()=>lines.forEach(l=>{l._L=Math.ceil(screenLen(l))+4;l.style.strokeDasharray=`${l._L} ${l._L}`;});
  set();ScrollTrigger.addEventListener('refreshInit',set);riverSets.push(set);
  const smooth=lenis?true:.5;
  lines.forEach((l,i)=>gsap.fromTo(l,{strokeDashoffset:()=>l._L},{strokeDashoffset:0,ease:'none',immediateRender:true,scrollTrigger:{trigger:r,start:'top 92%',end:i?'bottom 14%':'bottom 30%',scrub:smooth,invalidateOnRefresh:true}}));
 });
 // M7 year rail
 gsap.fromTo(rail,{'--yp':0},{'--yp':1,ease:'none',scrollTrigger:{trigger:rail,start:'top 82%',end:'bottom 52%',scrub:.8}});
 $$('.year-rail li').forEach(li=>{
  gsap.from($$('.year-digit',li),{yPercent:112,duration:1.1,stagger:.05,ease:'expo.out',scrollTrigger:{trigger:li,start:'top 92%',once:true}});
  gsap.from($('i',li),{scale:0,duration:.8,ease:'expo.out',scrollTrigger:{trigger:li,start:'top 92%',once:true}});
  gsap.from($(':scope>span',li),{opacity:0,y:14,duration:1,ease:'expo.out',delay:.15,scrollTrigger:{trigger:li,start:'top 92%',once:true}});
 });
 // M8 distances
 const km=$$('.km');km.forEach(el=>{el.parentElement.setAttribute('aria-label',`${el.dataset.km} km`);el.setAttribute('aria-hidden','true');});
 const counts=km.map(el=>({value:0,el}));
 const dtl=gsap.timeline({scrollTrigger:{trigger:'.distances',start:'top 82%',once:true}});
 dtl.from('.distances i',{scaleX:0,duration:1,ease:'expo.out',stagger:.07}).from('.distances li>span',{opacity:0,y:14,duration:.9,ease:'expo.out',stagger:.07},.1)
  .to(counts,{value:i=>Number(km[i].dataset.km),duration:1.1,ease:'power2.out',stagger:.07,onUpdate:()=>counts.forEach(c=>{c.el.textContent=Math.round(c.value);})},.1);
 // booking card
 gsap.from('.booking-card',{y:30,opacity:0,duration:1,ease:'expo.out',scrollTrigger:{trigger:'.booking-card',start:'top 88%',once:true}});
 // M14 footer reveal: wordmark rises while the page lifts away
 gsap.fromTo('.foot-wm span',{yPercent:38},{yPercent:0,ease:'none',scrollTrigger:{trigger:'.page',start:'bottom bottom',end:()=>`bottom bottom-=${$('.foot').offsetHeight}`,scrub:true}});
 return()=>{riverSets.forEach(s=>ScrollTrigger.removeEventListener('refreshInit',s));km.forEach(el=>el.textContent=el.dataset.km);};
}

/* ---- hero arrival (M1) then everything else ---- */
let ctx,arrived=false;
function choreography(){
 if(!motion){root.classList.add('hm-go');return;}
 ctx?.revert();
 if(reduced.matches){arrived=true;root.classList.add('hm-go');gsap.set('.hero .wm .c',{clearProps:'all'});return;}
 ctx=gsap.context(()=>{
  if(!arrived){
   const tl=gsap.timeline({defaults:{ease:'expo.out'}});
   tl.fromTo('.hero-media img',{scale:1.16},{scale:1,duration:2.2,ease:'power3.out',clearProps:'scale'},0)
    .fromTo('.hero-scrim',{opacity:0},{opacity:1,duration:1.4},0)
    .fromTo('.hero .wm .c',{yPercent:112},{yPercent:0,duration:1.4,stagger:.08},.15)
    .fromTo('.hero-copy',{opacity:0,y:24},{opacity:1,y:0,duration:1.2},.6)
    .fromTo('.scroll-cue',{opacity:0},{opacity:1,duration:1},1)
    .fromTo('.bar>*:not(.page-progress)',{opacity:0,y:-14},{opacity:1,y:0,duration:1,stagger:.07,clearProps:'transform'},.7)
    .add(()=>{const w=$('.wordmark');if(w)w.style.overflow='visible';});
   arrived=true;
  }
  barAndSpy();
  const cleanup=sectionMotion();
  root.classList.add('hm-go');
  return cleanup;
 });
}
Promise.race([document.fonts.ready,new Promise(r=>setTimeout(r,1200))]).then(()=>{
 try{fitWordmark();choreography();}catch(error){console.error('Hólmur motion fallback',error);ctx?.revert();root.classList.remove('js');}
 clearTimeout(window.hmFailSafe);if(!motion)root.classList.remove('js');
});
document.fonts.ready.then(()=>{fitWordmark();window.ScrollTrigger?.refresh();});
let resizeTimer;addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(fitWordmark,120);});
$$('img').forEach(img=>img.addEventListener('load',()=>window.ScrollTrigger?.refresh()));
reduced.addEventListener('change',()=>{syncRm();if(reduced.matches){if(menu.open){menuTimeline?.kill();menuFinish();}if(gallery.open){galleryTimeline?.kill();galleryFinish();}if(book.open){bookTimeline?.kill();bookFinish();}}arrived=true;choreography();window.ScrollTrigger?.refresh();});

/* ---- photo strip: mouse drag (touch scrolls natively) ---- */
const strip=$('.strip');
if(strip){let d=null,moved=false;
 strip.addEventListener('pointerdown',e=>{if(e.pointerType!=='mouse'||e.button!==0)return;d={x:e.clientX,left:strip.scrollLeft,id:e.pointerId};moved=false;});
 strip.addEventListener('pointermove',e=>{if(!d||e.pointerId!==d.id)return;const dx=e.clientX-d.x;if(Math.abs(dx)>5&&!moved){moved=true;strip.classList.add('is-dragging');strip.setPointerCapture(e.pointerId);}if(moved)strip.scrollLeft=d.left-dx;});
 const end=()=>{d=null;strip.classList.remove('is-dragging');};
 strip.addEventListener('pointerup',end);strip.addEventListener('pointercancel',end);strip.addEventListener('dragstart',e=>e.preventDefault());}

/* ---- gallery cursor pill (M15) ---- */
if(motion){const mm=gsap.matchMedia();mm.add('(hover:hover) and (pointer:fine) and (prefers-reduced-motion:no-preference)',()=>{
 const pill=$('.cursor-pill'),x=gsap.quickTo(pill,'x',{duration:.35,ease:'power3.out'}),y=gsap.quickTo(pill,'y',{duration:.35,ease:'power3.out'});
 const move=e=>{x(e.clientX+16);y(e.clientY+16);},enter=e=>{gsap.set(pill,{x:e.clientX+16,y:e.clientY+16});gsap.to(pill,{autoAlpha:1,scale:1,duration:.18,overwrite:'auto'});},leave=()=>gsap.to(pill,{autoAlpha:0,scale:0,duration:.18,overwrite:'auto'});
 const tiles=$$('.gallery-item');tiles.forEach(el=>{el.addEventListener('pointerenter',enter);el.addEventListener('pointermove',move);el.addEventListener('pointerleave',leave);el.addEventListener('click',leave);});
 return()=>{x.tween.kill();y.tween.kill();gsap.killTweensOf(pill);gsap.set(pill,{autoAlpha:0,scale:0});tiles.forEach(el=>{el.removeEventListener('pointerenter',enter);el.removeEventListener('pointermove',move);el.removeEventListener('pointerleave',leave);el.removeEventListener('click',leave);});};
});}

/* ---- MENU (M11): same reversible timeline for open and interrupted close; native modal focus trap ---- */
const menu=$('#menu'),toggle=$('.hamburger');let menuTimeline,menuOpen=false;
function menuFinish(){menu.close();unlock();toggle.focus({preventScroll:true});gsap.set('.hamburger span',{clearProps:'all'});}
function menuClose(immediate=false){if(!menu.open)return;menuOpen=false;toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-label','Opna valmynd');if(immediate||!motion||reduced.matches){menuTimeline?.kill();menuFinish();}else menuTimeline.timeScale(1.5).reverse();}
function menuShow(e){menuOpen=true;toggle.setAttribute('aria-expanded','true');toggle.setAttribute('aria-label','Loka valmynd');lock();menu.showModal();focusPanel(menu,$('nav a',menu),e.detail===0);
 if(!motion||reduced.matches)return;
 menuTimeline?.kill();
 menuTimeline=gsap.timeline({onReverseComplete:menuFinish,defaults:{ease:'power3.inOut'}})
  .fromTo(menu,{clipPath:'inset(0% 0% 100% 0%)'},{clipPath:'inset(0% 0% 0% 0%)',duration:.8},0)
  .fromTo($$('nav>*',menu),{yPercent:70,opacity:0},{yPercent:0,opacity:1,duration:.7,ease:'expo.out',stagger:.06},.3)
  .fromTo('.menu-foot',{opacity:0},{opacity:1,duration:.6},.6)
  .fromTo($$('.hamburger span:first-child,.menu-close span:first-child'),{y:0,rotation:0},{y:4.5,rotation:45,duration:.5},0)
  .fromTo($$('.hamburger span:last-child,.menu-close span:last-child'),{y:0,rotation:0},{y:-4.5,rotation:-45,duration:.5},0);
}
toggle.addEventListener('click',e=>menuOpen?menuClose():menuShow(e));$('.menu-close').addEventListener('click',()=>menuClose());menu.addEventListener('cancel',e=>{e.preventDefault();menuClose();});// menu links: unlock the page FIRST, then go to the section (the scroll lock used to restore the old position over the jump on phones)
$$('a',menu).forEach(a=>a.addEventListener('click',e=>{
 const h=a.getAttribute('href');
 if(!h||h.charAt(0)!=='#'){menuClose(true);return;}
 e.preventDefault();menuClose(true);
 const t=document.getElementById(h.slice(1));if(!t)return;
 let moved=false;const mark=()=>{moved=true;};addEventListener('touchstart',mark,{passive:true,once:true});addEventListener('wheel',mark,{passive:true,once:true});
 const go=()=>{const barH=$('.bar').getBoundingClientRect().height;
  if(lenis)lenis.scrollTo(t,{offset:-barH,immediate:true,force:true});else window.scrollTo({top:Math.max(0,t.getBoundingClientRect().top+scrollY-barH),behavior:'auto'});};
 requestAnimationFrame(()=>{go();history.pushState(null,'',h);t.setAttribute('tabindex','-1');t.focus({preventScroll:true});
  // lazy photos and fonts settle after a long jump: correct the landing twice unless the visitor has already moved on
  [500,1400].forEach(ms=>setTimeout(()=>{if(!moved&&Math.abs(t.getBoundingClientRect().top-$('.bar').getBoundingClientRect().height)>4)go();},ms));});
}));
// a link that arrives with #section (shared, bookmarked, typed) lands flush under the bar even though lazy photos above it settle after the first jump
(()=>{const id=decodeURIComponent(location.hash.slice(1));const t=id&&document.getElementById(id);if(!t)return;
 let moved=false;const mark=()=>{moved=true;};addEventListener('touchstart',mark,{passive:true,once:true});addEventListener('wheel',mark,{passive:true,once:true});
 const fix=()=>{if(moved)return;const barH=$('.bar').getBoundingClientRect().height;if(Math.abs(t.getBoundingClientRect().top-barH)<=4)return;
  if(lenis)lenis.scrollTo(t,{offset:-barH,immediate:true,force:true});else window.scrollTo({top:Math.max(0,t.getBoundingClientRect().top+scrollY-barH),behavior:'auto'});};
 const run=()=>[200,900,1800].forEach(ms=>setTimeout(fix,ms));
 document.readyState==='complete'?run():addEventListener('load',run,{once:true});})();
matchMedia('(min-width:1100px)').addEventListener('change',e=>{if(e.matches&&menu.open)menuClose(true);});

/* ---- GALLERY (M12): rectangle FLIP, reversible open, directional crossfade, swipe and key navigation ---- */
const gallery=$('#gallery'),galleryImage=$('#gallery-image'),items=$$('.gallery-item');let galleryIndex=0,galleryTrigger,galleryTimeline,galleryChange,galleryClosing=false;
function galleryContent(){const img=$('img',items[galleryIndex]);galleryImage.src=img.src;galleryImage.alt=img.alt;galleryImage.width=Number(img.getAttribute('width'));galleryImage.height=Number(img.getAttribute('height'));$('.gallery-caption').textContent=`${galleryIndex+1} / ${items.length} · ${img.alt}`;}
function galleryFinish(){window.gsap?.set(galleryImage,{clearProps:'transform,width,height,opacity'});gallery.close();unlock();galleryTrigger?.focus({preventScroll:true});}
function galleryClose(){
 if(!gallery.open||galleryClosing)return;
 galleryClosing=true;galleryChange?.kill();
 if(!motion){galleryFinish();return;}
 if(reduced.matches){galleryTimeline?.kill();gsap.to(galleryImage,{opacity:0,duration:.15,onComplete:galleryFinish});return;}
 if(galleryIndex===Number(galleryTrigger.dataset.gallery)&&galleryTimeline?.progress()<1){galleryTimeline.timeScale(1.33).reverse();return;}
 galleryTimeline?.kill();
 const state=Flip.getState(galleryImage);
 Flip.fit(galleryImage,$('img',items[galleryIndex]),{scale:true});
 galleryTimeline=gsap.timeline({onComplete:galleryFinish});
 galleryTimeline.add(Flip.from(state,{duration:.42,ease:'power3.inOut',scale:true}),0).to('.lightbox-scrim',{opacity:0,duration:.42},0);
}
items.forEach((item,index)=>item.addEventListener('click',e=>{
 galleryClosing=false;galleryIndex=index;galleryTrigger=item;
 const source=$('img',item),flipId=`hm-gallery-${index}`;
 source.setAttribute('data-flip-id',flipId);galleryImage.setAttribute('data-flip-id',flipId);
 const state=motion&&!reduced.matches?Flip.getState(source):null;
 galleryContent();lock();gallery.showModal();focusPanel(gallery,$('.lightbox-close'),e.detail===0);
 if(!motion)return;
 galleryTimeline?.kill();gsap.set(galleryImage,{clearProps:'transform,width,height,opacity'});
 galleryTimeline=gsap.timeline({onReverseComplete:galleryFinish,defaults:{ease:'power3.inOut'}}).fromTo('.lightbox-scrim',{opacity:0},{opacity:.92,duration:reduced.matches?.15:.56},0);
 if(reduced.matches)galleryTimeline.fromTo(galleryImage,{opacity:0},{opacity:1,duration:.15},0);
 else galleryTimeline.add(Flip.from(state,{targets:galleryImage,duration:.56,ease:'power3.inOut',scale:true}),0);
}));
function galleryMove(direction){if(galleryClosing)return;galleryChange?.kill();galleryTimeline?.progress(1);if(!motion){galleryIndex=(galleryIndex+direction+items.length)%items.length;galleryContent();return;}galleryChange=gsap.timeline().to(galleryImage,{opacity:0,x:reduced.matches?0:-24*direction,duration:duration(.18),onComplete:()=>{galleryIndex=(galleryIndex+direction+items.length)%items.length;galleryContent();}}).fromTo(galleryImage,{x:reduced.matches?0:24*direction},{x:0,opacity:1,duration:reduced.matches?.15:.28});}
$$('[data-gallery-close]').forEach(el=>el.addEventListener('click',galleryClose));$('.gallery-prev').addEventListener('click',()=>galleryMove(-1));$('.gallery-next').addEventListener('click',()=>galleryMove(1));gallery.addEventListener('cancel',e=>{e.preventDefault();galleryClose();});gallery.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();galleryMove(e.key==='ArrowLeft'?-1:1);}});let swipeX;gallery.addEventListener('touchstart',e=>{swipeX=e.changedTouches[0].clientX;},{passive:true});gallery.addEventListener('touchend',e=>{const dx=e.changedTouches[0].clientX-swipeX;if(Math.abs(dx)>48)galleryMove(dx<0?1:-1);},{passive:true});

/* ---- MAP (M16): real OpenStreetMap geometry (assets/js/geo.js, built by _docs/holmur-map-2026-11-03/build_geo.py). The list drives the camera. ---- */
(function initMap(){
 const geo=window.HOLMUR_GEO,svg=$('#hmap'),fig=$('.map-fig');if(!geo||!svg||!fig)return;
 const NS='http://www.w3.org/2000/svg',mk=(n,a={})=>{const e=document.createElementNS(NS,n);for(const k in a)e.setAttribute(k,a[k]);return e;};
 const g=mk('g');svg.append(g);
 g.append(mk('rect',{x:-3000,y:-3000,width:7000,height:7000,class:'m-sea'}),mk('path',{d:geo.land,class:'m-land','fill-rule':'evenodd'}),mk('path',{d:geo.glacier,class:'m-ice','fill-rule':'evenodd'}),mk('path',{d:geo.water,class:'m-water'}),mk('path',{d:geo.roads,class:'m-road'}),mk('path',{d:geo.ring,class:'m-ring'}));
 const items=$$('.map-steps li'),order=items.map(li=>li.dataset.poi),routes={},pins={};
 order.forEach(n=>{if(!geo.routes[n])return;const p=mk('path',{d:geo.routes[n].d,class:'m-route'});g.append(p);routes[n]=p;});
 const pg=mk('g');g.append(pg);
 const addPin=(n,home)=>{const P=geo.places[n];if(!P)return;const e=mk('g',{class:'m-pin'+(home?' is-home':'')});e.style.transform=`translate(${P.x}px,${P.y}px) scale(var(--u))`;e.append(mk('circle',{class:'m-pulse',r:6}),mk('circle',{class:'m-dot',r:home?5:4}));const t=mk('text',{class:'m-label',x:10,y:4});t.textContent=n;e.append(t);pg.append(e);pins[n]=e;};
 addPin('Hólmur',true);order.forEach(n=>addPin(n,false));
 const kmOf=n=>{const r=geo.routes[n];return Math.round(r.km+(r.snapKm>1?r.snapKm*1.2:0));};
 const approx=n=>geo.routes[n].snapKm>1;
 items.forEach((li,k)=>{const b=$('.ms-km b',li);if(b&&geo.routes[order[k]])b.textContent=approx(order[k])?Math.round(kmOf(order[k])/5)*5:kmOf(order[k]);});
 const ar=()=>fig.clientHeight/Math.max(1,fig.clientWidth);
 let cam={x:0,y:0,w:geo.w};
 const apply=()=>{svg.setAttribute('viewBox',`${cam.x} ${cam.y} ${cam.w} ${cam.w*ar()}`);fig.style.setProperty('--u',(cam.w/Math.max(1,fig.clientWidth)).toFixed(4));};
 const frameOf=(pts,pad)=>{let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;pts.forEach(([x,y])=>{x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);});const a=ar();let w=Math.max(x1-x0,(y1-y0)/a)*(1+pad*2);w=Math.max(w,150);const cx=(x0+x1)/2,cy=(y0+y1)/2;return{x:cx-w/2,y:cy-w*a/2,w};};
 const pathPts=p=>{const L=p.getTotalLength();return Array.from({length:49},(_,i)=>{const q=p.getPointAtLength(L*i/48);return[q.x,q.y];});};
 const home=geo.places['Hólmur'];
 const allFrame=()=>frameOf([[home.x,home.y],...order.filter(n=>geo.places[n]).map(n=>[geo.places[n].x,geo.places[n].y])],.14);
 const routeFrame=n=>frameOf(pathPts(routes[n]),.28);
 const tweenCam=(to,d=1.5)=>{if(!motion||reduced.matches){cam={...to};apply();return;}gsap.to(cam,{...to,duration:d,ease:'power3.inOut',overwrite:true,onUpdate:apply});};
 Object.values(routes).forEach(p=>{p._L=Math.ceil(p.getTotalLength())+2;p.style.strokeDasharray=`${p._L} ${p._L}`;p.style.strokeDashoffset=p._L;});
 const hudName=$('.mh-name'),hudKm=$('.mh-km');let active=-2,hudTween;
 function setActive(i,instant){
  if(i===active)return;active=i;
  items.forEach((li,k)=>li.classList.toggle('is-active',k===i));
  order.forEach((n,k)=>{const p=routes[n],pin=pins[n];if(!p)return;
   p.classList.toggle('is-live',k===i);p.classList.toggle('is-done',k<i);
   pin?.classList.toggle('is-on',k===i);pin?.classList.toggle('is-seen',k<i);
   gsap.killTweensOf(p);
   if(k===i){if(instant||!motion||reduced.matches)p.style.strokeDashoffset=0;else gsap.fromTo(p,{strokeDashoffset:p._L},{strokeDashoffset:0,duration:1.7,ease:'power2.inOut'});}
   else p.style.strokeDashoffset=k<i?0:p._L;});
  hudTween?.kill();
  if(i<0){tweenCam(allFrame(),instant?0:1.6);hudName.textContent='';hudKm.textContent='';return;}
  const n=order[i];tweenCam(routeFrame(n),instant?0:1.6);hudName.textContent=n;
  const target=approx(n)?Math.round(kmOf(n)/5)*5:kmOf(n),pre=approx(n)?'um ':'',o={v:0};
  if(!motion||reduced.matches){hudKm.textContent=`${pre}${target} km`;return;}
  hudTween=gsap.to(o,{v:target,duration:1.4,ease:'power2.out',onUpdate:()=>{hudKm.textContent=`${pre}${Math.round(o.v)} km`;}});
 }
 const io=new IntersectionObserver(es=>es.forEach(e=>{const k=items.indexOf(e.target);
  if(e.isIntersecting)setActive(k);
  else if(e.rootBounds&&e.boundingClientRect.top>e.rootBounds.bottom-1)setActive(k-1);}),{rootMargin:'-42% 0px -42% 0px',threshold:0});
 items.forEach(li=>io.observe(li));
 items.forEach((li,k)=>$('button',li).addEventListener('click',()=>{if(lenis)lenis.scrollTo(li,{offset:-innerHeight*.28});else li.scrollIntoView({behavior:reduced.matches?'auto':'smooth',block:'center'});setActive(k);}));
 new ResizeObserver(()=>{cam=active<0?allFrame():routeFrame(order[active]);apply();}).observe(fig);
 requestAnimationFrame(()=>{cam=allFrame();apply();setActive(-1,true);});
})();

/* ---- REVIEWS (M17): assets/data/reviews.json is kept current by scripts/sync-reviews.mjs (Airbnb collector, weekly) ---- */
(function initReviews(){
 const box=$('[data-rv]');if(!box)return;
 const q=$('.rv-q p',box),by=$('.rv-by',box),when=$('.rv-when',box),bar=$('.rv-prog i',box),count=$('.rv-i',box),prev=$('.rv-prev',box),next=$('.rv-next',box);
 const months=['janúar','febrúar','mars','apríl','maí','júní','júlí','ágúst','september','október','nóvember','desember'];
 const ym=d=>{const [y,m]=d.split('-').map(Number);return `${months[m-1]} ${y}`;},dmy=d=>{const [y,m,dd]=d.split('-').map(Number);return `${dd}. ${months[m-1]} ${y}`;};
 let list=[],i=0,paused=false,timer=null,loaded=false;
 const fill=k=>{const r=list[k];q.textContent=r.text;by.textContent=r.author;when.textContent=ym(r.date);count.textContent=`${k+1} / ${list.length}`;};
 /* every quote gets the height of the longest one, so the controls and the sections below never jump between slides */
 const card=$('.rv-card',box);let lvT,lvW=innerWidth;
 const level=()=>{if(!list.length)return;card.style.minHeight='';let m=0;list.forEach((_,k)=>{fill(k);m=Math.max(m,card.offsetHeight);});card.style.minHeight=m+'px';fill(i);};
 addEventListener('resize',()=>{clearTimeout(lvT);lvT=setTimeout(()=>{if(innerWidth!==lvW){lvW=innerWidth;level();}},200);});
 const arm=()=>{timer?.kill();if(!motion||reduced.matches||list.length<2)return;gsap.set(bar,{scaleX:0});timer=gsap.to(bar,{scaleX:1,duration:9,ease:'none',paused,onComplete:()=>go(1)});};
 function go(dir){if(!list.length)return;const k=(i+dir+list.length)%list.length;timer?.kill();
  if(!motion||reduced.matches){i=k;fill(k);return;}
  gsap.timeline({onComplete:arm}).to([q,by,when],{opacity:0,y:-14,duration:.35,stagger:.03,ease:'power2.in'}).add(()=>{i=k;fill(k);}).fromTo([q,by,when],{opacity:0,y:18},{opacity:1,y:0,duration:.7,stagger:.06,ease:'expo.out'});}
 prev.addEventListener('click',()=>go(-1));next.addEventListener('click',()=>go(1));
 const hold=v=>{paused=v;if(timer)timer.paused(v);};
 box.addEventListener('pointerenter',()=>hold(true));box.addEventListener('pointerleave',()=>hold(false));box.addEventListener('focusin',()=>hold(true));box.addEventListener('focusout',()=>hold(false));
 async function load(){if(loaded)return;loaded=true;
  try{
   const d=await (await fetch('assets/data/reviews.json',{cache:'no-cache'})).json();const s=d.sources?.[0];
   if(s){$('[data-rv-rating]').textContent=String(s.rating).replace('.',',');$('[data-rv-count]').textContent=s.count;if(s.read)$('[data-rv-read]').textContent=dmy(s.read);}
   const seen=new Set();
   list=(d.reviews||[]).filter(r=>r.rating===5&&r.text&&r.text.length>=60&&r.text.length<=300&&!seen.has(r.author)&&seen.add(r.author)).slice(0,12).map(r=>({...r,text:r.text.replace(/\s+/g,' ').trim()}));
   if(list.length){fill(0);await document.fonts.ready;level();arm();}
  }catch(e){/* the static first quote and numbers stay */}
 }
 new IntersectionObserver((es,ob)=>{if(es.some(e=>e.isIntersecting)){load();ob.disconnect();}},{rootMargin:'900px 0px'}).observe(box);
})();

/* ---- BOOKING (M13): SNDR calendar engine, panel from right / bottom ---- */
const book=$('#booking'),panel=$('.bk-bar',book);const booking=window.mountBooking(book,{min:1,max:18,guests:2});let bookTrigger,bookTimeline,bookClosing=false;
function bookFinish(){book.close();unlock();bookTrigger?.focus({preventScroll:true});}
function bookClose(){if(!book.open)return;bookClosing=true;if(!motion||reduced.matches){bookTimeline?.kill();bookFinish();}else bookTimeline.timeScale(1.37).reverse();}
document.addEventListener('click',e=>{const trigger=e.target.closest('[data-book]');if(!trigger)return;if(book.open){if(bookClosing){bookClosing=false;bookTimeline?.timeScale(1).play();}return;}if(menu.open)menuClose(true);bookClosing=false;bookTrigger=trigger.closest('#menu')?$('.bar [data-book]'):trigger;booking.prepare();lock();book.showModal();focusPanel(panel,booking.firstDay(),e.detail===0);if(!motion)return;const phone=matchMedia('(max-width:767px)').matches;bookTimeline?.kill();bookTimeline=gsap.timeline({onReverseComplete:bookFinish,defaults:{ease:'power3.inOut'}}).fromTo('.bk-bg',{opacity:0},{opacity:1,duration:duration(.38)},0).fromTo(panel,{xPercent:phone?0:100,yPercent:phone?100:0},{xPercent:0,yPercent:0,duration:duration(.52)},0);});
$$('[data-book-close]').forEach(el=>el.addEventListener('click',bookClose));book.addEventListener('cancel',e=>{e.preventDefault();bookClose();});
})();
