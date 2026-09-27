const STORAGE_KEY="three-things-journal-v1";
const recordDateEl=document.getElementById("recordDate");
const q1El=document.getElementById("q1"),q2El=document.getElementById("q2"),q3El=document.getElementById("q3"),q4El=document.getElementById("q4");
const form=document.getElementById("journalForm"),saveStatus=document.getElementById("saveStatus");
const editorView=document.getElementById("editorView"),historyView=document.getElementById("historyView"),historyList=document.getElementById("historyList"),emptyHistory=document.getElementById("emptyHistory");
const backupStatus=document.getElementById("backupStatus"),importFile=document.getElementById("importFile");

function localDateKey(d=new Date()){const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,"0"),day=String(d.getDate()).padStart(2,"0");return `${y}-${m}-${day}`}
function formatSavedDate(key){const [y,m,d]=key.split("-").map(Number);return new Intl.DateTimeFormat("ko-KR",{year:"numeric",month:"long",day:"numeric",weekday:"short"}).format(new Date(y,m-1,d))}
function normalizeRecord(r={}){return{q1:r.q1??r.emotion??"",q2:r.q2??r.fun??"",q3:r.q3??r.gratitude??"",q4:r.q4??""}}
function loadAll(){try{const raw=JSON.parse(localStorage.getItem(STORAGE_KEY))||{},out={};for(const [date,r] of Object.entries(raw))out[date]=normalizeRecord(r);return out}catch{return{}}}
function saveAll(data){localStorage.setItem(STORAGE_KEY,JSON.stringify(data))}
function loadSelectedDate(){const r=loadAll()[recordDateEl.value];q1El.value=r?.q1||"";q2El.value=r?.q2||"";q3El.value=r?.q3||"";q4El.value=r?.q4||""}
function esc(t=""){return String(t).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;")}

form.addEventListener("submit",e=>{e.preventDefault();const key=recordDateEl.value;if(!key)return;const data=loadAll();data[key]={q1:q1El.value.trim(),q2:q2El.value.trim(),q3:q3El.value.trim(),q4:q4El.value.trim()};saveAll(data);saveStatus.textContent=`${formatSavedDate(key)} 기록을 저장했어.`;setTimeout(()=>saveStatus.textContent="",2500)});
recordDateEl.addEventListener("change",loadSelectedDate);

function renderHistory(){const data=loadAll(),keys=Object.keys(data).sort((a,b)=>b.localeCompare(a));historyList.innerHTML="";emptyHistory.style.display=keys.length?"none":"block";for(const key of keys){const r=data[key],card=document.createElement("article");card.className="history-card";card.innerHTML=`<div class="history-date">${formatSavedDate(key)}</div>
<div class="history-item"><span class="history-label">1. 반복한 감정</span><p class="history-answer">${esc(r.q1||"—")}</p></div>
<div class="history-item"><span class="history-label">2. 설레거나 재밌었던 일</span><p class="history-answer">${esc(r.q2||"—")}</p></div>
<div class="history-item"><span class="history-label">3. 감사했던 일</span><p class="history-answer">${esc(r.q3||"—")}</p></div>
<div class="history-item"><span class="history-label">4. 상대를 위한 작은 생각·말·행동</span><p class="history-answer">${esc(r.q4||"—")}</p></div>
<div class="history-actions"><button class="delete-button" data-date="${key}" type="button">삭제</button></div>`;historyList.appendChild(card)}
document.querySelectorAll(".delete-button").forEach(btn=>btn.addEventListener("click",()=>{const key=btn.dataset.date;if(!confirm(`${formatSavedDate(key)} 기록을 삭제할까?`))return;const data=loadAll();delete data[key];saveAll(data);renderHistory();if(key===recordDateEl.value)loadSelectedDate()}))}
document.getElementById("historyBtn").addEventListener("click",()=>{renderHistory();editorView.classList.remove("active");historyView.classList.add("active");window.scrollTo(0,0)});
document.getElementById("backBtn").addEventListener("click",()=>{historyView.classList.remove("active");editorView.classList.add("active");window.scrollTo(0,0)});

document.getElementById("exportBtn").addEventListener("click",()=>{const data=loadAll();const exportData=Object.keys(data).sort().map(date=>({date,"1":data[date].q1||"","2":data[date].q2||"","3":data[date].q3||"","4":data[date].q4||""}));const blob=new Blob([JSON.stringify(exportData,null,2)],{type:"application/json"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=`행복_한_톨_기록_${localDateKey()}.json`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);backupStatus.textContent="날짜와 1~4번 답변만 저장했어.";setTimeout(()=>backupStatus.textContent="",2500)});

function parseImportedData(parsed){if(Array.isArray(parsed)){const out={};for(const item of parsed){if(!item||typeof item!=="object"||!/^\d{4}-\d{2}-\d{2}$/.test(item.date||""))continue;out[item.date]={q1:item["1"]??"",q2:item["2"]??"",q3:item["3"]??"",q4:item["4"]??""}}return out}const old=parsed?.records??parsed;if(old&&typeof old==="object"&&!Array.isArray(old)){const out={};for(const [date,r] of Object.entries(old)){if(/^\d{4}-\d{2}-\d{2}$/.test(date))out[date]=normalizeRecord(r)}return out}return{}}
document.getElementById("importBtn").addEventListener("click",()=>importFile.click());
importFile.addEventListener("change",async()=>{const file=importFile.files?.[0];if(!file)return;try{const parsed=JSON.parse(await file.text()),records=parseImportedData(parsed),count=Object.keys(records).length;if(!count)throw new Error();if(!confirm(`${count}개의 기록을 불러올까?\n같은 날짜의 기존 기록은 백업 내용으로 바뀌어.`))return;saveAll({...loadAll(),...records});loadSelectedDate();renderHistory();backupStatus.textContent=`${count}개 기록을 불러왔어.`}catch{backupStatus.textContent="백업 파일을 읽지 못했어."}finally{importFile.value="";setTimeout(()=>backupStatus.textContent="",3500)}});

recordDateEl.value=localDateKey();loadSelectedDate();
if("serviceWorker"in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(()=>{}));