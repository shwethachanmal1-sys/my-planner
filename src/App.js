/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import { useState, useEffect, useRef } from "react";

// ─── Constants ────────────────────────────────────────────────────────────────
const DAYS_SHORT = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const DAYS_FULL = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const COLORS = {
  bg: "#0a0a12",
  card: "#12121e",
  border: "#1e1e32",
  pink: "#ff6b9d",
  purple: "#a855f7",
  blue: "#3b82f6",
  cyan: "#06b6d4",
  green: "#22c55e",
  yellow: "#eab308",
  orange: "#f97316",
  red: "#ef4444",
  teal: "#14b8a6",
  indigo: "#6366f1",
  text: "#f0f0ff",
  muted: "#6b7280",
  dim: "#374151",
};

const TAB_COLORS = {
  today: COLORS.cyan,
  office: COLORS.blue,
  personal: COLORS.pink,
  calendar: COLORS.purple,
  week: COLORS.orange,
  ideas: COLORS.yellow,
  learn: COLORS.green,
};

const DEFAULT_OFFICE_HABITS = [
  { id: "standup", label: "Daily Standup", icon: "🗣️" },
  { id: "emails", label: "Clear Inbox", icon: "📧" },
  { id: "focus", label: "2hr Deep Work Block", icon: "🎯" },
  { id: "review", label: "End-of-day Review", icon: "✅" },
];
const DEFAULT_PERSONAL_HABITS = [
  { id: "workout", label: "20 min Workout", icon: "🏋️" },
  { id: "water", label: "Drink 8 Glasses", icon: "💧" },
  { id: "meditate", label: "Meditate / Breathe", icon: "🧘" },
  { id: "reading", label: "Read 20 pages", icon: "📖" },
];

const JOURNAL_PROMPTS = [
  { id: "best", label: "Best part of today", icon: "✨", color: COLORS.yellow },
  { id: "achieve", label: "What I achieved today", icon: "🏆", color: COLORS.green },
  { id: "productive", label: "Productive work done", icon: "⚡", color: COLORS.cyan },
  { id: "improve", label: "What needs improvement", icon: "🔧", color: COLORS.orange },
  { id: "pending", label: "Pending tasks completed", icon: "✅", color: COLORS.teal },
  { id: "grateful", label: "Grateful for…", icon: "🙏", color: COLORS.pink },
];

const SAMPLE_BOOKS = [
  { id: "atomic", title: "Atomic Habits", author: "James Clear", emoji: "⚛️" },
  { id: "deepwork", title: "Deep Work", author: "Cal Newport", emoji: "🎯" },
  { id: "mindset", title: "Mindset", author: "Carol Dweck", emoji: "🧠" },
  { id: "ikigai", title: "Ikigai", author: "Héctor García", emoji: "🌸" },
  { id: "stoic", title: "Meditations", author: "Marcus Aurelius", emoji: "🏛️" },
  { id: "pnow", title: "The Power of Now", author: "Eckhart Tolle", emoji: "🌅" },
];

const DEFAULT_REMINDERS = [
  { id: "water1", label: "Drink Water 💧", time: "09:00", enabled: true, repeat: "daily" },
  { id: "water2", label: "Drink Water 💧", time: "12:00", enabled: true, repeat: "daily" },
  { id: "water3", label: "Drink Water 💧", time: "15:00", enabled: true, repeat: "daily" },
  { id: "water4", label: "Drink Water 💧", time: "18:00", enabled: true, repeat: "daily" },
  { id: "stretch", label: "Stretch Break 🤸", time: "11:00", enabled: true, repeat: "daily" },
  { id: "workout", label: "Workout Time 🏋️", time: "07:00", enabled: true, repeat: "daily" },
];

// ─── Storage helpers ──────────────────────────────────────────────────────────
function dateKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
function weekKey(d = new Date()) {
  const day = d.getDay();
  const mon = new Date(d); mon.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  return `week-${dateKey(mon)}`;
}
function yearKey(d = new Date()) { return d.getFullYear(); }

function load(key, fb) {
  try { const v = localStorage.getItem(key); return v !== null ? JSON.parse(v) : fb; }
  catch { return fb; }
}
function save(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} }

function getDayData(dk) {
  return load(`planner_day_${dk}`, {
    officeHabits: {}, personalHabits: {}, pages: 0,
    officeTodos: [], personalTodos: [], journal: {},
    achievements: [], ideas: [], goals: [],
  });
}
function saveDayData(dk, data) { save(`planner_day_${dk}`, data); }

// ─── Notification helpers ─────────────────────────────────────────────────────
function requestNotifPerms() {
  if ("Notification" in window && Notification.permission === "default") {
    Notification.requestPermission();
  }
}
function sendNotif(title, body) {
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification(title, { body, icon: "🔔" });
  }
}

