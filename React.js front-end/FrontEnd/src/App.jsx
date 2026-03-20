import { useState, useEffect, useCallback } from "react";
import axios from "axios";

const API_BASE = "http://localhost:5000/api/notes";

const TOAST_DURATION = 3000;

function useToast() {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((msg, type = "success") => {
    const id = Date.now();
    setToasts((t) => [...t, { id, msg, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), TOAST_DURATION);
  }, []);
  return { toasts, push };
}

function Toast({ toasts }) {
  return (
    <div style={{
      position: "fixed", bottom: "2rem", right: "2rem",
      display: "flex", flexDirection: "column", gap: "10px", zIndex: 999
    }}>
      {toasts.map((t) => (
        <div key={t.id} style={{
          background: t.type === "error" ? "#ff4444" : "#00e5a0",
          color: t.type === "error" ? "#fff" : "#001a12",
          padding: "10px 18px",
          borderRadius: "8px",
          fontSize: "13px",
          fontWeight: 500,
          letterSpacing: "0.02em",
          fontFamily: "'DM Mono', monospace",
          boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
          animation: "slideIn 0.25s ease",
        }}>
          {t.msg}
        </div>
      ))}
    </div>
  );
}

function NoteCard({ note, onDelete }) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    await onDelete(note.id);
  };

  return (
    <div style={{
      background: note.isImportant ? "rgba(0, 229, 160, 0.05)" : "rgba(255,255,255,0.03)",
      border: note.isImportant
        ? "1px solid rgba(0, 229, 160, 0.35)"
        : "1px solid rgba(255,255,255,0.08)",
      borderRadius: "12px",
      padding: "1.25rem 1.5rem",
      display: "flex",
      flexDirection: "column",
      gap: "8px",
      transition: "border-color 0.2s, transform 0.15s",
      opacity: deleting ? 0.4 : 1,
      transform: deleting ? "scale(0.97)" : "scale(1)",
      position: "relative",
      overflow: "hidden",
    }}>
      {note.isImportant && (
        <div style={{
          position: "absolute", top: 0, right: 0,
          background: "#00e5a0",
          color: "#001a12",
          fontSize: "10px",
          fontWeight: 600,
          letterSpacing: "0.1em",
          padding: "3px 10px",
          borderBottomLeftRadius: "8px",
          fontFamily: "'DM Mono', monospace",
        }}>IMPORTANT</div>
      )}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: "1rem",
      }}>
        <h3 style={{
          margin: 0,
          fontSize: "1rem",
          fontWeight: 600,
          color: note.isImportant ? "#00e5a0" : "#f0ede8",
          fontFamily: "'DM Sans', sans-serif",
          lineHeight: 1.3,
        }}>{note.title}</h3>
        <button
          onClick={handleDelete}
          disabled={deleting}
          style={{
            background: "transparent",
            border: "1px solid rgba(255,255,255,0.12)",
            color: "#888",
            cursor: "pointer",
            padding: "4px 10px",
            borderRadius: "6px",
            fontSize: "12px",
            fontFamily: "'DM Mono', monospace",
            letterSpacing: "0.05em",
            transition: "all 0.15s",
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            e.target.style.borderColor = "#ff4444";
            e.target.style.color = "#ff4444";
            e.target.style.background = "rgba(255,68,68,0.08)";
          }}
          onMouseLeave={(e) => {
            e.target.style.borderColor = "rgba(255,255,255,0.12)";
            e.target.style.color = "#888";
            e.target.style.background = "transparent";
          }}
        >
          {deleting ? "..." : "delete"}
        </button>
      </div>
      <p style={{
        margin: 0,
        fontSize: "0.875rem",
        color: "#7a7975",
        fontFamily: "'DM Sans', sans-serif",
        lineHeight: 1.6,
      }}>{note.description}</p>
      <span style={{
        fontSize: "11px",
        color: "#4a4845",
        fontFamily: "'DM Mono', monospace",
        marginTop: "4px",
      }}>#{String(note.id).padStart(4, "0")}</span>
    </div>
  );
}

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    const success = await onAdd({ title: title.trim(), description: description.trim(), isImportant });
    setLoading(false);
    if (success) { setTitle(""); setDescription(""); setIsImportant(false); }
  };

  const inputStyle = (hasError) => ({
    width: "100%",
    background: "rgba(255,255,255,0.04)",
    border: `1px solid ${hasError ? "#ff4444" : "rgba(255,255,255,0.1)"}`,
    borderRadius: "8px",
    padding: "10px 14px",
    color: "#f0ede8",
    fontSize: "14px",
    fontFamily: "'DM Sans', sans-serif",
    outline: "none",
    transition: "border-color 0.2s",
    boxSizing: "border-box",
  });

  return (
    <form onSubmit={handleSubmit} noValidate style={{
      background: "rgba(255,255,255,0.025)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: "16px",
      padding: "1.75rem",
      display: "flex",
      flexDirection: "column",
      gap: "1rem",
    }}>
      <p style={{
        margin: 0,
        fontSize: "11px",
        letterSpacing: "0.12em",
        color: "#4a4845",
        fontFamily: "'DM Mono', monospace",
        textTransform: "uppercase",
      }}>New Note</p>

      <div>
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={inputStyle(errors.title)}
          onFocus={(e) => e.target.style.borderColor = errors.title ? "#ff4444" : "#00e5a0"}
          onBlur={(e) => e.target.style.borderColor = errors.title ? "#ff4444" : "rgba(255,255,255,0.1)"}
        />
        {errors.title && <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#ff4444", fontFamily: "'DM Mono', monospace" }}>{errors.title}</p>}
      </div>

      <div>
        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          style={{ ...inputStyle(errors.description), resize: "vertical", lineHeight: 1.6 }}
          onFocus={(e) => e.target.style.borderColor = errors.description ? "#ff4444" : "#00e5a0"}
          onBlur={(e) => e.target.style.borderColor = errors.description ? "#ff4444" : "rgba(255,255,255,0.1)"}
        />
        {errors.description && <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#ff4444", fontFamily: "'DM Mono', monospace" }}>{errors.description}</p>}
      </div>

      <label style={{
        display: "flex", alignItems: "center", gap: "10px",
        cursor: "pointer", fontSize: "13px", color: "#7a7975",
        fontFamily: "'DM Sans', sans-serif", userSelect: "none",
      }}>
        <div
          onClick={() => setIsImportant((v) => !v)}
          style={{
            width: "18px", height: "18px",
            borderRadius: "5px",
            border: `1px solid ${isImportant ? "#00e5a0" : "rgba(255,255,255,0.2)"}`,
            background: isImportant ? "rgba(0,229,160,0.15)" : "transparent",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.15s", flexShrink: 0,
          }}
        >
          {isImportant && <span style={{ color: "#00e5a0", fontSize: "12px", lineHeight: 1 }}>✓</span>}
        </div>
        Mark as important
      </label>

      <button
        type="submit"
        disabled={loading}
        style={{
          background: loading ? "rgba(0,229,160,0.15)" : "#00e5a0",
          border: "none",
          borderRadius: "8px",
          padding: "11px",
          color: loading ? "#00e5a0" : "#001a12",
          fontSize: "13px",
          fontWeight: 600,
          fontFamily: "'DM Mono', monospace",
          letterSpacing: "0.05em",
          cursor: loading ? "not-allowed" : "pointer",
          transition: "all 0.2s",
        }}
      >
        {loading ? "adding..." : "add_note()"}
      </button>
    </form>
  );
}

export default function NotesApp() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const { toasts, push } = useToast();

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const res = await axios.get(API_BASE);
      setNotes(res.data);
    } catch {
      push("Failed to load notes", "error");
    } finally {
      setLoading(false);
    }
  };

  const addNote = async (note) => {
    try {
      const res = await axios.post(API_BASE, note);
      setNotes((prev) => [res.data, ...prev]);
      push("Note added successfully");
      return true;
    } catch {
      push("Failed to add note", "error");
      return false;
    }
  };

  const deleteNote = async (id) => {
    try {
      await axios.delete(`${API_BASE}/${id}`);
      setNotes((prev) => prev.filter((n) => n.id !== id));
      push("Note deleted");
    } catch {
      push("Failed to delete note", "error");
    }
  };

  const filtered = filter === "important" ? notes.filter((n) => n.isImportant) : notes;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=DM+Sans:wght@400;600&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .note-appear { animation: fadeUp 0.3s ease both; }
      `}</style>

      <div style={{
        minHeight: "100vh",
        background: "#0d0d0b",
        fontFamily: "'DM Sans', sans-serif",
        padding: "0",
      }}>
        {/* Header */}
        <div style={{
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          padding: "1.5rem 2.5rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: "12px" }}>
            <h1 style={{
              margin: 0,
              fontSize: "1.15rem",
              fontWeight: 600,
              color: "#f0ede8",
              fontFamily: "'DM Mono', monospace",
              letterSpacing: "0.02em",
            }}>notes_app<span style={{ color: "#00e5a0" }}>_</span></h1>
            <span style={{
              fontSize: "11px",
              color: "#3a3835",
              fontFamily: "'DM Mono', monospace",
              letterSpacing: "0.08em",
            }}>v1.0.0</span>
          </div>
          <div style={{
            display: "flex",
            gap: "6px",
          }}>
            {["all", "important"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  background: filter === f ? "rgba(0,229,160,0.1)" : "transparent",
                  border: `1px solid ${filter === f ? "rgba(0,229,160,0.35)" : "rgba(255,255,255,0.08)"}`,
                  color: filter === f ? "#00e5a0" : "#555",
                  borderRadius: "6px",
                  padding: "5px 14px",
                  fontSize: "12px",
                  fontFamily: "'DM Mono', monospace",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >{f}</button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div style={{
          maxWidth: "1100px",
          margin: "0 auto",
          padding: "2.5rem",
          display: "grid",
          gridTemplateColumns: "320px 1fr",
          gap: "2rem",
          alignItems: "start",
        }}>
          {/* Sidebar */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <AddNoteForm onAdd={addNote} />
            {/* Stats */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "10px",
            }}>
              {[
                { label: "total", value: notes.length },
                { label: "important", value: notes.filter((n) => n.isImportant).length },
              ].map((s) => (
                <div key={s.label} style={{
                  background: "rgba(255,255,255,0.025)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: "10px",
                  padding: "1rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                }}>
                  <span style={{ fontSize: "11px", color: "#3a3835", fontFamily: "'DM Mono', monospace", letterSpacing: "0.08em" }}>{s.label}</span>
                  <span style={{ fontSize: "1.75rem", fontWeight: 600, color: s.label === "important" ? "#00e5a0" : "#f0ede8", fontFamily: "'DM Mono', monospace", lineHeight: 1 }}>{s.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Notes grid */}
          <div>
            {loading ? (
              <div style={{ color: "#3a3835", fontFamily: "'DM Mono', monospace", fontSize: "13px", padding: "2rem 0" }}>
                fetching notes...
              </div>
            ) : filtered.length === 0 ? (
              <div style={{
                border: "1px dashed rgba(255,255,255,0.07)",
                borderRadius: "12px",
                padding: "3rem",
                textAlign: "center",
                color: "#3a3835",
                fontFamily: "'DM Mono', monospace",
                fontSize: "13px",
              }}>
                {filter === "important" ? "no important notes yet" : "no notes yet — add one"}
              </div>
            ) : (
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                gap: "14px",
              }}>
                {filtered.map((note, i) => (
                  <div key={note.id} className="note-appear" style={{ animationDelay: `${i * 0.04}s` }}>
                    <NoteCard note={note} onDelete={deleteNote} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <Toast toasts={toasts} />
    </>
  );
}
