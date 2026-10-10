"use strict";
// ================= SETUP =================
const KEY = "habitData", TKEY = "yawmTimer";   // same KEY as before, so your old data stays
const PRAYERS = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];
const SEED = [
  { id: "h1", name: "Quran reading", time: "06:00" },
  { id: "h2", name: "Exercise", time: "17:30" },
  { id: "h3", name: "Read 10 pages", time: "21:00" }
];
const QUOTES = [
  { ar: "فَإِنَّ مَعَ الْعُسْرِ يُسْرًا", en: "Indeed, with hardship comes ease.", ref: "Quran 94:5" },
  { ar: "أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ", en: "Truly, in the remembrance of Allah do hearts find rest.", ref: "Quran 13:28" },
  { ar: "لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا", en: "Allah does not burden a soul beyond what it can bear.", ref: "Quran 2:286" },
  { ar: "وَمَن يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ", en: "Whoever relies on Allah, He is enough for them.", ref: "Quran 65:3" },
  { ar: "إِنَّ اللَّهَ مَعَ الصَّابِرِينَ", en: "Indeed, Allah is with the patient.", ref: "Quran 2:153" },
  { ar: "وَأَن لَّيْسَ لِلْإِنسَانِ إِلَّا مَا سَعَىٰ", en: "And that a person will have only what they strive for.", ref: "Quran 53:39" },
  { ar: "إِنَّ اللَّهَ لَا يُغَيِّرُ مَا بِقَوْمٍ حَتَّىٰ يُغَيِّرُوا مَا بِأَنفُسِهِمْ", en: "Allah does not change the condition of a people until they change what is within themselves.", ref: "Quran 13:11" },
  { ar: "لَا تَقْنَطُوا مِن رَّحْمَةِ اللَّهِ", en: "Do not despair of the mercy of Allah.", ref: "Quran 39:53" },
  { ar: "فَاذْكُرُونِي أَذْكُرْكُمْ", en: "So remember Me; I will remember you.", ref: "Quran 2:152" },
  { ar: "رَبِّ اشْرَحْ لِي صَدْرِي وَيَسِّرْ لِي أَمْرِي", en: "My Lord, expand my chest for me and ease my task for me.", ref: "Quran 20:25-26" },
  { ar: "وَلَا تَهِنُوا وَلَا تَحْزَنُوا وَأَنتُمُ الْأَعْلَوْنَ إِن كُنتُم مُّؤْمِنِينَ", en: "Do not weaken and do not grieve, for you will be superior if you are true believers.", ref: "Quran 3:139" },
  { ar: "وَلَسَوْفَ يُعْطِيكَ رَبُّكَ فَتَرْضَىٰ", en: "And your Lord is going to give you, and you will be satisfied.", ref: "Quran 93:5" },
  { ar: "وَاسْتَعِينُوا بِالصَّبْرِ وَالصَّلَاةِ", en: "And seek help through patience and prayer.", ref: "Quran 2:45" },
  { ar: "وَالَّذِينَ جَاهَدُوا فِينَا لَنَهْدِيَنَّهُمْ سُبُلَنَا", en: "Those who strive for Us, We will surely guide them to Our ways.", ref: "Quran 29:69" },
  { ar: "أَحَبُّ الْأَعْمَالِ إِلَى اللَّهِ أَدْوَمُهَا وَإِنْ قَلَّ", en: "The most beloved deeds to Allah are the most consistent, even if small.", ref: "Hadith, Bukhari & Muslim" }
];
const $ = id => document.getElementById(id);
const pad = n => String(n).padStart(2, "0");

