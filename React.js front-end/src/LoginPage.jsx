import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useTheme } from "./ThemeContext";

import { useGoogleLogin } from '@react-oauth/google';

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

/* ── Global CSS ── */
const G = `
  /* Global animations and some specific styling */
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(28px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes floatA {
    0%,100% { transform: translateY(0px) rotate(0deg); }
    50%      { transform: translateY(-12px) rotate(1.2deg); }
  }
  @keyframes floatB {
    0%,100% { transform: translateY(0px) rotate(-1deg); }
    50%      { transform: translateY(-9px) rotate(0.4deg); }
  }
  @keyframes floatC {
    0%,100% { transform: translateY(0px) rotate(1deg); }
    50%      { transform: translateY(-15px) rotate(-0.8deg); }
  }
  @keyframes pulse {
    0%,100% { opacity: 0.45; }
    50%      { opacity: 1; }
  }
  @keyframes borderPulse {
    0%,100% { border-color: var(--accent-border); box-shadow: 0 0 0 0 rgba(29,158,117,0); }
    50%      { border-color: var(--accent); box-shadow: 0 0 0 4px var(--accent-dim); }
  }
  @keyframes checkIn {
    from { transform: scale(0) rotate(-10deg); opacity: 0; }
    to   { transform: scale(1) rotate(0deg); opacity: 1; }
  }

  .login-input {
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
  .login-input::placeholder { color: var(--text4); }
  .login-input:focus {
    border-color: var(--accent-border);
    box-shadow: 0 0 0 3px var(--accent-dim);
  }
  .login-input:focus + .input-icon { color: var(--accent); }
  .login-input.error { border-color: #e05050 !important; box-shadow: 0 0 0 3px rgba(224,80,80,0.07) !important; }

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
  .cta-primary:hover { background: var(--accent-hover); transform: translateY(-1px); box-shadow: 0 8px 24px rgba(29,158,117,0.22); }
  .cta-primary:active { transform: scale(0.97); }
  .cta-primary:disabled { opacity: 0.5; cursor: not-allowed; transform: none; box-shadow: none; }

  .nav-link {
    font-size: 13.5px; font-weight: 500; color: var(--text2);
    text-decoration: none; transition: color 0.2s; letter-spacing: -0.01em;
  }
  .nav-link:hover { color: var(--text); }

  .note-mock {
    background: var(--bg2);
    border: 1px solid var(--border);
    border-radius: 14px;
    padding: 16px 18px;
  }
  .note-mock.imp { border-color: var(--accent-border); background: var(--accent-bg); }

  .divider-line {
    flex: 1; height: 1px; background: var(--border);
  }

  .social-btn {
    display: flex; align-items: center; justify-content: center; gap: 9px;
    background: var(--bg2); border: 1px solid var(--border2); border-radius: 10px;
    padding: 11px; font-size: 13px; font-weight: 500;
    color: var(--text2); cursor: pointer;
    font-family: 'Plus Jakarta Sans', sans-serif;
    transition: border-color 0.2s, color 0.2s, background 0.2s;
    flex: 1;
  }
  .social-btn:hover { border-color: var(--text3); color: var(--text); background: var(--bg3); }

  .tab-pill {
    flex: 1; padding: 8px 0; font-size: 13px; font-weight: 500;
    font-family: 'Plus Jakarta Sans', sans-serif;
    background: transparent; border: none; cursor: pointer;
    border-radius: 8px; transition: all 0.2s;
    letter-spacing: -0.01em;
  }
  .tab-pill.active { background: var(--accent-dim); color: var(--accent); }
  .tab-pill.inactive { color: var(--text3); }
  .tab-pill.inactive:hover { color: var(--text2); }
`;

/* ── SVG helpers ── */
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

const CheckCircle = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" style={{ animation: "checkIn 0.3s cubic-bezier(.34,1.56,.64,1) both" }}>
    <circle cx="7.5" cy="7.5" r="6.5" fill="var(--accent)22" stroke="var(--accent)" strokeWidth="1.2"/>
    <path d="M4.5 7.5l2 2 4-4" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

