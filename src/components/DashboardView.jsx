import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, Clock, AlertCircle, FolderOpen, 
  Plus, X
} from 'lucide-react';
import { auth } from '../firebase';

const API_URL = 'http://localhost:5000/api';

export default function DashboardView({ activeWorkspaceId }) {
  const [projects, setProjects] = useState([]);
  const [activities, setActivities] = useState([]);
  
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [newProject, setNewProject] = useState({ title: '', category: '', dueDays: '7' });

  // Load Data from MongoDB
  const fetchData = async () => {
    if (!activeWorkspaceId || !auth.currentUser) {
      setProjects([]);
      setActivities([]);
      return;
    }

    try {
      // Fetch Projects
      const projRes = await fetch(`${API_URL}/projects/workspace/${activeWorkspaceId}/user/${auth.currentUser.uid}`);
      if (projRes.ok) {
        const myProjects = await projRes.json();
        // Sort descending
        myProjects.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        setProjects(myProjects);
      }

      // Fetch Activities
      const actRes = await fetch(`${API_URL}/activity/${activeWorkspaceId}`);
      if (actRes.ok) {
        const actList = await actRes.json();
        setActivities(actList.slice(0, 5)); // Keep top 5 latest
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [activeWorkspaceId]);

  const logActivity = async (action, target, type) => {
    try {
      await fetch(`${API_URL}/activity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user: auth.currentUser?.displayName || 'User',
          action,
          target,
          type,
          workspaceId: activeWorkspaceId,
          timestamp: new Date().toISOString()
        })
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!newProject.title || !auth.currentUser) return;

    try {
      const res = await fetch(`${API_URL}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newProject.title,
          status: 'Active',
          category: newProject.category || 'General',
          workspaceId: activeWorkspaceId,
          uid: auth.currentUser.uid,
          email: auth.currentUser.email,
          displayName: auth.currentUser.displayName || auth.currentUser.email.split('@')[0],
          dueDate: new Date(Date.now() + parseInt(newProject.dueDays) * 24 * 60 * 60 * 1000).toISOString()
        })
      });
      
      if (res.ok) {
        await logActivity('created project', newProject.title, 'project');
        setIsProjectModalOpen(false);
        setNewProject({ title: '', category: '', dueDays: '7' });
        fetchData();
      }
    } catch (error) {
      console.error("Create project error:", error);
    }
  };

  const activeProjectsCount = projects.length;

  return (
    <div className="flex h-full w-full bg-[#DFD6AE]">
      {/* Main Column */}
      <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
        
        {/* Welcome Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-normal text-[#274245] tracking-wide mb-1 font-heading uppercase">
              Workspace Overview
            </h2>
            <p className="text-sm font-medium text-[#5C6E6F]">
              A curated view of your active creations and team movements.
            </p>
          </div>
          <button 
            onClick={() => setIsProjectModalOpen(true)}
            className="flex items-center px-5 py-2.5 btn-matte-primary rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer font-heading"
          >
            <Plus size={16} className="mr-1.5" strokeWidth={2.5} />
            New Project
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard 
            icon={<CheckCircle2 size={22} className="text-[#274245]" />} 
            title="Tasks Completed" value={0} 
            accent="bg-[#274245]/5 border-[#274245]/15"
          />
          <StatCard 
            icon={<Clock size={22} className="text-amber-700" />} 
            title="In Progress" value={0} 
            accent="bg-amber-500/10 border-amber-500/20"
          />
          <StatCard 
            icon={<FolderOpen size={22} className="text-[#274245]" />} 
            title="Active Projects" value={activeProjectsCount} 
            accent="bg-[#274245]/5 border-[#274245]/15"
          />
        </div>

        {/* Projects Overview */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-normal text-[#274245] tracking-wide font-heading uppercase">Active Projects</h3>
            <span className="text-xs font-semibold text-[#274245] bg-[#FAF7EC] px-3 py-1 rounded-full border border-[#D4C99E] shadow-xs">
              {projects.length} Total
            </span>
          </div>
          
          <div className="celestique-card rounded-2xl overflow-hidden text-[#274245]">
            {projects.length === 0 ? (
              <div className="p-12 text-center text-[#5C6E6F]">
                <div className="w-12 h-12 rounded-2xl bg-[#E8E0BF] border border-[#C9BD91] flex items-center justify-center mx-auto mb-3">
                  <FolderOpen size={24} className="text-[#274245]" />
                </div>
                <h4 className="text-[#274245] font-bold text-sm mb-1 font-heading">No Projects Found</h4>
                <p className="font-medium text-xs max-w-xs mx-auto text-[#5C6E6F]">Create your first project in this workspace to start tracking tasks and activity.</p>
              </div>
            ) : (
              projects.map((proj, i) => (
                <ProjectRow 
                  key={proj.id}
                  iconBg="bg-[#274245]" 
                  title={proj.title} 
                  category={proj.category} 
                  progress={proj.progress || 0} 
                  due={proj.dueDays ? `Due in ${proj.dueDays} days` : 'Active'} 
                  borderBottom={i !== projects.length - 1} 
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Right Side Panel */}
      <div className="w-[340px] flex-shrink-0 bg-[#BEB3A7]/90 backdrop-blur-2xl border-l border-[#D8CFCE] overflow-y-auto custom-scrollbar hidden xl:block">
        
        {/* Activity Feed */}
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-normal text-[#2B2420] text-lg tracking-wide font-heading uppercase">Recent Activity</h3>
            <span className="w-2 h-2 rounded-full bg-[#2B2420] animate-pulse"></span>
          </div>
          <div className="space-y-4">
            {activities.length === 0 ? (
              <div className="p-6 text-center text-[#2B2420]/70 border border-dashed border-[#DDD5CC] rounded-xl bg-[#FAF8F5]/40">
                <p className="text-xs font-semibold">No activity recorded yet.</p>
              </div>
            ) : (
              activities.map(act => (
                <ActivityItem 
                  key={act.id} 
                  user={act.user} 
                  action={act.action} 
                  target={act.target} 
                  time={formatTimeAgo(act.timestamp)} 
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* New Project Modal */}
      {isProjectModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="celestique-card rounded-2xl w-full max-w-md p-6 animate-in fade-in zoom-in duration-200 text-[#2B2420]">
            <div className="flex justify-between items-center mb-5 border-b border-[#DDD5CC] pb-3">
              <h3 className="text-lg font-extrabold text-[#2B2420] font-heading">Create New Project</h3>
              <button onClick={() => setIsProjectModalOpen(false)} className="text-[#7D7268] hover:text-[#2B2420] transition-colors p-1 rounded-lg hover:bg-black/5">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateProject}>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#4A443E] mb-1.5">Project Name</label>
                  <input 
                    type="text" 
                    required
                    value={newProject.title}
                    onChange={e => setNewProject({...newProject, title: e.target.value})}
                    className="w-full bg-[#FAF8F5] border border-[#DDD5CC] rounded-xl px-3.5 py-2.5 text-sm text-[#2B2420] font-medium focus:outline-none focus:border-[#2B2420] focus:bg-white transition-all"
                    placeholder="e.g. Mobile App Launch"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#4A443E] mb-1.5">Category</label>
                  <input 
                    type="text" 
                    value={newProject.category}
                    onChange={e => setNewProject({...newProject, category: e.target.value})}
                    className="w-full bg-[#FAF8F5] border border-[#DDD5CC] rounded-xl px-3.5 py-2.5 text-sm text-[#2B2420] font-medium focus:outline-none focus:border-[#2B2420] focus:bg-white transition-all"
                    placeholder="e.g. iOS Development"
                  />
                </div>
              </div>
              <div className="mt-6 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsProjectModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold text-[#2B2420] btn-matte-secondary cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold text-[#FAF8F5] btn-matte-primary cursor-pointer"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Sub-components

function StatCard({ icon, title, value, accent }) {
  return (
    <div className="celestique-card rounded-2xl p-5 flex items-center justify-between relative overflow-hidden group transition-all text-[#2B2420]">
      <div className="flex items-center">
        <div className={`w-12 h-12 rounded-xl border flex items-center justify-center mr-4 shadow-2xs shrink-0 ${accent}`}>
          {icon}
        </div>
        <div>
          <span className="text-2xl font-extrabold text-[#2B2420] block leading-none mb-1 tracking-tight font-heading">{value}</span>
          <h4 className="text-[#7D7268] text-xs font-bold">{title}</h4>
        </div>
      </div>
    </div>
  );
}

function ProjectRow({ iconBg, title, category, progress, due, borderBottom = true }) {
  return (
    <div className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-gray-50 transition-colors ${borderBottom ? 'border-b border-gray-100' : ''}`}>
      <div className="flex items-center sm:w-[40%] mb-3 sm:mb-0">
        <div className={`w-10 h-10 rounded-xl ${iconBg} text-white flex items-center justify-center mr-4 shadow-sm shrink-0`}>
          <FolderOpen size={18} strokeWidth={2.2} />
        </div>
        <div>
          <h4 className="font-bold text-[#1F2825] text-sm line-clamp-1 tracking-tight">{title}</h4>
          <p className="text-[11px] font-medium text-gray-500 mt-0.5 line-clamp-1">{category || 'General Project'}</p>
        </div>
      </div>
      
      <div className="sm:w-[30%] flex items-center mb-3 sm:mb-0 pr-4">
        <div className="w-full bg-gray-150 h-2 rounded-full overflow-hidden mr-3">
          <div className="bg-[#374D46] h-full rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
        </div>
        <span className="text-xs font-bold text-gray-600 w-8">{progress}%</span>
      </div>

      <div className="sm:w-[20%] flex items-center justify-end">
        <span className="text-xs font-semibold text-gray-600 bg-gray-100 border border-gray-200 px-2.5 py-1 rounded-lg">{due}</span>
      </div>
    </div>
  );
}

function ActivityItem({ user, action, target, time }) {
  return (
    <div className="flex items-start bg-white p-3 rounded-xl border border-white/80 shadow-2xs text-[#1F2825]">
      <div className="relative z-10 mr-3 shrink-0">
        <img src={`https://ui-avatars.com/api/?name=${user}&background=374D46&color=fff`} className="w-7 h-7 rounded-full border border-white shadow-xs" alt="avatar" />
      </div>
      <div className="flex-1">
        <p className="text-xs font-medium text-gray-800 leading-snug">
          <span className="font-bold text-[#1F2825]">{user}</span> {action} <span className="font-bold text-[#1F2825]">{target}</span>
        </p>
        <span className="text-[10px] font-semibold text-gray-400 mt-1 block">{time}</span>
      </div>
    </div>
  );
}

function formatTimeAgo(timestamp) {
  if(!timestamp) return 'Just now';
  const seconds = Math.floor((new Date() - new Date(timestamp)) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
