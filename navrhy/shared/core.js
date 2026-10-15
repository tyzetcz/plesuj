/* Plesuj – sdílené jádro pro návrhy (data, filtry, pomocné funkce). Data = stejné soubory jako hlavní web. */
(function(){
const B=window.PLESUJ_BASE||"../../";
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const norm=s=>(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
const MES=["led","úno","bře","dub","kvě","čvn","čvc","srp","zář","říj","lis","pro"];
const MESL=["leden","únor","březen","duben","květen","červen","červenec","srpen","září","říjen","listopad","prosinec"];
const MES2=["ledna","února","března","dubna","května","června","července","srpna","září","října","listopadu","prosince"];
const DNY=["neděle","pondělí","úterý","středa","čtvrtek","pátek","sobota"];
const d0=new Date(),today=`${d0.getFullYear()}-${String(d0.getMonth()+1).padStart(2,"0")}-${String(d0.getDate()).padStart(2,"0")}`;
const cz=d=>{const[y,m,dd]=d.split("-").map(Number);return `${dd}. ${m}. ${y}`};
const czl=d=>{const[y,m,dd]=d.split("-").map(Number);return `${dd}. ${MES2[m-1]} ${y}`};
const dow=d=>DNY[new Date(d+"T12:00").getDay()];
const km=(a,b,c,d)=>{const r=Math.PI/180,x=Math.sin((c-a)*r/2)**2+Math.cos(a*r)*Math.cos(c*r)*Math.sin((d-b)*r/2)**2;return 12742*Math.asin(Math.sqrt(x))};
const plural=(n,a,b,c)=>`${n} ${n==1?a:n>1&&n<5?b:c}`;
const nPlesu=n=>plural(n,"ples","plesy","plesů");
const bands=p=>(p.kapela_hudba||"").split(/[,;+]| a /).map(s=>s.trim()).filter(s=>s&&s.length>1);
const IMG=[["maturitni",/matur|absolvent|stužk/i],["hasicsky",/hasič|sdh|hasic/i],["myslivecky",/myslivec|myslivc|honeb|lovec/i],["rybarsky",/rybář|rybar|mrs|čPRS/i],["sportovni",/sport|sokol|tj |fotbal|hokej|orel|volejbal/i],["reprezentacni",/reprezenta|městsk|mestsk|královsk|společensk|benefič/i],["skolni",/škol|skol|dětsk|detsk|maškar|mašk|rodič|mš |zš /i]];
const kind=p=>{const t=(p.typ||"")+" ",n=p.nazev||"";for(const[k,r]of IMG)if(r.test(t))return k;for(const[k,r]of IMG)if(r.test(n))return k;return "spolkovy"};
const poster=(p,thumb)=>p.plakat?`${B}img/plakaty/${p.plakat}${thumb?"_t":""}.webp`:null;
const illu=p=>`${B}img/typ/${kind(p)}.webp`;
const imgOf=(p,thumb)=>poster(p,thumb)||illu(p);
const host=u=>{try{return new URL(u).hostname.replace(/^www\./,"")}catch(e){return u}};
const place=p=>[p.misto_budova,p.obec].filter(Boolean).join(", ");
const slug=s=>norm(s).replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
let PSC={};
function pscLookup(v){v=(v||"").replace(/\s/g,"");if(!/^\d{5}$/.test(v))return null;let h=PSC[v],near=null;
 if(!h){near=Object.keys(PSC).filter(k=>k.slice(0,3)==v.slice(0,3)).sort((a,b)=>Math.abs(a-v)-Math.abs(b-v))[0];if(near)h=PSC[near]}
 return h?{ll:[h[0],h[1]],name:h[2],near}:null}
/* f: {q,origin:[lat,lon],r,od,do,typ:[...],kraj,cenaMax,poster,past,nev,obec,poradatel,sort} */
function filter(P,f={}){const q=norm(f.q);const typ=f.typ&&f.typ.length?new Set([].concat(f.typ)):null;
 let L=P.filter(p=>(f.past||p.datum>=today)&&(f.nev!==false||p.overeno!==false)&&(!f.od||p.datum>=f.od)&&(!f.do||p.datum<=f.do)
  &&(!typ||typ.has(p.typ))&&(!f.kraj||p.kraj===f.kraj)&&(!f.obec||p.obec===f.obec)&&(!f.poradatel||p.poradatel===f.poradatel)
  &&(f.cenaMax==null||f.cenaMax===""||(p.cena_num!=null&&p.cena_num<=+f.cenaMax))&&(!f.poster||p.plakat)
  &&(!q||p._s.includes(q)));
 L.forEach(p=>p.dist=f.origin&&p.lat!=null?km(f.origin[0],f.origin[1],p.lat,p.lon):null);
 if(f.origin&&f.r)L=L.filter(p=>p.dist!=null&&p.dist<=+f.r);
 const k={datum:p=>p.datum+(p.cas_zacatku||""),cena:p=>p.cena_num??1e9,vzd:p=>p.dist??1e9,nazev:p=>norm(p.nazev)}[f.sort||"datum"];
 return L.sort((a,b)=>{const x=k(a),y=k(b);return x<y?-1:x>y?1:a.datum.localeCompare(b.datum)})}
function ics(list){const z=s=>String(s||"").replace(/[\\,;]/g,m=>"\\"+m).replace(/\n/g,"\\n");
 const ev=list.map(p=>{const d=p.datum.replace(/-/g,""),t=(p.cas_zacatku||"").match(/(\d{1,2})[:.](\d{2})/);
  const dt=t?`DTSTART;TZID=Europe/Prague:${d}T${t[1].padStart(2,"0")}${t[2]}00`:`DTSTART;VALUE=DATE:${d}`;
  return ["BEGIN:VEVENT",`UID:plesuj-${p.id}@tyzetcz.github.io`,`DTSTAMP:${new Date().toISOString().replace(/[-:]/g,"").slice(0,15)}Z`,dt,`SUMMARY:${z(p.nazev)}`,`LOCATION:${z([p.misto_budova,p.adresa,p.obec].filter(Boolean).join(", "))}`,`URL:${p.zdroje[0]||""}`,`DESCRIPTION:${z((p.zdroje[0]||""))}`,"END:VEVENT"].join("\r\n")});
 return ["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//Plesuj//CS","CALSCALE:GREGORIAN",...ev,"END:VCALENDAR"].join("\r\n")}
function downloadIcs(list,name){const b=new Blob([ics(list)],{type:"text/calendar"}),a=document.createElement("a");a.href=URL.createObjectURL(b);a.download=(name||"plesy")+".ics";document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500)}
const FAV="plesuj_oblibene";
const favs={get:()=>{try{return JSON.parse(localStorage.getItem(FAV)||"[]")}catch(e){return[]}},has:id=>favs.get().includes(+id),
 toggle:id=>{id=+id;let f=favs.get();f=f.includes(id)?f.filter(x=>x!==id):[...f,id];localStorage.setItem(FAV,JSON.stringify(f));return f.includes(id)}};
async function load(){const[a,b,k]=await Promise.all([fetch(B+"data/plesy.json").then(r=>r.json()),fetch(B+"data/psc.json").then(r=>r.json()),fetch(B+"navrhy/shared/kraje.json").then(r=>r.json())]);
 PSC=b;const P=a.filter(p=>p.datum).sort((x,y)=>x.datum.localeCompare(y.datum)||(x.cas_zacatku||"").localeCompare(y.cas_zacatku||""));P.forEach(p=>{p.kraj=k[p.id]||null;p.titul=title(p);p._s=norm([p.nazev,p.obec,p.kapela_hudba,p.misto_budova,p.typ,p.poradatel,p.kraj].join(" "))});return P}
const tiles=(L,m)=>L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19,attribution:"© OpenStreetMap"}).addTo(m);
const types=P=>{const c={};P.forEach(p=>p.typ&&(c[p.typ]=(c[p.typ]||0)+1));return Object.entries(c).sort((a,b)=>b[1]-a[1])};

