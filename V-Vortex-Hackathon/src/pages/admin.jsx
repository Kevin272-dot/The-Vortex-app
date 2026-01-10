import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import "../styles/admin.css";
import "../styles/admin_mobile_fix.css";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [unauthorized, setUnauthorized] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [exporting, setExporting] = useState(false);
  const [teams, setTeams] = useState([]);
  const [teamQuery, setTeamQuery] = useState('');
  const [domainFilter, setDomainFilter] = useState('');
  const [leaderboard, setLeaderboard] = useState([]);
  const [lbLoading, setLbLoading] = useState(false);
  const [leaderboardPublic, setLeaderboardPublic] = useState(false);
  const [lbToggleLoading, setLbToggleLoading] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [review1Open, setReview1Open] = useState(false);
  const [review1Scores, setReview1Scores] = useState({});
  const [review2Open, setReview2Open] = useState(false);
  const [review2Scores, setReview2Scores] = useState({});
  const [review3Open, setReview3Open] = useState(false);
  const [review3Scores, setReview3Scores] = useState({});
  const [ideaOpen, setIdeaOpen] = useState(false);
  const [ideaScores, setIdeaScores] = useState({});
  const [pitchOpen, setPitchOpen] = useState(false);
  const [pitchScores, setPitchScores] = useState({});
  const [scoringOpen, setScoringOpen] = useState(false);
  // Slider maximums are fixed constants and must not be edited from the admin UI.
  const SLIDER_MAX = {
    idea: { requirement_check: 20, solution_logic: 15, feasibility: 15 },
    review1: { architecture_flow: 20, current_progress: 20, qa_defense: 10 },
    review2: { mvp_functionality: 25, ui_usability: 15, code_quality: 10 },
    review3: { final_demo: 40, innovation: 30, business_impact: 30 },
    pitch: { pitch_vortex: 100 }
  };

  useEffect(() => {
    const checkAdmin = async () => {
      setChecking(true);
      setUnauthorized(false);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const { data: { session } } = await supabase.auth.getSession();

        if (!user || !session) {
          // not signed in -> show login form
          setIsAdmin(false);
          setChecking(false);
          return;
        }

        const role = user?.app_metadata?.role;
        if (role === "admin") {
          setIsAdmin(true);
        } else {
          setUnauthorized(true);
          setIsAdmin(false);
        }
      } catch (err) {
        console.error("admin check error:", err);
      } finally {
        setChecking(false);
      }
    };

    checkAdmin();
  }, [navigate]);

  // Load teams when admin is confirmed
  useEffect(() => {
    if (!isAdmin) return;
    const loadTeams = async () => {
      try {
        const { data, error } = await supabase
          .from('teams')
          .select('id, team_name, lead_name, lead_email, domain, problem_statement, team_members(member_name)')
          .order('team_name', { ascending: true });
        if (error) throw error;
        setTeams(data || []);
      } catch (err) {
        console.error('Failed to load teams for admin:', err);
        setTeams([]);
      }
    };

    loadTeams();
  }, [isAdmin]);

  

  // Helper to refresh leaderboard from the DB
  const refreshLeaderboard = async () => {
    setLbLoading(true);
    try {
      // Try secure RPC function first, fallback to direct view access
      let data, error;
      ({ data, error } = await supabase.rpc('get_leaderboard_secure'));
      
      // If RPC fails (function doesn't exist or error), fallback to direct view
      if (error) {
        console.warn('RPC failed, trying direct view access:', error.message);
        ({ data, error } = await supabase.from('leaderboard_view').select('*').order('position', { ascending: true }));
      }
      
      if (error) throw error;
      setLeaderboard(data || []);
    } catch (err) {
      console.error('Failed to refresh leaderboard:', err);
      setLeaderboard([]);
    } finally {
      setLbLoading(false);
    }
  };

