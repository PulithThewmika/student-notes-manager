import { useState, useEffect, useRef, useCallback } from "react";
import { useTheme } from "./ThemeContext";
import { useNavigate } from "react-router-dom";

/* ── Font injection ── */
(() => {
  if (document.querySelector('link[data-notes-fonts]')) return;
  const l = document.createElement("link");
  l.rel = "stylesheet";
  l.dataset.notesFonts = "1";
  l.href = "https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap";
  document.head.appendChild(l);
})();

/* ── CSS VARIABLES (injected via data-theme on <html>) ── */
const G = `
  :root, [data-theme="dark"] {
    --bg: #0f0f0d; --bg2: #131310; --bg3: #1a1a17;
    --border: #222220; --border2: #2e2e2b;
    --text: #e8e5de; --text2: #b8b5ae; --text3: #706d66; --text4: #3f3d38;
    --accent: #1D9E75; --accent-dim: rgba(29,158,117,0.12);
    --accent-bg: rgba(29,158,117,0.07); --accent-border: rgba(29,158,117,0.4);
    --sidebar-w: 230px;
    --red: #e05050; --red-dim: rgba(224,80,80,0.1);
    --amber: #d4900a; --amber-dim: rgba(212,144,10,0.12);
    --blue: #3b82f6; --blue-dim: rgba(59,130,246,0.12);
    --purple: #8b5cf6; --purple-dim: rgba(139,92,246,0.12);
  }
  [data-theme="light"] {
    --bg: #f5f4f0; --bg2: #ffffff; --bg3: #f0ede8;
    --border: #e8e6e0; --border2: #d4d1ca;
    --text: #1a1916; --text2: #4a4844; --text3: #9e9c96; --text4: #c8c6be;
    --accent: #1D9E75; --accent-dim: rgba(29,158,117,0.1);
    --accent-bg: rgba(29,158,117,0.06); --accent-border: rgba(29,158,117,0.35);
    --sidebar-w: 230px;
    --red: #c0392b; --red-dim: rgba(192,57,43,0.08);
    --amber: #b07010; --amber-dim: rgba(176,112,16,0.1);
    --blue: #2563eb; --blue-dim: rgba(37,99,235,0.1);
    --purple: #7c3aed; --purple-dim: rgba(124,58,237,0.1);
  }

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body, #root { height: 100%; }
  body { font-family: 'Plus Jakarta Sans', sans-serif; background: var(--bg); color: var(--text); overflow: hidden; }

  @keyframes fadeIn    { from { opacity: 0 } to { opacity: 1 } }
  @keyframes fadeUp    { from { opacity: 0; transform: translateY(10px) } to { opacity: 1; transform: translateY(0) } }
  @keyframes popIn     { from { opacity: 0; transform: scale(0.95) } to { opacity: 1; transform: scale(1) } }
  @keyframes toastIn   { from { opacity: 0; transform: translateX(20px) } to { opacity: 1; transform: translateX(0) } }
  @keyframes toastOut  { from { opacity: 1; transform: translateX(0) } to { opacity: 0; transform: translateX(20px) } }
  @keyframes shimmer   { 0% { background-position: -400px 0 } 100% { background-position: 400px 0 } }
  @keyframes pulse2    { 0%,100% { opacity: 0.5 } 50% { opacity: 1 } }
  @keyframes glow      { 0%,100% { box-shadow: 0 0 0 0 rgba(29,158,117,0.3) } 50% { box-shadow: 0 0 0 6px rgba(29,158,117,0) } }
  @keyframes slideLeft { from { opacity: 0; transform: translateX(16px) } to { opacity: 1; transform: translateX(0) } }

  .app-layout { display: flex; height: 100vh; overflow: hidden; }

  .sidebar {
    width: var(--sidebar-w); background: var(--bg2); border-right: 1px solid var(--border);
    display: flex; flex-direction: column; flex-shrink: 0; overflow: hidden;
    transition: width 0.3s cubic-bezier(.25,.46,.45,.94);
  }
  .sidebar.collapsed { width: 64px; }

  .main-area { flex: 1; display: flex; flex-direction: column; overflow: hidden; background: var(--bg); }

  .editor-panel {
    width: 420px; flex-shrink: 0; background: var(--bg2); border-left: 1px solid var(--border);
    display: flex; flex-direction: column; overflow: hidden;
    transition: width 0.3s cubic-bezier(.25,.46,.45,.94);
  }
  .editor-panel.hidden { width: 0; border-left: none; overflow: hidden; }

  .nav-item {
    display: flex; align-items: center; gap: 10px; padding: 9px 14px; border-radius: 9px;
    font-size: 13px; font-weight: 500; color: var(--text3); cursor: pointer;
    transition: all 0.15s; white-space: nowrap; border: none; background: none;
    width: 100%; text-align: left; letter-spacing: -0.01em;
  }
  .nav-item:hover { background: var(--bg3); color: var(--text2); }
  .nav-item.active { background: var(--accent-dim); color: var(--accent); }

  .note-card {
    background: var(--bg2); border: 1px solid var(--border); border-radius: 14px;
    padding: 16px 18px; cursor: pointer; transition: all 0.18s; position: relative;
    overflow: hidden; animation: popIn 0.25s ease both;
  }
  .note-card:hover { border-color: var(--border2); transform: translateY(-1px); box-shadow: 0 6px 20px rgba(0,0,0,0.18); }
  .note-card.selected { border-color: var(--accent-border); background: var(--accent-bg); }
  .note-card.pinned::after {
    content: ''; position: absolute; top: 0; right: 0; width: 0; height: 0;
    border-style: solid; border-width: 0 22px 22px 0;
    border-color: transparent var(--accent) transparent transparent;
  }

  .tag-pill {
    display: inline-flex; align-items: center; gap: 5px; padding: 3px 9px; border-radius: 20px;
    font-size: 10.5px; font-weight: 500; font-family: 'JetBrains Mono', monospace;
    background: var(--bg3); color: var(--text3); border: 1px solid var(--border);
    cursor: pointer; transition: all 0.15s; white-space: nowrap;
  }
  .tag-pill:hover { border-color: var(--accent-border); color: var(--accent); }
  .tag-pill.active { background: var(--accent-dim); color: var(--accent); border-color: var(--accent-border); }

  .btn-primary {
    display: inline-flex; align-items: center; gap: 7px; background: var(--accent); color: #fff;
    border: none; border-radius: 9px; padding: 10px 18px; font-size: 13px; font-weight: 600;
    font-family: 'Plus Jakarta Sans', sans-serif; cursor: pointer; transition: all 0.18s; letter-spacing: -0.01em;
  }
  .btn-primary:hover { background: #17876a; transform: translateY(-1px); box-shadow: 0 6px 18px rgba(29,158,117,0.25); }
  .btn-primary:active { transform: scale(0.97); }

  .btn-ghost {
    display: inline-flex; align-items: center; gap: 7px; background: transparent; color: var(--text3);
    border: 1px solid var(--border2); border-radius: 9px; padding: 8px 14px; font-size: 12.5px;
    font-weight: 500; font-family: 'Plus Jakarta Sans', sans-serif; cursor: pointer;
    transition: all 0.18s; letter-spacing: -0.01em;
  }
  .btn-ghost:hover { border-color: var(--text3); color: var(--text); }

  .icon-btn {
    display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px;
    border-radius: 8px; background: transparent; border: none; cursor: pointer;
    color: var(--text3); transition: all 0.15s;
  }
  .icon-btn:hover { background: var(--bg3); color: var(--text); }
  .icon-btn.active { background: var(--accent-dim); color: var(--accent); }

  .app-input {
    background: var(--bg3); border: 1px solid var(--border); border-radius: 9px;
    padding: 9px 14px; font-size: 13px; font-family: 'Plus Jakarta Sans', sans-serif;
    color: var(--text); outline: none; transition: border-color 0.2s, box-shadow 0.2s; width: 100%;
  }
  .app-input::placeholder { color: var(--text4); }
  .app-input:focus { border-color: var(--accent-border); box-shadow: 0 0 0 3px var(--accent-dim); }

  .note-editor {
    flex: 1; background: transparent; border: none; outline: none; resize: none;
    font-size: 14px; line-height: 1.75; font-family: 'Plus Jakarta Sans', sans-serif;
    color: var(--text); padding: 0; width: 100%;
  }

  .toast {
    position: fixed; bottom: 28px; right: 28px; z-index: 9999;
    background: var(--bg3); border: 1px solid var(--border2); border-radius: 12px;
    padding: 12px 18px; font-size: 13px; font-weight: 500; color: var(--text);
    display: flex; align-items: center; gap: 10px; box-shadow: 0 12px 36px rgba(0,0,0,0.4);
    animation: toastIn 0.3s ease both; font-family: 'Plus Jakarta Sans', sans-serif; max-width: 320px;
  }
  .toast.out { animation: toastOut 0.25s ease both; }

  .color-dot {
    width: 18px; height: 18px; border-radius: 50%; cursor: pointer;
    border: 2px solid transparent; transition: all 0.15s; flex-shrink: 0;
  }
  .color-dot:hover { transform: scale(1.2); }
  .color-dot.selected { border-color: var(--text); }

  .modal-overlay {
    position: fixed; inset: 0; z-index: 500; background: rgba(0,0,0,0.6);
    backdrop-filter: blur(6px); display: flex; align-items: center; justify-content: center;
    animation: fadeIn 0.2s ease both;
  }
  .modal-box {
    background: var(--bg2); border: 1px solid var(--border); border-radius: 20px;
    padding: 32px; width: 100%; max-width: 520px; box-shadow: 0 24px 64px rgba(0,0,0,0.5);
    animation: popIn 0.25s ease both; max-height: 90vh; overflow-y: auto;
  }

  .check-row {
    display: flex; align-items: center; gap: 10px; padding: 6px 0;
    border-bottom: 1px solid var(--border); transition: opacity 0.2s;
  }
  .check-row:last-child { border-bottom: none; }
  .check-row.done { opacity: 0.45; }
  .check-box {
    width: 16px; height: 16px; border-radius: 4px; border: 1px solid var(--border2);
    background: transparent; cursor: pointer; display: flex; align-items: center;
    justify-content: center; flex-shrink: 0; transition: all 0.15s;
  }
  .check-box.checked { background: var(--accent); border-color: var(--accent); }

  .focus-overlay {
    position: fixed; inset: 0; z-index: 200; background: var(--bg);
    display: flex; align-items: center; justify-content: center; animation: fadeIn 0.3s ease;
  }

  .dropdown {
    position: absolute; z-index: 100; background: var(--bg2); border: 1px solid var(--border);
    border-radius: 12px; padding: 6px; box-shadow: 0 12px 36px rgba(0,0,0,0.35);
    min-width: 160px; animation: fadeUp 0.18s ease both;
  }
  .dropdown-item {
    display: flex; align-items: center; gap: 9px; padding: 8px 12px; border-radius: 7px;
    font-size: 13px; color: var(--text2); cursor: pointer; transition: all 0.12s;
    border: none; background: none; width: 100%; text-align: left;
    font-family: 'Plus Jakarta Sans', sans-serif;
  }
  .dropdown-item:hover { background: var(--bg3); color: var(--text); }
  .dropdown-item.danger:hover { background: var(--red-dim); color: var(--red); }

  /* ── Calendar styles ── */
  .cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 3px; }
  .cal-day {
    aspect-ratio: 1; border-radius: 9px; display: flex; flex-direction: column;
    align-items: center; justify-content: flex-start; padding: 5px 4px;
    cursor: pointer; transition: all 0.15s; position: relative; overflow: hidden;
    border: 1px solid transparent;
  }
  .cal-day:hover { background: var(--bg3); border-color: var(--border); }
  .cal-day.has-notes { background: var(--accent-dim); border-color: var(--accent-border); }
  .cal-day.today { border-color: var(--accent); background: var(--accent-bg); }
  .cal-day.today .cal-day-num { color: var(--accent); font-weight: 700; }
  .cal-day.other-month .cal-day-num { color: var(--text4); }
  .cal-day.selected { background: var(--accent); border-color: var(--accent); }
  .cal-day.selected .cal-day-num { color: #fff; }
  .cal-day-num { font-size: 12.5px; font-weight: 500; color: var(--text2); line-height: 1; }
  .cal-dot-row { display: flex; gap: 2px; margin-top: 3px; flex-wrap: wrap; justify-content: center; }
  .cal-dot { width: 4px; height: 4px; border-radius: 50%; background: var(--accent); }

  /* ── Timeline styles ── */
  .tl-item {
    display: flex; gap: 16px; align-items: flex-start; position: relative; padding-bottom: 20px;
    animation: fadeUp 0.3s ease both;
  }
  .tl-item:last-child { padding-bottom: 0; }
  .tl-item:last-child .tl-line { display: none; }
  .tl-time { width: 64px; flex-shrink: 0; text-align: right; font-size: 11.5px; font-weight: 500; color: var(--text4); font-family: 'JetBrains Mono', monospace; padding-top: 12px; }
  .tl-dot-wrap { display: flex; flex-direction: column; align-items: center; flex-shrink: 0; }
  .tl-dot {
    width: 10px; height: 10px; border-radius: 50%; background: var(--border2);
    border: 2px solid var(--bg2); margin-top: 12px; z-index: 1; transition: all 0.2s; flex-shrink: 0;
  }
  .tl-dot.active { background: var(--accent); animation: glow 2s ease infinite; }
  .tl-dot.done { background: var(--text4); }
  .tl-dot.upcoming { background: var(--blue); border-color: var(--bg2); }
  .tl-line { width: 1px; flex: 1; background: var(--border); margin-top: 4px; min-height: 20px; }
  .tl-card {
    flex: 1; background: var(--bg2); border: 1px solid var(--border); border-radius: 12px;
    padding: 12px 16px; transition: all 0.18s; cursor: pointer;
  }
  .tl-card:hover { border-color: var(--accent-border); transform: translateX(2px); }
  .tl-card.active { border-color: var(--accent); background: var(--accent-bg); }
  .tl-card.done { opacity: 0.55; }

  /* ── Schedule modal ── */
  .sched-input {
    background: var(--bg3); border: 1px solid var(--border); border-radius: 8px;
    padding: 8px 12px; font-size: 13px; font-family: 'Plus Jakarta Sans', sans-serif;
    color: var(--text); outline: none; width: 100%; transition: border-color 0.2s;
  }
  .sched-input:focus { border-color: var(--accent-border); }
  .sched-input::-webkit-calendar-picker-indicator { filter: invert(0.5); cursor: pointer; }

  /* ── Week view ── */
  .week-col { flex: 1; min-width: 0; border-right: 1px solid var(--border); }
  .week-col:last-child { border-right: none; }
  .week-event {
    background: var(--accent-dim); border-left: 2px solid var(--accent); border-radius: 6px;
    padding: 4px 8px; font-size: 11px; font-weight: 500; color: var(--accent);
    margin: 2px 4px; cursor: pointer; transition: all 0.15s; white-space: nowrap;
    overflow: hidden; text-overflow: ellipsis;
  }
  .week-event:hover { background: var(--accent-bg); }

  /* scroll */
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 4px; }
`;

