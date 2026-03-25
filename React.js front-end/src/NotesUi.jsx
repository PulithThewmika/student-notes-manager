import { useState, useEffect, useRef, useCallback } from "react";

/* ── Font injection ── */
(() => {
  if (document.querySelector('link[data-notes-fonts]')) return;
  const l = document.createElement("link");
  l.rel = "stylesheet";
  l.dataset.notesFonts = "1";
  l.href = "https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap";
  document.head.appendChild(l);
})();

/* ── GLOBAL CSS ── */
const G = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }

  :root {
    --bg: #0c0c0a;
    --bg2: #0f0f0d;
    --bg3: #131310;
    --border: #1e1e1b;
    --border2: #252521;
    --text: #e8e5de;
    --text2: #807d76;
    --text3: #4a4844;
    --text4: #2a2a26;
    --accent: #1D9E75;
    --accent-bg: #0d1f19;
    --accent-dim: rgba(29,158,117,0.12);
    --accent-border: rgba(29,158,117,0.3);
    --sidebar-w: 260px;
  }

  [data-theme="light"] {
    --bg: #f8f6f1;
    --bg2: #ffffff;
    --bg3: #f2f0eb;
    --border: #e4e1d8;
    --border2: #d8d4c8;
    --text: #1a1916;
    --text2: #6b6860;
    --text3: #9b9890;
    --text4: #c0bdb5;
    --accent-bg: #e8f7f2;
    --accent-dim: rgba(29,158,117,0.1);
    --accent-border: rgba(29,158,117,0.25);
  }

  body {
    background: var(--bg);
    color: var(--text);
    font-family: 'Plus Jakarta Sans', sans-serif;
    min-height: 100vh;
    overflow: hidden;
  }

  ::selection { background: rgba(29,158,117,0.3); color: var(--text); }
  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 4px; }

  @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
  @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
  @keyframes slideIn { from { opacity:0; transform:translateX(-12px); } to { opacity:1; transform:translateX(0); } }
  @keyframes popIn { from { opacity:0; transform:scale(0.92); } to { opacity:1; transform:scale(1); } }
  @keyframes toastIn { from { opacity:0; transform:translateY(16px) scale(0.96); } to { opacity:1; transform:translateY(0) scale(1); } }
  @keyframes toastOut { from { opacity:1; transform:translateY(0) scale(1); } to { opacity:0; transform:translateY(8px) scale(0.96); } }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes pulse2 { 0%,100%{opacity:0.5;} 50%{opacity:1;} }
  @keyframes shimmer { 0%{background-position:-400px 0;} 100%{background-position:400px 0;} }

  .app-layout {
    display: flex;
    height: 100vh;
    overflow: hidden;
  }

  /* Sidebar */
  .sidebar {
    width: var(--sidebar-w);
    background: var(--bg2);
    border-right: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    overflow: hidden;
    transition: width 0.3s cubic-bezier(.25,.46,.45,.94);
  }
  .sidebar.collapsed { width: 64px; }

  /* Main */
  .main-area {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: var(--bg);
  }

  /* Editor panel */
  .editor-panel {
    width: 420px;
    flex-shrink: 0;
    background: var(--bg2);
    border-left: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    transition: width 0.3s cubic-bezier(.25,.46,.45,.94);
  }
  .editor-panel.hidden { width: 0; border-left: none; }

  /* Nav item */
  .nav-item {
    display: flex; align-items: center; gap: 10px;
    padding: 9px 14px; border-radius: 9px;
    font-size: 13px; font-weight: 500; color: var(--text3);
    cursor: pointer; transition: all 0.15s; white-space: nowrap;
    border: none; background: none; width: 100%; text-align: left;
    letter-spacing: -0.01em;
  }
  .nav-item:hover { background: var(--bg3); color: var(--text2); }
  .nav-item.active { background: var(--accent-dim); color: var(--accent); }

  /* Note card */
  .note-card {
    background: var(--bg2);
    border: 1px solid var(--border);
    border-radius: 14px;
    padding: 16px 18px;
    cursor: pointer;
    transition: all 0.18s;
    position: relative;
    overflow: hidden;
    animation: popIn 0.25s ease both;
  }
  .note-card:hover { border-color: var(--border2); transform: translateY(-1px); box-shadow: 0 6px 20px rgba(0,0,0,0.18); }
  .note-card.selected { border-color: var(--accent-border); background: var(--accent-bg); }
  .note-card.pinned::after {
    content: ''; position: absolute; top: 0; right: 0;
    width: 0; height: 0;
    border-style: solid;
    border-width: 0 22px 22px 0;
    border-color: transparent var(--accent) transparent transparent;
  }

  /* Tag pill */
  .tag-pill {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 3px 9px; border-radius: 20px;
    font-size: 10.5px; font-weight: 500;
    font-family: 'JetBrains Mono', monospace;
    background: var(--bg3); color: var(--text3);
    border: 1px solid var(--border); cursor: pointer;
    transition: all 0.15s; white-space: nowrap;
  }
  .tag-pill:hover { border-color: var(--accent-border); color: var(--accent); }
  .tag-pill.active { background: var(--accent-dim); color: var(--accent); border-color: var(--accent-border); }

  /* Buttons */
  .btn-primary {
    display: inline-flex; align-items: center; gap: 7px;
    background: var(--accent); color: #fff;
    border: none; border-radius: 9px;
    padding: 10px 18px; font-size: 13px; font-weight: 600;
    font-family: 'Plus Jakarta Sans', sans-serif;
    cursor: pointer; transition: all 0.18s; letter-spacing: -0.01em;
  }
  .btn-primary:hover { background: #17876a; transform: translateY(-1px); box-shadow: 0 6px 18px rgba(29,158,117,0.25); }
  .btn-primary:active { transform: scale(0.97); }

  .btn-ghost {
    display: inline-flex; align-items: center; gap: 7px;
    background: transparent; color: var(--text3);
    border: 1px solid var(--border2); border-radius: 9px;
    padding: 8px 14px; font-size: 12.5px; font-weight: 500;
    font-family: 'Plus Jakarta Sans', sans-serif;
    cursor: pointer; transition: all 0.18s; letter-spacing: -0.01em;
  }
  .btn-ghost:hover { border-color: var(--text3); color: var(--text); }

  .icon-btn {
    display: inline-flex; align-items: center; justify-content: center;
    width: 32px; height: 32px; border-radius: 8px;
    background: transparent; border: none; cursor: pointer;
    color: var(--text3); transition: all 0.15s;
  }
  .icon-btn:hover { background: var(--bg3); color: var(--text); }
  .icon-btn.active { background: var(--accent-dim); color: var(--accent); }

  /* Input */
  .app-input {
    background: var(--bg3);
    border: 1px solid var(--border);
    border-radius: 9px;
    padding: 9px 14px;
    font-size: 13px;
    font-family: 'Plus Jakarta Sans', sans-serif;
    color: var(--text);
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
    width: 100%;
  }
  .app-input::placeholder { color: var(--text4); }
  .app-input:focus { border-color: var(--accent-border); box-shadow: 0 0 0 3px var(--accent-dim); }

  /* Editor textarea */
  .note-editor {
    flex: 1;
    background: transparent;
    border: none;
    outline: none;
    resize: none;
    font-size: 14px;
    line-height: 1.75;
    font-family: 'Plus Jakarta Sans', sans-serif;
    color: var(--text);
    padding: 0;
    width: 100%;
  }

  /* Toast */
  .toast {
    position: fixed; bottom: 28px; right: 28px; z-index: 9999;
    background: var(--bg3);
    border: 1px solid var(--border2);
    border-radius: 12px;
    padding: 12px 18px;
    font-size: 13px; font-weight: 500; color: var(--text);
    display: flex; align-items: center; gap: 10px;
    box-shadow: 0 12px 36px rgba(0,0,0,0.4);
    animation: toastIn 0.3s ease both;
    font-family: 'Plus Jakarta Sans', sans-serif;
    max-width: 320px;
  }
  .toast.out { animation: toastOut 0.25s ease both; }

  /* Color dot */
  .color-dot {
    width: 18px; height: 18px; border-radius: 50%;
    cursor: pointer; border: 2px solid transparent;
    transition: all 0.15s; flex-shrink: 0;
  }
  .color-dot:hover { transform: scale(1.2); }
  .color-dot.selected { border-color: var(--text); }

  /* Modal overlay */
  .modal-overlay {
    position: fixed; inset: 0; z-index: 500;
    background: rgba(0,0,0,0.6);
    backdrop-filter: blur(6px);
    display: flex; align-items: center; justify-content: center;
    animation: fadeIn 0.2s ease both;
  }
  .modal-box {
    background: var(--bg2);
    border: 1px solid var(--border);
    border-radius: 20px;
    padding: 32px;
    width: 100%; max-width: 480px;
    box-shadow: 0 24px 64px rgba(0,0,0,0.5);
    animation: popIn 0.25s ease both;
  }

  /* Checklist */
  .check-row {
    display: flex; align-items: center; gap: 10px;
    padding: 6px 0; border-bottom: 1px solid var(--border);
    transition: opacity 0.2s;
  }
  .check-row:last-child { border-bottom: none; }
  .check-row.done { opacity: 0.45; }
  .check-box {
    width: 16px; height: 16px; border-radius: 4px;
    border: 1px solid var(--border2);
    background: transparent; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; transition: all 0.15s;
  }
  .check-box.checked { background: var(--accent); border-color: var(--accent); }

  /* Focus mode */
  .focus-overlay {
    position: fixed; inset: 0; z-index: 200;
    background: var(--bg);
    display: flex; align-items: center; justify-content: center;
    animation: fadeIn 0.3s ease;
  }

  /* Skeleton */
  .skeleton {
    background: linear-gradient(90deg, var(--bg3) 25%, var(--border) 50%, var(--bg3) 75%);
    background-size: 400px 100%;
    animation: shimmer 1.4s ease-in-out infinite;
    border-radius: 6px;
  }

  /* Dropdown */
  .dropdown {
    position: absolute; z-index: 100;
    background: var(--bg2);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 6px;
    box-shadow: 0 12px 36px rgba(0,0,0,0.35);
    min-width: 160px;
    animation: fadeUp 0.18s ease both;
  }
  .dropdown-item {
    display: flex; align-items: center; gap: 9px;
    padding: 8px 12px; border-radius: 7px;
    font-size: 13px; color: var(--text2);
    cursor: pointer; transition: all 0.12s;
    border: none; background: none; width: 100%; text-align: left;
    font-family: 'Plus Jakarta Sans', sans-serif;
  }
  .dropdown-item:hover { background: var(--bg3); color: var(--text); }
  .dropdown-item.danger:hover { background: rgba(224,80,80,0.1); color: #e05050; }

  /* Resize handle */
  .divider {
    width: 1px; background: var(--border);
    cursor: col-resize; flex-shrink: 0;
    transition: background 0.15s;
  }
  .divider:hover { background: var(--accent); }
`;

/* ── CONSTANTS ── */
const NOTE_COLORS = [
  { id: "none", hex: "transparent", label: "None" },
  { id: "green", hex: "#0d1f19", label: "Forest" },
  { id: "blue", hex: "#0d1522", label: "Ocean" },
  { id: "purple", hex: "#1a0d2e", label: "Violet" },
  { id: "amber", hex: "#1f1500", label: "Amber" },
  { id: "rose", hex: "#1f0d10", label: "Rose" },
];

const NOTE_COLORS_LIGHT = [
  { id: "none", hex: "transparent" },
  { id: "green", hex: "#e8f7f2" },
  { id: "blue", hex: "#e8f0fa" },
  { id: "purple", hex: "#f0eafa" },
  { id: "amber", hex: "#fdf5e0" },
  { id: "rose", hex: "#fde8ec" },
];

const CATEGORIES = ["Work", "Personal", "Study", "Ideas", "Health", "Travel"];
const TEMPLATES = [
  { name: "Meeting Notes", icon: "👥", content: "## Meeting Notes\n\n**Date:** \n**Attendees:** \n\n### Agenda\n- \n\n### Action Items\n- [ ] \n- [ ] \n\n### Notes\n" },
  { name: "Study Notes", icon: "📚", content: "## Study Notes\n\n**Topic:** \n**Date:** \n\n### Key Concepts\n- \n\n### Summary\n\n### Questions\n- " },
  { name: "Daily Journal", icon: "🌅", content: "## Daily Journal\n\n**Date:** \n\n### Today's Goals\n- [ ] \n- [ ] \n\n### Reflections\n\n### Gratitude\n- " },
  { name: "Project Plan", icon: "🚀", content: "## Project Plan\n\n**Project:** \n**Deadline:** \n\n### Objectives\n- \n\n### Tasks\n- [ ] \n- [ ] \n\n### Notes\n" },
  { name: "Brainstorm", icon: "🧠", content: "## Brainstorm\n\n**Topic:** \n\n### Ideas\n- \n- \n- \n\n### Best Ideas\n- \n\n### Next Steps\n- " },
  { name: "Quick Note", icon: "⚡", content: "" },
];

/* ── Seed data ── */
const SEED_NOTES = [
  { id: 1, title: "Ship landing page", content: "Polish the hero section copy and CTA buttons before Monday's demo. Need to review mobile breakpoints and fix the ticker animation on Safari.", category: "Work", tags: ["frontend", "urgent"], color: "green", pinned: true, favorite: true, createdAt: new Date(Date.now() - 86400000 * 2), updatedAt: new Date(Date.now() - 3600000), checklist: [], reminder: null, trashed: false },
  { id: 2, title: "CORS configuration", content: "Allow localhost:5173 in the .NET 9 CORS policy. Add headers for Authorization and Content-Type.\n\nbuilder.Services.AddCors(options => {\n  options.AddPolicy(\"Dev\", b => b.WithOrigins(\"http://localhost:5173\").AllowAnyHeader().AllowAnyMethod());\n});", category: "Work", tags: ["backend", "dotnet"], color: "blue", pinned: true, favorite: false, createdAt: new Date(Date.now() - 86400000 * 3), updatedAt: new Date(Date.now() - 7200000), checklist: [], reminder: null, trashed: false },
  { id: 3, title: "Read Clean Code", content: "Chapter 4: Comments\n- Comments should explain *why*, not *what*\n- Good code mostly documents itself\n- Avoid redundant comments\n\nChapter 5: Formatting\n- Vertical openness between concepts\n- Related code should appear vertically dense", category: "Study", tags: ["books", "programming"], color: "none", pinned: false, favorite: true, createdAt: new Date(Date.now() - 86400000 * 5), updatedAt: new Date(Date.now() - 86400000), checklist: [], reminder: null, trashed: false },
  { id: 4, title: "Grocery run", content: "Weekly shopping list", category: "Personal", tags: ["shopping"], color: "amber", pinned: false, favorite: false, createdAt: new Date(Date.now() - 86400000), updatedAt: new Date(Date.now() - 1800000), checklist: [{ id: 1, text: "Oat milk x2", done: true }, { id: 2, text: "Greek yoghurt", done: false }, { id: 3, text: "Sourdough bread", done: false }, { id: 4, text: "Cherry tomatoes", done: true }, { id: 5, text: "Avocados x3", done: false }], reminder: null, trashed: false },
  { id: 5, title: "App feature ideas", content: "Ideas for the next iteration:\n\n• AI-powered note summarisation\n• Voice-to-text capture\n• Markdown preview pane\n• Offline-first with IndexedDB\n• Collaborative editing via WebSockets\n• Browser extension for web clipping", category: "Ideas", tags: ["product", "brainstorm"], color: "purple", pinned: false, favorite: true, createdAt: new Date(Date.now() - 86400000 * 7), updatedAt: new Date(Date.now() - 86400000 * 2), checklist: [], reminder: null, trashed: false },
  { id: 6, title: "Morning run routine", content: "5:45am wake up\n6:00am dynamic warm-up (10 mins)\n6:10am 5k run at easy pace\n6:40am cool down & stretch\n6:55am cold shower\n7:10am breakfast", category: "Health", tags: ["fitness", "habit"], color: "none", pinned: false, favorite: false, createdAt: new Date(Date.now() - 86400000 * 10), updatedAt: new Date(Date.now() - 86400000 * 3), checklist: [], reminder: null, trashed: false },
];

/* ── Helpers ── */
const fmtDate = (d) => {
  const now = new Date();
  const diff = now - d;
  if (diff < 60000) return "just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const genId = () => Date.now() + Math.random();

/* ── SVG Icons ── */
const I = {
  logo: () => <svg width="26" height="26" viewBox="0 0 28 28" fill="none"><rect width="28" height="28" rx="8" fill="#1D9E75"/><rect x="6" y="6" width="7" height="7" rx="2" fill="white"/><rect x="15" y="6" width="7" height="7" rx="2" fill="white" opacity="0.55"/><rect x="6" y="15" width="7" height="7" rx="2" fill="white" opacity="0.55"/><rect x="15" y="15" width="7" height="7" rx="2" fill="white" opacity="0.25"/></svg>,
  plus: () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
  search: () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.5"/><path d="M10 10l2.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  notes: () => <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><rect x="2" y="2" width="11" height="13" rx="2" stroke="currentColor" strokeWidth="1.4"/><path d="M5 6h5M5 9h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  star: (filled) => <svg width="14" height="14" viewBox="0 0 14 14" fill={filled ? "currentColor" : "none"}><path d="M7 1.5l1.6 3.2 3.5.5-2.55 2.5.6 3.5L7 9.6l-3.15 1.6.6-3.5L2 5.2l3.5-.5L7 1.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>,
  pin: (filled) => <svg width="14" height="14" viewBox="0 0 14 14" fill={filled ? "currentColor" : "none"}><path d="M9 2L12 5l-2 2-.5 3L7 8.5l-3 3.5-.5-1L6.5 7 5 5.5l3-.5L9 2z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>,
  trash: () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 4h10M5 4V2.5a.5.5 0 01.5-.5h3a.5.5 0 01.5.5V4M11 4l-.8 7.5a1 1 0 01-1 .5H4.8a1 1 0 01-1-.5L3 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>,
  edit: () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M8.5 2.5l3 3-7 7H1.5v-3l7-7z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>,
  grid: () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1.5" y="1.5" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="1.3"/><rect x="8.5" y="1.5" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="1.3"/><rect x="1.5" y="8.5" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="1.3"/><rect x="8.5" y="8.5" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="1.3"/></svg>,
  list: () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 4h8M3 7h8M3 10h5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>,
  cols: () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1.5" y="2" width="4" height="10" rx="1" stroke="currentColor" strokeWidth="1.3"/><rect x="8.5" y="2" width="4" height="10" rx="1" stroke="currentColor" strokeWidth="1.3"/></svg>,
  moon: () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M12 8.5A5.5 5.5 0 015.5 2a5.5 5.5 0 100 10A5.5 5.5 0 0012 8.5z" stroke="currentColor" strokeWidth="1.4"/></svg>,
  sun: () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="2.5" stroke="currentColor" strokeWidth="1.4"/><path d="M7 1v1.5M7 11.5V13M1 7h1.5M11.5 7H13M2.9 2.9l1.1 1.1M10 10l1.1 1.1M2.9 11.1L4 10M10 4l1.1-1.1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  focus: () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 4V2a1 1 0 011-1h2M10 1h2a1 1 0 011 1v2M13 10v2a1 1 0 01-1 1h-2M4 13H2a1 1 0 01-1-1v-2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>,
  tag: () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 2h5l5 5-5 5-5-5V2z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/><circle cx="5" cy="5" r="1" fill="currentColor"/></svg>,
  folder: () => <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M1.5 4a1 1 0 011-1h3l1.5 2h5a1 1 0 011 1v5a1 1 0 01-1 1h-10a1 1 0 01-1-1V4z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/></svg>,
  check: () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2.5 7l3 3 6-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  checklist: () => <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M2 4h2.5M2 7.5h2.5M2 11h2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><path d="M7 4l1.5 1.5L11 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/><path d="M7 7.5l1.5 1.5L11 6.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/><path d="M7 11l1.5 1.5L11 10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  clock: () => <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><circle cx="6.5" cy="6.5" r="5.5" stroke="currentColor" strokeWidth="1.3"/><path d="M6.5 4v2.5l1.5 1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  more: () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="3" cy="7" r="1.2" fill="currentColor"/><circle cx="7" cy="7" r="1.2" fill="currentColor"/><circle cx="11" cy="7" r="1.2" fill="currentColor"/></svg>,
  close: () => <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M1.5 1.5l10 10M11.5 1.5l-10 10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>,
  export: () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v8M4 6l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M2 10v1.5a.5.5 0 00.5.5h9a.5.5 0 00.5-.5V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  restore: () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7a5 5 0 109 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M2 4v3h3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  bell: () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1.5A4.5 4.5 0 002.5 6v3l-1 1.5h11L11.5 9V6A4.5 4.5 0 007 1.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><path d="M5.5 11.5a1.5 1.5 0 003 0" stroke="currentColor" strokeWidth="1.3"/></svg>,
  template: () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1.5" y="1.5" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.3"/><path d="M1.5 5.5h11" stroke="currentColor" strokeWidth="1.3"/><path d="M5.5 5.5v7" stroke="currentColor" strokeWidth="1.3"/></svg>,
  collapse: () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 3L5 7l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  expand: () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  palette: () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.3"/><circle cx="5" cy="5.5" r="1" fill="currentColor"/><circle cx="9" cy="5.5" r="1" fill="currentColor"/><circle cx="7" cy="9" r="1" fill="currentColor"/></svg>,
};

/* ── Toast component ── */
function Toast({ msg, icon, onDone }) {
  const [out, setOut] = useState(false);
  useEffect(() => {
    const t1 = setTimeout(() => setOut(true), 2500);
    const t2 = setTimeout(() => onDone(), 2800);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);
  return (
    <div className={`toast${out ? " out" : ""}`}>
      <span style={{ fontSize: "16px" }}>{icon || "✦"}</span>
      <span>{msg}</span>
    </div>
  );
}

/* ── Note Card ── */
function NoteCard({ note, selected, onSelect, onPin, onFav, onDelete, view, theme }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const colorEntry = (theme === "dark" ? NOTE_COLORS : NOTE_COLORS_LIGHT).find(c => c.id === note.color);
  const bg = colorEntry?.hex !== "transparent" ? colorEntry?.hex : undefined;
  const doneCount = note.checklist.filter(c => c.done).length;

  useEffect(() => {
    const handler = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div
      className={`note-card${selected ? " selected" : ""}${note.pinned ? " pinned" : ""}`}
      style={{ background: bg || undefined, cursor: "pointer" }}
      onClick={() => onSelect(note.id)}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "8px", gap: "8px" }}>
        <h3 style={{
          fontSize: view === "list" ? "13.5px" : "14px",
          fontWeight: 600, color: "var(--text)",
          letterSpacing: "-0.02em", lineHeight: 1.3,
          flex: 1, overflow: "hidden",
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
        }}>{note.title || "Untitled"}</h3>

        <div style={{ display: "flex", gap: "2px", flexShrink: 0 }}>
          <button className={`icon-btn${note.favorite ? " active" : ""}`} style={{ width: "26px", height: "26px" }}
            onClick={e => { e.stopPropagation(); onFav(note.id); }}>
            {I.star(note.favorite)}
          </button>
          <div style={{ position: "relative" }} ref={menuRef}>
            <button className="icon-btn" style={{ width: "26px", height: "26px" }}
              onClick={e => { e.stopPropagation(); setMenuOpen(p => !p); }}>
              {I.more()}
            </button>
            {menuOpen && (
              <div className="dropdown" style={{ right: 0, top: "34px" }}>
                <button className="dropdown-item" onClick={e => { e.stopPropagation(); onPin(note.id); setMenuOpen(false); }}>
                  {I.pin(note.pinned)} {note.pinned ? "Unpin" : "Pin"}
                </button>
                <button className="dropdown-item danger" onClick={e => { e.stopPropagation(); onDelete(note.id); setMenuOpen(false); }}>
                  {I.trash()} Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content preview */}
      {view !== "list" && note.content && !note.checklist.length && (
        <p style={{
          fontSize: "12.5px", color: "var(--text3)", lineHeight: 1.6,
          overflow: "hidden", display: "-webkit-box",
          WebkitLineClamp: view === "grid" ? 3 : 2, WebkitBoxOrient: "vertical",
          marginBottom: "10px",
        }}>
          {note.content.replace(/#+\s/g, "").replace(/\*\*/g, "").replace(/- \[.\] /g, "")}
        </p>
      )}

      {/* Checklist preview */}
      {note.checklist.length > 0 && (
        <div style={{ marginBottom: "10px" }}>
          <div style={{
            height: "4px", background: "var(--border)", borderRadius: "2px", overflow: "hidden", marginBottom: "5px",
          }}>
            <div style={{
              height: "100%", background: "var(--accent)", borderRadius: "2px",
              width: `${(doneCount / note.checklist.length) * 100}%`,
              transition: "width 0.3s",
            }} />
          </div>
          <span style={{ fontSize: "11px", color: "var(--text3)", fontFamily: "'JetBrains Mono', monospace" }}>
            {doneCount}/{note.checklist.length} done
          </span>
        </div>
      )}

      {/* Footer */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
        <div style={{ display: "flex", gap: "5px", flexWrap: "wrap", flex: 1 }}>
          {note.category && (
            <span className="tag-pill" style={{ fontSize: "10px", padding: "2px 7px" }}>
              {note.category}
            </span>
          )}
          {note.tags.slice(0, 2).map(t => (
            <span key={t} className="tag-pill" style={{ fontSize: "10px", padding: "2px 7px" }}>#{t}</span>
          ))}
        </div>
        <span style={{ fontSize: "10.5px", color: "var(--text4)", fontFamily: "'JetBrains Mono', monospace", flexShrink: 0, display: "flex", alignItems: "center", gap: "4px" }}>
          {I.clock()} {fmtDate(note.updatedAt)}
        </span>
      </div>
    </div>
  );
}

/* ── Editor Panel ── */
function EditorPanel({ note, onUpdate, onClose, onFav, onPin, onDelete, onExport, theme }) {
  const [title, setTitle] = useState(note?.title || "");
  const [content, setContent] = useState(note?.content || "");
  const [focusMode, setFocusMode] = useState(false);
  const [showColors, setShowColors] = useState(false);
  const [newCheckItem, setNewCheckItem] = useState("");
  const saveTimer = useRef(null);
  const colorRef = useRef(null);

  useEffect(() => {
    if (note) { setTitle(note.title); setContent(note.content); }
  }, [note?.id]);

  useEffect(() => {
    if (!note) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      onUpdate(note.id, { title, content, updatedAt: new Date() });
    }, 600);
    return () => clearTimeout(saveTimer.current);
  }, [title, content]);

  useEffect(() => {
    const h = (e) => { if (colorRef.current && !colorRef.current.contains(e.target)) setShowColors(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  if (!note) return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "12px" }}>
      <div style={{ width: "48px", height: "48px", background: "var(--bg3)", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text4)" }}>{I.notes()}</div>
      <p style={{ fontSize: "13px", color: "var(--text4)", fontFamily: "'JetBrains Mono', monospace" }}>select a note</p>
    </div>
  );

  const colors = theme === "dark" ? NOTE_COLORS : NOTE_COLORS_LIGHT;

  const addCheckItem = () => {
    if (!newCheckItem.trim()) return;
    onUpdate(note.id, {
      checklist: [...note.checklist, { id: genId(), text: newCheckItem.trim(), done: false }],
      updatedAt: new Date(),
    });
    setNewCheckItem("");
  };

  const toggleCheck = (cid) => {
    onUpdate(note.id, {
      checklist: note.checklist.map(c => c.id === cid ? { ...c, done: !c.done } : c),
      updatedAt: new Date(),
    });
  };

  const removeCheck = (cid) => {
    onUpdate(note.id, { checklist: note.checklist.filter(c => c.id !== cid), updatedAt: new Date() });
  };

  const editorContent = (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", padding: focusMode ? "0" : "0" }}>
      {/* Toolbar */}
      <div style={{
        display: "flex", alignItems: "center", gap: "4px",
        padding: "12px 20px", borderBottom: "1px solid var(--border)",
        background: "var(--bg2)",
      }}>
        {!focusMode && (
          <button className="icon-btn" onClick={onClose} title="Close">{I.close()}</button>
        )}
        <div style={{ flex: 1 }} />
        <div style={{ position: "relative" }} ref={colorRef}>
          <button className="icon-btn" onClick={() => setShowColors(p => !p)} title="Note color">{I.palette()}</button>
          {showColors && (
            <div className="dropdown" style={{ right: 0, top: "38px", padding: "12px", display: "flex", gap: "8px" }}>
              {colors.map(c => (
                <div
                  key={c.id}
                  className={`color-dot${note.color === c.id ? " selected" : ""}`}
                  style={{ background: c.hex !== "transparent" ? c.hex : "var(--bg3)", border: c.id === "none" ? "1px solid var(--border2)" : undefined }}
                  onClick={() => { onUpdate(note.id, { color: c.id }); setShowColors(false); }}
                  title={c.label}
                />
              ))}
            </div>
          )}
        </div>
        <button className={`icon-btn${note.pinned ? " active" : ""}`} onClick={() => onPin(note.id)} title="Pin">
          {I.pin(note.pinned)}
        </button>
        <button className={`icon-btn${note.favorite ? " active" : ""}`} onClick={() => onFav(note.id)} title="Favourite">
          {I.star(note.favorite)}
        </button>
        <button className="icon-btn" onClick={() => setFocusMode(p => !p)} title="Focus mode">{I.focus()}</button>
        <button className="icon-btn" onClick={() => onExport(note)} title="Export">{I.export()}</button>
        <button className="icon-btn" onClick={() => onDelete(note.id)} title="Delete" style={{ color: "var(--text3)" }}>{I.trash()}</button>
      </div>

      {/* Title */}
      <div style={{ padding: "24px 24px 0" }}>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Note title…"
          style={{
            width: "100%", background: "transparent", border: "none", outline: "none",
            fontSize: "22px", fontWeight: 700, color: "var(--text)",
            fontFamily: "'Instrument Serif', serif", letterSpacing: "-0.02em",
            lineHeight: 1.2,
          }}
        />
        <div style={{ display: "flex", gap: "12px", marginTop: "8px", marginBottom: "16px", fontSize: "11px", color: "var(--text4)", fontFamily: "'JetBrains Mono', monospace" }}>
          <span>Created {fmtDate(note.createdAt)}</span>
          <span>·</span>
          <span>Updated {fmtDate(note.updatedAt)}</span>
          <span style={{ marginLeft: "auto", color: "var(--accent)", fontSize: "10px" }}>● auto-saved</span>
        </div>
        <div style={{ height: "1px", background: "var(--border)" }} />
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflow: "auto", padding: "16px 24px 24px" }}>
        <textarea
          className="note-editor"
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="Start writing…"
          style={{ minHeight: "200px" }}
        />

        {/* Checklist section */}
        {(note.checklist.length > 0 || true) && (
          <div style={{ marginTop: "20px", borderTop: "1px solid var(--border)", paddingTop: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
              <span style={{ color: "var(--accent)" }}>{I.checklist()}</span>
              <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text3)", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.04em", textTransform: "uppercase" }}>Checklist</span>
              {note.checklist.length > 0 && (
                <span style={{ fontSize: "11px", color: "var(--text4)", fontFamily: "'JetBrains Mono', monospace", marginLeft: "auto" }}>
                  {note.checklist.filter(c => c.done).length}/{note.checklist.length}
                </span>
              )}
            </div>

            {note.checklist.map(item => (
              <div key={item.id} className={`check-row${item.done ? " done" : ""}`}>
                <div className={`check-box${item.done ? " checked" : ""}`} onClick={() => toggleCheck(item.id)}>
                  {item.done && <svg width="9" height="9" viewBox="0 0 9 9" fill="none"><path d="M1.5 4.5l2 2 4-4" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                </div>
                <span style={{ flex: 1, fontSize: "13px", color: "var(--text)", textDecoration: item.done ? "line-through" : "none", letterSpacing: "-0.01em" }}>{item.text}</span>
                <button className="icon-btn" style={{ width: "22px", height: "22px", opacity: 0.4 }} onClick={() => removeCheck(item.id)}>{I.close()}</button>
              </div>
            ))}

            <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
              <input
                className="app-input"
                placeholder="Add item…"
                value={newCheckItem}
                onChange={e => setNewCheckItem(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addCheckItem()}
                style={{ fontSize: "13px", padding: "8px 12px" }}
              />
              <button className="btn-primary" onClick={addCheckItem} style={{ padding: "8px 14px", flexShrink: 0 }}>
                {I.plus()}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tag row */}
      <div style={{ padding: "12px 24px", borderTop: "1px solid var(--border)", display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ color: "var(--text4)" }}>{I.tag()}</span>
        {note.tags.map(t => (
          <span key={t} className="tag-pill">
            #{t}
            <button style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", padding: 0, lineHeight: 1, marginLeft: "2px" }}
              onClick={() => onUpdate(note.id, { tags: note.tags.filter(x => x !== t) })}>×</button>
          </span>
        ))}
        <span className="tag-pill" style={{ cursor: "text" }}>
          <input
            placeholder="+ tag"
            style={{ background: "none", border: "none", outline: "none", width: "40px", fontSize: "10.5px", color: "var(--text3)", fontFamily: "'JetBrains Mono', monospace", cursor: "text" }}
            onKeyDown={e => {
              if (e.key === "Enter" && e.target.value.trim()) {
                onUpdate(note.id, { tags: [...new Set([...note.tags, e.target.value.trim().toLowerCase()])] });
                e.target.value = "";
              }
            }}
          />
        </span>
      </div>
    </div>
  );

  if (focusMode) return (
    <div className="focus-overlay">
      <div style={{ width: "100%", maxWidth: "680px", height: "100vh", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: "11px", color: "var(--text4)", fontFamily: "'JetBrains Mono', monospace", animation: "pulse2 2s infinite" }}>● focus mode</span>
          <button className="btn-ghost" onClick={() => setFocusMode(false)} style={{ fontSize: "12px", padding: "6px 12px" }}>Exit focus</button>
        </div>
        {editorContent}
      </div>
    </div>
  );

  return editorContent;
}

/* ── MAIN APP ── */
export default function NotesUi() {
  const [notes, setNotes] = useState(SEED_NOTES);
  const [selectedId, setSelectedId] = useState(null);
  const [view, setView] = useState("grid"); // grid | list | cols
  const [theme, setTheme] = useState("dark");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [activeSection, setActiveSection] = useState("all"); // all | favorites | pinned | trash | category:X
  const [activeTag, setActiveTag] = useState(null);
  const [toast, setToast] = useState(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [sortBy, setSortBy] = useState("updated"); // updated | created | title
  const toastRef = useRef(null);

  // Apply theme
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme === "dark" ? "dark" : "light");
  }, [theme]);

  const showToast = useCallback((msg, icon) => {
    setToast({ msg, icon, key: Date.now() });
  }, []);

  /* ── CRUD ── */
  const createNote = (template = null) => {
    const n = {
      id: genId(),
      title: template?.name === "Quick Note" ? "" : template ? template.name : "",
      content: template?.content || "",
      category: "Personal",
      tags: [],
      color: "none",
      pinned: false,
      favorite: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      checklist: [],
      reminder: null,
      trashed: false,
    };
    setNotes(prev => [n, ...prev]);
    setSelectedId(n.id);
    setEditorOpen(true);
    setShowTemplates(false);
    showToast("Note created", "✦");
  };

  const updateNote = useCallback((id, patch) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, ...patch } : n));
  }, []);

  const deleteNote = useCallback((id) => {
    const note = notes.find(n => n.id === id);
    if (note?.trashed) {
      setNotes(prev => prev.filter(n => n.id !== id));
      showToast("Permanently deleted", "🗑️");
    } else {
      updateNote(id, { trashed: true, updatedAt: new Date() });
      showToast("Moved to trash", "🗑️");
    }
    if (selectedId === id) { setSelectedId(null); setEditorOpen(false); }
  }, [notes, selectedId, updateNote, showToast]);

  const restoreNote = useCallback((id) => {
    updateNote(id, { trashed: false, updatedAt: new Date() });
    showToast("Note restored", "✨");
  }, [updateNote, showToast]);

  const togglePin = useCallback((id) => {
    const n = notes.find(x => x.id === id);
    updateNote(id, { pinned: !n.pinned });
    showToast(n.pinned ? "Unpinned" : "Pinned", "📌");
  }, [notes, updateNote, showToast]);

  const toggleFav = useCallback((id) => {
    const n = notes.find(x => x.id === id);
    updateNote(id, { favorite: !n.favorite });
    showToast(n.favorite ? "Removed from favourites" : "Added to favourites", "⭐");
  }, [notes, updateNote, showToast]);

  const exportNote = useCallback((note) => {
    const blob = new Blob([`# ${note.title}\n\n${note.content}`], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${note.title || "note"}.txt`;
    a.click();
    showToast("Exported as .txt", "📦");
  }, [showToast]);

  /* ── Filtered & sorted notes ── */
  const visibleNotes = (() => {
    let list = notes.filter(n => {
      if (activeSection === "trash") return n.trashed;
      if (n.trashed) return false;
      if (activeSection === "favorites") return n.favorite;
      if (activeSection === "pinned") return n.pinned;
      if (activeSection.startsWith("cat:")) return n.category === activeSection.slice(4);
      return true;
    });

    if (activeTag) list = list.filter(n => n.tags.includes(activeTag));

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(n => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q) || n.tags.some(t => t.includes(q)));
    }

    list = [...list].sort((a, b) => {
      if (sortBy === "title") return a.title.localeCompare(b.title);
      if (sortBy === "created") return b.createdAt - a.createdAt;
      return b.updatedAt - a.updatedAt;
    });

    // Pinned first (except trash)
    if (activeSection !== "trash") {
      list = [...list.filter(n => n.pinned), ...list.filter(n => !n.pinned)];
    }

    return list;
  })();

  const selectedNote = notes.find(n => n.id === selectedId) || null;

  /* ── All tags ── */
  const allTags = [...new Set(notes.flatMap(n => n.tags))];

  /* ── Counts ── */
  const counts = {
    all: notes.filter(n => !n.trashed).length,
    favorites: notes.filter(n => n.favorite && !n.trashed).length,
    pinned: notes.filter(n => n.pinned && !n.trashed).length,
    trash: notes.filter(n => n.trashed).length,
  };

  const gridCols = view === "grid" ? "repeat(auto-fill, minmax(240px, 1fr))"
    : view === "cols" ? "repeat(2, 1fr)"
    : "1fr";

  return (
    <>
      <style>{G}</style>

      {/* Templates modal */}
      {showTemplates && (
        <div className="modal-overlay" onClick={() => setShowTemplates(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
              <div>
                <h2 style={{ fontSize: "18px", fontFamily: "'Instrument Serif', serif", fontWeight: 400, color: "var(--text)", letterSpacing: "-0.02em" }}>
                  Choose a template
                </h2>
                <p style={{ fontSize: "12px", color: "var(--text3)", marginTop: "3px" }}>Start with a structured note</p>
              </div>
              <button className="icon-btn" onClick={() => setShowTemplates(false)}>{I.close()}</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px" }}>
              {TEMPLATES.map(t => (
                <button key={t.name} onClick={() => createNote(t)}
                  style={{
                    background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: "12px",
                    padding: "14px 16px", cursor: "pointer", textAlign: "left",
                    transition: "all 0.15s", display: "flex", alignItems: "center", gap: "10px",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--accent-border)"; e.currentTarget.style.background = "var(--accent-bg)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.background = "var(--bg3)"; }}
                >
                  <span style={{ fontSize: "22px" }}>{t.icon}</span>
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)", letterSpacing: "-0.01em" }}>{t.name}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="app-layout">

        {/* ── SIDEBAR ── */}
        <aside className={`sidebar${sidebarCollapsed ? " collapsed" : ""}`}>
          {/* Logo row */}
          <div style={{
            padding: "16px", display: "flex", alignItems: "center",
            justifyContent: sidebarCollapsed ? "center" : "space-between",
            borderBottom: "1px solid var(--border)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
              {I.logo()}
              {!sidebarCollapsed && (
                <span style={{ fontSize: "15px", fontWeight: 700, color: "var(--text)", letterSpacing: "-0.02em" }}>Notes</span>
              )}
            </div>
            {!sidebarCollapsed && (
              <button className="icon-btn" onClick={() => setSidebarCollapsed(true)}>{I.collapse()}</button>
            )}
          </div>

          {sidebarCollapsed && (
            <div style={{ padding: "8px 0", display: "flex", justifyContent: "center" }}>
              <button className="icon-btn" onClick={() => setSidebarCollapsed(false)}>{I.expand()}</button>
            </div>
          )}

          <div style={{ flex: 1, overflow: "auto", padding: "12px 10px" }}>
            {/* New note */}
            {!sidebarCollapsed ? (
              <div style={{ display: "flex", gap: "6px", marginBottom: "16px" }}>
                <button className="btn-primary" onClick={() => createNote()} style={{ flex: 1, padding: "9px 12px", fontSize: "13px" }}>
                  {I.plus()} New note
                </button>
                <button className="btn-ghost" onClick={() => setShowTemplates(true)} title="Templates" style={{ padding: "9px 10px" }}>
                  {I.template()}
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", justifyContent: "center", marginBottom: "12px" }}>
                <button className="icon-btn active" onClick={() => createNote()} style={{ width: "36px", height: "36px" }}>{I.plus()}</button>
              </div>
            )}

            {/* Main nav */}
            {[
              { key: "all", icon: I.notes(), label: "All Notes", count: counts.all },
              { key: "favorites", icon: I.star(true), label: "Favourites", count: counts.favorites },
              { key: "pinned", icon: I.pin(true), label: "Pinned", count: counts.pinned },
            ].map(item => (
              <button
                key={item.key}
                className={`nav-item${activeSection === item.key ? " active" : ""}`}
                onClick={() => { setActiveSection(item.key); setActiveTag(null); }}
                title={item.label}
              >
                <span style={{ flexShrink: 0 }}>{item.icon}</span>
                {!sidebarCollapsed && (
                  <>
                    <span style={{ flex: 1 }}>{item.label}</span>
                    {item.count > 0 && (
                      <span style={{ fontSize: "10.5px", color: "var(--text4)", fontFamily: "'JetBrains Mono', monospace", background: "var(--bg3)", padding: "1px 7px", borderRadius: "20px" }}>{item.count}</span>
                    )}
                  </>
                )}
              </button>
            ))}

            {/* Categories */}
            {!sidebarCollapsed && (
              <div style={{ margin: "16px 4px 6px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "10px", fontWeight: 600, color: "var(--text4)", letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "'JetBrains Mono', monospace" }}>
                  Categories
                </span>
              </div>
            )}

            {CATEGORIES.map(cat => (
              <button
                key={cat}
                className={`nav-item${activeSection === `cat:${cat}` ? " active" : ""}`}
                onClick={() => { setActiveSection(`cat:${cat}`); setActiveTag(null); }}
                title={cat}
              >
                <span style={{ flexShrink: 0 }}>{I.folder()}</span>
                {!sidebarCollapsed && (
                  <>
                    <span style={{ flex: 1 }}>{cat}</span>
                    <span style={{ fontSize: "10.5px", color: "var(--text4)", fontFamily: "'JetBrains Mono', monospace" }}>
                      {notes.filter(n => n.category === cat && !n.trashed).length}
                    </span>
                  </>
                )}
              </button>
            ))}

            {/* Tags */}
            {!sidebarCollapsed && allTags.length > 0 && (
              <>
                <div style={{ margin: "16px 4px 8px" }}>
                  <span style={{ fontSize: "10px", fontWeight: 600, color: "var(--text4)", letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "'JetBrains Mono', monospace" }}>
                    Tags
                  </span>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", padding: "0 4px" }}>
                  {allTags.map(t => (
                    <span key={t} className={`tag-pill${activeTag === t ? " active" : ""}`}
                      onClick={() => setActiveTag(prev => prev === t ? null : t)}>
                      #{t}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Sidebar footer */}
          <div style={{ padding: "10px", borderTop: "1px solid var(--border)" }}>
            <button
              className={`nav-item${activeSection === "trash" ? " active" : ""}`}
              onClick={() => { setActiveSection("trash"); setActiveTag(null); }}
              title="Trash"
            >
              <span>{I.trash()}</span>
              {!sidebarCollapsed && (
                <>
                  <span style={{ flex: 1 }}>Trash</span>
                  {counts.trash > 0 && <span style={{ fontSize: "10.5px", color: "var(--text4)", fontFamily: "'JetBrains Mono', monospace" }}>{counts.trash}</span>}
                </>
              )}
            </button>

            <button className="nav-item" onClick={() => setTheme(t => t === "dark" ? "light" : "dark")} title="Toggle theme">
              <span>{theme === "dark" ? I.sun() : I.moon()}</span>
              {!sidebarCollapsed && <span>{theme === "dark" ? "Light mode" : "Dark mode"}</span>}
            </button>
          </div>
        </aside>

        {/* ── MAIN ── */}
        <div className="main-area">

          {/* Topbar */}
          <div style={{
            display: "flex", alignItems: "center", gap: "10px",
            padding: "12px 20px", borderBottom: "1px solid var(--border)",
            background: "var(--bg2)", flexShrink: 0,
          }}>
            {/* Search */}
            <div style={{ position: "relative", flex: 1, maxWidth: "360px" }}>
              <span style={{ position: "absolute", left: "11px", top: "50%", transform: "translateY(-50%)", color: "var(--text4)", pointerEvents: "none" }}>
                {I.search()}
              </span>
              <input
                className="app-input"
                placeholder="Search notes…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ paddingLeft: "34px", paddingTop: "8px", paddingBottom: "8px" }}
              />
            </div>

            <div style={{ flex: 1 }} />

            {/* Sort */}
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              style={{
                background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: "8px",
                padding: "7px 10px", fontSize: "12px", color: "var(--text2)",
                outline: "none", cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            >
              <option value="updated">Last updated</option>
              <option value="created">Date created</option>
              <option value="title">Title A–Z</option>
            </select>

            {/* View toggle */}
            <div style={{ display: "flex", gap: "2px", background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: "8px", padding: "3px" }}>
              {[["grid", I.grid()], ["cols", I.cols()], ["list", I.list()]].map(([v, icon]) => (
                <button key={v} className={`icon-btn${view === v ? " active" : ""}`} onClick={() => setView(v)} title={v}>
                  {icon}
                </button>
              ))}
            </div>
          </div>

          {/* Section header */}
          <div style={{
            padding: "16px 20px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0,
          }}>
            <div>
              <h2 style={{ fontSize: "17px", fontFamily: "'Instrument Serif', serif", fontWeight: 400, color: "var(--text)", letterSpacing: "-0.02em" }}>
                {activeSection === "all" ? "All Notes"
                  : activeSection === "favorites" ? "Favourites"
                  : activeSection === "pinned" ? "Pinned"
                  : activeSection === "trash" ? "Trash"
                  : activeSection.slice(4)}
                {activeTag && <span style={{ color: "var(--accent)", fontStyle: "italic" }}> · #{activeTag}</span>}
              </h2>
              <span style={{ fontSize: "11.5px", color: "var(--text4)", fontFamily: "'JetBrains Mono', monospace" }}>
                {visibleNotes.length} note{visibleNotes.length !== 1 ? "s" : ""}
                {search && ` matching "${search}"`}
              </span>
            </div>

            {activeSection === "trash" && counts.trash > 0 && (
              <button className="btn-ghost" style={{ fontSize: "12px", color: "#e05050", borderColor: "rgba(224,80,80,0.3)" }}
                onClick={() => {
                  setNotes(prev => prev.filter(n => !n.trashed));
                  showToast("Trash emptied", "🗑️");
                }}>
                Empty trash
              </button>
            )}
          </div>

          {/* Notes grid */}
          <div style={{ flex: 1, overflow: "auto", padding: "0 20px 24px" }}>
            {visibleNotes.length === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "60%", gap: "12px", animation: "fadeIn 0.3s ease" }}>
                <div style={{ width: "52px", height: "52px", background: "var(--bg3)", borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text4)", fontSize: "22px" }}>
                  {search ? "🔍" : activeSection === "trash" ? "🗑️" : "✦"}
                </div>
                <p style={{ fontSize: "14px", color: "var(--text3)", fontFamily: "'Instrument Serif', serif" }}>
                  {search ? "No notes found" : activeSection === "trash" ? "Trash is empty" : "No notes yet"}
                </p>
                {!search && activeSection === "all" && (
                  <button className="btn-primary" onClick={() => createNote()} style={{ marginTop: "4px", fontSize: "13px", padding: "10px 20px" }}>
                    {I.plus()} Create your first note
                  </button>
                )}
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: gridCols, gap: "12px", animation: "fadeIn 0.2s ease" }}>
                {visibleNotes.map(note => (
                  activeSection === "trash" ? (
                    /* Trash card */
                    <div key={note.id} className="note-card" style={{ opacity: 0.7 }}>
                      <h3 style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)", marginBottom: "6px", letterSpacing: "-0.02em" }}>{note.title || "Untitled"}</h3>
                      <p style={{ fontSize: "12px", color: "var(--text3)", marginBottom: "12px", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{note.content}</p>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button className="btn-ghost" onClick={() => restoreNote(note.id)} style={{ flex: 1, fontSize: "12px", padding: "7px 10px" }}>
                          {I.restore()} Restore
                        </button>
                        <button className="btn-ghost" onClick={() => deleteNote(note.id)} style={{ flex: 1, fontSize: "12px", padding: "7px 10px", color: "#e05050", borderColor: "rgba(224,80,80,0.3)" }}>
                          {I.trash()} Delete
                        </button>
                      </div>
                    </div>
                  ) : (
                    <NoteCard
                      key={note.id}
                      note={note}
                      selected={selectedId === note.id}
                      onSelect={(id) => { setSelectedId(id); setEditorOpen(true); }}
                      onPin={togglePin}
                      onFav={toggleFav}
                      onDelete={deleteNote}
                      view={view}
                      theme={theme}
                    />
                  )
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── EDITOR ── */}
        <div className={`editor-panel${editorOpen && selectedNote ? "" : " hidden"}`}>
          {editorOpen && selectedNote && (
            <EditorPanel
              note={selectedNote}
              onUpdate={updateNote}
              onClose={() => { setEditorOpen(false); setSelectedId(null); }}
              onFav={toggleFav}
              onPin={togglePin}
              onDelete={deleteNote}
              onExport={exportNote}
              theme={theme}
            />
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && <Toast key={toast.key} msg={toast.msg} icon={toast.icon} onDone={() => setToast(null)} />}
    </>
  );
}
