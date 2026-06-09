/* eslint-disable */
import React, { useState, useEffect, useRef } from "react";

const DAYS_SHORT = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const DAYS_FULL = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const C = {
  bg:"#0a0a12", card:"#12121e", border:"#1e1e32",
  pink:"#ff6b9d", purple:"#a855f7", blue:"#3b82f6", cyan:"#06b6d4",
  green:"#22c55e", yellow:"#eab308", orange:"#f97316", red:"#ef4444",
  teal:"#14b8a6", indigo:"#6366f1", text:"#f0f0ff", muted:"#6b7280", dim:"#374151",
};

const OFFICE_HABITS = [
  {id:"standup",label:"Daily Standup",icon:"🗣️"},
  {id:"emails",label:"Clear Inbox",icon:"📧"},
  {id:"focus",label:"2hr Deep Work Block",icon:"🎯"},
  {id:"review",label:"End-of-day Review",icon:"✅"},
];
const PERSONAL_HABITS = [
  {id:"workout",label:"20 min Workout",icon:"🏋️"},
  {id:"water",label:"Drink 8 Glasses",icon:"💧"},
  {id:"meditate",label:"Meditate / Breathe",icon:"🧘"},
  {id:"reading",label:"Read 20 pages",icon:"📖"},
];
const JOURNAL_PROMPTS = [
  {id:"best",label:"Best part of today",icon:"✨",color:C.yellow},
  {id:"achieve",label:"What I achieved today",icon:"🏆",color:C.green},
  {id:"productive",label:"Productive work done",icon:"⚡",color:C.cyan},
  {id:"improve",label:"What needs improvement",icon:"🔧",color:C.orange},
  {id:"pending",label:"Pending tasks completed",icon:"✅",color:C.teal},
  {id:"grateful",label:"Grateful for…",icon:"🙏",color:C.pink},
];
const SAMPLE_BOOKS = [
  {id:"atomic",title:"Atomic Habits",author:"James Clear",emoji:"⚛️"},
  {id:"deepwork",title:"Deep Work",author:"Cal Newport",emoji:"🎯"},
  {id:"mindset",title:"Mindset",author:"Carol Dweck",emoji:"🧠"},
  {id:"ikigai",title:"Ikigai",author:"Héctor García",emoji:"🌸"},
  {id:"stoic",title:"Meditations",author:"Marcus Aurelius",emoji:"🏛️"},
  {id:"pnow",title:"The Power of Now",author:"Eckhart Tolle",emoji:"🌅"},
];
const DEFAULT_REMINDERS = [
  {id:"w1",label:"Drink Water 💧",time:"09:00",enabled:true},
  {id:"w2",label:"Drink Water 💧",time:"12:00",enabled:true},
  {id:"w3",label:"Drink Water 💧",time:"15:00",enabled:true},
  {id:"w4",label:"Drink Water 💧",time:"18:00",enabled:true},
  {id:"str",label:"Stretch Break 🤸",time:"11:00",enabled:true},
  {id:"wkt",label:"Workout Time 🏋️",time:"07:00",enabled:true},
];

function dateKey(d=new Date()){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;}
function weekKey(d=new Date()){const day=d.getDay();const mon=new Date(d);mon.setDate(d.getDate()-(day===0?6:day-1));return `week-${dateKey(mon)}`;}
function getWeekNumber(d){const date=new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate()));date.setUTCDate(date.getUTCDate()+4-(date.getUTCDay()||7));const yearStart=new Date(Date.UTC(date.getUTCFullYear(),0,1));return Math.ceil((((date-yearStart)/86400000)+1)/7);}

function ls_load(key,fb){try{const v=localStorage.getItem(key);return v!==null?JSON.parse(v):fb;}catch{return fb;}}
function ls_save(key,val){try{localStorage.setItem(key,JSON.stringify(val));}catch{}}

const EMPTY_DAY=()=>({officeHabits:{},personalHabits:{},pages:0,officeTodos:[],personalTodos:[],journal:{},achievements:[],ideas:[]});
function getDayData(dk){return ls_load(`pd_${dk}`,EMPTY_DAY());}
function saveDayData(dk,data){ls_save(`pd_${dk}`,data);}

function playAlarm(type="bell"){try{const ctx=new(window.AudioContext||window.webkitAudioContext)();const freqs=type==="bell"?[523,659,784,1046]:[440,480,440,480];freqs.forEach((f,i)=>{const o=ctx.createOscillator();const g=ctx.createGain();o.connect(g);g.connect(ctx.destination);o.frequency.value=f;o.type=type==="bell"?"sine":"square";g.gain.setValueAtTime(0.3,ctx.currentTime+i*0.25);g.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+i*0.25+0.4);o.start(ctx.currentTime+i*0.25);o.stop(ctx.currentTime+i*0.25+0.5);});}catch{}}
function sendNotif(title,body){if("Notification"in window&&Notification.permission==="granted"){new Notification(title,{body});}}

