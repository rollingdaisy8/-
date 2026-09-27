const STORAGE_KEY="three-things-journal-v1";

const questions=[
  {q:"q1",n:"01",text:"너는 오늘 어떤 감정을 반복했어?",pantry:"감정 기록",label:"반복한 감정"},
  {q:"q2",n:"02",text:"오늘 하루 설레거나 재밌었던 일은 뭐였어?",pantry:"설렘·재미 곳간",label:"설레거나 재밌었던 일"},
  {q:"q3",n:"03",text:"오늘 하루 감사했던 일은 뭐였어?",pantry:"감사 곳간",label:"감사했던 일"},
  {q:"q4",n:"04",text:"상대를 위한 작은 생각이나 말, 행동했던 일 있어?",pantry:"마음 곳간",label:"상대를 위한 작은 생각·말·행동"}
];

let draft={q1:[],q2:[],q3:[],q4:[]};

const recordDateEl=document.getElementById("recordDate");
const saveStatus=document.getElementById("saveStatus");
const randomDateEl=document.getElementById("randomDate");
const randomLabelEl=document.getElementById("randomLabel");
const randomTextEl=document.getElementById("randomText");
const pantryDetail=document.getElementById("pantryDetail");
const pantryTitle=document.getElementById("pantryTitle");
const pantryList=document.getElementById("pantryList");
const historyList=document.getElementById("historyList");
const emptyHistory=document.getElementById("emptyHistory");
const backupStatus=document.getElementById("backupStatus");
const importFile=document.getElementById("importFile");

