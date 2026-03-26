import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useTheme } from "./ThemeContext";

let API_ROOT = import.meta.env.VITE_AZURE_BACKEND || "http://localhost:5000";
if (API_ROOT.endsWith("/api/notes")) {
  API_ROOT = API_ROOT.replace(/\/api\/notes\/?$/, "");
}
API_ROOT = API_ROOT.replace(/\/$/, "");
const API_AUTH = `${API_ROOT}/api/auth`;

/* ── Font injection ── */
(() => {
  if (document.querySelector('link[data-notes-fonts]')) return;
  const l = document.createElement("link");
  l.rel = "stylesheet";
  l.dataset.notesFonts = "1";
  l.href = "https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Plus+Jakarta+Sans:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap";
  document.head.appendChild(l);
})();

const G = `
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(28px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes floatA {
    0%,100% { transform: translateY(0px) rotate(0deg); }
    50%      { transform: translateY(-13px) rotate(1.2deg); }
  }
  @keyframes floatB {
    0%,100% { transform: translateY(0px) rotate(-0.8deg); }
    50%      { transform: translateY(-9px) rotate(0.5deg); }
  }
  @keyframes floatC {
    0%,100% { transform: translateY(0px) rotate(0.8deg); }
    50%      { transform: translateY(-16px) rotate(-0.8deg); }
  }
  @keyframes pulse {
    0%,100% { opacity: 0.4; }
    50%      { opacity: 1; }
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  @keyframes checkIn {
    from { transform: scale(0) rotate(-10deg); opacity: 0; }
    to   { transform: scale(1) rotate(0deg); opacity: 1; }
  }
  @keyframes stepSlide {
    from { opacity: 0; transform: translateX(18px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes stepSlideBack {
    from { opacity: 0; transform: translateX(-18px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes successPop {
    0%   { transform: scale(0.8); opacity: 0; }
    60%  { transform: scale(1.06); opacity: 1; }
    100% { transform: scale(1); opacity: 1; }
  }

  .reg-input {
    width: 100%;
    background: var(--bg2);
    border: 1px solid var(--border2);
    border-radius: 10px;
    padding: 13px 16px;
    font-size: 14px;
    font-family: 'Plus Jakarta Sans', sans-serif;
    color: var(--text);
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
    letter-spacing: -0.01em;
  }
  .reg-input::placeholder { color: var(--text4); }
  .reg-input:focus {
    border-color: var(--accent-border);
    box-shadow: 0 0 0 3px var(--accent-dim);
  }
  .reg-input.error {
    border-color: #e05050 !important;
    box-shadow: 0 0 0 3px rgba(224,80,80,0.07) !important;
  }
  .reg-input.valid {
    border-color: var(--accent-border);
  }

  .cta-primary {
    display: inline-flex; align-items: center; justify-content: center; gap: 8px;
    background: var(--accent); color: #fff;
    border: none; border-radius: 10px;
    padding: 14px 26px;
    font-size: 14px; font-weight: 600;
    font-family: 'Plus Jakarta Sans', sans-serif;
    cursor: pointer; transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
    letter-spacing: -0.01em; width: 100%;
  }
  .cta-primary:hover:not(:disabled) { background: var(--accent-hover); transform: translateY(-1px); box-shadow: 0 8px 24px rgba(29,158,117,0.22); }
  .cta-primary:active:not(:disabled) { transform: scale(0.97); }
  .cta-primary:disabled { opacity: 0.45; cursor: not-allowed; }

  .cta-ghost {
    display: inline-flex; align-items: center; justify-content: center; gap: 8px;
    background: transparent; color: var(--text2);
    border: 1px solid var(--border2); border-radius: 10px;
    padding: 14px 26px; font-size: 14px; font-weight: 500;
    font-family: 'Plus Jakarta Sans', sans-serif;
    cursor: pointer; transition: all 0.2s; letter-spacing: -0.01em; width: 100%;
  }
  .cta-ghost:hover { border-color: var(--text3); color: var(--text); }

  .nav-link {
    font-size: 13.5px; font-weight: 500; color: var(--text2);
    text-decoration: none; transition: color 0.2s; letter-spacing: -0.01em;
    background: none; border: none; cursor: pointer;
  }
  .nav-link:hover { color: var(--text); }

  .note-mock {
    background: var(--bg2);
    border: 1px solid var(--border);
    border-radius: 13px;
    padding: 15px 17px;
  }
  .note-mock.imp { border-color: var(--accent-border); background: var(--accent-bg); }

  .step-dot {
    width: 8px; height: 8px; border-radius: 50%;
    transition: all 0.35s cubic-bezier(.34,1.56,.64,1);
    flex-shrink: 0;
  }

  .check-item {
    display: flex; align-items: center; gap: 9px;
    font-size: 12.5px; line-height: 1.4;
    transition: color 0.2s;
  }
  .check-dot {
    width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0;
    transition: background 0.25s;
  }

  .social-btn {
    display: flex; align-items: center; justify-content: center; gap: 9px;
    background: var(--bg3); border: 1px solid var(--border2); border-radius: 10px;
    padding: 11px; font-size: 13px; font-weight: 500;
    color: var(--text2); cursor: pointer; flex: 1;
    font-family: 'Plus Jakarta Sans', sans-serif;
    transition: border-color 0.2s, color 0.2s, background 0.2s;
  }
  .social-btn:hover { border-color: var(--border2); color: var(--text); background: var(--bg2); }

  .avatar-opt {
    width: 44px; height: 44px; border-radius: 50%;
    border: 2px solid var(--border2); cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    font-size: 20px; transition: border-color 0.2s, transform 0.15s;
    background: var(--bg3); flex-shrink: 0;
  }
  .avatar-opt:hover { transform: scale(1.1); }
  .avatar-opt.selected { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(29,158,117,0.15); }
`;