// ================= DATA =================
function fresh() { return normalize({}); }
function normalize(o) {
  const d = Object.assign({ v: 2, days: {}, weeks: {}, months: {}, habits: null, settings: {}, sleep: {}, money: [] }, o || {});
  d.v = 2;
  if (!d.sleep || typeof d.sleep !== "object" || Array.isArray(d.sleep)) d.sleep = {};
  if (!Array.isArray(d.money)) d.money = [];
  if (!Array.isArray(d.habits)) d.habits = JSON.parse(JSON.stringify(SEED));
  d.settings = Object.assign({ lang: "en-IN", times: {}, currency: "₹" }, d.settings);
  if (!d.settings.times) d.settings.times = {};
  return d;
}
function load() {
  const raw = localStorage.getItem(KEY);
  try { const p = JSON.parse(raw); if (p && !p.v) { try { localStorage.setItem(KEY + "_pre_v2", raw); } catch (e) {} } return normalize(p); }
  catch (e) { try { if (raw) localStorage.setItem(KEY + "_corrupt", raw); } catch (e2) {} return fresh(); }
}
let data = load();
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(data)); localStorage.setItem("yawmUpdated", Date.now()); const s = $("saveState"); if (s) s.textContent = "Saved " + new Date().toLocaleTimeString(); }
  catch (e) { toast("Could not save. Download a backup in More."); const s = $("saveState"); if (s) s.textContent = "NOT saved. Download a backup."; }
  if (window.yawmCloudPush) window.yawmCloudPush();
}
function toast(m) {
  const t = $("toast"); t.textContent = m; t.classList.add("show");
  clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove("show"), 2800);
}

// ================= DATES =================
const dateStr = d => d.toLocaleDateString("en-CA");
function mondayOf(d) { const x = new Date(d); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return dateStr(x); }
const today = dateStr(new Date()), weekKey = mondayOf(new Date()), monthKey = today.slice(0, 7);

function dayOf(k) {
  const d = data.days[k] || (data.days[k] = {});
  d.prayers = d.prayers || {}; d.tasks = d.tasks || []; d.notes = d.notes || "";
  d.habits = d.habits || {}; d.water = d.water || 0; d.mood = d.mood || 0; d.focus = d.focus || 0;
  return d;
}
function wk() { return data.weeks[weekKey] || (data.weeks[weekKey] = { goals: [], rating: "", improved: "", fix: "" }); }
function mo() { return data.months[monthKey] || (data.months[monthKey] = { goals: [], fix: "" }); }

function score(d) {
  if (!d) return 0;
  const tasks = d.tasks || [], pr = d.prayers || {}, hb = d.habits || {};
  const total = 5 + data.habits.length + tasks.length;
  const done = PRAYERS.filter(p => pr[p]).length + data.habits.filter(h => hb[h.id]).length + tasks.filter(t => t.done).length;
  return Math.round(done / total * 100);
}
function streak() {
  let n = 0; const d = new Date();
  if (score(data.days[dateStr(d)]) < 60) d.setDate(d.getDate() - 1);
  while (score(data.days[dateStr(d)]) >= 60) { n++; d.setDate(d.getDate() - 1); }
  return n;
}

// ================= HELPERS =================
function renderList(boxId, items) {
  const box = $(boxId); box.innerHTML = "";
  items.forEach((item, i) => {
    const li = document.createElement("li");
    const cb = document.createElement("input"); cb.type = "checkbox"; cb.checked = !!item.done;
    cb.onchange = () => { item.done = cb.checked; save(); render(); };
    const sp = document.createElement("span"); sp.textContent = item.text; if (item.done) sp.className = "strike";
    const x = document.createElement("button"); x.className = "x"; x.textContent = "✕";
    x.onclick = () => { items.splice(i, 1); save(); render(); };
    li.append(cb, sp, x); box.append(li);
  });
}
function addItem(inputId, items) {
  const el = $(inputId), t = el.value.trim();
  if (!t) return;
  items.push({ text: t, done: false }); el.value = ""; save(); render();
}
function bindText(id, obj, field) {
  const el = $(id); el.value = obj[field] || "";
  el.oninput = () => { obj[field] = el.value; save(); };
}