// ─── Alarm sound (web audio) ─────────────────────────────────────────────────
function playAlarm(type = "bell") {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const freqs = type === "bell" ? [523, 659, 784, 1046] : [440, 480, 440, 480];
    freqs.forEach((f, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = f;
      osc.type = type === "bell" ? "sine" : "square";
      gain.gain.setValueAtTime(0.3, ctx.currentTime + i * 0.25);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.25 + 0.4);
      osc.start(ctx.currentTime + i * 0.25);
      osc.stop(ctx.currentTime + i * 0.25 + 0.5);
    });
  } catch {}
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const G = {
  card: { background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 14 },
  inp: { background: "#0d0d1a", border: `1px solid ${COLORS.border}`, borderRadius: 9, padding: "10px 14px", color: COLORS.text, fontFamily: "inherit", fontSize: 14, outline: "none", width: "100%", boxSizing: "border-box" },
  label: { fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: COLORS.muted },
};

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const todayDK = dateKey();
  const todayWK = weekKey();
  const now = new Date();

  const [tab, setTab] = useState("today");
  const [workspaceTab, setWorkspaceTab] = useState("office"); // office|personal under today
  const [dayData, setDayData] = useState(() => getDayData(todayDK));
  const [goals, setGoals] = useState(() => load("planner_goals_v2", []));
  const [reminders, setReminders] = useState(() => load("planner_reminders", DEFAULT_REMINDERS));
  const [alarms, setAlarms] = useState(() => load("planner_alarms", []));
  const [notification, setNotification] = useState(null); // { title, body, color }
  const [alarmFiring, setAlarmFiring] = useState(null);
  const [showAddReminder, setShowAddReminder] = useState(false);
  const [showAddAlarm, setShowAddAlarm] = useState(false);
  const [newRemLabel, setNewRemLabel] = useState("");
  const [newRemTime, setNewRemTime] = useState("08:00");
  const [newAlarmTime, setNewAlarmTime] = useState("07:00");
  const [newAlarmLabel, setNewAlarmLabel] = useState("");
  const [newTodo, setNewTodo] = useState("");
  const [newGoal, setNewGoal] = useState("");
  const [goalDeadline, setGoalDeadline] = useState("");
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [newIdea, setNewIdea] = useState("");
  const [newAchievement, setNewAchievement] = useState("");
  const [calViewDate, setCalViewDate] = useState(new Date());
  const [selectedCalDay, setSelectedCalDay] = useState(null);
  const [weekReview, setWeekReview] = useState(() => load(`planner_weekreview_${todayWK}`, { highlights: "", lowlights: "", nextWeek: "" }));
  const [learnView, setLearnView] = useState("home");
  const [activeBook, setActiveBook] = useState(null);
  const [insight, setInsight] = useState(null);
  const [insightLoading, setInsightLoading] = useState(false);
  const [savedInsights, setSavedInsights] = useState(() => load("planner_savedInsights", []));
  const [library, setLibrary] = useState(() => load("planner_library", SAMPLE_BOOKS));
  const [learnStreak, setLearnStreak] = useState(() => load("planner_learnStreak", 0));
  const [lastLearnDate, setLastLearnDate] = useState(() => load("planner_lastLearnDate", ""));
  const [cardFlipped, setCardFlipped] = useState(false);
  const tickRef = useRef(null);
  const [clockStr, setClockStr] = useState("");
  const [notifPermission, setNotifPermission] = useState(typeof Notification !== "undefined" ? Notification.permission : "denied");

  // Save day data on change
  useEffect(() => { saveDayData(todayDK, dayData); }, [dayData]);
  useEffect(() => { save("planner_goals_v2", goals); }, [goals]);
  useEffect(() => { save("planner_reminders", reminders); }, [reminders]);
  useEffect(() => { save("planner_alarms", alarms); }, [alarms]);
  useEffect(() => { save("planner_savedInsights", savedInsights); }, [savedInsights]);
  useEffect(() => { save(`planner_weekreview_${todayWK}`, weekReview); }, [weekReview]);

  // Clock + reminder/alarm tick
  useEffect(() => {
    function tick() {
      const n = new Date();
      setClockStr(n.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
      const hhmm = `${String(n.getHours()).padStart(2,"0")}:${String(n.getMinutes()).padStart(2,"0")}`;
      const ss = n.getSeconds();
      if (ss === 0) {
        // Check reminders
        reminders.forEach(r => {
          if (r.enabled && r.time === hhmm) {
            sendNotif(r.label, "Reminder from your Daily Planner");
            setNotification({ title: r.label, body: "Time for your reminder!", color: COLORS.cyan });
            playAlarm("bell");
            setTimeout(() => setNotification(null), 5000);
          }
        });
        // Check alarms
        alarms.forEach(a => {
          if (a.enabled && a.time === hhmm) {
            setAlarmFiring(a);
            playAlarm("alarm");
            sendNotif("⏰ " + (a.label || "Alarm"), "Your alarm is ringing!");
          }
        });
      }
    }
    tickRef.current = setInterval(tick, 1000);
    tick();
    return () => clearInterval(tickRef.current);
  }, [reminders, alarms]);

  // ── Day data helpers ─────────────────────────────────────────────────────
  function upd(fn) { setDayData(prev => { const next = fn({...prev}); return next; }); }
  function toggleOfficeHabit(id) { upd(d => { d.officeHabits = {...d.officeHabits, [id]: !d.officeHabits[id] }; return d; }); }
  function togglePersonalHabit(id) { upd(d => { d.personalHabits = {...d.personalHabits, [id]: !d.personalHabits[id] }; return d; }); }
  function setPages(v) { upd(d => { d.pages = v; return d; }); }
  function addTodo(type) {
    if (!newTodo.trim()) return;
    upd(d => { const k = type+"Todos"; d[k] = [...(d[k]||[]), { id: Date.now(), text: newTodo.trim(), done: false }]; return d; });
    setNewTodo("");
  }
  function toggleTodo(type, id) { upd(d => { const k = type+"Todos"; d[k] = d[k].map(t => t.id===id?{...t,done:!t.done}:t); return d; }); }
  function removeTodo(type, id) { upd(d => { const k = type+"Todos"; d[k] = d[k].filter(t => t.id!==id); return d; }); }
  function setJournalField(id, val) { upd(d => { d.journal = {...d.journal, [id]: val}; return d; }); }
  function addIdea() {
    if (!newIdea.trim()) return;
    upd(d => { d.ideas = [...(d.ideas||[]), { id: Date.now(), text: newIdea.trim(), ts: new Date().toISOString() }]; return d; });
    setNewIdea("");
  }
  function removeIdea(id) { upd(d => { d.ideas = d.ideas.filter(i => i.id!==id); return d; }); }
  function addAchievement() {
    if (!newAchievement.trim()) return;
    upd(d => { d.achievements = [...(d.achievements||[]), { id: Date.now(), text: newAchievement.trim() }]; return d; });
    setNewAchievement("");
  }
  function removeAchievement(id) { upd(d => { d.achievements = d.achievements.filter(a => a.id!==id); return d; }); }

  // ── Progress ──────────────────────────────────────────────────────────────
  const offDone = DEFAULT_OFFICE_HABITS.filter(h => dayData.officeHabits?.[h.id]).length;
  const persDone = DEFAULT_PERSONAL_HABITS.filter(h => dayData.personalHabits?.[h.id]).length;
  const todosDone = [...(dayData.officeTodos||[]), ...(dayData.personalTodos||[])].filter(t=>t.done).length;
  const todosTotal = [...(dayData.officeTodos||[]), ...(dayData.personalTodos||[])].length;
  const journalDone = JOURNAL_PROMPTS.filter(p => dayData.journal?.[p.id]?.trim()).length;
  const allComplete = offDone === DEFAULT_OFFICE_HABITS.length && persDone === DEFAULT_PERSONAL_HABITS.length && (todosTotal===0||todosDone===todosTotal) && journalDone === JOURNAL_PROMPTS.length;
  const progressPct = Math.round(((offDone + persDone + todosDone + journalDone) / (DEFAULT_OFFICE_HABITS.length + DEFAULT_PERSONAL_HABITS.length + Math.max(todosTotal,1) + JOURNAL_PROMPTS.length)) * 100);

  // ── Calendar helpers ──────────────────────────────────────────────────────
  function getDayColor(dk) {
    const d = getDayData(dk);
    const oH = DEFAULT_OFFICE_HABITS.filter(h => d.officeHabits?.[h.id]).length;
    const pH = DEFAULT_PERSONAL_HABITS.filter(h => d.personalHabits?.[h.id]).length;
    const total = DEFAULT_OFFICE_HABITS.length + DEFAULT_PERSONAL_HABITS.length;
    const done = oH + pH;
    if (done === 0) return null;
    if (done === total) return COLORS.green;
    if (done >= total * 0.6) return COLORS.yellow;
    return COLORS.orange;
  }

  function getWeekDays() {
    const arr = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(); d.setDate(d.getDate() - d.getDay() + i);
      arr.push({ date: d, dk: dateKey(d) });
    }
    return arr;
  }

  // ── Goals ─────────────────────────────────────────────────────────────────
  function addGoal() {
    if (!newGoal.trim()) return;
    setGoals(prev => [...prev, { id: Date.now(), text: newGoal.trim(), deadline: goalDeadline, done: false, created: todayDK }]);
    setNewGoal(""); setGoalDeadline(""); setShowAddGoal(false);
  }
  function toggleGoal(id) { setGoals(prev => prev.map(g => g.id===id?{...g,done:!g.done}:g)); }
  function removeGoal(id) { setGoals(prev => prev.filter(g => g.id!==id)); }

  // ── Reminders ─────────────────────────────────────────────────────────────
  function addReminder() {
    if (!newRemTime) return;
    const r = { id: Date.now().toString(), label: newRemLabel || "Reminder 🔔", time: newRemTime, enabled: true, repeat: "daily" };
    setReminders(prev => [...prev, r]);
    setNewRemLabel(""); setNewRemTime("08:00"); setShowAddReminder(false);
  }
  function toggleReminder(id) { setReminders(prev => prev.map(r => r.id===id?{...r,enabled:!r.enabled}:r)); }
  function removeReminder(id) { setReminders(prev => prev.filter(r => r.id!==id)); }

  // ── Alarms ────────────────────────────────────────────────────────────────
  function addAlarm() {
    if (!newAlarmTime) return;
    const a = { id: Date.now().toString(), label: newAlarmLabel || "Alarm ⏰", time: newAlarmTime, enabled: true };
    setAlarms(prev => [...prev, a]);
    setNewAlarmLabel(""); setNewAlarmTime("07:00"); setShowAddAlarm(false);
  }
  function toggleAlarm(id) { setAlarms(prev => prev.map(a => a.id===id?{...a,enabled:!a.enabled}:a)); }
  function removeAlarm(id) { setAlarms(prev => prev.filter(a => a.id!==id)); }

  // ── Learn ─────────────────────────────────────────────────────────────────
  async function fetchInsight(book) {
    setInsight(null); setCardFlipped(false); setInsightLoading(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514", max_tokens: 1000,
          messages: [{ role: "user", content: `Give me one powerful micro-learning insight from "${book.title}" by ${book.author}. Return ONLY valid JSON: { "headline": "punchy 6-8 word title", "insight": "2-3 sentence key idea", "action": "one concrete thing to do today", "quote": "short impactful quote under 20 words" }` }],
        }),
      });
      const data = await res.json();
      const text = data.content?.map(i=>i.text||"").join("") || "";
      setInsight(JSON.parse(text.replace(/```json|```/g,"").trim()));
      if (lastLearnDate !== todayDK) { setLearnStreak(s=>s+1); setLastLearnDate(todayDK); save("planner_learnStreak", learnStreak+1); save("planner_lastLearnDate", todayDK); }
    } catch { setInsight({ headline: "Try again", insight: "Could not load insight.", action: "", quote: "" }); }
    setInsightLoading(false);
  }
  function saveInsight() {
    if (!insight || !activeBook) return;
    setSavedInsights(prev => [{ ...insight, book: activeBook.title, date: todayDK, id: Date.now() }, ...prev.slice(0,49)]);
  }

  // ── Calendar render ───────────────────────────────────────────────────────
  function renderCalendar() {
    const yr = calViewDate.getFullYear(), mo = calViewDate.getMonth();
    const firstDay = new Date(yr, mo, 1).getDay();
    const daysInMonth = new Date(yr, mo+1, 0).getDate();
    const cells = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const dt = new Date(yr, mo, d);
      const dk = dateKey(dt);
      cells.push({ d, dk, isToday: dk === todayDK, color: getDayColor(dk) });
    }
    return cells;
  }

  // ── Week stats ────────────────────────────────────────────────────────────
  function getWeekStats() {
    return getWeekDays().map(({ date, dk }) => {
      const d = getDayData(dk);
      const oH = DEFAULT_OFFICE_HABITS.filter(h => d.officeHabits?.[h.id]).length;
      const pH = DEFAULT_PERSONAL_HABITS.filter(h => d.personalHabits?.[h.id]).length;
      const total = DEFAULT_OFFICE_HABITS.length + DEFAULT_PERSONAL_HABITS.length;
      return { date, dk, done: oH+pH, total, pct: Math.round(((oH+pH)/total)*100) };
    });
  }

  const activeGoals = goals.filter(g=>!g.done);
  const doneGoals = goals.filter(g=>g.done);
  const weekStats = getWeekStats();
  const calCells = renderCalendar();

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight:"100vh", background: COLORS.bg, fontFamily:"'Georgia','Times New Roman',serif", color: COLORS.text, paddingBottom: 100 }}>

      {/* Notification toast */}
      {notification && (
        <div style={{ position:"fixed", top:20, left:"50%", transform:"translateX(-50%)", zIndex:1000, background: COLORS.cyan, color:"#000", borderRadius:12, padding:"14px 24px", fontWeight:700, fontSize:14, boxShadow:"0 8px 32px rgba(6,182,212,0.4)", display:"flex", alignItems:"center", gap:10 }}>
          🔔 {notification.title}
        </div>
      )}

      {/* Alarm modal */}
      {alarmFiring && (
        <div style={{ position:"fixed", inset:0, zIndex:999, background:"rgba(0,0,0,0.85)", display:"flex", alignItems:"center", justifyContent:"center" }}>
          <div style={{ background: COLORS.card, border:`2px solid ${COLORS.yellow}`, borderRadius:20, padding:40, textAlign:"center", maxWidth:300 }}>
            <div style={{ fontSize:48, marginBottom:16, animation:"pulse 1s infinite" }}>⏰</div>
            <div style={{ fontSize:32, fontWeight:700, color: COLORS.yellow, marginBottom:8 }}>{alarmFiring.time}</div>
            <div style={{ fontSize:16, color: COLORS.text, marginBottom:24 }}>{alarmFiring.label}</div>
            <button onClick={() => setAlarmFiring(null)} style={{ background: COLORS.yellow, border:"none", borderRadius:10, padding:"12px 32px", fontFamily:"inherit", fontSize:16, fontWeight:700, cursor:"pointer", color:"#000" }}>Dismiss</button>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ background:`linear-gradient(135deg, #12082a 0%, #0a0a18 100%)`, borderBottom:`1px solid ${COLORS.border}`, padding:"20px 20px 16px", position:"sticky", top:0, zIndex:50 }}>
        <div style={{ maxWidth:520, margin:"0 auto" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
            <div>
              <div style={{ fontSize:11, letterSpacing:"0.2em", color: COLORS.muted, textTransform:"uppercase" }}>
                {DAYS_FULL[now.getDay()]} · Week {getWeekNumber(now)} · {now.getFullYear()}
              </div>
              <div style={{ fontSize:22, fontWeight:400, color: COLORS.text, letterSpacing:"-0.02em", marginTop:2 }}>
                {MONTHS[now.getMonth()]} {now.getDate()}, {now.getFullYear()}
              </div>
            </div>
            <div style={{ textAlign:"right" }}>
              <div style={{ fontSize:18, fontWeight:700, color: allComplete ? COLORS.green : COLORS.purple, fontVariantNumeric:"tabular-nums" }}>{clockStr}</div>
              <div style={{ display:"flex", alignItems:"center", gap:6, justifyContent:"flex-end", marginTop:4 }}>
                <div style={{ width:48, height:6, background: COLORS.border, borderRadius:3 }}>
                  <div style={{ height:"100%", width:`${progressPct}%`, background: allComplete ? COLORS.green : `linear-gradient(90deg,${COLORS.purple},${COLORS.cyan})`, borderRadius:3, transition:"width 0.5s" }} />
                </div>
                <span style={{ fontSize:12, color: allComplete ? COLORS.green : COLORS.purple, fontWeight:700 }}>{progressPct}%</span>
                {allComplete && <span style={{ fontSize:14 }}>🌟</span>}
              </div>
            </div>
          </div>

          {/* Week strip */}
          <div style={{ display:"flex", gap:6, marginTop:10 }}>
            {getWeekDays().map(({ date, dk }) => {
              const isToday = dk === todayDK;
              const col = getDayColor(dk);
              return (
                <div key={dk} style={{ flex:1, textAlign:"center" }}>
                  <div style={{ fontSize:9, color: isToday ? COLORS.cyan : COLORS.muted, marginBottom:3 }}>{DAYS_SHORT[date.getDay()]}</div>
                  <div style={{
                    width:"100%", paddingBottom:"100%", borderRadius:6, position:"relative",
                    background: col || (isToday ? "#1e1e3a" : COLORS.card),
                    border: `1px solid ${isToday ? COLORS.cyan : col || COLORS.border}`,
                    boxShadow: col === COLORS.green ? `0 0 8px ${COLORS.green}44` : "none",
                  }}>
                    <span style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight: isToday ? 700 : 400, color: col ? "#000" : isToday ? COLORS.cyan : COLORS.muted }}>
                      {date.getDate()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ maxWidth:520, margin:"0 auto", padding:"12px 16px 0" }}>
        <div style={{ display:"flex", gap:6, overflowX:"auto", paddingBottom:4 }}>
          {[
            { id:"today", label:"Today", icon:"☀️" },
            { id:"calendar", label:"Calendar", icon:"📅" },
            { id:"week", label:"Week", icon:"📊" },
            { id:"ideas", label:"Ideas", icon:"💡" },
            { id:"goals", label:"Goals", icon:"🎯" },
            { id:"reminders", label:"Reminders", icon:"🔔" },
            { id:"learn", label:"Learn", icon:"📚" },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              flexShrink:0, padding:"8px 14px", border:"none", borderRadius:20,
              background: tab===t.id ? TAB_COLORS[t.id]||COLORS.purple : COLORS.card,
              color: tab===t.id ? "#000" : COLORS.muted,
              fontFamily:"inherit", fontSize:12, fontWeight: tab===t.id ? 700 : 400,
              cursor:"pointer", transition:"all 0.2s", display:"flex", alignItems:"center", gap:5,
              boxShadow: tab===t.id ? `0 0 16px ${(TAB_COLORS[t.id]||COLORS.purple)}66` : "none",
            }}>
              <span>{t.icon}</span>{t.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth:520, margin:"0 auto", padding:"16px 16px 0" }}>

        {/* ══════════ TODAY TAB ══════════ */}
        {tab === "today" && (
          <div>
            {/* Office / Personal subtabs */}
            <div style={{ display:"flex", gap:8, marginBottom:16 }}>
              {["office","personal"].map(w => (
                <button key={w} onClick={() => setWorkspaceTab(w)} style={{
                  flex:1, padding:"10px", border:"none", borderRadius:10,
                  background: workspaceTab===w ? (w==="office"?COLORS.blue:COLORS.pink) : COLORS.card,
                  color: workspaceTab===w ? "#fff" : COLORS.muted,
                  fontFamily:"inherit", fontSize:13, fontWeight:700, cursor:"pointer", transition:"all 0.2s",
                  boxShadow: workspaceTab===w ? `0 0 20px ${w==="office"?COLORS.blue:COLORS.pink}55` : "none",
                }}>
                  {w === "office" ? "💼 Office" : "🏠 Personal"}
                </button>
              ))}
            </div>

            {workspaceTab === "office" && (
              <div>
                <ColorSection title="Office Habits" color={COLORS.blue}>
                  {DEFAULT_OFFICE_HABITS.map(h => (
                    <HabitRow key={h.id} habit={h} checked={!!dayData.officeHabits?.[h.id]} color={COLORS.blue} onToggle={() => toggleOfficeHabit(h.id)} />
                  ))}
                  <ProgressBar done={offDone} total={DEFAULT_OFFICE_HABITS.length} color={COLORS.blue} />
                </ColorSection>

                <ColorSection title="Office Tasks" color={COLORS.indigo}>
                  <TodoInput value={newTodo} onChange={setNewTodo} onAdd={() => addTodo("office")} color={COLORS.indigo} placeholder="Add office task…" />
                  <TodoList todos={dayData.officeTodos||[]} color={COLORS.indigo} onToggle={id=>toggleTodo("office",id)} onRemove={id=>removeTodo("office",id)} />
                </ColorSection>
              </div>
            )}

            {workspaceTab === "personal" && (
              <div>
                <ColorSection title="Personal Habits" color={COLORS.pink}>
                  {DEFAULT_PERSONAL_HABITS.map((h,i) => (
                    h.id === "reading" ? (
                      <div key={h.id} style={{ ...G.card, padding:"14px 16px", marginBottom:8, display:"flex", alignItems:"center", gap:12 }}>
                        <span style={{ fontSize:20 }}>{h.icon}</span>
                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:14, color: COLORS.text, marginBottom:6 }}>{h.label}</div>
                          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                            <CBtn onClick={() => setPages(Math.max(0,(dayData.pages||0)-1))} color={COLORS.pink}>−</CBtn>
                            <span style={{ fontSize:18, fontWeight:700, color: COLORS.pink, minWidth:24, textAlign:"center" }}>{dayData.pages||0}</span>
                            <CBtn onClick={() => setPages((dayData.pages||0)+1)} color={COLORS.pink}>+</CBtn>
                            <span style={{ fontSize:11, color: COLORS.muted }}>/ 20 goal</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <HabitRow key={h.id} habit={h} checked={!!dayData.personalHabits?.[h.id]} color={COLORS.pink} onToggle={() => togglePersonalHabit(h.id)} />
                    )
                  ))}
                  <ProgressBar done={persDone} total={DEFAULT_PERSONAL_HABITS.length} color={COLORS.pink} />
                </ColorSection>

                <ColorSection title="Personal Tasks" color={COLORS.teal}>
                  <TodoInput value={newTodo} onChange={setNewTodo} onAdd={() => addTodo("personal")} color={COLORS.teal} placeholder="Add personal task…" />
                  <TodoList todos={dayData.personalTodos||[]} color={COLORS.teal} onToggle={id=>toggleTodo("personal",id)} onRemove={id=>removeTodo("personal",id)} />
                </ColorSection>

                {/* Achievements */}
                <ColorSection title="🏆 Today's Achievements" color={COLORS.yellow}>
                  <div style={{ display:"flex", gap:8, marginBottom:10 }}>
                    <input value={newAchievement} onChange={e=>setNewAchievement(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addAchievement()} placeholder="What did you achieve today?" style={{ ...G.inp, flex:1 }} />
                    <button onClick={addAchievement} style={{ ...addBtnStyle(COLORS.yellow) }}>+</button>
                  </div>
                  {(dayData.achievements||[]).length === 0 && <div style={{ color: COLORS.dim, fontSize:13, textAlign:"center", padding:"10px 0" }}>Log your wins, big or small!</div>}
                  {(dayData.achievements||[]).map(a => (
                    <div key={a.id} style={{ display:"flex", alignItems:"flex-start", gap:10, marginBottom:8 }}>
                      <span style={{ color: COLORS.yellow, marginTop:2 }}>★</span>
                      <span style={{ flex:1, fontSize:14, color: COLORS.text }}>{a.text}</span>
                      <button onClick={()=>removeAchievement(a.id)} style={xBtn}>×</button>
                    </div>
                  ))}
                </ColorSection>
              </div>
            )}

            {/* Journal - always visible at bottom of today */}
            <ColorSection title="📔 Daily Journal" color={COLORS.purple}>
              {JOURNAL_PROMPTS.map(p => (
                <div key={p.id} style={{ marginBottom:12 }}>
                  <div style={{ fontSize:11, color:p.color, letterSpacing:"0.1em", marginBottom:6, display:"flex", alignItems:"center", gap:6 }}>
                    <span>{p.icon}</span>{p.label.toUpperCase()}
                  </div>
                  <textarea value={dayData.journal?.[p.id]||""} onChange={e=>setJournalField(p.id,e.target.value)}
                    placeholder={`Write here…`} rows={2}
                    style={{ ...G.inp, resize:"vertical", lineHeight:1.6 }}
                    onFocus={e=>e.target.style.borderColor=p.color}
                    onBlur={e=>e.target.style.borderColor=COLORS.border} />
                </div>
              ))}
              <div style={{ display:"flex", gap:8, alignItems:"center", justifyContent:"flex-end" }}>
                <span style={{ fontSize:12, color: COLORS.muted }}>{journalDone}/{JOURNAL_PROMPTS.length} filled</span>
                <div style={{ width:80, height:4, background: COLORS.border, borderRadius:2 }}>
                  <div style={{ height:"100%", width:`${(journalDone/JOURNAL_PROMPTS.length)*100}%`, background: COLORS.purple, borderRadius:2, transition:"width 0.3s" }} />
                </div>
              </div>
            </ColorSection>
          </div>
        )}

        {/* ══════════ CALENDAR TAB ══════════ */}
        {tab === "calendar" && (
          <div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
              <button onClick={()=>setCalViewDate(d=>{const n=new Date(d);n.setMonth(n.getMonth()-1);return n;})} style={navBtn}>‹</button>
              <div style={{ fontSize:18, color: COLORS.text }}>{MONTHS[calViewDate.getMonth()]} {calViewDate.getFullYear()}</div>
              <button onClick={()=>setCalViewDate(d=>{const n=new Date(d);n.setMonth(n.getMonth()+1);return n;})} style={navBtn}>›</button>
            </div>

            {/* Day headers */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:4, marginBottom:8 }}>
              {DAYS_SHORT.map(d => <div key={d} style={{ textAlign:"center", fontSize:10, color: COLORS.muted, letterSpacing:"0.1em" }}>{d}</div>)}
            </div>

            {/* Cells */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:4 }}>
              {calCells.map((cell, i) => !cell ? (
                <div key={`e${i}`} />
              ) : (
                <div key={cell.dk} onClick={()=>setSelectedCalDay(cell.dk===selectedCalDay?null:cell.dk)} style={{
                  aspectRatio:"1", borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:13, fontWeight: cell.isToday ? 700 : 400, cursor:"pointer",
                  background: cell.color || (cell.isToday ? "#1e1e3a" : COLORS.card),
                  border: `1px solid ${cell.dk===selectedCalDay ? COLORS.cyan : cell.isToday ? COLORS.purple : COLORS.border}`,
                  color: cell.color ? "#000" : cell.isToday ? COLORS.purple : COLORS.text,
                  boxShadow: cell.color===COLORS.green ? `0 0 10px ${COLORS.green}55` : "none",
                  transition:"all 0.15s",
                }}>
                  {cell.d}
                </div>
              ))}
            </div>

            {/* Legend */}
            <div style={{ display:"flex", gap:16, justifyContent:"center", marginTop:16, flexWrap:"wrap" }}>
              {[[COLORS.green,"All done 🌟"],[COLORS.yellow,"Good progress"],[COLORS.orange,"Partial"],["#1e1e3a","Today"]].map(([c,l])=>(
                <div key={l} style={{ display:"flex", alignItems:"center", gap:6, fontSize:11, color: COLORS.muted }}>
                  <div style={{ width:12, height:12, borderRadius:3, background:c }} />{l}
                </div>
              ))}
            </div>

            {/* Selected day preview */}
            {selectedCalDay && (() => {
              const d = getDayData(selectedCalDay);
              const oH = DEFAULT_OFFICE_HABITS.filter(h=>d.officeHabits?.[h.id]).length;
              const pH = DEFAULT_PERSONAL_HABITS.filter(h=>d.personalHabits?.[h.id]).length;
              const achs = d.achievements||[];
              const ideas = d.ideas||[];
              return (
                <div style={{ ...G.card, padding:16, marginTop:16 }}>
                  <div style={{ fontSize:13, color: COLORS.cyan, marginBottom:10, fontWeight:700 }}>{selectedCalDay}</div>
                  <div style={{ display:"flex", gap:12, flexWrap:"wrap", marginBottom:10 }}>
                    <Chip color={COLORS.blue} label={`💼 ${oH}/${DEFAULT_OFFICE_HABITS.length} office`} />
                    <Chip color={COLORS.pink} label={`🏠 ${pH}/${DEFAULT_PERSONAL_HABITS.length} personal`} />
                    <Chip color={COLORS.yellow} label={`📖 ${d.pages||0} pages`} />
                  </div>
                  {achs.length > 0 && <div style={{ fontSize:12, color: COLORS.muted, marginBottom:4 }}>Achievements:</div>}
                  {achs.map(a=><div key={a.id} style={{ fontSize:13, color: COLORS.yellow, marginBottom:4 }}>★ {a.text}</div>)}
                  {Object.entries(d.journal||{}).filter(([,v])=>v?.trim()).map(([k,v])=>{
                    const prompt = JOURNAL_PROMPTS.find(p=>p.id===k);
                    return prompt ? <div key={k} style={{ marginTop:6 }}><div style={{ fontSize:10, color: prompt.color }}>{prompt.icon} {prompt.label}</div><div style={{ fontSize:12, color: COLORS.muted, lineHeight:1.5 }}>{v}</div></div> : null;
                  })}
                </div>
              );
            })()}
          </div>
        )}

        {/* ══════════ WEEK TAB ══════════ */}
        {tab === "week" && (
          <div>
            <ColorSection title={`Week ${getWeekNumber(now)} · ${MONTHS_SHORT[now.getMonth()]} ${now.getFullYear()}`} color={COLORS.orange}>
              {/* Bar chart */}
              <div style={{ display:"flex", gap:8, alignItems:"flex-end", height:120, marginBottom:16 }}>
                {weekStats.map(({ date, dk, done, total, pct }) => {
                  const isToday = dk === todayDK;
                  const col = pct===100 ? COLORS.green : pct>=60 ? COLORS.yellow : pct>0 ? COLORS.orange : COLORS.border;
                  return (
                    <div key={dk} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
                      <div style={{ fontSize:10, color: COLORS.muted }}>{pct}%</div>
                      <div style={{ width:"100%", height:80, background: COLORS.card, borderRadius:6, display:"flex", alignItems:"flex-end", overflow:"hidden", border:`1px solid ${isToday?COLORS.orange:COLORS.border}` }}>
                        <div style={{ width:"100%", height:`${pct}%`, background:col, transition:"height 0.5s", boxShadow: pct===100?`0 0 10px ${COLORS.green}66`:undefined }} />
                      </div>
                      <div style={{ fontSize:10, color: isToday ? COLORS.orange : COLORS.muted, fontWeight: isToday?700:400 }}>{DAYS_SHORT[date.getDay()]}</div>
                      <div style={{ fontSize:9, color: COLORS.dim }}>{done}/{total}</div>
                    </div>
                  );
                })}
              </div>

              {/* Week summary stats */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:16 }}>
                {[
                  ["Days active", weekStats.filter(d=>d.done>0).length + "/7", COLORS.cyan],
                  ["Full days", weekStats.filter(d=>d.pct===100).length + "/7", COLORS.green],
                  ["Avg score", Math.round(weekStats.reduce((a,d)=>a+d.pct,0)/7) + "%", COLORS.orange],
                ].map(([l,v,c])=>(
                  <div key={l} style={{ ...G.card, padding:"12px 10px", textAlign:"center" }}>
                    <div style={{ fontSize:18, fontWeight:700, color:c }}>{v}</div>
                    <div style={{ fontSize:9, color: COLORS.muted, marginTop:2 }}>{l.toUpperCase()}</div>
                  </div>
                ))}
              </div>
            </ColorSection>

            {/* Week review journal */}
            <ColorSection title="📝 Week Review" color={COLORS.orange}>
              {[
                { id:"highlights", label:"✨ Highlights of the week", ph:"What went really well?" },
                { id:"lowlights", label:"🔧 What could've been better", ph:"Honest reflection…" },
                { id:"nextWeek", label:"🚀 Intentions for next week", ph:"What will you focus on?" },
              ].map(f => (
                <div key={f.id} style={{ marginBottom:12 }}>
                  <div style={{ fontSize:11, color: COLORS.orange, marginBottom:5 }}>{f.label}</div>
                  <textarea value={weekReview[f.id]||""} onChange={e=>setWeekReview(p=>({...p,[f.id]:e.target.value}))}
                    placeholder={f.ph} rows={3} style={{ ...G.inp, resize:"vertical", lineHeight:1.6 }}
                    onFocus={e=>e.target.style.borderColor=COLORS.orange}
                    onBlur={e=>e.target.style.borderColor=COLORS.border} />
                </div>
              ))}
            </ColorSection>

            {/* Historical weeks */}
            <ColorSection title="📆 Past Weeks" color={COLORS.dim}>
              {[1,2,3,4].map(weeksAgo => {
                const refDate = new Date(); refDate.setDate(refDate.getDate() - weeksAgo * 7);
                const wk = weekKey(refDate);
                const review = load(`planner_weekreview_${wk}`, null);
                const wDays = [];
                for (let i=0;i<7;i++) { const d=new Date(refDate); d.setDate(refDate.getDate()-refDate.getDay()+i); wDays.push(dateKey(d)); }
                const scores = wDays.map(dk => {
                  const d = getDayData(dk);
                  const done = DEFAULT_OFFICE_HABITS.filter(h=>d.officeHabits?.[h.id]).length + DEFAULT_PERSONAL_HABITS.filter(h=>d.personalHabits?.[h.id]).length;
                  return Math.round((done/(DEFAULT_OFFICE_HABITS.length+DEFAULT_PERSONAL_HABITS.length))*100);
                });
                const avg = Math.round(scores.reduce((a,b)=>a+b,0)/7);
                return (
                  <div key={wk} style={{ ...G.card, padding:"12px 16px", marginBottom:8 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <div style={{ fontSize:13, color: COLORS.text }}>{weeksAgo} week{weeksAgo>1?"s":""} ago</div>
                      <div style={{ fontSize:14, fontWeight:700, color: avg>=80?COLORS.green:avg>=50?COLORS.yellow:COLORS.orange }}>{avg}% avg</div>
                    </div>
                    <div style={{ display:"flex", gap:4, marginTop:8 }}>
                      {scores.map((s,i)=>(
                        <div key={i} style={{ flex:1, height:6, borderRadius:3, background: s>=80?COLORS.green:s>=50?COLORS.yellow:s>0?COLORS.orange:COLORS.border }} />
                      ))}
                    </div>
                    {review?.highlights && <div style={{ fontSize:11, color: COLORS.muted, marginTop:8, lineHeight:1.5 }}>✨ {review.highlights.slice(0,80)}{review.highlights.length>80?"…":""}</div>}
                  </div>
                );
              })}
            </ColorSection>
          </div>
        )}

        {/* ══════════ IDEAS TAB ══════════ */}
        {tab === "ideas" && (
          <div>
            <ColorSection title="💡 Thoughts & Ideas" color={COLORS.yellow}>
              <div style={{ display:"flex", gap:8, marginBottom:14 }}>
                <input value={newIdea} onChange={e=>setNewIdea(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addIdea()} placeholder="Capture a thought or idea…" style={{ ...G.inp, flex:1 }} />
                <button onClick={addIdea} style={{ ...addBtnStyle(COLORS.yellow) }}>+</button>
              </div>
              {(dayData.ideas||[]).length === 0 && <div style={{ textAlign:"center", color: COLORS.dim, fontSize:13, padding:"20px 0" }}>Your ideas for today appear here</div>}
              {(dayData.ideas||[]).map(idea=>(
                <div key={idea.id} style={{ ...G.card, padding:"14px 16px", marginBottom:10, borderLeft:`3px solid ${COLORS.yellow}` }}>
                  <div style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
                    <span style={{ fontSize:18 }}>💡</span>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:14, color: COLORS.text, lineHeight:1.6 }}>{idea.text}</div>
                      <div style={{ fontSize:10, color: COLORS.muted, marginTop:4 }}>{new Date(idea.ts).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"})}</div>
                    </div>
                    <button onClick={()=>removeIdea(idea.id)} style={xBtn}>×</button>
                  </div>
                </div>
              ))}
            </ColorSection>

            {/* Past ideas from other days */}
            <ColorSection title="🗂 Previous Ideas" color={COLORS.dim}>
              {[1,2,3,4,5,6].map(daysAgo => {
                const d = new Date(); d.setDate(d.getDate()-daysAgo);
                const dk = dateKey(d);
                const data = getDayData(dk);
                const ideas = data.ideas||[];
                if (ideas.length === 0) return null;
                return (
                  <div key={dk} style={{ marginBottom:12 }}>
                    <div style={{ fontSize:10, color: COLORS.muted, letterSpacing:"0.1em", marginBottom:6 }}>{MONTHS_SHORT[d.getMonth()]} {d.getDate()}</div>
                    {ideas.map(idea=>(
                      <div key={idea.id} style={{ ...G.card, padding:"10px 14px", marginBottom:6, borderLeft:`2px solid ${COLORS.yellow}55` }}>
                        <div style={{ fontSize:13, color: COLORS.muted, lineHeight:1.5 }}>💡 {idea.text}</div>
                      </div>
                    ))}
                  </div>
                );
              }).filter(Boolean)}
              {[1,2,3,4,5,6].every(n => (getDayData(dateKey(new Date(Date.now()-n*86400000))).ideas||[]).length===0) && (
                <div style={{ color: COLORS.dim, fontSize:13, textAlign:"center", padding:"10px 0" }}>Ideas from past days will appear here</div>
              )}
            </ColorSection>
          </div>
        )}

        {/* ══════════ GOALS TAB ══════════ */}
        {tab === "goals" && (
          <div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
              <div style={{ fontSize:13, color: COLORS.muted }}>{activeGoals.length} active · {doneGoals.length} achieved</div>
              <button onClick={()=>setShowAddGoal(v=>!v)} style={{ background: COLORS.cyan, border:"none", borderRadius:8, padding:"8px 16px", color:"#000", fontFamily:"inherit", fontSize:13, fontWeight:700, cursor:"pointer" }}>+ New Goal</button>
            </div>
            {showAddGoal && (
              <div style={{ ...G.card, padding:16, marginBottom:16 }}>
                <input value={newGoal} onChange={e=>setNewGoal(e.target.value)} placeholder="e.g. Run a 5K, Learn Spanish…" style={{ ...G.inp, marginBottom:8 }} />
                <div style={{ display:"flex", gap:8, marginBottom:12, alignItems:"center" }}>
                  <label style={{ fontSize:12, color: COLORS.muted, whiteSpace:"nowrap" }}>Target:</label>
                  <input type="date" value={goalDeadline} onChange={e=>setGoalDeadline(e.target.value)} style={{ ...G.inp, flex:1, colorScheme:"dark" }} />
                </div>
                <div style={{ display:"flex", gap:8 }}>
                  <button onClick={addGoal} style={{ flex:1, background: COLORS.cyan, border:"none", borderRadius:8, padding:"10px", color:"#000", fontFamily:"inherit", fontSize:14, fontWeight:700, cursor:"pointer" }}>Add</button>
                  <button onClick={()=>setShowAddGoal(false)} style={{ background: COLORS.card, border:`1px solid ${COLORS.border}`, borderRadius:8, padding:"10px 14px", color: COLORS.muted, fontFamily:"inherit", fontSize:14, cursor:"pointer" }}>Cancel</button>
                </div>
              </div>
            )}
            {activeGoals.length===0&&!showAddGoal&&<EmptyState icon="🎯" text="No active goals. Set one to get started!" />}
            {activeGoals.map(g=><GoalCard key={g.id} goal={g} onToggle={toggleGoal} onRemove={removeGoal} />)}
            {doneGoals.length>0&&<>
              <div style={{ fontSize:10, color: COLORS.muted, letterSpacing:"0.15em", textTransform:"uppercase", margin:"20px 0 10px" }}>Achieved ✦</div>
              {doneGoals.map(g=><GoalCard key={g.id} goal={g} onToggle={toggleGoal} onRemove={removeGoal} done />)}
            </>}
          </div>
        )}

        {/* ══════════ REMINDERS TAB ══════════ */}
        {tab === "reminders" && (
          <div>
            {/* Notification permission */}
            {notifPermission !== "granted" && (
              <div style={{ background:"#1a1a0a", border:`1px solid ${COLORS.yellow}`, borderRadius:12, padding:"14px 16px", marginBottom:16, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div style={{ fontSize:13, color: COLORS.yellow }}>🔔 Enable notifications to get alerts</div>
                <button onClick={()=>{ requestNotifPerms(); setTimeout(()=>setNotifPermission(Notification.permission),1000); }} style={{ background: COLORS.yellow, border:"none", borderRadius:8, padding:"7px 14px", fontFamily:"inherit", fontSize:12, fontWeight:700, cursor:"pointer", color:"#000" }}>Enable</button>
              </div>
            )}

            {/* Live clock */}
            <div style={{ ...G.card, padding:16, marginBottom:16, textAlign:"center" }}>
              <div style={{ fontSize:36, fontWeight:700, color: COLORS.cyan, fontVariantNumeric:"tabular-nums", letterSpacing:"0.05em" }}>{clockStr}</div>
              <div style={{ fontSize:11, color: COLORS.muted, marginTop:4 }}>{DAYS_FULL[now.getDay()]}, {MONTHS[now.getMonth()]} {now.getDate()}</div>
            </div>

            {/* Alarms */}
            <ColorSection title="⏰ Alarms" color={COLORS.yellow}>
              {alarms.map(a => (
                <div key={a.id} style={{ ...G.card, padding:"12px 16px", marginBottom:8, display:"flex", alignItems:"center", gap:12 }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:18, fontWeight:700, color: a.enabled ? COLORS.yellow : COLORS.dim, fontVariantNumeric:"tabular-nums" }}>{a.time}</div>
                    <div style={{ fontSize:12, color: COLORS.muted }}>{a.label}</div>
                  </div>
                  <Toggle on={a.enabled} color={COLORS.yellow} onToggle={()=>toggleAlarm(a.id)} />
                  <button onClick={()=>removeAlarm(a.id)} style={xBtn}>×</button>
                </div>
              ))}
              {showAddAlarm ? (
                <div style={{ ...G.card, padding:14, marginTop:8 }}>
                  <div style={{ display:"flex", gap:8, marginBottom:8 }}>
                    <input type="time" value={newAlarmTime} onChange={e=>setNewAlarmTime(e.target.value)} style={{ ...G.inp, flex:1, colorScheme:"dark" }} />
                    <input value={newAlarmLabel} onChange={e=>setNewAlarmLabel(e.target.value)} placeholder="Label" style={{ ...G.inp, flex:1 }} />
                  </div>
                  <div style={{ display:"flex", gap:8 }}>
                    <button onClick={addAlarm} style={{ flex:1, background: COLORS.yellow, border:"none", borderRadius:8, padding:"9px", color:"#000", fontFamily:"inherit", fontWeight:700, cursor:"pointer" }}>Add Alarm</button>
                    <button onClick={()=>setShowAddAlarm(false)} style={{ background: COLORS.card, border:`1px solid ${COLORS.border}`, borderRadius:8, padding:"9px 12px", color: COLORS.muted, fontFamily:"inherit", cursor:"pointer" }}>Cancel</button>
                  </div>
                </div>
              ) : (
                <button onClick={()=>setShowAddAlarm(true)} style={{ width:"100%", background:"transparent", border:`1px dashed ${COLORS.border}`, borderRadius:10, padding:"11px", color: COLORS.muted, fontFamily:"inherit", fontSize:13, cursor:"pointer", marginTop:4 }}>+ Add Alarm</button>
              )}
            </ColorSection>

            {/* Reminders */}
            <ColorSection title="🔔 Reminders" color={COLORS.cyan}>
              {reminders.map(r => (
                <div key={r.id} style={{ ...G.card, padding:"12px 16px", marginBottom:8, display:"flex", alignItems:"center", gap:12 }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:14, color: r.enabled ? COLORS.text : COLORS.dim }}>{r.label}</div>
                    <div style={{ fontSize:12, color: r.enabled ? COLORS.cyan : COLORS.dim, fontVariantNumeric:"tabular-nums" }}>{r.time} · {r.repeat}</div>
                  </div>
                  <Toggle on={r.enabled} color={COLORS.cyan} onToggle={()=>toggleReminder(r.id)} />
                  <button onClick={()=>removeReminder(r.id)} style={xBtn}>×</button>
                </div>
              ))}
              {showAddReminder ? (
                <div style={{ ...G.card, padding:14, marginTop:8 }}>
                  <div style={{ display:"flex", gap:8, marginBottom:8 }}>
                    <input value={newRemLabel} onChange={e=>setNewRemLabel(e.target.value)} placeholder="Reminder label" style={{ ...G.inp, flex:1 }} />
                    <input type="time" value={newRemTime} onChange={e=>setNewRemTime(e.target.value)} style={{ ...G.inp, flex:"0 0 100px", colorScheme:"dark" }} />
                  </div>
                  <div style={{ display:"flex", gap:8 }}>
                    <button onClick={addReminder} style={{ flex:1, background: COLORS.cyan, border:"none", borderRadius:8, padding:"9px", color:"#000", fontFamily:"inherit", fontWeight:700, cursor:"pointer" }}>Add</button>
                    <button onClick={()=>setShowAddReminder(false)} style={{ background: COLORS.card, border:`1px solid ${COLORS.border}`, borderRadius:8, padding:"9px 12px", color: COLORS.muted, fontFamily:"inherit", cursor:"pointer" }}>Cancel</button>
                  </div>
                </div>
              ) : (
                <button onClick={()=>setShowAddReminder(true)} style={{ width:"100%", background:"transparent", border:`1px dashed ${COLORS.border}`, borderRadius:10, padding:"11px", color: COLORS.muted, fontFamily:"inherit", fontSize:13, cursor:"pointer", marginTop:4 }}>+ Add Reminder</button>
              )}
            </ColorSection>

            {/* Test alarm */}
            <button onClick={()=>{playAlarm("bell");setNotification({title:"Test 🔔",body:"Reminders are working!"});setTimeout(()=>setNotification(null),3000);}}
              style={{ width:"100%", background: COLORS.card, border:`1px solid ${COLORS.border}`, borderRadius:10, padding:"12px", color: COLORS.muted, fontFamily:"inherit", fontSize:13, cursor:"pointer" }}>
              🔊 Test Notification Sound
            </button>
          </div>
        )}

        {/* ══════════ LEARN TAB ══════════ */}
        {tab === "learn" && (
          <div>
            {learnView === "home" && (
              <div>
                <div style={{ display:"flex", gap:8, marginBottom:20 }}>
                  {[["🔥",learnStreak,"Streak"],["💾",savedInsights.length,"Saved"],["📚",library.length,"Books"]].map(([icon,val,label])=>(
                    <div key={label} style={{ flex:1, ...G.card, padding:"12px 10px", textAlign:"center" }}>
                      <div style={{ fontSize:20, marginBottom:4 }}>{icon}</div>
                      <div style={{ fontSize:20, fontWeight:700, color: COLORS.green }}>{val}</div>
                      <div style={{ fontSize:9, color: COLORS.muted }}>{label.toUpperCase()}</div>
                    </div>
                  ))}
                </div>
                <ColorSection title="📚 Book Library" color={COLORS.green}>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                    {library.map(book => (
                      <div key={book.id} style={{ ...G.card, padding:"14px 12px", cursor:"pointer" }} onClick={()=>{ setActiveBook(book); setLearnView("book"); fetchInsight(book); }}>
                        <div style={{ fontSize:28, marginBottom:8 }}>{book.emoji}</div>
                        <div style={{ fontSize:13, color: COLORS.text, lineHeight:1.3, marginBottom:2 }}>{book.title}</div>
                        <div style={{ fontSize:11, color: COLORS.muted }}>{book.author}</div>
                        <div style={{ marginTop:10, background: COLORS.green, border:"none", borderRadius:6, padding:"6px", color:"#000", fontSize:11, fontWeight:700, textAlign:"center" }}>Learn →</div>
                      </div>
                    ))}
                  </div>
                </ColorSection>
                {savedInsights.length > 0 && (
                  <ColorSection title="♡ Saved Insights" color={COLORS.teal}>
                    {savedInsights.slice(0,5).map(ins=>(
                      <div key={ins.id} style={{ ...G.card, padding:"12px 14px", marginBottom:8, borderLeft:`3px solid ${COLORS.teal}` }}>
                        <div style={{ fontSize:11, color: COLORS.muted, marginBottom:4 }}>{ins.book} · {ins.date}</div>
                        <div style={{ fontSize:13, color: COLORS.teal, marginBottom:4 }}>{ins.headline}</div>
                        <div style={{ fontSize:12, color: COLORS.muted, lineHeight:1.5 }}>{ins.insight}</div>
                      </div>
                    ))}
                  </ColorSection>
                )}
              </div>
            )}
            {learnView === "book" && activeBook && (
              <div>
                <button onClick={()=>setLearnView("home")} style={{ background:"none", border:"none", color: COLORS.muted, cursor:"pointer", fontFamily:"inherit", fontSize:13, padding:"0 0 14px", display:"flex", alignItems:"center", gap:5 }}>← Back</button>
                <div style={{ ...G.card, padding:20, textAlign:"center", marginBottom:16, background:`linear-gradient(135deg,#0d1a0d,#0a0a1a)` }}>
                  <div style={{ fontSize:44, marginBottom:8 }}>{activeBook.emoji}</div>
                  <div style={{ fontSize:17, color: COLORS.text, marginBottom:4 }}>{activeBook.title}</div>
                  <div style={{ fontSize:13, color: COLORS.muted }}>by {activeBook.author}</div>
                  <button onClick={()=>fetchInsight(activeBook)} style={{ marginTop:14, background: COLORS.green, border:"none", borderRadius:8, padding:"9px 20px", color:"#000", fontFamily:"inherit", fontSize:13, fontWeight:700, cursor:"pointer" }}>
                    {insightLoading ? "Loading…" : "✦ New Insight"}
                  </button>
                </div>
                {insightLoading && <div style={{ ...G.card, padding:40, textAlign:"center", color: COLORS.muted }}>✦ Generating insight…</div>}
                {insight && !insightLoading && (
                  <div>
                    <div onClick={()=>setCardFlipped(f=>!f)} style={{ cursor:"pointer", marginBottom:10 }}>
                      {!cardFlipped ? (
                        <div style={{ background:`linear-gradient(135deg,#0d1a12,#0a0a12)`, border:`1px solid ${COLORS.green}44`, borderRadius:16, padding:24, minHeight:180 }}>
                          <div style={{ fontSize:9, letterSpacing:"0.2em", color: COLORS.muted, marginBottom:14 }}>TODAY'S INSIGHT · TAP TO FLIP</div>
                          <div style={{ fontSize:18, color: COLORS.green, fontWeight:400, lineHeight:1.4, marginBottom:12 }}>{insight.headline}</div>
                          <div style={{ fontSize:13, color: COLORS.muted, lineHeight:1.8 }}>{insight.insight}</div>
                        </div>
                      ) : (
                        <div style={{ background:`linear-gradient(135deg,#1a0d1a,#0a0a12)`, border:`1px solid ${COLORS.purple}44`, borderRadius:16, padding:24, minHeight:180 }}>
                          <div style={{ fontSize:9, letterSpacing:"0.2em", color: COLORS.muted, marginBottom:14 }}>ACTION STEP · TAP TO FLIP BACK</div>
                          <div style={{ fontSize:15, color: COLORS.purple, lineHeight:1.7, marginBottom:16 }}>⚡ {insight.action}</div>
                          {insight.quote && <div style={{ borderLeft:`2px solid ${COLORS.purple}44`, paddingLeft:14, fontSize:12, color: COLORS.muted, fontStyle:"italic", lineHeight:1.6 }}>"{insight.quote}"</div>}
                        </div>
                      )}
                    </div>
                    <div style={{ fontSize:10, color: COLORS.dim, textAlign:"center", marginBottom:12 }}>Tap card for action step</div>
                    <button onClick={saveInsight} style={{ width:"100%", background: COLORS.card, border:`1px solid ${COLORS.border}`, borderRadius:10, padding:"11px", color: COLORS.teal, fontFamily:"inherit", fontSize:13, cursor:"pointer" }}>♡ Save insight</button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

      </div>

      {/* Bottom summary bar */}
      <div style={{ position:"fixed", bottom:0, left:0, right:0, background:"#0a0a12ee", backdropFilter:"blur(12px)", borderTop:`1px solid ${COLORS.border}`, padding:"10px 16px", display:"flex", justifyContent:"center", gap:20, zIndex:40, flexWrap:"wrap" }}>
        {[
          { label:"Office", val:`${offDone}/${DEFAULT_OFFICE_HABITS.length}`, color: COLORS.blue },
          { label:"Personal", val:`${persDone}/${DEFAULT_PERSONAL_HABITS.length}`, color: COLORS.pink },
          { label:"Tasks", val:`${todosDone}/${todosTotal||0}`, color: COLORS.teal },
          { label:"Journal", val:`${journalDone}/${JOURNAL_PROMPTS.length}`, color: COLORS.purple },
          { label:"Streak 🔥", val:learnStreak, color: COLORS.green },
        ].map(s => (
          <div key={s.label} style={{ textAlign:"center" }}>
            <div style={{ fontSize:14, fontWeight:700, color: s.color }}>{s.val}</div>
            <div style={{ fontSize:9, color: COLORS.dim, letterSpacing:"0.06em" }}>{s.label.toUpperCase()}</div>
          </div>
        ))}
        {allComplete && <div style={{ fontSize:18, animation:"pulse 1s infinite" }}>🌟</div>}
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        ::-webkit-scrollbar { width:4px; height:4px; }
        ::-webkit-scrollbar-track { background:#0a0a12; }
        ::-webkit-scrollbar-thumb { background:#2a2a3a; border-radius:2px; }
        input[type=time]::-webkit-calendar-picker-indicator,
        input[type=date]::-webkit-calendar-picker-indicator { filter:invert(0.5); }
      `}</style>
    </div>
  );
}

// ─── Helper components ────────────────────────────────────────────────────────
function ColorSection({ title, color, children }) {
  return (
    <div style={{ marginBottom:20 }}>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
        <div style={{ width:3, height:14, borderRadius:2, background:color }} />
        <div style={{ fontSize:11, letterSpacing:"0.12em", textTransform:"uppercase", color }} >{title}</div>
      </div>
      {children}
    </div>
  );
}

function HabitRow({ habit, checked, color, onToggle }) {
  return (
    <div onClick={onToggle} style={{ display:"flex", alignItems:"center", padding:"12px 14px", background: checked?"#0d1a0d":COLORS.card, border:`1px solid ${checked?color+"44":COLORS.border}`, borderRadius:10, marginBottom:7, cursor:"pointer", transition:"all 0.2s", boxShadow: checked?`0 0 12px ${color}22`:undefined }}>
      <span style={{ fontSize:18, marginRight:10 }}>{habit.icon}</span>
      <span style={{ flex:1, fontSize:14, color: checked?color:COLORS.text }}>{habit.label}</span>
      <div style={{ width:22, height:22, borderRadius:"50%", border:`2px solid ${checked?color:COLORS.dim}`, background:checked?color:"transparent", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, color:"#000", fontWeight:700, transition:"all 0.2s" }}>{checked?"✓":""}</div>
    </div>
  );
}

function ProgressBar({ done, total, color }) {
  const pct = Math.round((done/total)*100);
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10, marginTop:4 }}>
      <div style={{ flex:1, height:4, background: COLORS.border, borderRadius:2 }}>
        <div style={{ height:"100%", width:`${pct}%`, background: pct===100?COLORS.green:color, borderRadius:2, transition:"width 0.4s", boxShadow: pct===100?`0 0 8px ${COLORS.green}`:undefined }} />
      </div>
      <div style={{ fontSize:11, color: pct===100?COLORS.green:color, fontWeight:700, whiteSpace:"nowrap" }}>{done}/{total} {pct===100?"🌟":""}</div>
    </div>
  );
}

function TodoInput({ value, onChange, onAdd, color, placeholder }) {
  return (
    <div style={{ display:"flex", gap:8, marginBottom:10 }}>
      <input value={value} onChange={e=>onChange(e.target.value)} onKeyDown={e=>e.key==="Enter"&&onAdd()} placeholder={placeholder} style={{ ...G.inp, flex:1 }} />
      <button onClick={onAdd} style={{ ...addBtnStyle(color) }}>+</button>
    </div>
  );
}

function TodoList({ todos, color, onToggle, onRemove }) {
  if (todos.length === 0) return <div style={{ color: COLORS.dim, fontSize:12, textAlign:"center", padding:"8px 0" }}>No tasks yet</div>;
  return (
    <div>
      {todos.map(t => (
        <div key={t.id} style={{ display:"flex", alignItems:"center", padding:"10px 12px", background: t.done?"#0a0a0a":COLORS.card, border:`1px solid ${t.done?COLORS.border+"55":COLORS.border}`, borderRadius:9, marginBottom:6, gap:10 }}>
          <div onClick={()=>onToggle(t.id)} style={{ width:18, height:18, borderRadius:5, border:`2px solid ${t.done?color:COLORS.dim}`, background:t.done?color:"transparent", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", flexShrink:0, fontSize:10, color:"#000", fontWeight:700, transition:"all 0.2s" }}>{t.done?"✓":""}</div>
          <span style={{ flex:1, fontSize:13, color:t.done?COLORS.dim:COLORS.text, textDecoration:t.done?"line-through":"none" }}>{t.text}</span>
          <button onClick={()=>onRemove(t.id)} style={xBtn}>×</button>
        </div>
      ))}
    </div>
  );
}

function GoalCard({ goal, onToggle, onRemove, done }) {
  const daysLeft = goal.deadline ? Math.ceil((new Date(goal.deadline)-new Date())/(1000*60*60*24)) : null;
  const deadlineColor = daysLeft===null ? COLORS.muted : daysLeft<0 ? COLORS.red : daysLeft<7 ? COLORS.orange : COLORS.muted;
  return (
    <div style={{ ...G.card, padding:16, marginBottom:10, borderLeft:`3px solid ${done?COLORS.green:COLORS.cyan}` }}>
      <div style={{ display:"flex", alignItems:"flex-start", gap:12 }}>
        <div onClick={()=>onToggle(goal.id)} style={{ width:22, height:22, borderRadius:"50%", border:`2px solid ${done?COLORS.green:COLORS.cyan}`, background:done?COLORS.green:"transparent", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", flexShrink:0, marginTop:1, fontSize:12, color:"#000", fontWeight:700, transition:"all 0.2s" }}>{done?"✓":""}</div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:14, color:done?COLORS.dim:COLORS.text, textDecoration:done?"line-through":"none", lineHeight:1.4 }}>{goal.text}</div>
          {goal.deadline && <div style={{ fontSize:11, color:deadlineColor, marginTop:5 }}>
            {daysLeft===null?"" : daysLeft<0 ? `${Math.abs(daysLeft)}d overdue` : daysLeft===0 ? "Due today!" : `${daysLeft} days left`}
            {" · "}{new Date(goal.deadline).toLocaleDateString("en-IN",{month:"short",day:"numeric",year:"numeric"})}
          </div>}
        </div>
        <button onClick={()=>onRemove(goal.id)} style={xBtn}>×</button>
      </div>
    </div>
  );
}

function Toggle({ on, color, onToggle }) {
  return (
    <div onClick={onToggle} style={{ width:40, height:22, borderRadius:11, background:on?color:COLORS.border, position:"relative", cursor:"pointer", transition:"background 0.2s", flexShrink:0 }}>
      <div style={{ width:18, height:18, borderRadius:"50%", background:"#fff", position:"absolute", top:2, left:on?20:2, transition:"left 0.2s", boxShadow:"0 1px 4px rgba(0,0,0,0.3)" }} />
    </div>
  );
}

function Chip({ color, label }) {
  return <div style={{ background:color+"22", border:`1px solid ${color}44`, borderRadius:6, padding:"3px 8px", fontSize:11, color }}>{label}</div>;
}

function EmptyState({ icon, text }) {
  return (
    <div style={{ textAlign:"center", padding:"40px 20px", background: COLORS.card, borderRadius:14, border:`1px dashed ${COLORS.border}` }}>
      <div style={{ fontSize:36, marginBottom:10 }}>{icon}</div>
      <div style={{ color: COLORS.dim, fontSize:13 }}>{text}</div>
    </div>
  );
}

function CBtn({ onClick, color, children }) {
  return (
    <button onClick={onClick} style={{ width:28, height:28, background:"transparent", border:`1px solid ${color}44`, borderRadius:6, color, fontSize:16, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"inherit", lineHeight:1 }}>
      {children}
    </button>
  );
}

function getWeekNumber(d) {
  const date = new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate()));
  date.setUTCDate(date.getUTCDate()+4-(date.getUTCDay()||7));
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(),0,1));
  return Math.ceil((((date-yearStart)/86400000)+1)/7);
}

const addBtnStyle = (color) => ({ background:color, border:"none", borderRadius:9, width:40, height:40, fontSize:20, color:"#000", cursor:"pointer", fontWeight:700, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center" });
const xBtn = { background:"none", border:"none", color: COLORS.dim, cursor:"pointer", fontSize:16, padding:"0 2px", lineHeight:1 };
const navBtn = { background: COLORS.card, border:`1px solid ${COLORS.border}`, borderRadius:8, padding:"8px 16px", color: COLORS.text, fontSize:18, cursor:"pointer", fontFamily:"inherit" };
