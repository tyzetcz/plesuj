const S=window.SITE,$=s=>document.querySelector(s),esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
document.title=`${S.name} – ${S.tagline}`;$("#sitename").textContent=S.name;$("#tagline").textContent=S.tagline;
$("#addlink").href=`mailto:${S.email}?subject=${encodeURIComponent(S.name+": nový ples")}`;
const MES=["led","úno","bře","dub","kvě","čvn","čvc","srp","zář","říj","lis","pro"],DNY=["neděle","pondělí","úterý","středa","čtvrtek","pátek","sobota"];
const cz=d=>{const[y,m,dd]=d.split("-").map(Number);return `${dd}. ${m}. ${y}`},dow=d=>DNY[new Date(d+"T12:00").getDay()];
const today=new Date().toISOString().slice(0,10);
const km=(a,b,c,d)=>{const r=Math.PI/180,x=Math.sin((c-a)*r/2)**2+Math.cos(a*r)*Math.cos(c*r)*Math.sin((d-b)*r/2)**2;return 12742*Math.asin(Math.sqrt(x))};
const norm=s=>(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
let P=[],PSC={},origin=null,map,layer,extra;
const LBL={typ:"Typ",datum:"Datum",cas_zacatku:"Začátek",misto_budova:"Místo",adresa:"Adresa",obec:"Obec",psc:"PSČ",cena_vstupenky:"Vstupné",kapela_hudba:"Hudba",poradatel:"Pořadatel",poznamka:"Poznámka"};
function bands(p){return (p.kapela_hudba||"").split(/[,;+]| a /).map(s=>s.trim()).filter(s=>s&&s.length>1)}
const st=()=>({q:$("#q").value,psc:$("#psc").value,r:$("#radius").value,od:$("#od").value,do:$("#do").value,typ:$("#typ").value,kap:$("#kapela").value,sort:$("#sort").value,past:$("#past").checked,nev:$("#nev").checked});
function filtered(){const f=st(),q=norm(f.q);
 let L=P.filter(p=>(f.past||p.datum>=today)&&(f.nev||p.overeno!==false)&&(!f.od||p.datum>=f.od)&&(!f.do||p.datum<=f.do)&&(!f.typ||p.typ===f.typ)&&(!f.kap||bands(p).includes(f.kap))
  &&(!q||norm([p.nazev,p.obec,p.kapela_hudba,p.misto_budova].join(" ")).includes(q)));
 L.forEach(p=>p.dist=origin&&p.lat?km(origin[0],origin[1],p.lat,p.lon):null);
 if(origin)L=L.filter(p=>p.dist!=null&&p.dist<=+f.r);
 const k={datum:p=>p.datum,cena:p=>p.cena_num??1e9,vzd:p=>p.dist??1e9}[f.sort];
 return L.sort((a,b)=>k(a)<k(b)?-1:k(a)>k(b)?1:a.datum.localeCompare(b.datum))}
const IMG=[["maturitni",/matur|absolvent|stužk/i],["hasicsky",/hasič|sdh|hasic/i],["myslivecky",/myslivec|myslivc|honeb|lovec/i],["rybarsky",/rybář|rybar|mrs|čPRS/i],["sportovni",/sport|sokol|tj |fotbal|hokej|orel|volejbal/i],["reprezentacni",/reprezenta|městsk|mestsk|královsk|společensk|benefič/i],["skolni",/škol|skol|dětsk|detsk|maškar|mašk|rodič|mš |zš /i]];
function img(p){const t=(p.typ||"")+" ",n=p.nazev||"";for(const[k,r]of IMG)if(r.test(t))return k;for(const[k,r]of IMG)if(r.test(n))return k;return "spolkovy"}
const IMGALT={maturitni:"maturitní ples",hasicsky:"hasičský ples",myslivecky:"myslivecký ples",rybarsky:"rybářský ples",sportovni:"sportovní ples",reprezentacni:"reprezentační ples",skolni:"školní ples",spolkovy:"ples"};
const pic=(p,c)=>p.plakat?`<img class="${c} poster" src="img/plakaty/${p.plakat}${c=="thumb"?"_t":""}.webp" alt="Plakát: ${esc(p.nazev)}" loading="lazy">`:`<img class="${c}" src="img/typ/${img(p)}.webp" alt="Ilustrace: ${IMGALT[img(p)]}" loading="lazy" width="1200" height="630">`;
function render(){const L=filtered();
 $("#count").textContent=`${L.length} ${L.length==1?"ples":L.length<5&&L.length?"plesy":"plesů"}`+(origin?` do ${$("#radius").value} km`:"");
 $("#list").innerHTML=L.map(p=>{const[,m,d]=p.datum.split("-");return `<li><a class="card${p.datum<today?" past":""}" href="#/ples/${p.id}">${pic(p,"thumb")}
 <div class="date"><b>${+d}</b><span>${MES[m-1]}</span></div><div><h3>${esc(p.nazev)}</h3>
 <div class="meta">${dow(p.datum)} ${cz(p.datum)}${p.cas_zacatku?", "+esc(p.cas_zacatku):""} · ${esc([p.misto_budova,p.obec].filter(Boolean).join(", "))}</div>
 <div class="meta">${p.typ?`<span class="tag">${esc(p.typ)}</span>`:""}${p.overeno===false?`<span class="tag warn">místo neověřeno</span>`:""}${p.cena_num!=null?esc(p.cena_vstupenky):"vstupné neuvedeno"}${p.kapela_hudba?" · 🎵 "+esc(p.kapela_hudba):""}
 ${p.dist!=null?` · <span class="dist">${p.dist.toFixed(p.dist<10?1:0)} km${p.priblizne?" (přibl.)":""}</span>`:""}</div></div></a></li>`}).join("")||"<li class='msg'>Nic nenalezeno. Zkuste uvolnit filtry.</li>";
 layer.clearLayers();extra.clearLayers();const pts=[],G=new Map();
 L.forEach(p=>{if(p.lat==null||p.lon==null||p.lat==="")return;const k=(+p.lat).toFixed(5)+","+(+p.lon).toFixed(5);if(!G.has(k))G.set(k,[]);G.get(k).push(p)});
 const nogps=L.length-[...G.values()].reduce((a,g)=>a+g.length,0);
 const mm=[];G.forEach(g=>{g.sort((a,b)=>a.datum.localeCompare(b.datum));const ap=g.some(p=>p.priblizne),n=g.length,ll=[+g[0].lat,+g[0].lon];pts.push(ll);
  const sz=n>1?30:18;const m=L_.marker(ll,{icon:L_.divIcon({className:"",html:`<div class="pin${ap?" approx":""}">${n>1?n:""}</div>`,iconSize:[sz,sz],iconAnchor:[sz/2,sz/2]})});m.options.n=n;
  m.bindPopup(`<b>${esc([g[0].misto_budova,g[0].obec].filter(Boolean).join(", "))}</b>${n>1?` – ${n} plesů`:""}${ap?"<br><i>přibližná poloha</i>":""}<ul class="plist">${g.map(p=>`<li><a href="#/ples/${p.id}">${cz(p.datum)} – ${esc(p.nazev)}</a></li>`).join("")}</ul>`,{maxHeight:260});mm.push(m)});
 layer.addLayers(mm);
 $("#mapnote").textContent=nogps?`${nogps} ${nogps==1?"ples nemá":nogps<5?"plesy nemají":"plesů nemá"} známou polohu, na mapě ${nogps==1?"chybí":"chybí"} (jsou jen v seznamu).`:"";
 if(origin){L_.circle(origin,{radius:$("#radius").value*1000,color:"#7a1f4b",weight:1,fillOpacity:.04}).addTo(extra);pts.push(origin)}
 if(pts.length)map.fitBounds(pts,{padding:[20,20],maxZoom:12});
 const u=new URLSearchParams();Object.entries(st()).forEach(([k,v])=>{if(v&&!(k=="r"&&v=="25")&&!(k=="sort"&&v=="datum"))u.set(k,v)});history.replaceState(null,"",(u+""?"?"+u:location.pathname)+location.hash)}
const L_=window.L;
function setPsc(){const v=$("#psc").value.replace(/\s/g,"");$("#pscmsg").textContent="";
 if(!v){origin=null;return render()}if(!/^\d{5}$/.test(v)){origin=null;if(v.length>=5)$("#pscmsg").textContent="PSČ má 5 číslic.";return render()}
 let hit=PSC[v],note="";if(!hit){const near=Object.keys(PSC).filter(k=>k.slice(0,3)==v.slice(0,3)).sort((a,b)=>Math.abs(a-v)-Math.abs(b-v))[0];if(near){hit=PSC[near];note=" (nejbližší známé PSČ "+near+")"}}
 if(!hit){origin=null;$("#pscmsg").textContent="Toto PSČ neznám.";return render()}
 origin=[hit[0],hit[1]];$("#pscmsg").textContent="Vzdálenost od: "+hit[2]+note;render()}
function detail(id){const p=P.find(x=>x.id==id);if(!p)return go("#/");
 const rows=Object.keys(LBL).filter(k=>p[k]).map(k=>{let v=k=="datum"?`${dow(p.datum)} ${cz(p.datum)}`:esc(p[k]);
  if(k=="kapela_hudba")v=bands(p).map(b=>`<a href="#/kapela/${encodeURIComponent(b)}">${esc(b)}</a>`).join(", ")||v;return `<dt>${LBL[k]}</dt><dd>${v}</dd>`}).join("");
 const src=p.zdroje.map(u=>`<a href="${esc(u)}" target="_blank" rel="noopener">${esc(new URL(u).hostname.replace("www.",""))}</a>`).join(", ");
 $("#detail").innerHTML=`<a href="#/">← Zpět na seznam</a>${p.plakat?`<figure class="plakat"><a href="img/plakaty/${p.plakat}.webp" target="_blank" rel="noopener">${pic(p,"hero")}</a><figcaption>Plakát: zdroj <a href="${esc(p.plakat_zdroj)}" target="_blank" rel="noopener">${esc(new URL(p.plakat_zdroj).hostname.replace("www.",""))}</a> · <a href="mailto:${S.email}?subject=${encodeURIComponent("Nahlásit / odstranit plakát: "+p.nazev+" ("+p.datum+")")}">Nahlásit / odstranit plakát</a></figcaption></figure>`:pic(p,"hero")}<h1>${esc(p.nazev)}</h1>${p.overeno===false?"<p class='msg warn'>⚠ Místo konání se nepodařilo ověřit ze zdroje. Ověřte u pořadatele.</p>":""}${p.datum<today?"<p class='msg'>Tento ples už proběhl.</p>":""}
 <dl>${rows}${p.priblizne?"<dt>Poloha</dt><dd>přibližná poloha (střed obce)</dd>":""}${src?`<dt>Zdroj</dt><dd>${src}</dd>`:""}</dl>
 ${p.predprodej_odkaz?`<p><a class="btn" href="${esc(p.predprodej_odkaz)}" target="_blank" rel="noopener">🎟 Vstupenky / předprodej</a></p>`:""}${p.lat?'<div id="dmap"></div>':""}`;
 if(p.lat){const m=L_.map("dmap").setView([p.lat,p.lon],p.priblizne?13:16);tiles(m);L_.marker([p.lat,p.lon]).addTo(m)}}
function band(name){const L=P.filter(p=>bands(p).includes(name)).sort((a,b)=>a.datum.localeCompare(b.datum));
 $("#detail").innerHTML=`<a href="#/">← Zpět na seznam</a><h1>🎵 ${esc(name)}</h1><p class="msg">${L.length} plesů s touto kapelou</p><ul id="blist" style="list-style:none;padding:0;display:grid;gap:10px">${L.map(p=>`<li><a class="card${p.datum<today?" past":""}" href="#/ples/${p.id}"><div><h3>${esc(p.nazev)}</h3><div class="meta">${cz(p.datum)} · ${esc(p.obec||"")}</div></div></a></li>`).join("")}</ul>`}
const tiles=m=>L_.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19,attribution:"© OpenStreetMap"}).addTo(m);
function go(h){location.hash=h}
function route(){const h=decodeURIComponent(location.hash.slice(1)),d=$("#detail");let m;
 if(m=h.match(/^\/ples\/(\d+)/)){$("#home").hidden=true;d.hidden=false;detail(m[1]);scrollTo(0,0)}
 else if(m=h.match(/^\/kapela\/(.+)/)){$("#home").hidden=true;d.hidden=false;band(m[1]);scrollTo(0,0)}
 else{d.hidden=true;d.innerHTML="";$("#home").hidden=false;map.invalidateSize();render()}}
