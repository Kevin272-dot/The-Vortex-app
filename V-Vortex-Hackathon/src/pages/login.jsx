import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import "../styles/login.css";
import logo from "/logo.jpg";

export default function Login({ setTransition }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Team Leader");
  const [showModal, setShowModal] = useState(false);
  const [notFoundInfo, setNotFoundInfo] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  const modalRef = useRef(null);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleModalOk = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setShowModal(false);
    navigate("/otp");
  };

  const handleModalCancel = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setShowModal(false);
  };

  useEffect(() => {
    if (!showModal) return;
    const onKey = (ev) => {
      if (ev.key === "Escape") {
        setShowModal(false);
      } else if (ev.key === "Enter") {
        handleModalOk(ev);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showModal, handleModalOk]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // 1. Verify email exists (different checks for leader vs member)
      let team = null;
      const trimmedEmail = email.trim();

      if (role === "Team Leader") {
        const { data: t, error: teamError } = await supabase
          .from('teams')
          .select('id, team_name, lead_email')
          .ilike('lead_email', trimmedEmail)
          .single();

        if (teamError || !t) {
          setNotFoundInfo({
            type: 'leader',
            email: trimmedEmail,
            message: 'Team leader account not found. You can register as a Team Leader or verify your email with your team leader.'
          });
          return;
        }

        team = t;
      } else {
        // Team Member login - verify member exists
        const { data: member, error: memberError } = await supabase
          .from('team_members')
          .select('team_id')
          .ilike('member_email', trimmedEmail)
          .single();

        if (memberError || !member) {
          setNotFoundInfo({
            type: 'member',
            email: trimmedEmail,
            message: 'Member account not found. Ask your team leader to add your email to their team, or register as a Team Leader.'
          });
          return;
        }

        const { data: t, error: teamError2 } = await supabase
          .from('teams')
          .select('id, team_name')
          .eq('id', member.team_id)
          .single();

        if (teamError2 || !t) {
          alert('❌ Team not found for this member.');
          return;
        }

        team = t;
      }

      // 2. Send OTP to email using Supabase Auth
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: email,
        options: {
          shouldCreateUser: true,
        }
      });

      if (otpError) {
        alert(`❌ Failed to send OTP: ${otpError.message}`);
        return;
      }

      // 3. Store email and role in sessionStorage for OTP verification page
      sessionStorage.setItem('loginEmail', email);
      sessionStorage.setItem('teamId', team.id);
      sessionStorage.setItem('role', role);
      
      // 4. Show success modal
      setShowModal(true);
    } catch (error) {
      console.error('Login error:', error);
      alert('❌ An error occurred. Please try again.');
    }
  };

  useEffect(() => {
    const el = document.getElementById("system-time");
    if (!el) return;

    const update = () => {
      const now = new Date();
      el.textContent = now.toLocaleTimeString("en-GB", { hour12: false });
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {/* TOP MARQUEE - FIXED */}
      <div className="marquee-bar">
        <div className="marquee-track">
          <span>
            ⚡ 24 HOURS TO LEGENDARY STATUS • CODE LIKE YOUR DREAMS DEPEND ON IT • BUILD THE IMPOSSIBLE • SLEEP IS FOR THE WEAK • YOUR SQUAD, YOUR LEGACY • BREAK LIMITS, NOT RULES • INNOVATION NEVER SLEEPS •
          </span>
          <span aria-hidden="true">
            ⚡ 24 HOURS TO LEGENDARY STATUS • CODE LIKE YOUR DREAMS DEPEND ON IT • BUILD THE IMPOSSIBLE • SLEEP IS FOR THE WEAK • YOUR SQUAD, YOUR LEGACY • BREAK LIMITS, NOT RULES • INNOVATION NEVER SLEEPS •
          </span>
        </div>
      </div>

      <div className={`loginWrapper ${isMobile ? 'mobile' : ''}`}>
        {/* LOGIN BOX */}
        <div className="terminalBox">
          {/* HEADER */}
          <div className="terminalHeader">
            <div className="headerLeft">
              <img src={logo} className="headerLogo" alt="V-VORTEX logo" />
              <span className="title">V-VORTEX</span>
            </div>

            <div className="headerDots">
              <div className="dot d1"></div>
              <div className="dot d2"></div>
              <div className="dot d3"></div>
            </div>
          </div>

          <div className="sectionSubtitle">
            ⟨ WARRIORS ASSEMBLE • THE ARENA AWAITS ⟩
          </div>

          {/* FORM */}
          <form onSubmit={handleSubmit}>
            {notFoundInfo && (
              <div className="notfound-box glass" style={{ marginBottom: '12px', padding: '10px' }}>
                <strong>Notice:</strong>
                <p style={{ margin: '6px 0' }}>{notFoundInfo.message}</p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    className="submitBtn"
                    onClick={() => {
                      // Pre-fill register intent and navigate to registration page
                      try { if (setTransition) setTransition(null); } catch (e) {}
                      sessionStorage.setItem('registerIntent', JSON.stringify({ role: 'team_leader', email: notFoundInfo.email }));
                      setNotFoundInfo(null);
                      navigate('/register');
                    }}
                  >
                    Register as Team Leader
                  </button>
                  <button
                    type="button"
                    className="submitBtn"
                    onClick={() => { navigator.clipboard?.writeText(notFoundInfo.email); alert('Email copied to clipboard'); }}
                  >
                    Copy Email
                  </button>
                </div>
              </div>
            )}
            <label className="fieldLabel">▸ WARRIOR CLASS</label>
            <select
              className="inputField"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              required
            >
              <option value="Team Leader">Team Leader</option>
              <option value="Team Member">Team Member</option>
            </select>
            <p className="helper">– Your designation in the squad</p>

            <label className="fieldLabel">
              {role === "Team Leader" ? "▸ TEAM LEADER EMAIL ID" : "▸ MEMBER EMAIL ID"}
            </label>
            <input
              className="inputField"
              type="email"
              placeholder="champion@institute.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
            <p className="helper">– Your official battle credentials</p>

            <button className="submitBtn" type="submit">
              <span>⚡ ENTER THE ARENA • SEND BATTLE CODE ⚡</span>
            </button>
          </form>
        </div>
      </div>

      {/* STATUS BAR - FIXED BOTTOM */}
      <div className="statusBar">
        <div className="statusItem">
          <div className="statusDot"></div>
          <span>ARENA STATUS: LIVE & ELECTRIC</span>
        </div>
        <div className="statusItem">
          <span>SYSTEM TIME: <span id="system-time"></span></span>
        </div>
        <div className="statusItem">
          <span>LEGENDS IN THE MAKING: LOADING…</span>
        </div>
      </div>

      {/* MODAL */}
      {showModal && (
        <div
          className="mobile-modal-overlay"
          onClick={() => setShowModal(false)}
        >
          <div
            className="mobile-modal-content"
            onClick={(e) => e.stopPropagation()}
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modalVerifyTitle"
          >
            <h2 id="modalVerifyTitle" className="modal-title">Verify</h2>
            <p className="modal-text">
              A battle code has been dispatched. Click OK to enter the auth gate.
            </p>
            <div className="modal-buttons">
              <button
                type="button"
                className="authBtn primary"
                onClick={handleModalOk}
              >
                <span>OK</span>
              </button>
              <button
                type="button"
                className="authBtn secondary"
                onClick={handleModalCancel}
              >
                <span>Cancel</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
