import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import "../styles/register.css";
import logo from "/logo.jpg";
import submitSfxFile from "/vortex_music.m4a";

export default function Register() {
  const canvasRef = useRef(null);
  const formWrapperRef = useRef(null);
  const vortexMessageRef = useRef(null);
  const submitSfxRef = useRef(null);
  const timeoutsRef = useRef([]);

  const navigate = useNavigate();

  const [sucked, setSucked] = useState(false);
  const [vortexVisible, setVortexVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");

  const [role, setRole] = useState("team_leader");
  const [authEmail, setAuthEmail] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);

  const [isVitChennai, setIsVitChennai] = useState("yes");
  const [eventHubId, setEventHubId] = useState("");
  const [universityName, setUniversityName] = useState("");
  const [teamCode, setTeamCode] = useState("");

  const stateRef = useRef({
    width: window.innerWidth,
    height: window.innerHeight,
    digits: [],
    ARMS: 10,
    POINTS_PER_ARM: 40,
    SPIRAL_TIGHTNESS: 0.28,
    baseSpeed: 0.00045,
    speedFactor: 1,
    targetSpeedFactor: 1,
    rotationAngle: 0,
    lastTime: 0,
  });

  useEffect(() => {
    if (role === "team_leader" && isVitChennai === "yes") {
      setEventHubId("");
      setUniversityName("");
    }
  }, [isVitChennai, role]);

  useEffect(() => {
    const storedIntent = sessionStorage.getItem("registerIntent");
    if (!storedIntent) return;

    try {
      const parsed = JSON.parse(storedIntent);
      if (parsed?.role === "team_leader" || parsed?.role === "team_member") {
        setRole(parsed.role);
      }
      if (parsed?.email) {
        setAuthEmail(parsed.email);
      }
    } catch (error) {
      console.warn("Invalid register intent payload");
      sessionStorage.removeItem("registerIntent");
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const s = stateRef.current;

    function randomBinary() {
      return Math.random() < 0.5 ? "0" : "1";
    }

    function initDigits() {
      s.digits.length = 0;
      const maxRadius = Math.min(s.width, s.height) * 0.9;
      const minRadius = maxRadius * 0.06;

      for (let arm = 0; arm < s.ARMS; arm++) {
        const armOffset = (Math.PI * 2 * arm) / s.ARMS;
        for (let i = 0; i < s.POINTS_PER_ARM; i++) {
          const t = i / (s.POINTS_PER_ARM - 1);
          const radius = minRadius + t * maxRadius;
          const angle = armOffset + radius * s.SPIRAL_TIGHTNESS;
          const depth = t;
          const jitter = (Math.random() - 0.5) * 8;

          s.digits.push({
            char: randomBinary(),
            baseRadius: radius + jitter,
            baseAngle: angle + (Math.random() - 0.5) * 0.06,
            depth,
            size: 9 + depth * 20,
            baseOpacity: 0.28 + (1 - Math.pow(depth, 0.5)) * 0.85,
            paletteIndex: Math.floor(Math.random() * 3),
          });
        }
      }
    }

    function resize() {
      s.width = canvas.width = window.innerWidth;
      s.height = canvas.height = window.innerHeight;
      initDigits();
    }

    resize();
    window.addEventListener("resize", resize);

    let rafId;
    function draw(ts) {
      if (!s.lastTime) s.lastTime = ts;
      const dt = ts - s.lastTime;
      s.lastTime = ts;

      s.speedFactor += (s.targetSpeedFactor - s.speedFactor) * 0.04;
      s.rotationAngle += s.baseSpeed * s.speedFactor * dt;

      const cx = s.width / 2;
      const cy = s.height / 2;

      ctx.fillStyle = "rgba(2, 6, 23, 0.18)";
      ctx.fillRect(0, 0, s.width, s.height);

      s.digits.forEach((d) => {
        const pulse = Math.sin(ts * 0.0005 + d.baseRadius * 0.008) * 6;
        const radius = d.baseRadius + pulse;
        const angle = d.baseAngle + s.rotationAngle * (0.7 + 0.6 * (1 - d.depth));

        const x = cx + Math.cos(angle) * radius;
        const y = cy + Math.sin(angle) * radius;

        ctx.save();
        ctx.translate(x, y);

        const perspectiveScale = 0.75 + (1 - d.depth) * 0.6;
        ctx.scale(1, perspectiveScale);
        ctx.rotate(angle + Math.PI / 2);

        const flicker = 0.9 + Math.sin(ts * 0.006 + d.baseRadius * 0.02) * 0.18;
        const opacity = d.baseOpacity * flicker;

        const hue = d.paletteIndex === 0 ? 190 : d.paletteIndex === 1 ? 325 : 283;
        const light = 55 + (1 - d.depth) * 14;

        ctx.font = `${d.size}px monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        ctx.shadowColor = `hsla(${hue}, 100%, 65%, ${opacity})`;
        ctx.shadowBlur = 12 * (1 - d.depth);

        ctx.fillStyle = `hsla(${hue}, 100%, ${light}%, ${opacity})`;
        ctx.fillText(d.char, 0, 0);
        ctx.restore();

        if (Math.random() < 0.0025) d.char = randomBinary();
      });

      rafId = requestAnimationFrame(draw);
    }

    ctx.fillStyle = "#020617";
    ctx.fillRect(0, 0, s.width, s.height);
    rafId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  const handleStartRegistration = async (e) => {
    e.preventDefault();

    if (sendingOtp) return;

    const trimmedEmail = authEmail.trim();
    if (!trimmedEmail) {
      alert("Please enter your email to continue.");
      return;
    }

    setSendingOtp(true);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: trimmedEmail,
        options: {
          shouldCreateUser: true,
        },
      });

      if (error) throw error;

      sessionStorage.setItem("loginEmail", trimmedEmail);
      sessionStorage.setItem("authFlow", "register");
      sessionStorage.setItem(
        "registerIntent",
        JSON.stringify({ email: trimmedEmail })
      );

      navigate("/otp");
    } catch (error) {
      console.error("OTP dispatch error:", error);
      alert(`❌ Failed to send OTP: ${error?.message || "Please try again."}`);
    } finally {
      setSendingOtp(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSubmitting) return;

    timeoutsRef.current.forEach((id) => clearTimeout(id));
    timeoutsRef.current = [];

    const formData = new FormData(e.target);
    const leaderName = formData.get("leaderName");
    const leaderReg = formData.get("leaderReg");
    const leaderEmail = formData.get("leaderEmail");
    const receiptLink = formData.get("receiptLink");

    if (isVitChennai === "no" && !String(eventHubId || "").trim()) {
      alert("Please enter your VIT EventHub Unique ID.");
      return;
    }

    if (!receiptLink || !receiptLink.trim()) {
      alert("⚠️ Please provide a payment receipt link.");
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage("⚡ Registering team leader...");

    try {
      setSubmitMessage("🔥 Creating your account...");
      const { data, error } = await supabase.functions.invoke("register-team", {
        body: {
          isVitChennai,
          eventHubId: isVitChennai === "no" ? eventHubId : null,
          leaderName,
          leaderReg: isVitChennai === "yes" ? leaderReg : null,
          leaderEmail,
          receiptLink,
        },
      });

      if (error) {
        const errorMsg = error.message || error.error || "Registration failed";
        throw new Error(errorMsg);
      }
      
      // Check for errors in the response data
      if (data?.error) {
        throw new Error(data.error);
      }

      setSubmitMessage("✅ REGISTRATION SUCCESSFUL! Redirecting to login...");

      if (submitSfxRef.current) {
        submitSfxRef.current.currentTime = 0;
        submitSfxRef.current.play().catch(() => {});
      }

      stateRef.current.targetSpeedFactor = 28;
      setSucked(true);

      const showDelay = 2200;
      const visibleDuration = 6000;

      const t1 = setTimeout(() => setVortexVisible(true), showDelay);
      const t2 = setTimeout(() => {
        setVortexVisible(false);
        setSucked(false);
      }, showDelay + visibleDuration);
      const t3 = setTimeout(() => navigate("/login"), showDelay + visibleDuration + 250);

      timeoutsRef.current.push(t1, t2, t3);
    } catch (error) {
      console.error("Registration error:", error);
      setIsSubmitting(false);
      setSubmitMessage("");
      alert("❌ Registration failed. Please try again.");
    }
  };

  useEffect(() => {
    submitSfxRef.current = new Audio(submitSfxFile);
    submitSfxRef.current.preload = "auto";
    submitSfxRef.current.volume = 0.95;

    return () => {
      try {
        submitSfxRef.current.pause();
      } catch (e) {
        // Ignore errors on cleanup
      }
    };
  }, []);

  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach((id) => clearTimeout(id));
      timeoutsRef.current = [];
    };
  }, []);

  return (
    <>
      <canvas id="vortexCanvas" ref={canvasRef} />
      <div className="bg-overlay" />

      <div className={`form-wrapper${sucked ? " sucked" : ""}`} ref={formWrapperRef}>
        <div className="shell">
          <aside className="panel">
            <div className="panel-header">
              <div className="logo-placeholder">
                <img src={logo} alt="V-VORTEX logo" className="logo-img" />
              </div>
              <div className="tagline">Team Leader Registration</div>
              <div className="title">V-VORTEX</div>
              <p className="subtitle">
                Register as a team leader to begin your journey. After registration, you'll build your team by adding 1-4 members in your dashboard.
              </p>
            </div>

            <ul className="bullet-list">
              <li>Step 1: Register as team leader</li>
              <li>Step 2: Login to your dashboard</li>
              <li>Step 3: Build your team with 2-5 total members</li>
            </ul>
          </aside>

          <section className="panel">
            <form id="teamForm" onSubmit={handleSubmit}>
              <div className="section-label">🛡️ Team Leader Registration</div>
              
              <p className="hint" style={{ marginBottom: '1.5rem', fontSize: '0.9rem', color: '#e879f9', lineHeight: '1.5' }}>
                Register as a team leader first. After logging in, you'll be able to build your team by adding 1-4 members (2-5 total including yourself).
              </p>

              <div className="field">
                <label>Are you from VIT Chennai?</label>

                <div className={`toggle-group${isVitChennai === "no" ? " no-selected" : ""}`} id="vitToggleGroup">
                  <div className="toggle-slider" />

                  <label className="toggle-option">
                    <input
                      type="radio"
                      name="isVitChennai"
                      value="yes"
                      checked={isVitChennai === "yes"}
                      onChange={() => setIsVitChennai("yes")}
                    />
                    <span className="toggle-label">
                      <span className="toggle-icon">✓</span>
                      Yes, VIT Chennai
                    </span>
                  </label>

                  <label className="toggle-option">
                    <input
                      type="radio"
                      name="isVitChennai"
                      value="no"
                      checked={isVitChennai === "no"}
                      onChange={() => setIsVitChennai("no")}
                    />
                    <span className="toggle-label">
                      <span className="toggle-icon">✕</span>
                      No, Other College
                    </span>
                  </label>
                </div>
              </div>

              {isVitChennai === "no" && (
                <div className="field college-field" id="collegeField">
                  <label htmlFor="eventHubId">VIT EventHub Unique ID</label>
                  <input
                    id="eventHubId"
                    name="eventHubId"
                    type="text"
                    className="input-base"
                    placeholder="Enter your EventHub Unique ID"
                    required
                    value={eventHubId}
                    onChange={(e) => setEventHubId(e.target.value)}
                  />
                </div>
              )}

              <div className="section-label" style={{ marginTop: "1.2rem" }}>
                👤 Your Details
              </div>

              <div className="field-row">
                <div className="field">
                  <label htmlFor="leaderName">Your Name</label>
                  <input
                    id="leaderName"
                    name="leaderName"
                    type="text"
                    className="input-base"
                    placeholder="Enter your full name"
                    required
                  />
                </div>
                {isVitChennai === "yes" && (
                  <div className="field">
                    <label htmlFor="leaderReg">Registration Number</label>
                    <input
                      id="leaderReg"
                      name="leaderReg"
                      type="text"
                      className="input-base"
                      placeholder="Your VIT registration number"
                      required={isVitChennai === "yes"}
                    />
                  </div>
                )}
              </div>

              <div className="field">
                <label htmlFor="leaderEmail">Email Address</label>
                <input
                  id="leaderEmail"
                  name="leaderEmail"
                  type="email"
                  className="input-base"
                  placeholder="your.email@example.com"
                  required
                />
              </div>

              <div className="field">
                <label htmlFor="receiptLink">⚡ Payment Receipt Link</label>
                <input
                  id="receiptLink"
                  name="receiptLink"
                  type="url"
                  className="input-base"
                  placeholder="https://drive.google.com/file/..."
                  required
                />
                <p className="hint" style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#00ffff' }}>
                  Upload your payment receipt to Google Drive and share the link with view access.
                </p>
              </div>

              {isSubmitting && (
                <div className="submit-message" style={{
                  textAlign: 'center',
                  padding: '1rem',
                  marginBottom: '1rem',
                  background: 'rgba(0, 255, 255, 0.1)',
                  border: '1px solid rgba(0, 255, 255, 0.3)',
                  borderRadius: '8px',
                  color: '#00ffff',
                  fontSize: '0.95rem',
                  fontWeight: '500'
                }}>
                  {submitMessage}
                </div>
              )}

              <button type="submit" className="submit-btn" disabled={isSubmitting} style={{
                opacity: isSubmitting ? 0.6 : 1,
                cursor: isSubmitting ? 'not-allowed' : 'pointer'
              }}>
                {isSubmitting ? '⚡ REGISTERING...' : '⚔️ REGISTER AS TEAM LEADER'}
              </button>
            </form>
          </section>
        </div>
      </div>

      <div
        className={`vortex-message${vortexVisible ? " visible" : ""}`}
        id="vortexMessage"
        ref={vortexMessageRef}
      >
        <div className="vortex-message-inner">
          <h2>🔥 TEAM LEADER REGISTERED 🔥</h2>
          <p>
            You've successfully registered as a <strong>TEAM LEADER</strong>. Login to your dashboard and use the <strong>"Build Your Team"</strong> feature to add your team members and complete your squad formation.
          </p>
        </div>
      </div>
    </>
  );
}
