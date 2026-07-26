import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { ref, onValue, push, set, remove, update } from 'firebase/database';
import { Video, Megaphone, Send, Pencil, Trash2, X, Check } from 'lucide-react';

export default function ActivityView({ activeWorkspaceId, activeProjectId }) {
  const [activities, setActivities] = useState([]);
  const [projects, setProjects] = useState([]);
  const [newAnnouncement, setNewAnnouncement] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState('');

  useEffect(() => {
    if (!activeWorkspaceId) {
      setActivities([]);
      setProjects([]);
      return;
    }

    // Activities
    const actRef = ref(db, 'dashboard_activity');
    const unsubscribeAct = onValue(actRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        let actList = Object.keys(data).map(key => ({ id: key, ...data[key] }));
        if (activeProjectId) {
          actList = actList.filter(a => a.projectId === activeProjectId);
        } else {
          actList = actList.filter(a => a.workspaceId === activeWorkspaceId);
        }
        actList.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        setActivities(actList);
      } else {
        setActivities([]);
      }
    });

    // Projects for dropdown
    const projRef = ref(db, 'dashboard_projects');
    const unsubscribeProj = onValue(projRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const projList = Object.keys(data).map(key => ({ id: key, ...data[key] }));
        // Filter projects by workspace and user role
        const leaderProjs = projList.filter(p => {
          if (p.workspaceId !== activeWorkspaceId) return false;
          if (!p.members) return false;
          const userMember = Object.values(p.members).find(m => m.uid === auth.currentUser?.uid);
          return userMember && (userMember.role === 'Founder' || userMember.role === 'Co-Founder' || userMember.role === 'Admin');
        });
        setProjects(leaderProjs);
      } else {
        setProjects([]);
      }
    });

    return () => {
      unsubscribeAct();
      unsubscribeProj();
    };
  }, []);

  const handlePostAnnouncement = async (e) => {
    e.preventDefault();
    if (!newAnnouncement.trim() || !activeWorkspaceId) return;

    try {
      const actRef = push(ref(db, 'dashboard_activity'));
      await set(actRef, {
        user: auth.currentUser.displayName || auth.currentUser.email.split('@')[0],
        action: 'posted an announcement',
        target: activeProjectId ? `in ${projects.find(p => p.id === activeProjectId)?.title || 'Project'}` : 'to the Workspace',
        content: newAnnouncement,
        type: 'announcement',
        workspaceId: activeWorkspaceId,
        projectId: activeProjectId || null,
        uid: auth.currentUser.uid,
        timestamp: new Date().toISOString()
      });
      setNewAnnouncement('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this activity?')) return;
    try {
      await remove(ref(db, `dashboard_activity/${id}`));
    } catch (err) {
      console.error("Delete activity error:", err);
    }
  };

  const handleUpdate = async (id) => {
    if (!editContent.trim()) return;
    try {
      await update(ref(db, `dashboard_activity/${id}`), {
        content: editContent,
        edited: true
      });
      setEditingId(null);
      setEditContent('');
    } catch (err) {
      console.error("Update activity error:", err);
    }
  };

  const renderContent = (content) => {
    if (!content) return null;
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = content.split(urlRegex);
    
    return parts.map((part, i) => {
      if (part.match(urlRegex)) {
        const isMeet = part.includes('meet.google.com');
        return (
          <a 
            key={i} 
            href={part} 
            target="_blank" 
            rel="noopener noreferrer" 
            className={`inline-flex items-center font-bold ${isMeet ? 'text-primary bg-primary/10 px-2 py-1 rounded-md' : 'text-blue-500 hover:underline'}`}
          >
            {isMeet && <Video size={14} className="mr-1" />}
            {part}
          </a>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className="flex h-full w-full flex-col p-4 md:p-8 bg-[#DFD6AE] overflow-y-auto custom-scrollbar">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-normal text-[#274245] tracking-wide mb-1 font-heading uppercase">
            Activity & Announcements
          </h2>
          <p className="text-sm font-medium text-[#5C6E6F]">
            Stay updated with your workspace announcements, team actions, and meeting links.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {activities.length === 0 ? (
            <div className="celestique-card rounded-2xl p-12 text-center text-[#5C6E6F]">
              <p className="text-sm font-semibold">No activity recorded yet in this workspace.</p>
            </div>
          ) : (
            activities.map(act => (
              <div key={act.id} className="celestique-card rounded-2xl p-5 flex items-start text-[#274245]">
                <div className="w-10 h-10 rounded-xl bg-[#274245] text-[#FAF7EC] flex items-center justify-center mr-4 shrink-0 font-bold text-sm shadow-sm font-heading">
                  {act.user.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <p className="text-sm text-[#274245] font-medium mb-1">
                      <span className="font-extrabold text-[#274245]">{act.user}</span> {act.action} <span className="font-extrabold text-[#274245]">{act.target}</span>
                    </p>
                    
                    {/* Action buttons (Edit/Delete) */}
                    {(act.uid === auth.currentUser?.uid || act.user === auth.currentUser?.displayName || act.user === auth.currentUser?.email?.split('@')[0]) && (
                      <div className="flex items-center space-x-2 ml-4">
                        <button 
                          onClick={() => {
                            setEditingId(act.id);
                            setEditContent(act.content);
                          }}
                          className="text-[#5C6E6F] hover:text-[#274245] transition-colors p-1"
                          title="Edit"
                        >
                          <Pencil size={14} />
                        </button>
                        <button 
                          onClick={() => handleDelete(act.id)}
                          className="text-[#5C6E6F] hover:text-red-600 transition-colors p-1"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>

                  {editingId === act.id ? (
                    <div className="mt-2.5">
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full bg-white border border-[#274245] rounded-xl p-3 text-sm text-[#274245] focus:outline-none focus:ring-1 focus:ring-[#274245] resize-none mb-2"
                        rows={3}
                      />
                      <div className="flex justify-end space-x-2">
                        <button 
                          onClick={() => setEditingId(null)}
                          className="text-xs font-bold text-[#5C6E6F] hover:text-[#274245] px-3 py-1.5"
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={() => handleUpdate(act.id)}
                          className="bg-[#274245] text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-[#1A2C2E]"
                        >
                          Save Changes
                        </button>
                      </div>
                    </div>
                  ) : act.content ? (
                    <div className="mt-2.5 p-3.5 bg-white rounded-xl text-sm text-[#274245] whitespace-pre-wrap border border-[#D4C99E] font-medium overflow-wrap-anywhere">
                      {renderContent(act.content)}
                    </div>
                  ) : null}

                  <span className="text-[11px] font-semibold text-[#5C6E6F] mt-2 block">
                    {new Date(act.timestamp).toLocaleString()}
                    {act.edited && <span className="italic ml-2">(edited)</span>}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        <div>
          <div className="celestique-card rounded-2xl p-6 sticky top-0 text-[#274245]">
            <h3 className="font-normal text-[#2B2420] text-lg mb-3 tracking-wide flex items-center font-heading uppercase">
              <Megaphone size={18} className="mr-2 text-[#2B2420]" /> Post Announcement
            </h3>
            
            <form onSubmit={handlePostAnnouncement} className="space-y-4">
              {projects.length > 0 && (
                <div className="mb-2 text-xs font-bold text-[#7D7268] uppercase tracking-wider">
                  {activeProjectId ? 'Posting to Project' : 'Posting to Workspace'}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-[#7D7268] mb-1.5">Announcement Content</label>
                <textarea
                  rows={4}
                  value={newAnnouncement}
                  onChange={(e) => setNewAnnouncement(e.target.value)}
                  placeholder="Share a status update or Google Meet link..."
                  className="w-full bg-white border border-[#DDD5CC] rounded-xl p-3 text-xs font-medium text-[#2B2420] focus:outline-none focus:border-[#2B2420] resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 btn-matte-primary rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center cursor-pointer font-heading"
              >
                <Send size={14} className="mr-2" /> Post Announcement
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
