const{esc,cz,czl,dow,MES,MESL,MES2,nPlesu,plural,place,host,poster,posterHTML,portraitFirst,pimg,illu,filter,pscLookup,types,today,favs,downloadIcs,slug,norm,km}=PC;
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)],L_=window.L;
let P=[],ID={},U=[],KR=[],OB=[],map,cl,MK={},LL=[],shown=0,origin=null,ctxLabel="",ST={typ:new Set(),d1:0,d2:100,cena:"",ver:false,sort:"datum"},DAYS=[],syncing=false;
const toast=t=>{const e=$("#toast");e.textContent=t;e.classList.add("on");clearTimeout(e._t);e._t=setTimeout(()=>e.classList.remove("on"),2200)};
const iso=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
const dayN=s=>Math.round((new Date(s+"T12:00")-new Date(today+"T12:00"))/864e5);
const fromN=n=>{const d=new Date(today+"T12:00");d.setDate(d.getDate()+n);return iso(d)};
const rel=s=>{const n=dayN(s);return n==0?"dnes":n==1?"zítra":n>1&&n<7?`za ${plural(n,"den","dny","dní")}`:""};
const pinI=(on,fv)=>L_.divIcon({className:"",html:`<div class="pin${on?" on":""}${fv?" fv":""}"></div>`,iconSize:[14,14],iconAnchor:[7,7]});
/* ---------- filtry ---------- */
function range(){const max=dayN(U[U.length-1].datum);return[fromN(Math.round(ST.d1/100*max)),fromN(Math.round(ST.d2/100*max))]}
function base(){const[od,dd]=range();return filter(P,{typ:[...ST.typ],od,do:dd,cenaMax:ST.cena,nev:!ST.ver,origin,sort:ST.sort=="vzd"?"datum":ST.sort})}
function run(fit){let A=base();const all=A;
 if($("#inview").checked&&!fit){const b=map.getBounds();A=A.filter(p=>p.lat!=null&&b.contains([p.lat,p.lon]))}
 if(ST.sort=="vzd"){const c=map.getCenter();A.forEach(p=>p._c=p.lat!=null?km(c.lat,c.lng,p.lat,p.lon):1e9);A.sort((a,b)=>a._c-b._c)}
 LL=A;$("#cnt").textContent=nPlesu(LL.length);$("#ctx").textContent=($("#inview").checked?"ve výřezu":"v celé ČR")+(ctxLabel?" · "+ctxLabel:"");
 const tc=types(all.length?filter(P,{od:range()[0],do:range()[1],nev:!ST.ver}):[]);$("#chips").innerHTML=`<button class="chip" data-t="" aria-pressed="${!ST.typ.size}">Všechny typy</button>`+tc.slice(0,14).map(([t,n])=>`<button class="chip" data-t="${esc(t)}" aria-pressed="${ST.typ.has(t)}">${esc(t)} ${n}</button>`).join("");
 $("#list").innerHTML=LL.length?"":`<li class="empty">V tomto výřezu nic není.<br><button class="tg" id="zoomout">Oddálit mapu</button></li>`;shown=0;more();hist();
 cl.clearLayers();MK={};cl.addLayers(all.filter(p=>p.lat!=null).map(p=>{const m=L_.marker([p.lat,p.lon],{icon:pinI(0,favs.has(p.id)),title:p.titul,keyboard:false});m.on("click",()=>openSheet(p.id,true));MK[p.id]=m;return m}));
 if(fit&&cl.getLayers().length){syncing=true;map.fitBounds(cl.getBounds(),{padding:[60,60],maxZoom:12});setTimeout(()=>{syncing=false;run()},500)}save()}