/* ── Inject CSS once ── */
if (!document.querySelector("#nova-app-css")) {
  const s = document.createElement("style");
  s.id = "nova-app-css";
  s.textContent = G;
  document.head.appendChild(s);
}

/* ── CONSTANTS ── */
const NOTE_COLORS = [
  { id: "none",   hex: "transparent", label: "None"   },
  { id: "green",  hex: "#0d1f19",     label: "Forest" },
  { id: "blue",   hex: "#0d1522",     label: "Ocean"  },
  { id: "purple", hex: "#1a0d2e",     label: "Violet" },
  { id: "amber",  hex: "#1f1500",     label: "Amber"  },
  { id: "rose",   hex: "#1f0d10",     label: "Rose"   },
];
const NOTE_COLORS_LIGHT = [
  { id: "none",   hex: "transparent" },
  { id: "green",  hex: "#e8f7f2"     },
  { id: "blue",   hex: "#e8f0fa"     },
  { id: "purple", hex: "#f0eafa"     },
  { id: "amber",  hex: "#fdf5e0"     },
  { id: "rose",   hex: "#fde8ec"     },
];

const CATEGORIES  = ["Work","Personal","Study","Ideas","Health","Travel"];
const REPEAT_OPTS = ["none","daily","weekly","monthly"];
const TEMPLATES   = [
  { name: "Meeting Notes", icon: "👥", content: "## Meeting Notes\n\n**Date:** \n**Attendees:** \n\n### Agenda\n- \n\n### Action Items\n- [ ] \n\n### Notes\n" },
  { name: "Study Notes",   icon: "📚", content: "## Study Notes\n\n**Topic:** \n**Date:** \n\n### Key Concepts\n- \n\n### Summary\n\n### Questions\n- " },
  { name: "Daily Journal", icon: "🌅", content: "## Daily Journal\n\n**Date:** \n\n### Today's Goals\n- [ ] \n\n### Reflections\n\n### Gratitude\n- " },
  { name: "Project Plan",  icon: "🚀", content: "## Project Plan\n\n**Project:** \n**Deadline:** \n\n### Objectives\n- \n\n### Tasks\n- [ ] \n\n### Notes\n" },
  { name: "Brainstorm",    icon: "🧠", content: "## Brainstorm\n\n**Topic:** \n\n### Ideas\n- \n\n### Next Steps\n- " },
  { name: "Quick Note",    icon: "⚡", content: "" },
];

const HOURS = Array.from({ length: 24 }, (_, i) => i);

/* ── Seed notes with schedules ── */
const NOW = Date.now();
const DAY = 86400000;
const SEED_NOTES = [
  { id: 1, title: "Ship landing page", content: "Polish the hero section copy and CTA buttons before Monday's demo.", category: "Work", tags: ["frontend","urgent"], color: "green", pinned: true, favorite: true, createdAt: new Date(NOW - DAY*2), updatedAt: new Date(NOW - 3600000), checklist: [], reminder: null, trashed: false, schedule: { date: new Date(NOW + DAY).toISOString().slice(0,10), startTime: "09:00", endTime: "11:00", repeat: "none", done: false } },
  { id: 2, title: "CORS configuration", content: "Allow localhost:5173 in the .NET 9 CORS policy.", category: "Work", tags: ["backend","dotnet"], color: "blue", pinned: true, favorite: false, createdAt: new Date(NOW - DAY*3), updatedAt: new Date(NOW - 7200000), checklist: [], reminder: null, trashed: false, schedule: { date: new Date(NOW).toISOString().slice(0,10), startTime: "14:00", endTime: "15:00", repeat: "none", done: false } },
  { id: 3, title: "Read Clean Code", content: "Chapter 4: Comments — Chapter 5: Formatting", category: "Study", tags: ["books","programming"], color: "none", pinned: false, favorite: true, createdAt: new Date(NOW - DAY*5), updatedAt: new Date(NOW - DAY), checklist: [], reminder: null, trashed: false, schedule: { date: new Date(NOW).toISOString().slice(0,10), startTime: "20:00", endTime: "21:30", repeat: "daily", done: false } },
  { id: 4, title: "Grocery run", content: "Weekly shopping list", category: "Personal", tags: ["shopping"], color: "amber", pinned: false, favorite: false, createdAt: new Date(NOW - DAY), updatedAt: new Date(NOW - 1800000), checklist: [{ id: 1, text: "Oat milk x2", done: true },{ id: 2, text: "Greek yoghurt", done: false },{ id: 3, text: "Sourdough bread", done: false },{ id: 4, text: "Avocados x3", done: false }], reminder: null, trashed: false, schedule: null },
  { id: 5, title: "App feature ideas", content: "• AI summarisation\n• Voice-to-text\n• Offline-first\n• Collaborative editing", category: "Ideas", tags: ["product","brainstorm"], color: "purple", pinned: false, favorite: true, createdAt: new Date(NOW - DAY*7), updatedAt: new Date(NOW - DAY*2), checklist: [], reminder: null, trashed: false, schedule: { date: new Date(NOW + DAY*2).toISOString().slice(0,10), startTime: "10:00", endTime: "11:00", repeat: "none", done: false } },
  { id: 6, title: "Morning run", content: "5:45am wake · 6:00am warm-up · 6:10am 5k · 6:40am cool down", category: "Health", tags: ["fitness","habit"], color: "none", pinned: false, favorite: false, createdAt: new Date(NOW - DAY*10), updatedAt: new Date(NOW - DAY*3), checklist: [], reminder: null, trashed: false, schedule: { date: new Date(NOW).toISOString().slice(0,10), startTime: "06:00", endTime: "07:00", repeat: "daily", done: true } },
];

