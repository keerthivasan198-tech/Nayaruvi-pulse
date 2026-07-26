import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { auth } from '../firebase';
import { Settings, UserPlus, Box, LayoutTemplate, SquareAsterisk, Zap, Tags, Plus, CheckCircle2 } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://nayaruvi-pulse.onrender.com/api';

export default function WorkspaceSelector({ activeWorkspaceId, setActiveWorkspaceId, onOpenSettings }) {
  const [workspaces, setWorkspaces] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newWsName, setNewWsName] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef(null);

  const fetchWorkspaces = async (user) => {
    if (!user) return;
    try {
      const res = await fetch(`${API_URL}/workspaces/${user.uid}`);
      if (res.ok) {
        const data = await res.json();
        const formatted = data.map(w => ({ id: w._id, ...w }));
        setWorkspaces(formatted);
        if (formatted.length > 0 && !activeWorkspaceId) {
          setActiveWorkspaceId(formatted[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    import('firebase/auth').then(({ onAuthStateChanged }) => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
          fetchWorkspaces(user);
        } else {
          setLoading(false);
        }
      });
      return () => unsubscribe();
    });

    const interval = setInterval(() => {
      if (auth.currentUser) fetchWorkspaces(auth.currentUser);
    }, 5000); // Polling for updates
    
    return () => clearInterval(interval);
  }, [activeWorkspaceId, setActiveWorkspaceId]);

  const fetchProjects = async () => {
    if (!activeWorkspaceId || !auth.currentUser) return;
    try {
      const res = await fetch(`${API_URL}/projects/workspace/${activeWorkspaceId}/user/${auth.currentUser.uid}`);
      if (res.ok) {
        const data = await res.json();
        setProjects(data.map(p => ({ id: p._id, ...p })));
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchProjects();
    const interval = setInterval(fetchProjects, 5000);
    return () => clearInterval(interval);
  }, [activeWorkspaceId]);

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setIsCreating(false);
        setShowInviteModal(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCreateWorkspace = async (e) => {
    e.preventDefault();
    if (!newWsName.trim() || !auth.currentUser) return;

    try {
      const res = await fetch(`${API_URL}/workspaces`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newWsName,
          uid: auth.currentUser.uid,
          email: auth.currentUser.email,
          displayName: auth.currentUser.displayName || auth.currentUser.email.split('@')[0]
        })
      });
      
      if (res.ok) {
        const newWs = await res.json();
        setNewWsName('');
        setIsCreating(false);
        setActiveWorkspaceId(newWs._id);
        setIsOpen(false);
        fetchWorkspaces();
      }
    } catch (error) {
      console.error("Create workspace error:", error);
    }
  };

  const handleInviteClick = () => {
    setIsOpen(false);
    setShowInviteModal(true);
  };

  const handleGenerateProjectLink = (projectId) => {
    const inviteLink = `${window.location.origin}/invite/${projectId}?workspaceId=${activeWorkspaceId}`;
    navigator.clipboard.writeText(inviteLink);
    alert(`Project invite link copied to clipboard!\n${inviteLink}`);
    setShowInviteModal(false);
  };

  const activeWs = workspaces.find(w => w.id === activeWorkspaceId);
  const activeWsName = activeWs?.name || 'No Workspace';
  const activeWsInitial = activeWsName.charAt(0).toUpperCase();

  if (!loading && workspaces.length === 0) {
    return createPortal(
      <div className="fixed inset-0 bg-[#DFD6AE] z-[9999] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white border border-[#D4C99E] shadow-2xl rounded-2xl p-8 text-center animate-in fade-in zoom-in duration-300">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={32} strokeWidth={2.5} />
          </div>
          <h2 className="text-2xl font-black text-text-primary mb-3 tracking-tight">Welcome to Nayaruvi</h2>
          <p className="text-text-secondary font-medium mb-8">
            Let's get started by creating your very first workspace. You can invite your team and create projects inside!
          </p>
          <form onSubmit={handleCreateWorkspace}>
            <input 
              type="text" 
              autoFocus
              value={newWsName}
              onChange={e => setNewWsName(e.target.value)}
              placeholder="E.g. Acme Corp Workspace"
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-base font-medium focus:outline-none focus:border-primary transition-colors mb-4"
            />
            <button 
              type="submit" 
              disabled={!newWsName.trim()}
              className="w-full bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Create Workspace
            </button>
          </form>
        </div>
      </div>,
      document.body
    );
  }

  return (
    <div className="relative mb-4" ref={dropdownRef}>
      {/* Selector Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-2.5 rounded-xl bg-[#1C3235] hover:bg-[#142426] text-[#DFD6AE] border border-[#274245] transition-all duration-150 shadow-xs cursor-pointer group"
      >
        <div className="flex items-center space-x-3 truncate">
          <div className="w-8 h-8 rounded-lg bg-[#DFD6AE] text-[#274245] flex items-center justify-center font-bold text-sm shadow-xs shrink-0 font-heading">
            {activeWsInitial}
          </div>
          <div className="flex flex-col items-start truncate">
            <span className="text-[9px] font-bold text-[#DFD6AE]/75 uppercase tracking-wider leading-tight">Workspace</span>
            <span className="text-sm font-bold text-[#DFD6AE] truncate">{activeWsName}</span>
          </div>
        </div>
        <svg className={`w-4 h-4 text-[#DFD6AE]/75 group-hover:text-white transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-72 bg-[#FAF8F5] rounded-2xl shadow-celestique-lg border border-[#DDD5CC] z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 text-[#2B2420]">
          
          {/* Header Info */}
          <div className="p-4 border-b border-[#DDD5CC] flex items-center space-x-3 bg-white/50">
            <div className="w-11 h-11 rounded-xl bg-[#2B2420] text-[#FAF8F5] flex items-center justify-center font-bold text-lg shadow-sm font-heading">
              {activeWsInitial}
            </div>
            <div>
              <h3 className="font-bold text-[#2B2420] text-sm truncate max-w-[170px] font-heading">{activeWsName}</h3>
              <p className="text-[11px] text-[#7D7268] font-medium">
                {activeWs ? Object.keys(activeWs.members || {}).length : 0} members • Maison Privée
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-3 grid grid-cols-2 gap-2 border-b border-[#DDD5CC]">
            <button 
              onClick={() => { if (onOpenSettings) onOpenSettings(); setIsOpen(false); }}
              className="flex items-center justify-center py-1.5 px-2 rounded-lg border border-[#DDD5CC] text-xs font-bold text-[#2B2420] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
            >
              <Settings size={14} className="mr-1.5" /> Settings
            </button>
            <button onClick={handleInviteClick} className="flex items-center justify-center py-1.5 px-2 rounded-lg border border-[#DDD5CC] text-xs font-bold text-[#2B2420] hover:bg-[#FAF8F5] transition-colors cursor-pointer">
              <UserPlus size={14} className="mr-1.5" /> Invite
            </button>
          </div>

          {/* Switch Workspaces */}
          <div className="p-2">
            <div className="px-2 py-1 text-[11px] font-bold text-text-secondary uppercase tracking-wider">Switch Workspaces</div>
            <div className="max-h-[120px] overflow-y-auto custom-scrollbar">
              {workspaces.map(ws => (
                <button 
                  key={ws.id}
                  onClick={() => { setActiveWorkspaceId(ws.id); setIsOpen(false); }}
                  className={`w-full flex items-center px-2 py-2 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors ${activeWorkspaceId === ws.id ? 'bg-primary/5 text-primary font-bold' : 'text-text-primary'}`}
                >
                  <div className="w-6 h-6 rounded-md bg-primary text-white flex items-center justify-center font-bold text-xs mr-3 shadow-sm">
                    {ws.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="truncate">{ws.name}</span>
                </button>
              ))}
            </div>
            
            {isCreating ? (
              <form onSubmit={handleCreateWorkspace} className="mt-2 px-2 pb-2">
                <input 
                  type="text" 
                  autoFocus
                  value={newWsName}
                  onChange={e => setNewWsName(e.target.value)}
                  placeholder="Workspace Name"
                  className="w-full border border-[var(--color-border)] rounded-md px-2 py-1.5 text-sm focus:outline-none focus:border-primary"
                />
                <div className="flex justify-end mt-2 space-x-2">
                  <button type="button" onClick={() => setIsCreating(false)} className="text-xs text-text-secondary font-bold">Cancel</button>
                  <button type="submit" className="text-xs bg-primary text-white px-2 py-1 rounded font-bold">Create</button>
                </div>
              </form>
            ) : (
              <button 
                onClick={() => setIsCreating(true)}
                className="w-full mt-1 flex items-center justify-center py-2 rounded-lg border border-dashed border-[var(--color-border)] hover:bg-gray-50 text-sm font-medium text-text-secondary transition-colors"
              >
                <Plus size={14} className="mr-2" /> Create Workspace
              </button>
            )}
          </div>
        </div>
      )}

      {/* Project Selection Modal for Invites */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center" onClick={() => setShowInviteModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-text-primary mb-4">Invite to Project</h3>
            <p className="text-sm text-text-secondary mb-4">Select a project in this workspace to generate an invite link.</p>
            
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {projects.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No projects in this workspace yet.</p>
              ) : (
                projects.map(proj => (
                  <div key={proj.id} className="flex items-center justify-between p-3 border border-[var(--color-border)] rounded-xl hover:border-primary/30 transition-colors">
                    <span className="font-bold text-sm text-text-primary">{proj.title}</span>
                    <button 
                      onClick={() => handleGenerateProjectLink(proj.id)}
                      className="text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-lg font-bold hover:bg-primary hover:text-white transition-colors"
                    >
                      Copy Link
                    </button>
                  </div>
                ))
              )}
            </div>
            
            <div className="mt-6 flex justify-end">
              <button onClick={() => setShowInviteModal(false)} className="text-sm font-bold text-text-secondary">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