function more(){const n=Math.min(LL.length,shown+30);$("#list").insertAdjacentHTML("beforeend",LL.slice(shown,n).map(item).join(""));shown=n}
function item(p){const f=favs.has(p.id);return `<li><a class="it" href="#/ples/${p.id}" data-id="${p.id}"><div class="pf">${posterHTML(p)}</div><div><div class="dd">${dow(p.datum).slice(0,2)} ${+p.datum.slice(8)}. ${MES[+p.datum.slice(5,7)-1]}${rel(p.datum)?" · "+rel(p.datum):""}</div><h3>${esc(p.titul)}</h3><div class="m">${p.cas_zacatku?esc(p.cas_zacatku)+" · ":""}${esc(place(p))}${PC.loni(p)}</div>${p.overeno===false?'<span class="uv">místo neověřeno</span>':""}</div></a><button class="hrt" data-fav="${p.id}" aria-pressed="${f}" aria-label="${f?"Odebrat z mého večera":"Uložit do mého večera"}">${f?"♥":"♡"}</button></li>`}
function hist(){const max=dayN(U[U.length-1].datum),W=Math.ceil((max+1)/7),c=Array(W).fill(0);base().forEach(()=>0);
 filter(P,{typ:[...ST.typ],nev:!ST.ver,cenaMax:ST.cena}).forEach(p=>{const w=Math.floor(dayN(p.datum)/7);if(w>=0&&w<W)c[w]++});const mx=Math.max(...c,1),a=ST.d1/100*W,b=ST.d2/100*W;
 $("#hist").innerHTML=c.map((n,i)=>`<i class="${i+1>=a&&i<=b?"on":""}" style="height:${3+n/mx*37}px" title="týden od ${cz(fromN(i*7))}: ${nPlesu(n)}"></i>`).join("");const[od,dd]=range();$("#d1l").textContent=cz(od);$("#d2l").textContent=cz(dd)}
function save(){const q=new URLSearchParams();ST.typ.forEach(t=>q.append("typ",t));ST.cena&&q.set("cena",ST.cena);ST.ver&&q.set("ver","1");(ST.d1||ST.d2!=100)&&q.set("d",ST.d1+"-"+ST.d2);ST.sort!="datum"&&q.set("sort",ST.sort);
 if(!location.hash.startsWith("#/ples")&&!location.hash.startsWith("#/vecer"))history.replaceState(null,"","#/"+(q+""?"?"+q:""))}
/* ---------- detail ---------- */
function openSheet(id,fly){const p=ID[id];if(!p)return;if(location.hash!="#/ples/"+id)history.pushState(null,"","#/ples/"+id);const im=pimg(p),f=favs.has(p.id);
 const sim=U.filter(x=>x.id!=p.id&&x.plakat&&x.lat!=null&&p.lat!=null&&km(p.lat,p.lon,x.lat,x.lon)<30).slice(0,6);
 $("#sheet").innerHTML=`<button class="sx" aria-label="Zavřít detail">×</button><div class="shp" ${im?`data-story="${p.id}" role="button" tabindex="0" aria-label="Zobrazit plakát přes celou obrazovku"`:""}>${posterHTML(p)}</div><div class="sb"><div class="dd">${dow(p.datum)} ${czl(p.datum)}${p.cas_zacatku?" · "+esc(p.cas_zacatku):""}</div><h2>${esc(p.titul)}</h2>
 ${p.overeno===false?'<div class="warn">Místo konání se nepodařilo ověřit ze zdroje, ověřte si ho u pořadatele.</div>':""}
 <dl class="kv">${[["Místo",p.misto_budova],["Adresa",p.adresa],["Obec",p.obec],["Kraj",p.kraj],["Vstupné",p.cena_vstupenky],["Hudba",p.kapela_hudba],["Pořadatel",p.poradatel],["Typ",p.typ]].filter(x=>x[1]).map(([a,b])=>`<dt>${a}</dt><dd>${esc(b)}</dd>`).join("")}${p.misto_loni?`<dt>Místo</dt><dd>${PC.loni(p,1)}</dd>`:""}<dt>Zdroj</dt><dd>${p.zdroje.map(u=>`<a href="${esc(u)}" target="_blank" rel="noopener">${esc(host(u))}</a>`).join("<br>")}</dd>${im?`<dt>Plakát</dt><dd><a href="${esc(p.plakat_zdroj)}" target="_blank" rel="noopener">${esc(host(p.plakat_zdroj))}</a></dd>`:""}</dl>
 <div class="acts"><a class="btn" href="${esc(p.zdroje[0])}" target="_blank" rel="noopener">Oficiální stránka ↗</a><button class="btn s" data-fav="${p.id}" aria-pressed="${f}">${f?"♥ Uloženo":"♡ Uložit"}</button><button class="btn s" data-ics="${p.id}">Do kalendáře</button><button class="btn s" data-share="${p.id}">Sdílet</button>${p.lat!=null?`<a class="btn s" target="_blank" rel="noopener" href="https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lon}">Trasa</a>`:""}</div>
 ${sim.length?`<h3 style="margin:24px 0 10px">Plesy v okolí</h3><div class="sim">${sim.map(x=>`<a href="#/ples/${x.id}"><div class="pf">${posterHTML(x,false)}</div>${esc(x.titul)}<br><span style="color:var(--mut)">${cz(x.datum)}</span></a>`).join("")}</div>`:""}</div>`;
 $("#sheet").hidden=false;$("#sheet").scrollTop=0;$(".sx").focus({preventScroll:true});$$(".pin.on").forEach(x=>x.classList.remove("on"));
 document.title=`${p.titul} · ${cz(p.datum)} · Plesuj Mapa`;
 if(p.lat!=null&&fly){map.once('moveend',()=>setTimeout(()=>{const m=MK[p.id];m&&m._icon&&m._icon.firstChild.classList.add('on')},350));map.setView([p.lat,p.lon],Math.max(map.getZoom(),14))}}
