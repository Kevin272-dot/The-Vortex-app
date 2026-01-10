import { useState } from "react";
import { supabase } from "../supabaseClient";
import { buildTeam } from "../utils/buildTeam";
import "../styles/build-team.css";

export default function BuildTeam({ teamId, onTeamBuilt, currentTeamName, hasMembers, team, teamMembers }) {
  const [teamName, setTeamName] = useState("");
  const [teamSize, setTeamSize] = useState(2);
  const [members, setMembers] = useState([
    { name: "", email: "", isVitChennai: "yes", regNo: "", eventHubId: "" },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Check if team is already built — show team details instead of generic message
  if (hasMembers) {
    const displayTeamName = currentTeamName || team?.team_name || "Unnamed Team";
    const leadName = team?.lead_name || "Team Leader";
    const leadEmail = team?.lead_email || "-";

    return (
      <div className="buildTeamContainer">
        <div className="buildTeamCard">
          <h2 className="buildTeamTitle">✅ Team Already Built</h2>
          <p className="buildTeamDesc">Your team has already been built. Below are the team details.</p>

          <div className="teamDetails">
            <div className="buildField">
              <label>Team Name</label>
              <div className="buildStatic">{displayTeamName}</div>
            </div>

            <div className="buildField">
              <label>Team Lead</label>
              <div className="buildStatic">{leadName} — {leadEmail}</div>
            </div>

            <div className="membersSection">
              <h3 className="membersSectionTitle">Team Members</h3>
              {(teamMembers || []).length === 0 ? (
                <div className="buildStatic">No additional members found.</div>
              ) : (
                (teamMembers || []).map((m, idx) => (
                  <div key={m.id || idx} className="memberRow">
                    <strong>{m.member_name || m.name || `Member ${idx + 1}`}</strong>
                    <div className="memberEmail">{m.member_email || m.email || "-"}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleTeamSizeChange = (size) => {
    setTeamSize(size);
    const memberCount = size - 1; // Subtract 1 for the team leader
    
    if (memberCount < members.length) {
      setMembers(members.slice(0, memberCount));
    } else {
      const newMembers = [...members];
      for (let i = members.length; i < memberCount; i++) {
        newMembers.push({ name: "", email: "", isVitChennai: "yes", regNo: "", eventHubId: "" });
      }
      setMembers(newMembers);
    }
  };

  const handleMemberChange = (index, field, value) => {
    const newMembers = [...members];
    newMembers[index][field] = value;
    
    // Clear the opposite field when toggling
    if (field === "isVitChennai") {
      if (value === "yes") {
        newMembers[index].eventHubId = "";
      } else {
        newMembers[index].regNo = "";
      }
    }
    
    setMembers(newMembers);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      // Validate team name
      if (!teamName.trim()) {
        throw new Error("Please enter a team name");
      }

      // Validate all members
      for (let i = 0; i < members.length; i++) {
        const member = members[i];
        if (!member.name.trim()) {
          throw new Error(`Please enter name for Member ${i + 1}`);
        }
        if (!member.email.trim()) {
          throw new Error(`Please enter email for Member ${i + 1}`);
        }
        if (member.isVitChennai === "yes" && !member.regNo.trim()) {
          throw new Error(`Please enter registration number for Member ${i + 1}`);
        }
        if (member.isVitChennai === "no" && !member.eventHubId.trim()) {
          throw new Error(`Please enter EventHub ID for Member ${i + 1}`);
        }
      }

      // Call the build-team edge function via helper (sends Authorization header)
      await buildTeam({
        teamId,
        teamName,
        teamSize,
        members: members.map((m) => ({
          name: m.name,
          email: m.email,
          isVitChennai: m.isVitChennai === "yes",
          regNo: m.isVitChennai === "yes" ? m.regNo : null,
          eventHubId: m.isVitChennai === "no" ? m.eventHubId : null,
        })),
      });

      // Success!
      alert("✅ Team successfully built! Your team is now complete.");
      if (onTeamBuilt) onTeamBuilt();
    } catch (err) {
      console.error("Build team error:", err);
      setError(err.message || "Failed to build team. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="buildTeamContainer">
      <div className="buildTeamCard">
        <h2 className="buildTeamTitle">🔨 Build Your Team</h2>
        <p className="buildTeamDesc">
          Set your team name, choose team size (2-5 members including you), and add your team members.
        </p>

        {error && (
          <div className="buildTeamError">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Team Name */}
          <div className="buildField">
            <label htmlFor="teamName">Team Name</label>
            <input
              id="teamName"
              type="text"
              className="buildInput"
              placeholder="e.g., Code Warriors, Tech Titans"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              required
            />
          </div>

          {/* Team Size */}
          <div className="buildField">
            <label>Team Size (including you as leader)</label>
            <div className="teamSizeButtons">
              {[2, 3, 4, 5].map((size) => (
                <button
                  key={size}
                  type="button"
                  className={`teamSizeBtn ${teamSize === size ? "active" : ""}`}
                  onClick={() => handleTeamSizeChange(size)}
                >
                  {size} Members
                </button>
              ))}
            </div>
          </div>

          {/* Team Members */}
          <div className="membersSection">
            <h3 className="membersSectionTitle">Team Members (excluding you)</h3>
            
            {members.map((member, index) => (
              <div key={index} className="memberCard">
                <div className="memberHeader">Member {index + 1}</div>

                <div className="buildField">
                  <label>Name</label>
                  <input
                    type="text"
                    className="buildInput"
                    placeholder="Member name"
                    value={member.name}
                    onChange={(e) => handleMemberChange(index, "name", e.target.value)}
                    required
                  />
                </div>

                <div className="buildField">
                  <label>Email</label>
                  <input
                    type="email"
                    className="buildInput"
                    placeholder="member@example.com"
                    value={member.email}
                    onChange={(e) => handleMemberChange(index, "email", e.target.value)}
                    required
                  />
                </div>

                <div className="buildField">
                  <label>College</label>
                  <div className="toggleGroup">
                    <button
                      type="button"
                      className={`toggleBtn ${member.isVitChennai === "yes" ? "active" : ""}`}
                      onClick={() => handleMemberChange(index, "isVitChennai", "yes")}
                    >
                      VIT Chennai
                    </button>
                    <button
                      type="button"
                      className={`toggleBtn ${member.isVitChennai === "no" ? "active" : ""}`}
                      onClick={() => handleMemberChange(index, "isVitChennai", "no")}
                    >
                      Other College
                    </button>
                  </div>
                </div>

                {member.isVitChennai === "yes" ? (
                  <div className="buildField">
                    <label>Registration Number</label>
                    <input
                      type="text"
                      className="buildInput"
                      placeholder="VIT registration number"
                      value={member.regNo}
                      onChange={(e) => handleMemberChange(index, "regNo", e.target.value)}
                      required
                    />
                  </div>
                ) : (
                  <div className="buildField">
                    <label>VIT EventHub Unique ID</label>
                    <input
                      type="text"
                      className="buildInput"
                      placeholder="EventHub unique ID"
                      value={member.eventHubId}
                      onChange={(e) => handleMemberChange(index, "eventHubId", e.target.value)}
                      required
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          <button
            type="submit"
            className="buildSubmitBtn"
            disabled={isSubmitting}
          >
            {isSubmitting ? "⚡ Building Team..." : "🚀 Build Team"}
          </button>
        </form>
      </div>
    </div>
  );
}
