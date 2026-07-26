import React, { useState, useEffect } from 'react';
import { Shield, UserPlus, FolderOpen, Mail, CheckCircle2, ChevronRight, Settings as SettingsIcon, Plus, Check } from 'lucide-react';
import { auth } from '../firebase';

const API_URL = import.meta.env.VITE_API_URL || 'https://nayaruvi-pulse.onrender.com/api';

export default function SettingsView({ activeWorkspaceId }) {
  const [workspace, setWorkspace] = useState(null);
  const [projects, setProjects] = useState([]);
  const [members, setMembers] = useState([]);
  
  // New member form
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('Member');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [statusMsg, setStatusMsg] = useState('');

  const fetchData = async () => {
    if (!activeWorkspaceId) return;
    try {
      const wsRes = await fetch(`${API_URL}/workspace/${activeWorkspaceId}`);
      if (wsRes.ok) {
        const ws = await wsRes.json();
        setWorkspace(ws);
        setMembers(ws.members || []);
      }

      const projRes = await fetch(`${API_URL}/projects/workspace/${activeWorkspaceId}/user/${auth.currentUser.uid}`);
      if (projRes.ok) {
        const list = await projRes.json();
        setProjects(list.map(p => ({ id: p._id, ...p })));
        if (list.length > 0 && !selectedProjectId) {
          setSelectedProjectId(list[0]._id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeWorkspaceId]);

  // Handle Role Change in Workspace
  const handleWorkspaceRoleChange = async (memberUid, newRole) => {
    if (!activeWorkspaceId || !memberUid) return;
    try {
      const res = await fetch(`${API_URL}/workspaces/${activeWorkspaceId}/members/${memberUid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      });
      if (res.ok) {
        showStatus("Workspace member role updated successfully!");
        fetchData();
      }
    } catch (err) {
      console.error("Failed to update workspace role:", err);
    }
  };

  // Handle Role Change in Project
  const handleProjectRoleChange = async (projectId, memberUid, newRole) => {
    if (!projectId || !memberUid) return;
    try {
      const res = await fetch(`${API_URL}/projects/${projectId}/members/${memberUid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      });
      if (res.ok) {
        showStatus("Project member role updated successfully!");
        fetchData();
      }
    } catch (err) {
      console.error("Failed to update project role:", err);
    }
  };

  // Add Member to Workspace / Project
  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!newMemberEmail.trim() || !activeWorkspaceId) return;

    try {
      const newUid = 'user_' + Date.now();
      const memberName = newMemberName.trim() || newMemberEmail.split('@')[0];
      
      const payload = { uid: newUid, name: memberName, email: newMemberEmail.trim(), role: newMemberRole };
      
      // Update Workspace Members
      await fetch(`${API_URL}/workspaces/${activeWorkspaceId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      // If project selected, add to project members
      if (selectedProjectId) {
        await fetch(`${API_URL}/projects/${selectedProjectId}/members`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      setNewMemberEmail('');
      setNewMemberName('');
      showStatus(`Added ${memberName} as ${newMemberRole}!`);
      fetchData();
    } catch (err) {
      console.error("Add member error:", err);
    }
  };

  const showStatus = (msg) => {
    setStatusMsg(msg);
    setTimeout(() => setStatusMsg(''), 3000);
  };

  return (
    <div className="flex h-full w-full flex-col p-8 bg-[#DFD6AE] overflow-y-auto">
      
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-normal text-[#274245] tracking-wide mb-1 font-heading uppercase flex items-center">
          <SettingsIcon size={26} className="mr-3 text-[#274245]" /> Workspace Settings
        </h2>
        <p className="text-sm font-medium text-[#5C6E6F]">
          Manage workspace projects, project members, and member role assignments.
        </p>
      </div>

      {statusMsg && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-700 text-white font-bold text-xs flex items-center shadow-md animate-in fade-in">
          <Check size={16} className="mr-2" /> {statusMsg}
        </div>
      )}

      {/* Main Container */}
      <div className="space-y-8 max-w-4xl">
        
        {/* Workspace Info Card */}
        <div className="celestique-card rounded-2xl p-6 text-[#274245]">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <span className="text-[10px] font-bold text-[#5C6E6F] uppercase tracking-widest block mb-1">Active Workspace</span>
              <h3 className="text-2xl font-normal font-heading text-[#274245]">{workspace?.name || 'My Workspace'}</h3>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-xs font-semibold text-[#274245] bg-[#E8E0BF] px-3.5 py-1.5 rounded-full border border-[#D4C99E]">
                {members.length} Workspace Members
              </span>
              <span className="text-xs font-semibold text-[#274245] bg-[#E8E0BF] px-3.5 py-1.5 rounded-full border border-[#D4C99E]">
                {projects.length} Projects
              </span>
            </div>
          </div>
        </div>

        {/* Section 1: Add New Member */}
        <div className="celestique-card rounded-2xl p-6 text-[#274245]">
          <h3 className="text-xl font-normal font-heading text-[#274245] uppercase tracking-wide mb-1 flex items-center">
            <UserPlus size={20} className="mr-2 text-[#274245]" /> Add Member & Assign Role
          </h3>
          <p className="text-xs font-medium text-[#5C6E6F] mb-6">
            Invite a new team member into this workspace and assign their project role.
          </p>

          <form onSubmit={handleAddMember} className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <input 
              type="text" 
              placeholder="Member Name"
              value={newMemberName}
              onChange={e => setNewMemberName(e.target.value)}
              className="bg-white border border-[#D4C99E] rounded-xl px-3.5 py-2.5 text-xs text-[#274245] font-medium focus:outline-none focus:border-[#274245]"
            />
            <input 
              type="email" 
              required
              placeholder="Member Email"
              value={newMemberEmail}
              onChange={e => setNewMemberEmail(e.target.value)}
              className="bg-white border border-[#D4C99E] rounded-xl px-3.5 py-2.5 text-xs text-[#274245] font-medium focus:outline-none focus:border-[#274245]"
            />
            <select 
              value={newMemberRole}
              onChange={e => setNewMemberRole(e.target.value)}
              className="bg-white border border-[#D4C99E] rounded-xl px-3 py-2.5 text-xs font-bold text-[#274245] focus:outline-none cursor-pointer"
            >
              <option value="Founder">Founder</option>
              <option value="Co-Founder">Co-Founder</option>
              <option value="Member">Member</option>
            </select>
            <button 
              type="submit"
              className="btn-matte-primary py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center cursor-pointer font-heading"
            >
              <Plus size={15} className="mr-1" /> Add Member
            </button>
          </form>
        </div>

        {/* Section 2: Projects & Members Role Management */}
        <div className="celestique-card rounded-2xl p-6 text-[#274245]">
          <div className="flex justify-between items-center mb-6 border-b border-[#D4C99E] pb-4">
            <div>
              <h3 className="text-xl font-normal font-heading text-[#274245] uppercase tracking-wide flex items-center">
                <FolderOpen size={20} className="mr-2 text-[#274245]" /> Project Members & Role Management
              </h3>
              <p className="text-xs font-medium text-[#5C6E6F] mt-0.5">
                Select projects and change individual member roles directly inside each project.
              </p>
            </div>
          </div>

          {projects.length === 0 ? (
            <p className="text-xs text-[#5C6E6F] font-medium p-6 text-center">No projects created in this workspace yet.</p>
          ) : (
            <div className="space-y-6">
              {projects.map(proj => {
                const projMembers = proj.members && proj.members.length > 0 ? proj.members : members;
                return (
                  <div key={proj.id} className="p-5 rounded-2xl bg-white border border-[#D4C99E] shadow-sm space-y-4">
                    
                    {/* Project Header */}
                    <div className="flex justify-between items-center border-b border-[#E8E0BF] pb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-lg bg-[#274245] text-[#FAF7EC] flex items-center justify-center font-bold text-xs">
                          {proj.title.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="text-base font-bold text-[#274245]">{proj.title}</h4>
                          <span className="text-[11px] text-[#5C6E6F] font-medium">{proj.category || 'General Project'}</span>
                        </div>
                      </div>
                      <span className="text-[11px] font-bold text-[#274245] bg-[#E8E0BF] px-2.5 py-1 rounded-md">
                        {projMembers.length} Project Members
                      </span>
                    </div>

                    {/* Member List in Project */}
                    <div className="space-y-3">
                      {projMembers.map(pm => (
                        <div key={pm.uid} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl bg-[#FAF7EC] border border-[#D4C99E] gap-3">
                          <div className="flex items-center space-x-3">
                            <img 
                              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(pm.name || pm.email || 'Member')}&background=274245&color=FAF7EC`}
                              alt="Avatar"
                              className="w-8 h-8 rounded-full border border-[#274245] object-cover"
                            />
                            <div>
                              <span className="text-xs font-bold text-[#274245] block">{pm.name || 'Project Member'}</span>
                              <span className="text-[10px] text-[#5C6E6F] font-medium">{pm.email || 'member@nayaruvi.com'}</span>
                            </div>
                          </div>

                          {/* Role Selector for Project */}
                          <div className="flex items-center space-x-2">
                            <Shield size={13} className="text-[#5C6E6F]" />
                            <span className="text-[11px] font-bold text-[#5C6E6F]">Role:</span>
                            <select 
                              value={pm.role || 'Member'}
                              onChange={e => handleProjectRoleChange(proj.id, pm.uid, e.target.value)}
                              className="bg-white text-xs font-bold text-[#274245] border border-[#D4C99E] rounded-lg px-2.5 py-1.5 focus:outline-none cursor-pointer"
                            >
                              <option value="Founder">Founder</option>
                              <option value="Co-Founder">Co-Founder</option>
                              <option value="Member">Member</option>
                            </select>
                          </div>
                        </div>
                      ))}
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Section 3: Global Workspace Members */}
        <div className="celestique-card rounded-2xl p-6 text-[#274245]">
          <div className="flex justify-between items-center mb-6 border-b border-[#D4C99E] pb-4">
            <div>
              <h3 className="text-xl font-normal font-heading text-[#274245] uppercase tracking-wide flex items-center">
                <Shield size={20} className="mr-2 text-[#274245]" /> Workspace Members & Global Roles
              </h3>
              <p className="text-xs font-medium text-[#5C6E6F] mt-0.5">
                Manage workspace-wide permissions for all team members.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {members.map(m => (
              <div key={m.uid} className="p-3.5 rounded-xl bg-white border border-[#D4C99E] flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <img 
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(m.name || 'Member')}&background=274245&color=FAF7EC`} 
                    alt="Avatar" 
                    className="w-9 h-9 rounded-full border border-[#274245] object-cover shrink-0" 
                  />
                  <div>
                    <h4 className="text-xs font-bold text-[#274245]">{m.name || 'Workspace Member'}</h4>
                    <span className="text-[10px] text-[#5C6E6F] font-medium">{m.email || 'user@nayaruvi.com'}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-[11px] font-bold text-[#5C6E6F]">Global Role:</span>
                  <select 
                    value={m.role || 'Member'}
                    onChange={e => handleWorkspaceRoleChange(m.uid, e.target.value)}
                    className="bg-[#FAF7EC] text-xs font-bold text-[#274245] border border-[#D4C99E] rounded-lg px-2.5 py-1.5 focus:outline-none cursor-pointer"
                  >
                    <option value="Founder">Founder</option>
                    <option value="Co-Founder">Co-Founder</option>
                    <option value="Member">Member</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