const closeSheet=()=>{$("#sheet").hidden=true;document.title="Plesuj Mapa — plesy kolem vás";if(location.hash.startsWith("#/ples"))history.pushState(null,"","#/");save()};
/* ---------- příkazová paleta ---------- */
let KI=[],ks=-1;
function kres(){const v=$("#kq").value,q=norm(v.trim()),g=[];
 if(!q){g.push(["Rychle",[{t:"Moje poloha",s:"GPS",i:"◎",a:()=>geo()},{t:"Tento víkend",s:"",i:"✦",a:()=>weekend()},{t:"Celá ČR",s:"",i:"◇",a:()=>{ctxLabel="";map.setView([49.8,15.5],7)}}]])}
 else{const dg=q.replace(/\s/g,"");if(/^\d{3,5}$/.test(dg)){const ks_=Object.keys(PC.PSC).filter(k=>k.startsWith(dg)).slice(0,5);ks_.length&&g.push(["PSČ",ks_.map(k=>({t:`${k.slice(0,3)} ${k.slice(3)}`,s:PC.PSC[k][2],i:"◎",a:()=>{const h=pscLookup(k);ctxLabel="okolí "+h.name;map.setView(h.ll,11)}}))])}
  const ob=OB.filter(([o])=>norm(o).startsWith(q)).concat(OB.filter(([o])=>!norm(o).startsWith(q)&&norm(o).includes(q))).slice(0,5);ob.length&&g.push(["Obce a města",ob.map(([o,n,ll])=>({t:o,s:nPlesu(n),i:"⌂",a:()=>{ctxLabel=o;map.setView(ll,12)}}))]);
  const kr=KR.filter(([k])=>norm(k).includes(q)).slice(0,3);kr.length&&g.push(["Kraje",kr.map(([k,n])=>({t:k,s:nPlesu(n),i:"◇",a:()=>flyKraj(k)}))]);
  const ty=types(U).filter(([t])=>norm(t).includes(q)).slice(0,4);ty.length&&g.push(["Typy",ty.map(([t,n])=>({t,s:nPlesu(n),i:"♪",a:()=>{ST.typ=new Set([t]);run()}}))]);
  const pl=U.filter(p=>p._s.includes(q)).slice(0,6);pl.length&&g.push(["Plesy",pl.map(p=>({t:p.titul,s:cz(p.datum)+" · "+p.obec,img:poster(p),a:()=>openSheet(p.id,true)}))])}
 KI=g.flatMap(x=>x[1]);ks=KI.length?0:-1;let i=0;$("#kres").innerHTML=g.map(([h,a])=>`<h6>${h}</h6>`+a.map(it=>`<div class="ko" role="option" id="ko${i}" data-k="${i++}" aria-selected="false"><span class="ic">${it.img?`<img src="${it.img}" alt="">`:it.i}</span><span>${esc(it.t)}</span><small>${esc(it.s)}</small></div>`).join("")).join("")||'<p style="padding:14px;color:var(--mut)">Nic jsme nenašli.</p>';kmark()}
