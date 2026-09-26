const STORAGE_KEY = "three-things-journal-v1";

const todayEl = document.getElementById("today");
const form = document.getElementById("journalForm");
const emotionEl = document.getElementById("emotion");
const funEl = document.getElementById("fun");
const gratitudeEl = document.getElementById("gratitude");
const saveStatus = document.getElementById("saveStatus");

const historyBtn = document.getElementById("historyBtn");
const backBtn = document.getElementById("backBtn");
const editorView = document.getElementById("editorView");
const historyView = document.getElementById("historyView");
const historyList = document.getElementById("historyList");
const emptyHistory = document.getElementById("emptyHistory");

const exportBtn = document.getElementById("exportBtn");
const importBtn = document.getElementById("importBtn");
const importFile = document.getElementById("importFile");
const backupStatus = document.getElementById("backupStatus");

function localDateKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatKoreanDate(date = new Date()) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long"
  }).format(date);
}

function formatSavedDate(key) {
  const [y, m, d] = key.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short"
  }).format(date);
}

function loadAll() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function saveAll(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function loadToday() {
  const data = loadAll();
  const today = data[localDateKey()];

  emotionEl.value = today?.emotion || "";
  funEl.value = today?.fun || "";
  gratitudeEl.value = today?.gratitude || "";
}

function showEditor() {
  editorView.classList.add("active");
  historyView.classList.remove("active");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function showHistory() {
  renderHistory();
  editorView.classList.remove("active");
  historyView.classList.add("active");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function esc(text = "") {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function isValidBackup(data) {
  if (!data || typeof data !== "object" || Array.isArray(data)) return false;

  for (const [key, value] of Object.entries(data)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return false;
    if (!value || typeof value !== "object" || Array.isArray(value)) return false;

    const allowed = ["emotion", "fun", "gratitude", "updatedAt"];
    if (Object.keys(value).some(k => !allowed.includes(k))) return false;
  }
  return true;
}

function renderHistory() {
  const data = loadAll();
  const keys = Object.keys(data).sort((a, b) => b.localeCompare(a));

  historyList.innerHTML = "";
  emptyHistory.style.display = keys.length ? "none" : "block";

  for (const key of keys) {
    const item = data[key];
    const card = document.createElement("article");
    card.className = "history-card";

    card.innerHTML = `
      <div class="history-date">${formatSavedDate(key)}</div>

      <div class="history-item">
        <span class="history-label">반복한 감정</span>
        <p class="history-answer">${esc(item.emotion || "—")}</p>
      </div>

      <div class="history-item">
        <span class="history-label">재밌었던 일</span>
        <p class="history-answer">${esc(item.fun || "—")}</p>
      </div>

      <div class="history-item">
        <span class="history-label">감사했던 일</span>
        <p class="history-answer">${esc(item.gratitude || "—")}</p>
      </div>

      <div class="history-actions">
        <button class="delete-button" type="button" data-date="${key}">삭제</button>
      </div>
    `;

    historyList.appendChild(card);
  }

  document.querySelectorAll(".delete-button").forEach(button => {
    button.addEventListener("click", () => {
      const key = button.dataset.date;
      if (!confirm(`${formatSavedDate(key)} 기록을 삭제할까요?`)) return;

      const updated = loadAll();
      delete updated[key];
      saveAll(updated);
      renderHistory();

      if (key === localDateKey()) loadToday();
    });
  });
}

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const data = loadAll();
  const key = localDateKey();

  data[key] = {
    emotion: emotionEl.value.trim(),
    fun: funEl.value.trim(),
    gratitude: gratitudeEl.value.trim(),
    updatedAt: new Date().toISOString()
  };

  saveAll(data);

  saveStatus.textContent = "오늘 기록이 저장됐어요.";
  setTimeout(() => saveStatus.textContent = "", 2200);
});

exportBtn.addEventListener("click", () => {
  const data = loadAll();
  const payload = {
    app: "오늘의 세 가지",
    version: 1,
    exportedAt: new Date().toISOString(),
    records: data
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json"
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const date = localDateKey();
  a.href = url;
  a.download = `오늘의_세가지_백업_${date}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();

  setTimeout(() => URL.revokeObjectURL(url), 1000);

  backupStatus.textContent = "백업 파일을 저장했어요.";
  setTimeout(() => backupStatus.textContent = "", 2500);
});

importBtn.addEventListener("click", () => importFile.click());

importFile.addEventListener("change", async () => {
  const file = importFile.files?.[0];
  if (!file) return;

  try {
    const text = await file.text();
    const parsed = JSON.parse(text);

    const records = parsed?.records ?? parsed;

    if (!isValidBackup(records)) {
      throw new Error("올바른 백업 형식이 아닙니다.");
    }

    const current = loadAll();
    const currentCount = Object.keys(current).length;
    const importCount = Object.keys(records).length;

    const ok = confirm(
      `백업 기록 ${importCount}개를 불러옵니다.\n` +
      `같은 날짜의 기존 기록은 백업 내용으로 바뀝니다.\n\n계속할까요?`
    );
    if (!ok) return;

    const merged = { ...current, ...records };
    saveAll(merged);

    loadToday();
    renderHistory();

    backupStatus.textContent =
      `복원 완료: ${importCount}개 기록을 불러왔어요.`;
  } catch (err) {
    backupStatus.textContent =
      "백업 파일을 읽지 못했어요. 이 앱에서 만든 JSON 파일인지 확인해주세요.";
  } finally {
    importFile.value = "";
    setTimeout(() => backupStatus.textContent = "", 3500);
  }
});

historyBtn.addEventListener("click", showHistory);
backBtn.addEventListener("click", showEditor);

todayEl.textContent = formatKoreanDate();
loadToday();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  });
}
