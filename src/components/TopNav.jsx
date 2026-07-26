import React from 'react';
import { Menu, Search, Bell, Plus, MessageCircle } from 'lucide-react';

export default function TopNav({ toggleSidebar }) {
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
      <div className="flex items-center space-x-3 ml-2 md:ml-4 shrink-0">
        <button 
          title="Notifications"
          className="w-10 h-10 rounded-xl bg-[#FAF7EC] border border-[#D4C99E] flex items-center justify-center text-[#274245] hover:bg-[#E8E0BF] transition-colors relative shadow-xs cursor-pointer"
        >
          <Bell size={18} />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full border border-white"></span>
        </button>
      </div>
    </header>
  );
}