/* ── SVG icons ── */
const LogoMark = () => (
  <img src="/NOVA.png" alt="NOVA Logo" style={{ height: "48px", width: "auto", borderRadius: "8px" }} />
);

const StarBadge = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <path d="M6 1l1.4 2.8 3.1.45-2.25 2.2.53 3.1L6 8.1 3.22 9.55l.53-3.1L1.5 4.25l3.1-.45L6 1z" fill="var(--accent)"/>
  </svg>
);

const ArrowRight = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M2 7h10M7 2l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ArrowLeft = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M12 7H2M7 2L2 7l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const EyeIcon = ({ open }) => open ? (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
    <path d="M1 7.5C1 7.5 3.5 3 7.5 3S14 7.5 14 7.5 11.5 12 7.5 12 1 7.5 1 7.5z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    <circle cx="7.5" cy="7.5" r="1.8" stroke="currentColor" strokeWidth="1.4"/>
  </svg>
) : (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
    <path d="M2 2l11 11M6.2 5.3A4.5 4.5 0 0112.8 9M3 6.5C2.2 7 1.5 7.5 1.5 7.5S4 12 7.5 12c1 0 1.9-.3 2.7-.7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    <path d="M5.5 3.6C6.1 3.2 6.8 3 7.5 3c3.5 0 6 4.5 6 4.5s-.4.7-1.1 1.4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
  </svg>
);

/* ── Floating note card ── */
function FloatingNote({ title, desc, imp, animation, delay, width = 190 }) {
  return (
    <div style={{ animation: `${animation} 4s ease-in-out infinite`, animationDelay: `${delay}s`, width }}>
      <div className={`note-mock${imp ? " imp" : ""}`}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
          <span style={{ fontSize: "11px", fontWeight: 600, color: imp ? "var(--accent)" : "var(--text2)", lineHeight: 1.3 }}>
            {title}
          </span>
          {imp && (
            <span style={{
              fontSize: "8px", fontWeight: 600, background: "var(--accent)22", color: "var(--accent)",
              padding: "2px 6px", borderRadius: "20px",
              fontFamily: "'JetBrains Mono', monospace", marginLeft: "7px", flexShrink: 0,
            }}>important</span>
          )}
        </div>
        <p style={{ fontSize: "10px", color: "var(--text3)", lineHeight: 1.55 }}>{desc}</p>
      </div>
    </div>
  );
}

/* ── Password rules ── */
const PW_RULES = [
  { label: "At least 8 characters", test: pw => pw.length >= 8 },
  { label: "One uppercase letter", test: pw => /[A-Z]/.test(pw) },
  { label: "One number", test: pw => /[0-9]/.test(pw) },
  { label: "One special character", test: pw => /[^A-Za-z0-9]/.test(pw) },
];

function PasswordRules({ password }) {
  if (!password) return null;
  return (
    <div style={{
      marginTop: "10px", padding: "12px 14px",
      background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: "9px",
      display: "flex", flexDirection: "column", gap: "7px",
    }}>
      {PW_RULES.map((r, i) => {
        const ok = r.test(password);
        return (
          <div key={i} className="check-item" style={{ color: ok ? "var(--accent)" : "var(--border2)" }}>
            <div className="check-dot" style={{ background: ok ? "var(--accent)" : "var(--border2)" }} />
            {r.label}
          </div>
        );
      })}
    </div>
  );
}

