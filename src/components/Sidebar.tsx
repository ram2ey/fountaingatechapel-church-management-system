'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../lib/AuthContext';
import { 
  Users, 
  Heart, 
  Radio, 
  Wallet, 
  BookOpen, 
  Sun,
  LayoutDashboard,
  LogOut,
  LogIn,
  ClipboardList,
  Compass,
  Trophy,
  Shield,
  Menu,
  X
} from 'lucide-react';
import FountainGateLogo from './FountainGateLogo';

interface SidebarProps {
  isMenuOpen: boolean;
  setIsMenuOpen: (open: boolean) => void;
}

export default function Sidebar({ isMenuOpen, setIsMenuOpen }: SidebarProps) {
  const { user, profile, mockLogout } = useAuth();
  const pathname = usePathname();

  const logout = () => {
    if (user?.uid?.startsWith('demo-')) {
      mockLogout();
    } else {
      // Real Supabase sign out
      const { signOut } = require('../lib/supabase');
      signOut();
    }
  };

  const NavItem = ({ href, icon: Icon, label }: { href: string, icon: any, label: string }) => {
    const isActive = pathname === href;
    return (
      <Link
        href={href}
        onClick={() => setIsMenuOpen(false)}
        className={`flex items-center space-x-3 w-full p-3 rounded-xl transition-all duration-300 ${
          isActive 
            ? 'bg-church-burgundy text-white shadow-lg transform scale-105' 
            : 'hover:bg-white/50 text-slate-600'
        }`}
      >
        <Icon size={20} />
        <span className="font-medium">{label}</span>
      </Link>
    );
  };

  return (
    <>
      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between p-4 bg-white border-b border-church-gold/20 sticky top-0 z-50">
        <FountainGateLogo size="sm" />
        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 text-church-burgundy">
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {/* Mobile Backdrop Overlay */}
      {isMenuOpen && (
        <div 
          onClick={() => setIsMenuOpen(false)} 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-30 md:hidden transition-opacity duration-300"
        />
      )}

      {/* Sidebar Navigation Container */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-40 bg-white border-r border-church-gold/20 w-72 p-6 flex flex-col h-screen
        transition-transform duration-300 ease-in-out
        ${isMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="hidden md:flex flex-col space-y-1 mb-6">
          <FountainGateLogo size="md" />
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto pr-1">
          <NavItem href="/" icon={LayoutDashboard} label="Dashboard" />
          <div className="pt-4 pb-2">
            <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold px-3">Member & Community</span>
          </div>
          <NavItem href="/directory" icon={Users} label="Directory" />
          <NavItem href="/prayer" icon={Heart} label="Prayer Wall" />
          <NavItem href="/groups" icon={Users} label="Small Groups" />

          <div className="pt-4 pb-2">
            <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold px-3">Worship & Service</span>
          </div>
          <NavItem href="/worship" icon={Radio} label="Live & Archive" />

          <div className="pt-4 pb-2">
            <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold px-3">Faith & Growth</span>
          </div>
          <NavItem href="/plans" icon={BookOpen} label="Reading Plans" />
          <NavItem href="/devotional" icon={Sun} label="Daily Devotional" />
          <NavItem href="/discipleship" icon={Compass} label="Discipleship Path" />

          <div className="pt-4 pb-2">
            <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold px-3">Youth & Family</span>
          </div>
          <NavItem href="/youth" icon={Trophy} label="Youth Hub" />

          <div className="pt-4 pb-2">
            <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold px-3">Administration</span>
          </div>
          <NavItem href="/giving" icon={Wallet} label="Giving" />
          <NavItem href="/attendance" icon={ClipboardList} label="Attendance Tracker" />
          {(profile?.role === 'admin' || profile?.role === 'leader') && (
            <NavItem href="/admin" icon={Shield} label="Leader Desk" />
          )}
        </nav>

        <div className="mt-auto pt-6 border-t border-church-gold/20">
          {user ? (
            <div className="space-y-4">
              <Link 
                href="/profile"
                className="flex items-center space-x-3 w-full p-2 rounded-xl hover:bg-slate-50 transition-colors"
              >
                <div className="w-10 h-10 bg-church-olive rounded-full flex items-center justify-center text-white font-bold">
                  {profile?.displayName?.[0] || 'U'}
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-slate-900 truncate max-w-[120px]">{profile?.displayName}</p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider">{profile?.role}</p>
                </div>
              </Link>
              <button onClick={logout} className="flex items-center space-x-2 text-slate-400 hover:text-red-600 transition-colors text-sm px-2 w-full text-left cursor-pointer">
                <LogOut size={16} />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <Link 
              href="/login"
              className="flex items-center justify-center space-x-2 w-full p-4 bg-church-burgundy text-white rounded-xl shadow-lg hover:shadow-xl transition-all font-bold"
            >
              <LogIn size={20} />
              <span>Connect Now</span>
            </Link>
          )}
        </div>
      </aside>
    </>
  );
}
