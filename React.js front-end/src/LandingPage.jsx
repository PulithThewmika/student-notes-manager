import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

/* ── Font injection ── */
(() => {
  const l = document.createElement("link");
  l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Plus+Jakarta+Sans:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap";
  document.head.appendChild(l);
})();

/* ── Global CSS ── */
const G = `
  .nav-link {
    font-size: 13.5px; font-weight: 500; color: var(--text2);
    text-decoration: none; transition: color 0.2s; letter-spacing: -0.01em;
  }
  .nav-link:hover { color: var(--text); }

  .cta-primary {
    display: inline-flex; align-items: center; gap: 8px;
    background: var(--accent); color: #fff;
    border: none; border-radius: 10px;
    padding: 13px 26px;
    font-size: 14px; font-weight: 600;
    font-family: 'Plus Jakarta Sans', sans-serif;
    cursor: pointer; transition: background 0.2s, transform 0.15s;
    letter-spacing: -0.01em; text-decoration: none;
  }
  .cta-primary:hover { background: var(--accent-hover); transform: translateY(-1px); }
  .cta-primary:active { transform: scale(0.97); }

  .cta-ghost {
    display: inline-flex; align-items: center; gap: 8px;
    background: transparent; color: var(--text2);
    border: 1px solid var(--border2); border-radius: 10px;
    padding: 13px 26px;
    font-size: 14px; font-weight: 500;
    font-family: 'Plus Jakarta Sans', sans-serif;
    cursor: pointer; transition: all 0.2s;
    letter-spacing: -0.01em; text-decoration: none;
  }
  .cta-ghost:hover { border-color: var(--text3); color: var(--text); transform: translateY(-1px); }

  .feature-card {
    background: var(--bg3);
    border: 1px solid var(--border2);
    border-radius: 16px;
    padding: 28px;
    transition: border-color 0.2s, transform 0.2s;
  }
  .feature-card:hover { border-color: var(--accent-border); transform: translateY(-3px); }

  .ticker-wrap { overflow: hidden; white-space: nowrap; }
  .ticker-inner { display: inline-flex; gap: 0; animation: ticker 28s linear infinite; }

  .note-mock {
    background: var(--bg2);
    border: 1px solid var(--border2);
    border-radius: 14px;
    padding: 18px 20px;
    transition: border-color 0.2s;
  }
  .note-mock:hover { border-color: var(--accent-border); }
  .note-mock.imp { border-color: var(--accent-border); background: var(--accent-bg); }
`;

/* ── Inline SVG icons ── */
const ArrowRight = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M2 7h10M7 2l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const CheckCircle = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="8" r="7" fill="var(--accent-dim)" stroke="var(--accent)" strokeWidth="1.2"/>
    <path d="M5 8l2 2 4-4" stroke="var(--accent)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const StarBadge = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <path d="M6 1l1.4 2.8 3.1.45-2.25 2.2.53 3.1L6 8.1 3.22 9.55l.53-3.1L1.5 4.25l3.1-.45L6 1z" fill="var(--accent)"/>
  </svg>
);
const LogoMark = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
    <rect width="28" height="28" rx="8" fill="var(--accent)"/>
    <rect x="6" y="6" width="7" height="7" rx="2" fill="white"/>
    <rect x="15" y="6" width="7" height="7" rx="2" fill="white" opacity="0.55"/>
    <rect x="6" y="15" width="7" height="7" rx="2" fill="white" opacity="0.55"/>
    <rect x="15" y="15" width="7" height="7" rx="2" fill="white" opacity="0.25"/>
  </svg>
);

