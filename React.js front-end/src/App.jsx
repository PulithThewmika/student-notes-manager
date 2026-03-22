import { useState, useEffect, useCallback } from "react";
import axios from "axios";

let API_BASE = import.meta.env.VITE_AZURE_BACKEND || "http://localhost:5000/api/notes";
if (import.meta.env.VITE_AZURE_BACKEND && !import.meta.env.VITE_AZURE_BACKEND.endsWith('/api/notes')) {
  API_BASE = `${import.meta.env.VITE_AZURE_BACKEND.replace(/\/$/, '')}/api/notes`;
}

/* ── Google Fonts ── */
const fontLink = document.createElement("link");
fontLink.rel = "stylesheet";
fontLink.href =
  "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap";
document.head.appendChild(fontLink);

/* ── Global CSS ── */
const globalCSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    background: #f5f4f0;
    font-family: 'Plus Jakarta Sans', sans-serif;
    color: #1a1916;
    min-height: 100vh;
  }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes slideInRight {
    from { opacity: 0; transform: translateX(16px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes fadeOut {
    from { opacity: 1; }
    to   { opacity: 0; transform: translateX(12px); }
  }
  .note-enter  { animation: fadeUp 0.28s cubic-bezier(0.22,1,0.36,1) both; }
  .toast-enter { animation: slideInRight 0.25s cubic-bezier(0.22,1,0.36,1) both; }
  .toast-exit  { animation: fadeOut 0.25s ease forwards; }
  input:focus, textarea:focus {
    outline: none;
    border-color: #1D9E75 !important;
    box-shadow: 0 0 0 3px rgba(29,158,117,0.12) !important;
  }
  button { cursor: pointer; font-family: 'Plus Jakarta Sans', sans-serif; }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #d4d2cc; border-radius: 4px; }
`;

/* ── Icons ── */
const SearchIcon = () => (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
    <circle cx="7" cy="7" r="5" stroke="#9e9c96" strokeWidth="1.5"/>
    <path d="M11 11L14 14" stroke="#9e9c96" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);
const PlusIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);
const TrashIcon = () => (
  <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
    <path d="M2 4h10M5 4V2.5a.5.5 0 01.5-.5h3a.5.5 0 01.5.5V4M5.5 6.5v4M8.5 6.5v4M3 4l.7 7.5a.5.5 0 00.5.5h5.6a.5.5 0 00.5-.5L11 4"
      stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const StarIcon = ({ filled }) => (
  <svg width="13" height="13" viewBox="0 0 14 14" fill={filled ? "#1D9E75" : "none"}>
    <path d="M7 1.5l1.545 3.13 3.455.502-2.5 2.436.59 3.44L7 9.385l-3.09 1.623.59-3.44L2 5.132l3.455-.502L7 1.5z"
      stroke="#1D9E75" strokeWidth="1.3" strokeLinejoin="round"/>
  </svg>
);
const CheckIcon = () => (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
    <path d="M1.5 5l2.5 2.5 4.5-5" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const NotesEmptyIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M5 10h10M5 6h10M5 14h6" stroke="#b8b6b0" strokeWidth="1.6" strokeLinecap="round"/>
  </svg>
);

/* ── Toast ── */
function useToast() {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((msg, type = "success") => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg, type, exiting: false }]);
    setTimeout(() => {
      setToasts(t => t.map(x => x.id === id ? { ...x, exiting: true } : x));
      setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 280);
    }, 3000);
  }, []);
  return { toasts, push };
}

function ToastStack({ toasts }) {
  if (!toasts.length) return null;
  return (
    <div style={{
      position: "fixed", bottom: "24px", right: "24px",
      display: "flex", flexDirection: "column", gap: "8px", zIndex: 100,
    }}>
      {toasts.map(t => (
        <div
          key={t.id}
          className={t.exiting ? "toast-exit" : "toast-enter"}
          style={{
            display: "flex", alignItems: "center", gap: "10px",
            padding: "11px 16px",
            borderRadius: "10px",
            background: t.type === "error" ? "#fff1f0" : "#edfaf4",
            border: `1px solid ${t.type === "error" ? "#ffc9c9" : "#9FE1CB"}`,
            fontSize: "13px", fontWeight: 500,
            color: t.type === "error" ? "#c0392b" : "#0F6E56",
            boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
            whiteSpace: "nowrap",
          }}
        >
          <span style={{
            width: "7px", height: "7px", borderRadius: "50%", flexShrink: 0,
            background: t.type === "error" ? "#e74c3c" : "#1D9E75",
          }} />
          {t.msg}
        </div>
      ))}
    </div>
  );
}

/* ── Note Card ── */
function NoteCard({ note, onDelete, index }) {
  const [hovered, setHovered] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    await onDelete(note.id);
  };

  return (
    <div
      className="note-enter"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        animationDelay: `${index * 0.05}s`,
        background: note.isImportant ? "#edfaf4" : "#fff",
        border: `1px solid ${note.isImportant ? "#9FE1CB" : hovered ? "#c8c6bf" : "#e8e6e0"}`,
        borderRadius: "14px",
        padding: "18px 20px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        transition: "border-color 0.18s, transform 0.18s, opacity 0.2s",
        transform: deleting ? "scale(0.96)" : hovered ? "translateY(-2px)" : "none",
        opacity: deleting ? 0.4 : 1,
        position: "relative",
      }}
    >
      {/* title row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
        <span style={{
          fontSize: "13.5px", fontWeight: 600,
          color: note.isImportant ? "#0F6E56" : "#1a1916",
          lineHeight: 1.35, flex: 1,
        }}>
          {note.title}
        </span>
        {note.isImportant && (
          <span style={{
            fontSize: "10px", fontWeight: 600,
            background: "#9FE1CB", color: "#085041",
            padding: "3px 9px", borderRadius: "20px",
            letterSpacing: "0.04em", flexShrink: 0,
            fontFamily: "'JetBrains Mono', monospace",
          }}>
            important
          </span>
        )}
      </div>

      {/* description */}
      <p style={{
        fontSize: "12.5px",
        color: note.isImportant ? "#1D9E75" : "#706e68",
        lineHeight: 1.65, flex: 1,
      }}>
        {note.description}
      </p>

      {/* footer */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        borderTop: `1px solid ${note.isImportant ? "#9FE1CB55" : "#f0ede8"}`,
        paddingTop: "10px",
      }}>
        <span style={{
          fontSize: "11px",
          color: note.isImportant ? "#5DCAA5" : "#c8c6be",
          fontFamily: "'JetBrains Mono', monospace",
        }}>
          #{String(note.id).padStart(4, "0")}
        </span>
        <button
          onClick={handleDelete}
          disabled={deleting}
          onMouseEnter={e => {
            e.currentTarget.style.background = "#fff1f0";
            e.currentTarget.style.borderColor = "#ffc9c9";
            e.currentTarget.style.color = "#c0392b";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.borderColor = "#e8e6e0";
            e.currentTarget.style.color = "#a8a6a0";
          }}
          style={{
            display: "flex", alignItems: "center", gap: "5px",
            background: "transparent",
            border: "1px solid #e8e6e0",
            borderRadius: "7px",
            padding: "4px 10px",
            fontSize: "11.5px", fontWeight: 500,
            color: "#a8a6a0",
            transition: "all 0.15s",
          }}
        >
          <TrashIcon /> {deleting ? "…" : "delete"}
        </button>
      </div>
    </div>
  );
}

/* ── Add Note Form ── */
function AddNoteForm({ onAdd }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isImportant, setIsImportant] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!title.trim()) e.title = "Title is required";
    if (!description.trim()) e.description = "Description is required";
    return e;
  };

  const handleSubmit = async () => {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    const ok = await onAdd({ title: title.trim(), description: description.trim(), isImportant });
    setLoading(false);
    if (ok) { setTitle(""); setDescription(""); setIsImportant(false); }
  };

  const inputStyle = (hasErr) => ({
    width: "100%",
    background: "#faf9f6",
    border: `1px solid ${hasErr ? "#ffc9c9" : "#e8e6e0"}`,
    borderRadius: "9px",
    padding: "9px 13px",
    fontSize: "13px",
    color: "#1a1916",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    transition: "border-color 0.18s, box-shadow 0.18s",
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      <p style={{
        fontSize: "11px", fontWeight: 600,
        color: "#9e9c96", letterSpacing: "0.07em",
        textTransform: "uppercase", marginBottom: "2px",
      }}>
        New note
      </p>

      {/* Title */}
      <div>
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={e => { setTitle(e.target.value); if (errors.title) setErrors(v => ({ ...v, title: "" })); }}
          style={inputStyle(errors.title)}
        />
        {errors.title && (
          <p style={{ fontSize: "11px", color: "#e74c3c", marginTop: "4px" }}>{errors.title}</p>
        )}
      </div>

      {/* Description */}
      <div>
        <textarea
          placeholder="Description"
          value={description}
          onChange={e => { setDescription(e.target.value); if (errors.description) setErrors(v => ({ ...v, description: "" })); }}
          rows={4}
          style={{ ...inputStyle(errors.description), resize: "vertical", lineHeight: 1.6 }}
        />
        {errors.description && (
          <p style={{ fontSize: "11px", color: "#e74c3c", marginTop: "4px" }}>{errors.description}</p>
        )}
      </div>

      {/* Importance toggle */}
      <button
        onClick={() => setIsImportant(v => !v)}
        style={{
          display: "flex", alignItems: "center", gap: "9px",
          background: isImportant ? "#edfaf4" : "transparent",
          border: `1px solid ${isImportant ? "#9FE1CB" : "#e8e6e0"}`,
          borderRadius: "9px",
          padding: "8px 12px",
          fontSize: "12.5px", fontWeight: 500,
          color: isImportant ? "#0F6E56" : "#706e68",
          transition: "all 0.18s",
          textAlign: "left",
        }}
      >
        <div style={{
          width: "16px", height: "16px", borderRadius: "5px", flexShrink: 0,
          background: isImportant ? "#1D9E75" : "transparent",
          border: `1.5px solid ${isImportant ? "#1D9E75" : "#c8c6bf"}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "all 0.18s",
        }}>
          {isImportant && <CheckIcon />}
        </div>
        Mark as important
        <StarIcon filled={isImportant} />
      </button>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={loading}
        onMouseEnter={e => { if (!loading) e.currentTarget.style.background = "#17866a"; }}
        onMouseLeave={e => { if (!loading) e.currentTarget.style.background = "#1D9E75"; }}
        style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: "7px",
          background: loading ? "#9FE1CB" : "#1D9E75",
          border: "none", borderRadius: "10px",
          padding: "11px",
          color: loading ? "#085041" : "#fff",
          fontSize: "13px", fontWeight: 600,
          letterSpacing: "0.01em",
          transition: "background 0.18s, transform 0.1s",
          transform: loading ? "scale(0.98)" : "scale(1)",
        }}
      >
        {!loading && <PlusIcon />}
        {loading ? "Adding…" : "Add note"}
      </button>
    </div>
  );
}

