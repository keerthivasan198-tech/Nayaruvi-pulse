import React from 'react';
import { 
  Home, Folder, CheckSquare, Calendar, 
  Users, Activity, BarChart2, Settings,
  Crown, ChevronDown, CheckCircle2, MessageSquare, ListTodo
} from 'lucide-react';
import WorkspaceSelector from './WorkspaceSelector';

export default function Sidebar({ 
  isOpen, setIsOpen, activeTab, setActiveTab, activeWorkspaceId, setActiveWorkspaceId, 
  userProfile, onOpenProfileModal 
}) {
  if (!isOpen) return null;

  return (
    <aside className="w-[260px] flex-shrink-0 bg-[#274245] text-[#DFD6AE] border-r border-[#1C3235] flex flex-col h-full z-10 shadow-sapling-lg">
      {/* Brand Logo */}
      <div className="h-[72px] flex items-center px-6 cursor-pointer shrink-0">
        <div className="w-9 h-9 rounded-xl bg-[#DFD6AE] text-[#274245] flex items-center justify-center mr-3.5 shadow-md font-bold">
          <CheckCircle2 size={20} strokeWidth={2.5} />
        </div>
        <div className="flex flex-col">
          <span className="text-2xl font-bold tracking-widest text-[#DFD6AE] leading-none font-heading uppercase">Nayaruvi</span>
          <span className="text-[9px] font-semibold text-[#DFD6AE]/75 tracking-widest uppercase mt-1">Workspace</span>
        </div>
      </div>

      <div className="px-4">
        <WorkspaceSelector 
          activeWorkspaceId={activeWorkspaceId} 
          setActiveWorkspaceId={setActiveWorkspaceId} 
          onOpenSettings={() => setActiveTab('Settings')}
        />
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar px-4 space-y-1.5 pt-1">
        <NavItem icon={<Home size={18} />} label="Dashboard" active={activeTab === 'Dashboard'} onClick={() => setActiveTab('Dashboard')} />
        <NavItem icon={<Folder size={18} />} label="Projects" active={activeTab === 'Projects'} onClick={() => setActiveTab('Projects')} />
        <NavItem icon={<CheckSquare size={18} />} label="Tasks" active={activeTab === 'Tasks'} onClick={() => setActiveTab('Tasks')} />
        <NavItem icon={<ListTodo size={18} />} label="Checklist" active={activeTab === 'Checklist'} onClick={() => setActiveTab('Checklist')} />
        <NavItem icon={<Users size={18} />} label="Team" active={activeTab === 'Team'} onClick={() => setActiveTab('Team')} />
        <NavItem icon={<Activity size={18} />} label="Activity" active={activeTab === 'Activity'} onClick={() => setActiveTab('Activity')} />
        <NavItem icon={<Settings size={18} />} label="Settings" active={activeTab === 'Settings'} onClick={() => setActiveTab('Settings')} />
      </div>

      {/* User Profile Footer (Single Place Down in Left Corner) */}
      <div className="p-4 border-t border-[#1C3235] bg-black/15">
        <div 
          onClick={onOpenProfileModal}
          className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/10 border border-transparent hover:border-white/15 cursor-pointer transition-all duration-150 group"
          title="Click to view & edit profile"
        >
          <div className="flex items-center">
            <div className="w-9 h-9 rounded-full bg-[#DFD6AE] p-[2px] shadow-xs">
              <img 
                src={userProfile?.avatar || "https://ui-avatars.com/api/?name=Manikandan&background=274245&color=DFD6AE"} 
                alt="User" 
                className="w-full h-full rounded-full border-2 border-[#274245] object-cover" 
              />
            </div>
            <div className="ml-3 flex flex-col">
              <span className="text-xs font-bold text-[#DFD6AE] leading-tight group-hover:underline">{userProfile?.name || "Manikandan"}</span>
              <span className="text-[11px] text-[#DFD6AE]/75 font-medium">{userProfile?.role || "Product Manager"}</span>
            </div>
          </div>
          <ChevronDown size={14} className="text-[#DFD6AE]/75 group-hover:text-white" />
        </div>
      </div>
    </aside>
  );
}

function NavItem({ icon, label, active, onClick }) {
  return (
    <div 
      onClick={onClick}
      className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl cursor-pointer transition-all duration-150 group ${
      active 
      ? 'bg-[#DFD6AE] text-[#274245] font-bold shadow-md' 
      : 'text-[#DFD6AE]/80 hover:text-white hover:bg-white/10 font-medium border border-transparent'
    }`}>
      <div className="flex items-center">
        <div className={`mr-3.5 transition-colors ${active ? 'text-[#274245]' : 'text-[#DFD6AE]/75 group-hover:text-white'}`}>{icon}</div>
        <span className="text-[14px] tracking-tight">{label}</span>
      </div>
      {active && <div className="w-1.5 h-1.5 rounded-full bg-[#274245]"></div>}
    </div>
  );
}