const kmark=()=>{$$(".ko").forEach((o,i)=>o.setAttribute("aria-selected",i==ks));const o=$("#ko"+ks);o&&(o.scrollIntoView({block:"nearest"}),$("#kq").setAttribute("aria-activedescendant",o.id))};
const kopen=()=>{$("#cmdk").hidden=false;$("#kq").value="";kres();$("#kq").focus()},kclose=()=>{$("#cmdk").hidden=true};
const kgo=i=>{const it=KI[i];if(!it)return;kclose();$("#sq").textContent=it.t;it.a();setTimeout(()=>run(),400)};
function flyKraj(k){const a=U.filter(p=>p.kraj==k&&p.lat!=null);ctxLabel=k;if(a.length)map.fitBounds(L_.latLngBounds(a.map(p=>[p.lat,p.lon])),{padding:[60,60]})}
function geo(){if(!navigator.geolocation)return toast("Prohlížeč polohu nepodporuje");navigator.geolocation.getCurrentPosition(p=>{ctxLabel="vaše okolí";map.setView([p.coords.latitude,p.coords.longitude],11)},()=>toast("Polohu se nepodařilo zjistit"))}
function weekend(){const d=new Date(today+"T12:00"),w=d.getDay(),o=w>=1&&w<=5?5-w:w==6?-1:-2,max=dayN(U[U.length-1].datum);ST.d1=Math.max(0,(o)/max*100);ST.d2=Math.min(100,(o+2)/max*100);$("#d1").value=ST.d1;$("#d2").value=ST.d2;ctxLabel="tento víkend";run()}
/* ---------- příběhy ---------- */
let SL=[],si=0,stt;
function stories(start){const c=map.getCenter(),F=favs.get().map(i=>ID[i]).filter(Boolean),ft=new Set(F.map(p=>p.typ));
 SL=start?[ID[start]]:portraitFirst(LL.filter(p=>p.plakat)).slice(0,60).sort((a,b)=>(ft.has(b.typ)-ft.has(a.typ))||a.datum.localeCompare(b.datum)).slice(0,20);
 if(!SL.length)SL=portraitFirst(U.filter(p=>p.plakat)).slice(0,20);si=0;$("#st").hidden=false;sdraw();$(".stx").focus()}
function sdraw(){clearTimeout(stt);const p=SL[si],f=favs.has(p.id);
 $("#st").innerHTML=`<div class="stbg" style="background-image:url('${poster(p)}')"></div><div class="stc"><div class="bars">${SL.map((_,i)=>`<i class="${i<si?"d":i==si?"a":""}"><b></b></i>`).join("")}</div><button class="stx" aria-label="Zavřít příběhy">×</button>
 <div class="stimg"><img src="${poster(p)}" alt="Plakát: ${esc(p.titul)}"><div class="stnav"><button data-sn="-1" aria-label="Předchozí"></button><button data-sn="1" aria-label="Další"></button></div></div>
 <div class="stcap"><div class="dd" style="color:#ffb3a3">${dow(p.datum)} ${czl(p.datum)}</div><h2>${esc(p.titul)}</h2><div class="m">${esc(place(p))}${PC.loni(p)}</div><div class="stact"><button class="btn" data-fav="${p.id}" aria-pressed="${f}">${f?"♥ Uloženo":"♡ Uložit"}</button><button class="btn s" data-detail="${p.id}">Detail</button><span style="margin-left:auto;color:#aaa;font-size:12px;align-self:center">${si+1}/${SL.length}</span></div></div></div>`;
 if(SL.length>1&&!matchMedia("(prefers-reduced-motion:reduce)").matches)stt=setTimeout(()=>snext(1),6000);const n=SL[si+1];n&&(new Image().src=poster(n))}
const snext=d=>{si+=d;if(si<0)si=0;if(si>=SL.length)return sclose();sdraw()},sclose=()=>{clearTimeout(stt);$("#st").hidden=true};
/* ---------- můj večer ---------- */
function vecer(){const F=favs.get().map(i=>ID[i]).filter(Boolean).sort((a,b)=>a.datum.localeCompare(b.datum));let h="";
 F.forEach((p,i)=>{const pr=F[i-1];if(pr){const dd=dayN(p.datum)-dayN(pr.datum);h+=dd==0?`<li class="gap" style="background:none;box-shadow:none;display:block;padding:0 12px"><span class="clash">⚠ Stejný den jako předchozí ples${pr.lat!=null&&p.lat!=null?`, vzdálenost ${km(pr.lat,pr.lon,p.lat,p.lon).toFixed(0)} km`:""}</span></li>`:`<li class="gap" style="background:none;box-shadow:none;display:block;padding:0 12px">${plural(dd,"den","dny","dní")} pauza</li>`}
  h+=`<li><div class="pf">${posterHTML(p,false)}</div><div><div class="dd">${dow(p.datum)} ${czl(p.datum)}</div><b><a href="#/ples/${p.id}" style="color:inherit">${esc(p.titul)}</a></b><div class="m" style="color:var(--mut)">${esc(place(p))}${PC.loni(p)}</div></div><button class="hrt" style="position:static" data-fav="${p.id}" aria-pressed="true" aria-label="Odebrat">♥</button></li>`});
 $("#page").innerHTML=`<div class="pg"><p><a href="#/" class="btn s">← Zpět na mapu</a></p><h1>Můj večer</h1><p style="color:var(--mut)">${F.length?`${nPlesu(F.length)} v sezóně. Upozorníme vás, když se dva plesy kryjí.`:"Zatím nic. U plesu klepněte na ♡."}</p>${F.length?`<p class="acts"><button class="btn" id="vics">Vše do kalendáře</button><button class="btn s" id="vst">▶ Projít jako příběhy</button></p><ol class="vl">${h}</ol>`:""}</div>`;$("#page").hidden=false;document.title="Můj večer · Plesuj Mapa";
 if(F.length){$("#vics").onclick=()=>downloadIcs(F,"muj-vecer");$("#vst").onclick=()=>{SL=F.filter(p=>p.plakat);if(!SL.length)return toast("Uložené plesy nemají plakát");si=0;$("#st").hidden=false;sdraw()}}}
