/* Hólmur · Fog lifts. Desktop Lenis, native touch; each animated property has one owner. */
(() => {
'use strict';
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const motion=!!window.gsap;
if(motion) gsap.registerPlugin(ScrollTrigger,Flip,SplitText);
const duration=n=>reduced.matches?0:n;
let scrollState=null;
function lock(){lenis?.stop();if(scrollState)return;scrollState={y:scrollY,position:document.body.style.position,top:document.body.style.top,width:document.body.style.width};Object.assign(document.body.style,{position:'fixed',top:`-${scrollState.y}px`,width:'100%'});}
function unlock(){if(!scrollState)return;const s=scrollState;scrollState=null;Object.assign(document.body.style,{position:s.position,top:s.top,width:s.width});window.scrollTo(0,s.y);syncDialogScroll();}
function focusPanel(panel,first,viaKey){(viaKey?first||panel:panel).focus({preventScroll:true});}
// HERO ARRIVAL: fonts ready, capped at 1.2 seconds; fit the longest unbroken word.
function fitTitle(){const h=$('h1'),word=$('h1 .mask:last-child>span');h.style.fontSize='';const available=h.getBoundingClientRect().width;const r=document.createRange();r.selectNodeContents(word);const width=r.getBoundingClientRect().width;if(width>available)h.style.fontSize=`${parseFloat(getComputedStyle(h).fontSize)*available/width}px`;}
// S1: a single ticker owner; never smooth coarse pointers or reduced motion.
let lenis;
const fine=matchMedia('(pointer:fine)');
const tickLenis=time=>lenis?.raf(time*1000);
function syncDialogScroll(){
 if(!lenis)return;
 if(scrollState||document.querySelector('dialog[open]'))lenis.stop();
 else{lenis.start();lenis.scrollTo(scrollY,{immediate:true,force:true});}
}
function setupScroll(){
 if(lenis){gsap.ticker.remove(tickLenis);lenis.destroy();lenis=null;}
 if(motion&&window.Lenis&&fine.matches&&!reduced.matches){
  lenis=new Lenis({lerp:.1,wheelMultiplier:1,smoothWheel:true,syncTouch:false,smoothTouch:false});
  lenis.on('scroll',ScrollTrigger.update);gsap.ticker.add(tickLenis);syncDialogScroll();
 }
}
const dialogObserver=new MutationObserver(syncDialogScroll);
$$('dialog').forEach(el=>dialogObserver.observe(el,{attributes:true,attributeFilter:['open']}));
fine.addEventListener('change',setupScroll);reduced.addEventListener('change',setupScroll);
setupScroll();
document.addEventListener('click',e=>{
 const a=e.target.closest('a[href^="#"]');if(!a||e.defaultPrevented||e.metaKey||e.ctrlKey)return;
 const target=document.getElementById(a.hash.slice(1));if(!target||!lenis)return;
 e.preventDefault();const header=$('.bar').getBoundingClientRect();
 lenis.scrollTo(target,{offset:-header.bottom,onComplete:()=>{target.setAttribute('tabindex','-1');target.focus({preventScroll:true});}});
 history.pushState(null,'',a.hash);
});
// A fixed grid slot is the unanimated measurement source for S2.
const heroMedia=$('.hero-media'),heroSlot=document.createElement('div');
heroSlot.className='hero-media-slot';heroMedia.before(heroSlot);heroSlot.append(heroMedia);
const bandMeasure=document.createElement('i');bandMeasure.className='hero-band-measure';bandMeasure.setAttribute('aria-hidden','true');$('.hero').append(bandMeasure);
function setupHeroPin(){
 const mm=gsap.matchMedia();
 mm.add('(min-width:768px)',()=>{
  const hero=$('.hero'),sheet=$('.sheet'),tail=document.createElement('div');
  tail.className='hero-clearance';tail.setAttribute('aria-hidden','true');hero.after(tail);
  let geometry;
  function measure(){
   // Claude fix: rect-based, so the end box is the sheet's content area at every width (offsetLeft depended on the positioned ancestor).
   const cs=getComputedStyle(sheet),pad=parseFloat(cs.paddingLeft),inset=parseFloat(cs.marginTop);
   const bar=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--bar'));
   const sr=sheet.getBoundingClientRect(),hr=hero.getBoundingClientRect(),lr=heroSlot.getBoundingClientRect();
   const full=sheet.clientWidth-2*pad,tall=Math.min(bandMeasure.offsetHeight,innerHeight-inset*2-bar-32);
   geometry={width:lr.width,height:lr.height,x:sr.left+pad-lr.left,y:inset+bar+16-(lr.top-hr.top),full,tall};
   const extra=Math.max(0,(lr.top-hr.top)+geometry.y+tall-hero.clientHeight);
   tail.style.height=`${extra}px`;
  }
  measure();ScrollTrigger.addEventListener('refreshInit',measure);
  gsap.timeline({defaults:{ease:'none'},scrollTrigger:{id:'hm-hero',trigger:hero,start:'top top',end:'+=100%',pin:true,scrub:.6,invalidateOnRefresh:true,refreshPriority:10}})
   .fromTo(heroMedia,{x:0,y:0,width:()=>geometry.width,height:()=>geometry.height,borderRadius:24},
    {x:()=>geometry.x,y:()=>geometry.y,width:()=>geometry.full,height:()=>geometry.tall,borderRadius:16,duration:1},0)
   .fromTo('.hero-copy',{yPercent:0,opacity:1},{yPercent:-8,opacity:0,duration:1},0);
  return()=>{ScrollTrigger.removeEventListener('refreshInit',measure);tail.remove();};
 });
}
// S8 markup is durable; screen readers retain the original whole year.
const yearRail=$('.year-rail');
$$('.year-rail strong').forEach(strong=>{
 const year=strong.textContent;strong.setAttribute('aria-label',year);
 strong.innerHTML=[...year].map(d=>`<span class="year-digit-mask" aria-hidden="true"><span class="year-digit">${d}</span></span>`).join('');
});
function sectionMotion(){
 // S3: SplitText restores the authored headings when this context is reverted.
 const splits=$$('.section h2 .mask>span').map(el=>{
  const split=SplitText.create(el,{type:'words',wordsClass:'hm-word',mask:'words'});
  split.words.forEach(word=>word.parentElement.classList.add('hm-word-mask'));
  gsap.from(split.words,{yPercent:60,filter:'blur(8px)',opacity:0,duration:.9,stagger:.05,ease:'expo.out',scrollTrigger:{trigger:el.closest('h2'),start:'top 85%',once:true}});
  return split;
 });
 // S4: no generic inner-image parallax competing with the section treatments.
 $$('#gisting .photo').forEach(el=>{
  gsap.fromTo(el,{clipPath:'inset(100% 0% 0% 0%)'},{clipPath:'inset(0% 0% 0% 0%)',duration:1.1,ease:'expo.out',scrollTrigger:{trigger:el,start:'top 85%',once:true}});
  gsap.from($('img',el),{scale:1.12,duration:1.1,ease:'expo.out',scrollTrigger:{trigger:el,start:'top 85%',once:true}});
 });
 const tiles=$$('.gallery-item');
 // Batch rect reads, then sort by column before the first animation writes.
 const order=tiles.map(el=>({el,rect:el.getBoundingClientRect()})).sort((a,b)=>a.rect.left-b.rect.left||a.rect.top-b.rect.top).map(x=>x.el);
 gsap.from(order,{scale:.92,opacity:0,duration:1.1,stagger:.06,ease:'expo.out',scrollTrigger:{trigger:'.farm-grid',start:'top 85%',once:true}});
 $$('#umhverfid .photo,#umhverfid .film').forEach(el=>gsap.fromTo(el,{clipPath:'inset(0% 100% 0% 0%)'},{clipPath:'inset(0% 0% 0% 0%)',duration:1.2,ease:'expo.out',scrollTrigger:{trigger:el,start:'top 85%',once:true}}));
 $$('.story .photo,.winter .film,.booking-section>.photo').forEach(el=>gsap.fromTo(el,{clipPath:'inset(12% 6% 0% 6%)'},{clipPath:'inset(0% 0% 0% 0%)',duration:1.2,ease:'expo.out',scrollTrigger:{trigger:el,start:'top 85%',once:true}}));
 const mm=gsap.matchMedia();
 mm.add('(min-width:768px)',()=>{$$('.mosaic-column').forEach((el,i)=>gsap.fromTo(el,{yPercent:0},{yPercent:[-8,0,8][i],ease:'none',scrollTrigger:{trigger:'.restaurant-grid',start:'top bottom',end:'bottom top',scrub:.6}}));});
 mm.add({desktop:'(min-width:768px)',phone:'(max-width:767px)'},ctx=>{
  const phone=ctx.conditions.phone,years=$$('.year-rail li');
  const tl=gsap.timeline({defaults:{ease:'none'},scrollTrigger:{id:'hm-years',trigger:'.story',start:'top 75%',end:'bottom 40%',scrub:.8}});
  tl.fromTo(yearRail,{'--year-progress':0},{'--year-progress':1,duration:1},0);
  const groups=[];
  function measureYears(){
   const rail=yearRail.getBoundingClientRect(),rects=years.map(li=>li.getBoundingClientRect());
   const positions=rects.map(r=>phone?(r.top-rail.top)/rail.height:(r.left-rail.left)/rail.width);
   groups.forEach((group,i)=>group.startTime(positions[i]));
  }
  years.forEach((li,i)=>{
   const at=phone?Math.floor(i/2)/4:i/7;
   const group=gsap.timeline({defaults:{ease:'none'}});groups.push(group);tl.add(group,at);
   group.fromTo($('i',li),{opacity:.2,scale:.65},{opacity:1,scale:1,duration:.08},0)
    .fromTo($('strong',li),{color:'#6B7378'},{color:'#000309',duration:.08},0)
    .fromTo($(':scope>span',li),{color:'#6B7378'},{color:'#434242',duration:.08},0)
    .fromTo($$('.year-digit',li),{opacity:.22},{opacity:1,duration:.08,stagger:.015},0);
  });
  measureYears();ScrollTrigger.addEventListener('refreshInit',measureYears);
  return()=>ScrollTrigger.removeEventListener('refreshInit',measureYears);
 });
 // S9: never announce every animation frame to assistive technology.
 const km=$$('.km');km.forEach(el=>{el.parentElement.setAttribute('aria-label',`${el.dataset.km} km`);el.setAttribute('aria-hidden','true');});
 const counts=km.map(el=>({value:0,el}));
 gsap.to(counts,{value:i=>Number(km[i].dataset.km),duration:.9,ease:'power2.out',stagger:.06,
  onUpdate:()=>counts.forEach(c=>{c.el.textContent=Math.round(c.value);}),scrollTrigger:{trigger:'.distances',start:'top 80%',once:true}});
 return()=>{splits.forEach(s=>s.revert());km.forEach(el=>el.textContent=el.dataset.km);};
}
// S7: all link rectangles are read together once per ScrollTrigger refresh.
const navLinks=$$('.bar nav a'),indicator=$('.nav-indicator');let navRects=[],activeNav=-1;
function setNav(index,instant=false){
 activeNav=index;navLinks.forEach((a,i)=>{if(i===index)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});
 if(!motion)return;
 if(!navRects[index]){gsap.set(indicator,{width:0});return;}
 gsap.to(indicator,{x:navRects[index].x,width:navRects[index].width,duration:instant||reduced.matches?0:.45,ease:'power3.out',overwrite:true});
}
function measureNav(){
 const barRect=$('.bar').getBoundingClientRect(),rects=navLinks.map(a=>a.getBoundingClientRect());
 navRects=rects.map(r=>({x:r.left-barRect.left,width:r.width}));if(activeNav>=0)setNav(activeNav,true);
}
if(motion){
 ScrollTrigger.addEventListener('refresh',measureNav);
 navLinks.forEach((a,i)=>ScrollTrigger.create({trigger:document.getElementById(a.hash.slice(1)),start:'top 45%',end:'bottom 45%',onEnter:()=>setNav(i),onEnterBack:()=>setNav(i),onLeaveBack:()=>{if(i===0)setNav(-1);}}));
 const mm=gsap.matchMedia();mm.add('(prefers-reduced-motion:no-preference)',()=>{
  gsap.fromTo('.page-progress',{scaleX:0},{scaleX:1,ease:'none',scrollTrigger:{start:0,end:()=>ScrollTrigger.maxScroll(window),scrub:true}});
 });
 reduced.addEventListener('change',()=>setNav(activeNav,true));
}
// S5: desktop drag projects velocity, then settles at a real card boundary.
$$('.room-carousel').forEach(carousel=>{
 const track=$('.room-track',carousel),cards=$$('.room-card',carousel),prev=$('.room-prev',carousel),next=$('.room-next',carousel),fill=$('.room-progress i',carousel);
 let points=[],max=0,drag=null,tween,suppressClick=false;
 function measure(){const rect=track.getBoundingClientRect(),rects=cards.map(c=>c.getBoundingClientRect());max=track.scrollWidth-track.clientWidth;points=rects.map(r=>Math.max(0,Math.min(max,r.left-rect.left+track.scrollLeft-4)));update();}
 function update(){const value=track.scrollLeft;fill.style.transform=`scaleX(${max?value/max:1})`;prev.disabled=value<1;next.disabled=value>=max-1;}
 function stop(){tween?.kill();track.classList.remove('is-snapping');}
 function snap(value){stop();const to=points.reduce((best,p)=>Math.abs(p-value)<Math.abs(best-value)?p:best,0);
  if(!motion||reduced.matches){track.scrollLeft=to;update();return;}
  track.classList.add('is-snapping');tween=gsap.to(track,{scrollLeft:to,duration:.42,ease:'power3.out',onUpdate:update,onComplete:()=>track.classList.remove('is-snapping')});
 }
 function step(dir){const value=track.scrollLeft;const target=dir>0?points.find(p=>p>value+2):[...points].reverse().find(p=>p<value-2);snap(target??(dir>0?max:0));}
 prev.addEventListener('click',()=>step(-1));next.addEventListener('click',()=>step(1));
 track.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();step(e.key==='ArrowLeft'?-1:1);}});
 track.addEventListener('pointerdown',e=>{if(e.pointerType!=='mouse'||e.button!==0||!fine.matches)return;stop();suppressClick=false;drag={id:e.pointerId,x:e.clientX,left:track.scrollLeft,last:e.clientX,time:e.timeStamp,v:0,moved:false};});
 track.addEventListener('pointermove',e=>{if(!drag||e.pointerId!==drag.id)return;const dx=e.clientX-drag.x;
  if(Math.abs(dx)>6&&!drag.moved){stop();drag.moved=true;suppressClick=true;track.setPointerCapture(e.pointerId);track.classList.add('is-dragging');}
  if(drag.moved){e.preventDefault();const dt=Math.max(1,e.timeStamp-drag.time);drag.v=(drag.last-e.clientX)/dt;track.scrollLeft=drag.left-dx;drag.last=e.clientX;drag.time=e.timeStamp;}
 });
 function end(e){if(!drag)return;const d=drag;drag=null;track.classList.remove('is-dragging');if(track.hasPointerCapture(d.id))track.releasePointerCapture(d.id);if(d.moved)snap(track.scrollLeft+(reduced.matches||e.timeStamp-d.time>100?0:d.v*180));}
 track.addEventListener('pointerup',end);track.addEventListener('pointercancel',end);track.addEventListener('lostpointercapture',end);
 track.addEventListener('click',e=>{if(suppressClick){e.preventDefault();e.stopImmediatePropagation();suppressClick=false;}},true);
 track.addEventListener('dragstart',e=>e.preventDefault());track.addEventListener('wheel',stop,{passive:true});track.addEventListener('scroll',update,{passive:true});
 track.addEventListener('focusin',e=>{if(document.documentElement.dataset.input!=='key')return;const card=e.target.closest('.room-card');if(card)snap(points[cards.indexOf(card)]);});
 new ResizeObserver(measure).observe(track);measure();
 reduced.addEventListener('change',()=>{stop();drag=null;track.classList.remove('is-dragging');snap(track.scrollLeft);});
});
// S6 cursor: quickTo owns x/y; the visibility tween owns scale alone.
if(motion){const mm=gsap.matchMedia();mm.add('(hover:hover) and (pointer:fine) and (prefers-reduced-motion:no-preference)',()=>{
 const pill=$('.cursor-pill'),x=gsap.quickTo(pill,'x',{duration:.35,ease:'power3.out'}),y=gsap.quickTo(pill,'y',{duration:.35,ease:'power3.out'});
 const move=e=>{x(e.clientX+16);y(e.clientY+16);},enter=e=>{gsap.set(pill,{x:e.clientX+16,y:e.clientY+16});gsap.to(pill,{autoAlpha:1,scale:1,duration:.18,overwrite:'auto'});},leave=()=>gsap.to(pill,{autoAlpha:0,scale:0,duration:.18,overwrite:'auto'});
 const tiles=$$('.gallery-item');tiles.forEach(el=>{el.addEventListener('pointerenter',enter);el.addEventListener('pointermove',move);el.addEventListener('pointerleave',leave);el.addEventListener('click',leave);});
 return()=>{x.tween.kill();y.tween.kill();gsap.killTweensOf(pill);gsap.set(pill,{autoAlpha:0,scale:0});tiles.forEach(el=>{el.removeEventListener('pointerenter',enter);el.removeEventListener('pointermove',move);el.removeEventListener('pointerleave',leave);el.removeEventListener('click',leave);});};
});}
let motionContext, arrived=false;
function choreography(){
 document.documentElement.classList.add('hm-go');
 if(!motion)return;
 motionContext?.revert();
 if(reduced.matches){arrived=true;gsap.set('.sheet,.hero .mask>span,.hero .eyebrow,.hero-caps,.hero-book',{clearProps:'all'});return;}
 const firstArrival=!arrived;
 motionContext=gsap.context(ctx=>{
 if(!arrived){
 const hero=gsap.timeline({defaults:{ease:'expo.out'}}); 
 hero.fromTo('.sheet',{opacity:0,scale:.985},{opacity:1,scale:1,duration:.6,clearProps:'transform,opacity'})
 .fromTo('.hero .mask>span',{yPercent:105,y:0},{yPercent:0,duration:.9,stagger:.08,clearProps:'transform'},.1)
 .fromTo('.hero .eyebrow,.hero-caps',{opacity:0,y:12},{opacity:1,y:0,duration:.7,stagger:.06},.15)
 .fromTo('.hero-media',{clipPath:'inset(10% 10% 10% 10% round 24px)'},{clipPath:'inset(0% 0% 0% 0% round 24px)',duration:1.2,clearProps:'clipPath'},0)
 .fromTo('.hero-media img',{scale:1.12},{scale:1,duration:1.2},0)
 .fromTo('.hero-book',{opacity:0,width:'92%'},{opacity:1,width:'100%',duration:.5},.7);
 arrived=true;
 }
 $$('.reveal').forEach(el=>gsap.from(el,{opacity:0,y:16,duration:.7,ease:'expo.out',delay:.06,scrollTrigger:{trigger:el,start:'top 88%',once:true}}));
 // S3/S4/S8/S9 are scoped to the same reversible context.
 const cleanupSections=sectionMotion();
 gsap.fromTo('.restaurant',{backgroundColor:'#F7F8FC'},{backgroundColor:'#EDF0F5',ease:'none',scrollTrigger:{trigger:'.restaurant',start:'top bottom',end:'top 30%',scrub:true}});
 const rows=gsap.timeline({scrollTrigger:{trigger:'.distances',start:'top 80%',once:true}});
 rows.from('.distances i',{scaleX:0,duration:.7,ease:'expo.out',stagger:.06}).from('.distances li>span',{opacity:0,duration:.7,stagger:.06},.2);
 gsap.from('.booking-card',{y:24,opacity:0,duration:.8,ease:'expo.out',scrollTrigger:{trigger:'.booking-card',start:'top 85%',once:true}});
 const startPin=()=>ctx.add(()=>{setupHeroPin();ScrollTrigger.refresh();});
 if(firstArrival)gsap.delayedCall(1.2,startPin);else startPin();
 return cleanupSections;
 });
}
Promise.race([document.fonts.ready,new Promise(r=>setTimeout(r,1200))]).then(()=>{
 try{fitTitle();choreography();}catch(error){console.error('Hólmur motion fallback',error);motionContext?.revert();document.documentElement.classList.remove('js');}
 clearTimeout(window.hmFailSafe);if(!motion)document.documentElement.classList.remove('js');
});
document.fonts.ready.then(()=>{fitTitle();window.ScrollTrigger?.refresh();});
let resizeTimer;window.addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(fitTitle,120);});
$$('img').forEach(img=>img.addEventListener('load',()=>window.ScrollTrigger?.refresh()));
// FILMS: only intersecting, visible-page videos play; reduced motion restores posters.
const visibility=new Map();const manualPaused=new WeakSet();
function updateFilm(video){const button=video.parentElement.querySelector('.film-toggle');const play=visibility.get(video)&&!document.hidden&&!reduced.matches&&!manualPaused.has(video);if(play){video.play().then(()=>{button.textContent='Hlé';button.setAttribute('aria-label','Gera hlé á myndskeiði');}).catch(()=>{button.textContent='Spila';});}else{video.pause();button.textContent='Spila';button.setAttribute('aria-label','Spila myndskeið');}}
const filmObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{visibility.set(entry.target,entry.isIntersecting);updateFilm(entry.target);}),{threshold:.08});
$$('video').forEach(video=>{filmObserver.observe(video);video.parentElement.querySelector('.film-toggle').addEventListener('click',()=>{if(reduced.matches)return;if(video.paused)manualPaused.delete(video);else manualPaused.add(video);updateFilm(video);});});
document.addEventListener('visibilitychange',()=>$$('video').forEach(updateFilm));
function syncReducedFilms(){ $$('video').forEach(v=>{if(reduced.matches){v.pause();v.load();}v.parentElement.querySelector('.film-toggle').hidden=reduced.matches;updateFilm(v);});}
// MENU: same reversible timeline for open and interrupted close; native modal focus trap.
const menu=$('#menu'),toggle=$('.hamburger');let menuTimeline,menuOpen=false;
function menuFinish(){menu.close();unlock();toggle.focus({preventScroll:true});}
function menuClose(immediate=false){if(!menu.open)return;menuOpen=false;toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-label','Opna valmynd');if(immediate||!motion||reduced.matches){menuTimeline?.kill();menuFinish();window.gsap?.set('.hamburger span',{clearProps:'all'});}else menuTimeline.timeScale(.52/.38).reverse();}
function menuShow(e){menuOpen=true;toggle.setAttribute('aria-expanded','true');toggle.setAttribute('aria-label','Loka valmynd');lock();menu.showModal();focusPanel(menu,$('a',menu),e.detail===0);
 if(!motion||reduced.matches)return;
 menuTimeline?.kill();
 menuTimeline=gsap.timeline({onReverseComplete:menuFinish,defaults:{ease:'power3.inOut'}})
 .fromTo(menu,{clipPath:'inset(0% 0% 100% 0%)'},{clipPath:'inset(0% 0% 0% 0%)',duration:.52},0)
 .fromTo($$('nav>a,nav>.fog',menu),{y:16,opacity:0},{y:0,opacity:1,duration:.22,stagger:.06},0)
 .to($$('.hamburger span:first-child,.menu-close span:first-child'),{y:7,rotation:45,duration:.32},0)
 .to($$('.hamburger span:nth-child(2),.menu-close span:nth-child(2)'),{opacity:0,duration:.32},0)
 .to($$('.hamburger span:last-child,.menu-close span:last-child'),{y:-7,rotation:-45,duration:.32},0);
}
toggle.addEventListener('click',e=>menuOpen?menuClose():menuShow(e));$('.menu-close').addEventListener('click',()=>menuClose());menu.addEventListener('cancel',e=>{e.preventDefault();menuClose();});$$('a',menu).forEach(a=>a.addEventListener('click',()=>menuClose(true)));
matchMedia('(min-width:1100px)').addEventListener('change',e=>{if(e.matches&&menu.open)menuClose(true);});
// GALLERY: rectangle FLIP, reversible open, directional crossfade, swipe and key navigation.
const gallery=$('#gallery'),galleryImage=$('#gallery-image'),items=$$('.gallery-item');let galleryIndex=0,galleryTrigger,galleryTimeline,galleryChange,galleryClosing=false;
function galleryContent(){const img=$('img',items[galleryIndex]);galleryImage.src=img.src;galleryImage.alt=img.alt;galleryImage.width=Number(img.getAttribute("width"));galleryImage.height=Number(img.getAttribute("height"));$('.gallery-caption').textContent=`${galleryIndex+1} / ${items.length} · ${img.alt}`;}
function galleryFinish(){window.gsap?.set(galleryImage,{clearProps:"transform,width,height,opacity"});gallery.close();unlock();galleryTrigger?.focus({preventScroll:true});}
function galleryClose(){
 if(!gallery.open||galleryClosing)return;
 galleryClosing=true;galleryChange?.kill();
 if(!motion){galleryFinish();return;}
 if(reduced.matches){galleryTimeline?.kill();gsap.to(galleryImage,{opacity:0,duration:.15,onComplete:galleryFinish});return;}
 if(galleryIndex===Number(galleryTrigger.dataset.gallery)&&galleryTimeline?.progress()<1){galleryTimeline.timeScale(.56/.42).reverse();return;}
 galleryTimeline?.kill();
 const state=Flip.getState(galleryImage);
 Flip.fit(galleryImage,$('img',items[galleryIndex]),{scale:true});
 galleryTimeline=gsap.timeline({onComplete:galleryFinish});
 galleryTimeline.add(Flip.from(state,{duration:.42,ease:'power3.inOut',scale:true}),0)
  .to('.lightbox-scrim',{opacity:0,duration:.42},0);
}
items.forEach((item,index)=>item.addEventListener('click',e=>{
 galleryClosing=false;galleryIndex=index;galleryTrigger=item;
 const source=$('img',item),flipId=`hm-gallery-${index}`;
 source.setAttribute('data-flip-id',flipId);galleryImage.setAttribute('data-flip-id',flipId);
 const state=motion&&!reduced.matches?Flip.getState(source):null;
 galleryContent();lock();gallery.showModal();focusPanel(gallery,$('.lightbox-close'),e.detail===0);
 if(!motion)return;
 galleryTimeline?.kill();gsap.set(galleryImage,{clearProps:'transform,width,height,opacity'});
 galleryTimeline=gsap.timeline({onReverseComplete:galleryFinish,defaults:{ease:'power3.inOut'}})
  .fromTo('.lightbox-scrim',{opacity:0},{opacity:.86,duration:reduced.matches?.15:.56},0);
 if(reduced.matches)galleryTimeline.fromTo(galleryImage,{opacity:0},{opacity:1,duration:.15},0);
 else galleryTimeline.add(Flip.from(state,{targets:galleryImage,duration:.56,ease:'power3.inOut',scale:true}),0);
}));
function galleryMove(direction){if(galleryClosing)return;galleryChange?.kill();galleryTimeline?.progress(1);if(!motion){galleryIndex=(galleryIndex+direction+items.length)%items.length;galleryContent();return;}galleryChange=gsap.timeline().to(galleryImage,{opacity:0,x:reduced.matches?0:-24*direction,duration:duration(.18),onComplete:()=>{galleryIndex=(galleryIndex+direction+items.length)%items.length;galleryContent();}}).fromTo(galleryImage,{x:reduced.matches?0:24*direction},{x:0,opacity:1,duration:reduced.matches?.15:.28});}
$$('[data-gallery-close]').forEach(el=>el.addEventListener('click',galleryClose));$('.gallery-prev').addEventListener('click',()=>galleryMove(-1));$('.gallery-next').addEventListener('click',()=>galleryMove(1));gallery.addEventListener('cancel',e=>{e.preventDefault();galleryClose();});gallery.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();galleryMove(e.key==='ArrowLeft'?-1:1);}});let swipeX;gallery.addEventListener('touchstart',e=>{swipeX=e.changedTouches[0].clientX;},{passive:true});gallery.addEventListener('touchend',e=>{const dx=e.changedTouches[0].clientX-swipeX;if(Math.abs(dx)>48)galleryMove(dx<0?1:-1);},{passive:true});
// BOOKING: copied calendar engine, native dialog trap, panel from right / bottom.
const book=$('#booking'),bar=$('.bk-bar',book);const booking=window.mountBooking(book,{min:1,max:18,guests:2});let bookTrigger,bookTimeline,bookClosing=false;
function bookFinish(){book.close();unlock();bookTrigger?.focus({preventScroll:true});}
function bookClose(){if(!book.open)return;bookClosing=true;if(!motion||reduced.matches){bookTimeline?.kill();bookFinish();}else bookTimeline.timeScale(.52/.38).reverse();}
document.addEventListener('click',e=>{const trigger=e.target.closest('[data-book]');if(!trigger)return;if(book.open){if(bookClosing){bookClosing=false;bookTimeline?.timeScale(1).play();}return;}if(menu.open)menuClose(true);bookClosing=false;bookTrigger=trigger.closest('#menu')?$('.bar [data-book]'):trigger;booking.prepare();lock();book.showModal();focusPanel(bar,booking.firstDay(),e.detail===0);if(!motion)return;const phone=matchMedia('(max-width:767px)').matches;bookTimeline?.kill();bookTimeline=gsap.timeline({onReverseComplete:bookFinish,defaults:{ease:'power3.inOut'}}).fromTo('.bk-bg',{opacity:0},{opacity:1,duration:duration(.38)},0).fromTo(bar,{xPercent:phone?0:100,yPercent:phone?100:0},{xPercent:0,yPercent:0,duration:duration(.52)},0);});
$$('[data-book-close]').forEach(el=>el.addEventListener('click',bookClose));book.addEventListener('cancel',e=>{e.preventDefault();bookClose();});
// RUNTIME REDUCED MOTION: revert scroll effects and finish active UI transitions.
reduced.addEventListener('change',()=>{if(reduced.matches){if(menu.open){if(menuOpen)menuTimeline?.progress(1);else{menuTimeline?.kill();menuFinish();}}if(gallery.open){if(galleryClosing){galleryTimeline?.kill();galleryFinish();}else galleryTimeline?.progress(1);}if(book.open){if(bookClosing){bookTimeline?.kill();bookFinish();}else bookTimeline?.progress(1);}galleryChange?.progress(1);}choreography();syncReducedFilms();window.ScrollTrigger?.refresh();});syncReducedFilms();
})();
