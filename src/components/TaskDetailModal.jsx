import React, { useState, useEffect } from 'react';
import { X, Calendar, Flag, User, Clock, Tag, MessageSquare, Image as ImageIcon } from 'lucide-react';
import { db, auth } from '../firebase';
import { ref, update, onValue, push, set } from 'firebase/database';

export default function TaskDetailModal({ task, onClose, projectId }) {
  const [formData, setFormData] = useState({ ...task });
  const [members, setMembers] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [imagePreview, setImagePreview] = useState(task.photoBase64 || null);

  useEffect(() => {
    if (projectId) {
      const fetchMembers = async () => {
        try {
          const API_URL = import.meta.env.VITE_API_URL || 'https://nayaruvi-pulse-zmst.onrender.com/api';
          const res = await fetch(`${API_URL}/projects/${projectId}`);
          if (res.ok) {
            const data = await res.json();
            setMembers(data.members || []);
          }
        } catch (err) {
          console.error("Failed to fetch members for task modal:", err);
        }
      };
      fetchMembers();
    }
  }, [projectId]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const taskRef = ref(db, `dashboard_tasks/${task.id}`);
      await update(taskRef, {
        ...formData,
        photoBase64: imagePreview || null,
        updatedAt: new Date().toISOString()
      });

      if (formData.assigneeId && formData.assigneeId !== task.assigneeId && formData.assigneeId !== auth.currentUser?.uid) {
        const assignee = members.find(m => m.uid === formData.assigneeId);
        const actRef = push(ref(db, 'dashboard_activity'));
        await set(actRef, {
          user: auth.currentUser?.displayName || auth.currentUser?.email?.split('@')[0],
          action: 'assigned a task to',
          target: assignee ? (assignee.name || assignee.email) : 'someone',
          targetUserId: formData.assigneeId,
          content: formData.content,
          type: 'task_assignment',
          workspaceId: task.workspaceId || null,
          projectId: projectId || null,
          uid: auth.currentUser?.uid,
          timestamp: new Date().toISOString()
        });
      }

      onClose();
    } catch (e) {
      console.error(e);
      alert('Failed to save task.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to permanently delete this task?")) return;
    try {
      const { remove } = await import('firebase/database');
      const taskRef = ref(db, `dashboard_tasks/${task.id}`);
      await remove(taskRef);
      onClose();
    } catch (e) {
      console.error(e);
      alert('Failed to delete task.');
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('File size too large. Please upload an image under 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl h-fit my-auto relative flex flex-col animate-in fade-in zoom-in duration-200">
        
        {/* Top Bar */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)] sticky top-0 bg-white z-10 rounded-t-xl">
          <div className="flex items-center text-sm font-medium text-text-secondary">
            <span className="bg-[#F8FAFC] px-2 py-1 rounded border border-[var(--color-border)] flex items-center">
              <span className="w-2 h-2 rounded-full bg-primary mr-2"></span>
              Task
            </span>
            <span className="mx-2 text-[var(--color-border)]">|</span>
            <span className="text-xs uppercase tracking-wide">ID: {task.id.slice(-6)}</span>
          </div>
          <div className="flex items-center space-x-2">
            <button 
              onClick={handleDelete} 
              className="px-4 py-1.5 bg-rose-50 text-rose-600 border border-rose-200 text-sm font-bold rounded-md shadow-sm hover:bg-rose-100 transition-colors"
            >
              Delete
            </button>
            <button 
              onClick={handleSave} 
              disabled={isSaving}
              className="px-5 py-1.5 bg-primary text-white text-sm font-bold rounded-md shadow-sm hover:bg-primary/90 transition-colors"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
            <button onClick={onClose} className="p-1.5 text-text-secondary hover:text-text-primary rounded-md hover:bg-gray-100 transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row p-4 md:p-8 gap-4 md:gap-8">
          {/* Main Content Area */}
          <div className="flex-1">
            {/* Title */}
            <input 
              type="text" 
              value={formData.content} 
              onChange={e => setFormData({...formData, content: e.target.value})}
              className="text-2xl sm:text-3xl font-bold text-text-primary w-full border-none focus:outline-none focus:ring-0 mb-4 bg-transparent placeholder:text-gray-300"
              placeholder="Task Name..."
            />

            {/* Properties Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-6 mb-10 py-6 border-y border-dashed border-[var(--color-border)]">
              
              {/* Left Column Properties */}
              <div className="space-y-6">
                {/* Status */}
                <div className="flex items-center">
                  <span className="w-28 text-sm text-text-secondary flex items-center">
                    <CheckCircle2 size={16} className="mr-2 opacity-60" /> Status
                  </span>
                  <select 
                    value={formData.status}
                    onChange={e => setFormData({...formData, status: e.target.value})}
                    className="flex-1 bg-white border border-[var(--color-border)] rounded-md px-3 py-1.5 text-xs font-bold uppercase tracking-wide focus:outline-none hover:border-primary/50 transition-colors cursor-pointer"
                  >
                    <option value="col-todo">To Do</option>
                    <option value="col-progress">In Progress</option>
                    <option value="col-review">Review</option>
                    <option value="col-completed">Completed</option>
                  </select>
                </div>

                {/* Dates */}
                <div className="flex items-center">
                  <span className="w-28 text-sm text-text-secondary flex items-center">
                    <Calendar size={16} className="mr-2 opacity-60" /> Dates
                  </span>
                  <div className="flex-1 flex items-center bg-white border border-[var(--color-border)] rounded-md px-3 py-1 text-sm font-medium hover:border-primary/50 transition-colors">
                    <span className="text-text-secondary text-xs mr-2">Due →</span>
                    <input 
                      type="date" 
                      value={formData.dueDate || ''}
                      onChange={e => setFormData({...formData, dueDate: e.target.value})}
                      className="bg-transparent border-none focus:outline-none p-0 text-sm text-text-primary w-full cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Right Column Properties */}
              <div className="space-y-6">
                {/* Assignees */}
                <div className="flex items-center">
                  <span className="w-28 text-sm text-text-secondary flex items-center">
                    <User size={16} className="mr-2 opacity-60" /> Assignees
                  </span>
                  <div className="flex-1">
                    <select 
                      value={formData.assigneeId || ''}
                      onChange={e => setFormData({...formData, assigneeId: e.target.value})}
                      className="w-full bg-white border border-[var(--color-border)] rounded-md px-3 py-1.5 text-sm font-medium focus:outline-none hover:border-primary/50 transition-colors cursor-pointer"
                    >
                      <option value="">Unassigned</option>
                      {members.map(m => (
                        <option key={m.uid} value={m.uid}>{m.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Priority */}
                <div className="flex items-center">
                  <span className="w-28 text-sm text-text-secondary flex items-center">
                    <Flag size={16} className="mr-2 opacity-60" /> Priority
                  </span>
                  <select 
                    value={formData.priority || 'Normal'}
                    onChange={e => setFormData({...formData, priority: e.target.value})}
                    className={`flex-1 bg-white border border-[var(--color-border)] rounded-md px-3 py-1.5 text-sm font-bold focus:outline-none hover:border-primary/50 transition-colors cursor-pointer ${
                      formData.priority === 'Urgent' ? 'text-danger' : 
                      formData.priority === 'High' ? 'text-warning' : 
                      formData.priority === 'Low' ? 'text-success' : 'text-text-primary'
                    }`}
                  >
                    <option value="Urgent" className="text-danger">Urgent</option>
                    <option value="High" className="text-warning">High</option>
                    <option value="Normal" className="text-text-primary">Normal</option>
                    <option value="Low" className="text-success">Low</option>
                  </select>
                </div>
                
              </div>
            </div>

            {/* Photo Attachment (Full Width Layout) */}
            <div className="mb-10">
              {imagePreview ? (
                <div className="relative rounded-xl overflow-hidden border border-[var(--color-border)] group bg-[#F8FAFC] shadow-sm">
                  <div className="p-4 bg-white border-b border-[var(--color-border)] flex items-center justify-between">
                    <span className="text-sm font-bold text-text-primary flex items-center">
                      Screenshot <span className="ml-3 text-xs font-medium text-text-secondary">Attached</span>
                    </span>
                    <button 
                      onClick={() => setImagePreview(null)}
                      className="text-text-secondary hover:text-danger p-1 rounded-md transition-colors"
                      title="Remove image"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <div className="p-6 flex justify-center">
                    <img src={imagePreview} alt="Attachment" className="max-w-full max-h-[400px] object-contain rounded shadow-sm border border-black/5" />
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-[var(--color-border)] rounded-xl p-8 text-center hover:bg-[#F8FAFC] transition-colors cursor-pointer relative bg-gray-50/50">
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleImageUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <ImageIcon size={32} className="mx-auto text-text-secondary mb-3 opacity-40" />
                  <p className="text-sm font-bold text-text-primary">Click or drag a screenshot here</p>
                  <p className="text-xs font-medium text-text-secondary mt-1">PNG, JPG (Max 2MB)</p>
                </div>
              )}
            </div>

            {/* Issue Summary / Description */}
            <div>
              <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center">
                Issue summary
              </h3>
              <textarea 
                value={formData.description || ''}
                onChange={e => setFormData({...formData, description: e.target.value})}
                placeholder="Describe the task or bug in detail..."
                className="w-full min-h-[150px] bg-white border border-[var(--color-border)] rounded-xl p-4 text-sm focus:outline-none focus:border-primary/50 resize-y font-medium text-text-primary shadow-sm leading-relaxed"
              ></textarea>
            </div>
            
          </div>
        </div>

      </div>
    </div>
  );
}

// Add a simple CheckCircle2 component since it might not be imported if the file wasn't complete
function CheckCircle2(props) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
      <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
  );
}