/* ── Scroll reveal hook ── */
function useReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { el.classList.add("visible"); obs.disconnect(); } },
      { threshold: 0.12 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

/* ── Floating note card component ── */
function FloatingNote({ title, desc, tag, delay, animation, style }) {
  return (
    <div style={{
      animation: `${animation} ${3.5 + Math.random()}s ease-in-out infinite`,
      animationDelay: `${delay}s`,
      ...style,
    }}>
      <div className={`note-mock${tag === "important" ? " imp" : ""}`}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
          <span style={{ fontSize: "12.5px", fontWeight: 600, color: tag === "important" ? "var(--accent)" : "var(--text)", lineHeight: 1.3 }}>
            {title}
          </span>
          {tag === "important" && (
            <span style={{
              fontSize: "9px", fontWeight: 600, background: "var(--accent-dim)",
              color: "var(--accent)", padding: "2px 7px", borderRadius: "20px",
              fontFamily: "'JetBrains Mono', monospace", flexShrink: 0, marginLeft: "8px",
            }}>
              important
            </span>
          )}
        </div>
        <p style={{ fontSize: "11px", color: "var(--text3)", lineHeight: 1.55 }}>{desc}</p>
        <div style={{
          marginTop: "10px", paddingTop: "9px",
          borderTop: `1px solid ${tag === "important" ? "var(--accent-dim)" : "var(--border)"}`,
          fontSize: "10px", color: "var(--text4)",
          fontFamily: "'JetBrains Mono', monospace",
        }}>#0{Math.floor(Math.random() * 9) + 1}0{Math.floor(Math.random() * 9) + 1}</div>
      </div>
    </div>
  );
}

/* ── Ticker strip ── */
function Ticker() {
  const items = ["Capture ideas", "Stay organised", "Mark what matters", "Search instantly", "Built for speed", "Simple by design"];
  const doubled = [...items, ...items];
  return (
    <div className="ticker-wrap" style={{ borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)", padding: "14px 0", overflow: "hidden" }}>
      <div className="ticker-inner">
        {doubled.map((item, i) => (
          <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: "16px", paddingRight: "48px" }}>
            <span style={{ fontSize: "12.5px", fontWeight: 500, color: "var(--text3)", letterSpacing: "0.04em", textTransform: "uppercase", fontFamily: "'JetBrains Mono', monospace" }}>
              {item}
            </span>
            <span style={{ color: "var(--accent)", fontSize: "14px" }}>✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/* ── Feature card ── */
function Feature({ icon, title, desc, delay }) {
  const ref = useReveal();
  return (
    <div ref={ref} className="reveal feature-card" style={{ transitionDelay: `${delay}ms` }}>
      <div style={{
        width: "40px", height: "40px", borderRadius: "11px",
        background: "var(--accent-dim)", border: "1px solid var(--accent-border)",
        display: "flex", alignItems: "center", justifyContent: "center",
        marginBottom: "18px",
      }}>
        {icon}
      </div>
      <h3 style={{ fontSize: "15px", fontWeight: 600, color: "var(--text)", marginBottom: "8px", letterSpacing: "-0.02em" }}>
        {title}
      </h3>
      <p style={{ fontSize: "13px", color: "var(--text3)", lineHeight: 1.65 }}>
        {desc}
      </p>
    </div>
  );
}

/* ── Main Landing Page ── */
export default function LandingPage() {
  const navigate = useNavigate();
  const heroRef = useReveal();
  const featRef = useReveal();
  const howRef = useReveal();
  const ctaRef = useReveal();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <>
      <style>{G}</style>

      {/* ── NAV ── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        padding: "0 40px",
        height: "60px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: scrolled ? "rgba(12,12,10,0.88)" : "transparent",
        backdropFilter: scrolled ? "blur(16px)" : "none",
        borderBottom: scrolled ? "1px solid #1a1a17" : "1px solid transparent",
        transition: "all 0.3s ease",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <LogoMark />
          <span style={{ fontSize: "15px", fontWeight: 600, color: "#e8e5de", letterSpacing: "-0.02em" }}>
            Notes
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
          <a href="#features" className="nav-link">Features</a>
          <a href="#how" className="nav-link">How it works</a>
          <button className="nav-link" onClick={() => navigate("/login")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "13.5px", fontWeight: 500 }}>
            Sign in
          </button>
          <button className="cta-primary" onClick={() => navigate("/register")} style={{ padding: "9px 20px", fontSize: "13px" }}>
            Sign up <ArrowRight />
          </button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{
        minHeight: "100vh",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        position: "relative", overflow: "hidden",
        paddingTop: "80px",
      }}>
        {/* Grid bg */}
        <div style={{
          position: "absolute", inset: 0, zIndex: 0,
          backgroundImage: `
            linear-gradient(var(--accent-dim) 1px, transparent 1px),
            linear-gradient(90deg, var(--accent-dim) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
          maskImage: "radial-gradient(ellipse 80% 60% at 50% 40%, black 30%, transparent 100%)",
        }} />

        {/* Radial glow */}
        <div style={{
          position: "absolute", top: "20%", left: "50%", transform: "translateX(-50%)",
          width: "600px", height: "300px",
          background: "radial-gradient(ellipse, var(--accent-dim) 0%, transparent 70%)",
          zIndex: 0, pointerEvents: "none",
        }} />

        {/* Floating cards — left */}
        <div style={{ position: "absolute", left: "4%", top: "20%", width: "230px", zIndex: 1 }}>
          <FloatingNote
            title="Ship landing page" desc="Polish copy and hero section before Monday demo."
            tag="important" delay={0} animation="floatA"
            style={{}}
          />
        </div>
        <div style={{ position: "absolute", left: "2%", top: "54%", width: "210px", zIndex: 1 }}>
          <FloatingNote
            title="Read clean code" desc="Chapter 4 — comments and formatting."
            tag="" delay={0.8} animation="floatB"
            style={{}}
          />
        </div>

        {/* Floating cards — right */}
        <div style={{ position: "absolute", right: "4%", top: "18%", width: "230px", zIndex: 1 }}>
          <FloatingNote
            title="API integration" desc="Connect Axios to GET /api/notes endpoint."
            tag="" delay={0.4} animation="floatC"
            style={{}}
          />
        </div>
        <div style={{ position: "absolute", right: "3%", top: "52%", width: "210px", zIndex: 1 }}>
          <FloatingNote
            title="CORS config" desc="Allow localhost:5173 in .NET policy."
            tag="important" delay={1.2} animation="floatA"
            style={{}}
          />
        </div>

        {/* Hero content */}
        <div
          ref={heroRef}
          className="reveal"
          style={{
            position: "relative", zIndex: 2,
            textAlign: "center",
            maxWidth: "680px",
            padding: "0 24px",
          }}
        >
          {/* Badge */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "7px",
            background: "var(--accent-bg)", border: "1px solid var(--accent-border)",
            borderRadius: "20px", padding: "6px 14px",
            marginBottom: "32px",
          }}>
            <StarBadge />
            <span style={{ fontSize: "12px", fontWeight: 500, color: "var(--accent)", fontFamily: "'JetBrains Mono', monospace" }}>
              Simple. Fast. Beautiful.
            </span>
          </div>

          {/* Headline */}
          <h1 style={{
            fontSize: "clamp(48px, 7vw, 76px)",
            fontFamily: "'Instrument Serif', serif",
            fontWeight: 400,
            color: "var(--text)",
            lineHeight: 1.08,
            letterSpacing: "-0.03em",
            marginBottom: "24px",
          }}>
            Your thoughts,{" "}
            <span style={{ color: "var(--accent)", fontStyle: "italic" }}>organised</span>
            <br />at last.
          </h1>

          {/* Sub */}
          <p style={{
            fontSize: "17px", fontWeight: 400,
            color: "var(--text3)", lineHeight: 1.7,
            marginBottom: "40px",
            maxWidth: "500px", margin: "0 auto 40px",
          }}>
            A clean, fast note-taking app. Add, search, and manage your notes with a UI that actually gets out of your way.
          </p>

          {/* CTA row */}
          <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
            <button className="cta-primary" onClick={() => navigate("/register")}>
              Start taking notes <ArrowRight />
            </button>
            <a href="#features" className="cta-ghost">
              See features
            </a>
          </div>

          {/* Trust line */}
          <div style={{
            marginTop: "48px",
            display: "flex", alignItems: "center", justifyContent: "center", gap: "20px",
            flexWrap: "wrap",
          }}>
            {["No account needed", "Instant sync", "Mark important"].map((t, i) => (
              <span key={i} style={{ display: "flex", alignItems: "center", gap: "7px", fontSize: "12.5px", color: "var(--text3)" }}>
                <CheckCircle /> {t}
              </span>
            ))}
          </div>
        </div>

        {/* Scroll cue */}
        <div style={{
          position: "absolute", bottom: "36px", left: "50%", transform: "translateX(-50%)",
          display: "flex", flexDirection: "column", alignItems: "center", gap: "8px",
          animation: "pulse 2s ease-in-out infinite", zIndex: 2,
        }}>
          <span style={{ fontSize: "11px", color: "var(--text4)", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.08em" }}>
            scroll
          </span>
          <div style={{ width: "1px", height: "28px", background: "var(--border2)" }} />
        </div>
      </section>

      {/* ── TICKER ── */}
      <Ticker />

      {/* ── FEATURES ── */}
      <section id="features" style={{ padding: "100px 40px", maxWidth: "1100px", margin: "0 auto" }}>
        <div ref={featRef} className="reveal" style={{ textAlign: "center", marginBottom: "64px" }}>
          <span style={{
            fontSize: "11px", fontWeight: 600, color: "var(--accent)",
            letterSpacing: "0.1em", textTransform: "uppercase",
            fontFamily: "'JetBrains Mono', monospace",
          }}>
            Features
          </span>
          <h2 style={{
            fontSize: "clamp(32px, 4vw, 48px)",
            fontFamily: "'Instrument Serif', serif",
            fontWeight: 400, color: "var(--text)",
            letterSpacing: "-0.025em", lineHeight: 1.15,
            marginTop: "12px",
          }}>
            Everything you need.<br />
            <span style={{ color: "var(--text3)" }}>Nothing you don't.</span>
          </h2>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "16px",
        }}>
          <Feature delay={0} icon={
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M3 5h12M3 9h8M3 13h5" stroke="var(--accent)" strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
          } title="Instant capture" desc="Add a note in seconds. Title, description, done. No friction, no folders, no fuss." />

          <Feature delay={80} icon={
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <circle cx="8" cy="8" r="6" stroke="var(--accent)" strokeWidth="1.6"/>
              <path d="M13 13l3 3" stroke="var(--accent)" strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
          } title="Smart search" desc="Filter your notes in real time as you type. Find anything instantly across all your content." />

          <Feature delay={160} icon={
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M9 2l1.8 3.6 4 .58-2.9 2.83.68 4L9 11.02 5.42 13 6.1 9l-2.9-2.83 4-.58L9 2z" stroke="var(--accent)" strokeWidth="1.5" strokeLinejoin="round"/>
            </svg>
          } title="Mark important" desc="Flag the notes that matter most. Filter by importance to surface your priorities fast." />

          <Feature delay={240} icon={
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <rect x="2" y="4" width="14" height="11" rx="2.5" stroke="var(--accent)" strokeWidth="1.6"/>
              <path d="M6 4V3a1 1 0 011-1h4a1 1 0 011 1v1" stroke="var(--accent)" strokeWidth="1.5"/>
              <path d="M6 9h6M6 12h4" stroke="var(--accent)" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
          } title="Full CRUD API" desc="Powered by a .NET 9 Web API with in-memory store. GET, POST, PUT, and DELETE — all ready." />

          <Feature delay={320} icon={
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <circle cx="9" cy="9" r="7" stroke="var(--accent)" strokeWidth="1.6"/>
              <path d="M9 6v3l2 2" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          } title="Live feedback" desc="Every action confirms itself. Toast notifications appear and vanish without getting in your way." />

          <Feature delay={400} icon={
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <rect x="2" y="3" width="6" height="6" rx="1.5" stroke="var(--accent)" strokeWidth="1.5"/>
              <rect x="10" y="3" width="6" height="6" rx="1.5" stroke="var(--accent)" strokeWidth="1.5"/>
              <rect x="2" y="11" width="6" height="6" rx="1.5" stroke="var(--accent)" strokeWidth="1.5"/>
              <rect x="10" y="11" width="6" height="6" rx="1.5" stroke="var(--accent)" strokeWidth="1.5" opacity="0.4"/>
            </svg>
          } title="Clean dashboard" desc="Stats strip, filter pills, responsive 2-col grid. Designed to feel premium, not over-engineered." />
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how" style={{
        padding: "80px 40px 100px",
        borderTop: "1px solid var(--border)",
        borderBottom: "1px solid var(--border)",
        background: "var(--bg2)",
      }}>
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <div ref={howRef} className="reveal" style={{ textAlign: "center", marginBottom: "64px" }}>
            <span style={{
              fontSize: "11px", fontWeight: 600, color: "var(--accent)",
              letterSpacing: "0.1em", textTransform: "uppercase",
              fontFamily: "'JetBrains Mono', monospace",
            }}>
              How it works
            </span>
            <h2 style={{
              fontSize: "clamp(30px, 4vw, 44px)",
              fontFamily: "'Instrument Serif', serif",
              fontWeight: 400, color: "var(--text)",
              letterSpacing: "-0.025em", lineHeight: 1.2,
              marginTop: "12px",
            }}>
              Three steps. No learning curve.
            </h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0", position: "relative" }}>
            {/* Connector line */}
            <div style={{
              position: "absolute", top: "32px", left: "calc(16.67% + 16px)", right: "calc(16.67% + 16px)",
              height: "1px", background: "linear-gradient(90deg, transparent, var(--accent-border), var(--accent-border), transparent)",
              zIndex: 0,
            }} />

            {[
              { num: "01", title: "Open the app", desc: "Hit the button. The interface loads instantly — no login, no onboarding walls." },
              { num: "02", title: "Write your note", desc: "Enter a title and description. Toggle important if it matters. Submit." },
              { num: "03", title: "Stay on top", desc: "Search, filter by importance, and delete what you no longer need." },
            ].map((step, i) => {
              const ref = useReveal();
              return (
                <div
                  key={i}
                  ref={ref}
                  className="reveal"
                  style={{
                    transitionDelay: `${i * 120}ms`,
                    padding: "0 32px",
                    position: "relative", zIndex: 1,
                    borderRight: i < 2 ? "1px solid var(--border)" : "none",
                    textAlign: "center",
                  }}
                >
                  <div style={{
                    width: "52px", height: "52px", borderRadius: "50%",
                    background: "var(--accent-bg)", border: "1px solid var(--accent-border)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    margin: "0 auto 24px",
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "13px", fontWeight: 500, color: "var(--accent)",
                  }}>
                    {step.num}
                  </div>
                  <h3 style={{ fontSize: "16px", fontWeight: 600, color: "var(--text)", marginBottom: "10px", letterSpacing: "-0.02em" }}>
                    {step.title}
                  </h3>
                  <p style={{ fontSize: "13px", color: "var(--text3)", lineHeight: 1.65 }}>
                    {step.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── PREVIEW STRIP ── */}
      <section style={{ padding: "100px 40px", maxWidth: "1100px", margin: "0 auto" }}>
        <div style={{
          background: "var(--bg)",
          border: "1px solid var(--border)",
          borderRadius: "24px",
          padding: "48px",
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: "14px",
          position: "relative",
          overflow: "hidden",
        }}>
          {/* Glow */}
          <div style={{
            position: "absolute", bottom: "-60px", left: "50%", transform: "translateX(-50%)",
            width: "400px", height: "200px",
            background: "radial-gradient(ellipse, var(--accent-dim) 0%, transparent 70%)",
            pointerEvents: "none",
          }} />

          {[
            { title: "Ship landing page", desc: "Polish copy and hero section before Monday demo.", imp: true },
            { title: "Read clean code", desc: "Chapter 4 on comments and formatting standards.", imp: false },
            { title: "API integration", desc: "Connect Axios to the .NET backend endpoints.", imp: false },
            { title: "CORS configuration", desc: "Allow localhost:5173 in the .NET CORS policy.", imp: true },
            { title: "Swagger docs", desc: "Enable SwaggerUI for all endpoints in Program.cs.", imp: false },
            { title: "Mobile breakpoints", desc: "Collapse sidebar on screens below 768px width.", imp: false },
          ].map((n, i) => (
            <div
              key={i}
              className="note-mock"
              style={n.imp ? {
                borderColor: "var(--accent-border)",
                background: "var(--accent-bg)",
                animationDelay: `${i * 0.15}s`,
                animation: "gridFade 0.5s ease both",
              } : {
                animationDelay: `${i * 0.15}s`,
                animation: "gridFade 0.5s ease both",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                <span style={{ fontSize: "12.5px", fontWeight: 600, color: n.imp ? "var(--accent)" : "var(--text)", lineHeight: 1.3, flex: 1 }}>
                  {n.title}
                </span>
                {n.imp && (
                  <span style={{
                    fontSize: "9px", fontWeight: 600, background: "var(--accent-dim)",
                    color: "var(--accent)", padding: "2px 7px", borderRadius: "20px",
                    fontFamily: "'JetBrains Mono', monospace", marginLeft: "8px", flexShrink: 0,
                  }}>
                    important
                  </span>
                )}
              </div>
              <p style={{ fontSize: "11.5px", color: "var(--text3)", lineHeight: 1.6 }}>{n.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA SECTION ── */}
      <section style={{
        padding: "80px 40px 120px",
        textAlign: "center",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", top: "0", left: "50%", transform: "translateX(-50%)",
          width: "1px", height: "80px",
          background: "linear-gradient(to bottom, transparent, var(--accent-border))",
        }} />
        <div ref={ctaRef} className="reveal">
          <h2 style={{
            fontSize: "clamp(36px, 5vw, 58px)",
            fontFamily: "'Instrument Serif', serif",
            fontWeight: 400, color: "var(--text)",
            letterSpacing: "-0.03em", lineHeight: 1.1,
            marginBottom: "20px",
          }}>
            Ready to clear<br />
            <span style={{ color: "var(--accent)", fontStyle: "italic" }}>your mind?</span>
          </h2>
          <p style={{ fontSize: "15px", color: "var(--text3)", marginBottom: "36px", lineHeight: 1.6 }}>
            Open the app and start capturing what matters.
          </p>
          <button className="cta-primary" onClick={() => navigate("/register")} style={{ fontSize: "15px", padding: "15px 32px" }}>
            Get started free <ArrowRight />
          </button>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{
        borderTop: "1px solid var(--border)",
        padding: "28px 40px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexWrap: "wrap", gap: "12px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <LogoMark />
          <span style={{ fontSize: "13.5px", fontWeight: 600, color: "var(--text2)", letterSpacing: "-0.02em" }}>Notes</span>
        </div>
        <div style={{ display: "flex", gap: "24px" }}>
          {["Features", "How it works"].map(l => (
            <a key={l} href={`#${l.toLowerCase().replace(" ","-")}`} className="nav-link" style={{ fontSize: "12.5px" }}>{l}</a>
          ))}
        </div>
        <span style={{ fontSize: "11.5px", color: "var(--text4)", fontFamily: "'JetBrains Mono', monospace" }}>
          built with React + .NET 9
        </span>
      </footer>
    </>
  );
}