/* ── Floating note ── */
function FloatingNote({ title, desc, imp, animation, delay, style }) {
  return (
    <div style={{ animation: `${animation} ${3.8}s ease-in-out infinite`, animationDelay: `${delay}s`, ...style }}>
      <div className={`note-mock${imp ? " imp" : ""}`}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "7px" }}>
          <span style={{ fontSize: "11.5px", fontWeight: 600, color: imp ? "var(--accent)" : "var(--text4)", lineHeight: 1.3 }}>
            {title}
          </span>
          {imp && (
            <span style={{
              fontSize: "8.5px", fontWeight: 600, background: "var(--accent-dim)", color: "var(--accent)",
              padding: "2px 7px", borderRadius: "20px",
              fontFamily: "'JetBrains Mono', monospace", flexShrink: 0, marginLeft: "8px",
            }}>important</span>
          )}
        </div>
        <p style={{ fontSize: "10.5px", color: "var(--text3)", lineHeight: 1.55 }}>{desc}</p>
      </div>
    </div>
  );
}

/* ── Password strength meter ── */
function StrengthMeter({ password }) {
  const getStrength = (pw) => {
    if (!pw) return 0;
    let s = 0;
    if (pw.length >= 8) s++;
    if (/[A-Z]/.test(pw)) s++;
    if (/[0-9]/.test(pw)) s++;
    if (/[^A-Za-z0-9]/.test(pw)) s++;
    return s;
  };
  const strength = getStrength(password);
  const labels = ["", "Weak", "Fair", "Good", "Strong"];
  const colors = ["var(--border2)", "#e05050", "#e08830", "#c8b830", "var(--accent)"];
  if (!password) return null;
  return (
    <div style={{ marginTop: "8px" }}>
      <div style={{ display: "flex", gap: "4px", marginBottom: "5px" }}>
        {[1,2,3,4].map(i => (
          <div key={i} style={{
            flex: 1, height: "3px", borderRadius: "2px",
            background: i <= strength ? colors[strength] : "var(--border)",
            transition: "background 0.3s",
          }} />
        ))}
      </div>
      <span style={{
        fontSize: "10.5px", color: colors[strength],
        fontFamily: "'JetBrains Mono', monospace",
        transition: "color 0.3s",
      }}>{labels[strength]}</span>
    </div>
  );
}

