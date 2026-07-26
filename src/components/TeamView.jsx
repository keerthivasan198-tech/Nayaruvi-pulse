import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { auth } from '../firebase';
import { Users, FolderOpen, Shield, Mail, Activity, Calendar, User } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://nayaruvi-pulse-zmst.onrender.com/api';

export default function TeamView({ activeWorkspaceId, activeProjectId }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  const currentUserRole = members.find(m => m.uid === auth.currentUser?.uid)?.role || 'Member';
  const isPrivileged = currentUserRole === 'Founder' || currentUserRole === 'Co-Founder' || currentUserRole === 'Admin';

  // 2. Fetch Members when a project is selected
  useEffect(() => {
    if (!activeProjectId) {
      setMembers([]);
      setLoading(false);
      return;
    }

    const fetchMembers = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/projects/${activeProjectId}`);
        if (res.ok) {
          const data = await res.json();
          setMembers(data.members || []);
        }
      } catch (err) {
        console.error("Error fetching project members:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchMembers();
    fetchMembers();
  }, [activeProjectId]);

  const handleRoleChange = async (memberUid, newRole) => {
    if (!activeProjectId || !memberUid) return;
    try {
      const res = await fetch(`${API_URL}/projects/${activeProjectId}/members/${memberUid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      });
      if (res.ok) {
        // Refresh members
        const fetchRes = await fetch(`${API_URL}/projects/${activeProjectId}`);
        if (fetchRes.ok) {
          const data = await fetchRes.json();
          setMembers(data.members || []);
        }
      }
    } catch (err) {
      console.error("Failed to update role:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center p-8">
        <div className="w-8 h-8 rounded-full border-4 border-[#274245] border-t-transparent animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 pb-32 max-w-7xl mx-auto w-full animate-fade-in">
      <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 sm:gap-0">
        <div>
          <h1 className="text-4xl font-bold text-[#274245] font-heading mb-2 tracking-tight">TEAM</h1>
          <p className="text-[#5C6E6F] font-medium">Manage project members, roles, and access.</p>
        </div>
        <div className="bg-[#FAF7EC] px-4 py-2 rounded-xl border border-[#D4C99E] shadow-sm flex items-center gap-3">
          <Users size={20} className="text-[#274245]" />
          <span className="font-bold text-[#274245]">{members.length} Members</span>
        </div>
      </div>

      {!activeProjectId ? (
        <div className="celestique-card p-12 text-center flex flex-col items-center justify-center rounded-2xl border border-[#C9BD91]">
          <div className="w-16 h-16 rounded-full bg-[#E8E0BF] flex items-center justify-center mb-4">
            <FolderOpen size={32} className="text-[#274245]" />
          </div>
          <h3 className="text-xl font-bold text-[#274245] mb-2 font-heading">No Project Selected</h3>
          <p className="text-[#5C6E6F] max-w-md">Please select a project from the sidebar to manage team members.</p>
        </div>
      ) : (
        <div className="w-full">
          <div className="celestique-card rounded-2xl overflow-hidden border border-[#C9BD91]">
            <div className="p-6 border-b border-[#C9BD91]/50 bg-white/50 backdrop-blur-sm flex justify-between items-center">
              <h3 className="text-lg font-bold text-[#274245] font-heading">Project Members</h3>
            </div>
            <div className="divide-y divide-[#C9BD91]/30">
              {members.length === 0 ? (
                <div className="p-8 text-center text-[#5C6E6F]">No members in this project.</div>
              ) : (
                members.map((member, i) => (
                  <div key={i} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/40 transition-colors">
                    <div className="flex items-center gap-4">
                      <img 
                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(member.name || member.email)}&background=274245&color=DFD6AE`} 
                        alt="avatar" 
                        className="w-12 h-12 rounded-xl border border-[#C9BD91] shadow-sm"
                      />
                      <div>
                        <h4 className="font-bold text-[#274245] flex items-center gap-2">
                          {member.name || 'Unknown User'}
                          {member.uid === auth.currentUser?.uid && (
                            <span className="text-[10px] uppercase font-bold bg-[#E8E0BF] text-[#274245] px-2 py-0.5 rounded-full">You</span>
                          )}
                        </h4>
                        <div className="flex items-center gap-3 text-sm text-[#5C6E6F] mt-1">
                          <span className="flex items-center gap-1"><Mail size={14}/> {member.email}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isPrivileged ? (
                        <select 
                          value={member.role || 'Member'}
                          onChange={e => handleRoleChange(member.uid, e.target.value)}
                          className="bg-white text-xs font-bold text-[#274245] border border-[#D4C99E] rounded-lg px-2.5 py-1.5 focus:outline-none cursor-pointer"
                        >
                          <option value="Founder">Founder</option>
                          <option value="Co-Founder">Co-Founder</option>
                          <option value="Member">Member</option>
                        </select>
                      ) : (
                        <span className={`px-3 py-1 text-xs font-bold rounded-full flex items-center gap-1.5 ${
                          member.role === 'Founder' || member.role === 'Admin'
                            ? 'bg-[#274245] text-[#DFD6AE]'
                            : 'bg-[#E8E0BF] text-[#274245]'
                        }`}>
                          {member.role === 'Founder' || member.role === 'Admin' ? <Shield size={12} /> : <User size={12} />}
                          {member.role || 'Member'}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
