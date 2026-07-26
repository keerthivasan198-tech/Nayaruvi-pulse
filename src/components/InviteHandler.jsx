import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { ref, get, update, push, set } from 'firebase/database';
import { CheckCircle2, Activity } from 'lucide-react';

export default function InviteHandler() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [project, setProject] = useState(null);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const projRef = ref(db, `dashboard_projects/${projectId}`);
        const snapshot = await get(projRef);
        if (snapshot.exists()) {
          setProject(snapshot.val());
        } else {
          setError('Project not found or link is invalid.');
        }
      } catch (err) {
        setError('Error loading project details.');
      }
    };
    if (projectId) fetchProject();
  }, [projectId]);

  useEffect(() => {
    if (error || !project) return;
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // User is signed in, add them to project
        try {
          const membersRef = ref(db, `dashboard_projects/${projectId}/members`);
          const membersSnapshot = await get(membersRef);
          let members = membersSnapshot.val() || {};
          
          // Check if already a member of the project
          const isMember = Object.values(members).some(m => m.email === user.email);
          
          if (!isMember) {
            const newMemberRef = push(membersRef);
            await set(newMemberRef, {
              uid: user.uid,
              name: user.displayName || user.email.split('@')[0],
              email: user.email,
              role: 'Member',
              joinedAt: new Date().toISOString()
            });

            // Log activity in the correct workspace
            const newActivityRef = push(ref(db, 'dashboard_activity'));
            await set(newActivityRef, {
              user: user.displayName || user.email.split('@')[0],
              action: `joined the project via invite link`,
              target: project.title,
              type: 'project',
              workspaceId: project.workspaceId || '',
              timestamp: new Date().toISOString()
            });
          }

          // Ensure user is also added to the workspace's members!
          if (project.workspaceId) {
            const wsMemberRef = ref(db, `dashboard_workspaces/${project.workspaceId}/members/${user.uid}`);
            await update(wsMemberRef, {
              uid: user.uid,
              name: user.displayName || user.email.split('@')[0],
              email: user.email,
              role: 'Member'
            });
          }

          // Redirect to app with workspace and project selected
          navigate(`/?tab=Tasks&ws=${project.workspaceId || ''}&proj=${projectId}`);
        } catch (err) {
          setError('Failed to join project. Check permissions.');
          console.error(err);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [project, error, navigate, projectId]);

  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err) {
      setError(err.message || 'Failed to sign in with Google.');
    }
  };

  if (error) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#DFD6AE] flex-col p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-red-100 text-red-500 flex items-center justify-center mb-4">
          <CheckCircle2 size={32} />
        </div>
        <h2 className="text-2xl font-bold text-[#274245] mb-2 font-heading uppercase">Invite Invalid</h2>
        <p className="text-[#5C6E6F] font-medium">{error}</p>
        <button onClick={() => navigate('/')} className="mt-6 px-6 py-2.5 btn-matte-primary rounded-xl font-bold font-heading uppercase text-xs">Go to Dashboard</button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#DFD6AE]">
        <div className="w-8 h-8 rounded-full border-4 border-[#274245] border-t-transparent animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full items-center justify-center bg-[#DFD6AE] flex-col p-8 text-center">
      <div className="celestique-card rounded-2xl shadow-celestique-lg p-8 max-w-md w-full text-[#274245]">
        <h2 className="text-2xl font-bold text-[#274245] mb-2 font-heading uppercase">You've been invited!</h2>
        <p className="text-[#5C6E6F] font-medium mb-8 text-sm">
          Join the project <span className="font-bold text-[#274245]">{project?.title}</span> on Nayaruvi.
        </p>
        <button 
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center py-3 px-4 bg-white border border-[#D4C99E] rounded-xl text-sm font-bold text-[#274245] hover:bg-[#FAF7EC] transition-colors shadow-sm cursor-pointer"
        >
          <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Sign in with Google to Join
        </button>
      </div>
    </div>
  );
}
