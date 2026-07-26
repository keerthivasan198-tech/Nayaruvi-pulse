import React, { useEffect, useState, useRef } from 'react';
import { db, auth } from '../firebase';
import { ref, onValue } from 'firebase/database';
import { Bell, X, MessageSquare } from 'lucide-react';

export default function NotificationManager() {
  const [notifications, setNotifications] = useState([]);
  const initialLoadDone = useRef(false);
  const lastActivityCount = useRef(0);

  useEffect(() => {
    const activityRef = ref(db, 'dashboard_activity');
    const unsubscribe = onValue(activityRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const activities = Object.values(data);
        
        // Skip firing notifications on the very first load
        if (!initialLoadDone.current) {
          initialLoadDone.current = true;
          lastActivityCount.current = activities.length;
          return;
        }

        // Check if there are new activities
        if (activities.length > lastActivityCount.current) {
          const newActivities = activities.slice(lastActivityCount.current);
          lastActivityCount.current = activities.length;

          newActivities.forEach(activity => {
            // Only notify if it's a message targeted at the current user
            if (
              activity.type === 'message' && 
              auth.currentUser && 
              activity.target === (auth.currentUser.displayName || auth.currentUser.email.split('@')[0])
            ) {
              const newNotif = {
                id: Date.now() + Math.random(),
                title: `New message from ${activity.user}`,
                content: activity.content
              };
              
              setNotifications(prev => [...prev, newNotif]);
              
              // Auto-dismiss after 5 seconds
              setTimeout(() => {
                setNotifications(prev => prev.filter(n => n.id !== newNotif.id));
              }, 5000);
            }
          });
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const dismiss = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  if (notifications.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-3 pointer-events-none">
      {notifications.map(notif => (
        <div 
          key={notif.id} 
          className="bg-white rounded-xl shadow-2xl border border-[var(--color-border)] p-4 w-80 flex items-start gap-4 pointer-events-auto animate-in slide-in-from-bottom-5 fade-in duration-300"
        >
          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-1">
            <MessageSquare size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-text-primary mb-1 truncate">{notif.title}</h4>
            <p className="text-xs font-medium text-text-secondary line-clamp-2">{notif.content}</p>
          </div>
          <button 
            onClick={() => dismiss(notif.id)}
            className="text-text-secondary hover:text-danger shrink-0 transition-colors mt-1"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}