function localDateKey(d=new Date()){
  const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,"0"),day=String(d.getDate()).padStart(2,"0");
  return `${y}-${m}-${day}`;
}
function formatSavedDate(key){
  const [y,m,d]=key.split("-").map(Number);
  return new Intl.DateTimeFormat("ko-KR",{year:"numeric",month:"long",day:"numeric",weekday:"short"}).format(new Date(y,m-1,d));
}
function asArray(v){
  if(Array.isArray(v)) return v.map(x=>String(x).trim()).filter(Boolean);
  if(v===null||v===undefined) return [];
  const s=String(v).trim();
  return s?[s]:[];
}
function normalizeRecord(r={}){
  return{
    q1:asArray(r.q1??r.emotion??r["1"]),
    q2:asArray(r.q2??r.fun??r["2"]),
    q3:asArray(r.q3??r.gratitude??r["3"]),
    q4:asArray(r.q4??r["4"])
  };
}
function loadAll(){
  try{
    const raw=JSON.parse(localStorage.getItem(STORAGE_KEY))||{};
    const out={};
    for(const [date,r] of Object.entries(raw)) out[date]=normalizeRecord(r);
    return out;
  }catch{return{}}
}
function saveAll(data){localStorage.setItem(STORAGE_KEY,JSON.stringify(data))}
function esc(t=""){return String(t).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;")}

function buildQuestionUI(){
  const wrap=document.getElementById("questions");
  wrap.innerHTML="";
  for(const item of questions){
    const card=document.createElement("article");
    card.className="question-card";
    card.innerHTML=`
      <div class="question-title"><span class="number">${item.n}</span>${item.text}</div>
      <div class="grain-entry">
        <input id="input-${item.q}" class="grain-input" type="text" placeholder="한 톨을 적고 Enter">
        <button class="add-button" type="button" data-add="${item.q}">추가</button>
      </div>
      <p class="hint">Enter를 누르면 한 톨 카드로 바뀌어.</p>
      <div id="list-${item.q}" class="grain-list"></div>
    `;
    wrap.appendChild(card);
  }

  document.querySelectorAll(".grain-input").forEach(input=>{
    input.addEventListener("keydown",e=>{
      if(e.key==="Enter"){
        e.preventDefault();
        addGrain(input.id.replace("input-",""));
      }
    });
  });
  document.querySelectorAll("[data-add]").forEach(btn=>btn.addEventListener("click",()=>addGrain(btn.dataset.add)));
}

function renderDraft(){
  for(const item of questions){
    const list=document.getElementById(`list-${item.q}`);
    list.innerHTML="";
    draft[item.q].forEach((text,index)=>{
      const chip=document.createElement("div");
      chip.className="grain-chip";
      chip.innerHTML=`<span>${esc(text)}</span><button class="grain-x" type="button" aria-label="삭제">×</button>`;
      chip.querySelector("button").addEventListener("click",()=>{
        draft[item.q].splice(index,1);
        renderDraft();
      });
      list.appendChild(chip);
    });
  }
}

function addGrain(q){
  const input=document.getElementById(`input-${q}`);
  const text=input.value.trim();
  if(!text)return;
  draft[q].push(text);
  input.value="";
  renderDraft();
  input.focus();
}

function loadSelectedDate(){
  const r=loadAll()[recordDateEl.value]||{q1:[],q2:[],q3:[],q4:[]};
  draft={q1:[...r.q1],q2:[...r.q2],q3:[...r.q3],q4:[...r.q4]};
  renderDraft();
}
recordDateEl.addEventListener("change",loadSelectedDate);

document.getElementById("saveBtn").addEventListener("click",()=>{
  const key=recordDateEl.value;
  if(!key)return;
  const data=loadAll();
  data[key]={
    q1:[...draft.q1],
    q2:[...draft.q2],
    q3:[...draft.q3],
    q4:[...draft.q4]
  };
  saveAll(data);
  saveStatus.textContent=`${formatSavedDate(key)} 기록을 저장했어.`;
  updateCounts(); renderHistory(); showRandomGrain();
  setTimeout(()=>saveStatus.textContent="",2500);
});

function getRandomCandidates(){
  const data=loadAll(),c=[];
  for(const [date,r] of Object.entries(data)){
    for(const q of ["q2","q3","q4"]){
      for(const text of r[q]){
        c.push({date,q,text,label:questions.find(x=>x.q===q).label});
      }
    }
  }
  return c;
}
function showRandomGrain(){
  const c=getRandomCandidates();
  if(!c.length){
    randomDateEl.textContent=""; randomLabelEl.textContent="";
    randomTextEl.textContent="아직 꺼내볼 한 톨이 없어."; return;
  }
  const item=c[Math.floor(Math.random()*c.length)];
  randomDateEl.textContent=formatSavedDate(item.date);
  randomLabelEl.textContent=item.label;
  randomTextEl.textContent=item.text;
}
document.getElementById("randomAgainBtn").addEventListener("click",showRandomGrain);

function updateCounts(){
  const data=loadAll(),counts={q1:0,q2:0,q3:0,q4:0};
  for(const r of Object.values(data)) for(const q of Object.keys(counts)) counts[q]+=r[q].length;
  document.getElementById("countQ1").textContent=`${counts.q1}톨`;
  document.getElementById("countQ2").textContent=`${counts.q2}톨`;
  document.getElementById("countQ3").textContent=`${counts.q3}톨`;
  document.getElementById("countQ4").textContent=`${counts.q4}톨`;
}

function openPantry(q){
  const data=loadAll();
  const entries=[];
  for(const [date,r] of Object.entries(data)){
    for(const text of r[q]) entries.push({date,text});
  }
  entries.sort((a,b)=>b.date.localeCompare(a.date));
  pantryTitle.textContent=questions.find(x=>x.q===q).pantry;
  pantryList.innerHTML="";
  if(!entries.length){
    pantryList.innerHTML='<p class="empty">아직 모아둔 한 톨이 없어.</p>';
  }else{
    for(const e of entries){
      const el=document.createElement("article");
      el.className="pantry-entry";
      el.innerHTML=`<div class="pantry-entry-date">${formatSavedDate(e.date)}</div><p class="pantry-entry-text">${esc(e.text)}</p>`;
      pantryList.appendChild(el);
    }
  }
  pantryDetail.classList.remove("hidden");
  pantryDetail.scrollIntoView({behavior:"smooth",block:"start"});
}
document.querySelectorAll(".pantry-card").forEach(btn=>btn.addEventListener("click",()=>openPantry(btn.dataset.q)));
document.getElementById("closePantryBtn").addEventListener("click",()=>pantryDetail.classList.add("hidden"));

function chipsHtml(arr){
  if(!arr.length) return '<span class="history-grain">—</span>';
  return arr.map(x=>`<span class="history-grain">${esc(x)}</span>`).join("");
}
function renderHistory(){
  const data=loadAll(),keys=Object.keys(data).sort((a,b)=>b.localeCompare(a));
  historyList.innerHTML="";
  emptyHistory.style.display=keys.length?"none":"block";
  for(const key of keys){
    const r=data[key],card=document.createElement("article");
    card.className="history-card";
    card.innerHTML=`
      <div class="history-date">${formatSavedDate(key)}</div>
      ${questions.map(item=>`
        <div class="history-item">
          <span class="history-label">${item.n}. ${item.label}</span>
          <div class="history-grains">${chipsHtml(r[item.q])}</div>
        </div>`).join("")}
      <div class="history-actions"><button class="delete-button" data-date="${key}" type="button">삭제</button></div>
    `;
    historyList.appendChild(card);
  }
  document.querySelectorAll(".delete-button").forEach(btn=>btn.addEventListener("click",()=>{
    const key=btn.dataset.date;
    if(!confirm(`${formatSavedDate(key)} 기록을 삭제할까?`))return;
    const data=loadAll(); delete data[key]; saveAll(data);
    renderHistory(); updateCounts(); showRandomGrain();
    if(key===recordDateEl.value) loadSelectedDate();
  }));
}

document.getElementById("exportBtn").addEventListener("click",()=>{
  const data=loadAll();
  const out=Object.keys(data).sort().map(date=>({
    date,
    "1":data[date].q1,
    "2":data[date].q2,
    "3":data[date].q3,
    "4":data[date].q4
  }));
  const blob=new Blob([JSON.stringify(out,null,2)],{type:"application/json"});
  const url=URL.createObjectURL(blob),a=document.createElement("a");
  a.href=url; a.download=`행복_한_톨_기록_${localDateKey()}.json`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
  backupStatus.textContent="날짜와 한 톨 목록만 저장했어.";
  setTimeout(()=>backupStatus.textContent="",2500);
});

function parseImportedData(parsed){
  const out={};
  if(Array.isArray(parsed)){
    for(const item of parsed){
      if(!item||!/^\d{4}-\d{2}-\d{2}$/.test(item.date||""))continue;
      out[item.date]=normalizeRecord(item);
    }
    return out;
  }
  const old=parsed?.records??parsed;
  if(old&&typeof old==="object"&&!Array.isArray(old)){
    for(const [date,r] of Object.entries(old)){
      if(/^\d{4}-\d{2}-\d{2}$/.test(date)) out[date]=normalizeRecord(r);
    }
  }
  return out;
}
document.getElementById("importBtn").addEventListener("click",()=>importFile.click());
importFile.addEventListener("change",async()=>{
  const file=importFile.files?.[0]; if(!file)return;
  try{
    const records=parseImportedData(JSON.parse(await file.text()));
    const count=Object.keys(records).length;
    if(!count)throw new Error();
    if(!confirm(`${count}개의 날짜 기록을 불러올까?\n같은 날짜의 기존 기록은 백업 내용으로 바뀌어.`))return;
    saveAll({...loadAll(),...records});
    loadSelectedDate(); renderHistory(); updateCounts(); showRandomGrain();
    backupStatus.textContent=`${count}개 날짜 기록을 불러왔어.`;
  }catch{
    backupStatus.textContent="백업 파일을 읽지 못했어.";
  }finally{
    importFile.value="";
    setTimeout(()=>backupStatus.textContent="",3500);
  }
});

document.querySelectorAll(".nav-btn").forEach(btn=>btn.addEventListener("click",()=>{
  document.querySelectorAll(".nav-btn").forEach(b=>b.classList.remove("active"));
  btn.classList.add("active");
  document.querySelectorAll(".view").forEach(v=>v.classList.remove("active"));
  document.getElementById(btn.dataset.view).classList.add("active");
  if(btn.dataset.view==="storeView")updateCounts();
  if(btn.dataset.view==="historyView")renderHistory();
  window.scrollTo({top:0,behavior:"smooth"});
}));

buildQuestionUI();
recordDateEl.value=localDateKey();
loadSelectedDate();
updateCounts();
renderHistory();
showRandomGrain();

if("serviceWorker"in navigator){
  window.addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(()=>{}));
}