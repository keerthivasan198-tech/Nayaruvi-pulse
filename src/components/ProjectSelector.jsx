import React, { useState, useEffect, useRef } from 'react';
import { auth } from '../firebase';
import { Folder, FolderOpen, Plus } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://nayaruvi-pulse-zmst.onrender.com/api';

export default function ProjectSelector({ activeWorkspaceId, activeProjectId, setActiveProjectId, onNavigateToProjects }) {
  const [projects, setProjects] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef(null);

  const fetchProjects = async () => {
    if (!activeWorkspaceId || !auth.currentUser) {
      setProjects([]);
      setLoading(false);
      return;
    }
    
    try {
      const res = await fetch(`${API_URL}/projects/workspace/${activeWorkspaceId}/user/${auth.currentUser.uid}`);
      if (res.ok) {
        const data = await res.json();
        const myProjects = data.map(p => ({ id: p._id, ...p }));
        setProjects(myProjects);
        
        // Auto-select if nothing is selected or if current selection is invalid
        if (myProjects.length > 0) {
          if (!activeProjectId || !myProjects.find(p => p.id === activeProjectId)) {
            setActiveProjectId(myProjects[0].id);
          }
        } else {
          setActiveProjectId('');
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
    const interval = setInterval(fetchProjects, 10000);
    return () => clearInterval(interval);
  }, [activeWorkspaceId, activeProjectId]);

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const activeProject = projects.find(p => p.id === activeProjectId);
  const activeProjName = activeProject ? activeProject.title : 'No Project Selected';

  return (
    <div className="relative mt-2" ref={dropdownRef}>
      {/* Selector Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-2.5 rounded-xl bg-[#203A3C] hover:bg-[#1A3032] text-[#DFD6AE] border border-[#2B4A4D] transition-all duration-150 shadow-xs cursor-pointer group"
      >
        <div className="flex items-center space-x-3 truncate">
          <div className="w-8 h-8 rounded-lg bg-[#DFD6AE]/10 text-[#DFD6AE] flex items-center justify-center shrink-0">
            {activeProject ? <FolderOpen size={16} /> : <Folder size={16} />}
          </div>
          <div className="flex flex-col items-start truncate">
            <span className="text-[9px] font-bold text-[#DFD6AE]/60 uppercase tracking-wider leading-tight">Project</span>
            <span className="text-sm font-bold text-[#DFD6AE] truncate">
              {loading && projects.length === 0 ? 'Loading...' : activeProjName}
            </span>
          </div>
        </div>
        <svg className={`w-4 h-4 text-[#DFD6AE]/50 group-hover:text-white transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-full bg-[#FAF8F5] rounded-2xl shadow-celestique-lg border border-[#DDD5CC] z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 text-[#2B2420]">
          
          <div className="p-3 text-[10px] font-black tracking-widest text-[#7D7268] uppercase flex items-center bg-[#F3EFEA] border-b border-[#DDD5CC]">
            <Folder size={12} className="mr-1.5" /> Select Project
          </div>

          <div className="max-h-[220px] overflow-y-auto custom-scrollbar">
            {projects.length === 0 ? (
              <div className="p-4 text-center text-sm font-medium text-[#7D7268]">
                No projects found.
              </div>
            ) : (
              projects.map(proj => (
                <button
                  key={proj.id}
                  onClick={() => {
                    setActiveProjectId(proj.id);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-4 py-3 flex items-center space-x-3 transition-colors ${
                    activeProjectId === proj.id 
                    ? 'bg-[#EFE8DD] text-[#2B2420]' 
                    : 'hover:bg-[#F8F5F1] text-[#4A423A]'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    activeProjectId === proj.id ? 'bg-[#2B2420] text-[#FAF8F5]' : 'bg-[#DDD5CC] text-[#7D7268]'
                  }`}>
                    {activeProjectId === proj.id ? <FolderOpen size={14} /> : <Folder size={14} />}
                  </div>
                  <div className="flex flex-col truncate">
                    <span className="font-bold text-sm truncate">{proj.title}</span>
                    <span className="text-[10px] font-medium opacity-70">
                      {proj.status || 'Active'}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Action Button */}
          <div className="p-2 border-t border-[#DDD5CC] bg-[#F8F5F1]">
            <button
              onClick={() => {
                onNavigateToProjects();
                setIsOpen(false);
              }}
              className="w-full py-2.5 px-3 rounded-xl border border-dashed border-[#C0B4A5] text-[#4A423A] hover:bg-[#EFE8DD] hover:text-[#2B2420] hover:border-[#2B2420] transition-colors flex items-center justify-center text-xs font-bold"
            >
              <Plus size={14} className="mr-1.5" /> Manage Projects
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