Promise.all([fetch("data/plesy.json").then(r=>r.json()),fetch("data/psc.json").then(r=>r.json())]).then(([a,b])=>{P=a.filter(p=>p.datum);PSC=b;
 [...new Set(P.map(p=>p.typ).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"cs")).forEach(t=>$("#typ").add(new Option(t,t)));
 [...new Set(P.flatMap(bands))].sort((a,b)=>a.localeCompare(b,"cs")).forEach(t=>$("#kapela").add(new Option(t,t)));
 map=L_.map("map").setView([50.35,15.9],9);tiles(map);layer=L_.markerClusterGroup({maxClusterRadius:45,spiderfyOnMaxZoom:false,disableClusteringAtZoom:13,iconCreateFunction:c=>{const t=c.getAllChildMarkers().reduce((a,m)=>a+(m.options.n||1),0);return L_.divIcon({html:`<div><span>${t}</span></div>`,className:"marker-cluster marker-cluster-"+(t<10?"small":t<100?"medium":"large"),iconSize:[40,40]})}}).addTo(map);extra=L_.layerGroup().addTo(map);
 const u=new URLSearchParams(location.search),set=(id,k)=>u.has(k)&&($(id).value=u.get(k));
 set("#q","q");set("#psc","psc");set("#radius","r");set("#od","od");set("#do","do");set("#typ","typ");set("#kapela","kap");set("#sort","sort");$("#past").checked=u.get("past")=="true";
 ["#q","#od","#do","#typ","#kapela","#sort","#past","#nev"].forEach(s=>$(s).addEventListener("input",render));
 $("#psc").addEventListener("input",setPsc);$("#radius").addEventListener("input",()=>origin?render():setPsc());
 $("#geo").onclick=()=>{if(!navigator.geolocation)return $("#pscmsg").textContent="Prohlížeč polohu nepodporuje.";$("#pscmsg").textContent="Zjišťuji polohu…";
  navigator.geolocation.getCurrentPosition(p=>{origin=[p.coords.latitude,p.coords.longitude];$("#psc").value="";$("#pscmsg").textContent="Vzdálenost od vaší polohy";render()},()=>$("#pscmsg").textContent="Polohu se nepodařilo zjistit.")};
 $("#reset").onclick=()=>{["#q","#psc","#od","#do","#typ","#kapela"].forEach(s=>$(s).value="");$("#sort").value="datum";$("#radius").value="25";$("#past").checked=false;origin=null;$("#pscmsg").textContent="";render()};
 window.addEventListener("hashchange",route);if($("#psc").value)setPsc();route()});