/* ── Step indicator ── */
function StepBar({ current, total }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "6px", justifyContent: "center", marginBottom: "28px" }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <div
            className="step-dot"
            style={{
              background: i < current ? "var(--accent)" : i === current ? "var(--accent)" : "var(--border2)",
              width: i === current ? "24px" : "8px",
              borderRadius: i === current ? "4px" : "50%",
              opacity: i < current ? 0.5 : 1,
            }}
          />
          {i < total - 1 && (
            <div style={{ width: "20px", height: "1px", background: i < current ? "var(--accent)44" : "var(--border)" }} />
          )}
        </div>
      ))}
    </div>
  );
}

/* ── Field wrapper ── */
function Field({ label, hint, children }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "7px" }}>
        <label style={{
          fontSize: "11.5px", fontWeight: 500, color: "var(--text3)",
          letterSpacing: "0.05em", textTransform: "uppercase",
          fontFamily: "'JetBrains Mono', monospace",
        }}>{label}</label>
        {hint && <span style={{ fontSize: "11px", color: "var(--text4)", fontFamily: "'JetBrains Mono', monospace" }}>{hint}</span>}
      </div>
      {children}
    </div>
  );
}

/* ── Error message ── */
const ErrMsg = ({ msg }) => msg ? (
  <p style={{ fontSize: "11px", color: "#e05050", marginTop: "5px", fontFamily: "'JetBrains Mono', monospace" }}>{msg}</p>
) : null;

/* ── AVATARS ── */
const AVATARS = ["🦊", "🐼", "🐙", "🦋", "🐬", "🦁", "🐸", "🌵"];