// ================= TODAY =================
function renderPrayers(d) {
  const box = $("prayers"); box.innerHTML = "";
  PRAYERS.forEach(p => {
    const l = document.createElement("label"); l.className = "chip" + (d.prayers[p] ? " done" : "");
    l.style.margin = "4px 6px 4px 0";
    const cb = document.createElement("input"); cb.type = "checkbox"; cb.checked = !!d.prayers[p];
    cb.onchange = () => { d.prayers[p] = cb.checked; save(); render(); };
    l.append(cb, p); box.append(l);
  });
  $("prayerCount").textContent = `(${PRAYERS.filter(p => d.prayers[p]).length}/5)`;
}
function renderHabits(d) {
  const box = $("habitList"); box.innerHTML = "";
  const now = new Date().toTimeString().slice(0, 5);
  data.habits.slice().sort((a, b) => (a.time || "99").localeCompare(b.time || "99")).forEach(h => {
    const li = document.createElement("li");
    if (h.time && h.time <= now && !d.habits[h.id]) li.className = "due";
    const cb = document.createElement("input"); cb.type = "checkbox"; cb.checked = !!d.habits[h.id];
    cb.onchange = () => { d.habits[h.id] = cb.checked; save(); render(); };
    const sp = document.createElement("span"); sp.textContent = h.name; if (d.habits[h.id]) sp.className = "strike";
    li.append(cb, sp);
    if (h.time) { const em = document.createElement("em"); em.textContent = h.time; li.append(em); }
    const x = document.createElement("button"); x.className = "x"; x.textContent = "✕";
    x.onclick = () => { if (confirm("Delete habit '" + h.name + "'?")) { data.habits = data.habits.filter(z => z.id !== h.id); save(); render(); } };
    li.append(x); box.append(li);
  });
}
function renderNext(d) {
  const now = new Date().toTimeString().slice(0, 5), L = [];
  PRAYERS.forEach(p => { const t = data.settings.times[p]; if (t && !d.prayers[p]) L.push([t, p]); });
  data.habits.forEach(h => { if (h.time && !d.habits[h.id]) L.push([h.time, h.name]); });
  L.sort((a, b) => a[0].localeCompare(b[0]));
  const nx = L.find(x => x[0] >= now);
  $("nextUp").textContent = nx ? `Next: ${nx[1]} at ${nx[0]}` : L.length ? `Overdue: ${L[0][1]} (${L[0][0]})` : "Nothing timed is pending.";
}
function renderScore() {
  const p = score(data.days[today]);
  $("pct").textContent = p; $("ring").style.strokeDashoffset = 327 * (1 - p / 100);
  const n = streak(); $("streak").textContent = n ? `🔥 ${n} day${n > 1 ? "s" : ""}` : "";
}
let qOff = 0;
function renderQuote() {
  const n = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 864e5);
  const q = QUOTES[(n + qOff) % QUOTES.length];
  $("qAr").textContent = q.ar; $("qEn").textContent = q.en; $("qRef").textContent = q.ref;
}

// ================= WEEK / MONTH =================
function renderWeek() {
  const w = wk(); renderList("weekGoals", w.goals);
  bindText("rating", w, "rating"); bindText("improved", w, "improved"); bindText("fix", w, "fix");
  const s = new Date(weekKey + "T00:00:00"), bars = $("weekBars"); bars.innerHTML = "";
  let pr = 0, td = 0, hd = 0, fc = 0;
  for (let i = 0; i < 7; i++) {
    const x = new Date(s); x.setDate(s.getDate() + i);
    const d = data.days[dateStr(x)];
    if (d) {
      pr += PRAYERS.filter(p => d.prayers && d.prayers[p]).length;
      td += (d.tasks || []).filter(t => t.done).length;
      hd += data.habits.filter(h => d.habits && d.habits[h.id]).length;
      fc += d.focus || 0;
    }
    const c = document.createElement("div"); c.className = "bc";
    c.innerHTML = `<i style="height:${Math.max(score(d), 4)}%"></i><span>${"MTWTFSS"[i]}</span>`;
    bars.append(c);
  }
  $("weekStats").textContent = `Prayers ${pr}/35 · Habits ${hd} · Tasks ${td} · Focus ${fc}`;
}
function renderMonth() {
  const m = mo(); renderList("monthGoals", m.goals); bindText("monthFix", m, "fix");
  let fc = 0; Object.keys(data.days).forEach(k => { if (k.startsWith(monthKey)) fc += data.days[k].focus || 0; });
  const done = m.goals.filter(g => g.done).length;
  $("monthStats").textContent = `Goals done ${done}/${m.goals.length} · Focus sessions ${fc}`;
}