/* Titulek bez místa konání (místo patří do vlastního pole) */
const EMO=/[\u{1F000}-\u{1FAFF}\u2600-\u27BF\uFE0F\u200D\u{1F3FB}-\u{1F3FF}]+/gu;
const VW=/sokolovn|kulturn|\bKD\b|\bDK\b|sál|hotel\b|hotelu|restaura|hospod|hostin|zámk|zámek|zbrojnic|tělocvičn|společensk|obecní d|národní d|beseda|orlovn|club|klub|palác|dům|domě/i;
function title(p){let t=(p.nazev||"").replace(EMO," ").replace(/\s+/g," ").trim();const strip=()=>{const m=p.misto_budova;if(!m)return;const i=norm(t).indexOf(norm(m));
  if(i>3&&i+m.length>=t.length-6){const pre=t.slice(0,i);if(/(?:[\/·|–—@-]|\b(?:v|ve|na|do))\s*$/i.test(pre)&&(VW.test(m)||/[\/·|–—@]\s*$/.test(pre)))t=pre.replace(/\s*(?:[\/·|–—@,(-]|\b(?:v|ve|na|do))\s*$/i,"").trim()}};
 t=t.replace(/\s*[\/·|]\s*([^\/·|]+)$/,(s,x)=>norm(x).trim()==norm(p.obec)?"":s);strip();
 const t2=t.replace(/\s+(?:v|ve)\s+(?:sokolovně|kulturním domě|KD\b|DK\b|sále\b|hotelu|restauraci|hospodě|hostinci|zámku|hasičské zbrojnici|tělocvičně|společenském|obecním domě|národním domě|Besedě|orlovně|Parlament Clubu)[^]*$/i,"").trim();
 if(t2.length>=4)t=t2;t=t.replace(/[\s\/·|,–-]+$/,"").trim();return t||p.nazev}
/* Plakát: nejvyšší rozlišení, ohnisko pro 3:4 výřez */
function pimg(p){if(!p.plakat)return null;const w=p.plakat_w||3,h=p.plakat_h||4,r=h/w;
 return{src:`${B}img/plakaty/${p.plakat}.webp`,w,h,portrait:r>=1.05,pos:r>1.6?"50% 22%":r>1.2?"50% 38%":"50% 50%",fit:r<1.05?"contain":"cover"}}
function posterHTML(p,alt){const i=pimg(p);if(!i)return `<img src="${illu(p)}" alt="" loading="lazy" decoding="async" style="object-fit:cover">`;
 return `${i.fit=="contain"?`<img class="pbg" src="${i.src}" alt="" aria-hidden="true" loading="lazy">`:""}<img class="pimg" src="${i.src}" width="${i.w}" height="${i.h}" alt="${alt===false?"":"Plakát: "+esc(title(p))}" loading="lazy" decoding="async" style="object-fit:${i.fit};object-position:${i.pos}">`}
const portraitFirst=L=>L.slice().sort((a,b)=>(pimg(b)?.portrait?1:0)-(pimg(a)?.portrait?1:0));

window.PC={title,pimg,posterHTML,portraitFirst,B,esc,norm,MES,MESL,MES2,DNY,today,cz,czl,dow,km,plural,nPlesu,bands,kind,poster,illu,imgOf,host,place,slug,pscLookup,filter,ics,downloadIcs,favs,load,tiles,types,get PSC(){return PSC}};
})();