/* ── MAIN ── */
export default function RegisterPage() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [step, setStep] = useState(0); // 0=account 1=profile 2=prefs 3=done
  const [dir, setDir] = useState(1);   // 1=forward -1=back
  const [scrolled, setScrolled] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showCPw, setShowCPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [animKey, setAnimKey] = useState(0);

  // Fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [avatar, setAvatar] = useState("🦊");
  const [agreed, setAgreed] = useState(false);
  const [newsletter, setNewsletter] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const goTo = (next) => {
    setDir(next > step ? 1 : -1);
    setAnimKey(k => k + 1);
    setStep(next);
  };

  /* ── Validation per step ── */
  const validateStep = () => {
    const e = {};
    if (step === 0) {
      if (!email.includes("@")) e.email = "Enter a valid email address";
      const pwOk = PW_RULES.every(r => r.test(password));
      if (!pwOk) e.password = "Password doesn't meet all requirements";
      if (password !== confirmPw) e.confirmPw = "Passwords don't match";
    }
    if (step === 1) {
      if (!firstName.trim()) e.firstName = "First name is required";
      if (!lastName.trim()) e.lastName = "Last name is required";
      if (username.trim().length < 3) e.username = "At least 3 characters";
      if (/\s/.test(username)) e.username = "No spaces allowed";
    }
    if (step === 2) {
      if (!agreed) e.agreed = "You must accept the terms to continue";
    }
    return e;
  };

  const next = async () => {
    const e = validateStep();
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    if (step === 2) {
      setLoading(true);
      try {
        const res = await axios.post(`${API_AUTH}/register`, {
          email: email.trim(),
          username: username.trim(),
          password,
        });
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.user));
        setLoading(false);
        goTo(3);
      } catch (err) {
        setLoading(false);
        const msg = err.response?.data?.error || "Registration failed";
        setErrors({ agreed: msg });
      }
    } else {
      goTo(step + 1);
    }
  };

  const back = () => { setErrors({}); goTo(step - 1); };

  const animStyle = {
    animation: `${dir > 0 ? "stepSlide" : "stepSlideBack"} 0.35s cubic-bezier(.25,.46,.45,.94) both`,
  };

  /* ── Steps ── */
  const steps = [
    {
      label: "Account",
      icon: (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <rect x="1" y="2" width="12" height="9" rx="2" stroke="currentColor" strokeWidth="1.4"/>
          <path d="M1 5.5l6 3.5 6-3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
        </svg>
      ),
    },
    {
      label: "Profile",
      icon: (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <circle cx="7" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.4"/>
          <path d="M2 12c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
        </svg>
      ),
    },
    {
      label: "Preferences",
      icon: (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M2 4h10M4 7h6M6 10h2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
        </svg>
      ),
    },
  ];

  return (
    <>
      <style>{G}</style>

      {/* ── NAV ── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        padding: "0 40px", height: "60px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: scrolled ? "var(--bg-scroll)" : "transparent",
        backdropFilter: scrolled ? "blur(16px)" : "none",
        borderBottom: scrolled ? "1px solid var(--border)" : "1px solid transparent",
        transition: "all 0.3s ease",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }} onClick={() => navigate("/")}>
          <LogoMark />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <button
            onClick={toggleTheme}
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: "var(--text2)", display: "flex", alignItems: "center",
              justifyContent: "center", width: "32px", height: "32px",
              borderRadius: "8px", transition: "all 0.2s"
            }}
            onMouseEnter={e => { e.currentTarget.style.color = "var(--text)"; e.currentTarget.style.background = "var(--bg3)"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "var(--text2)"; e.currentTarget.style.background = "transparent"; }}
            title="Toggle theme"
          >
            {theme === "dark" ? (
              <svg width="15" height="15" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="2.5" stroke="currentColor" strokeWidth="1.4"/><path d="M7 1v1.5M7 11.5V13M1 7h1.5M11.5 7H13M2.9 2.9l1.1 1.1M10 10l1.1 1.1M2.9 11.1L4 10M10 4l1.1-1.1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
            ) : (
              <svg width="15" height="15" viewBox="0 0 14 14" fill="none"><path d="M12 8.5A5.5 5.5 0 015.5 2a5.5 5.5 0 100 10A5.5 5.5 0 0012 8.5z" stroke="currentColor" strokeWidth="1.4"/></svg>
            )}
          </button>
          
          <span style={{ fontSize: "12px", color: "var(--text3)", fontFamily: "'JetBrains Mono', monospace" }}>
            Already have an account?
          </span>
          <button className="nav-link" onClick={() => navigate("/login")}>Sign in →</button>
        </div>
      </nav>

      {/* ── LAYOUT ── */}
      <div style={{
        minHeight: "100vh",
        display: "grid",
        gridTemplateColumns: "1fr 500px 1fr",
        alignItems: "center",
        justifyItems: "center",
        position: "relative",
        overflow: "hidden",
        paddingTop: "60px",
        paddingBottom: "40px",
      }}>
        {/* Grid bg */}
        <div style={{
          position: "absolute", inset: 0, zIndex: 0,
          backgroundImage: `
            linear-gradient(rgba(29,158,117,0.035) 1px, transparent 1px),
            linear-gradient(90deg, rgba(29,158,117,0.035) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
          maskImage: "radial-gradient(ellipse 70% 65% at 50% 50%, black 20%, transparent 100%)",
        }} />

        {/* Glow */}
        <div style={{
          position: "absolute", top: "25%", left: "50%", transform: "translateX(-50%)",
          width: "500px", height: "300px",
          background: "radial-gradient(ellipse, rgba(29,158,117,0.07) 0%, transparent 70%)",
          zIndex: 0, pointerEvents: "none",
        }} />

        {/* LEFT notes */}
        <div style={{ position: "relative", width: "100%", height: "100%", zIndex: 1 }}>
          <div style={{ position: "absolute", left: "10%", top: "18%" }}>
            <FloatingNote title="Ship landing page" desc="Polish copy before Monday demo." imp animation="floatA" delay={0} width={195} />
          </div>
          <div style={{ position: "absolute", left: "6%", top: "50%" }}>
            <FloatingNote title="Read Clean Code" desc="Chapter 4 — formatting." animation="floatB" delay={0.9} width={178} />
          </div>
          <div style={{ position: "absolute", left: "16%", top: "72%" }}>
            <FloatingNote title="Sprint retro notes" desc="Action items from last Friday." animation="floatC" delay={0.4} width={170} />
          </div>
        </div>

        {/* ── CENTER CARD ── */}
        <div style={{
          position: "relative", zIndex: 2,
          width: "100%", maxWidth: "460px",
          animation: "fadeUp 0.55s ease both",
        }}>

          {/* Badge */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "24px" }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: "7px",
              background: "var(--accent-bg)", border: "1px solid var(--accent)44",
              borderRadius: "20px", padding: "6px 14px",
            }}>
              <StarBadge />
              <span style={{ fontSize: "11.5px", fontWeight: 500, color: "var(--accent)", fontFamily: "'JetBrains Mono', monospace" }}>
                {step < 3 ? `Step ${step + 1} of 3` : "You're in!"}
              </span>
            </div>
          </div>

          {/* Headline */}
          {step < 3 && (
            <>
              <h1 style={{
                fontSize: "clamp(28px, 3.5vw, 40px)",
                fontFamily: "'Instrument Serif', serif",
                fontWeight: 400, color: "var(--text)",
                lineHeight: 1.1, letterSpacing: "-0.03em",
                textAlign: "center", marginBottom: "6px",
              }}>
                {step === 0 && <>Create your <span style={{ color: "var(--accent)", fontStyle: "italic" }}>account</span></>}
                {step === 1 && <>Tell us about <span style={{ color: "var(--accent)", fontStyle: "italic" }}>yourself</span></>}
                {step === 2 && <>Almost <span style={{ color: "var(--accent)", fontStyle: "italic" }}>there</span></>}
              </h1>
              <p style={{ fontSize: "13px", color: "var(--text3)", textAlign: "center", marginBottom: "28px", lineHeight: 1.6 }}>
                {step === 0 && "Start with your email and a secure password."}
                {step === 1 && "Set up your public profile for Notes."}
                {step === 2 && "Review your preferences and agree to our terms."}
              </p>
            </>
          )}

          {/* Card */}
          <div style={{
            background: "var(--bg2)",
            border: "1px solid var(--border)",
            borderRadius: "20px",
            padding: "32px",
            boxShadow: "0 24px 60px rgba(0,0,0,0.45)",
            overflow: "hidden",
          }}>

            {step < 3 && (
              <>
                {/* Step tabs */}
                <div style={{
                  display: "flex", gap: "0",
                  background: "var(--bg3)", border: "1px solid var(--border)",
                  borderRadius: "10px", padding: "4px", marginBottom: "28px",
                }}>
                  {steps.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => i < step && goTo(i)}
                      style={{
                        flex: 1, padding: "8px 0",
                        fontSize: "12px", fontWeight: 500,
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        background: i === step ? "var(--accent)18" : "transparent",
                        color: i === step ? "var(--accent)" : i < step ? "var(--text3)" : "var(--text4)",
                        border: "none", borderRadius: "7px",
                        cursor: i < step ? "pointer" : "default",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                        transition: "all 0.2s",
                      }}
                    >
                      {s.icon} {s.label}
                    </button>
                  ))}
                </div>

                {/* Step progress bar */}
                <div style={{
                  height: "2px", background: "var(--border)", borderRadius: "2px",
                  marginBottom: "28px", overflow: "hidden",
                }}>
                  <div style={{
                    height: "100%",
                    width: `${((step) / 2) * 100}%`,
                    background: "linear-gradient(90deg, var(--accent), #2dd4a0)",
                    borderRadius: "2px",
                    transition: "width 0.5s cubic-bezier(.25,.46,.45,.94)",
                  }} />
                </div>
              </>
            )}

            {/* ── STEP 0: Account ── */}
            {step === 0 && (
              <div key={`step0-${animKey}`} style={animStyle}>
                <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>

                  {/* Social row */}
                  <div style={{ display: "flex", gap: "10px" }}>
                    <button className="social-btn">
                      <svg width="15" height="15" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      </svg>
                      Google
                    </button>
                    <button className="social-btn">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                      </svg>
                      GitHub
                    </button>
                  </div>

                  {/* Divider */}
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
                    <span style={{ fontSize: "11px", color: "var(--text4)", fontFamily: "'JetBrains Mono', monospace" }}>or with email</span>
                    <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
                  </div>

                  {/* Email */}
                  <Field label="Email">
                    <div style={{ position: "relative" }}>
                      <input
                        className={`reg-input${errors.email ? " error" : email.includes("@") ? " valid" : ""}`}
                        type="email" placeholder="you@example.com"
                        value={email}
                        onChange={e => { setEmail(e.target.value); setErrors(p => ({ ...p, email: "" })); }}
                      />
                      {email.includes("@") && !errors.email && (
                        <div style={{ position: "absolute", right: "13px", top: "50%", transform: "translateY(-50%)" }}>
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ animation: "checkIn 0.25s ease both" }}>
                            <circle cx="7" cy="7" r="6" fill="var(--accent)22" stroke="var(--accent)" strokeWidth="1.2"/>
                            <path d="M4 7l2 2 4-4" stroke="var(--accent)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                      )}
                    </div>
                    <ErrMsg msg={errors.email} />
                  </Field>

                  {/* Password */}
                  <Field label="Password">
                    <div style={{ position: "relative" }}>
                      <input
                        className={`reg-input${errors.password ? " error" : ""}`}
                        type={showPw ? "text" : "password"} placeholder="••••••••"
                        value={password}
                        onChange={e => { setPassword(e.target.value); setErrors(p => ({ ...p, password: "" })); }}
                        style={{ paddingRight: "44px" }}
                      />
                      <button
                        onClick={() => setShowPw(p => !p)}
                        style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text4)", display: "flex", padding: "2px", transition: "color 0.2s" }}
                        onMouseEnter={e => e.currentTarget.style.color = "var(--text2)"}
                        onMouseLeave={e => e.currentTarget.style.color = "var(--text4)"}
                      ><EyeIcon open={showPw} /></button>
                    </div>
                    <ErrMsg msg={errors.password} />
                    <PasswordRules password={password} />
                  </Field>

                  {/* Confirm password */}
                  <Field label="Confirm password">
                    <div style={{ position: "relative" }}>
                      <input
                        className={`reg-input${errors.confirmPw ? " error" : confirmPw && confirmPw === password ? " valid" : ""}`}
                        type={showCPw ? "text" : "password"} placeholder="••••••••"
                        value={confirmPw}
                        onChange={e => { setConfirmPw(e.target.value); setErrors(p => ({ ...p, confirmPw: "" })); }}
                        style={{ paddingRight: "44px" }}
                      />
                      <button
                        onClick={() => setShowCPw(p => !p)}
                        style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text4)", display: "flex", padding: "2px", transition: "color 0.2s" }}
                        onMouseEnter={e => e.currentTarget.style.color = "var(--text2)"}
                        onMouseLeave={e => e.currentTarget.style.color = "var(--text4)"}
                      ><EyeIcon open={showCPw} /></button>
                      {confirmPw && confirmPw === password && !errors.confirmPw && (
                        <div style={{ position: "absolute", right: "36px", top: "50%", transform: "translateY(-50%)" }}>
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ animation: "checkIn 0.25s ease both" }}>
                            <circle cx="7" cy="7" r="6" fill="var(--accent)22" stroke="var(--accent)" strokeWidth="1.2"/>
                            <path d="M4 7l2 2 4-4" stroke="var(--accent)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                      )}
                    </div>
                    <ErrMsg msg={errors.confirmPw} />
                  </Field>
                </div>
              </div>
            )}

            {/* ── STEP 1: Profile ── */}
            {step === 1 && (
              <div key={`step1-${animKey}`} style={animStyle}>
                <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>

                  {/* Avatar picker */}
                  <Field label="Pick an avatar">
                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                      {AVATARS.map(a => (
                        <button
                          key={a}
                          className={`avatar-opt${avatar === a ? " selected" : ""}`}
                          onClick={() => setAvatar(a)}
                        >
                          {a}
                        </button>
                      ))}
                    </div>
                  </Field>

                  {/* Name row */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <Field label="First name">
                      <input
                        className={`reg-input${errors.firstName ? " error" : firstName.trim() ? " valid" : ""}`}
                        placeholder="Jane"
                        value={firstName}
                        onChange={e => { setFirstName(e.target.value); setErrors(p => ({ ...p, firstName: "" })); }}
                      />
                      <ErrMsg msg={errors.firstName} />
                    </Field>
                    <Field label="Last name">
                      <input
                        className={`reg-input${errors.lastName ? " error" : lastName.trim() ? " valid" : ""}`}
                        placeholder="Smith"
                        value={lastName}
                        onChange={e => { setLastName(e.target.value); setErrors(p => ({ ...p, lastName: "" })); }}
                      />
                      <ErrMsg msg={errors.lastName} />
                    </Field>
                  </div>

                  {/* Username */}
                  <Field label="Username" hint="public · unique">
                    <div style={{ position: "relative" }}>
                      <span style={{
                        position: "absolute", left: "13px", top: "50%", transform: "translateY(-50%)",
                        fontSize: "14px", color: "var(--text4)", fontFamily: "'JetBrains Mono', monospace",
                        pointerEvents: "none",
                      }}>@</span>
                      <input
                        className={`reg-input${errors.username ? " error" : username.trim().length >= 3 ? " valid" : ""}`}
                        placeholder="janesmith"
                        value={username}
                        onChange={e => { setUsername(e.target.value.toLowerCase().replace(/\s/g, "")); setErrors(p => ({ ...p, username: "" })); }}
                        style={{ paddingLeft: "28px" }}
                      />
                    </div>
                    <ErrMsg msg={errors.username} />
                  </Field>

                  {/* Preview card */}
                  {(firstName || username) && (
                    <div style={{
                      background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: "11px",
                      padding: "14px 16px", display: "flex", alignItems: "center", gap: "14px",
                      animation: "fadeUp 0.3s ease both",
                    }}>
                      <div style={{
                        width: "42px", height: "42px", borderRadius: "50%",
                        background: "var(--accent-bg)", border: "1px solid var(--accent)33",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "22px", flexShrink: 0,
                      }}>{avatar}</div>
                      <div>
                        <div style={{ fontSize: "13.5px", fontWeight: 600, color: "var(--text)", letterSpacing: "-0.01em" }}>
                          {firstName || "—"} {lastName || ""}
                        </div>
                        <div style={{ fontSize: "11px", color: "var(--accent)", fontFamily: "'JetBrains Mono', monospace", marginTop: "2px" }}>
                          @{username || "username"}
                        </div>
                      </div>
                      <div style={{
                        marginLeft: "auto", fontSize: "9px", color: "var(--text4)",
                        fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.05em",
                      }}>PREVIEW</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── STEP 2: Preferences ── */}
            {step === 2 && (
              <div key={`step2-${animKey}`} style={animStyle}>
                <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>

                  {/* Summary card */}
                  <div style={{
                    background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: "12px", padding: "16px",
                  }}>
                    <div style={{ fontSize: "10.5px", color: "var(--text4)", fontFamily: "'JetBrains Mono', monospace", marginBottom: "12px", letterSpacing: "0.05em" }}>
                      ACCOUNT SUMMARY
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                      <div style={{
                        width: "40px", height: "40px", borderRadius: "50%",
                        background: "var(--accent-bg)", border: "1px solid var(--accent)33",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "20px", flexShrink: 0,
                      }}>{avatar}</div>
                      <div>
                        <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)" }}>
                          {firstName} {lastName}
                        </div>
                        <div style={{ fontSize: "11px", color: "var(--accent)", fontFamily: "'JetBrains Mono', monospace" }}>
                          @{username} · {email}
                        </div>
                      </div>
                    </div>
                    <div style={{ height: "1px", background: "var(--border)", marginBottom: "10px" }} />
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                      {["In-memory store", ".NET 9 API", "React frontend"].map(t => (
                        <span key={t} style={{
                          fontSize: "10px", background: "var(--accent)10", color: "var(--accent)", border: "1px solid var(--accent)22",
                          padding: "3px 9px", borderRadius: "20px",
                          fontFamily: "'JetBrains Mono', monospace",
                        }}>{t}</span>
                      ))}
                    </div>
                  </div>

                  {/* Newsletter */}
                  <label style={{ display: "flex", alignItems: "flex-start", gap: "12px", cursor: "pointer" }}>
                    <div
                      onClick={() => setNewsletter(p => !p)}
                      style={{
                        width: "18px", height: "18px", borderRadius: "5px", flexShrink: 0, marginTop: "1px",
                        background: newsletter ? "var(--accent)22" : "var(--bg3)",
                        border: `1px solid ${newsletter ? "var(--accent)" : "var(--border2)"}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        cursor: "pointer", transition: "all 0.2s",
                      }}
                    >
                      {newsletter && (
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ animation: "checkIn 0.2s ease both" }}>
                          <path d="M1.5 5l2.5 2.5 5-5" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                    <div>
                      <div style={{ fontSize: "13px", fontWeight: 500, color: "var(--text2)", letterSpacing: "-0.01em" }}>
                        Product updates
                      </div>
                      <div style={{ fontSize: "11.5px", color: "var(--border2)", marginTop: "2px", lineHeight: 1.5 }}>
                        Get notified about new features and improvements.
                      </div>
                    </div>
                  </label>

                  {/* Terms */}
                  <label style={{ display: "flex", alignItems: "flex-start", gap: "12px", cursor: "pointer" }}>
                    <div
                      onClick={() => { setAgreed(p => !p); setErrors(p => ({ ...p, agreed: "" })); }}
                      style={{
                        width: "18px", height: "18px", borderRadius: "5px", flexShrink: 0, marginTop: "1px",
                        background: agreed ? "var(--accent)22" : "var(--bg3)",
                        border: `1px solid ${errors.agreed ? "#e05050" : agreed ? "var(--accent)" : "var(--border2)"}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        cursor: "pointer", transition: "all 0.2s",
                      }}
                    >
                      {agreed && (
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ animation: "checkIn 0.2s ease both" }}>
                          <path d="M1.5 5l2.5 2.5 5-5" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                    <div>
                      <div style={{ fontSize: "13px", fontWeight: 500, color: "var(--text2)", letterSpacing: "-0.01em" }}>
                        I agree to the{" "}
                        <span style={{ color: "var(--accent)", textDecoration: "underline", cursor: "pointer" }}>Terms of Service</span>
                        {" "}and{" "}
                        <span style={{ color: "var(--accent)", textDecoration: "underline", cursor: "pointer" }}>Privacy Policy</span>
                      </div>
                      {errors.agreed && <p style={{ fontSize: "11px", color: "#e05050", marginTop: "4px", fontFamily: "'JetBrains Mono', monospace" }}>{errors.agreed}</p>}
                    </div>
                  </label>

                </div>
              </div>
            )}

            {/* ── STEP 3: Success ── */}
            {step === 3 && (
              <div key="success" style={{ animation: "successPop 0.5s cubic-bezier(.34,1.56,.64,1) both", textAlign: "center" }}>
                <div style={{
                  width: "72px", height: "72px", borderRadius: "50%",
                  background: "var(--accent-bg)", border: "1px solid var(--accent)44",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "0 auto 20px",
                  fontSize: "32px",
                }}>{avatar}</div>
                <h2 style={{
                  fontSize: "28px", fontFamily: "'Instrument Serif', serif",
                  fontWeight: 400, color: "var(--text)", marginBottom: "8px",
                  letterSpacing: "-0.02em",
                }}>
                  Welcome, <span style={{ color: "var(--accent)", fontStyle: "italic" }}>{firstName}!</span>
                </h2>
                <p style={{ fontSize: "13.5px", color: "var(--text3)", marginBottom: "28px", lineHeight: 1.6 }}>
                  Your account is ready. Start capturing what matters.
                </p>

                {/* Confetti-like stat pills */}
                <div style={{ display: "flex", justifyContent: "center", gap: "8px", flexWrap: "wrap", marginBottom: "28px" }}>
                  {[`@${username}`, email, avatar].map((item, i) => (
                    <span key={i} style={{
                      fontSize: "11px", background: "var(--accent)10", color: "var(--accent)",
                      border: "1px solid var(--accent)22", padding: "4px 12px",
                      borderRadius: "20px", fontFamily: "'JetBrains Mono', monospace",
                    }}>{item}</span>
                  ))}
                </div>

                <button
                  className="cta-primary"
                  onClick={() => navigate("/app")}
                >
                  Open Notes app <ArrowRight />
                </button>
              </div>
            )}

            {/* ── NAV BUTTONS (steps 0-2) ── */}
            {step < 3 && (
              <div style={{ display: "flex", gap: "10px", marginTop: "24px" }}>
                {step > 0 && (
                  <button className="cta-ghost" onClick={back} style={{ flex: "0 0 auto", width: "auto", padding: "14px 20px" }}>
                    <ArrowLeft />
                  </button>
                )}
                <button className="cta-primary" onClick={next} disabled={loading}>
                  {loading ? (
                    <>
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ animation: "spin 0.7s linear infinite" }}>
                        <circle cx="7" cy="7" r="5.5" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5"/>
                        <path d="M7 1.5A5.5 5.5 0 0112.5 7" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                      Creating account…
                    </>
                  ) : step === 2 ? (
                    <>Create account <ArrowRight /></>
                  ) : (
                    <>Continue <ArrowRight /></>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Footer note */}
          {step < 3 && (
            <p style={{
              textAlign: "center", marginTop: "18px",
              fontSize: "11.5px", color: "var(--text4)",
              fontFamily: "'JetBrains Mono', monospace",
            }}>
              Already have an account?{" "}
              <button onClick={() => navigate("/login")} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--accent)", fontSize: "11.5px", fontFamily: "'JetBrains Mono', monospace" }}>
                Sign in
              </button>
            </p>
          )}
        </div>

        {/* RIGHT notes */}
        <div style={{ position: "relative", width: "100%", height: "100%", zIndex: 1 }}>
          <div style={{ position: "absolute", right: "10%", top: "18%" }}>
            <FloatingNote title="CORS config" desc="Allow localhost:5173 in .NET policy." imp animation="floatC" delay={0.3} width={192} />
          </div>
          <div style={{ position: "absolute", right: "6%", top: "50%" }}>
            <FloatingNote title="API integration" desc="Wire Axios to GET /api/notes." animation="floatA" delay={1.1} width={178} />
          </div>
          <div style={{ position: "absolute", right: "16%", top: "72%" }}>
            <FloatingNote title="Mobile breakpoints" desc="Collapse grid below 768px." animation="floatB" delay={0.6} width={172} />
          </div>
        </div>
      </div>

      {/* Footer stamp */}
      <div style={{
        textAlign: "center", paddingBottom: "28px",
        fontSize: "10.5px", color: "var(--border)",
        fontFamily: "'JetBrains Mono', monospace",
        animation: "pulse 2.5s ease-in-out infinite",
      }}>
        built with React + .NET 9
      </div>
    </>
  );
}
