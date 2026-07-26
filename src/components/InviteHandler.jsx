import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { auth } from '../firebase';
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from 'firebase/auth';
import { CheckCircle2 } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://nayaruvi-pulse-zmst.onrender.com/api';

export default function InviteHandler() {
  const { projectId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const workspaceId = searchParams.get('workspaceId');
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [project, setProject] = useState(null);

  useEffect(() => {
    if (!projectId) {
      setError("No project ID provided.");
      setLoading(false);
      return;
    }

    const fetchProject = async () => {
      try {
        const res = await fetch(`${API_URL}/projects/${projectId}`);
        if (!res.ok) {
          setError("Project not found or link is invalid.");
          return;
        }
        const data = await res.json();
        setProject(data);
        
        if (!workspaceId && data.workspaceId) {
          const params = new URLSearchParams(searchParams);
          params.set('workspaceId', data.workspaceId);
          setSearchParams(params, { replace: true });
        }
      } catch (err) {
        setError("Error loading project details.");
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [projectId]);

  useEffect(() => {
    if (error || !project) return;
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await addUserToProjectAndWorkspace(user);
      } else {
        // Redirect to login page
        navigate(`/?invite=${projectId}&workspaceId=${project.workspaceId || workspaceId}`);
      }
    });

    return () => unsubscribe();
  }, [project, error]);

  const addUserToProjectAndWorkspace = async (user) => {
    if (!project) return;
    
    const wsId = workspaceId || project.workspaceId;
    
    const payload = {
      uid: user.uid,
      name: user.displayName || user.email.split('@')[0],
      email: user.email,
      role: 'Member'
    };

    try {
      if (wsId) {
        const wsRes = await fetch(`${API_URL}/workspaces/${wsId}/members`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!wsRes.ok) {
          const errData = await wsRes.json().catch(() => ({}));
          throw new Error(errData.error || `Failed to join workspace (${wsRes.status})`);
        }
      }

      const projRes = await fetch(`${API_URL}/projects/${projectId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!projRes.ok) {
        const errData = await projRes.json().catch(() => ({}));
        throw new Error(errData.error || `Failed to join project (${projRes.status})`);
      }
      
      // Log activity
      await fetch(`${API_URL}/activity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user: payload.name,
          action: 'joined via invite link',
          target: project.title,
          workspaceId: wsId
        })
      });

      // Give backend a moment to settle
      await new Promise(r => setTimeout(r, 1000));
      navigate('/');
    } catch (err) {
      console.error("Error joining project:", err);
      setError("Failed to join the project.");
    }
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-[#DFD6AE]">
      {error ? (
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-500 text-2xl font-bold">!</span>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Invite Failed</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            onClick={() => navigate('/')}
            className="w-full py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 rounded-full border-4 border-[#274245] border-t-transparent animate-spin mb-4"></div>
          <p className="text-[#274245] font-medium animate-pulse">Joining project...</p>
        </div>
      )}
    </div>
  );
}