// ================= RENDER ALL =================
function render() {
  const hr = new Date().getHours(); $("date").textContent = (hr < 12 ? "Good morning" : hr < 18 ? "Good afternoon" : "Good evening") + " · " + new Date().toDateString();
  const d = dayOf(today);
  renderPrayers(d); renderHabits(d); renderList("taskList", d.tasks); bindText("notes", d, "notes");
  $("water").textContent = d.water;
  document.querySelectorAll("#moods button").forEach(b => b.classList.toggle("on", +b.dataset.m === d.mood));
  renderNext(d); renderScore(); renderQuote(); renderWeek(); renderMonth(); drawTimer(); renderTrack(); renderGlance(d);
}

// ================= BUTTONS =================
$("addTask").onclick = () => addItem("taskInput", dayOf(today).tasks);
$("addWeek").onclick = () => addItem("weekInput", wk().goals);
$("addMonth").onclick = () => addItem("monthInput", mo().goals);
$("addHabit").onclick = () => {
  const n = $("habitName").value.trim(); if (!n) return;
  data.habits.push({ id: "h" + Date.now(), name: n, time: $("habitTime").value });
  $("habitName").value = ""; $("habitTime").value = ""; save(); render();
};
$("qNext").onclick = () => { qOff++; renderQuote(); };
$("wPlus").onclick = () => { dayOf(today).water++; save(); render(); };
$("wMinus").onclick = () => { const d = dayOf(today); d.water = Math.max(0, d.water - 1); save(); render(); };
document.querySelectorAll("#moods button").forEach(b => b.onclick = () => { dayOf(today).mood = +b.dataset.m; save(); render(); });
document.querySelectorAll("nav button").forEach(b => b.onclick = () => {
  document.querySelectorAll(".page").forEach(s => s.classList.add("hidden"));
  $(b.dataset.tab).classList.remove("hidden");
  document.querySelectorAll("nav button").forEach(x => x.classList.remove("on"));
  b.classList.add("on"); window.scrollTo(0, 0);
});

// ================= MORE: SETTINGS + BACKUP =================
$("lang").value = data.settings.lang;
$("lang").onchange = () => { data.settings.lang = $("lang").value; save(); };
PRAYERS.forEach(p => {
  const l = document.createElement("label"); l.className = "tl"; l.textContent = p;
  const i = document.createElement("input"); i.type = "time"; i.value = data.settings.times[p] || "";
  i.onchange = () => { data.settings.times[p] = i.value; save(); render(); };
  l.append(i); $("ptimes").append(l);
});
$("export").onclick = () => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
  a.download = "yawm-backup-" + today + ".json"; a.click();
};
$("import").onchange = e => {
  const f = e.target.files[0]; if (!f) return;
  const r = new FileReader();
  r.onload = () => {
    restore(r.result); e.target.value = "";
  };
  r.readAsText(f);
};

// ================= VOICE (mic on every text box) =================
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
const MIC = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>';
let rec = null;
document.querySelectorAll("input[type=text],textarea").forEach(el => {
  const w = el.parentNode;
  if (el.tagName === "TEXTAREA") w.classList.add("ta");
  const b = document.createElement("button");
  b.type = "button"; b.className = "mic"; b.setAttribute("aria-label", "Speak"); b.innerHTML = MIC;
  b.onclick = () => listen(el, b); w.appendChild(b);
});
function listen(el, b) {
  if (!SR) { toast("Voice works in Chrome, Edge or Safari"); return; }
  if (rec) { rec.stop(); return; }
  rec = new SR(); rec.lang = data.settings.lang; rec.interimResults = false; rec.continuous = false;
  b.classList.add("on");
  rec.onresult = e => {
    const t = e.results[0][0].transcript.trim(); if (!t) return;
    el.value += (el.value && !/\s$/.test(el.value) ? " " : "") + t;
    el.dispatchEvent(new Event("input", { bubbles: true }));
    if (el.dataset.add) $(el.dataset.add).click();
  };
  rec.onerror = e => toast(e.error === "not-allowed" ? "Please allow the microphone" : "Voice: " + e.error);
  rec.onend = () => { b.classList.remove("on"); rec = null; };
  try { rec.start(); } catch (err) { b.classList.remove("on"); rec = null; }
}