/* ── Skeleton loader ── */
function SkeletonCard() {
  return (
    <div style={{
      background: "#fff", border: "1px solid #e8e6e0",
      borderRadius: "14px", padding: "18px 20px", height: "140px",
      display: "flex", flexDirection: "column", gap: "10px",
    }}>
      {[["70%", "14px"], ["100%", "12px"], ["85%", "12px"]].map(([w, h], i) => (
        <div key={i} style={{
          width: w, height: h, borderRadius: "6px",
          background: "#f0ede8", opacity: 0.7,
        }} />
      ))}
    </div>
  );
}

/* ── App ── */
export default function App() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const { toasts, push } = useToast();

  // Handle UUID retrieval or generation
  const getUserId = () => {
    let userId = localStorage.getItem("userId");
    if (!userId) {
      userId = crypto.randomUUID();
      localStorage.setItem("userId", userId);
    }
    return userId;
  };

  useEffect(() => { fetchNotes(); }, []);

  const fetchNotes = async () => {
    setLoading(true);
    const userId = getUserId();
    try {
      const res = await axios.get(`${API_BASE}?userId=${encodeURIComponent(userId)}`);
      setNotes(res.data);
    } catch {
      push("Failed to load notes", "error");
    } finally {
      setLoading(false);
    }
  };

  const addNote = async (note) => {
    const userId = getUserId();
    try {
      const res = await axios.post(API_BASE, { ...note, userId });
      setNotes(prev => [res.data, ...prev]);
      push("Note added successfully");
      return true;
    } catch {
      push("Failed to add note", "error");
      return false;
    }
  };

  const deleteNote = async (id) => {
    const userId = getUserId();
    try {
      await axios.delete(`${API_BASE}/${id}?userId=${encodeURIComponent(userId)}`);
      setNotes(prev => prev.filter(n => n.id !== id));
      push("Note deleted");
    } catch {
      push("Failed to delete note", "error");
    }
  };

  const filtered = notes
    .filter(n => filter === "important" ? n.isImportant : true)
    .filter(n =>
      search
        ? n.title.toLowerCase().includes(search.toLowerCase()) ||
          n.description.toLowerCase().includes(search.toLowerCase())
        : true
    );

  const importantCount = notes.filter(n => n.isImportant).length;

  return (
    <>
      <style>{globalCSS}</style>

      <div style={{ minHeight: "100vh", background: "#f5f4f0" }}>

        {/* ── Header ── */}
        <header style={{
          background: "#fff",
          borderBottom: "1px solid #e8e6e0",
          padding: "0 28px",
          height: "56px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          position: "sticky", top: 0, zIndex: 50,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{
              width: "30px", height: "30px", borderRadius: "9px",
              background: "#1D9E75",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                <rect x="1.5" y="1.5" width="5" height="5" rx="1.5" fill="white"/>
                <rect x="8.5" y="1.5" width="5" height="5" rx="1.5" fill="white" opacity="0.55"/>
                <rect x="1.5" y="8.5" width="5" height="5" rx="1.5" fill="white" opacity="0.55"/>
                <rect x="8.5" y="8.5" width="5" height="5" rx="1.5" fill="white" opacity="0.25"/>
              </svg>
            </div>
            <span style={{ fontSize: "15px", fontWeight: 600, color: "#1a1916", letterSpacing: "-0.015em" }}>
              Notes
            </span>
          </div>

          <div style={{ display: "flex", gap: "6px" }}>
            {[
              { key: "all",       label: "All",       count: notes.length },
              { key: "important", label: "Important", count: importantCount },
            ].map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                style={{
                  display: "flex", alignItems: "center", gap: "6px",
                  background: filter === key ? "#edfaf4" : "transparent",
                  border: `1px solid ${filter === key ? "#9FE1CB" : "#e8e6e0"}`,
                  borderRadius: "8px",
                  padding: "5px 13px",
                  fontSize: "12.5px", fontWeight: 500,
                  color: filter === key ? "#0F6E56" : "#706e68",
                  transition: "all 0.15s",
                }}
              >
                {label}
                <span style={{
                  background: filter === key ? "#9FE1CB" : "#f0ede8",
                  color: filter === key ? "#085041" : "#9e9c96",
                  borderRadius: "20px", fontSize: "10px", fontWeight: 600,
                  padding: "1px 7px",
                  fontFamily: "'JetBrains Mono', monospace",
                }}>
                  {count}
                </span>
              </button>
            ))}
          </div>
        </header>

        {/* ── Body ── */}
        <div style={{
          maxWidth: "1160px", margin: "0 auto",
          padding: "28px",
          display: "grid",
          gridTemplateColumns: "290px 1fr",
          gap: "24px",
          alignItems: "start",
        }}>

          {/* ── Sidebar ── */}
          <aside style={{
            display: "flex", flexDirection: "column", gap: "20px",
            position: "sticky", top: "76px",
          }}>
            {/* Stats */}
            <div style={{
              background: "#fff", border: "1px solid #e8e6e0",
              borderRadius: "16px", padding: "20px",
            }}>
              <p style={{
                fontSize: "11px", fontWeight: 600, color: "#9e9c96",
                letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: "14px",
              }}>
                Overview
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                {[
                  { label: "Total notes", value: notes.length, accent: false },
                  { label: "Important",   value: importantCount, accent: true },
                ].map(s => (
                  <div key={s.label} style={{
                    background: s.accent ? "#edfaf4" : "#faf9f6",
                    border: `1px solid ${s.accent ? "#9FE1CB" : "#f0ede8"}`,
                    borderRadius: "11px", padding: "14px",
                  }}>
                    <div style={{
                      fontSize: "26px", fontWeight: 600, lineHeight: 1,
                      color: s.accent ? "#1D9E75" : "#1a1916",
                      fontFamily: "'JetBrains Mono', monospace",
                    }}>
                      {s.value}
                    </div>
                    <div style={{
                      fontSize: "11px", marginTop: "5px", fontWeight: 500,
                      color: s.accent ? "#5DCAA5" : "#b8b6b0",
                    }}>
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Form */}
            <div style={{
              background: "#fff", border: "1px solid #e8e6e0",
              borderRadius: "16px", padding: "20px",
            }}>
              <AddNoteForm onAdd={addNote} />
            </div>
          </aside>

          {/* ── Main ── */}
          <main style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

            {/* Search */}
            <div style={{
              display: "flex", alignItems: "center", gap: "10px",
              background: "#fff", border: "1px solid #e8e6e0",
              borderRadius: "11px", padding: "0 14px", height: "42px",
            }}>
              <SearchIcon />
              <input
                type="text"
                placeholder="Search notes…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  flex: 1, border: "none", outline: "none",
                  background: "transparent",
                  fontSize: "13.5px", color: "#1a1916",
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  style={{
                    background: "#f0ede8", border: "none", borderRadius: "50%",
                    width: "18px", height: "18px", fontSize: "11px",
                    color: "#706e68",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  ✕
                </button>
              )}
            </div>

            {/* Grid */}
            {loading ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: "14px" }}>
                {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : filtered.length === 0 ? (
              <div style={{
                border: "1.5px dashed #e8e6e0", borderRadius: "16px",
                padding: "56px 32px", textAlign: "center",
              }}>
                <div style={{
                  width: "44px", height: "44px", borderRadius: "12px",
                  background: "#f0ede8", margin: "0 auto 14px",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <NotesEmptyIcon />
                </div>
                <p style={{ fontSize: "14px", fontWeight: 500, color: "#706e68", marginBottom: "4px" }}>
                  {search
                    ? "No notes match your search"
                    : filter === "important"
                      ? "No important notes yet"
                      : "No notes yet"}
                </p>
                <p style={{ fontSize: "12.5px", color: "#b8b6b0" }}>
                  {search ? "Try a different keyword" : "Add your first note using the form"}
                </p>
              </div>
            ) : (
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0,1fr))",
                gap: "14px",
              }}>
                {filtered.map((note, i) => (
                  <NoteCard key={note.id} note={note} onDelete={deleteNote} index={i} />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      <ToastStack toasts={toasts} />
    </>
  );
}