const inp={background:"#0d0d1a",border:`1px solid ${C.border}`,borderRadius:9,padding:"10px 14px",color:C.text,fontFamily:"inherit",fontSize:14,outline:"none",width:"100%",boxSizing:"border-box"};
const card={background:C.card,border:`1px solid ${C.border}`,borderRadius:14};
const xBtn={background:"none",border:"none",color:C.dim,cursor:"pointer",fontSize:16,padding:"0 2px",lineHeight:1};
const navBtn={background:C.card,border:`1px solid ${C.border}`,borderRadius:8,padding:"8px 16px",color:C.text,fontSize:18,cursor:"pointer",fontFamily:"inherit"};
const addBtnS=(col)=>({background:col,border:"none",borderRadius:9,width:40,height:40,fontSize:20,color:"#000",cursor:"pointer",fontWeight:700,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"});

function Section({title,color,children}){return(<div style={{marginBottom:20}}><div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}><div style={{width:3,height:14,borderRadius:2,background:color}}/><div style={{fontSize:11,letterSpacing:"0.12em",textTransform:"uppercase",color}}>{title}</div></div>{children}</div>);}
function HabitRow({habit,checked,color,onToggle}){return(<div onClick={onToggle} style={{display:"flex",alignItems:"center",padding:"12px 14px",background:checked?"#0d1a0d":C.card,border:`1px solid ${checked?color+"44":C.border}`,borderRadius:10,marginBottom:7,cursor:"pointer",transition:"all 0.2s"}}><span style={{fontSize:18,marginRight:10}}>{habit.icon}</span><span style={{flex:1,fontSize:14,color:checked?color:C.text}}>{habit.label}</span><div style={{width:22,height:22,borderRadius:"50%",border:`2px solid ${checked?color:C.dim}`,background:checked?color:"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:"#000",fontWeight:700,transition:"all 0.2s"}}>{checked?"✓":""}</div></div>);}
function ProgBar({done,total,color}){const pct=Math.round((done/total)*100);return(<div style={{display:"flex",alignItems:"center",gap:10,marginTop:4}}><div style={{flex:1,height:4,background:C.border,borderRadius:2}}><div style={{height:"100%",width:`${pct}%`,background:pct===100?C.green:color,borderRadius:2,transition:"width 0.4s"}}/></div><div style={{fontSize:11,color:pct===100?C.green:color,fontWeight:700,whiteSpace:"nowrap"}}>{done}/{total}{pct===100?" 🌟":""}</div></div>);}
function Toggle({on,color,onToggle}){return(<div onClick={onToggle} style={{width:40,height:22,borderRadius:11,background:on?color:C.border,position:"relative",cursor:"pointer",transition:"background 0.2s",flexShrink:0}}><div style={{width:18,height:18,borderRadius:"50%",background:"#fff",position:"absolute",top:2,left:on?20:2,transition:"left 0.2s"}}/></div>);}
function GoalCard({goal,onToggle,onRemove,done}){const daysLeft=goal.deadline?Math.ceil((new Date(goal.deadline)-new Date())/(1000*60*60*24)):null;const dc=daysLeft===null?C.muted:daysLeft<0?C.red:daysLeft<7?C.orange:C.muted;return(<div style={{...card,padding:16,marginBottom:10,borderLeft:`3px solid ${done?C.green:C.cyan}`}}><div style={{display:"flex",alignItems:"flex-start",gap:12}}><div onClick={()=>onToggle(goal.id)} style={{width:22,height:22,borderRadius:"50%",border:`2px solid ${done?C.green:C.cyan}`,background:done?C.green:"transparent",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0,marginTop:1,fontSize:12,color:"#000",fontWeight:700,transition:"all 0.2s"}}>{done?"✓":""}</div><div style={{flex:1}}><div style={{fontSize:14,color:done?C.dim:C.text,textDecoration:done?"line-through":"none",lineHeight:1.4}}>{goal.text}</div>{goal.deadline&&<div style={{fontSize:11,color:dc,marginTop:5}}>{daysLeft===null?"":daysLeft<0?`${Math.abs(daysLeft)}d overdue`:daysLeft===0?"Due today!":`${daysLeft} days left`} · {new Date(goal.deadline).toLocaleDateString("en-IN",{month:"short",day:"numeric",year:"numeric"})}</div>}</div><button onClick={()=>onRemove(goal.id)} style={xBtn}>×</button></div></div>);}

export default function App(){
  const todayDK=dateKey();
  const todayWK=weekKey();
  const now=new Date();

  const [tab,setTab]=useState("today");
  const [wTab,setWTab]=useState("office");
  const [viewDK,setViewDK]=useState(todayDK);
  const [dayData,setDayData]=useState(()=>getDayData(todayDK));
  const [goals,setGoals]=useState(()=>ls_load("p_goals",[]));
  const [reminders,setReminders]=useState(()=>ls_load("p_reminders",DEFAULT_REMINDERS));
  const [alarms,setAlarms]=useState(()=>ls_load("p_alarms",[]));
  const [notif,setNotif]=useState(null);
  const [alarmFiring,setAlarmFiring]=useState(null);
  const [showAddRem,setShowAddRem]=useState(false);
  const [showAddAlarm,setShowAddAlarm]=useState(false);
  const [newRemLabel,setNewRemLabel]=useState("");
  const [newRemTime,setNewRemTime]=useState("08:00");
  const [newAlarmTime,setNewAlarmTime]=useState("07:00");
  const [newAlarmLabel,setNewAlarmLabel]=useState("");
  const [newTodo,setNewTodo]=useState("");
  const [newGoal,setNewGoal]=useState("");
  const [goalDL,setGoalDL]=useState("");
  const [showAddGoal,setShowAddGoal]=useState(false);
  const [newIdea,setNewIdea]=useState("");
  const [newAch,setNewAch]=useState("");
  const [calDate,setCalDate]=useState(new Date());
  const [weekReview,setWeekReview]=useState(()=>ls_load(`p_wr_${todayWK}`,{highlights:"",lowlights:"",nextWeek:""}));
  const [learnView,setLearnView]=useState("home");
  const [activeBook,setActiveBook]=useState(null);
  const [insight,setInsight]=useState(null);
  const [insightLoading,setInsightLoading]=useState(false);
  const [savedInsights,setSavedInsights]=useState(()=>ls_load("p_insights",[]));
  const [library]=useState(()=>ls_load("p_library",SAMPLE_BOOKS));
  const [learnStreak,setLearnStreak]=useState(()=>ls_load("p_streak",0));
  const [lastLearnDate,setLastLearnDate]=useState(()=>ls_load("p_lastlearn",""));
  const [cardFlipped,setCardFlipped]=useState(false);
  const [clock,setClock]=useState("");
  const [notifPerm,setNotifPerm]=useState(typeof Notification!=="undefined"?Notification.permission:"denied");
  const [savedFields,setSavedFields]=useState({});
  const saveTimers=useRef({});
  const tickRef=useRef(null);

  useEffect(()=>{saveDayData(viewDK,dayData);},[dayData,viewDK]);
  useEffect(()=>{ls_save("p_goals",goals);},[goals]);
  useEffect(()=>{ls_save("p_reminders",reminders);},[reminders]);
  useEffect(()=>{ls_save("p_alarms",alarms);},[alarms]);
  useEffect(()=>{ls_save("p_insights",savedInsights);},[savedInsights]);
  useEffect(()=>{ls_save(`p_wr_${todayWK}`,weekReview);},[weekReview]);

  useEffect(()=>{
    function tick(){
      const n=new Date();
      setClock(n.toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit",second:"2-digit"}));
      const hhmm=`${String(n.getHours()).padStart(2,"0")}:${String(n.getMinutes()).padStart(2,"0")}`;
      if(n.getSeconds()===0){
        reminders.forEach(r=>{if(r.enabled&&r.time===hhmm){sendNotif(r.label,"Reminder!");setNotif({title:r.label});playAlarm("bell");setTimeout(()=>setNotif(null),5000);}});
        alarms.forEach(a=>{if(a.enabled&&a.time===hhmm){setAlarmFiring(a);playAlarm("alarm");sendNotif("⏰ "+(a.label||"Alarm"),"Alarm!");}});
      }
    }
    tickRef.current=setInterval(tick,1000);tick();
    return()=>clearInterval(tickRef.current);
  },[reminders,alarms]);

  function upd(fn){setDayData(prev=>{const next={...prev};fn(next);return next;});}
  function navDay(offset){const d=new Date(viewDK+"T12:00:00");d.setDate(d.getDate()+offset);const dk=dateKey(d);setViewDK(dk);setDayData(getDayData(dk));setNewTodo("");setNewIdea("");setNewAch("");}
  function goDate(dk){setViewDK(dk);setDayData(getDayData(dk));setNewTodo("");setNewIdea("");setNewAch("");}

  const isToday=viewDK===todayDK;
  const isFuture=viewDK>todayDK;
  const viewDate=new Date(viewDK+"T12:00:00");

  function toggleOH(id){upd(d=>{d.officeHabits={...d.officeHabits,[id]:!d.officeHabits[id]};});}
  function togglePH(id){upd(d=>{d.personalHabits={...d.personalHabits,[id]:!d.personalHabits[id]};});}
  function setPages(v){upd(d=>{d.pages=v;});}
  function addTodo(type){if(!newTodo.trim())return;upd(d=>{const k=type+"Todos";d[k]=[...(d[k]||[]),{id:Date.now(),text:newTodo.trim(),done:false}];});setNewTodo("");}
  function toggleTodo(type,id){upd(d=>{const k=type+"Todos";d[k]=d[k].map(t=>t.id===id?{...t,done:!t.done}:t);});}
  function removeTodo(type,id){upd(d=>{const k=type+"Todos";d[k]=d[k].filter(t=>t.id!==id);});}
  function setJField(id,val){
    upd(d=>{d.journal={...d.journal,[id]:val};});
    if(saveTimers.current[id])clearTimeout(saveTimers.current[id]);
    setSavedFields(p=>({...p,[id]:"saving"}));
    saveTimers.current[id]=setTimeout(()=>{setSavedFields(p=>({...p,[id]:"saved"}));setTimeout(()=>setSavedFields(p=>({...p,[id]:null})),2000);},800);
  }
  function addIdea(){if(!newIdea.trim())return;upd(d=>{d.ideas=[...(d.ideas||[]),{id:Date.now(),text:newIdea.trim(),ts:new Date().toISOString()}];});setNewIdea("");}
  function removeIdea(id){upd(d=>{d.ideas=d.ideas.filter(i=>i.id!==id);});}
  function addAch(){if(!newAch.trim())return;upd(d=>{d.achievements=[...(d.achievements||[]),{id:Date.now(),text:newAch.trim()}];});setNewAch("");}
  function removeAch(id){upd(d=>{d.achievements=d.achievements.filter(a=>a.id!==id);});}

  const offDone=OFFICE_HABITS.filter(h=>dayData.officeHabits?.[h.id]).length;
  const persDone=PERSONAL_HABITS.filter(h=>dayData.personalHabits?.[h.id]).length;
  const todosDone=[...(dayData.officeTodos||[]),...(dayData.personalTodos||[])].filter(t=>t.done).length;
  const todosTotal=[...(dayData.officeTodos||[]),...(dayData.personalTodos||[])].length;
  const journalDone=JOURNAL_PROMPTS.filter(p=>dayData.journal?.[p.id]?.trim()).length;
  const allComplete=offDone===OFFICE_HABITS.length&&persDone===PERSONAL_HABITS.length&&(todosTotal===0||todosDone===todosTotal)&&journalDone===JOURNAL_PROMPTS.length;
  const progressPct=Math.round(((offDone+persDone+todosDone+journalDone)/(OFFICE_HABITS.length+PERSONAL_HABITS.length+Math.max(todosTotal,1)+JOURNAL_PROMPTS.length))*100);

  function getDayColor(dk){const d=getDayData(dk);const done=OFFICE_HABITS.filter(h=>d.officeHabits?.[h.id]).length+PERSONAL_HABITS.filter(h=>d.personalHabits?.[h.id]).length;const total=OFFICE_HABITS.length+PERSONAL_HABITS.length;if(done===0)return null;if(done===total)return C.green;if(done>=total*0.6)return C.yellow;return C.orange;}

  function getWeekDays(){const arr=[];for(let i=0;i<7;i++){const d=new Date();d.setDate(d.getDate()-d.getDay()+i);arr.push({date:d,dk:dateKey(d)});}return arr;}

  function getWeekStats(){return getWeekDays().map(({date,dk})=>{const d=getDayData(dk);const done=OFFICE_HABITS.filter(h=>d.officeHabits?.[h.id]).length+PERSONAL_HABITS.filter(h=>d.personalHabits?.[h.id]).length;const total=OFFICE_HABITS.length+PERSONAL_HABITS.length;return{date,dk,done,total,pct:Math.round((done/total)*100)};});}

  function renderCal(){const yr=calDate.getFullYear(),mo=calDate.getMonth();const firstDay=new Date(yr,mo,1).getDay();const dim=new Date(yr,mo+1,0).getDate();const cells=[];for(let i=0;i<firstDay;i++)cells.push(null);for(let d=1;d<=dim;d++){const dt=new Date(yr,mo,d);const dk=dateKey(dt);cells.push({d,dk,isToday:dk===todayDK,isViewing:dk===viewDK,color:getDayColor(dk)});}return cells;}

  function addGoal(){if(!newGoal.trim())return;setGoals(p=>[...p,{id:Date.now(),text:newGoal.trim(),deadline:goalDL,done:false,created:todayDK}]);setNewGoal("");setGoalDL("");setShowAddGoal(false);}
  function toggleGoal(id){setGoals(p=>p.map(g=>g.id===id?{...g,done:!g.done}:g));}
  function removeGoal(id){setGoals(p=>p.filter(g=>g.id!==id));}
  function addReminder(){if(!newRemTime)return;setReminders(p=>[...p,{id:Date.now().toString(),label:newRemLabel||"Reminder 🔔",time:newRemTime,enabled:true}]);setNewRemLabel("");setNewRemTime("08:00");setShowAddRem(false);}
  function addAlarm(){if(!newAlarmTime)return;setAlarms(p=>[...p,{id:Date.now().toString(),label:newAlarmLabel||"Alarm ⏰",time:newAlarmTime,enabled:true}]);setNewAlarmLabel("");setNewAlarmTime("07:00");setShowAddAlarm(false);}

  async function fetchInsight(book){
    setInsight(null);setCardFlipped(false);setInsightLoading(true);
    try{
      const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,messages:[{role:"user",content:`Give me one powerful micro-learning insight from "${book.title}" by ${book.author}. Return ONLY valid JSON: {"headline":"punchy 6-8 word title","insight":"2-3 sentence key idea","action":"one concrete thing to do today","quote":"short impactful quote under 20 words"}`}]})});
      const data=await res.json();
      const text=data.content?.map(i=>i.text||"").join("")||"";
      setInsight(JSON.parse(text.replace(/```json|```/g,"").trim()));
      if(lastLearnDate!==todayDK){setLearnStreak(s=>s+1);setLastLearnDate(todayDK);ls_save("p_streak",learnStreak+1);ls_save("p_lastlearn",todayDK);}
    }catch{setInsight({headline:"Try again",insight:"Could not load insight.",action:"",quote:""});}
    setInsightLoading(false);
  }

  const activeGoals=goals.filter(g=>!g.done);
  const doneGoals=goals.filter(g=>g.done);
  const weekStats=getWeekStats();
  const calCells=renderCal();
  const weekDays=getWeekDays();

  return(
    <div style={{minHeight:"100vh",background:C.bg,fontFamily:"'Georgia','Times New Roman',serif",color:C.text,paddingBottom:90}}>

      {notif&&<div style={{position:"fixed",top:20,left:"50%",transform:"translateX(-50%)",zIndex:1000,background:C.cyan,color:"#000",borderRadius:12,padding:"14px 24px",fontWeight:700,fontSize:14,boxShadow:`0 8px 32px ${C.cyan}44`}}>🔔 {notif.title}</div>}

      {alarmFiring&&<div style={{position:"fixed",inset:0,zIndex:999,background:"rgba(0,0,0,0.85)",display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{...card,padding:40,textAlign:"center",border:`2px solid ${C.yellow}`}}><div style={{fontSize:48,marginBottom:16}}>⏰</div><div style={{fontSize:32,fontWeight:700,color:C.yellow,marginBottom:8}}>{alarmFiring.time}</div><div style={{fontSize:16,marginBottom:24}}>{alarmFiring.label}</div><button onClick={()=>setAlarmFiring(null)} style={{background:C.yellow,border:"none",borderRadius:10,padding:"12px 32px",fontFamily:"inherit",fontSize:16,fontWeight:700,cursor:"pointer",color:"#000"}}>Dismiss</button></div></div>}

      {/* HEADER */}
      <div style={{background:"linear-gradient(135deg,#12082a,#0a0a18)",borderBottom:`1px solid ${C.border}`,padding:"18px 16px 14px",position:"sticky",top:0,zIndex:50}}>
        <div style={{maxWidth:520,margin:"0 auto"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
            <div>
              <div style={{fontSize:10,letterSpacing:"0.2em",color:C.muted,textTransform:"uppercase"}}>{DAYS_FULL[viewDate.getDay()]} · Week {getWeekNumber(viewDate)} · {viewDate.getFullYear()}</div>
              <div style={{display:"flex",alignItems:"center",gap:8,marginTop:4}}>
                <button onClick={()=>navDay(-1)} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:6,color:C.muted,fontSize:18,cursor:"pointer",padding:"1px 8px",lineHeight:1}}>‹</button>
                <div style={{fontSize:17,color:isToday?C.cyan:C.text}}>
                  {MONTHS[viewDate.getMonth()]} {viewDate.getDate()}, {viewDate.getFullYear()}
                  {isToday&&<span style={{fontSize:10,color:C.cyan,marginLeft:6,letterSpacing:"0.1em"}}>TODAY</span>}
                  {!isToday&&<span onClick={()=>goDate(todayDK)} style={{fontSize:10,color:C.orange,marginLeft:6,cursor:"pointer"}}>→ Today</span>}
                </div>
                <button onClick={()=>navDay(1)} disabled={isFuture} style={{background:"none",border:`1px solid ${isFuture?C.dim:C.border}`,borderRadius:6,color:isFuture?C.dim:C.muted,fontSize:18,cursor:isFuture?"not-allowed":"pointer",padding:"1px 8px",lineHeight:1}}>›</button>
              </div>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{fontSize:16,fontWeight:700,color:allComplete?C.green:C.purple,fontVariantNumeric:"tabular-nums"}}>{clock}</div>
              <div style={{display:"flex",alignItems:"center",gap:6,justifyContent:"flex-end",marginTop:4}}>
                <div style={{width:44,height:5,background:C.border,borderRadius:3}}><div style={{height:"100%",width:`${progressPct}%`,background:allComplete?C.green:`linear-gradient(90deg,${C.purple},${C.cyan})`,borderRadius:3,transition:"width 0.5s"}}/></div>
                <span style={{fontSize:12,color:allComplete?C.green:C.purple,fontWeight:700}}>{progressPct}%</span>
                {allComplete&&<span>🌟</span>}
              </div>
            </div>
          </div>

          {/* Week strip */}
          <div style={{display:"flex",gap:5}}>
            {weekDays.map(({date,dk})=>{
              const isTodayCell=dk===todayDK;const isV=dk===viewDK;const col=getDayColor(dk);
              return(<div key={dk} onClick={()=>{setTab("today");goDate(dk);}} style={{flex:1,textAlign:"center",cursor:"pointer"}}>
                <div style={{fontSize:9,color:isTodayCell?C.cyan:C.muted,marginBottom:2}}>{DAYS_SHORT[date.getDay()]}</div>
                <div style={{width:"100%",paddingBottom:"100%",borderRadius:5,position:"relative",background:col||(isTodayCell?"#1e1e3a":C.card),border:`2px solid ${isV?C.cyan:isTodayCell?C.purple:col||C.border}`,boxShadow:col===C.green?`0 0 8px ${C.green}44`:isV?`0 0 8px ${C.cyan}44`:"none"}}>
                  <span style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:isTodayCell||isV?700:400,color:col?"#000":isV?C.cyan:isTodayCell?C.cyan:C.muted}}>{date.getDate()}</span>
                </div>
              </div>);
            })}
          </div>
        </div>
      </div>

      {/* TABS */}
      <div style={{maxWidth:520,margin:"0 auto",padding:"10px 14px 0"}}>
        <div style={{display:"flex",gap:6,overflowX:"auto",paddingBottom:4}}>
          {[{id:"today",label:"Today",icon:"☀️",col:C.cyan},{id:"calendar",label:"Calendar",icon:"📅",col:C.purple},{id:"week",label:"Week",icon:"📊",col:C.orange},{id:"ideas",label:"Ideas",icon:"💡",col:C.yellow},{id:"goals",label:"Goals",icon:"🎯",col:C.cyan},{id:"reminders",label:"Reminders",icon:"🔔",col:C.pink},{id:"learn",label:"Learn",icon:"📚",col:C.green}].map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{flexShrink:0,padding:"7px 12px",border:"none",borderRadius:20,background:tab===t.id?t.col:C.card,color:tab===t.id?"#000":C.muted,fontFamily:"inherit",fontSize:12,fontWeight:tab===t.id?700:400,cursor:"pointer",transition:"all 0.2s",display:"flex",alignItems:"center",gap:4,boxShadow:tab===t.id?`0 0 14px ${t.col}55`:"none"}}>
              <span>{t.icon}</span>{t.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{maxWidth:520,margin:"0 auto",padding:"14px 14px 0"}}>

        {/* TODAY */}
        {tab==="today"&&<div>
          <div style={{display:"flex",gap:8,marginBottom:14}}>
            {["office","personal"].map(w=>(
              <button key={w} onClick={()=>setWTab(w)} style={{flex:1,padding:"10px",border:"none",borderRadius:10,background:wTab===w?(w==="office"?C.blue:C.pink):C.card,color:wTab===w?"#fff":C.muted,fontFamily:"inherit",fontSize:13,fontWeight:700,cursor:"pointer",transition:"all 0.2s",boxShadow:wTab===w?`0 0 18px ${w==="office"?C.blue:C.pink}44`:"none"}}>
                {w==="office"?"💼 Office":"🏠 Personal"}
              </button>
            ))}
          </div>

          {wTab==="office"&&<div>
            <Section title="Office Habits" color={C.blue}>
              {OFFICE_HABITS.map(h=><HabitRow key={h.id} habit={h} checked={!!dayData.officeHabits?.[h.id]} color={C.blue} onToggle={()=>toggleOH(h.id)}/>)}
              <ProgBar done={offDone} total={OFFICE_HABITS.length} color={C.blue}/>
            </Section>
            <Section title="Office Tasks" color={C.indigo}>
              <div style={{display:"flex",gap:8,marginBottom:10}}><input value={newTodo} onChange={e=>setNewTodo(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addTodo("office")} placeholder="Add office task…" style={{...inp,flex:1}}/><button onClick={()=>addTodo("office")} style={addBtnS(C.indigo)}>+</button></div>
              {(dayData.officeTodos||[]).length===0&&<div style={{color:C.dim,fontSize:12,textAlign:"center",padding:"8px 0"}}>No tasks yet</div>}
              {(dayData.officeTodos||[]).map(t=><div key={t.id} style={{display:"flex",alignItems:"center",padding:"10px 12px",background:t.done?"#0a0a0a":C.card,border:`1px solid ${C.border}`,borderRadius:9,marginBottom:6,gap:10}}><div onClick={()=>toggleTodo("office",t.id)} style={{width:18,height:18,borderRadius:5,border:`2px solid ${t.done?C.indigo:C.dim}`,background:t.done?C.indigo:"transparent",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0,fontSize:10,color:"#000",fontWeight:700,transition:"all 0.2s"}}>{t.done?"✓":""}</div><span style={{flex:1,fontSize:13,color:t.done?C.dim:C.text,textDecoration:t.done?"line-through":"none"}}>{t.text}</span><button onClick={()=>removeTodo("office",t.id)} style={xBtn}>×</button></div>)}
            </Section>
          </div>}

          {wTab==="personal"&&<div>
            <Section title="Personal Habits" color={C.pink}>
              {PERSONAL_HABITS.map(h=>h.id==="reading"?(
                <div key={h.id} style={{...card,padding:"14px 16px",marginBottom:8,display:"flex",alignItems:"center",gap:12}}>
                  <span style={{fontSize:20}}>{h.icon}</span>
                  <div style={{flex:1}}>
                    <div style={{fontSize:14,color:C.text,marginBottom:6}}>{h.label}</div>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <button onClick={()=>setPages(Math.max(0,(dayData.pages||0)-1))} style={{width:28,height:28,background:"transparent",border:`1px solid ${C.pink}44`,borderRadius:6,color:C.pink,fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>−</button>
                      <span style={{fontSize:18,fontWeight:700,color:C.pink,minWidth:24,textAlign:"center"}}>{dayData.pages||0}</span>
                      <button onClick={()=>setPages((dayData.pages||0)+1)} style={{width:28,height:28,background:"transparent",border:`1px solid ${C.pink}44`,borderRadius:6,color:C.pink,fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>
                      <span style={{fontSize:11,color:C.muted}}>/ 20 goal</span>
                    </div>
                  </div>
                </div>
              ):<HabitRow key={h.id} habit={h} checked={!!dayData.personalHabits?.[h.id]} color={C.pink} onToggle={()=>togglePH(h.id)}/>)}
              <ProgBar done={persDone} total={PERSONAL_HABITS.length} color={C.pink}/>
            </Section>
            <Section title="Personal Tasks" color={C.teal}>
              <div style={{display:"flex",gap:8,marginBottom:10}}><input value={newTodo} onChange={e=>setNewTodo(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addTodo("personal")} placeholder="Add personal task…" style={{...inp,flex:1}}/><button onClick={()=>addTodo("personal")} style={addBtnS(C.teal)}>+</button></div>
              {(dayData.personalTodos||[]).length===0&&<div style={{color:C.dim,fontSize:12,textAlign:"center",padding:"8px 0"}}>No tasks yet</div>}
              {(dayData.personalTodos||[]).map(t=><div key={t.id} style={{display:"flex",alignItems:"center",padding:"10px 12px",background:t.done?"#0a0a0a":C.card,border:`1px solid ${C.border}`,borderRadius:9,marginBottom:6,gap:10}}><div onClick={()=>toggleTodo("personal",t.id)} style={{width:18,height:18,borderRadius:5,border:`2px solid ${t.done?C.teal:C.dim}`,background:t.done?C.teal:"transparent",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0,fontSize:10,color:"#000",fontWeight:700,transition:"all 0.2s"}}>{t.done?"✓":""}</div><span style={{flex:1,fontSize:13,color:t.done?C.dim:C.text,textDecoration:t.done?"line-through":"none"}}>{t.text}</span><button onClick={()=>removeTodo("personal",t.id)} style={xBtn}>×</button></div>)}
            </Section>
            <Section title="🏆 Today's Achievements" color={C.yellow}>
              <div style={{display:"flex",gap:8,marginBottom:10}}><input value={newAch} onChange={e=>setNewAch(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addAch()} placeholder="What did you achieve today?" style={{...inp,flex:1}}/><button onClick={addAch} style={addBtnS(C.yellow)}>+</button></div>
              {(dayData.achievements||[]).length===0&&<div style={{color:C.dim,fontSize:12,textAlign:"center",padding:"8px 0"}}>Log your wins!</div>}
              {(dayData.achievements||[]).map(a=><div key={a.id} style={{display:"flex",gap:10,marginBottom:8,alignItems:"flex-start"}}><span style={{color:C.yellow,marginTop:2}}>★</span><span style={{flex:1,fontSize:14,color:C.text}}>{a.text}</span><button onClick={()=>removeAch(a.id)} style={xBtn}>×</button></div>)}
            </Section>
          </div>}

          <Section title="📔 Daily Journal" color={C.purple}>
            {JOURNAL_PROMPTS.map(p=>(
              <div key={p.id} style={{marginBottom:14}}>
                <div style={{fontSize:11,color:p.color,letterSpacing:"0.1em",marginBottom:6,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <div style={{display:"flex",alignItems:"center",gap:6}}><span>{p.icon}</span>{p.label.toUpperCase()}</div>
                  <span style={{fontSize:10,fontWeight:400}}>
                    {savedFields[p.id]==="saving"&&<span style={{color:C.muted}}>saving…</span>}
                    {savedFields[p.id]==="saved"&&<span style={{color:C.green}}>✓ saved</span>}
                    {!savedFields[p.id]&&dayData.journal?.[p.id]?.trim()&&<span style={{color:C.dim}}>✓ filled</span>}
                  </span>
                </div>
                <textarea value={dayData.journal?.[p.id]||""} onChange={e=>setJField(p.id,e.target.value)} placeholder="Write here…" rows={2}
                  style={{...inp,resize:"vertical",lineHeight:1.6}}
                  onFocus={e=>e.target.style.borderColor=p.color}
                  onBlur={e=>e.target.style.borderColor=C.border}/>
              </div>
            ))}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{fontSize:11,color:C.muted}}>Auto-saves as you type</span>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:12,color:C.muted}}>{journalDone}/{JOURNAL_PROMPTS.length} filled</span>
                <div style={{width:80,height:4,background:C.border,borderRadius:2}}><div style={{height:"100%",width:`${(journalDone/JOURNAL_PROMPTS.length)*100}%`,background:C.purple,borderRadius:2,transition:"width 0.3s"}}/></div>
              </div>
            </div>
          </Section>
        </div>}

        {/* CALENDAR */}
        {tab==="calendar"&&<div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <button onClick={()=>setCalDate(d=>{const n=new Date(d);n.setMonth(n.getMonth()-1);return n;})} style={navBtn}>‹</button>
            <div style={{fontSize:18,color:C.text}}>{MONTHS[calDate.getMonth()]} {calDate.getFullYear()}</div>
            <button onClick={()=>setCalDate(d=>{const n=new Date(d);n.setMonth(n.getMonth()+1);return n;})} style={navBtn}>›</button>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4,marginBottom:8}}>
            {DAYS_SHORT.map(d=><div key={d} style={{textAlign:"center",fontSize:10,color:C.muted}}>{d}</div>)}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4}}>
            {calCells.map((cell,i)=>!cell?<div key={`e${i}`}/>:(
              <div key={cell.dk} onClick={()=>{setTab("today");goDate(cell.dk);}} style={{aspectRatio:"1",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:cell.isToday?700:400,cursor:"pointer",background:cell.color||(cell.isToday?"#1e1e3a":C.card),border:`1px solid ${cell.isViewing?C.cyan:cell.isToday?C.purple:cell.color||C.border}`,color:cell.color?"#000":cell.isToday?C.purple:C.text,boxShadow:cell.color===C.green?`0 0 10px ${C.green}55`:"",transition:"all 0.15s"}}>
                {cell.d}
              </div>
            ))}
          </div>
          <div style={{display:"flex",gap:14,justifyContent:"center",marginTop:14,flexWrap:"wrap"}}>
            {[[C.green,"All done 🌟"],[C.yellow,"Good progress"],[C.orange,"Partial"],["#1e1e3a","Today"]].map(([col,label])=>(
              <div key={label} style={{display:"flex",alignItems:"center",gap:5,fontSize:11,color:C.muted}}><div style={{width:12,height:12,borderRadius:3,background:col}}/>{label}</div>
            ))}
          </div>
        </div>}

        {/* WEEK */}
        {tab==="week"&&<div>
          <Section title={`Week ${getWeekNumber(now)} · ${MONTHS_SHORT[now.getMonth()]} ${now.getFullYear()}`} color={C.orange}>
            <div style={{display:"flex",gap:8,alignItems:"flex-end",height:120,marginBottom:14}}>
              {weekStats.map(({date,dk,done,total,pct})=>{
                const isT=dk===todayDK;const col=pct===100?C.green:pct>=60?C.yellow:pct>0?C.orange:C.border;
                return(<div key={dk} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
                  <div style={{fontSize:10,color:C.muted}}>{pct}%</div>
                  <div style={{width:"100%",height:80,background:C.card,borderRadius:6,display:"flex",alignItems:"flex-end",overflow:"hidden",border:`1px solid ${isT?C.orange:C.border}`}}>
                    <div style={{width:"100%",height:`${pct}%`,background:col,transition:"height 0.5s"}}/>
                  </div>
                  <div style={{fontSize:10,color:isT?C.orange:C.muted,fontWeight:isT?700:400}}>{DAYS_SHORT[date.getDay()]}</div>
                  <div style={{fontSize:9,color:C.dim}}>{done}/{total}</div>
                </div>);
              })}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:14}}>
              {[["Days active",weekStats.filter(d=>d.done>0).length+"/7",C.cyan],["Full days",weekStats.filter(d=>d.pct===100).length+"/7",C.green],["Avg score",Math.round(weekStats.reduce((a,d)=>a+d.pct,0)/7)+"%",C.orange]].map(([l,v,col])=>(
                <div key={l} style={{...card,padding:"12px 10px",textAlign:"center"}}><div style={{fontSize:18,fontWeight:700,color:col}}>{v}</div><div style={{fontSize:9,color:C.muted,marginTop:2}}>{l.toUpperCase()}</div></div>
              ))}
            </div>
          </Section>
          <Section title="📝 Week Review" color={C.orange}>
            {[{id:"highlights",label:"✨ Highlights",ph:"What went really well?"},{id:"lowlights",label:"🔧 What could've been better",ph:"Honest reflection…"},{id:"nextWeek",label:"🚀 Intentions for next week",ph:"What will you focus on?"}].map(f=>(
              <div key={f.id} style={{marginBottom:12}}>
                <div style={{fontSize:11,color:C.orange,marginBottom:5}}>{f.label}</div>
                <textarea value={weekReview[f.id]||""} onChange={e=>setWeekReview(p=>({...p,[f.id]:e.target.value}))} placeholder={f.ph} rows={3} style={{...inp,resize:"vertical",lineHeight:1.6}} onFocus={e=>e.target.style.borderColor=C.orange} onBlur={e=>e.target.style.borderColor=C.border}/>
              </div>
            ))}
          </Section>
          <Section title="📆 Past Weeks" color={C.dim}>
            {[1,2,3,4].map(wa=>{
              const ref=new Date();ref.setDate(ref.getDate()-wa*7);
              const wk=weekKey(ref);
              const review=ls_load(`p_wr_${wk}`,null);
              const wdays=[];for(let i=0;i<7;i++){const d=new Date(ref);d.setDate(ref.getDate()-ref.getDay()+i);wdays.push(dateKey(d));}
              const scores=wdays.map(dk=>{const d=getDayData(dk);const done=OFFICE_HABITS.filter(h=>d.officeHabits?.[h.id]).length+PERSONAL_HABITS.filter(h=>d.personalHabits?.[h.id]).length;return Math.round((done/(OFFICE_HABITS.length+PERSONAL_HABITS.length))*100);});
              const avg=Math.round(scores.reduce((a,b)=>a+b,0)/7);
              return(<div key={wk} style={{...card,padding:"12px 14px",marginBottom:8}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div style={{fontSize:13,color:C.text}}>{wa} week{wa>1?"s":""} ago</div>
                  <div style={{fontSize:14,fontWeight:700,color:avg>=80?C.green:avg>=50?C.yellow:C.orange}}>{avg}% avg</div>
                </div>
                <div style={{display:"flex",gap:4,marginTop:8}}>{scores.map((s,i)=><div key={i} style={{flex:1,height:6,borderRadius:3,background:s>=80?C.green:s>=50?C.yellow:s>0?C.orange:C.border}}/>)}</div>
                {review?.highlights&&<div style={{fontSize:11,color:C.muted,marginTop:8,lineHeight:1.5}}>✨ {review.highlights.slice(0,80)}{review.highlights.length>80?"…":""}</div>}
              </div>);
            })}
          </Section>
        </div>}

        {/* IDEAS */}
        {tab==="ideas"&&<div>
          <Section title="💡 Thoughts & Ideas" color={C.yellow}>
            <div style={{display:"flex",gap:8,marginBottom:12}}><input value={newIdea} onChange={e=>setNewIdea(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addIdea()} placeholder="Capture a thought or idea…" style={{...inp,flex:1}}/><button onClick={addIdea} style={addBtnS(C.yellow)}>+</button></div>
            {(dayData.ideas||[]).length===0&&<div style={{textAlign:"center",color:C.dim,fontSize:13,padding:"20px 0"}}>Your ideas for today appear here</div>}
            {(dayData.ideas||[]).map(idea=>(
              <div key={idea.id} style={{...card,padding:"14px 16px",marginBottom:10,borderLeft:`3px solid ${C.yellow}`}}>
                <div style={{display:"flex",gap:10,alignItems:"flex-start"}}>
                  <span style={{fontSize:18}}>💡</span>
                  <div style={{flex:1}}><div style={{fontSize:14,color:C.text,lineHeight:1.6}}>{idea.text}</div><div style={{fontSize:10,color:C.muted,marginTop:4}}>{new Date(idea.ts).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"})}</div></div>
                  <button onClick={()=>removeIdea(idea.id)} style={xBtn}>×</button>
                </div>
              </div>
            ))}
          </Section>
          <Section title="🗂 Previous Ideas" color={C.dim}>
            {[1,2,3,4,5,6].map(da=>{
              const d=new Date();d.setDate(d.getDate()-da);
              const dk=dateKey(d);const data=getDayData(dk);const ideas=data.ideas||[];
              if(ideas.length===0)return null;
              return(<div key={dk} style={{marginBottom:12}}>
                <div style={{fontSize:10,color:C.muted,letterSpacing:"0.1em",marginBottom:6}}>{MONTHS_SHORT[d.getMonth()]} {d.getDate()}</div>
                {ideas.map(idea=><div key={idea.id} style={{...card,padding:"10px 14px",marginBottom:6,borderLeft:`2px solid ${C.yellow}55`}}><div style={{fontSize:13,color:C.muted,lineHeight:1.5}}>💡 {idea.text}</div></div>)}
              </div>);
            }).filter(Boolean)}
          </Section>
        </div>}

        {/* GOALS */}
        {tab==="goals"&&<div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <div style={{fontSize:13,color:C.muted}}>{activeGoals.length} active · {doneGoals.length} achieved</div>
            <button onClick={()=>setShowAddGoal(v=>!v)} style={{background:C.cyan,border:"none",borderRadius:8,padding:"8px 14px",color:"#000",fontFamily:"inherit",fontSize:13,fontWeight:700,cursor:"pointer"}}>+ New Goal</button>
          </div>
          {showAddGoal&&<div style={{...card,padding:16,marginBottom:14}}>
            <input value={newGoal} onChange={e=>setNewGoal(e.target.value)} placeholder="e.g. Run a 5K…" style={{...inp,marginBottom:8}}/>
            <div style={{display:"flex",gap:8,marginBottom:12,alignItems:"center"}}><label style={{fontSize:12,color:C.muted,whiteSpace:"nowrap"}}>Target:</label><input type="date" value={goalDL} onChange={e=>setGoalDL(e.target.value)} style={{...inp,flex:1,colorScheme:"dark"}}/></div>
            <div style={{display:"flex",gap:8}}>
              <button onClick={addGoal} style={{flex:1,background:C.cyan,border:"none",borderRadius:8,padding:"10px",color:"#000",fontFamily:"inherit",fontSize:14,fontWeight:700,cursor:"pointer"}}>Add</button>
              <button onClick={()=>setShowAddGoal(false)} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:8,padding:"10px 14px",color:C.muted,fontFamily:"inherit",fontSize:14,cursor:"pointer"}}>Cancel</button>
            </div>
          </div>}
          {activeGoals.length===0&&!showAddGoal&&<div style={{textAlign:"center",padding:"40px 20px",...card,border:`1px dashed ${C.border}`}}><div style={{fontSize:36,marginBottom:10}}>🎯</div><div style={{color:C.dim,fontSize:13}}>No active goals. Set one to get started!</div></div>}
          {activeGoals.map(g=><GoalCard key={g.id} goal={g} onToggle={toggleGoal} onRemove={removeGoal}/>)}
          {doneGoals.length>0&&<><div style={{fontSize:10,color:C.muted,letterSpacing:"0.15em",textTransform:"uppercase",margin:"20px 0 10px"}}>Achieved ✦</div>{doneGoals.map(g=><GoalCard key={g.id} goal={g} onToggle={toggleGoal} onRemove={removeGoal} done/>)}</>}
        </div>}

        {/* REMINDERS */}
        {tab==="reminders"&&<div>
          {notifPerm!=="granted"&&<div style={{background:"#1a1a0a",border:`1px solid ${C.yellow}`,borderRadius:12,padding:"14px 16px",marginBottom:14,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{fontSize:13,color:C.yellow}}>🔔 Enable notifications</div>
            <button onClick={()=>{if("Notification"in window)Notification.requestPermission().then(p=>setNotifPerm(p));}} style={{background:C.yellow,border:"none",borderRadius:8,padding:"7px 14px",fontFamily:"inherit",fontSize:12,fontWeight:700,cursor:"pointer",color:"#000"}}>Enable</button>
          </div>}
          <div style={{...card,padding:16,marginBottom:14,textAlign:"center"}}>
            <div style={{fontSize:34,fontWeight:700,color:C.cyan,fontVariantNumeric:"tabular-nums"}}>{clock}</div>
            <div style={{fontSize:11,color:C.muted,marginTop:4}}>{DAYS_FULL[now.getDay()]}, {MONTHS[now.getMonth()]} {now.getDate()}</div>
          </div>
          <Section title="⏰ Alarms" color={C.yellow}>
            {alarms.map(a=><div key={a.id} style={{...card,padding:"12px 14px",marginBottom:8,display:"flex",alignItems:"center",gap:12}}>
              <div style={{flex:1}}><div style={{fontSize:18,fontWeight:700,color:a.enabled?C.yellow:C.dim}}>{a.time}</div><div style={{fontSize:12,color:C.muted}}>{a.label}</div></div>
              <Toggle on={a.enabled} color={C.yellow} onToggle={()=>setAlarms(p=>p.map(x=>x.id===a.id?{...x,enabled:!x.enabled}:x))}/>
              <button onClick={()=>setAlarms(p=>p.filter(x=>x.id!==a.id))} style={xBtn}>×</button>
            </div>)}
            {showAddAlarm?<div style={{...card,padding:14,marginTop:8}}>
              <div style={{display:"flex",gap:8,marginBottom:8}}>
                <input type="time" value={newAlarmTime} onChange={e=>setNewAlarmTime(e.target.value)} style={{...inp,flex:1,colorScheme:"dark"}}/>
                <input value={newAlarmLabel} onChange={e=>setNewAlarmLabel(e.target.value)} placeholder="Label" style={{...inp,flex:1}}/>
              </div>
              <div style={{display:"flex",gap:8}}>
                <button onClick={addAlarm} style={{flex:1,background:C.yellow,border:"none",borderRadius:8,padding:"9px",color:"#000",fontFamily:"inherit",fontWeight:700,cursor:"pointer"}}>Add Alarm</button>
                <button onClick={()=>setShowAddAlarm(false)} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:8,padding:"9px 12px",color:C.muted,fontFamily:"inherit",cursor:"pointer"}}>Cancel</button>
              </div>
            </div>:<button onClick={()=>setShowAddAlarm(true)} style={{width:"100%",background:"transparent",border:`1px dashed ${C.border}`,borderRadius:10,padding:"11px",color:C.muted,fontFamily:"inherit",fontSize:13,cursor:"pointer",marginTop:4}}>+ Add Alarm</button>}
          </Section>
          <Section title="🔔 Reminders" color={C.cyan}>
            {reminders.map(r=><div key={r.id} style={{...card,padding:"12px 14px",marginBottom:8,display:"flex",alignItems:"center",gap:12}}>
              <div style={{flex:1}}><div style={{fontSize:14,color:r.enabled?C.text:C.dim}}>{r.label}</div><div style={{fontSize:12,color:r.enabled?C.cyan:C.dim}}>{r.time} · daily</div></div>
              <Toggle on={r.enabled} color={C.cyan} onToggle={()=>setReminders(p=>p.map(x=>x.id===r.id?{...x,enabled:!x.enabled}:x))}/>
              <button onClick={()=>setReminders(p=>p.filter(x=>x.id!==r.id))} style={xBtn}>×</button>
            </div>)}
            {showAddRem?<div style={{...card,padding:14,marginTop:8}}>
              <div style={{display:"flex",gap:8,marginBottom:8}}>
                <input value={newRemLabel} onChange={e=>setNewRemLabel(e.target.value)} placeholder="Reminder label" style={{...inp,flex:1}}/>
                <input type="time" value={newRemTime} onChange={e=>setNewRemTime(e.target.value)} style={{...inp,flex:"0 0 100px",colorScheme:"dark"}}/>
              </div>
              <div style={{display:"flex",gap:8}}>
                <button onClick={addReminder} style={{flex:1,background:C.cyan,border:"none",borderRadius:8,padding:"9px",color:"#000",fontFamily:"inherit",fontWeight:700,cursor:"pointer"}}>Add</button>
                <button onClick={()=>setShowAddRem(false)} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:8,padding:"9px 12px",color:C.muted,fontFamily:"inherit",cursor:"pointer"}}>Cancel</button>
              </div>
            </div>:<button onClick={()=>setShowAddRem(true)} style={{width:"100%",background:"transparent",border:`1px dashed ${C.border}`,borderRadius:10,padding:"11px",color:C.muted,fontFamily:"inherit",fontSize:13,cursor:"pointer",marginTop:4}}>+ Add Reminder</button>}
          </Section>
          <button onClick={()=>{playAlarm("bell");setNotif({title:"Test 🔔"});setTimeout(()=>setNotif(null),3000);}} style={{width:"100%",...card,padding:"12px",color:C.muted,fontFamily:"inherit",fontSize:13,cursor:"pointer",border:`1px solid ${C.border}`}}>🔊 Test Sound</button>
        </div>}

        {/* LEARN */}
        {tab==="learn"&&<div>
          {learnView==="home"&&<div>
            <div style={{display:"flex",gap:8,marginBottom:18}}>
              {[["🔥",learnStreak,"Streak"],["💾",savedInsights.length,"Saved"],["📚",library.length,"Books"]].map(([icon,val,label])=>(
                <div key={label} style={{flex:1,...card,padding:"12px 10px",textAlign:"center"}}><div style={{fontSize:20,marginBottom:4}}>{icon}</div><div style={{fontSize:20,fontWeight:700,color:C.green}}>{val}</div><div style={{fontSize:9,color:C.muted}}>{label.toUpperCase()}</div></div>
              ))}
            </div>
            <Section title="📚 Book Library" color={C.green}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                {library.map(book=>(
                  <div key={book.id} style={{...card,padding:"14px 12px",cursor:"pointer"}} onClick={()=>{setActiveBook(book);setLearnView("book");fetchInsight(book);}}>
                    <div style={{fontSize:28,marginBottom:8}}>{book.emoji}</div>
                    <div style={{fontSize:13,color:C.text,lineHeight:1.3,marginBottom:2}}>{book.title}</div>
                    <div style={{fontSize:11,color:C.muted,marginBottom:10}}>{book.author}</div>
                    <div style={{background:C.green,borderRadius:6,padding:"6px",color:"#000",fontSize:11,fontWeight:700,textAlign:"center"}}>Learn →</div>
                  </div>
                ))}
              </div>
            </Section>
            {savedInsights.length>0&&<Section title="♡ Saved Insights" color={C.teal}>
              {savedInsights.slice(0,5).map(ins=>(
                <div key={ins.id} style={{...card,padding:"12px 14px",marginBottom:8,borderLeft:`3px solid ${C.teal}`}}>
                  <div style={{fontSize:11,color:C.muted,marginBottom:4}}>{ins.book} · {ins.date}</div>
                  <div style={{fontSize:13,color:C.teal,marginBottom:4}}>{ins.headline}</div>
                  <div style={{fontSize:12,color:C.muted,lineHeight:1.5}}>{ins.insight}</div>
                </div>
              ))}
            </Section>}
          </div>}
          {learnView==="book"&&activeBook&&<div>
            <button onClick={()=>setLearnView("home")} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontFamily:"inherit",fontSize:13,padding:"0 0 14px",display:"flex",alignItems:"center",gap:5}}>← Back</button>
            <div style={{...card,padding:20,textAlign:"center",marginBottom:14,background:"linear-gradient(135deg,#0d1a0d,#0a0a1a)"}}>
              <div style={{fontSize:44,marginBottom:8}}>{activeBook.emoji}</div>
              <div style={{fontSize:17,color:C.text,marginBottom:4}}>{activeBook.title}</div>
              <div style={{fontSize:13,color:C.muted,marginBottom:14}}>by {activeBook.author}</div>
              <button onClick={()=>fetchInsight(activeBook)} style={{background:C.green,border:"none",borderRadius:8,padding:"9px 20px",color:"#000",fontFamily:"inherit",fontSize:13,fontWeight:700,cursor:"pointer"}}>{insightLoading?"Loading…":"✦ New Insight"}</button>
            </div>
            {insightLoading&&<div style={{...card,padding:40,textAlign:"center",color:C.muted}}>✦ Generating insight…</div>}
            {insight&&!insightLoading&&<div>
              <div onClick={()=>setCardFlipped(f=>!f)} style={{cursor:"pointer",marginBottom:10}}>
                {!cardFlipped?(
                  <div style={{background:"linear-gradient(135deg,#0d1a12,#0a0a12)",border:`1px solid ${C.green}44`,borderRadius:16,padding:24,minHeight:180}}>
                    <div style={{fontSize:9,letterSpacing:"0.2em",color:C.muted,marginBottom:14}}>TODAY'S INSIGHT · TAP TO FLIP</div>
                    <div style={{fontSize:18,color:C.green,lineHeight:1.4,marginBottom:12}}>{insight.headline}</div>
                    <div style={{fontSize:13,color:C.muted,lineHeight:1.8}}>{insight.insight}</div>
                  </div>
                ):(
                  <div style={{background:"linear-gradient(135deg,#1a0d1a,#0a0a12)",border:`1px solid ${C.purple}44`,borderRadius:16,padding:24,minHeight:180}}>
                    <div style={{fontSize:9,letterSpacing:"0.2em",color:C.muted,marginBottom:14}}>ACTION STEP · TAP TO FLIP BACK</div>
                    <div style={{fontSize:15,color:C.purple,lineHeight:1.7,marginBottom:16}}>⚡ {insight.action}</div>
                    {insight.quote&&<div style={{borderLeft:`2px solid ${C.purple}44`,paddingLeft:14,fontSize:12,color:C.muted,fontStyle:"italic",lineHeight:1.6}}>"{insight.quote}"</div>}
                  </div>
                )}
              </div>
              <div style={{fontSize:10,color:C.dim,textAlign:"center",marginBottom:12}}>Tap card for action step</div>
              <button onClick={()=>{if(insight&&activeBook)setSavedInsights(p=>[{...insight,book:activeBook.title,date:todayDK,id:Date.now()},...p.slice(0,49)]);}} style={{width:"100%",...card,padding:"11px",color:C.teal,fontFamily:"inherit",fontSize:13,cursor:"pointer"}}>♡ Save insight</button>
            </div>}
          </div>}
        </div>}

      </div>

      {/* BOTTOM BAR */}
      <div style={{position:"fixed",bottom:0,left:0,right:0,background:"#0a0a12ee",backdropFilter:"blur(12px)",borderTop:`1px solid ${C.border}`,padding:"10px 16px",display:"flex",justifyContent:"center",gap:20,zIndex:40,flexWrap:"wrap"}}>
        {[{label:"Office",val:`${offDone}/${OFFICE_HABITS.length}`,col:C.blue},{label:"Personal",val:`${persDone}/${PERSONAL_HABITS.length}`,col:C.pink},{label:"Tasks",val:`${todosDone}/${todosTotal||0}`,col:C.teal},{label:"Journal",val:`${journalDone}/${JOURNAL_PROMPTS.length}`,col:C.purple},{label:"Streak 🔥",val:learnStreak,col:C.green}].map(s=>(
          <div key={s.label} style={{textAlign:"center"}}><div style={{fontSize:14,fontWeight:700,color:s.col}}>{s.val}</div><div style={{fontSize:9,color:C.dim,letterSpacing:"0.06em"}}>{s.label.toUpperCase()}</div></div>
        ))}
        {allComplete&&<div style={{fontSize:18}}>🌟</div>}
      </div>

      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}::-webkit-scrollbar{width:4px;height:4px}::-webkit-scrollbar-track{background:#0a0a12}::-webkit-scrollbar-thumb{background:#2a2a3a;border-radius:2px}input[type=time]::-webkit-calendar-picker-indicator,input[type=date]::-webkit-calendar-picker-indicator{filter:invert(0.5)}`}</style>
    </div>
  );
}