/* ── Helpers ── */
const fmtDate = (d) => {
  const diff = Date.now() - d;
  if (diff < 60000)    return "just now";
  if (diff < 3600000)  return `${Math.floor(diff/60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff/3600000)}h ago`;
  if (diff < 604800000) return `${Math.floor(diff/86400000)}d ago`;
  return d.toLocaleDateString("en-US",{month:"short",day:"numeric"});
};
const fmt12 = (t) => {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const ap = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${String(m).padStart(2,"0")} ${ap}`;
};
const todayStr = () => new Date().toISOString().slice(0,10);
const genId    = () => Date.now() + Math.random();

const CAT_COLORS = {
  Work: "var(--blue)", Personal: "var(--accent)", Study: "var(--purple)",
  Ideas: "var(--amber)", Health: "#e05050", Travel: "#06b6d4",
};

/* ── Icons ── */
const I = {
  logo:       () => <img src="/NOVA.png" alt="NOVA" style={{width:"34px",height:"auto",borderRadius:"8px"}} />,
  plus:       () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
  search:     () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.5"/><path d="M10 10l2.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  notes:      () => <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><rect x="2" y="2" width="11" height="13" rx="2" stroke="currentColor" strokeWidth="1.4"/><path d="M5 6h5M5 9h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  calendar:   () => <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><rect x="1.5" y="3" width="12" height="11" rx="2" stroke="currentColor" strokeWidth="1.4"/><path d="M5 1.5v3M10 1.5v3M1.5 7h12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  timeline:   () => <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><circle cx="3" cy="4" r="1.5" stroke="currentColor" strokeWidth="1.3"/><circle cx="3" cy="8" r="1.5" stroke="currentColor" strokeWidth="1.3"/><circle cx="3" cy="12" r="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M6 4h7M6 8h7M6 12h5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  star:  (f) => <svg width="14" height="14" viewBox="0 0 14 14" fill={f?"currentColor":"none"}><path d="M7 1.5l1.6 3.2 3.5.5-2.55 2.5.6 3.5L7 9.6l-3.15 1.6.6-3.5L2 5.2l3.5-.5L7 1.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>,
  pin:   (f) => <svg width="14" height="14" viewBox="0 0 14 14" fill={f?"currentColor":"none"}><path d="M9 2L12 5l-2 2-.5 3L7 8.5l-3 3.5-.5-1L6.5 7 5 5.5l3-.5L9 2z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>,
  trash:      () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 4h10M5 4V2.5a.5.5 0 01.5-.5h3a.5.5 0 01.5.5V4M11 4l-.8 7.5a1 1 0 01-1 .5H4.8a1 1 0 01-1-.5L3 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>,
  edit:       () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M8.5 2.5l3 3-7 7H1.5v-3l7-7z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>,
  grid:       () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1.5" y="1.5" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="1.3"/><rect x="8.5" y="1.5" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="1.3"/><rect x="1.5" y="8.5" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="1.3"/><rect x="8.5" y="8.5" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="1.3"/></svg>,
  list:       () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 4h8M3 7h8M3 10h5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>,
  cols:       () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1.5" y="2" width="4" height="10" rx="1" stroke="currentColor" strokeWidth="1.3"/><rect x="8.5" y="2" width="4" height="10" rx="1" stroke="currentColor" strokeWidth="1.3"/></svg>,
  moon:       () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M12 8.5A5.5 5.5 0 015.5 2a5.5 5.5 0 100 10A5.5 5.5 0 0012 8.5z" stroke="currentColor" strokeWidth="1.4"/></svg>,
  sun:        () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="2.5" stroke="currentColor" strokeWidth="1.4"/><path d="M7 1v1.5M7 11.5V13M1 7h1.5M11.5 7H13M2.9 2.9l1.1 1.1M10 10l1.1 1.1M2.9 11.1L4 10M10 4l1.1-1.1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  focus:      () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 4V2a1 1 0 011-1h2M10 1h2a1 1 0 011 1v2M13 10v2a1 1 0 01-1 1h-2M4 13H2a1 1 0 01-1-1v-2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>,
  tag:        () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 2h5l5 5-5 5-5-5V2z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/><circle cx="5" cy="5" r="1" fill="currentColor"/></svg>,
  folder:     () => <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M1.5 4a1 1 0 011-1h3l1.5 2h5a1 1 0 011 1v5a1 1 0 01-1 1h-10a1 1 0 01-1-1V4z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/></svg>,
  check:      () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2.5 7l3 3 6-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  checklist:  () => <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M2 4h2.5M2 7.5h2.5M2 11h2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><path d="M7 4l1.5 1.5L11 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/><path d="M7 7.5l1.5 1.5L11 6.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/><path d="M7 11l1.5 1.5L11 10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  clock:      () => <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><circle cx="6.5" cy="6.5" r="5.5" stroke="currentColor" strokeWidth="1.3"/><path d="M6.5 4v2.5l1.5 1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  more:       () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="3" cy="7" r="1.2" fill="currentColor"/><circle cx="7" cy="7" r="1.2" fill="currentColor"/><circle cx="11" cy="7" r="1.2" fill="currentColor"/></svg>,
  close:      () => <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M1.5 1.5l10 10M11.5 1.5l-10 10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>,
  export:     () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v8M4 6l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M2 10v1.5a.5.5 0 00.5.5h9a.5.5 0 00.5-.5V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  restore:    () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7a5 5 0 109 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M2 4v3h3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  bell:       () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1.5A4.5 4.5 0 002.5 6v3l-1 1.5h11L11.5 9V6A4.5 4.5 0 007 1.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><path d="M5.5 11.5a1.5 1.5 0 003 0" stroke="currentColor" strokeWidth="1.3"/></svg>,
  template:   () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1.5" y="1.5" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.3"/><path d="M1.5 5.5h11M5.5 5.5v7" stroke="currentColor" strokeWidth="1.3"/></svg>,
  collapse:   () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 3L5 7l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  expand:     () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  palette:    () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.3"/><circle cx="5" cy="5.5" r="1" fill="currentColor"/><circle cx="9" cy="5.5" r="1" fill="currentColor"/><circle cx="7" cy="9" r="1" fill="currentColor"/></svg>,
  user:       () => <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><circle cx="7.5" cy="4.5" r="3.5" stroke="currentColor" strokeWidth="1.4"/><path d="M1.5 13.5v-1.5a3.5 3.5 0 013.5-3.5h5a3.5 3.5 0 013.5 3.5v1.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  logout:     () => <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M5.5 13.5h-3a1 1 0 01-1-1v-10a1 1 0 011-1h3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/><path d="M10.5 4.5L13 7.5l-2.5 3M5 7.5h8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  sched:      () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.4"/><path d="M7 4v3l2 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  repeat:     () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 5a5 5 0 019 3M12 9a5 5 0 01-9-3M12 6V9h-3M2 8V5h3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  chevLeft:   () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 3L5 7l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  chevRight:  () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  chartBar:   () => <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M2 12V8M5.5 12V5M9 12V7M12.5 12V3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
};

/* ── Toast ── */
function Toast({ msg, icon, onDone }) {
  const [out, setOut] = useState(false);
  useEffect(() => {
    const t1 = setTimeout(() => setOut(true),  2500);
    const t2 = setTimeout(() => onDone(),       2800);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onDone]);
  return (
    <div className={`toast${out ? " out" : ""}`}>
      <span style={{fontSize:"16px"}}>{icon||"✦"}</span>
      <span>{msg}</span>
    </div>
  );
}

/* ── Schedule Modal ── */
function ScheduleModal({ note, onSave, onClose }) {
  const [form, setForm] = useState({
    date:      note.schedule?.date      || todayStr(),
    startTime: note.schedule?.startTime || "09:00",
    endTime:   note.schedule?.endTime   || "10:00",
    repeat:    note.schedule?.repeat    || "none",
  });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: "420px" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"24px" }}>
          <div>
            <h2 style={{ fontSize:"18px", fontFamily:"'Instrument Serif',serif", fontWeight:400, color:"var(--text)", letterSpacing:"-0.02em" }}>
              Schedule note
            </h2>
            <p style={{ fontSize:"12px", color:"var(--text3)", marginTop:"3px" }}>{note.title || "Untitled"}</p>
          </div>
          <button className="icon-btn" onClick={onClose}>{I.close()}</button>
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
          {/* Date */}
          <div>
            <label style={{ fontSize:"11px", fontWeight:600, color:"var(--text4)", letterSpacing:"0.06em", textTransform:"uppercase", fontFamily:"'JetBrains Mono',monospace", display:"block", marginBottom:"6px" }}>Date</label>
            <input type="date" className="sched-input" value={form.date} onChange={e => set("date", e.target.value)} />
          </div>

          {/* Time row */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px" }}>
            <div>
              <label style={{ fontSize:"11px", fontWeight:600, color:"var(--text4)", letterSpacing:"0.06em", textTransform:"uppercase", fontFamily:"'JetBrains Mono',monospace", display:"block", marginBottom:"6px" }}>Start</label>
              <input type="time" className="sched-input" value={form.startTime} onChange={e => set("startTime", e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize:"11px", fontWeight:600, color:"var(--text4)", letterSpacing:"0.06em", textTransform:"uppercase", fontFamily:"'JetBrains Mono',monospace", display:"block", marginBottom:"6px" }}>End</label>
              <input type="time" className="sched-input" value={form.endTime} onChange={e => set("endTime", e.target.value)} />
            </div>
          </div>

          {/* Repeat */}
          <div>
            <label style={{ fontSize:"11px", fontWeight:600, color:"var(--text4)", letterSpacing:"0.06em", textTransform:"uppercase", fontFamily:"'JetBrains Mono',monospace", display:"block", marginBottom:"6px" }}>Repeat</label>
            <div style={{ display:"flex", gap:"6px" }}>
              {REPEAT_OPTS.map(r => (
                <button key={r} onClick={() => set("repeat", r)} style={{
                  flex:1, padding:"8px 4px", borderRadius:"8px", border:`1px solid ${form.repeat===r?"var(--accent-border)":"var(--border)"}`,
                  background: form.repeat===r ? "var(--accent-dim)" : "var(--bg3)",
                  color: form.repeat===r ? "var(--accent)" : "var(--text3)",
                  fontSize:"11.5px", fontWeight:500, cursor:"pointer", transition:"all 0.15s",
                  fontFamily:"'JetBrains Mono',monospace", textTransform:"capitalize",
                }}>{r}</button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display:"flex", gap:"8px", marginTop:"6px" }}>
            <button className="btn-primary" onClick={() => onSave(form)} style={{ flex:1 }}>
              {I.sched()} Save schedule
            </button>
            {note.schedule && (
              <button className="btn-ghost" onClick={() => onSave(null)} style={{ color:"var(--red)", borderColor:"rgba(224,80,80,0.3)" }}>
                Remove
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Calendar View ── */
function CalendarView({ notes, onSelectNote, onNewNote }) {
  const [curDate, setCurDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(todayStr());
  const [calView, setCalView] = useState("month"); // month | week

  const year  = curDate.getFullYear();
  const month = curDate.getMonth();

  const firstDay  = new Date(year, month, 1).getDay();
  const daysInM   = new Date(year, month + 1, 0).getDate();
  const daysInPM  = new Date(year, month, 0).getDate();
  const totalCells = Math.ceil((firstDay + daysInM) / 7) * 7;

  const cells = Array.from({ length: totalCells }, (_, i) => {
    const offset = i - firstDay;
    if (offset < 0) {
      const d = daysInPM + offset + 1;
      return { day: d, month: month - 1, year, cur: false };
    }
    if (offset >= daysInM) {
      const d = offset - daysInM + 1;
      return { day: d, month: month + 1, year, cur: false };
    }
    return { day: offset + 1, month, year, cur: true };
  });

  const notesOnDay = (dateStr) => notes.filter(n => n.schedule?.date === dateStr && !n.trashed);

  const selectedDayNotes = notesOnDay(selectedDay).sort((a,b) => (a.schedule?.startTime||"").localeCompare(b.schedule?.startTime||""));

  const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const DAYS   = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

  /* Week view */
  const weekDates = (() => {
    const sel = new Date(selectedDay);
    const dow = sel.getDay();
    return Array.from({ length:7 }, (_,i) => {
      const d = new Date(sel);
      d.setDate(d.getDate() - dow + i);
      return d.toISOString().slice(0,10);
    });
  })();

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%", overflow:"hidden" }}>
      {/* Header */}
      <div style={{ padding:"14px 20px", borderBottom:"1px solid var(--border)", display:"flex", alignItems:"center", gap:"12px", background:"var(--bg2)", flexShrink:0 }}>
        <div style={{ display:"flex", gap:"4px" }}>
          <button className="icon-btn" onClick={() => setCurDate(d => new Date(d.getFullYear(), d.getMonth()-1, 1))}>{I.chevLeft()}</button>
          <button className="icon-btn" onClick={() => setCurDate(d => new Date(d.getFullYear(), d.getMonth()+1, 1))}>{I.chevRight()}</button>
        </div>
        <h2 style={{ fontSize:"16px", fontFamily:"'Instrument Serif',serif", fontWeight:400, color:"var(--text)", letterSpacing:"-0.02em" }}>
          {MONTHS[month]} {year}
        </h2>
        <button className="btn-ghost" onClick={() => { setCurDate(new Date()); setSelectedDay(todayStr()); }} style={{ fontSize:"12px", padding:"5px 12px", marginLeft:"4px" }}>
          Today
        </button>
        <div style={{ flex:1 }} />
        {/* View toggle */}
        <div style={{ display:"flex", gap:"2px", background:"var(--bg3)", border:"1px solid var(--border)", borderRadius:"8px", padding:"3px" }}>
          {[["month","Month"],["week","Week"]].map(([k,l]) => (
            <button key={k} onClick={() => setCalView(k)} style={{
              padding:"5px 12px", borderRadius:"6px", fontSize:"12px", fontWeight:500,
              background: calView===k ? "var(--accent-dim)" : "transparent",
              color: calView===k ? "var(--accent)" : "var(--text3)",
              border:"none", cursor:"pointer", transition:"all 0.15s",
              fontFamily:"'Plus Jakarta Sans',sans-serif",
            }}>{l}</button>
          ))}
        </div>
        <button className="btn-primary" onClick={onNewNote} style={{ padding:"8px 14px", fontSize:"12.5px" }}>
          {I.plus()} New event
        </button>
      </div>

      <div style={{ flex:1, display:"flex", overflow:"hidden" }}>
        {/* Month grid */}
        <div style={{ flex:1, overflow:"auto", padding:"16px" }}>
          {calView === "month" ? (
            <>
              {/* Day headers */}
              <div className="cal-grid" style={{ marginBottom:"6px" }}>
                {DAYS.map(d => (
                  <div key={d} style={{ textAlign:"center", fontSize:"10.5px", fontWeight:600, color:"var(--text4)", fontFamily:"'JetBrains Mono',monospace", padding:"4px 0", letterSpacing:"0.04em" }}>{d}</div>
                ))}
              </div>
              {/* Day cells */}
              <div className="cal-grid">
                {cells.map((cell, i) => {
                  const ds = `${cell.year}-${String(cell.month+1).padStart(2,"0")}-${String(cell.day).padStart(2,"0")}`;
                  const dayNotes = notesOnDay(ds);
                  const isToday = ds === todayStr();
                  const isSel   = ds === selectedDay;
                  return (
                    <div key={i} onClick={() => setSelectedDay(ds)}
                      className={`cal-day${!cell.cur?" other-month":""}${dayNotes.length>0&&!isSel?" has-notes":""}${isToday&&!isSel?" today":""}${isSel?" selected":""}`}
                    >
                      <span className="cal-day-num" style={isSel?{color:"#fff"}:{}}>{cell.day}</span>
                      {dayNotes.length > 0 && !isSel && (
                        <div className="cal-dot-row">
                          {dayNotes.slice(0,3).map(n => (
                            <div key={n.id} className="cal-dot" style={{ background: CAT_COLORS[n.category] || "var(--accent)" }} />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            /* Week view */
            <div style={{ display:"flex", flexDirection:"column", height:"100%" }}>
              {/* Header row */}
              <div style={{ display:"flex", borderBottom:"1px solid var(--border)", marginBottom:"0" }}>
                <div style={{ width:"52px", flexShrink:0 }} />
                {weekDates.map(ds => {
                  const d   = new Date(ds);
                  const dow = DAYS[d.getDay()];
                  const num = d.getDate();
                  const isT = ds === todayStr();
                  return (
                    <div key={ds} className="week-col" style={{ padding:"8px 0", textAlign:"center", cursor:"pointer" }} onClick={() => setSelectedDay(ds)}>
                      <div style={{ fontSize:"10.5px", color:"var(--text4)", fontFamily:"'JetBrains Mono',monospace" }}>{dow}</div>
                      <div style={{
                        width:"28px", height:"28px", borderRadius:"50%", margin:"4px auto 0",
                        background: isT ? "var(--accent)" : "transparent",
                        display:"flex", alignItems:"center", justifyContent:"center",
                        fontSize:"13px", fontWeight:600,
                        color: isT ? "#fff" : ds===selectedDay ? "var(--accent)" : "var(--text)",
                      }}>{num}</div>
                    </div>
                  );
                })}
              </div>
              {/* Hour rows */}
              <div style={{ flex:1, overflow:"auto" }}>
                {HOURS.map(h => (
                  <div key={h} style={{ display:"flex", borderBottom:"1px solid var(--border)", minHeight:"52px" }}>
                    <div style={{ width:"52px", flexShrink:0, padding:"4px 8px 0 0", textAlign:"right", fontSize:"10.5px", color:"var(--text4)", fontFamily:"'JetBrains Mono',monospace", paddingTop:"6px" }}>
                      {fmt12(`${String(h).padStart(2,"0")}:00`)}
                    </div>
                    {weekDates.map(ds => {
                      const evs = notesOnDay(ds).filter(n => {
                        const sh = parseInt(n.schedule?.startTime||"0");
                        return sh === h;
                      });
                      return (
                        <div key={ds} className="week-col" style={{ position:"relative", paddingTop:"2px" }}>
                          {evs.map(ev => (
                            <div key={ev.id} className="week-event" onClick={() => onSelectNote(ev.id)}
                              style={{ borderLeftColor: CAT_COLORS[ev.category]||"var(--accent)", color: CAT_COLORS[ev.category]||"var(--accent)" }}>
                              {ev.title}
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: day detail */}
        <div style={{ width:"260px", borderLeft:"1px solid var(--border)", display:"flex", flexDirection:"column", flexShrink:0, overflow:"hidden" }}>
          <div style={{ padding:"14px 16px", borderBottom:"1px solid var(--border)", flexShrink:0 }}>
            <div style={{ fontSize:"13px", fontWeight:600, color:"var(--text)", letterSpacing:"-0.01em" }}>
              {new Date(selectedDay+"T12:00:00").toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"})}
            </div>
            <div style={{ fontSize:"11px", color:"var(--text4)", marginTop:"2px", fontFamily:"'JetBrains Mono',monospace" }}>
              {selectedDayNotes.length} event{selectedDayNotes.length!==1?"s":""}
            </div>
          </div>
          <div style={{ flex:1, overflow:"auto", padding:"10px" }}>
            {selectedDayNotes.length === 0 ? (
              <div style={{ textAlign:"center", padding:"32px 16px" }}>
                <div style={{ fontSize:"24px", marginBottom:"8px" }}>📭</div>
                <p style={{ fontSize:"12px", color:"var(--text4)" }}>No events</p>
              </div>
            ) : selectedDayNotes.map(n => (
              <div key={n.id} onClick={() => onSelectNote(n.id)} style={{
                background:"var(--bg3)", border:"1px solid var(--border)", borderRadius:"10px",
                padding:"10px 12px", marginBottom:"8px", cursor:"pointer",
                borderLeft:`3px solid ${CAT_COLORS[n.category]||"var(--accent)"}`,
                transition:"all 0.15s",
              }}>
                <div style={{ fontSize:"12.5px", fontWeight:600, color:"var(--text)", marginBottom:"4px", letterSpacing:"-0.01em" }}>{n.title||"Untitled"}</div>
                <div style={{ display:"flex", alignItems:"center", gap:"5px", fontSize:"11px", color:"var(--text4)", fontFamily:"'JetBrains Mono',monospace" }}>
                  {I.clock()} {fmt12(n.schedule?.startTime)} – {fmt12(n.schedule?.endTime)}
                </div>
                {n.schedule?.repeat !== "none" && (
                  <div style={{ display:"flex", alignItems:"center", gap:"4px", marginTop:"5px", fontSize:"10px", color:"var(--accent)", fontFamily:"'JetBrains Mono',monospace" }}>
                    {I.repeat()} {n.schedule.repeat}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Timeline View ── */
function TimelineView({ notes, onSelectNote, onMarkDone, onNewNote }) {
  const [filter, setFilter] = useState("today"); // today | upcoming | all

  const scheduled = notes
    .filter(n => n.schedule && !n.trashed)
    .sort((a,b) => {
      const da = a.schedule.date + (a.schedule.startTime||"");
      const db = b.schedule.date + (b.schedule.startTime||"");
      return da.localeCompare(db);
    });

  const today = todayStr();
  const filtered = scheduled.filter(n => {
    if (filter === "today")    return n.schedule.date === today;
    if (filter === "upcoming") return n.schedule.date >= today;
    return true;
  });

  const nowH = new Date().getHours() + new Date().getMinutes()/60;
  const getStatus = (n) => {
    if (n.schedule.done) return "done";
    if (n.schedule.date < today) return "done";
    if (n.schedule.date > today) return "upcoming";
    const sh = parseInt(n.schedule.startTime||"0");
    const eh = parseInt(n.schedule.endTime||"23");
    if (nowH >= sh && nowH <= eh) return "active";
    if (nowH > eh) return "done";
    return "upcoming";
  };

  /* Completed count today */
  const todayNotes = scheduled.filter(n => n.schedule.date === today);
  const doneToday  = todayNotes.filter(n => getStatus(n) === "done" || n.schedule.done).length;
  const progress   = todayNotes.length ? Math.round((doneToday/todayNotes.length)*100) : 0;

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%", overflow:"hidden" }}>
      {/* Header */}
      <div style={{ padding:"14px 20px", borderBottom:"1px solid var(--border)", background:"var(--bg2)", flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
          <h2 style={{ fontSize:"16px", fontFamily:"'Instrument Serif',serif", fontWeight:400, color:"var(--text)", letterSpacing:"-0.02em" }}>Timeline</h2>
          <div style={{ flex:1 }} />
          {/* Filter pills */}
          <div style={{ display:"flex", gap:"4px" }}>
            {[["today","Today"],["upcoming","Upcoming"],["all","All"]].map(([k,l]) => (
              <button key={k} onClick={() => setFilter(k)} style={{
                padding:"5px 12px", borderRadius:"20px", fontSize:"12px", fontWeight:500,
                background: filter===k ? "var(--accent-dim)" : "transparent",
                border:`1px solid ${filter===k?"var(--accent-border)":"var(--border)"}`,
                color: filter===k ? "var(--accent)" : "var(--text3)",
                cursor:"pointer", transition:"all 0.15s", fontFamily:"'Plus Jakarta Sans',sans-serif",
              }}>{l}</button>
            ))}
          </div>
          <button className="btn-primary" onClick={onNewNote} style={{ padding:"8px 14px", fontSize:"12.5px" }}>
            {I.plus()} Schedule
          </button>
        </div>

        {/* Today progress */}
        {filter === "today" && todayNotes.length > 0 && (
          <div style={{ marginTop:"12px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"5px" }}>
              <span style={{ fontSize:"11.5px", color:"var(--text3)", fontFamily:"'JetBrains Mono',monospace" }}>
                Today's progress · {doneToday}/{todayNotes.length} done
              </span>
              <span style={{ fontSize:"11.5px", color:"var(--accent)", fontFamily:"'JetBrains Mono',monospace", fontWeight:600 }}>{progress}%</span>
            </div>
            <div style={{ height:"4px", background:"var(--border)", borderRadius:"2px", overflow:"hidden" }}>
              <div style={{ height:"100%", background:"var(--accent)", borderRadius:"2px", width:`${progress}%`, transition:"width 0.5s ease" }} />
            </div>
          </div>
        )}
      </div>

      {/* Timeline body */}
      <div style={{ flex:1, overflow:"auto", padding:"24px 32px" }}>
        {filtered.length === 0 ? (
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"50%", gap:"12px" }}>
            <div style={{ fontSize:"36px" }}>🗓️</div>
            <p style={{ fontSize:"14px", color:"var(--text3)", fontFamily:"'Instrument Serif',serif" }}>
              {filter==="today" ? "Nothing scheduled for today" : "No scheduled notes"}
            </p>
            <button className="btn-primary" onClick={onNewNote} style={{ fontSize:"13px" }}>
              {I.plus()} Schedule a note
            </button>
          </div>
        ) : (
          <div style={{ maxWidth:"640px", margin:"0 auto" }}>
            {/* Group by date */}
            {(() => {
              const groups = {};
              filtered.forEach(n => {
                const d = n.schedule.date;
                if (!groups[d]) groups[d] = [];
                groups[d].push(n);
              });
              return Object.entries(groups).map(([date, grpNotes]) => {
                const dObj  = new Date(date+"T12:00:00");
                const isT   = date === today;
                const label = isT ? "Today" : dObj.toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"});
                return (
                  <div key={date} style={{ marginBottom:"32px" }}>
                    {/* Date label */}
                    <div style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"16px" }}>
                      <div style={{
                        fontSize:"11px", fontWeight:600, fontFamily:"'JetBrains Mono',monospace",
                        color: isT ? "var(--accent)" : "var(--text4)", letterSpacing:"0.06em", textTransform:"uppercase",
                      }}>{label}</div>
                      <div style={{ flex:1, height:"1px", background:"var(--border)" }} />
                    </div>

                    {grpNotes.sort((a,b)=>(a.schedule.startTime||"").localeCompare(b.schedule.startTime||"")).map(n => {
                      const status = getStatus(n);
                      return (
                        <div key={n.id} className="tl-item">
                          <div className="tl-time">{fmt12(n.schedule.startTime)}</div>
                          <div className="tl-dot-wrap">
                            <div className={`tl-dot${status==="active"?" active":status==="done"?" done":status==="upcoming"?" upcoming":""}`} />
                            <div className="tl-line" />
                          </div>
                          <div className={`tl-card${status==="active"?" active":status==="done"?" done":""}`} onClick={() => onSelectNote(n.id)}>
                            <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:"8px" }}>
                              <div style={{ flex:1 }}>
                                <div style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"5px" }}>
                                  <span style={{ fontSize:"13.5px", fontWeight:600, color:"var(--text)", letterSpacing:"-0.02em", textDecoration: status==="done"?"line-through":"none" }}>
                                    {n.title||"Untitled"}
                                  </span>
                                  {status==="active" && (
                                    <span style={{ fontSize:"10px", background:"var(--accent)", color:"#fff", padding:"2px 8px", borderRadius:"20px", fontFamily:"'JetBrains Mono',monospace", fontWeight:600, animation:"pulse2 2s infinite" }}>
                                      NOW
                                    </span>
                                  )}
                                  {n.schedule.repeat!=="none" && (
                                    <span style={{ fontSize:"10px", color:"var(--text4)" }}>{I.repeat()}</span>
                                  )}
                                </div>
                                <div style={{ display:"flex", gap:"10px", fontSize:"11.5px", color:"var(--text3)", fontFamily:"'JetBrains Mono',monospace" }}>
                                  <span>{fmt12(n.schedule.startTime)} – {fmt12(n.schedule.endTime)}</span>
                                  {n.category && <span style={{ color: CAT_COLORS[n.category]||"var(--text4)" }}>· {n.category}</span>}
                                </div>
                              </div>
                              {/* Mark done toggle */}
                              <button
                                onClick={e => { e.stopPropagation(); onMarkDone(n.id, status!=="done"); }}
                                style={{
                                  width:"24px", height:"24px", borderRadius:"6px", flexShrink:0, marginTop:"1px",
                                  background: status==="done" ? "var(--accent)" : "transparent",
                                  border: `1px solid ${status==="done"?"var(--accent)":"var(--border2)"}`,
                                  display:"flex", alignItems:"center", justifyContent:"center",
                                  cursor:"pointer", transition:"all 0.15s", color: status==="done"?"#fff":"var(--text4)",
                                }}
                              >
                                {status==="done" && <svg width="9" height="9" viewBox="0 0 9 9" fill="none"><path d="M1.5 4.5l2 2 4-4" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              });
            })()}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Note Card ── */
function NoteCard({ note, selected, onSelect, onPin, onFav, onDelete, onSchedule, view, theme }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const colorEntry = (theme==="dark" ? NOTE_COLORS : NOTE_COLORS_LIGHT).find(c => c.id===note.color);
  const bg = colorEntry?.hex !== "transparent" ? colorEntry?.hex : undefined;
  const doneCount = note.checklist.filter(c => c.done).length;

  useEffect(() => {
    const h = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div className={`note-card${selected?" selected":""}${note.pinned?" pinned":""}`}
      style={{ background: bg||undefined }} onClick={() => onSelect(note.id)}>
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:"8px", gap:"8px" }}>
        <h3 style={{ fontSize:"14px", fontWeight:600, color:"var(--text)", letterSpacing:"-0.02em", lineHeight:1.3, flex:1, overflow:"hidden", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" }}>
          {note.title||"Untitled"}
        </h3>
        <div style={{ display:"flex", gap:"2px", flexShrink:0 }}>
          <button className={`icon-btn${note.favorite?" active":""}`} style={{ width:"26px", height:"26px" }} onClick={e => { e.stopPropagation(); onFav(note.id); }}>
            {I.star(note.favorite)}
          </button>
          <div style={{ position:"relative" }} ref={menuRef}>
            <button className="icon-btn" style={{ width:"26px", height:"26px" }} onClick={e => { e.stopPropagation(); setMenuOpen(p => !p); }}>
              {I.more()}
            </button>
            {menuOpen && (
              <div className="dropdown" style={{ right:0, top:"34px" }}>
                <button className="dropdown-item" onClick={e => { e.stopPropagation(); onPin(note.id); setMenuOpen(false); }}>
                  {I.pin(note.pinned)} {note.pinned?"Unpin":"Pin"}
                </button>
                <button className="dropdown-item" onClick={e => { e.stopPropagation(); onSchedule(note.id); setMenuOpen(false); }}>
                  {I.sched()} Schedule
                </button>
                <button className="dropdown-item danger" onClick={e => { e.stopPropagation(); onDelete(note.id); setMenuOpen(false); }}>
                  {I.trash()} Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {view!=="list" && note.content && !note.checklist.length && (
        <p style={{ fontSize:"12.5px", color:"var(--text3)", lineHeight:1.6, overflow:"hidden", display:"-webkit-box", WebkitLineClamp: view==="grid"?3:2, WebkitBoxOrient:"vertical", marginBottom:"10px" }}>
          {note.content.replace(/#+\s/g, "").replace(/\*\*/g, "").replace(/- \[.\] /g, "")}
        </p>
      )}

      {note.checklist.length > 0 && (
        <div style={{ marginBottom:"10px" }}>
          <div style={{ height:"4px", background:"var(--border)", borderRadius:"2px", overflow:"hidden", marginBottom:"5px" }}>
            <div style={{ height:"100%", background:"var(--accent)", borderRadius:"2px", width:`${(doneCount/note.checklist.length)*100}%`, transition:"width 0.3s" }} />
          </div>
          <span style={{ fontSize:"11px", color:"var(--text3)", fontFamily:"'JetBrains Mono',monospace" }}>
            {doneCount}/{note.checklist.length} done
          </span>
        </div>
      )}

      {/* Schedule badge */}
      {note.schedule && (
        <div style={{ display:"flex", alignItems:"center", gap:"5px", marginBottom:"8px", background:"var(--accent-dim)", border:"1px solid var(--accent-border)", borderRadius:"6px", padding:"4px 8px", width:"fit-content" }}>
          <span style={{ color:"var(--accent)", display:"flex" }}>{I.clock()}</span>
          <span style={{ fontSize:"10.5px", color:"var(--accent)", fontFamily:"'JetBrains Mono',monospace", fontWeight:500 }}>
            {fmt12(note.schedule.startTime)} · {note.schedule.repeat!=="none"&&note.schedule.repeat}
          </span>
        </div>
      )}

      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:"8px" }}>
        <div style={{ display:"flex", gap:"5px", flexWrap:"wrap", flex:1 }}>
          {note.category && <span className="tag-pill" style={{ fontSize:"10px", padding:"2px 7px" }}>{note.category}</span>}
          {note.tags.slice(0,2).map(t => <span key={t} className="tag-pill" style={{ fontSize:"10px", padding:"2px 7px" }}>#{t}</span>)}
        </div>
        <span style={{ fontSize:"10.5px", color:"var(--text4)", fontFamily:"'JetBrains Mono',monospace", flexShrink:0, display:"flex", alignItems:"center", gap:"4px" }}>
          {I.clock()} {fmtDate(note.updatedAt)}
        </span>
      </div>
    </div>
  );
}

/* ── Editor Panel ── */
function EditorPanel({ note, onUpdate, onClose, onFav, onPin, onDelete, onExport, onSchedule, theme }) {
  const [title, setTitle]     = useState(note?.title||"");
  const [content, setContent] = useState(note?.content||"");
  const [focusMode, setFocusMode] = useState(false);
  const [showColors, setShowColors] = useState(false);
  const [newCheckItem, setNewCheckItem] = useState("");
  const saveTimer = useRef(null);
  const colorRef  = useRef(null);

  useEffect(() => { if (note) { setTitle(note.title); setContent(note.content); } }, [note?.id]);

  useEffect(() => {
    if (!note) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => onUpdate(note.id, { title, content, updatedAt: new Date() }), 600);
    return () => clearTimeout(saveTimer.current);
  }, [title, content, note?.id]);

  useEffect(() => {
    const h = (e) => { if (colorRef.current && !colorRef.current.contains(e.target)) setShowColors(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  if (!note) return (
    <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:"12px" }}>
      <div style={{ width:"48px", height:"48px", background:"var(--bg3)", borderRadius:"12px", display:"flex", alignItems:"center", justifyContent:"center", color:"var(--text4)" }}>{I.notes()}</div>
      <p style={{ fontSize:"13px", color:"var(--text4)", fontFamily:"'JetBrains Mono',monospace" }}>select a note</p>
    </div>
  );

  const colors = theme==="dark" ? NOTE_COLORS : NOTE_COLORS_LIGHT;

  const addCheckItem = () => {
    if (!newCheckItem.trim()) return;
    onUpdate(note.id, { checklist: [...note.checklist, { id: genId(), text: newCheckItem.trim(), done: false }], updatedAt: new Date() });
    setNewCheckItem("");
  };
  const toggleCheck = (cid) => onUpdate(note.id, { checklist: note.checklist.map(c => c.id===cid?{...c,done:!c.done}:c), updatedAt: new Date() });
  const removeCheck = (cid) => onUpdate(note.id, { checklist: note.checklist.filter(c => c.id!==cid), updatedAt: new Date() });

  const editorContent = (
    <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
      {/* Toolbar */}
      <div style={{ display:"flex", alignItems:"center", gap:"4px", padding:"12px 20px", borderBottom:"1px solid var(--border)", background:"var(--bg2)" }}>
        {!focusMode && <button className="icon-btn" onClick={onClose}>{I.close()}</button>}
        <div style={{ flex:1 }} />
        <div style={{ position:"relative" }} ref={colorRef}>
          <button className="icon-btn" onClick={() => setShowColors(p => !p)}>{I.palette()}</button>
          {showColors && (
            <div className="dropdown" style={{ right:0, top:"38px", padding:"12px", display:"flex", gap:"8px" }}>
              {colors.map(c => (
                <div key={c.id} className={`color-dot${note.color===c.id?" selected":""}`}
                  style={{ background: c.hex!=="transparent"?c.hex:"var(--bg3)", border: c.id==="none"?"1px solid var(--border2)":undefined }}
                  onClick={() => { onUpdate(note.id, { color: c.id }); setShowColors(false); }} />
              ))}
            </div>
          )}
        </div>
        <button className={`icon-btn${note.schedule?" active":""}`} onClick={() => onSchedule(note.id)} title="Schedule">{I.sched()}</button>
        <button className={`icon-btn${note.pinned?" active":""}`} onClick={() => onPin(note.id)}>{I.pin(note.pinned)}</button>
        <button className={`icon-btn${note.favorite?" active":""}`} onClick={() => onFav(note.id)}>{I.star(note.favorite)}</button>
        <button className="icon-btn" onClick={() => setFocusMode(p => !p)}>{I.focus()}</button>
        <button className="icon-btn" onClick={() => onExport(note)}>{I.export()}</button>
        <button className="icon-btn" onClick={() => onDelete(note.id)}>{I.trash()}</button>
      </div>

      {/* Schedule banner */}
      {note.schedule && (
        <div style={{ background:"var(--accent-dim)", borderBottom:"1px solid var(--accent-border)", padding:"8px 24px", display:"flex", alignItems:"center", gap:"10px" }}>
          <span style={{ color:"var(--accent)", display:"flex" }}>{I.sched()}</span>
          <span style={{ fontSize:"12px", color:"var(--accent)", fontFamily:"'JetBrains Mono',monospace", fontWeight:500 }}>
            {note.schedule.date} · {fmt12(note.schedule.startTime)} – {fmt12(note.schedule.endTime)}
            {note.schedule.repeat!=="none" && ` · ${note.schedule.repeat}`}
          </span>
          <button onClick={() => onSchedule(note.id)} style={{ background:"none", border:"none", fontSize:"11px", color:"var(--accent)", cursor:"pointer", marginLeft:"auto", fontFamily:"'JetBrains Mono',monospace", textDecoration:"underline" }}>
            Edit
          </button>
        </div>
      )}

      {/* Title */}
      <div style={{ padding:"24px 24px 0" }}>
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Note title…"
          style={{ width:"100%", background:"transparent", border:"none", outline:"none", fontSize:"22px", fontWeight:700, color:"var(--text)", fontFamily:"'Instrument Serif',serif", letterSpacing:"-0.02em", lineHeight:1.2 }} />
        <div style={{ display:"flex", gap:"12px", marginTop:"8px", marginBottom:"16px", fontSize:"11px", color:"var(--text4)", fontFamily:"'JetBrains Mono',monospace" }}>
          <span>Created {fmtDate(note.createdAt)}</span>
          <span>·</span>
          <span>Updated {fmtDate(note.updatedAt)}</span>
          <span style={{ marginLeft:"auto", color:"var(--accent)", fontSize:"10px" }}>● auto-saved</span>
        </div>
        <div style={{ height:"1px", background:"var(--border)" }} />
      </div>

      {/* Body */}
      <div style={{ flex:1, overflow:"auto", padding:"16px 24px 24px" }}>
        <textarea className="note-editor" value={content} onChange={e => setContent(e.target.value)} placeholder="Start writing…" style={{ minHeight:"200px" }} />

        {note.checklist && (
          <div style={{ marginTop:"20px", borderTop:"1px solid var(--border)", paddingTop:"16px" }}>
            <div style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"12px" }}>
              <span style={{ color:"var(--accent)" }}>{I.checklist()}</span>
              <span style={{ fontSize:"12px", fontWeight:600, color:"var(--text3)", fontFamily:"'JetBrains Mono',monospace", letterSpacing:"0.04em", textTransform:"uppercase" }}>Checklist</span>
              {note.checklist.length > 0 && (
                <span style={{ fontSize:"11px", color:"var(--text4)", fontFamily:"'JetBrains Mono',monospace", marginLeft:"auto" }}>
                  {note.checklist.filter(c => c.done).length}/{note.checklist.length}
                </span>
              )}
            </div>
            {note.checklist.map(item => (
              <div key={item.id} className={`check-row${item.done?" done":""}`}>
                <div className={`check-box${item.done?" checked":""}`} onClick={() => toggleCheck(item.id)}>
                  {item.done && <svg width="9" height="9" viewBox="0 0 9 9" fill="none"><path d="M1.5 4.5l2 2 4-4" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                </div>
                <span style={{ flex:1, fontSize:"13px", color:"var(--text)", textDecoration: item.done?"line-through":"none", letterSpacing:"-0.01em" }}>{item.text}</span>
                <button className="icon-btn" style={{ width:"22px", height:"22px", opacity:0.4 }} onClick={() => removeCheck(item.id)}>{I.close()}</button>
              </div>
            ))}
            <div style={{ display:"flex", gap:"8px", marginTop:"10px" }}>
              <input className="app-input" placeholder="Add item…" value={newCheckItem} onChange={e => setNewCheckItem(e.target.value)} onKeyDown={e => e.key==="Enter" && addCheckItem()} style={{ fontSize:"13px", padding:"8px 12px" }} />
              <button className="btn-primary" onClick={addCheckItem} style={{ padding:"8px 14px", flexShrink:0 }}>{I.plus()}</button>
            </div>
          </div>
        )}
      </div>

      {/* Tags */}
      <div style={{ padding:"12px 24px", borderTop:"1px solid var(--border)", display:"flex", gap:"6px", flexWrap:"wrap", alignItems:"center" }}>
        <span style={{ color:"var(--text4)" }}>{I.tag()}</span>
        {note.tags.map(t => (
          <span key={t} className="tag-pill">
            #{t}
            <button style={{ background:"none", border:"none", cursor:"pointer", color:"inherit", padding:0, lineHeight:1, marginLeft:"2px" }}
              onClick={() => onUpdate(note.id, { tags: note.tags.filter(x => x!==t) })}>×</button>
          </span>
        ))}
        <span className="tag-pill" style={{ cursor:"text" }}>
          <input placeholder="+ tag" style={{ background:"none", border:"none", outline:"none", width:"40px", fontSize:"10.5px", color:"var(--text3)", fontFamily:"'JetBrains Mono',monospace", cursor:"text" }}
            onKeyDown={e => {
              if (e.key==="Enter" && e.target.value.trim()) {
                onUpdate(note.id, { tags: [...new Set([...note.tags, e.target.value.trim().toLowerCase()])] });
                e.target.value = "";
              }
            }} />
        </span>
      </div>
    </div>
  );

  if (focusMode) return (
    <div className="focus-overlay">
      <div style={{ width:"100%", maxWidth:"680px", height:"100vh", display:"flex", flexDirection:"column" }}>
        <div style={{ padding:"16px 24px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <span style={{ fontSize:"11px", color:"var(--text4)", fontFamily:"'JetBrains Mono',monospace", animation:"pulse2 2s infinite" }}>● focus mode</span>
          <button className="btn-ghost" onClick={() => setFocusMode(false)} style={{ fontSize:"12px", padding:"6px 12px" }}>Exit focus</button>
        </div>
        {editorContent}
      </div>
    </div>
  );

  return editorContent;
}

/* ── MAIN APP ── */
export default function NotesUi() {
  const [notes, setNotes]                     = useState(SEED_NOTES);
  const [selectedId, setSelectedId]           = useState(null);
  const [view, setView]                       = useState("grid");
  const { theme, toggleTheme }               = useTheme();
  const navigate                              = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [editorOpen, setEditorOpen]           = useState(false);
  const [search, setSearch]                   = useState("");
  const [activeSection, setActiveSection]     = useState("all");
  const [activeTag, setActiveTag]             = useState(null);
  const [toast, setToast]                     = useState(null);
  const [showTemplates, setShowTemplates]     = useState(false);
  const [sortBy, setSortBy]                   = useState("updated");
  const [scheduleNoteId, setScheduleNoteId]   = useState(null);
  const [mainView, setMainView]               = useState("notes"); // notes | calendar | timeline

  const showToast = useCallback((msg, icon) => setToast({ msg, icon, key: Date.now() }), []);

  /* ── CRUD ── */
  const createNote = (template=null) => {
    const n = {
      id: genId(), title: template?.name==="Quick Note" ? "" : template?.name || "",
      content: template?.content || "", category: "Personal", tags: [], color: "none",
      pinned: false, favorite: false, createdAt: new Date(), updatedAt: new Date(),
      checklist: [], reminder: null, trashed: false, schedule: null,
    };
    setNotes(prev => [n, ...prev]);
    setSelectedId(n.id); setEditorOpen(true); setShowTemplates(false);
    showToast("Note created","✦");
    return n.id;
  };

  const createAndSchedule = () => {
    const id = createNote();
    setTimeout(() => setScheduleNoteId(id), 200);
  };

  const updateNote = useCallback((id, patch) => {
    setNotes(prev => prev.map(n => n.id===id ? { ...n, ...patch } : n));
  }, []);

  const deleteNote = useCallback((id) => {
    const note = notes.find(n => n.id===id);
    if (note?.trashed) {
      setNotes(prev => prev.filter(n => n.id!==id));
      showToast("Permanently deleted","🗑️");
    } else {
      updateNote(id, { trashed: true, updatedAt: new Date() });
      showToast("Moved to trash","🗑️");
    }
    if (selectedId===id) { setSelectedId(null); setEditorOpen(false); }
  }, [notes, selectedId, updateNote, showToast]);

  const restoreNote = useCallback((id) => {
    updateNote(id, { trashed: false, updatedAt: new Date() });
    showToast("Note restored","✨");
  }, [updateNote, showToast]);

  const togglePin = useCallback((id) => {
    const n = notes.find(x => x.id===id);
    updateNote(id, { pinned: !n.pinned });
    showToast(n.pinned?"Unpinned":"Pinned","📌");
  }, [notes, updateNote, showToast]);

  const toggleFav = useCallback((id) => {
    const n = notes.find(x => x.id===id);
    updateNote(id, { favorite: !n.favorite });
    showToast(n.favorite?"Removed from favourites":"Added to favourites","⭐");
  }, [notes, updateNote, showToast]);

  const exportNote = useCallback((note) => {
    const blob = new Blob([`# ${note.title}\n\n${note.content}`], { type: "text/plain" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = `${note.title||"note"}.txt`; a.click();
    showToast("Exported as .txt","📦");
  }, [showToast]);

  const saveSchedule = useCallback((noteId, schedData) => {
    updateNote(noteId, { schedule: schedData ? { ...schedData, done: false } : null });
    showToast(schedData?"Schedule saved":"Schedule removed", schedData?"🗓️":"🗑️");
    setScheduleNoteId(null);
  }, [updateNote, showToast]);

  const markDone = useCallback((noteId, done) => {
    setNotes(prev => prev.map(n => n.id===noteId ? { ...n, schedule: n.schedule ? { ...n.schedule, done } : null } : n));
    showToast(done?"Marked as done":"Marked as pending", done?"✅":"↩️");
  }, [showToast]);

  const selectNote = useCallback((id) => {
    setSelectedId(id); setEditorOpen(true);
    if (mainView!=="notes") setMainView("notes");
  }, [mainView]);

  /* ── Filtered notes ── */
  const visibleNotes = (() => {
    let list = notes.filter(n => {
      if (activeSection==="trash")           return n.trashed;
      if (n.trashed)                         return false;
      if (activeSection==="favorites")       return n.favorite;
      if (activeSection==="pinned")          return n.pinned;
      if (activeSection==="scheduled")       return !!n.schedule;
      if (activeSection.startsWith("cat:")) return n.category===activeSection.slice(4);
      return true;
    });
    if (activeTag)  list = list.filter(n => n.tags.includes(activeTag));
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(n => n.title.toLowerCase().includes(q)||n.content.toLowerCase().includes(q)||n.tags.some(t => t.includes(q)));
    }
    list = [...list].sort((a,b) => sortBy==="title" ? a.title.localeCompare(b.title) : sortBy==="created" ? b.createdAt-a.createdAt : b.updatedAt-a.updatedAt);
    if (activeSection!=="trash") list = [...list.filter(n => n.pinned), ...list.filter(n => !n.pinned)];
    return list;
  })();

  const selectedNote = notes.find(n => n.id===selectedId)||null;
  const allTags      = [...new Set(notes.flatMap(n => n.tags))];
  const counts       = {
    all:       notes.filter(n => !n.trashed).length,
    favorites: notes.filter(n => n.favorite&&!n.trashed).length,
    pinned:    notes.filter(n => n.pinned&&!n.trashed).length,
    scheduled: notes.filter(n => n.schedule&&!n.trashed).length,
    trash:     notes.filter(n => n.trashed).length,
  };
  const gridCols = view==="grid" ? "repeat(auto-fill,minmax(240px,1fr))" : view==="cols" ? "repeat(2,1fr)" : "1fr";

  /* Schedule note object */
  const schedNote = scheduleNoteId ? notes.find(n => n.id===scheduleNoteId) : null;

  return (
    <>
      {/* Templates modal */}
      {showTemplates && (
        <div className="modal-overlay" onClick={() => setShowTemplates(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"20px" }}>
              <div>
                <h2 style={{ fontSize:"18px", fontFamily:"'Instrument Serif',serif", fontWeight:400, color:"var(--text)", letterSpacing:"-0.02em" }}>Choose a template</h2>
                <p style={{ fontSize:"12px", color:"var(--text3)", marginTop:"3px" }}>Start with a structured note</p>
              </div>
              <button className="icon-btn" onClick={() => setShowTemplates(false)}>{I.close()}</button>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:"10px" }}>
              {TEMPLATES.map(t => (
                <button key={t.name} onClick={() => createNote(t)} style={{
                  background:"var(--bg3)", border:"1px solid var(--border)", borderRadius:"12px",
                  padding:"14px 16px", cursor:"pointer", textAlign:"left", transition:"all 0.15s",
                  display:"flex", alignItems:"center", gap:"10px",
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor="var(--accent-border)"; e.currentTarget.style.background="var(--accent-bg)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor="var(--border)"; e.currentTarget.style.background="var(--bg3)"; }}
                >
                  <span style={{ fontSize:"22px" }}>{t.icon}</span>
                  <span style={{ fontSize:"13px", fontWeight:600, color:"var(--text)", letterSpacing:"-0.01em" }}>{t.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Schedule modal */}
      {schedNote && (
        <ScheduleModal note={schedNote} onSave={(data) => saveSchedule(schedNote.id, data)} onClose={() => setScheduleNoteId(null)} />
      )}

      <div className="app-layout">

        {/* ── SIDEBAR ── */}
        <aside className={`sidebar${sidebarCollapsed?" collapsed":""}`}>
          <div style={{ padding:"16px", display:"flex", alignItems:"center", justifyContent: sidebarCollapsed?"center":"space-between", borderBottom:"1px solid var(--border)" }}>
            <div style={{ display:"flex", alignItems:"center", gap:"9px" }}>
              {I.logo()}
            </div>
            {!sidebarCollapsed && <button className="icon-btn" onClick={() => setSidebarCollapsed(true)}>{I.collapse()}</button>}
          </div>

          {sidebarCollapsed && (
            <div style={{ padding:"8px 0", display:"flex", justifyContent:"center" }}>
              <button className="icon-btn" onClick={() => setSidebarCollapsed(false)}>{I.expand()}</button>
            </div>
          )}

          <div style={{ flex:1, overflow:"auto", padding:"12px 10px" }}>
            {!sidebarCollapsed ? (
              <div style={{ display:"flex", gap:"6px", marginBottom:"16px" }}>
                <button className="btn-primary" onClick={() => createNote()} style={{ flex:1, padding:"9px 12px", fontSize:"13px" }}>{I.plus()} New note</button>
                <button className="btn-ghost" onClick={() => setShowTemplates(true)} title="Templates" style={{ padding:"9px 10px" }}>{I.template()}</button>
              </div>
            ) : (
              <div style={{ display:"flex", justifyContent:"center", marginBottom:"12px" }}>
                <button className="icon-btn active" onClick={() => createNote()} style={{ width:"36px", height:"36px" }}>{I.plus()}</button>
              </div>
            )}

            {/* View switcher */}
            {!sidebarCollapsed && (
              <div style={{ marginBottom:"12px" }}>
                <div style={{ fontSize:"10px", fontWeight:600, color:"var(--text4)", letterSpacing:"0.08em", textTransform:"uppercase", fontFamily:"'JetBrains Mono',monospace", margin:"0 4px 6px" }}>Views</div>
                {[
                  { key:"notes",    icon: I.notes(),    label:"Notes" },
                  { key:"calendar", icon: I.calendar(), label:"Calendar" },
                  { key:"timeline", icon: I.timeline(), label:"Timeline" },
                ].map(item => (
                  <button key={item.key} className={`nav-item${mainView===item.key?" active":""}`} onClick={() => setMainView(item.key)} title={item.label}>
                    <span style={{ flexShrink:0 }}>{item.icon}</span>
                    <span style={{ flex:1 }}>{item.label}</span>
                    {item.key==="timeline" && counts.scheduled>0 && (
                      <span style={{ fontSize:"10.5px", color:"var(--text4)", fontFamily:"'JetBrains Mono',monospace", background:"var(--bg3)", padding:"1px 7px", borderRadius:"20px" }}>{counts.scheduled}</span>
                    )}
                  </button>
                ))}
              </div>
            )}

            <div style={{ height:"1px", background:"var(--border)", margin:"8px 4px", opacity:0.5 }} />

            {/* Notes sections */}
            {[
              { key:"all",       icon: I.notes(),   label:"All Notes",  count: counts.all       },
              { key:"favorites", icon: I.star(true), label:"Favourites", count: counts.favorites  },
              { key:"pinned",    icon: I.pin(true),  label:"Pinned",     count: counts.pinned     },
              { key:"scheduled", icon: I.sched(),    label:"Scheduled",  count: counts.scheduled  },
            ].map(item => (
              <button key={item.key} className={`nav-item${activeSection===item.key&&mainView==="notes"?" active":""}`}
                onClick={() => { setActiveSection(item.key); setActiveTag(null); setMainView("notes"); }} title={item.label}>
                <span style={{ flexShrink:0 }}>{item.icon}</span>
                {!sidebarCollapsed && (
                  <>
                    <span style={{ flex:1 }}>{item.label}</span>
                    {item.count>0 && <span style={{ fontSize:"10.5px", color:"var(--text4)", fontFamily:"'JetBrains Mono',monospace", background:"var(--bg3)", padding:"1px 7px", borderRadius:"20px" }}>{item.count}</span>}
                  </>
                )}
              </button>
            ))}

            {!sidebarCollapsed && (
              <div style={{ margin:"16px 4px 6px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                <span style={{ fontSize:"10px", fontWeight:600, color:"var(--text4)", letterSpacing:"0.08em", textTransform:"uppercase", fontFamily:"'JetBrains Mono',monospace" }}>Categories</span>
              </div>
            )}

            {CATEGORIES.map(cat => (
              <button key={cat} className={`nav-item${(activeSection === "cat:" + cat) && mainView === "notes" ? " active" : ""}`}
                onClick={() => { setActiveSection("cat:" + cat); setActiveTag(null); setMainView("notes"); }} title={cat}>
                <span style={{ flexShrink:0, color: CAT_COLORS[cat]||"var(--text3)", display:"flex" }}>{I.folder()}</span>
                {!sidebarCollapsed && (
                  <>
                    <span style={{ flex:1 }}>{cat}</span>
                    <span style={{ fontSize:"10.5px", color:"var(--text4)", fontFamily:"'JetBrains Mono',monospace" }}>
                      {notes.filter(n => n.category===cat&&!n.trashed).length}
                    </span>
                  </>
                )}
              </button>
            ))}

            {!sidebarCollapsed && allTags.length > 0 && (
              <>
                <div style={{ margin:"16px 4px 8px" }}>
                  <span style={{ fontSize:"10px", fontWeight:600, color:"var(--text4)", letterSpacing:"0.08em", textTransform:"uppercase", fontFamily:"'JetBrains Mono',monospace" }}>Tags</span>
                </div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:"5px", padding:"0 4px" }}>
                  {allTags.map(t => (
                    <span key={t} className={`tag-pill${activeTag===t?" active":""}`} onClick={() => { setActiveTag(prev => prev===t?null:t); setMainView("notes"); }}>#{t}</span>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div style={{ padding:"10px", borderTop:"1px solid var(--border)", display:"flex", flexDirection:"column", gap:"2px" }}>
            <button className={`nav-item${activeSection==="trash"&&mainView==="notes"?" active":""}`}
              onClick={() => { setActiveSection("trash"); setActiveTag(null); setMainView("notes"); }} title="Trash">
              <span>{I.trash()}</span>
              {!sidebarCollapsed && <><span style={{ flex:1 }}>Trash</span>{counts.trash>0&&<span style={{ fontSize:"10.5px", color:"var(--text4)", fontFamily:"'JetBrains Mono',monospace" }}>{counts.trash}</span>}</>}
            </button>

            <div style={{ margin:"4px 0", height:"1px", background:"var(--border)", opacity:0.5 }} />

            <button className="nav-item" title="Profile" onClick={() => navigate("/profile")}>
              <span style={{ color:"var(--text3)" }}>{I.user()}</span>
              {!sidebarCollapsed && <span>My Profile</span>}
            </button>
            <button className="nav-item" onClick={toggleTheme} title="Toggle theme">
              <span style={{ color:"var(--text3)" }}>{theme==="dark"?I.sun():I.moon()}</span>
              {!sidebarCollapsed && <span>{theme==="dark"?"Light mode":"Dark mode"}</span>}
            </button>
            <button className="nav-item" title="Log out" style={{ color:"var(--red)" }} onClick={() => navigate("/")}>
              <span style={{ color:"inherit" }}>{I.logout()}</span>
              {!sidebarCollapsed && <span>Log out</span>}
            </button>
          </div>
        </aside>

        {/* ── MAIN ── */}
        <div className="main-area">
          {mainView === "calendar" && (
            <CalendarView notes={notes} onSelectNote={selectNote} onNewNote={createAndSchedule} />
          )}

          {mainView === "timeline" && (
            <TimelineView notes={notes} onSelectNote={selectNote} onMarkDone={markDone} onNewNote={createAndSchedule} />
          )}

          {mainView === "notes" && (
            <>
              {/* Topbar */}
              <div style={{ display:"flex", alignItems:"center", gap:"10px", padding:"12px 20px", borderBottom:"1px solid var(--border)", background:"var(--bg2)", flexShrink:0 }}>
                <div style={{ position:"relative", flex:1, maxWidth:"360px" }}>
                  <span style={{ position:"absolute", left:"11px", top:"50%", transform:"translateY(-50%)", color:"var(--text4)", pointerEvents:"none" }}>{I.search()}</span>
                  <input className="app-input" placeholder="Search notes…" value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft:"34px", paddingTop:"8px", paddingBottom:"8px" }} />
                </div>
                <div style={{ flex:1 }} />
                <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                  style={{ background:"var(--bg3)", border:"1px solid var(--border)", borderRadius:"8px", padding:"7px 10px", fontSize:"12px", color:"var(--text2)", outline:"none", cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                  <option value="updated">Last updated</option>
                  <option value="created">Date created</option>
                  <option value="title">Title A–Z</option>
                </select>
                <div style={{ display:"flex", gap:"2px", background:"var(--bg3)", border:"1px solid var(--border)", borderRadius:"8px", padding:"3px" }}>
                  {[["grid",I.grid()],["cols",I.cols()],["list",I.list()]].map(([v,icon]) => (
                    <button key={v} className={`icon-btn${view===v?" active":""}`} onClick={() => setView(v)} title={v}>{icon}</button>
                  ))}
                </div>
              </div>

              {/* Section header */}
              <div style={{ padding:"16px 20px 12px", display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
                <div>
                  <h2 style={{ fontSize:"17px", fontFamily:"'Instrument Serif',serif", fontWeight:400, color:"var(--text)", letterSpacing:"-0.02em" }}>
                    {activeSection==="all"?"All Notes":activeSection==="favorites"?"Favourites":activeSection==="pinned"?"Pinned":activeSection==="scheduled"?"Scheduled":activeSection==="trash"?"Trash":activeSection.slice(4)}
                    {activeTag && <span style={{ color:"var(--accent)", fontStyle:"italic" }}> · #{activeTag}</span>}
                  </h2>
                  <span style={{ fontSize:"11.5px", color:"var(--text4)", fontFamily:"'JetBrains Mono',monospace" }}>
                    {visibleNotes.length} note{visibleNotes.length!==1?"s":""}
                    {search && ` matching "${search}"`}
                  </span>
                </div>
                {activeSection==="trash" && counts.trash>0 && (
                  <button className="btn-ghost" style={{ fontSize:"12px", color:"var(--red)", borderColor:"rgba(224,80,80,0.3)" }}
                    onClick={() => { setNotes(prev => prev.filter(n => !n.trashed)); showToast("Trash emptied","🗑️"); }}>
                    Empty trash
                  </button>
                )}
              </div>

              {/* Grid */}
              <div style={{ flex:1, overflow:"auto", padding:"0 20px 24px" }}>
                {visibleNotes.length===0 ? (
                  <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"60%", gap:"12px", animation:"fadeIn 0.3s ease" }}>
                    <div style={{ width:"52px", height:"52px", background:"var(--bg3)", borderRadius:"14px", display:"flex", alignItems:"center", justifyContent:"center", color:"var(--text4)", fontSize:"22px" }}>
                      {search?"🔍":activeSection==="trash"?"🗑️":"✦"}
                    </div>
                    <p style={{ fontSize:"14px", color:"var(--text3)", fontFamily:"'Instrument Serif',serif" }}>
                      {search?"No notes found":activeSection==="trash"?"Trash is empty":"No notes yet"}
                    </p>
                    {!search && activeSection==="all" && (
                      <button className="btn-primary" onClick={() => createNote()} style={{ marginTop:"4px", fontSize:"13px", padding:"10px 20px" }}>
                        {I.plus()} Create your first note
                      </button>
                    )}
                  </div>
                ) : (
                  <div style={{ display:"grid", gridTemplateColumns: gridCols, gap:"12px", animation:"fadeIn 0.2s ease" }}>
                    {visibleNotes.map(note => (
                      activeSection==="trash" ? (
                        <div key={note.id} className="note-card" style={{ opacity:0.7 }}>
                          <h3 style={{ fontSize:"14px", fontWeight:600, color:"var(--text)", marginBottom:"6px", letterSpacing:"-0.02em" }}>{note.title||"Untitled"}</h3>
                          <p style={{ fontSize:"12px", color:"var(--text3)", marginBottom:"12px", overflow:"hidden", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" }}>{note.content}</p>
                          <div style={{ display:"flex", gap:"8px" }}>
                            <button className="btn-ghost" onClick={() => restoreNote(note.id)} style={{ flex:1, fontSize:"12px", padding:"7px 10px" }}>{I.restore()} Restore</button>
                            <button className="btn-ghost" onClick={() => deleteNote(note.id)} style={{ flex:1, fontSize:"12px", padding:"7px 10px", color:"var(--red)", borderColor:"rgba(224,80,80,0.3)" }}>{I.trash()} Delete</button>
                          </div>
                        </div>
                      ) : (
                        <NoteCard key={note.id} note={note} selected={selectedId===note.id}
                          onSelect={selectNote} onPin={togglePin} onFav={toggleFav}
                          onDelete={deleteNote} onSchedule={(id) => setScheduleNoteId(id)}
                          view={view} theme={theme} />
                      )
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* ── EDITOR ── */}
        <div className={`editor-panel${editorOpen&&selectedNote&&mainView==="notes"?"":" hidden"}`}>
          {editorOpen && selectedNote && mainView==="notes" && (
            <EditorPanel note={selectedNote} onUpdate={updateNote} onClose={() => { setEditorOpen(false); setSelectedId(null); }}
              onFav={toggleFav} onPin={togglePin} onDelete={deleteNote} onExport={exportNote}
              onSchedule={(id) => setScheduleNoteId(id)} theme={theme} />
          )}
        </div>
      </div>

      {toast && <Toast key={toast.key} msg={toast.msg} icon={toast.icon} onDone={() => setToast(null)} />}
    </>
  );
}
