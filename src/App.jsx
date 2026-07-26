import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import TopNav from './components/TopNav';
import DashboardView from './components/DashboardView';
import TasksView from './components/TasksView';
import ProjectsView from './components/ProjectsView';
import ChecklistView from './components/ChecklistView';
import TeamView from './components/TeamView';
import ActivityView from './components/ActivityView';
import LoginPage from './components/LoginPage';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { BrowserRouter, Routes, Route, useSearchParams } from 'react-router-dom';
import InviteHandler from './components/InviteHandler';
import WorkspaceInviteHandler from './components/WorkspaceInviteHandler';
import NotificationManager from './components/NotificationManager';
import SettingsView from './components/SettingsView';
import ProfileModal from './components/ProfileModal';

function MainApp() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [user, setUser] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'Dashboard');
  const [activeWorkspaceId, setActiveWorkspaceId] = useState(searchParams.get('ws') || null);
  const [activeProjectId, setActiveProjectId] = useState(searchParams.get('proj') || null);
  const [loading, setLoading] = useState(true);

  // Profile Modal State & User Profile Details
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [userProfile, setUserProfile] = useState({
    name: 'Manikandan',
    email: 'manikandan@nayaruvi.com',
    role: 'Product Manager',
    avatar: 'https://ui-avatars.com/api/?name=Manikandan&background=2B2420&color=FAF8F5',
    bio: 'Building modern digital products at Nayaruvi.'
  });

  // Sync tab state with URL
  useEffect(() => {
    const newParams = new URLSearchParams(searchParams);
    let changed = false;
    
    if (activeTab !== newParams.get('tab')) {
      newParams.set('tab', activeTab);
      changed = true;
    }
    if (activeWorkspaceId && activeWorkspaceId !== newParams.get('ws')) {
      newParams.set('ws', activeWorkspaceId);
      changed = true;
    }
    if (activeProjectId && activeProjectId !== newParams.get('proj')) {
      newParams.set('proj', activeProjectId);
      changed = true;
    }
    
    if (changed) {
      setSearchParams(newParams, { replace: true });
    }
  }, [activeTab, activeWorkspaceId, activeProjectId, searchParams, setSearchParams]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setUserProfile(prev => ({
          ...prev,
          email: currentUser.email || prev.email,
          name: currentUser.displayName || prev.name
        }));
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#DFD6AE]">
        <div className="w-8 h-8 rounded-full border-4 border-[#274245] border-t-transparent animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="flex h-screen w-full bg-[#DFD6AE] text-[#274245] overflow-hidden font-sans">
      <Sidebar 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        activeWorkspaceId={activeWorkspaceId}
        setActiveWorkspaceId={setActiveWorkspaceId}
        activeProjectId={activeProjectId}
        setActiveProjectId={setActiveProjectId}
        userProfile={userProfile}
        onOpenProfileModal={() => setIsProfileModalOpen(true)}
      />
      
      <main className="flex-1 flex flex-col min-w-0 transition-all duration-300 relative bg-[#DFD6AE]">
        <TopNav toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
        
        <div className="flex-1 overflow-auto custom-scrollbar relative">
          {activeTab === 'Dashboard' && <DashboardView activeWorkspaceId={activeWorkspaceId} />}
          {activeTab === 'Projects' && <ProjectsView activeWorkspaceId={activeWorkspaceId} setActiveProjectId={setActiveProjectId} setActiveTab={setActiveTab} />}
          {activeTab === 'Tasks' && <TasksView activeWorkspaceId={activeWorkspaceId} activeProjectId={activeProjectId} />}
          {activeTab === 'Checklist' && <ChecklistView activeWorkspaceId={activeWorkspaceId} activeProjectId={activeProjectId} />}
          {activeTab === 'Team' && <TeamView activeWorkspaceId={activeWorkspaceId} activeProjectId={activeProjectId} />}
          {activeTab === 'Activity' && <ActivityView activeWorkspaceId={activeWorkspaceId} activeProjectId={activeProjectId} />}
          {activeTab === 'Settings' && <SettingsView activeWorkspaceId={activeWorkspaceId} />}
        </div>
        <NotificationManager />
      </main>

      {/* Interactive Profile Modal */}
      <ProfileModal 
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        profile={userProfile}
        onSave={(updatedProfile) => setUserProfile(updatedProfile)}
      />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/invite/:projectId" element={<InviteHandler />} />
        <Route path="/invite-ws/:workspaceId" element={<WorkspaceInviteHandler />} />
        <Route path="*" element={<MainApp />} />
      </Routes>
    </BrowserRouter>
  );
}