/* ---------- router ---------- */
function route(){const h=location.hash.slice(1)||"/",[path,qs]=h.split("?"),s=path.split("/").filter(Boolean);$("#page").hidden=s[0]!="vecer";
 if(s[0]=="vecer")return vecer();if(s[0]=="ples")return openSheet(s[1],!$("#sheet").hidden?false:true);if(s[0]=="kraj"){const k=(KR.find(([k])=>slug(k)==s[1])||[])[0];k&&flyKraj(k)}$("#sheet").hidden=true}
const fc=()=>$("#fc").textContent=favs.get().length||"";
document.addEventListener("click",e=>{const t=e.target;let x;
 if(x=t.closest("[data-fav]")){e.preventDefault();e.stopPropagation();const on=favs.toggle(x.dataset.fav);$$(`[data-fav="${x.dataset.fav}"]`).forEach(b=>{b.setAttribute("aria-pressed",on);b.textContent=b.classList.contains("hrt")?(on?"♥":"♡"):(on?"♥ Uloženo":"♡ Uložit")});const m=MK[x.dataset.fav];m&&m.setIcon(pinI(0,on));toast(on?"Uloženo do Mého večera ♥":"Odebráno");fc();if(location.hash=="#/vecer")vecer();return}
 if(x=t.closest(".it")){e.preventDefault();openSheet(x.dataset.id,true);return}if(t.closest(".sx"))return closeSheet();
 if(x=t.closest("[data-t]")){const v=x.dataset.t;v?(ST.typ.has(v)?ST.typ.delete(v):ST.typ.add(v)):ST.typ.clear();return run()}
 if(x=t.closest("[data-k]"))return kgo(+x.dataset.k);if(t==$("#cmdk"))return kclose();
 if(x=t.closest("[data-story]"))return stories(+x.dataset.story);if(x=t.closest("[data-sn]"))return snext(+x.dataset.sn);if(t.closest(".stx"))return sclose();
 if(x=t.closest("[data-detail]")){sclose();$("#page").hidden=true;return openSheet(x.dataset.detail,true)}
 if(x=t.closest("[data-ics]"))return downloadIcs([ID[x.dataset.ics]],slug(ID[x.dataset.ics].titul));
 if(x=t.closest("[data-share]")){const p=ID[x.dataset.share],url=location.href;(navigator.share?navigator.share({title:p.titul,url}).catch(()=>{}):navigator.clipboard.writeText(url).then(()=>toast("Odkaz zkopírován"),()=>prompt("Odkaz",url)));return}
 if(t.id=="zoomout"){map.zoomOut(2)}});
document.addEventListener("keydown",e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()=="k"||e.key=="/"&&!/INPUT|SELECT/.test(document.activeElement.tagName)){e.preventDefault();kopen();return}
 if(!$("#cmdk").hidden){if(e.key=="Escape")kclose();else if(e.key=="ArrowDown"){ks=Math.min(ks+1,KI.length-1);kmark();e.preventDefault()}else if(e.key=="ArrowUp"){ks=Math.max(ks-1,0);kmark();e.preventDefault()}else if(e.key=="Enter"){e.preventDefault();kgo(ks)}return}
 if(!$("#st").hidden){if(e.key=="Escape")sclose();if(e.key=="ArrowRight")snext(1);if(e.key=="ArrowLeft")snext(-1);return}
 if(e.key=="Escape"&&!$("#sheet").hidden)closeSheet();if(e.key=="Enter"&&e.target.dataset.story)stories(+e.target.dataset.story)});