// ================= FOCUS TIMER =================
const MODES = { focus: ["Focus", 25], short: ["Short break", 5], long: ["Long break", 15], urge: ["Urge reset", 5] };
let T;
try { T = JSON.parse(localStorage.getItem(TKEY)); } catch (e) { T = null; }
if (!T || !MODES[T.mode]) T = { mode: "focus", left: 1500, end: 0, running: false };
function saveTimer() { try { localStorage.setItem(TKEY, JSON.stringify(T)); } catch (e) {} }
function remaining() { return T.running ? Math.max(0, Math.round((T.end - Date.now()) / 1000)) : T.left; }
function setMode(m) { T = { mode: m, left: MODES[m][1] * 60, end: 0, running: false }; saveTimer(); releaseLock(); drawTimer(); }
function drawTimer() {
  const r = remaining(), tot = MODES[T.mode][1] * 60;
  $("tTime").textContent = pad(Math.floor(r / 60)) + ":" + pad(r % 60);
  $("tLabel").textContent = MODES[T.mode][0].toUpperCase();
  $("tRing").style.strokeDashoffset = 327 * (1 - r / tot);
  $("tGo").textContent = T.running ? "Pause" : "Start";
  document.querySelectorAll(".modes button").forEach(b => b.classList.toggle("on", b.dataset.m === T.mode));
  const f = dayOf(today).focus; $("fStats").textContent = `Today: ${f} focus session${f === 1 ? "" : "s"} · ${f * 25} min`;
}
$("tGo").onclick = () => {
  if (T.running) { T.left = remaining(); T.running = false; releaseLock(); }
  else { T.end = Date.now() + T.left * 1000; T.running = true; lockScreen(); }
  saveTimer(); drawTimer();
};
$("tReset").onclick = () => setMode(T.mode);
$("tSkip").onclick = () => setMode(T.mode === "focus" ? "short" : "focus");
document.querySelectorAll(".modes button").forEach(b => b.onclick = () => setMode(b.dataset.m));
$("urge").onclick = () => {
  setMode("urge"); $("tGo").click();
  document.querySelector('nav button[data-tab="focus"]').click();
  toast("5 minutes. No scrolling. Try wudu, 10 pushups or 1 page.");
};
function finish() {
  const m = T.mode; beep(); if (navigator.vibrate) navigator.vibrate([300, 150, 300]);
  if (m === "focus") { const d = dayOf(today); d.focus++; save(); toast("Focus session done! Take a break."); setMode(d.focus % 4 === 0 ? "long" : "short"); }
  else { toast("Break over. Ready to focus?"); setMode("focus"); }
}
function beep() {
  try {
    const c = new (window.AudioContext || window.webkitAudioContext)(), o = c.createOscillator(), g = c.createGain();
    o.connect(g); g.connect(c.destination); o.frequency.value = 880; g.gain.value = .2; o.start(); o.stop(c.currentTime + .6);
  } catch (e) {}
}
let wl = null;
async function lockScreen() { try { if (navigator.wakeLock) wl = await navigator.wakeLock.request("screen"); } catch (e) {} }
function releaseLock() { try { if (wl) { wl.release(); wl = null; } } catch (e) {} }
setInterval(() => { if (T.running && remaining() <= 0) { finish(); render(); } else if (T.running) drawTimer(); }, 500);

// ================= SAFETY FOR MOBILE =================
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") save();
  else {
    if (dateStr(new Date()) !== today) { location.reload(); return; }
    if (T.running) lockScreen();
    render();
  }
});
window.addEventListener("pagehide", save);
if (navigator.storage && navigator.storage.persist) navigator.storage.persist();