/* ── Main Login Page ── */
export default function LoginPage() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [errors, setErrors] = useState({});
  const [scrolled, setScrolled] = useState(false);

  const login = useGoogleLogin({
    onSuccess: async tokenResponse => {
      try {
        setLoading(true);
        const res = await axios.post(`${API_AUTH}/google-login`, {
          credential: tokenResponse.access_token,
        });
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.user));
        
        setDone(true);
        setTimeout(() => navigate("/app"), 900);
      } catch (err) {
        const msg = err.response?.data?.error || "Google login failed";
        setErrors({ root: msg });
        setLoading(false);
      }
    },
  });

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const validate = () => {
    const e = {};
    if (!usernameOrEmail.trim()) e.username = "Enter your username or email";
    if (password.length < 6) e.password = "At least 6 characters";
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    setLoading(true);

    try {
      const res = await axios.post(`${API_AUTH}/login`, {
        username: usernameOrEmail.trim(),
        password,
      });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      
      setDone(true);
      setTimeout(() => navigate("/app"), 900);
    } catch (err) {
      const msg = err.response?.data?.error || (err.response?.status === 401 ? "Invalid credentials" : "Something went wrong");
      setErrors({ root: msg });
    } finally {
      if (!done) setLoading(false);
    }
  };

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
        <div
          style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}
          onClick={() => navigate("/")}
        >
          <LogoMark />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
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
          
          <span style={{ fontSize: "12.5px", color: "var(--text3)", fontFamily: "'JetBrains Mono', monospace" }}>
            New here?
          </span>
          <button
            className="nav-link"
            onClick={() => navigate("/register")}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: "13.5px", fontWeight: 500 }}
          >
            Sign up →
          </button>
        </div>
      </nav>

      {/* ── LAYOUT ── */}
      <div style={{
        minHeight: "100vh",
        display: "grid",
        gridTemplateColumns: "1fr 480px 1fr",
        alignItems: "center",
        justifyItems: "center",
        position: "relative",
        overflow: "hidden",
        paddingTop: "60px",
      }}>

        {/* ── Grid BG ── */}
        <div style={{
          position: "absolute", inset: 0, zIndex: 0,
          backgroundImage: `
            linear-gradient(rgba(29,158,117,0.035) 1px, transparent 1px),
            linear-gradient(90deg, rgba(29,158,117,0.035) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
          maskImage: "radial-gradient(ellipse 70% 60% at 50% 50%, black 20%, transparent 100%)",
        }} />

        {/* ── Radial glow ── */}
        <div style={{
          position: "absolute", top: "30%", left: "50%", transform: "translateX(-50%)",
          width: "500px", height: "300px",
          background: "radial-gradient(ellipse, rgba(29,158,117,0.07) 0%, transparent 70%)",
          zIndex: 0, pointerEvents: "none",
        }} />

        {/* ── LEFT floating notes ── */}
        <div style={{ position: "relative", width: "100%", height: "100%", zIndex: 1 }}>
          <div style={{ position: "absolute", left: "12%", top: "25%" }}>
            <FloatingNote title="Ship landing page" desc="Polish copy before Monday demo." imp animation="floatA" delay={0} style={{ width: "200px" }} />
          </div>
          <div style={{ position: "absolute", left: "8%", top: "56%" }}>
            <FloatingNote title="Read Clean Code" desc="Chapter 4 — comments & formatting." imp={false} animation="floatB" delay={1} style={{ width: "185px" }} />
          </div>
          <div style={{ position: "absolute", left: "20%", top: "72%" }}>
            <FloatingNote title="Sprint planning" desc="Review velocity from last two weeks." imp={false} animation="floatC" delay={0.5} style={{ width: "175px" }} />
          </div>
        </div>

        {/* ── CENTER card ── */}
        <div style={{
          position: "relative", zIndex: 2,
          width: "100%", maxWidth: "420px",
          animation: "fadeUp 0.6s ease both",
        }}>
          {/* Badge */}
          <div style={{
            display: "flex", justifyContent: "center", marginBottom: "28px",
          }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: "7px",
              background: "var(--accent-bg)", border: "1px solid var(--accent)44",
              borderRadius: "20px", padding: "6px 14px",
            }}>
              <StarBadge />
              <span style={{ fontSize: "11.5px", fontWeight: 500, color: "var(--accent)", fontFamily: "'JetBrains Mono', monospace" }}>
                Welcome back
              </span>
            </div>
          </div>

          {/* Headline */}
          <h1 style={{
            fontSize: "clamp(32px, 4vw, 42px)",
            fontFamily: "'Instrument Serif', serif",
            fontWeight: 400, color: "var(--text)",
            lineHeight: 1.1, letterSpacing: "-0.03em",
            textAlign: "center", marginBottom: "8px",
          }}>
            Sign in to <span style={{ color: "var(--accent)", fontStyle: "italic" }}>Notes</span>
          </h1>
          <p style={{
            fontSize: "13.5px", color: "var(--text3)", textAlign: "center",
            marginBottom: "32px", lineHeight: 1.6,
          }}>
            Your notes are waiting for you.
          </p>

          {/* Card */}
          <div style={{
            background: "var(--bg2)",
            border: "1px solid var(--border)",
            borderRadius: "20px",
            padding: "32px",
            boxShadow: "0 24px 60px rgba(0,0,0,0.4)",
          }}>
            
            {errors.root && (
               <div style={{ background: "#e0505022", border: "1px solid #e0505055", padding: "10px", borderRadius: "8px", marginBottom: "16px", color: "#e05050", fontSize: "12px", textAlign: "center", fontFamily: "'JetBrains Mono', monospace" }}>
                 {errors.root}
               </div>
            )}



            {/* Fields */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

              {/* Username or Email */}
              <div>
                <label style={{ fontSize: "12px", fontWeight: 500, color: "var(--text3)", letterSpacing: "0.02em", display: "block", marginBottom: "7px", fontFamily: "'JetBrains Mono', monospace" }}>
                  USERNAME OR EMAIL
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    className={`login-input${errors.username ? " error" : ""}`}
                    type="text"
                    placeholder="janesmith or you@example.com"
                    value={usernameOrEmail}
                    onChange={e => { setUsernameOrEmail(e.target.value.toLowerCase().replace(/\s/g, "")); setErrors(p => ({ ...p, username: "", root: "" })); }}
                    style={{ paddingLeft: "14px" }}
                  />
                  <svg style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--text4)", pointerEvents: "none", transition: "color 0.2s" }} className="input-icon" width="15" height="15" viewBox="0 0 15 15" fill="none">
                    <path d="M1.5 4a2 2 0 012-2h8a2 2 0 012 2v7a2 2 0 01-2 2h-8a2 2 0 01-2-2V4z" stroke="currentColor" strokeWidth="1.4"/>
                    <path d="M1.5 5.5l5 3 5-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                {errors.username && <p style={{ fontSize: "11px", color: "#e05050", marginTop: "5px", fontFamily: "'JetBrains Mono', monospace" }}>{errors.username}</p>}
              </div>

              {/* Password */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "7px" }}>
                  <label style={{ fontSize: "12px", fontWeight: 500, color: "var(--text3)", letterSpacing: "0.02em", fontFamily: "'JetBrains Mono', monospace" }}>
                    PASSWORD
                  </label>
                  <button style={{ fontSize: "11.5px", color: "var(--accent)", background: "none", border: "none", cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    Forgot?
                  </button>
                </div>
                <div style={{ position: "relative" }}>
                  <input
                    className={`login-input${errors.password ? " error" : ""}`}
                    type={showPw ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={e => { setPassword(e.target.value); setErrors(p => ({ ...p, password: "", root: "" })); }}
                    onKeyDown={e => e.key === "Enter" && handleSubmit()}
                    style={{ paddingRight: "44px" }}
                  />
                  <button
                    onClick={() => setShowPw(p => !p)}
                    style={{
                      position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)",
                      background: "none", border: "none", cursor: "pointer",
                      color: "var(--text4)", display: "flex", padding: "2px",
                      transition: "color 0.2s",
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = "var(--text2)"}
                    onMouseLeave={e => e.currentTarget.style.color = "var(--text4)"}
                  >
                    <EyeIcon open={showPw} />
                  </button>
                </div>
                {errors.password && <p style={{ fontSize: "11px", color: "#e05050", marginTop: "5px", fontFamily: "'JetBrains Mono', monospace" }}>{errors.password}</p>}
              </div>

              {/* Submit */}
              <button
                className="cta-primary"
                onClick={handleSubmit}
                disabled={loading || done}
                style={{ marginTop: "6px" }}
              >
                {done ? (
                  <><CheckCircle /> All set!</>
                ) : loading ? (
                  <>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ animation: "spin 0.7s linear infinite" }}>
                      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                      <circle cx="7" cy="7" r="5.5" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5"/>
                      <path d="M7 1.5A5.5 5.5 0 0112.5 7" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                    Signing in…
                  </>
                ) : (
                  <>Sign in <ArrowRight /></>
                )}
              </button>
            </div>

            {/* Divider */}
            <div style={{ display: "flex", alignItems: "center", gap: "14px", margin: "24px 0" }}>
              <div className="divider-line" />
              <span style={{ fontSize: "11px", color: "var(--text4)", fontFamily: "'JetBrains Mono', monospace", whiteSpace: "nowrap" }}>or continue with</span>
              <div className="divider-line" />
            </div>

            {/* Social */}
            <div style={{ display: "flex", gap: "10px" }}>
              <button className="social-btn">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
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

          </div>

          <p style={{
            textAlign: "center", marginTop: "20px",
            fontSize: "11.5px", color: "var(--text4)",
            fontFamily: "'JetBrains Mono', monospace", lineHeight: 1.7,
          }}>
            No account?{" "}
            <button onClick={() => navigate("/register")} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--accent)", fontSize: "11.5px", fontFamily: "'JetBrains Mono', monospace" }}>Sign up free</button>
          </p>
        </div>

        {/* ── RIGHT floating notes ── */}
        <div style={{ position: "relative", width: "100%", height: "100%", zIndex: 1 }}>
          <div style={{ position: "absolute", right: "12%", top: "22%" }}>
            <FloatingNote title="CORS config" desc="Allow localhost:5173 in .NET policy." imp animation="floatC" delay={0.3} style={{ width: "195px" }} />
          </div>
          <div style={{ position: "absolute", right: "7%", top: "54%" }}>
            <FloatingNote title="API integration" desc="Connect Axios to GET /api/notes." imp={false} animation="floatA" delay={1.1} style={{ width: "185px" }} />
          </div>
          <div style={{ position: "absolute", right: "18%", top: "72%" }}>
            <FloatingNote title="Mobile breakpoints" desc="Collapse grid below 768px." imp={false} animation="floatB" delay={0.7} style={{ width: "175px" }} />
          </div>
        </div>

      </div>

      {/* ── Scroll indicator ── */}
      <div style={{
        position: "fixed", bottom: "32px", left: "50%", transform: "translateX(-50%)",
        display: "flex", flexDirection: "column", alignItems: "center", gap: "7px",
        animation: "pulse 2.5s ease-in-out infinite", zIndex: 10,
        pointerEvents: "none",
      }}>
        <span style={{ fontSize: "10px", color: "var(--border)", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.1em" }}>
          built with React + .NET 9
        </span>
      </div>
    </>
  );
}
