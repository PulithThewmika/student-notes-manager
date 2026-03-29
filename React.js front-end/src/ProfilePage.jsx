import { useState, useEffect } from "react";
import { useTheme } from "./ThemeContext";

/* ── Global CSS ── */
const CSS = `
  /* Local animations specific to profile page */
  @keyframes avatarPop {
    0%   { transform: scale(0.8); opacity: 0; }
    65%  { transform: scale(1.06); }
    100% { transform: scale(1); opacity: 1; }
  }
  @keyframes checkPop {
    0%   { transform: scale(0); opacity: 0; }
    60%  { transform: scale(1.2); }
    100% { transform: scale(1); opacity: 1; }
  }
  @keyframes shake {
    0%,100% { transform: translateX(0); }
    20% { transform: translateX(-6px); }
    40% { transform: translateX(6px); }
    60% { transform: translateX(-4px); }
    80% { transform: translateX(4px); }
  }
  @keyframes slideSection {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .shake-it { animation: shake 0.35s ease; }
  .section-enter { animation: slideSection 0.25s cubic-bezier(0.22,1,0.36,1) both; }

  /* ─ inputs ─ */
  .field-input {
    width: 100%;
    padding: 10px 14px;
    border-radius: 10px;
    font-size: 13.5px;
    font-family: 'Plus Jakarta Sans', sans-serif;
    outline: none;
    transition: border-color 0.18s, box-shadow 0.18s;
    background: var(--bg);
    border: 1px solid var(--border);
    color: var(--text);
  }
  .field-input:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px rgba(29,158,117,0.12);
  }
  .field-input.err {
    border-color: #e74c3c;
    box-shadow: 0 0 0 3px rgba(231,76,60,0.1);
  }

  /* ─ nav items ─ */
  .profile-nav-item {
    display: flex; align-items: center; gap: 10px;
    padding: 10px 14px; border-radius: 10px;
    font-size: 13.5px; font-weight: 500;
    cursor: pointer; border: none; width: 100%;
    text-align: left; transition: all 0.15s;
    font-family: 'Plus Jakarta Sans', sans-serif;
    background: transparent; color: var(--text3);
  }
  .profile-nav-item:hover { background: var(--bg3); color: var(--text2); }
  .profile-nav-item.active { background: var(--accent-dim); color: var(--accent); }

  /* ─ section cards ─ */
  .settings-card {
    background: var(--bg2);
    border: 1px solid var(--border);
    border-radius: 16px;
    overflow: hidden;
  }
  .card-header {
    padding: 18px 24px 14px;
    border-bottom: 1px solid var(--border);
  }
  .card-row {
    padding: 16px 24px;
    border-top: 1px solid var(--border);
    display: flex; align-items: center; justify-content: space-between; gap: 16px;
  }
  .card-row:first-of-type { border-top: none; }
  .card-row.col { flex-direction: column; align-items: flex-start; }

  /* ─ toggle ─ */
  .toggle-track {
    width: 44px; height: 24px; border-radius: 12px;
    background: var(--border); border: none;
    position: relative; cursor: pointer; transition: background 0.2s; flex-shrink: 0;
  }
  .toggle-track.on { background: var(--accent); }
  .toggle-track::after {
    content: '';
    position: absolute; top: 4px; left: 4px;
    width: 16px; height: 16px; border-radius: 50%;
    background: #fff; transition: transform 0.2s;
    box-shadow: 0 1px 3px rgba(0,0,0,0.2);
  }
  .toggle-track.on::after { transform: translateX(20px); }

  /* ─ theme option ─ */
  .theme-tile {
    flex: 1; padding: 0; border-radius: 12px;
    border: 1.5px solid var(--border);
    cursor: pointer; transition: all 0.18s;
    background: transparent;
    font-family: 'Plus Jakarta Sans', sans-serif;
    overflow: hidden;
  }
  .theme-tile:hover { border-color: var(--border2); }
  .theme-tile.sel { border-color: var(--accent); }

  /* ─ success pill ─ */
  .success-pill {
    display: inline-flex; align-items: center; gap: 6px;
    background: var(--accent-dim); border: 1px solid var(--accent-border);
    border-radius: 20px; padding: 6px 14px;
    font-size: 12.5px; font-weight: 500; color: var(--accent);
    animation: checkPop 0.3s cubic-bezier(0.22,1,0.36,1);
    white-space: nowrap;
  }

  /* ─ strength bar ─ */
  .str-seg {
    height: 3px; flex: 1; border-radius: 2px;
    background: var(--border); transition: background 0.3s;
  }

  .section-label {
    font-size: 10.5px; font-weight: 600;
    color: var(--text3); letter-spacing: 0.08em;
    text-transform: uppercase;
    font-family: 'JetBrains Mono', monospace;
  }

  .row-label { font-size: 14px; font-weight: 500; color: var(--text); }
  .row-sub { font-size: 12px; color: var(--text3); margin-top: 2px; }

  .err-msg { font-size: 11.5px; color: #e74c3c; margin-top: 5px; font-family: 'JetBrains Mono', monospace; }
`;