// ================= SAFE RESTORE =================
function mergeData(cur, inc) {
  const o = JSON.parse(JSON.stringify(cur));
  ["days", "weeks", "months", "sleep"].forEach(k => { o[k] = Object.assign({}, inc[k] || {}, cur[k] || {}); });
  const hid = new Set(o.habits.map(h => h.id)); (inc.habits || []).forEach(h => { if (!hid.has(h.id)) o.habits.push(h); });
  const mid = new Set(o.money.map(t => t.id)); (inc.money || []).forEach(t => { if (!mid.has(t.id)) o.money.push(t); });
  return o;
}
function restore(text) {
  let inc; try { inc = JSON.parse(text); } catch (e) { return toast("That file is not a valid backup"); }
  if (!inc || !inc.days || !inc.weeks || !inc.months || typeof inc.days !== "object") return toast("This does not look like a Yawm backup");
  inc = normalize(inc);
  try { localStorage.setItem(KEY + "_before_restore", JSON.stringify(data)); }
  catch (e) { return toast("No space for a safety copy. Restore cancelled."); }
  if (confirm("Merge this backup into your current data?\nOK = Merge (nothing is deleted)\nCancel = more options")) data = mergeData(data, inc);
  else if (confirm("Replace ALL current data with this backup? A safety copy of your current data was kept on this device.")) data = inc;
  else return toast("Restore cancelled. Nothing changed.");
  save(); render(); toast("Backup restored");
}

