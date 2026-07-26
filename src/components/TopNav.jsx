import React, { useState, useEffect } from 'react';
import { Menu, Search, Bell, Check, MessageSquare } from 'lucide-react';
import { db, auth } from '../firebase';
import { ref, onValue } from 'firebase/database';

export default function TopNav({ toggleSidebar }) {
  const [notifications, setNotifications] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    const activityRef = ref(db, 'dashboard_activity');
    const unsubscribe = onValue(activityRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const activities = Object.values(data);
        const myTaskAssignments = activities.filter(a => 
          a.type === 'task_assignment' && 
          auth.currentUser && 
          a.targetUserId === auth.currentUser.uid
        ).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 5); // get last 5
        
        setNotifications(myTaskAssignments);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <header className="h-[64px] md:h-[72px] bg-[var(--color-background)] border-b border-[var(--color-border)] flex items-center justify-between px-4 md:px-8 sticky top-0 z-20">
      <div className="flex items-center flex-1 min-w-0">
        <button 
          onClick={toggleSidebar}
          className="mr-3 md:mr-6 text-text-secondary hover:text-text-primary transition-colors xl:hidden shrink-0"
        >
          <Menu size={20} />
        </button>
        
        {/* Modern Search Bar */}
        <div className="relative w-full max-w-[480px] hidden sm:block">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" />
          <input 
            type="text" 
            placeholder="Search projects, tasks..." 
            className="w-full bg-[#FAF7EC] border border-[#D4C99E] rounded-[20px] pl-11 pr-12 py-2 md:py-2.5 text-xs md:text-sm text-[#274245] focus:outline-none focus:border-[#274245] transition-all shadow-xs placeholder:text-[#5C6E6F] font-medium"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded-[6px] bg-[#E8E0BF] border border-[#D4C99E] text-[10px] font-bold text-[#274245]">
            ⌘ K
          </div>
        </div>
      </div>

      {/* Right Side Tools */}
      <div className="flex items-center space-x-3 ml-2 md:ml-4 shrink-0 relative">
        <button 
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          title="Notifications"
          className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-colors relative shadow-xs cursor-pointer ${
            isDropdownOpen 
              ? 'bg-[#274245] border-[#274245] text-[#FAF7EC]' 
              : 'bg-[#FAF7EC] border-[#D4C99E] text-[#274245] hover:bg-[#E8E0BF]'
          }`}
        >
          <Bell size={18} />
          {notifications.length > 0 && (
            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full border border-white"></span>
          )}
        </button>

        {isDropdownOpen && (
          <div className="absolute top-14 right-0 w-80 bg-white border border-[#D4C99E] rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="p-4 border-b border-[#D4C99E]/50 flex items-center justify-between bg-[#FAF7EC]">
              <h3 className="font-bold text-[#274245] text-sm font-heading">Notifications</h3>
              <span className="text-[10px] bg-[#E8E0BF] text-[#274245] px-2 py-0.5 rounded-full font-bold">{notifications.length} New</span>
            </div>
            <div className="max-h-80 overflow-y-auto custom-scrollbar">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-[#5C6E6F] text-xs font-medium italic">
                  No new notifications
                </div>
              ) : (
                notifications.map((notif, i) => (
                  <div key={i} className="p-4 border-b border-[#D4C99E]/20 hover:bg-[#FAF7EC] transition-colors flex items-start gap-3 cursor-pointer">
                    <div className="w-8 h-8 rounded-full bg-[#274245]/10 text-[#274245] flex items-center justify-center shrink-0 mt-0.5">
                      <MessageSquare size={14} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#274245] mb-0.5 leading-tight">
                        {notif.user} assigned a task to you
                      </h4>
                      <p className="text-[11px] text-[#5C6E6F] font-medium line-clamp-2 leading-snug">
                        "{notif.content}"
                      </p>
                      <span className="text-[9px] text-[#5C6E6F] font-bold mt-1.5 block opacity-70">
                        {new Date(notif.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
