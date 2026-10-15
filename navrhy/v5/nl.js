/* Plesuj – porozumění větě v češtině: „hasičský ples u Hradce v únoru do 200 Kč“ → filtry */
(function(){const norm=s=>(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
const MON=[["led",0],["unor",1],["brez",2],["dub",3],["kvet",4],["cerven",5],["cervenc",6],["srp",7],["zar",8],["rij",9],["listop",10],["prosin",11]];
const MESL=["leden","únor","březen","duben","květen","červen","červenec","srpen","září","říjen","listopad","prosinec"];
const TY=[["hasic","hasič"],["matur","maturit"],["mysliv","mysliv"],["rybar","rybář"],["sport","sport"],["skol","škol"],["mestsk","městsk"],["reprezent","reprezent"],["country","country"],["maskar","maškar"],["farn","farn"],["kroj","kroj"],["obecn","obecn"],["skaut","skaut"],["spolecensk","společensk"],["retro","retro"],["disco","disco"],["absolvent","absolvent"],["sokol","sokol"],["vinar","vinař"],["detsk","dětsk"],["senior","senior"]];
const STOP=new Set("ples plesy plesu plesů bal baly balu bál bály chci hledam hledám najdi nejaky nějaký nejake nějaké nejlepsi a na v ve u do od o se s k ke kolem okoli okolí blizko blízko poblíž pobliz rad rád bych jit jít tancit tančit pro mě me mne nas nás nam nám".split(" ").map(norm));
const ENDS=["ech","ich","ove","ovi","ach","em","ou","ne","ni","ce","e","i","u","y","a","o"];
const iso=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
function parse(text,C){const t0=" "+norm(text)+" ",tok=[],R={typ:[],tokens:tok};let t=t0;const today=new Date(C.today+"T12:00");const cut=re=>{t=t.replace(re," ")};
 const D=(o)=>{const d=new Date(today);d.setDate(d.getDate()+o);return iso(d)};
 // čas
 let m;const w=today.getDay(),fri=w>=1&&w<=5?5-w:w==6?-1:-2;
 if(/ (tento|tenhle|o|na) vikend| vikend /.test(t)&&!/ pristi vikend /.test(t)){R.od=D(Math.max(0,fri));R.do=D(fri+2);tok.push(["čas","tento víkend"]);cut(/ (tento|tenhle|o|na)? ?vikend /)}
 if(/ pristi vikend /.test(t)){R.od=D(fri+7);R.do=D(fri+9);tok.push(["čas","příští víkend"]);cut(/ pristi vikend /)}
 if(/ dnes(ka)? /.test(t)){R.od=R.do=C.today;tok.push(["čas","dnes"]);cut(/ dnes(ka)? /)}
 if(/ zitra /.test(t)){R.od=R.do=D(1);tok.push(["čas","zítra"]);cut(/ zitra /)}
 if(/ (tento|tenhle) tyden /.test(t)){R.od=C.today;R.do=D(7-((w+6)%7)-1);tok.push(["čas","tento týden"]);cut(/ (tento|tenhle) tyden /)}
 if(/ pristi tyden /.test(t)){const mo=7-((w+6)%7);R.od=D(mo);R.do=D(mo+6);tok.push(["čas","příští týden"]);cut(/ pristi tyden /)}
 if(/ (pred vanoci|do vanoc) /.test(t)){R.od=C.today;R.do=`${today.getFullYear()}-12-24`;tok.push(["čas","do Vánoc"]);cut(/ (pred vanoci|do vanoc) /)}
 for(const[st,i]of MON.slice().reverse()){const re=new RegExp(` (v |ve |behem |do |od )?${st}[a-z]* `);if(re.test(t)&&!(st=="cerven"&&/ cervenc/.test(t))){const y=today.getFullYear()+(i<today.getMonth()?1:0);R.od=iso(new Date(y,i,1,12));R.do=iso(new Date(y,i+1,0,12));if(R.od<C.today)R.od=C.today;tok.push(["měsíc",MESL[i]]);cut(re);break}}
 // cena a vzdálenost
 if(m=t.match(/ (do|v okruhu|okruh|max(?:imalne)?|nejdal) (\d{1,3}) ?km /)){R.r=+m[2];tok.push(["okruh",`do ${m[2]} km`]);cut(m[0])}
 if(m=t.match(/ (\d{1,3}) ?km /)){R.r=+m[1];tok.push(["okruh",`do ${m[1]} km`]);cut(m[0])}
 if(/ (zdarma|zadarmo|bez vstupneho|vstup(ne)? (volny|zdarma)) /.test(t)){R.cenaMax=0;tok.push(["vstupné","zdarma"]);cut(/ (zdarma|zadarmo|bez vstupneho|vstup(ne)? (volny|zdarma)) /)}
 if(m=t.match(/ (do|max(imalne)?|nejvys|pod|levn[a-z]* nez) (\d{2,4}) ?(kc|korun[a-z]*|,-)? /)){R.cenaMax=+m[3];tok.push(["vstupné",`do ${m[3]} Kč`]);cut(m[0])}
 if(/ levn[a-z]* /.test(t)){R.sort="cena";tok.push(["řazení","nejlevnější"]);cut(/ levn[a-z]* /)}
 if(/ s plakatem /.test(t)){R.poster=1;tok.push(["jen","s plakátem"]);cut(/ s plakatem /)}
 if(m=t.match(/ (\d{3}) ?(\d{2}) /)){R.psc=m[1]+m[2];const h=C.psc(R.psc);if(h){R.ll=h.ll;R.r=R.r||25;tok.push(["místo",`${h.name} (${m[1]} ${m[2]})`])}cut(m[0])}
 // typy
 for(const[st,lab]of TY){const re=new RegExp(` ${st}[a-z]* `);if(re.test(t)){const hit=C.types.filter(x=>norm(x).includes(st));if(hit.length){R.typ.push(...hit);tok.push(["typ",hit.length==1?hit[0]:lab+"…"])}cut(re)}}
 // místo: obec / kraj
 const words=t.trim().split(/\s+/).filter(Boolean);const used=new Set();
 const stems=w=>{const out=[w];for(const e of ENDS)if(w.endsWith(e)&&w.length-e.length>=3)out.push(w.slice(0,-e.length));return out};
 const findObec=(w,strict)=>{for(const s of stems(w)){if(s.length<3)continue;let best=null;for(const o of C.obce){const n=norm(o[0]);if(strict?n==s||n.split(/[ -]/)[0]==s:n.startsWith(s)&&n.split(/[ -]/)[0].length-s.length<=3){if(!best||o[1]>best[1])best=o}}if(best)return best}return null};
 for(let i=0;i<words.length&&!R.ll;i++){const pre=/^(u|v|ve|kolem|okoli|blizko|pobliz|na|z|do|nedaleko)$/.test(words[i]);const w2=pre?words[i+1]:words[i];if(!w2||STOP.has(w2)||w2.length<3)continue;
  const kr=C.kraje.find(([k])=>stems(w2).some(s=>s.length>=5&&norm(k).includes(s)));if(kr&&!R.kraj){R.kraj=kr[0];tok.push(["kraj",kr[0]]);used.add(i);if(pre)used.add(i+1);continue}
  const o=findObec(w2,!pre);if(o){R.ll=o[2];R.obec=o[0];R.r=R.r||(pre&&/^(u|kolem|okoli|blizko|pobliz|nedaleko)$/.test(words[i])?25:10);tok.push(["místo",(R.r?`${o[0]} +${R.r} km`:o[0])]);used.add(i);if(pre)used.add(i+1)}}
 const rest=words.filter((w,i)=>!used.has(i)&&!STOP.has(w)&&!/^(u|v|ve|kolem|okoli|blizko|pobliz|na|z|do|nedaleko|kc|km|plesy?|baly?)$/.test(w));
 if(rest.length){R.q=rest.join(" ");tok.push(["text",`„${R.q}“`])}return R}
window.NL={parse};})();