if (!document.querySelector("#profile-page-css")) {
  const s = document.createElement("style");
  s.id = "profile-page-css";
  s.textContent = CSS;
  document.head.appendChild(s);
}

/* ── Icons ── */
const Icon = ({ d, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <path d={d} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const BackIcon    = () => <Icon d="M10 3L5 8l5 5" />;
const UserIcon    = () => <Icon d="M8 7a3 3 0 100-6 3 3 0 000 6zM2 14s.5-4 6-4 6 4 6 4" />;
const PaletteIcon = () => <Icon d="M2 8a6 6 0 1112 0c0 1.5-1 2-2 2s-2 .5-2 2a2 2 0 01-4 0c0-1.5-1-2-2-2S2 9.5 2 8z" />;
const ShieldIcon  = () => <Icon d="M8 2l5 2v5c0 3-2.5 5-5 5S3 12 3 9V4l5-2z" />;
const BellIcon    = () => <Icon d="M6 13a2 2 0 004 0M8 2a4 4 0 00-4 4v3l-1 2h10l-1-2V6a4 4 0 00-4-4z" />;
const CheckIcon   = () => (
  <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
    <path d="M1.5 5.5l3 3 5-5.5" stroke="#1D9E75" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const EyeIcon = ({ open }) => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
    {open ? (
      <>
        <path d="M1 7.5C1 7.5 3.5 3 7.5 3S14 7.5 14 7.5 11.5 12 7.5 12 1 7.5 1 7.5z" stroke="#9e9c96" strokeWidth="1.3"/>
        <circle cx="7.5" cy="7.5" r="2" stroke="#9e9c96" strokeWidth="1.3"/>
      </>
    ) : (
      <>
        <path d="M1 1l13 13M6.3 6.4A2 2 0 0110 8.6M4.2 4.3C2.5 5.3 1 7.5 1 7.5S3.5 12 7.5 12c1.2 0 2.3-.3 3.3-.9" stroke="#9e9c96" strokeWidth="1.3" strokeLinecap="round"/>
        <path d="M9 3.8C8.5 3.3 8 3 7.5 3 3.5 3 1 7.5 1 7.5" stroke="#9e9c96" strokeWidth="1.3" strokeLinecap="round"/>
      </>
    )}
  </svg>
);
const LogoMark = () => (
  <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
    <rect width="26" height="26" rx="7" fill="#1D9E75"/>
    <rect x="5" y="5" width="6" height="6" rx="1.5" fill="white"/>
    <rect x="14" y="5" width="6" height="6" rx="1.5" fill="white" opacity="0.55"/>
    <rect x="5" y="14" width="6" height="6" rx="1.5" fill="white" opacity="0.55"/>
    <rect x="14" y="14" width="6" height="6" rx="1.5" fill="white" opacity="0.25"/>
  </svg>
);

/* ── Password strength ── */
function pwStrength(pw) {
  if (!pw) return { level: 0, label: "", color: "" };
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  const m = [
    { label: "Weak",   color: "#e74c3c" },
    { label: "Fair",   color: "#EF9F27" },
    { label: "Good",   color: "#3498db" },
    { label: "Strong", color: "#1D9E75" },
  ];
  return { level: s, ...(m[s - 1] || { label: "", color: "" }) };
}

/* ──────────────────────────────────────
   SECTION: Profile
────────────────────────────────────── */
function ProfileSection({ totalNotes }) {
  const [name, setName] = useState("Pulith Thewmika");
  const [bio,  setBio]  = useState("Full-stack developer · IEEE CS SLIIT");
  const [saved, setSaved] = useState(false);
  const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2800); };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }} className="section-enter">

      {/* Avatar + name hero */}
      <div className="settings-card">
        <div className="card-header">
          <div className="section-label">Public profile</div>
        </div>

        {/* Avatar row */}
        <div className="card-row" style={{ gap: "24px", flexWrap: "wrap" }}>
          <div style={{ position: "relative" }}>
            <div style={{
              width: "80px", height: "80px", borderRadius: "50%",
              background: "var(--accent-dim)",
              border: `2.5px solid var(--accent-border)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "26px", fontWeight: 600, color: "var(--accent)",
              fontFamily: "'JetBrains Mono', monospace",
              animation: "avatarPop 0.4s cubic-bezier(0.22,1,0.36,1)",
              cursor: "pointer", overflow: "hidden", position: "relative",
            }}>
              {initials}
              <div style={{
                position: "absolute", inset: 0, borderRadius: "50%",
                background: "rgba(29,158,117,0.78)",
                display: "flex", alignItems: "center", justifyContent: "center",
                opacity: 0, transition: "opacity 0.18s",
              }}
                onMouseEnter={e => e.currentTarget.style.opacity = 1}
                onMouseLeave={e => e.currentTarget.style.opacity = 0}
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M12 3l3 3-8 8H4v-3l8-8z" stroke="#fff" strokeWidth="1.5" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
          </div>

          <div style={{ flex: 1, minWidth: "180px" }}>
            <div style={{ fontSize: "18px", fontWeight: 600, color: "var(--text)", letterSpacing: "-0.02em" }}>
              {name || "Your Name"}
            </div>
            <div style={{ fontSize: "13px", color: "var(--text3)", marginTop: "4px" }}>
              {bio || "Bio"}
            </div>
            <div style={{ display: "flex", gap: "8px", marginTop: "14px", flexWrap: "wrap" }}>
              <button className="btn-ghost" style={{ fontSize: "12.5px", padding: "7px 14px" }}>Change photo</button>
              <button className="btn-ghost" style={{ fontSize: "12.5px", padding: "7px 14px", color: "#c0392b", borderColor: "#ffc9c9" }}>Remove</button>
            </div>
          </div>
        </div>

        {/* Fields */}
        <div className="card-row col" style={{ gap: "6px" }}>
          <label className="row-label">Display name</label>
          <div className="row-sub">This is how you appear across the app</div>
          <input className="field-input" value={name} onChange={e => setName(e.target.value)} style={{ marginTop: "8px", maxWidth: "420px" }} />
        </div>

        <div className="card-row col" style={{ gap: "6px" }}>
          <label className="row-label">Bio</label>
          <input className="field-input" value={bio} onChange={e => setBio(e.target.value)} placeholder="Short bio…" style={{ marginTop: "8px", maxWidth: "420px" }} />
        </div>

        <div className="card-row" style={{ justifyContent: "flex-end" }}>
          {saved
            ? <div className="success-pill"><CheckIcon /> Profile saved</div>
            : <button className="btn-primary" onClick={save}>Save profile</button>
          }
        </div>
      </div>

      {/* Account meta */}
      <div className="settings-card">
        <div className="card-header"><div className="section-label">Account</div></div>
        {[
          { label: "Member since", value: "March 2025" },
          { label: "Plan",         value: "Free" },
          { label: "Total notes",  value: totalNotes },
          { label: "User ID",      value: "usr_pt2025" },
        ].map(r => (
          <div key={r.label} className="card-row">
            <span className="row-label">{r.label}</span>
            <span style={{ fontSize: "13px", color: "var(--text3)", fontFamily: "'JetBrains Mono', monospace" }}>
              {r.value}
            </span>
          </div>
        ))}
      </div>

      {/* Danger */}
      <div className="settings-card">
        <div className="card-header"><div className="section-label" style={{ color: "#c0392b" }}>Danger zone</div></div>
        <div className="card-row">
          <div>
            <div className="row-label">Delete account</div>
            <div className="row-sub">Permanently removes your account and all notes. Cannot be undone.</div>
          </div>
          <button className="btn-danger">Delete account</button>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────
   SECTION: Appearance
────────────────────────────────────── */
function AppearanceSection({ theme, setTheme, fontSize, setFontSize, compactMode, setCompactMode, animations, setAnimations }) {
  const themes = [
    {
      key: "light", label: "Light",
      preview: (
        <div style={{ height: "72px", background: "#f5f4f0", borderRadius: "8px 8px 0 0", padding: "10px", display: "flex", flexDirection: "column", gap: "5px" }}>
          <div style={{ height: "8px", width: "55%", background: "#1D9E75", borderRadius: "4px" }} />
          <div style={{ height: "6px", width: "80%", background: "#e8e6e0", borderRadius: "4px" }} />
          <div style={{ height: "6px", width: "65%", background: "#e8e6e0", borderRadius: "4px" }} />
        </div>
      ),
    },
    {
      key: "dark", label: "Dark",
      preview: (
        <div style={{ height: "72px", background: "#0c0c0a", borderRadius: "8px 8px 0 0", padding: "10px", display: "flex", flexDirection: "column", gap: "5px" }}>
          <div style={{ height: "8px", width: "55%", background: "#1D9E75", borderRadius: "4px" }} />
          <div style={{ height: "6px", width: "80%", background: "#222220", borderRadius: "4px" }} />
          <div style={{ height: "6px", width: "65%", background: "#222220", borderRadius: "4px" }} />
        </div>
      ),
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }} className="section-enter">

      {/* Theme picker */}
      <div className="settings-card">
        <div className="card-header"><div className="section-label">Theme</div></div>
        <div className="card-row col" style={{ gap: "14px" }}>
          <div className="row-label">Color scheme</div>
          <div style={{ display: "flex", gap: "12px", width: "100%", maxWidth: "520px" }}>
            {themes.map(t => (
              <button
                key={t.key}
                className={`theme-tile${theme === t.key ? " sel" : ""}`}
                onClick={() => setTheme(t.key)}
              >
                {t.preview}
                <div style={{
                  padding: "10px 12px",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  background: "var(--bg3)",
                }}>
                  <span style={{ fontSize: "12.5px", fontWeight: 500, color: theme === t.key ? "var(--accent)" : "var(--text3)" }}>
                    {t.label}
                  </span>
                  {theme === t.key && (
                    <div style={{ width: "16px", height: "16px", borderRadius: "50%", background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", animation: "checkPop 0.25s ease" }}>
                      <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                        <path d="M1 4l2 2 4-4" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Typography */}
      <div className="settings-card">
        <div className="card-header"><div className="section-label">Typography</div></div>
        <div className="card-row col" style={{ gap: "10px" }}>
          <div className="row-label">Font size</div>
          <div style={{ display: "flex", gap: "8px" }}>
            {["Small", "Medium", "Large"].map(f => (
              <button
                key={f}
                onClick={() => setFontSize(f.toLowerCase())}
                style={{
                  padding: "8px 20px", borderRadius: "9px",
                  border: `1px solid ${fontSize === f.toLowerCase() ? "var(--accent)" : "var(--border)"}`,
                  background: fontSize === f.toLowerCase() ? "var(--accent-dim)" : "transparent",
                  color: fontSize === f.toLowerCase() ? "var(--accent)" : "var(--text3)",
                  fontSize: "13px", fontWeight: 500,
                  cursor: "pointer", transition: "all 0.15s",
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}
              >{f}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Toggles */}
      <div className="settings-card">
        <div className="card-header"><div className="section-label">Preferences</div></div>
        {[
          { key: "compact",    label: "Compact mode",   sub: "Tighter card spacing",                  val: compactMode,    set: setCompactMode },
          { key: "animations", label: "Animations",     sub: "Card entrance and hover micro-interactions", val: animations, set: setAnimations },
        ].map(r => (
          <div key={r.key} className="card-row">
            <div>
              <div className="row-label">{r.label}</div>
              <div className="row-sub">{r.sub}</div>
            </div>
            <button className={`toggle-track${r.val ? " on" : ""}`} onClick={() => r.set(v => !v)} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────
   SECTION: Security
────────────────────────────────────── */
function SecuritySection() {
  /* Password */
  const [pw, setPw]         = useState({ cur: "", next: "", confirm: "" });
  const [show, setShow]     = useState({ cur: false, next: false, confirm: false });
  const [pwErr, setPwErr]   = useState({});
  const [pwOk, setPwOk]     = useState(false);
  const [shake, setShake]   = useState(false);
  const strength = pwStrength(pw.next);

  /* Email */
  const [email, setEmail]         = useState("pulith@example.com");
  const [newEmail, setNewEmail]   = useState("");
  const [emailEdit, setEmailEdit] = useState(false);
  const [emailErr, setEmailErr]   = useState("");
  const [emailOk, setEmailOk]     = useState(false);

  /* 2FA & sessions */
  const [twoFA, setTwoFA]   = useState(false);

  const submitPw = () => {
    const e = {};
    if (!pw.cur) e.cur = "Required";
    if (!pw.next) e.next = "Required";
    else if (pw.next.length < 8) e.next = "Min 8 characters";
    if (pw.next !== pw.confirm) e.confirm = "Passwords don't match";
    if (Object.keys(e).length) {
      setPwErr(e); setShake(true);
      setTimeout(() => setShake(false), 400);
      return;
    }
    setPwErr({}); setPwOk(true);
    setPw({ cur: "", next: "", confirm: "" });
    setTimeout(() => setPwOk(false), 3000);
  };

  const submitEmail = () => {
    if (!newEmail.includes("@")) { setEmailErr("Enter a valid email address"); return; }
    setEmail(newEmail); setNewEmail(""); setEmailEdit(false);
    setEmailOk(true); setEmailErr("");
    setTimeout(() => setEmailOk(false), 3000);
  };

  const PwField = ({ field, label }) => (
    <div className="card-row col" style={{ gap: "6px" }}>
      <label className="row-label">{label}</label>
      <div style={{ position: "relative", maxWidth: "420px", width: "100%" }}>
        <input
          type={show[field] ? "text" : "password"}
          className={`field-input${pwErr[field] ? " err" : ""}`}
          value={pw[field]}
          onChange={e => { setPw(p => ({ ...p, [field]: e.target.value })); if (pwErr[field]) setPwErr(p => ({ ...p, [field]: "" })); }}
          style={{ paddingRight: "40px" }}
        />
        <button
          onClick={() => setShow(p => ({ ...p, [field]: !p[field] }))}
          style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", display: "flex" }}
        >
          <EyeIcon open={show[field]} />
        </button>
      </div>
      {pwErr[field] && <div className="err-msg">{pwErr[field]}</div>}
      {field === "next" && pw.next && (
        <div style={{ marginTop: "4px", maxWidth: "420px" }}>
          <div style={{ display: "flex", gap: "4px" }}>
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="str-seg" style={{ background: i < strength.level ? strength.color : undefined }} />
            ))}
          </div>
          {strength.label && (
            <div style={{ fontSize: "11px", color: strength.color, marginTop: "4px", fontFamily: "'JetBrains Mono', monospace" }}>
              {strength.label}
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }} className="section-enter">

      {/* Password */}
      <div className={`settings-card${shake ? " shake-it" : ""}`}>
        <div className="card-header"><div className="section-label">Change password</div></div>
        <PwField field="cur"    label="Current password" />
        <PwField field="next"   label="New password" />
        <PwField field="confirm" label="Confirm new password" />
        <div className="card-row" style={{ justifyContent: "space-between" }}>
          <button className="btn-ghost" style={{ fontSize: "13px" }}>Forgot password?</button>
          {pwOk
            ? <div className="success-pill"><CheckIcon /> Password updated</div>
            : <button className="btn-primary" onClick={submitPw}>Update password</button>
          }
        </div>
      </div>

      {/* Email */}
      <div className="settings-card">
        <div className="card-header"><div className="section-label">Email address</div></div>
        <div className="card-row">
          <div>
            <div className="row-label">Current email</div>
            <div style={{ fontSize: "13px", color: "var(--text3)", marginTop: "3px", fontFamily: "'JetBrains Mono', monospace" }}>
              {email}
            </div>
          </div>
          {emailOk
            ? <div className="success-pill"><CheckIcon /> Updated</div>
            : <button className="btn-ghost" onClick={() => setEmailEdit(v => !v)}>
                {emailEdit ? "Cancel" : "Change email"}
              </button>
          }
        </div>
        {emailEdit && (
          <div className="card-row col" style={{ gap: "8px" }}>
            <label className="row-label">New email address</label>
            <input
              type="email"
              className={`field-input${emailErr ? " err" : ""}`}
              placeholder="name@example.com"
              value={newEmail}
              onChange={e => { setNewEmail(e.target.value); setEmailErr(""); }}
              style={{ maxWidth: "420px" }}
            />
            {emailErr && <div className="err-msg">{emailErr}</div>}
            <button className="btn-primary" onClick={submitEmail} style={{ alignSelf: "flex-start", marginTop: "2px" }}>
              Confirm change
            </button>
          </div>
        )}
      </div>

      {/* 2FA */}
      <div className="settings-card">
        <div className="card-header"><div className="section-label">Two-factor authentication</div></div>
        <div className="card-row">
          <div>
            <div className="row-label">Enable 2FA</div>
            <div className="row-sub">{twoFA ? "Your account has an extra layer of security" : "Add an extra layer of security to your account"}</div>
          </div>
          <button className={`toggle-track${twoFA ? " on" : ""}`} onClick={() => setTwoFA(v => !v)} />
        </div>
        {twoFA && (
          <div className="card-row">
            <div>
              <div className="row-label">Authenticator app</div>
              <div className="row-sub">Use an app like Google Authenticator</div>
            </div>
            <button className="btn-ghost">Configure</button>
          </div>
        )}
      </div>

      {/* Sessions */}
      <div className="settings-card">
        <div className="card-header"><div className="section-label">Active sessions</div></div>
        {[
          { device: "Chrome · macOS",   location: "Kandy, LK",   active: true },
          { device: "Mobile · Android", location: "Colombo, LK", active: false },
        ].map((s, i) => (
          <div key={i} className="card-row">
            <div style={{ display: "flex", align: "center", gap: "14px" }}>
              <div>
                <div className="row-label">{s.device}</div>
                <div className="row-sub">{s.location}{s.active ? " · Current session" : ""}</div>
              </div>
            </div>
            {s.active
              ? <span style={{ fontSize: "11px", background: "var(--accent-dim)", color: "var(--accent)", border: "1px solid var(--accent-border)", padding: "4px 12px", borderRadius: "20px", fontFamily: "'JetBrains Mono', monospace" }}>
                  Active
                </span>
              : <button className="btn-danger" style={{ fontSize: "12.5px", padding: "7px 14px" }}>Revoke</button>
            }
          </div>
        ))}
        <div className="card-row" style={{ justifyContent: "flex-end" }}>
          <button className="btn-danger" style={{ fontSize: "12.5px" }}>Sign out all devices</button>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────
   SECTION: Notifications
────────────────────────────────────── */
function NotificationsSection() {
  const [prefs, setPrefs] = useState({
    noteAdded: true, noteDeleted: false,
    importantFlag: true, weeklyDigest: false, productUpdates: true,
  });
  const toggle = k => setPrefs(p => ({ ...p, [k]: !p[k] }));

  const rows = [
    { key: "noteAdded",      label: "Note created",    sub: "When a new note is successfully added" },
    { key: "noteDeleted",    label: "Note deleted",    sub: "When a note is removed from your list" },
    { key: "importantFlag",  label: "Marked important",sub: "When you flag a note as important" },
    { key: "weeklyDigest",   label: "Weekly digest",   sub: "A summary of your notes activity each week" },
    { key: "productUpdates", label: "Product updates", sub: "New features and improvements to the app" },
  ];

  return (
    <div className="settings-card section-enter">
      <div className="card-header"><div className="section-label">Notifications</div></div>
      {rows.map(r => (
        <div key={r.key} className="card-row">
          <div>
            <div className="row-label">{r.label}</div>
            <div className="row-sub">{r.sub}</div>
          </div>
          <button className={`toggle-track${prefs[r.key] ? " on" : ""}`} onClick={() => toggle(r.key)} />
        </div>
      ))}
    </div>
  );
}

/* ──────────────────────────────────────
   MAIN PAGE
────────────────────────────────────── */
export default function ProfilePage({ totalNotes = 0 }) {
  const [section, setSection] = useState("profile");
  const { theme, setTheme, fontSize, setFontSize, compactMode, setCompactMode, animations, setAnimations } = useTheme();

  const navItems = [
    { key: "profile",       label: "Profile",       icon: <UserIcon /> },
    { key: "appearance",    label: "Appearance",    icon: <PaletteIcon /> },
    { key: "security",      label: "Security",      icon: <ShieldIcon /> },
    { key: "notifications", label: "Notifications", icon: <BellIcon /> },
  ];

  const titles = {
    profile: "Profile",
    appearance: "Appearance",
    security: "Security",
    notifications: "Notifications",
  };
  const subs = {
    profile: "Manage your public profile and account details",
    appearance: "Customise how the app looks and feels",
    security: "Password, email, and session management",
    notifications: "Control what alerts you receive",
  };

  return (
    <div className="page-enter" style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "auto" }}>
      {/* ── Body ── */}
      <div style={{
        maxWidth: "860px", margin: "0 auto", width: "100%",
        padding: "40px 28px",
        display: "flex",
        flexDirection: "column",
        gap: "32px",
      }}>

        {/* ── Top nav / Tabs ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px", borderBottom: "1px solid var(--border)", paddingBottom: "20px" }}>
          {/* Profile mini */}
          <div style={{
            display: "flex", alignItems: "center", gap: "16px",
          }}>
            <div style={{
              width: "56px", height: "56px", borderRadius: "50%",
              background: "var(--accent-dim)",
              border: "2px solid var(--accent-border)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "18px", fontWeight: 600, color: "var(--accent)",
              fontFamily: "'JetBrains Mono', monospace",
              flexShrink: 0,
            }}>PT</div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: "16px", fontWeight: 600, color: "var(--text)", letterSpacing: "-0.01em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                Pulith Thewmika
              </div>
              <div style={{ fontSize: "13px", color: "var(--text3)", marginTop: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                Free plan
              </div>
            </div>
          </div>

          {/* Nav list - Horizontal Tabs */}
          <nav style={{ display: "flex", gap: "10px", overflowX: "auto", paddingBottom: "4px" }}>
            {navItems.map(item => (
              <button
                key={item.key}
                className={`profile-nav-item${section === item.key ? " active" : ""}`}
                style={{
                  width: "auto", display: "inline-flex", whiteSpace: "nowrap",
                  padding: "10px 18px", borderRadius: "20px",
                  border: section === item.key ? "1px solid var(--accent-border)" : "1px solid transparent",
                  background: section === item.key ? "var(--accent-dim)" : "transparent",
                  color: section === item.key ? "var(--accent)" : "var(--text3)",
                }}
                onClick={() => setSection(item.key)}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        {/* ── Content area ── */}
        <main>
          {/* Section heading */}
          <div style={{ marginBottom: "24px" }}>
            <h1 style={{
              fontSize: "26px", fontWeight: 400,
              fontFamily: "'Instrument Serif', serif",
              color: "var(--text)",
              letterSpacing: "-0.02em", lineHeight: 1.2,
            }}>
              {titles[section]}
            </h1>
            <p style={{ fontSize: "13.5px", color: "var(--text3)", marginTop: "5px" }}>
              {subs[section]}
            </p>
          </div>

          {/* Sections */}
          {section === "profile"       && <ProfileSection totalNotes={totalNotes} />}
          {section === "appearance"    && <AppearanceSection theme={theme} setTheme={setTheme} fontSize={fontSize} setFontSize={setFontSize} compactMode={compactMode} setCompactMode={setCompactMode} animations={animations} setAnimations={setAnimations} />}
          {section === "security"      && <SecuritySection />}
          {section === "notifications" && <NotificationsSection />}
        </main>
      </div>
    </div>
  );
}