// ...existing code...

  // Load leaderboard when admin is confirmed
  useEffect(() => {
    if (!isAdmin) return;
    refreshLeaderboard();
  }, [isAdmin]);

  // Load leaderboard visibility setting
  useEffect(() => {
    if (!isAdmin) return;
    const loadSetting = async () => {
      try {
        const { data, error } = await supabase.from('app_settings').select('leaderboard_public').eq('id', 'main').single();
        if (!error && data) setLeaderboardPublic(!!data.leaderboard_public);
      } catch (err) {
        console.error('Failed to load leaderboard visibility setting:', err);
      }
    };
    loadSetting();
  }, [isAdmin]);

  // Toggle leaderboard visibility
  const toggleLeaderboardPublic = async () => {
    setLbToggleLoading(true);
    try {
      const newVal = !leaderboardPublic;
      const { error } = await supabase.from('app_settings').update({ leaderboard_public: newVal, updated_at: new Date().toISOString() }).eq('id', 'main');
      if (error) throw error;
      setLeaderboardPublic(newVal);
    } catch (err) {
      console.error('Failed to toggle leaderboard visibility:', err);
      alert('Failed to update setting: ' + (err.message || err));
    } finally {
      setLbToggleLoading(false);
    }
  };

  // Sign in handler for admin access via URL only (no button on main pages)
  const handleSignIn = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError("");
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setAuthError(error.message || "Sign-in failed");
        setAuthLoading(false);
        return;
      }

      // Re-check session/role
      const { data: { session } } = await supabase.auth.getSession();
      const role = session?.user?.app_metadata?.role;
      if (role === "admin") {
        setIsAdmin(true);
        setUnauthorized(false);
      } else {
        setUnauthorized(true);
      }
    } catch (err) {
      console.error(err);
      setAuthError("Unexpected error during sign-in");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setIsAdmin(false);
    navigate("/");
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      // Lazy-load exceljs to avoid adding it to the main bundle
      const ExcelJS = (await import('exceljs')).default;
      // Fetch teams with their members (exclude ids)
      const { data, error } = await supabase
        .from('teams')
        .select('team_name, team_size, lead_name, lead_email, lead_reg_no, is_vit_chennai, institution, receipt_link, team_members(member_name, member_reg_no, member_email, institution)');

      if (error) throw error;

      // Build XLSX rows (one row per member; if no members, include single row with empty member fields)
      const header = [
        'Team Name', 'Team Size',
        'Lead Name', 'Lead Email', 'Lead Reg No', 'Lead Is VIT Chennai',
        'Team Institution', 'Payment Link',
        'Member Name', 'Member Email', 'Member Reg No', 'Member Is VIT Chennai'
      ];

      const rows = [];
      (data || []).forEach(team => {
        const leadIsVit = !!team.is_vit_chennai || !!team.lead_reg_no;
        const members = team.team_members || [];
        if (members.length === 0) {
          rows.push([
            team.team_name || '', team.team_size || '',
            team.lead_name || '', team.lead_email || '', team.lead_reg_no || '', leadIsVit,
              team.institution || '', team.receipt_link || '', '', '', ''
          ]);
        } else {
          members.forEach(m => {
            const memberIsVit = (m.institution === 'VIT Chennai') || !!m.member_reg_no;
            rows.push([
              team.team_name || '', team.team_size || '',
              team.lead_name || '', team.lead_email || '', team.lead_reg_no || '', leadIsVit,
                team.institution || '', team.receipt_link || '', m.member_name || '', m.member_email || '', m.member_reg_no || '', !!memberIsVit
            ]);
          });
        }
      });

      // Use ExcelJS to generate the workbook in-memory
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Teams');
      worksheet.addRow(header);
      rows.forEach(r => worksheet.addRow(r));

      // Turn Payment Link column into clickable hyperlinks (column 8 after adding Team Institution)
      const paymentCol = 8;
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // skip header
        const cell = row.getCell(paymentCol);
        const val = cell.value;
        if (typeof val === 'string' && val.trim()) {
          cell.value = { text: val, hyperlink: val };
          cell.font = { color: { argb: 'FF0000FF' }, underline: true };
        }
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const now = new Date().toISOString().slice(0,10);
      a.download = `teams_export_${now}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export error', err);
      alert('Failed to export teams: ' + (err.message || err));
    } finally {
      setExporting(false);
    }
  };

  const handleReview1Change = (teamId, key, value) => {
    setReview1Scores(prev => {
      const teamScores = prev[teamId] || { architecture_flow:0, current_progress:0, qa_defense:0, review_1_total:0 };
      const updated = { ...teamScores, [key]: Number(value) };
      const total = (Number(updated.architecture_flow||0) + Number(updated.current_progress||0) + Number(updated.qa_defense||0));
      return { ...prev, [teamId]: { ...updated, review_1_total: total } };
    });
  };

  const handleReview2Change = (teamId, key, value) => {
    setReview2Scores(prev => {
      const teamScores = prev[teamId] || { mvp_functionality:0, ui_usability:0, code_quality:0, review_2_total:0 };
      const updated = { ...teamScores, [key]: Number(value) };
      const total = (Number(updated.mvp_functionality||0) + Number(updated.ui_usability||0) + Number(updated.code_quality||0));
      return { ...prev, [teamId]: { ...updated, review_2_total: total } };
    });
  };

  const closeReview2 = () => setReview2Open(false);

  const handleReview3Change = (teamId, key, value) => {
    setReview3Scores(prev => {
      const teamScores = prev[teamId] || { final_demo:0, innovation:0, business_impact:0, review_3_total:0 };
      const updated = { ...teamScores, [key]: Number(value) };
      const total = (Number(updated.final_demo||0) + Number(updated.innovation||0) + Number(updated.business_impact||0));
      return { ...prev, [teamId]: { ...updated, review_3_total: total } };
    });
  };

  const closeReview3 = () => setReview3Open(false);

  const handleIdeaChange = (teamId, key, value) => {
    setIdeaScores(prev => {
      const teamScores = prev[teamId] || { requirement_check:0, solution_logic:0, feasibility:0, idea_total:0 };
      const updated = { ...teamScores, [key]: Number(value) };
      const total = (Number(updated.requirement_check||0) + Number(updated.solution_logic||0) + Number(updated.feasibility||0));
      return { ...prev, [teamId]: { ...updated, idea_total: total } };
    });
  };

  const closeIdea = () => setIdeaOpen(false);

  const closeReview1 = () => setReview1Open(false);

  if (checking) return <div className="adminWrapper"><p style={{paddingTop:80}}>Checking credentials…</p></div>;

  if (!isAdmin) {
    // If unauthorized user signed in
    if (unauthorized) {
      return (
        <div className="adminWrapper">
          <nav className="adminNav">
            <div className="adminLeft">
              <img src="/logo.jpg" className="adminLogo" alt="Logo" />
              <span className="adminTitle">ADMIN CONTROL PANEL</span>
            </div>

            <div className="adminRight">
              <button className="logoutBtn" onClick={handleSignOut}>
                Logout
              </button>
            </div>
          </nav>

          <div style={{paddingTop:120, textAlign:'center'}}>
            <h2>Access Denied</h2>
            <p>You are signed in but do not have admin permissions.</p>
          </div>
        </div>
      );
    }

    // Not signed in -> show login form (admins must access via URL)
    return (
      <div className="adminWrapper">
        <nav className="adminNav">
          <div className="adminLeft">
            <img src="/logo.jpg" className="adminLogo" alt="Logo" />
            <span className="adminTitle">ADMIN CONTROL PANEL</span>
          </div>

          <div className="adminRight">
          </div>
        </nav>

        <div style={{maxWidth:420, margin:'140px auto 0', padding:20, background:'rgba(0,0,0,0.5)', borderRadius:8}}>
          <h3 style={{color:'#00ffae'}}>Admin Login</h3>
          <form onSubmit={handleSignIn}>
            <div style={{marginBottom:10}}>
              <label style={{display:'block', color:'#cfffec'}}>Email</label>
              <input value={email} onChange={(e)=>setEmail(e.target.value)} type="email" required style={{width:'100%', padding:8, borderRadius:6}} />
            </div>
            <div style={{marginBottom:10}}>
              <label style={{display:'block', color:'#cfffec'}}>Password</label>
              <input value={password} onChange={(e)=>setPassword(e.target.value)} type="password" required style={{width:'100%', padding:8, borderRadius:6}} />
            </div>
            {authError && <div style={{color:'salmon', marginBottom:10}}>{authError}</div>}
            <button className="logoutBtn" type="submit" disabled={authLoading} style={{background:'#00ff9d'}}>
              {authLoading ? 'Signing in…' : 'Sign in as Admin'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // isAdmin === true -> render dashboard
  return (
    <div className="adminWrapper">

      {/* TOP NAVBAR */}
      <nav className="adminNav">
        <div className="adminLeft">
          <img src="/logo.jpg" className="adminLogo" alt="Logo" />
          <span className="adminTitle">ADMIN CONTROL PANEL</span>
        </div>

        <div className="adminRight">
          <button className="logoutBtn" onClick={handleExport} disabled={exporting} style={{marginRight:10}}>
            {exporting ? 'Exporting…' : 'Export Teams'}
          </button>
          <button className="logoutBtn" onClick={() => navigate("/")}> 
            Logout
          </button>
        </div>
      </nav>

      {/* MAIN GRID */}
      <div className="adminGrid">

        <div className="adminCard">
          <h2>Active Users</h2>
          <p className="metric">128</p>
        </div>

        <div className="adminCard">
          <h2>Pending Requests</h2>
          <p className="metric yellow">7</p>
        </div>

        <div className="adminCard">
          <h2>System Health</h2>
          <p className="metric green">Optimal</p>
        </div>

        <div className="adminCard">
          <h2>Security Alerts</h2>
          <p className="metric red">0</p>
        </div>

        <div className="adminCard">
          <h2>Scoring Settings</h2>
          <p style={{marginTop:8}}>
            Configure per-slider maximums used by all scoring panels.
          </p>
          <div style={{marginTop:8}}>
            <button className="logoutBtn" onClick={() => setScoringOpen(true)}>Edit Slider Maxes</button>
          </div>
        </div>

      </div>

      {/* LARGE PANEL BELOW */}
      <div className="adminPanel" style={{display:'flex', gap:20, alignItems:'flex-start'}}>
        <div style={{flex:'0 0 320px'}}>
          <h2 className="panelTitle">Teams <span style={{fontSize:12, color:'#9ca3af', marginLeft:8}}>{teams.length} total</span></h2>
          <div style={{marginBottom:8, display:'flex', gap:8, alignItems:'center'}}>
            <input
              aria-label="Search teams by name"
              placeholder="Search team name..."
              value={teamQuery}
              onChange={(e) => setTeamQuery(e.target.value)}
              style={{flex:1, padding:8, borderRadius:6, border:'1px solid rgba(255,255,255,0.06)'}}
            />
            <div style={{display:'flex', gap:8, alignItems:'center'}}>
              <select value={domainFilter} onChange={(e) => setDomainFilter(e.target.value)} style={{padding:8, borderRadius:6, background:'#071018', color:'#e6fffa', border:'1px solid rgba(255,255,255,0.04)'}}>
                <option value=''>All domains</option>
                <option value='null'>(No domain)</option>
                {
                  (() => {
                    // Prioritise these domains but only enable them if teams exist for that domain
                    const desired = ['AI','IoT','Healthcare','Cybersecurity'];
                    const discovered = Array.from(new Set(teams.map(t => t.domain).filter(Boolean))).sort();
                    const lowerMap = new Map(discovered.map(d => [d.toLowerCase(), d]));

                    const desiredOptions = desired.map(d => {
                      const found = lowerMap.get(d.toLowerCase());
                      if (found) return (<option key={found} value={found}>{found}</option>);
                      return (<option key={d} value='' disabled>{d} (no teams)</option>);
                    });

                    const remaining = discovered.filter(d => !desired.some(x => x.toLowerCase() === d.toLowerCase()));
                    return (
                      <>
                        {desiredOptions}
                        {remaining.map(d => <option key={d} value={d}>{d}</option>)}
                      </>
                    );
                  })()
                }
              </select>

              {(teamQuery || domainFilter) && (
                <button onClick={() => { setTeamQuery(''); setDomainFilter(''); }} className="logoutBtn" style={{padding:'8px 10px'}}>Clear</button>
              )}
            </div>
          </div>
          <div style={{background:'rgba(0,0,0,0.5)', borderRadius:8, padding:12, maxHeight:480, overflow:'auto'}}>
            {teams.length === 0 && <div style={{color:'#9ca3af'}}>No teams found.</div>}
                {teams
                  .filter(t => {
                    // text search filter
                    if (teamQuery) {
                      try {
                        if (!((t.team_name || '').toLowerCase().includes(teamQuery.toLowerCase()))) return false;
                      } catch (e) { /* ignore */ }
                    }

                    // domain filter
                    if (domainFilter) {
                      if (domainFilter === 'null') {
                        if (t.domain) return false;
                      } else {
                        if (t.domain !== domainFilter) return false;
                      }
                    }

                    return true;
                  })
                  .map(t => (
                  <div key={t.id} onClick={() => setSelectedTeam(t)} style={{padding:10, borderRadius:6, cursor:'pointer', marginBottom:8, background: selectedTeam?.id === t.id ? 'rgba(0,255,157,0.07)' : 'transparent'}}>
                    <strong style={{color:'#e6fffa'}}>{t.team_name || '(Unnamed)'}</strong>
                    <div style={{fontSize:12, color:'#9ca3af'}}>{t.lead_name || t.lead_email || ''}</div>
                  </div>
                ))}
                </div>

          <div style={{marginTop:12}}>
            <h3 style={{margin:'6px 0', color:'#e6fffa', display:'flex', alignItems:'center', justifyContent:'space-between'}}>
              <span>Leaderboard</span>
              <div style={{display:'flex', gap:8, alignItems:'center'}}>
                <label style={{display:'flex', alignItems:'center', gap:6, cursor:'pointer', fontSize:12, color: leaderboardPublic ? '#00ff9d' : '#9ca3af'}}>
                  <input type="checkbox" checked={leaderboardPublic} onChange={toggleLeaderboardPublic} disabled={lbToggleLoading} style={{width:16, height:16, accentColor:'#00ff9d'}} />
                  {leaderboardPublic ? 'Public' : 'Hidden'}
                </label>
                <button className="logoutBtn" onClick={refreshLeaderboard} style={{padding:'6px 8px', fontSize:12}} disabled={lbLoading}>{lbLoading ? 'Refreshing…' : 'Refresh'}</button>
              </div>
            </h3>
            <div style={{background:'rgba(0,0,0,0.5)', borderRadius:8, padding:10, maxHeight:400, overflow:'auto'}}>
              {leaderboard.length === 0 && !lbLoading && <div style={{color:'#9ca3af'}}>No leaderboard data.</div>}
              {lbLoading && <div style={{color:'#9ca3af'}}>Loading…</div>}
              {leaderboard.map((row, idx) => (
                <div key={row.team_id || idx} style={{display:'flex', justifyContent:'space-between', padding:'8px 6px', borderBottom:'1px solid rgba(255,255,255,0.02)'}}>
                  <div style={{display:'flex', gap:8, alignItems:'center'}}>
                    <div style={{width:28, height:28, borderRadius:6, background:'rgba(255,255,255,0.02)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700}}>{row.position}</div>
                    <div style={{color:'#e6fffa'}}>{row.team_name}</div>
                  </div>
                  <div style={{color:'#9ca3af'}}>{row.score ?? '—'}</div>
                </div>
              ))}
            </div>
          </div>

            </div>

            {ideaOpen && selectedTeam && (
                <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1200}}>
                  <div style={{width:'min(920px,96%)', maxHeight:'90vh', overflowY:'auto', background:'#0b1620', borderRadius:10, padding:18, boxShadow:'0 10px 30px rgba(0,0,0,0.6)'}}>
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12}}>
                      <h3 style={{margin:0, color:'#fff'}}>IdeaVortex — {selectedTeam.team_name}</h3>
                      <div>
                        <button onClick={closeIdea} className="logoutBtn" style={{marginLeft:8}}>Close</button>
                      </div>
                    </div>

                    <div style={{color:'#cbd5e1', marginBottom:12}}>Score each category using the sliders. Total is out of {Object.values(SLIDER_MAX.idea).reduce((a,b)=>a+Number(b||0),0)}.</div>

                    {(() => {
                      const scores = ideaScores[selectedTeam.id] || { requirement_check:0, solution_logic:0, feasibility:0, idea_total:0 };
                      const total = scores.idea_total ?? (Number(scores.requirement_check||0) + Number(scores.solution_logic||0) + Number(scores.feasibility||0));
                      return (
                        <div style={{display:'grid', gridTemplateColumns:'1fr', gap:12}}>
                          <div style={{background:'rgba(255,255,255,0.02)', padding:12, borderRadius:8}}>
                            <div style={{fontSize:13, color:'#e6fffa', marginBottom:6}}>Requirement Check</div>
                            <input type="range" min={0} max={SLIDER_MAX.idea.requirement_check} step={1} value={scores.requirement_check} onChange={(e)=>handleIdeaChange(selectedTeam.id, 'requirement_check', e.target.value)} />
                            <div style={{color:'#9ca3af'}}>{scores.requirement_check} / {SLIDER_MAX.idea.requirement_check}</div>
                          </div>

                          <div style={{background:'rgba(255,255,255,0.02)', padding:12, borderRadius:8}}>
                            <div style={{fontSize:13, color:'#e6fffa', marginBottom:6}}>Solution Logic</div>
                            <input type="range" min={0} max={SLIDER_MAX.idea.solution_logic} step={1} value={scores.solution_logic} onChange={(e)=>handleIdeaChange(selectedTeam.id, 'solution_logic', e.target.value)} />
                            <div style={{color:'#9ca3af'}}>{scores.solution_logic} / {SLIDER_MAX.idea.solution_logic}</div>
                          </div>

                          <div style={{background:'rgba(255,255,255,0.02)', padding:12, borderRadius:8}}>
                            <div style={{fontSize:13, color:'#e6fffa', marginBottom:6}}>Feasibility</div>
                            <input type="range" min={0} max={SLIDER_MAX.idea.feasibility} step={1} value={scores.feasibility} onChange={(e)=>handleIdeaChange(selectedTeam.id, 'feasibility', e.target.value)} />
                            <div style={{color:'#9ca3af'}}>{scores.feasibility} / {SLIDER_MAX.idea.feasibility}</div>
                          </div>

                          <div style={{display:'flex', justifyContent:'flex-end', marginTop:6, gap:8}}>
                            <div style={{background:'rgba(255,255,255,0.02)', padding:'8px 12px', borderRadius:8, color:'#e6fffa'}}>
                                <strong>IdeaVortex Total:</strong> {total} / {Object.values(SLIDER_MAX.idea).reduce((a,b)=>a+Number(b||0),0)}
                                <div style={{fontSize:12, marginTop:6}}>Weighted: {Math.round(Number(total) * 0.6)}</div>
                              </div>
                            <div>
                                <button className="logoutBtn" onClick={async () => {
                                  try {
                                    const weightedIdea = Math.round(Number(total) * 0.6);
                                    const { error } = await supabase.from('scorecards').upsert({ team_id: selectedTeam.id, ideavortex: weightedIdea }, { onConflict: 'team_id' });
                                    if (error) throw error;
                                    const { data: refreshedTeams } = await supabase.from('teams').select('id, team_name, lead_name, lead_email, domain, problem_statement, team_members(member_name)').order('team_name', { ascending: true });
                                    setTeams(refreshedTeams || []);
                                    const updated = refreshedTeams?.find(t => t.id === selectedTeam.id) || selectedTeam;
                                    setSelectedTeam(updated);
                                    setIdeaOpen(false);
                                  } catch (err) {
                                    console.error('Failed to save idea score:', err);
                                    alert('Failed to save idea score: ' + (err.message || err));
                                  }
                                }}>Update Score</button>
                              <button className="logoutBtn" onClick={closeIdea} style={{marginLeft:8}}>Cancel</button>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}

        <div style={{flex:1}}>
          <h2 className="panelTitle">Team Details</h2>
          {!selectedTeam && (
            <div className="logBox">Select a team from the left to view details.</div>
          )}

          {selectedTeam && (
            <div>
              <div style={{background:'rgba(0,0,0,0.5)', borderRadius:8, padding:16}}>
                <h3 style={{marginTop:0, color:'#fff'}}>{selectedTeam.team_name}</h3>
                <p style={{color:'#9ca3af', margin:'6px 0'}}><strong>Leader:</strong> {selectedTeam.lead_name || selectedTeam.lead_email}</p>
                <p style={{color:'#9ca3af', margin:'6px 0'}}><strong>Domain:</strong> {selectedTeam.domain ?? 'null'}</p>
                <p style={{color:'#9ca3af', margin:'6px 0'}}><strong>Problem Statement:</strong> {selectedTeam.problem_statement ?? 'null'}</p>
                <div style={{marginTop:8}}>
                  <div style={{color:'#cbd5e1', fontWeight:700, marginBottom:6}}>Team Members</div>
                  {(selectedTeam.team_members || []).length === 0 && <div style={{color:'#9ca3af'}}>No members listed.</div>}
                  <ul style={{margin:0, paddingLeft:18}}>
                    {(selectedTeam.team_members || []).map((m, i) => (
                      <li key={i} style={{color:'#e6fffa'}}>{m.member_name || 'Unnamed Member'}</li>
                    ))}
                  </ul>
                </div>

                <div style={{display:'flex', gap:12, marginTop:16, flexWrap:'wrap'}}>
                  <div onClick={() => { if(selectedTeam) { setIdeaOpen(true); setIdeaScores(prev=>({ ...prev, [selectedTeam.id]: prev[selectedTeam.id] ?? { requirement_check:0, solution_logic:0, feasibility:0, idea_total:0 } })) } }} style={{cursor: selectedTeam ? 'pointer' : 'not-allowed', flex:'1 1 180px', minWidth:140, background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.03)', padding:12, borderRadius:8}}>
                    <div style={{fontSize:12, color:'#9ca3af', marginBottom:8}}>IdeaVortex</div>
                    <div style={{height:60, background:'rgba(0,0,0,0.35)', borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center'}}>
                      <small style={{color:'#9ca3af'}}>{selectedTeam ? 'Click to open' : 'Select a team'}</small>
                    </div>
                  </div>

                  <div onClick={() => { if(selectedTeam) { setReview1Open(true); setReview1Scores(prev=>({ ...prev, [selectedTeam.id]: prev[selectedTeam.id] ?? { architecture_flow:0, current_progress:0, qa_defense:0, review_1_total:0 } })) } }} style={{cursor: selectedTeam ? 'pointer' : 'not-allowed', flex:'1 1 140px', minWidth:140, background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.03)', padding:12, borderRadius:8}}>
                    <div style={{fontSize:12, color:'#9ca3af', marginBottom:8}}>Review 1</div>
                    <div style={{height:60, background:'rgba(0,0,0,0.35)', borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center'}}>
                      <small style={{color:'#9ca3af'}}>{selectedTeam ? 'Click to open' : 'Select a team'}</small>
                    </div>
                  </div>

                  <div onClick={() => { if(selectedTeam) { setReview2Open(true); setReview2Scores(prev=>({ ...prev, [selectedTeam.id]: prev[selectedTeam.id] ?? { mvp_functionality:0, ui_usability:0, code_quality:0, review_2_total:0 } })) } }} style={{cursor: selectedTeam ? 'pointer' : 'not-allowed', flex:'1 1 140px', minWidth:140, background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.03)', padding:12, borderRadius:8}}>
                    <div style={{fontSize:12, color:'#9ca3af', marginBottom:8}}>Review 2</div>
                    <div style={{height:60, background:'rgba(0,0,0,0.35)', borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center'}}>
                      <small style={{color:'#9ca3af'}}>{selectedTeam ? 'Click to open' : 'Select a team'}</small>
                    </div>
                  </div>

                  <div onClick={() => { if(selectedTeam) { setReview3Open(true); setReview3Scores(prev=>({ ...prev, [selectedTeam.id]: prev[selectedTeam.id] ?? { final_demo:0, innovation:0, business_impact:0, review_3_total:0 } })) } }} style={{cursor: selectedTeam ? 'pointer' : 'not-allowed', flex:'1 1 140px', minWidth:140, background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.03)', padding:12, borderRadius:8}}>
                    <div style={{fontSize:12, color:'#9ca3af', marginBottom:8}}>Review 3</div>
                    <div style={{height:60, background:'rgba(0,0,0,0.35)', borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center'}}>
                      <small style={{color:'#9ca3af'}}>{selectedTeam ? 'Click to open' : 'Select a team'}</small>
                    </div>
                  </div>

                  <div onClick={async () => {
                      if (!selectedTeam) return;
                      setPitchOpen(true);
                      // load existing pitch score if any
                      try {
                        const { data, error } = await supabase.from('scorecards').select('pitch_vortex').eq('team_id', selectedTeam.id).single();
                        if (!error && data) {
                          setPitchScores(prev => ({ ...prev, [selectedTeam.id]: data.pitch_vortex ?? 0 }));
                        } else {
                          setPitchScores(prev => ({ ...prev, [selectedTeam.id]: 0 }));
                        }
                      } catch (e) {
                        setPitchScores(prev => ({ ...prev, [selectedTeam.id]: 0 }));
                      }
                    }} style={{cursor: selectedTeam ? 'pointer' : 'not-allowed', flex:'1 1 180px', minWidth:140, background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.03)', padding:12, borderRadius:8}}>
                    <div style={{fontSize:12, color:'#9ca3af', marginBottom:8}}>PitchVortex</div>
                    <div style={{height:60, background:'rgba(0,0,0,0.35)', borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center'}}>
                      <small style={{color:'#9ca3af'}}>{selectedTeam ? 'Click to enter manual score' : 'Select a team'}</small>
                    </div>
                  </div>
                </div>

                {review1Open && selectedTeam && (
                  <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1200}}>
                    <div style={{width:'min(920px,96%)', maxHeight:'90vh', overflowY:'auto', background:'#0b1620', borderRadius:10, padding:18, boxShadow:'0 10px 30px rgba(0,0,0,0.6)'}}>
                      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12}}>
                        <h3 style={{margin:0, color:'#fff'}}>Review 1 — {selectedTeam.team_name}</h3>
                        <div>
                          <button onClick={closeReview1} className="logoutBtn" style={{marginLeft:8}}>Close</button>
                        </div>
                      </div>

                      <div style={{color:'#cbd5e1', marginBottom:12}}>Score each category using the sliders. Total is out of {Object.values(SLIDER_MAX.review1).reduce((a,b)=>a+Number(b||0),0)}.</div>

                      {(() => {
                        const scores = review1Scores[selectedTeam.id] || { architecture_flow:0, current_progress:0, qa_defense:0, review_1_total:0 };
                        const total = scores.review_1_total ?? (Number(scores.architecture_flow||0) + Number(scores.current_progress||0) + Number(scores.qa_defense||0));
                        return (
                          <div style={{display:'grid', gridTemplateColumns:'1fr', gap:12}}>
                            <div style={{background:'rgba(255,255,255,0.02)', padding:12, borderRadius:8}}>
                              <div style={{fontSize:13, color:'#e6fffa', marginBottom:6}}>Architecture / Flow</div>
                              <input type="range" min={0} max={SLIDER_MAX.review1.architecture_flow} step={1} value={scores.architecture_flow} onChange={(e)=>handleReview1Change(selectedTeam.id, 'architecture_flow', e.target.value)} />
                              <div style={{color:'#9ca3af'}}>{scores.architecture_flow} / {SLIDER_MAX.review1.architecture_flow}</div>
                            </div>

                            <div style={{background:'rgba(255,255,255,0.02)', padding:12, borderRadius:8}}>
                              <div style={{fontSize:13, color:'#e6fffa', marginBottom:6}}>Current Progress</div>
                              <input type="range" min={0} max={SLIDER_MAX.review1.current_progress} step={1} value={scores.current_progress} onChange={(e)=>handleReview1Change(selectedTeam.id, 'current_progress', e.target.value)} />
                              <div style={{color:'#9ca3af'}}>{scores.current_progress} / {SLIDER_MAX.review1.current_progress}</div>
                            </div>

                            <div style={{background:'rgba(255,255,255,0.02)', padding:12, borderRadius:8}}>
                              <div style={{fontSize:13, color:'#e6fffa', marginBottom:6}}>Q&A Defense</div>
                              <input type="range" min={0} max={SLIDER_MAX.review1.qa_defense} step={1} value={scores.qa_defense} onChange={(e)=>handleReview1Change(selectedTeam.id, 'qa_defense', e.target.value)} />
                              <div style={{color:'#9ca3af'}}>{scores.qa_defense} / {SLIDER_MAX.review1.qa_defense}</div>
                            </div>

                            <div style={{display:'flex', justifyContent:'flex-end', marginTop:6, gap:8}}>
                              <div style={{background:'rgba(255,255,255,0.02)', padding:'8px 12px', borderRadius:8, color:'#e6fffa'}}>
                                <strong>Review 1 Total:</strong> {total} / {Object.values(SLIDER_MAX.review1).reduce((a,b)=>a+Number(b||0),0)}
                              </div>
                              <div>
                                <button className="logoutBtn" onClick={async () => {
                                  const calcTotal = Number(total);
                                  try {
                                    const { error } = await supabase.from('scorecards').upsert({ team_id: selectedTeam.id, review_1: calcTotal }, { onConflict: 'team_id' });
                                    if (error) throw error;
                                    // refresh teams list and selected team
                                    const { data: refreshedTeams } = await supabase.from('teams').select('id, team_name, lead_name, lead_email, domain, problem_statement, team_members(member_name)').order('team_name', { ascending: true });
                                    setTeams(refreshedTeams || []);
                                    const updated = refreshedTeams?.find(t => t.id === selectedTeam.id) || selectedTeam;
                                    setSelectedTeam(updated);
                                    setReview1Open(false);
                                  } catch (err) {
                                    console.error('Failed to save review1 score:', err);
                                    alert('Failed to save review score: ' + (err.message || err));
                                  }
                                }}>Update Score</button>
                                <button className="logoutBtn" onClick={closeReview1} style={{marginLeft:8}}>Cancel</button>
                              </div>
                            </div>

                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}
                {review2Open && selectedTeam && (
                  <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1200}}>
                    <div style={{width:'min(920px,96%)', maxHeight:'90vh', overflowY:'auto', background:'#0b1620', borderRadius:10, padding:18, boxShadow:'0 10px 30px rgba(0,0,0,0.6)'}}>
                      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12}}>
                        <h3 style={{margin:0, color:'#fff'}}>Review 2 — {selectedTeam.team_name}</h3>
                        <div>
                          <button onClick={closeReview2} className="logoutBtn" style={{marginLeft:8}}>Close</button>
                        </div>
                      </div>

                      <div style={{color:'#cbd5e1', marginBottom:12}}>Score each category using the sliders. Total is out of {Object.values(SLIDER_MAX.review2).reduce((a,b)=>a+Number(b||0),0)}.</div>

                      {(() => {
                        const scores = review2Scores[selectedTeam.id] || { mvp_functionality:0, ui_usability:0, code_quality:0, review_2_total:0 };
                        const total = scores.review_2_total ?? (Number(scores.mvp_functionality||0) + Number(scores.ui_usability||0) + Number(scores.code_quality||0));
                        return (
                          <div style={{display:'grid', gridTemplateColumns:'1fr', gap:12}}>
                            <div style={{background:'rgba(255,255,255,0.02)', padding:12, borderRadius:8}}>
                              <div style={{fontSize:13, color:'#e6fffa', marginBottom:6}}>MVP Functionality</div>
                              <input type="range" min={0} max={SLIDER_MAX.review2.mvp_functionality} step={1} value={scores.mvp_functionality} onChange={(e)=>handleReview2Change(selectedTeam.id, 'mvp_functionality', e.target.value)} />
                              <div style={{color:'#9ca3af'}}>{scores.mvp_functionality} / {SLIDER_MAX.review2.mvp_functionality}</div>
                            </div>

                            <div style={{background:'rgba(255,255,255,0.02)', padding:12, borderRadius:8}}>
                              <div style={{fontSize:13, color:'#e6fffa', marginBottom:6}}>UI / Usability</div>
                              <input type="range" min={0} max={SLIDER_MAX.review2.ui_usability} step={1} value={scores.ui_usability} onChange={(e)=>handleReview2Change(selectedTeam.id, 'ui_usability', e.target.value)} />
                              <div style={{color:'#9ca3af'}}>{scores.ui_usability} / {SLIDER_MAX.review2.ui_usability}</div>
                            </div>

                            <div style={{background:'rgba(255,255,255,0.02)', padding:12, borderRadius:8}}>
                              <div style={{fontSize:13, color:'#e6fffa', marginBottom:6}}>Code Quality</div>
                              <input type="range" min={0} max={SLIDER_MAX.review2.code_quality} step={1} value={scores.code_quality} onChange={(e)=>handleReview2Change(selectedTeam.id, 'code_quality', e.target.value)} />
                              <div style={{color:'#9ca3af'}}>{scores.code_quality} / {SLIDER_MAX.review2.code_quality}</div>
                            </div>

                            <div style={{display:'flex', justifyContent:'flex-end', marginTop:6, gap:8}}>
                              <div style={{background:'rgba(255,255,255,0.02)', padding:'8px 12px', borderRadius:8, color:'#e6fffa'}}>
                                <strong>Review 2 Total:</strong> {total} / {Object.values(SLIDER_MAX.review2).reduce((a,b)=>a+Number(b||0),0)}
                                <div style={{fontSize:12, marginTop:6}}>Weighted: {Math.round(Number(total) * 1.667)}</div>
                              </div>
                              <div>
                                <button className="logoutBtn" onClick={async () => {
                                  const weightedReview2 = Math.round(Number(total) * 1.667);
                                  try {
                                    const { error } = await supabase.from('scorecards').upsert({ team_id: selectedTeam.id, review_2: weightedReview2 }, { onConflict: 'team_id' });
                                    if (error) throw error;
                                    const { data: refreshedTeams } = await supabase.from('teams').select('id, team_name, lead_name, lead_email, domain, problem_statement, team_members(member_name)').order('team_name', { ascending: true });
                                    setTeams(refreshedTeams || []);
                                    const updated = refreshedTeams?.find(t => t.id === selectedTeam.id) || selectedTeam;
                                    setSelectedTeam(updated);
                                    setReview2Open(false);
                                  } catch (err) {
                                    console.error('Failed to save review2 score:', err);
                                    alert('Failed to save review score: ' + (err.message || err));
                                  }
                                }}>Update Score</button>
                                <button className="logoutBtn" onClick={closeReview2} style={{marginLeft:8}}>Cancel</button>
                              </div>
                            </div>

                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}
                {review3Open && selectedTeam && (
                  <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1200}}>
                    <div style={{width:'min(960px,96%)', maxHeight:'90vh', overflowY:'auto', background:'#0b1620', borderRadius:10, padding:18, boxShadow:'0 10px 30px rgba(0,0,0,0.6)'}}>
                      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12}}>
                        <h3 style={{margin:0, color:'#fff'}}>Review 3 — {selectedTeam.team_name}</h3>
                        <div>
                          <button onClick={closeReview3} className="logoutBtn" style={{marginLeft:8}}>Close</button>
                        </div>
                      </div>

                      <div style={{color:'#cbd5e1', marginBottom:12}}>Score each category using the sliders. Total is out of {Object.values(SLIDER_MAX.review3).reduce((a,b)=>a+Number(b||0),0)}.</div>

                      {(() => {
                        const scores = review3Scores[selectedTeam.id] || { final_demo:0, innovation:0, business_impact:0, review_3_total:0 };
                        const total = scores.review_3_total ?? (Number(scores.final_demo||0) + Number(scores.innovation||0) + Number(scores.business_impact||0));
                        const weighted = Math.round(Number(total) * 1.65);
                        return (
                          <div style={{display:'grid', gridTemplateColumns:'1fr', gap:12}}>
                            <div style={{background:'rgba(255,255,255,0.02)', padding:12, borderRadius:8}}>
                              <div style={{fontSize:13, color:'#e6fffa', marginBottom:6}}>Final Demo</div>
                              <input type="range" min={0} max={SLIDER_MAX.review3.final_demo} step={1} value={scores.final_demo} onChange={(e)=>handleReview3Change(selectedTeam.id, 'final_demo', e.target.value)} />
                              <div style={{color:'#9ca3af'}}>{scores.final_demo} / {SLIDER_MAX.review3.final_demo}</div>
                            </div>

                            <div style={{background:'rgba(255,255,255,0.02)', padding:12, borderRadius:8}}>
                              <div style={{fontSize:13, color:'#e6fffa', marginBottom:6}}>Innovation</div>
                              <input type="range" min={0} max={SLIDER_MAX.review3.innovation} step={1} value={scores.innovation} onChange={(e)=>handleReview3Change(selectedTeam.id, 'innovation', e.target.value)} />
                              <div style={{color:'#9ca3af'}}>{scores.innovation} / {SLIDER_MAX.review3.innovation}</div>
                            </div>

                            <div style={{background:'rgba(255,255,255,0.02)', padding:12, borderRadius:8}}>
                              <div style={{fontSize:13, color:'#e6fffa', marginBottom:6}}>Business / Impact</div>
                              <input type="range" min={0} max={SLIDER_MAX.review3.business_impact} step={1} value={scores.business_impact} onChange={(e)=>handleReview3Change(selectedTeam.id, 'business_impact', e.target.value)} />
                              <div style={{color:'#9ca3af'}}>{scores.business_impact} / {SLIDER_MAX.review3.business_impact}</div>
                            </div>

                            <div style={{display:'flex', justifyContent:'flex-end', marginTop:6, gap:8}}>
                              <div style={{background:'rgba(255,255,255,0.02)', padding:'8px 12px', borderRadius:8, color:'#e6fffa'}}>
                                <strong>Review 3 Total:</strong> {total} / {Object.values(SLIDER_MAX.review3).reduce((a,b)=>a+Number(b||0),0)}
                                <div style={{fontSize:12, marginTop:6}}>Weighted: {weighted}</div>
                              </div>
                              <div>
                                <button className="logoutBtn" onClick={async () => {
                                  const calcTotal = Number(weighted);
                                  try {
                                    const { error } = await supabase.from('scorecards').upsert({ team_id: selectedTeam.id, review_3: calcTotal }, { onConflict: 'team_id' });
                                    if (error) throw error;
                                    const { data: refreshedTeams } = await supabase.from('teams').select('id, team_name, lead_name, lead_email, domain, problem_statement, team_members(member_name)').order('team_name', { ascending: true });
                                    setTeams(refreshedTeams || []);
                                    const updated = refreshedTeams?.find(t => t.id === selectedTeam.id) || selectedTeam;
                                    setSelectedTeam(updated);
                                    setReview3Open(false);
                                  } catch (err) {
                                    console.error('Failed to save review3 score:', err);
                                    alert('Failed to save review score: ' + (err.message || err));
                                  }
                                }}>Update Score</button>
                                <button className="logoutBtn" onClick={closeReview3} style={{marginLeft:8}}>Cancel</button>
                              </div>
                            </div>

                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}
                {pitchOpen && selectedTeam && (
                  <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1200}}>
                    <div style={{width:'min(520px,96%)', maxHeight:'90vh', overflowY:'auto', background:'#0b1620', borderRadius:10, padding:18, boxShadow:'0 10px 30px rgba(0,0,0,0.6)'}}>
                      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12}}>
                        <h3 style={{margin:0, color:'#fff'}}>PitchVortex — {selectedTeam.team_name}</h3>
                        <div>
                          <button onClick={() => setPitchOpen(false)} className="logoutBtn" style={{marginLeft:8}}>Close</button>
                        </div>
                      </div>

                      <div style={{color:'#cbd5e1', marginBottom:12}}>Enter a manual overall score for the Pitch round (0–{SLIDER_MAX.pitch.pitch_vortex}).</div>

                      {(() => {
                        const current = pitchScores[selectedTeam.id] ?? 0;
                        return (
                          <div style={{display:'grid', gridTemplateColumns:'1fr', gap:12}}>
                            <div style={{background:'rgba(255,255,255,0.02)', padding:12, borderRadius:8}}>
                              <input
                                type="number"
                                min={0}
                                max={SLIDER_MAX.pitch.pitch_vortex}
                                step={1}
                                value={current}
                                onChange={(e) => setPitchScores(prev => ({ ...prev, [selectedTeam.id]: Number(e.target.value) }))}
                                style={{width:'100%', padding:8, borderRadius:6}}
                              />
                              <div style={{color:'#9ca3af', marginTop:8}}>Current: {current} / {SLIDER_MAX.pitch.pitch_vortex}</div>
                            </div>

                            <div style={{display:'flex', justifyContent:'flex-end', gap:8}}>
                              <button className="logoutBtn" onClick={async () => {
                                const val = Number(pitchScores[selectedTeam.id] ?? 0);
                                try {
                                  // upsert the pitch_vortex value for the team's scorecard
                                  const { data, error } = await supabase.from('scorecards').upsert(
                                    { team_id: selectedTeam.id, pitch_vortex: val },
                                    { onConflict: 'team_id' }
                                  );
                                  if (error) throw error;
                                  setPitchOpen(false);
                                  // Optionally refresh leaderboard/teams if needed
                                } catch (err) {
                                  console.error('Failed to save pitch score:', err);
                                  alert('Failed to save pitch score: ' + (err.message || err));
                                }
                              }}>Save</button>
                              <button className="logoutBtn" onClick={() => setPitchOpen(false)}>Cancel</button>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}
            </div>
          </div>
        )}
      </div>
    </div>

    {scoringOpen && (
      <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1300}}>
        <div style={{width:'min(720px,96%)', maxHeight:'90vh', overflowY:'auto', background:'#0b1620', borderRadius:10, padding:18, boxShadow:'0 10px 30px rgba(0,0,0,0.6)'}}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12}}>
            <h3 style={{margin:0, color:'#fff'}}>Scoring Guide — Metrics & Maximums</h3>
            <div>
              <button onClick={() => setScoringOpen(false)} className="logoutBtn" style={{marginLeft:8}}>Close</button>
            </div>
          </div>

          <div style={{color:'#cbd5e1', marginBottom:12}}>These slider maximums are fixed in the application. This guide lists each metric and its maximum points.</div>

          <div style={{display:'grid', gap:12}}>
            <div style={{display:'grid', gridTemplateColumns:'1fr 80px', gap:8}}>
              <strong style={{color:'#e6fffa'}}>IdeaVortex — Requirement Check</strong>
              <div style={{color:'#9ca3af', textAlign:'right'}}>{SLIDER_MAX.idea.requirement_check}</div>
            </div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 80px', gap:8}}>
              <strong style={{color:'#e6fffa'}}>IdeaVortex — Solution Logic</strong>
              <div style={{color:'#9ca3af', textAlign:'right'}}>{SLIDER_MAX.idea.solution_logic}</div>
            </div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 80px', gap:8}}>
              <strong style={{color:'#e6fffa'}}>IdeaVortex — Feasibility</strong>
              <div style={{color:'#9ca3af', textAlign:'right'}}>{SLIDER_MAX.idea.feasibility}</div>
            </div>

            <hr style={{border:'none', borderTop:'1px solid rgba(255,255,255,0.03)'}} />

            <div style={{display:'grid', gridTemplateColumns:'1fr 80px', gap:8}}>
              <strong style={{color:'#e6fffa'}}>Review 1 — Architecture / Flow</strong>
              <div style={{color:'#9ca3af', textAlign:'right'}}>{SLIDER_MAX.review1.architecture_flow}</div>
            </div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 80px', gap:8}}>
              <strong style={{color:'#e6fffa'}}>Review 1 — Current Progress</strong>
              <div style={{color:'#9ca3af', textAlign:'right'}}>{SLIDER_MAX.review1.current_progress}</div>
            </div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 80px', gap:8}}>
              <strong style={{color:'#e6fffa'}}>Review 1 — Q&amp;A Defense</strong>
              <div style={{color:'#9ca3af', textAlign:'right'}}>{SLIDER_MAX.review1.qa_defense}</div>
            </div>

            <hr style={{border:'none', borderTop:'1px solid rgba(255,255,255,0.03)'}} />

            <div style={{display:'grid', gridTemplateColumns:'1fr 80px', gap:8}}>
              <strong style={{color:'#e6fffa'}}>Review 2 — MVP Functionality</strong>
              <div style={{color:'#9ca3af', textAlign:'right'}}>{SLIDER_MAX.review2.mvp_functionality}</div>
            </div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 80px', gap:8}}>
              <strong style={{color:'#e6fffa'}}>Review 2 — UI / Usability</strong>
              <div style={{color:'#9ca3af', textAlign:'right'}}>{SLIDER_MAX.review2.ui_usability}</div>
            </div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 80px', gap:8}}>
              <strong style={{color:'#e6fffa'}}>Review 2 — Code Quality</strong>
              <div style={{color:'#9ca3af', textAlign:'right'}}>{SLIDER_MAX.review2.code_quality}</div>
            </div>

            <hr style={{border:'none', borderTop:'1px solid rgba(255,255,255,0.03)'}} />

            <div style={{display:'grid', gridTemplateColumns:'1fr 80px', gap:8}}>
              <strong style={{color:'#e6fffa'}}>Review 3 — Final Demo</strong>
              <div style={{color:'#9ca3af', textAlign:'right'}}>{SLIDER_MAX.review3.final_demo}</div>
            </div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 80px', gap:8}}>
              <strong style={{color:'#e6fffa'}}>Review 3 — Innovation</strong>
              <div style={{color:'#9ca3af', textAlign:'right'}}>{SLIDER_MAX.review3.innovation}</div>
            </div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 80px', gap:8}}>
              <strong style={{color:'#e6fffa'}}>Review 3 — Business / Impact</strong>
              <div style={{color:'#9ca3af', textAlign:'right'}}>{SLIDER_MAX.review3.business_impact}</div>
            </div>

            <hr style={{border:'none', borderTop:'1px solid rgba(255,255,255,0.03)'}} />

            <div style={{display:'grid', gridTemplateColumns:'1fr 80px', gap:8}}>
              <strong style={{color:'#e6fffa'}}>PitchVortex — Max (overall)</strong>
              <div style={{color:'#9ca3af', textAlign:'right'}}>{SLIDER_MAX.pitch.pitch_vortex}</div>
            </div>

            <div style={{display:'flex', justifyContent:'flex-end', gap:8, marginTop:8}}>
              <button className="logoutBtn" onClick={() => setScoringOpen(false)}>Done</button>
            </div>
          </div>
        </div>
      </div>
    )}
    </div>
  );
}
