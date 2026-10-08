// ---------- 1. DATA (saved in your browser) ----------
const KEY = "habitData";
const PRAYERS = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];

function emptyData() { return { days: {}, weeks: {}, months: {} }; }

function load() {
  try { return Object.assign(emptyData(), JSON.parse(localStorage.getItem(KEY))); }
  catch { return emptyData(); }
}

let data = load();
function save() { localStorage.setItem(KEY, JSON.stringify(data)); }

// ---------- 2. DATES ----------
function dateStr(d) { return d.toLocaleDateString("en-CA"); }
function mondayOf(d) {
  const x = new Date(d);
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return dateStr(x);
}
const today = dateStr(new Date());
const weekKey = mondayOf(new Date());
const monthKey = today.slice(0, 7);

function getDay()   { return data.days[today]     ||= { prayers: {}, tasks: [], notes: "" }; }
function getWeek()  { return data.weeks[weekKey]  ||= { goals: [], rating: "", improved: "", fix: "" }; }
function getMonth() { return data.months[monthKey] ||= { goals: [], fix: "" }; }

// ---------- 3. REUSABLE HELPERS ----------
function renderList(boxId, items) {
  const box = document.getElementById(boxId);
  box.innerHTML = "";
  items.forEach((item, i) => {
    const li = document.createElement("li");

    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = item.done;
    cb.onchange = () => { item.done = cb.checked; save(); render(); };

    const span = document.createElement("span");
    span.textContent = item.text;
    if (item.done) span.className = "strike";

    const del = document.createElement("button");
    del.textContent = "✕";
    del.onclick = () => { items.splice(i, 1); save(); render(); };

    li.append(cb, span, del);
    box.append(li);
  });
}

function addItem(inputId, items) {
  const input = document.getElementById(inputId);
  const text = input.value.trim();
  if (!text) return;
  items.push({ text, done: false });
  input.value = "";
  save();
  render();
}

function bindText(id, obj, field) {
  const el = document.getElementById(id);
  el.value = obj[field] || "";
  el.oninput = () => { obj[field] = el.value; save(); };
}

// ---------- 4. PRAYERS ----------
function renderPrayers() {
  const day = getDay();
  const box = document.getElementById("prayers");
  box.innerHTML = "";
  PRAYERS.forEach(name => {
    const label = document.createElement("label");
    label.className = "chip" + (day.prayers[name] ? " done" : "");
    label.style.fontWeight = "normal";
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = !!day.prayers[name];
    cb.onchange = () => { day.prayers[name] = cb.checked; save(); renderPrayers(); renderWeekStats(); };
    label.append(cb, " " + name);
    box.append(label);
  });
  const done = PRAYERS.filter(p => day.prayers[p]).length;
  document.getElementById("prayerCount").textContent = `(${done}/5)`;
}

// ---------- 5. WEEKLY STATS ----------
function renderWeekStats() {
  let prayers = 0, tasksDone = 0, tasksTotal = 0;
  const start = new Date(weekKey + "T00:00:00");
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const day = data.days[dateStr(d)];
    if (!day) continue;
    prayers += PRAYERS.filter(p => day.prayers[p]).length;
    tasksTotal += day.tasks.length;
    tasksDone += day.tasks.filter(t => t.done).length;
  }
  document.getElementById("weekStats").textContent =
    `Prayers: ${prayers}/35  ·  Tasks done: ${tasksDone}/${tasksTotal}`;
}

// ---------- 6. DRAW EVERYTHING ----------
function render() {
  document.getElementById("todayDate").textContent = new Date().toDateString();
  renderPrayers();
  renderList("taskList", getDay().tasks);
  bindText("notes", getDay(), "notes");

  const w = getWeek();
  renderList("weekGoals", w.goals);
  bindText("rating", w, "rating");
  bindText("improved", w, "improved");
  bindText("fix", w, "fix");
  renderWeekStats();

  const m = getMonth();
  renderList("monthGoals", m.goals);
  bindText("monthFix", m, "fix");
}

// ---------- 7. BUTTONS ----------
document.getElementById("addTask").onclick  = () => addItem("taskInput",  getDay().tasks);
document.getElementById("addWeek").onclick  = () => addItem("weekInput",  getWeek().goals);
document.getElementById("addMonth").onclick = () => addItem("monthInput", getMonth().goals);

document.querySelectorAll("nav button").forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll("main section").forEach(s => s.classList.add("hidden"));
    document.getElementById(btn.dataset.tab).classList.remove("hidden");
    document.querySelectorAll("nav button").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
  };
});

// ---------- 8. VOICE NOTES ----------
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
const mic = document.getElementById("mic");

if (!SR) {
  mic.disabled = true;
  mic.textContent = "Voice not supported here (use Chrome)";
} else {
  const rec = new SR();
  rec.interimResults = false;
  let listening = false;

  rec.onresult = (e) => {
    const text = e.results[e.results.length - 1][0].transcript;
    const box = document.getElementById("notes");
    box.value += (box.value ? " " : "") + text;
    getDay().notes = box.value;
    save();
  };
  rec.onend = () => { listening = false; mic.textContent = "🎤 Start voice note"; };

  mic.onclick = () => {
    if (listening) { rec.stop(); return; }
    rec.lang = document.getElementById("lang").value;
    rec.start();
    listening = true;
    mic.textContent = "⏹ Listening... tap to stop";
  };
}

// ---------- 9. BACKUP ----------
document.getElementById("export").onclick = () => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "tracker-backup-" + today + ".json";
  a.click();
};

document.getElementById("import").onchange = (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      data = Object.assign(emptyData(), JSON.parse(reader.result));
      save();
      render();
      alert("Backup restored!");
    } catch { alert("That file is not a valid backup."); }
  };
  reader.readAsText(file);
};

render();
