import React, { useState, useEffect } from 'react';
import { FolderOpen, MoreVertical, Link, Plus, CheckCircle2, Shield, User } from 'lucide-react';
import { db, auth } from '../firebase';
import { ref, onValue, update, push, set } from 'firebase/database';

export default function ProjectsView({ activeWorkspaceId }) {
  const [projects, setProjects] = useState([]);
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [copySuccessId, setCopySuccessId] = useState(null);
  const [managingProject, setManagingProject] = useState(null); // The project currently managing members
  const [newProject, setNewProject] = useState({ title: '', status: 'Active' });
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!newProject.title.trim()) return;
    if (!activeWorkspaceId) {
      alert("Please create or select a workspace first!");
      return;
    }

    try {
      const newProjRef = push(ref(db, 'dashboard_projects'));
      const projectData = {
        title: newProject.title,
        status: newProject.status,
        createdAt: new Date().toISOString(),
        workspaceId: activeWorkspaceId,
        members: {
          [auth.currentUser.uid]: {
            uid: auth.currentUser.uid,
            name: auth.currentUser.displayName || auth.currentUser.email.split('@')[0],
            email: auth.currentUser.email,
            role: 'Founder'
          }
        },
        stats: {
          tasks: 0,
          progress: 0,
          members: 1
        }
      };
      
      await set(newProjRef, projectData);
      
      // Also log activity
      const newActivityRef = push(ref(db, 'dashboard_activity'));
      await set(newActivityRef, {
        user: auth.currentUser.displayName || auth.currentUser.email.split('@')[0],
        action: 'created project',
        target: newProject.title,
        timestamp: new Date().toISOString()
      });

      setNewProject({ title: '', status: 'Active' });
      setIsCreating(false);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const projectsRef = ref(db, 'dashboard_projects');
    const unsubscribe = onValue(projectsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const projList = Object.keys(data).map(key => ({ id: key, ...data[key] }));
        // Filter projects by active workspace and user membership
        const workspaceProjects = projList.filter(p => {
          if (p.workspaceId !== activeWorkspaceId) return false;
          if (!p.members) return false;
          return Object.values(p.members).some(m => m.uid === auth.currentUser?.uid);
        });
        setProjects(workspaceProjects);
      } else {
        setProjects([]);
      }
    });
    return () => unsubscribe();
  }, [activeWorkspaceId]);

  const handleGenerateLink = (projectId) => {
    const inviteLink = `${window.location.origin}/invite/${projectId}?workspaceId=${activeWorkspaceId}`;
    navigator.clipboard.writeText(inviteLink).then(() => {
      setCopySuccessId(projectId);
      setActiveMenuId(null);
      setTimeout(() => setCopySuccessId(null), 3000);
    });
  };

  const handlePromote = async (projectId, memberKey, currentRole) => {
    if (currentRole === 'Founder') return;
    try {
      const newRole = currentRole === 'Co-Founder' ? 'Member' : 'Co-Founder';
      const memberRef = ref(db, `dashboard_projects/${projectId}/members/${memberKey}`);
      await update(memberRef, { role: newRole });
    } catch (e) {
      console.error("Failed to update role", e);
    }
  };

  // Check if current user is founder or co-founder for a project
  const isLeader = (project) => {
    if (!project.members) return false;
    const userMember = Object.values(project.members).find(m => m.uid === auth.currentUser?.uid);
    return userMember && (userMember.role === 'Founder' || userMember.role === 'Co-Founder');
  };

  return (
    <div className="flex h-full w-full flex-col p-8 bg-[#DFD6AE] overflow-y-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-normal text-[#274245] tracking-wide mb-1 font-heading uppercase">
            Projects
          </h2>
          <p className="text-sm font-medium text-[#5C6E6F]">
            Manage your project workspace, team members, and permissions.
          </p>
        </div>
        <button 
          onClick={() => setIsCreating(true)}
          className="flex items-center px-5 py-2.5 btn-matte-primary rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer font-heading"
        >
          <Plus size={16} className="mr-1.5" strokeWidth={2.5} />
          New Project
        </button>
      </div>

      <div className="celestique-card rounded-2xl overflow-hidden max-w-4xl text-[#274245]">
        {projects.length === 0 ? (
          <div className="p-12 text-center text-[#7D7268]">
            <div className="w-12 h-12 rounded-2xl bg-[#EBE4DB] border border-[#DDD5CC] flex items-center justify-center mx-auto mb-3">
              <FolderOpen size={24} className="text-[#2B2420]" />
            </div>
            <h4 className="text-[#2B2420] font-bold text-sm mb-1 font-heading">No Projects Found</h4>
            <p className="font-medium text-xs max-w-xs mx-auto text-[#7D7268]">Create a new project to start collaborating with your team.</p>
          </div>
        ) : (
          projects.map((proj, i) => {
            const leader = isLeader(proj);
            const memberCount = proj.members ? Object.keys(proj.members).length : 0;
            return (
              <div key={proj.id} className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-[#F4F0EA] transition-colors ${i !== projects.length - 1 ? 'border-b border-[#DDD5CC]' : ''}`}>
                <div className="flex items-center sm:w-[40%] mb-3 sm:mb-0 cursor-pointer group" onClick={() => leader && setManagingProject(proj)}>
                  <div className="w-10 h-10 rounded-xl bg-[#2B2420] text-[#FAF8F5] flex items-center justify-center mr-4 shadow-sm shrink-0 group-hover:scale-105 transition-transform">
                    <FolderOpen size={18} strokeWidth={2.2} />
                  </div>
                  <div>
                    <h4 className="font-bold text-[#2B2420] text-sm line-clamp-1 tracking-tight group-hover:text-[#8C8075] transition-colors">{proj.title}</h4>
                    <p className="text-[11px] font-medium text-[#7D7268] mt-0.5 line-clamp-1">{memberCount} Members • {proj.status || 'Active'}</p>
                  </div>
                </div>
                
                <div className="sm:w-[30%] flex items-center justify-end relative space-x-2">
                  {copySuccessId === proj.id && (
                    <span className="text-xs font-bold text-[#2B2420] mr-2 flex items-center bg-[#EBE4DB] border border-[#DDD5CC] px-2.5 py-1 rounded-lg">
                      <CheckCircle2 size={13} className="mr-1 text-[#2B2420]" /> Copied Link!
                    </span>
                  )}
                  {leader && (
                    <button 
                      onClick={() => setActiveMenuId(activeMenuId === proj.id ? null : proj.id)}
                      className="text-[#2B2420] hover:text-black p-2 rounded-lg hover:bg-black/10 transition-colors"
                    >
                      <MoreVertical size={16} strokeWidth={2.5} />
                    </button>
                  )}
                  
                  {activeMenuId === proj.id && (
                    <div className="absolute right-0 top-10 mt-1 w-48 bg-[#FAF8F5] rounded-xl shadow-celestique-lg border border-[#DDD5CC] z-20 py-1 animate-in fade-in zoom-in duration-100 text-[#2B2420]">
                      <button 
                        onClick={() => handleGenerateLink(proj.id)}
                        className="w-full text-left px-4 py-2.5 text-xs font-bold text-[#2B2420] hover:bg-[#F4F0EA] flex items-center transition-colors"
                      >
                        <Link size={14} className="mr-2.5 text-[#2B2420]" /> Invite Members
                      </button>
                      <button 
                        onClick={() => { setManagingProject(proj); setActiveMenuId(null); }}
                        className="w-full text-left px-4 py-2.5 text-xs font-bold text-[#2B2420] hover:bg-[#F4F0EA] flex items-center transition-colors"
                      >
                        <User size={14} className="mr-2.5 text-[#7D7268]" /> Manage Roles
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Role Management Modal */}
      {managingProject && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-[20px] w-full max-w-lg p-6 shadow-xl border border-[var(--color-border)] animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-text-primary flex items-center">
                Manage {managingProject.title}
              </h3>
              <button onClick={() => setManagingProject(null)} className="text-text-secondary hover:text-text-primary transition-colors">
                X
              </button>
            </div>
            
            <div className="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar">
              {managingProject.members ? Object.entries(managingProject.members).map(([key, member]) => (
                <div key={key} className="flex items-center justify-between p-3 border border-[var(--color-border)] rounded-[12px] bg-[#F8FAFC]">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center mr-3 font-bold text-xs">
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-text-primary">{member.name}</h4>
                      <p className="text-[11px] font-medium text-text-secondary">{member.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-[6px] mr-3 ${
                      member.role === 'Founder' ? 'bg-primary/10 text-primary' : 
                      member.role === 'Co-Founder' ? 'bg-purple-500/10 text-purple-600' : 'bg-gray-200 text-gray-700'
                    }`}>
                      {member.role === 'Founder' && <Shield size={10} className="inline mr-1" />}
                      {member.role === 'Co-Founder' && <Shield size={10} className="inline mr-1" />}
                      {member.role}
                    </span>
                    {member.role !== 'Founder' && (
                      <button 
                        onClick={() => handlePromote(managingProject.id, key, member.role)}
                        className="text-xs font-bold text-primary hover:underline"
                      >
                        {member.role === 'Co-Founder' ? 'Demote' : 'Promote'}
                      </button>
                    )}
                  </div>
                </div>
              )) : (
                <p className="text-sm text-text-secondary">No members found.</p>
              )}
            </div>

            <div className="mt-6 flex justify-end">
               <button 
                 onClick={() => handleGenerateLink(managingProject.id)}
                 className="flex items-center px-4 py-2 bg-[#F8FAFC] border border-[var(--color-border)] hover:bg-[#F1F5F9] text-text-primary rounded-[12px] text-sm font-bold transition-colors mr-3"
               >
                 <Link size={14} className="mr-2" /> Invite Link
               </button>
               <button 
                 onClick={() => setManagingProject(null)}
                 className="px-6 py-2 bg-primary hover:bg-primary/90 text-white rounded-[12px] text-sm font-bold transition-colors shadow-sm"
               >
                 Done
               </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Project Modal */}
      {isCreating && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-[#FAF7EC] rounded-2xl w-full max-w-sm p-6 shadow-celestique-lg border border-[#DDD5CC] animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-normal text-[#274245] mb-4 font-heading uppercase tracking-wide">Create New Project</h3>
            <form onSubmit={handleCreateProject}>
              <div className="mb-4">
                <label className="block text-xs font-bold text-[#4A443E] mb-1.5">Project Title</label>
                <input 
                  type="text" 
                  value={newProject.title}
                  onChange={e => setNewProject({...newProject, title: e.target.value})}
                  className="w-full bg-white border border-[#DDD5CC] rounded-xl px-3.5 py-2.5 text-sm text-[#274245] font-medium focus:outline-none focus:border-[#274245]"
                  placeholder="e.g. Website Redesign"
                  required
                  autoFocus
                />
              </div>
              <div className="flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsCreating(false)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold border border-[#DDD5CC] text-[#274245] hover:bg-white cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold btn-matte-primary cursor-pointer font-heading uppercase tracking-wide"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function UsersIcon(props) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
