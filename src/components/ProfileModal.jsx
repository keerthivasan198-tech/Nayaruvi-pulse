import React, { useState } from 'react';
import { X, User, Mail, Shield, Camera, Check, LogOut } from 'lucide-react';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';

export default function ProfileModal({ isOpen, onClose, profile, onSave }) {
  if (!isOpen) return null;

  const [formData, setFormData] = useState({
    name: profile?.name || 'Manikandan',
    email: profile?.email || 'manikandan@nayaruvi.com',
    role: profile?.role || 'Product Manager',
    avatar: profile?.avatar || 'https://ui-avatars.com/api/?name=Manikandan&background=2B2420&color=FAF8F5',
    bio: profile?.bio || 'Building modern digital products at Nayaruvi.'
  });

  const [isSaved, setIsSaved] = useState(false);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('File size too large. Please upload an image under 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, avatar: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="celestique-card rounded-2xl w-full max-w-lg p-6 shadow-celestique-lg animate-in fade-in zoom-in duration-200 text-[#2B2420]">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6 border-b border-[#DDD5CC] pb-4">
          <div>
            <h3 className="text-2xl font-normal text-[#2B2420] font-heading uppercase tracking-wide">
              Profile Settings
            </h3>
            <p className="text-xs font-medium text-[#7D7268] mt-0.5">
              View and edit your personal details and account information.
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="text-[#7D7268] hover:text-[#2B2420] p-1.5 rounded-xl hover:bg-black/5 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Avatar Preview */}
          <div className="flex items-center space-x-4 p-3 bg-white rounded-xl border border-[#DDD5CC]">
            <div className="relative">
              <img 
                src={formData.avatar} 
                alt="Profile Avatar" 
                className="w-16 h-16 rounded-full border-2 border-[#2B2420] object-cover shadow-sm"
              />
              <div className="absolute bottom-0 right-0 w-5 h-5 bg-[#2B2420] rounded-full flex items-center justify-center text-white text-[10px]">
                <Camera size={11} />
              </div>
            </div>
            <div className="flex-1">
              <label className="block text-xs font-bold text-[#4A443E] mb-1">Upload Profile Photo</label>
              <input 
                type="file" 
                accept="image/*"
                onChange={handleImageUpload}
                className="w-full bg-[#FAF8F5] border border-[#DDD5CC] rounded-lg px-3 py-1.5 text-xs text-[#2B2420] focus:outline-none focus:border-[#2B2420] file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-[10px] file:font-bold file:bg-[#2B2420] file:text-white hover:file:bg-black transition-colors"
              />
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-xs font-bold text-[#4A443E] mb-1.5 flex items-center">
              <User size={14} className="mr-1.5 text-[#7D7268]" /> Full Name
            </label>
            <input 
              type="text" 
              required
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-white border border-[#DDD5CC] rounded-xl px-3.5 py-2.5 text-sm text-[#2B2420] font-medium focus:outline-none focus:border-[#2B2420] transition-all"
              placeholder="Your full name"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-bold text-[#4A443E] mb-1.5 flex items-center">
              <Mail size={14} className="mr-1.5 text-[#7D7268]" /> Email Address
            </label>
            <input 
              type="email" 
              required
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              className="w-full bg-white border border-[#DDD5CC] rounded-xl px-3.5 py-2.5 text-sm text-[#2B2420] font-medium focus:outline-none focus:border-[#2B2420] transition-all"
              placeholder="your.email@nayaruvi.com"
            />
          </div>

          {/* Role (Read Only) */}
          <div>
            <label className="block text-xs font-bold text-[#4A443E] mb-1.5 flex items-center">
              <Shield size={14} className="mr-1.5 text-[#7D7268]" /> Workspace Role
            </label>
            <input 
              type="text" 
              value={formData.role}
              disabled
              className="w-full bg-gray-100 border border-[#DDD5CC] rounded-xl px-3.5 py-2.5 text-sm text-[#7D7268] font-medium cursor-not-allowed"
            />
          </div>

          {/* Bio */}
          <div>
            <label className="block text-xs font-bold text-[#4A443E] mb-1.5">Bio / Description</label>
            <textarea 
              rows={2}
              value={formData.bio}
              onChange={e => setFormData({ ...formData, bio: e.target.value })}
              className="w-full bg-white border border-[#DDD5CC] rounded-xl p-3 text-xs text-[#2B2420] font-medium focus:outline-none focus:border-[#2B2420] resize-none"
              placeholder="Tell your team about yourself..."
            />
          </div>

          {/* Actions */}
          <div className="pt-3 flex flex-col gap-3">
            <div className="flex gap-3">
              <button 
                type="button" 
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold btn-matte-secondary cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="flex-1 py-2.5 rounded-xl text-xs font-bold btn-matte-primary flex items-center justify-center cursor-pointer font-heading"
              >
                {isSaved ? (
                  <span className="flex items-center">
                    <Check size={16} className="mr-1 text-emerald-400" /> Saved!
                  </span>
                ) : 'Save Profile'}
              </button>
            </div>
            <button 
              type="button" 
              onClick={() => {
                signOut(auth);
                onClose();
              }}
              className="w-full py-2.5 rounded-xl text-xs font-bold border border-red-200 text-red-600 hover:bg-red-50 flex items-center justify-center cursor-pointer transition-colors"
            >
              <LogOut size={16} className="mr-2" />
              Sign Out
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