// ================= TRACK: SLEEP + MONEY =================
const CATS = ["Food", "Transport", "Shopping", "Education", "Gym & health", "Subscriptions", "Business tools", "Marketing", "Equipment", "Other business", "Other personal", "Income"];
CATS.forEach(c => { const o = document.createElement("option"); o.textContent = c; $("mCat").append(o); });
$("slDate").value = today; $("mDate").value = today; $("mCur").value = data.settings.currency;
const hm = m => Math.floor(m / 60) + "h " + pad(m % 60) + "m";
function sleepMin(b, w) {          // works across midnight; same time = invalid (0)
  if (!b || !w) return 0;
  const [bh, bm] = b.split(":").map(Number), [wh, wm] = w.split(":").map(Number);
  let m = (wh * 60 + wm) - (bh * 60 + bm); if (m <= 0) m += 1440;
  return m >= 1440 ? 0 : m;
}
const delBtn = fn => { const x = document.createElement("button"); x.className = "x"; x.textContent = "✕"; x.setAttribute("aria-label", "Delete"); x.onclick = fn; return x; };
$("slSave").onclick = () => {
  const m = sleepMin($("slBed").value, $("slWake").value);
  if (!m) return toast("Enter different bedtime and wake-up times");
  const k = $("slDate").value || today;
  if (data.sleep[k] && !confirm("A sleep record for " + k + " exists. Replace it?")) return;
  data.sleep[k] = { bed: $("slBed").value, wake: $("slWake").value, q: $("slQ").value, note: $("slNote").value.trim(), min: m };
  $("slNote").value = ""; save(); render(); toast("Sleep saved");
};
$("mSave").onclick = () => {
  const a = parseFloat($("mAmt").value);
  if (!(a > 0)) return toast("Enter an amount above 0");
  data.money.push({ id: "t" + Date.now(), date: $("mDate").value || today, type: $("mType").value, amt: Math.round(a * 100) / 100, cat: $("mCat").value, cls: $("mCls").value, pay: $("mPay").value, desc: $("mDesc").value.trim() });
  $("mAmt").value = ""; $("mDesc").value = ""; save(); render(); toast("Saved");
};
$("mCur").onchange = () => { data.settings.currency = $("mCur").value; save(); render(); };
$("mCsv").onclick = () => {
  const q = v => { let s = String(v); if (/^[=+\-@]/.test(s)) s = "'" + s; return '"' + s.replace(/"/g, '""') + '"'; };
  const rows = [["Date", "Type", "Amount", "Category", "Class", "Payment", "Description"]].concat(data.money.map(t => [t.date, t.type, t.amt, t.cat, t.cls, t.pay, t.desc]));
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([rows.map(r => r.map(q).join(",")).join("\n")], { type: "text/csv" }));
  a.download = "yawm-money-" + today + ".csv"; a.click();
};
function renderTrack() {
  const keys = Object.keys(data.sleep).sort().reverse().slice(0, 7), L = $("slList"); L.innerHTML = "";
  keys.forEach(k => {
    const s = data.sleep[k], li = document.createElement("li"), sp = document.createElement("span");
    sp.textContent = `${k} · ${hm(s.min)}${s.q ? " · " + s.q + "/5" : ""}`;
    sp.onclick = () => { $("slDate").value = k; $("slBed").value = s.bed; $("slWake").value = s.wake; $("slQ").value = s.q || ""; $("slNote").value = s.note || ""; toast("Loaded. Change it, then tap Save."); };
    li.append(sp, delBtn(() => { if (confirm("Delete sleep record for " + k + "?")) { delete data.sleep[k]; save(); render(); } }));
    L.append(li);
  });
  $("slSum").textContent = keys.length ? `Average of your last ${keys.length} recorded night${keys.length > 1 ? "s" : ""}: ${hm(Math.round(keys.reduce((a, k) => a + data.sleep[k].min, 0) / keys.length))}. Tap a record to correct it.` : "No sleep recorded yet.";

  const cur = data.settings.currency, mt = data.money.filter(t => t.date.startsWith(monthKey));
  const sum = (a, f) => a.filter(f).reduce((s, t) => s + t.amt, 0);
  const inc = sum(mt, t => t.type === "Income"), exp = sum(mt, t => t.type === "Expense"), biz = sum(mt, t => t.type === "Expense" && t.cls === "Business");
  const tdy = sum(data.money, t => t.date === today && t.type === "Expense");
  $("mSum").textContent = `This month: income ${cur}${inc.toFixed(2)} · spent ${cur}${exp.toFixed(2)} (business ${cur}${biz.toFixed(2)}) · net ${cur}${(inc - exp).toFixed(2)}. Today spent ${cur}${tdy.toFixed(2)}.`;
  const by = {}; mt.filter(t => t.type === "Expense").forEach(t => by[t.cat] = (by[t.cat] || 0) + t.amt);
  const box = $("mCats"); box.innerHTML = ""; const top = Math.max(1, ...Object.values(by));
  Object.entries(by).sort((a, b) => b[1] - a[1]).forEach(([c, v]) => {
    const r = document.createElement("div"); r.className = "cr"; r.innerHTML = "<span></span><i></i><b></b>";
    r.children[0].textContent = c; r.children[1].style.width = (v / top * 100) + "%"; r.children[2].textContent = cur + v.toFixed(0); box.append(r);
  });
  const ML = $("mList"); ML.innerHTML = "";
  mt.slice().reverse().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 30).forEach(t => {
    const li = document.createElement("li"), sp = document.createElement("span"), em = document.createElement("em");
    sp.textContent = `${t.date.slice(5)} · ${t.cat} · ${t.cls}${t.desc ? " · " + t.desc : ""}`;
    em.textContent = (t.type === "Income" ? "+" : "-") + cur + t.amt.toFixed(2);
    li.append(sp, em, delBtn(() => { if (confirm("Delete this transaction?")) { data.money = data.money.filter(z => z.id !== t.id); save(); render(); } }));
    ML.append(li);
  });
}
function renderGlance(d) {
  const s = data.sleep[today]; $("gSleep").textContent = s ? hm(s.min) : "—";
  $("gSpent").textContent = data.settings.currency + data.money.filter(t => t.date === today && t.type === "Expense").reduce((a, t) => a + t.amt, 0).toFixed(0);
  $("gFocus").textContent = d.focus;
}

// hooks used by cloud.js
window.yawmGet = () => data;
window.yawmSet = (o, ts) => {
  data = normalize(o);
  try { localStorage.setItem(KEY, JSON.stringify(data)); localStorage.setItem("yawmUpdated", ts || Date.now()); } catch (e) {}
  render();
};

render();