let tx0=null;$("#st").addEventListener("touchstart",e=>tx0=e.touches[0].clientX,{passive:true});$("#st").addEventListener("touchend",e=>{if(tx0==null)return;const d=e.changedTouches[0].clientX-tx0;if(Math.abs(d)>50)snext(d<0?1:-1);tx0=null});
$("#openK").onclick=kopen;$("#kq").oninput=kres;$("#stories").onclick=()=>stories();$(".grab").onclick=()=>$("#panel").classList.toggle("full");
let dp;addEventListener("beforeinstallprompt",e=>{e.preventDefault();dp=e;$("#install").hidden=false});$("#install").onclick=()=>{dp&&dp.prompt();$("#install").hidden=true};
if("serviceWorker"in navigator)navigator.serviceWorker.register("sw.js").catch(()=>{});
PC.load().then(d=>{P=d;P.forEach(p=>ID[p.id]=p);U=P.filter(p=>p.datum>=today).sort((a,b)=>a.datum.localeCompare(b.datum));const c={},o={};U.forEach(p=>{p.kraj&&(c[p.kraj]=(c[p.kraj]||0)+1);if(p.lat!=null){o[p.obec]=o[p.obec]||[p.obec,0,[p.lat,p.lon]];o[p.obec][1]++;if(!p.priblizne)o[p.obec][2]=[p.lat,p.lon]}});
 KR=Object.entries(c).sort((a,b)=>a[0].localeCompare(b[0],"cs"));OB=Object.values(o).sort((a,b)=>b[1]-a[1]);
 const u=new URLSearchParams((location.hash.split("?")[1])||"");u.getAll("typ").forEach(t=>ST.typ.add(t));ST.cena=u.get("cena")||"";ST.ver=u.has("ver");ST.sort=u.get("sort")||"datum";if(u.get("d")){[ST.d1,ST.d2]=u.get("d").split("-").map(Number)}
 $("#d1").value=ST.d1;$("#d2").value=ST.d2;$("#cena").value=ST.cena;$("#sort").value=ST.sort;$("#ver").setAttribute("aria-pressed",ST.ver);
 map=L_.map("map",{zoomControl:false,attributionControl:true}).setView([49.8,15.5],7);L_.control.zoom({position:"bottomright"}).addTo(map);L_.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19,attribution:"© OpenStreetMap"}).addTo(map);
 if(innerWidth>860)map.fitBounds([[48.55,12.1],[51.06,18.86]],{paddingTopLeft:[440,90],paddingBottomRight:[20,20]});
 cl=L_.markerClusterGroup({maxClusterRadius:46,showCoverageOnHover:false}).addTo(map);
 map.on("moveend",()=>{if(!syncing&&$("#inview").checked)run()});
 const ds=()=>{let a=+$("#d1").value,b=+$("#d2").value;if(a>b)[a,b]=[b,a];ST.d1=a;ST.d2=b;ctxLabel=ctxLabel=="tento víkend"?"":ctxLabel;run()};$("#d1").oninput=ds;$("#d2").oninput=ds;
 $("#cena").oninput=e=>{ST.cena=e.target.value;run()};$("#sort").oninput=e=>{ST.sort=e.target.value;run()};$("#ver").onclick=e=>{ST.ver=!ST.ver;e.target.setAttribute("aria-pressed",ST.ver);run()};$("#inview").onchange=()=>run();
 $("#ics").onclick=()=>{downloadIcs(LL.slice(0,500),"plesy");toast(`Staženo ${nPlesu(Math.min(500,LL.length))}`)};
 new IntersectionObserver(e=>e[0].isIntersecting&&shown<LL.length&&more(),{root:$("#panel"),rootMargin:"300px"}).observe($("#sent"));
 $("#list").addEventListener("mouseover",e=>{const it=e.target.closest(".it");$$(".pin.on").forEach(x=>x.classList.remove("on"));if(!it)return;const m=MK[it.dataset.id];m&&m._icon&&m._icon.firstChild.classList.add("on")});
 fc();run();addEventListener("popstate",route);addEventListener("hashchange",route);route()});
