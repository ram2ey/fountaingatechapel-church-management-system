/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './lib/AuthContext';
import { BRANCHES } from './types';
import { 
  Users, 
  Heart, 
  Music, 
  Archive, 
  Radio, 
  Wallet, 
  CheckCircle, 
  BookOpen, 
  Sun,
  LayoutDashboard,
  LogOut,
  LogIn,
  Search,
  Plus,
  Send,
  MessageCircle,
  Menu,
  X,
  User as UserIcon,
  CirclePlay,
  ClipboardList,
  Compass,
  Trophy,
  Shield
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { 
  auth, 
  db,
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  serverTimestamp, 
  updateDoc, 
  doc, 
  arrayUnion, 
  arrayRemove,
  where,
  getDocs
} from './lib/firebase';
import { format } from 'date-fns';

// Components
import Directory from './components/Directory';
import PrayerWall from './components/PrayerWall';
import SmallGroups from './components/SmallGroups';
import WorshipArchive from './components/WorshipArchive';
import LiveService from './components/LiveService';
import Giving from './components/Giving';
import ReadingPlans from './components/ReadingPlans';
import Devotional from './components/Devotional';
import AttendanceTracker from './components/AttendanceTracker';
import DiscipleshipTracker from './components/DiscipleshipTracker';
import YouthGroupHub from './components/YouthGroupHub';
import AdminPortal from './components/AdminPortal';
import FountainGateLogo from './components/FountainGateLogo';

type View = 'dashboard' | 'directory' | 'prayer' | 'groups' | 'worship' | 'giving' | 'plans' | 'devotional' | 'profile' | 'attendance' | 'discipleship' | 'youth' | 'admin';

import { seedInitialData } from './lib/seedData';

function AppContent() {
  const { user, profile, loading, mockLogout } = useAuth();
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  React.useEffect(() => {
    if (user) {
      seedInitialData();
    }
  }, [user]);

  const login = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') {
        console.log('Firebase: Sign in popup was closed by the user.');
      } else {
        console.error('Firebase: Sign in error:', err);
      }
    }
  };

  const logout = () => {
    if (user?.uid?.startsWith('demo-')) {
      mockLogout();
    } else {
      signOut(auth);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-church-cream">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-church-burgundy"></div>
      </div>
    );
  }

  if (user && profile && profile.onboarded !== true) {
    return <OnboardingFlow />;
  }

  const navigate = (view: View) => {
    setCurrentView(view);
    setIsMenuOpen(false);
  };

  const NavItem = ({ view, icon: Icon, label }: { view: View, icon: any, label: string }) => (
    <button
      onClick={() => navigate(view)}
      className={`flex items-center space-x-3 w-full p-3 rounded-xl transition-all duration-300 ${
        currentView === view 
          ? 'bg-church-burgundy text-white shadow-lg transform scale-105' 
          : 'hover:bg-white/50 text-slate-600'
      }`}
    >
      <Icon size={20} />
      <span className="font-medium">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-church-cream selection:bg-church-burgundy selection:text-white">
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

      {/* Sidebar Navigation */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-40 bg-white md:bg-white border-r border-church-gold/20 w-72 p-6 flex flex-col
        transition-transform duration-300 ease-in-out
        ${isMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="hidden md:flex flex-col space-y-1 mb-6">
          <FountainGateLogo size="md" />
        </div>


        <nav className="flex-1 space-y-2 overflow-y-auto">
          <NavItem view="dashboard" icon={LayoutDashboard} label="Dashboard" />
          <div className="pt-4 pb-2">
            <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold px-3">Member & Community</span>
          </div>
          <NavItem view="directory" icon={Users} label="Directory" />
          <NavItem view="prayer" icon={Heart} label="Prayer Wall" />
          <NavItem view="groups" icon={Users} label="Small Groups" />

          <div className="pt-4 pb-2">
            <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold px-3">Worship & Service</span>
          </div>
          <NavItem view="worship" icon={Radio} label="Live & Archive" />

          <div className="pt-4 pb-2">
            <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold px-3">Faith & Growth</span>
          </div>
          <NavItem view="plans" icon={BookOpen} label="Reading Plans" />
          <NavItem view="devotional" icon={Sun} label="Daily Devotional" />
          <NavItem view="discipleship" icon={Compass} label="Discipleship Path" />

          <div className="pt-4 pb-2">
            <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold px-3">Youth & Family</span>
          </div>
          <NavItem view="youth" icon={Trophy} label="Youth Hub" />

          <div className="pt-4 pb-2">
            <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold px-3">Administration</span>
          </div>
          <NavItem view="giving" icon={Wallet} label="Giving" />
          <NavItem view="attendance" icon={ClipboardList} label="Attendance Tracker" />
          {(profile?.role === 'admin' || profile?.role === 'leader') && (
            <NavItem view="admin" icon={Shield} label="Leader Desk" />
          )}
        </nav>

        <div className="mt-auto pt-6 border-t border-church-gold/20">
          {user ? (
            <div className="space-y-4">
              <button 
                onClick={() => navigate('profile')}
                className="flex items-center space-x-3 w-full p-2 rounded-xl hover:bg-slate-50 transition-colors"
              >
                <div className="w-10 h-10 bg-church-olive rounded-full flex items-center justify-center text-white font-bold">
                  {profile?.displayName?.[0] || 'U'}
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-slate-900 truncate max-w-[120px]">{profile?.displayName}</p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider">{profile?.role}</p>
                </div>
              </button>
              <button onClick={logout} className="flex items-center space-x-2 text-slate-400 hover:text-red-600 transition-colors text-sm px-2">
                <LogOut size={16} />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <button 
              onClick={login}
              className="flex items-center justify-center space-x-2 w-full p-4 bg-church-burgundy text-white rounded-xl shadow-lg hover:shadow-xl transition-all font-bold"
            >
              <LogIn size={20} />
              <span>Connect Now</span>
            </button>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-10 relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="max-w-5xl mx-auto h-full"
          >
            {renderView(currentView, user, login, navigate)}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

function AuthPrompt({ login, view }: { login: () => void; view: View }) {
  const settings: Record<string, { icon: any; title: string; subtitle: string; scripture: string; citation: string }> = {
    directory: {
      icon: Users,
      title: "Church Directory",
      subtitle: "Connect with our church family, view members, and share contact details.",
      scripture: "For as we have many members in one body, but all the members do not have the same function, so we, being many, are one body in Christ.",
      citation: "Romans 12:4-5"
    },
    prayer: {
      icon: Heart,
      title: "Prayer Wall",
      subtitle: "Share prayer requests, support others with encouragement, and pray collectively.",
      scripture: "Bear one another's burdens, and so fulfill the law of Christ.",
      citation: "Galatians 6:2"
    },
    groups: {
      icon: Users,
      title: "Small Groups",
      subtitle: "Find your community and grow in faith with our Bible studies and groups.",
      scripture: "For where two or three are gathered together in my name, there am I in the midst of them.",
      citation: "Matthew 18:20"
    },
    worship: {
      icon: Radio,
      title: "Worship & Sermon Archive",
      subtitle: "Access past sermons, watch live streams, and view scripture references.",
      scripture: "Let the word of Christ dwell in you richly... singing with grace in your hearts to the Lord.",
      citation: "Colossians 3:16"
    },
    plans: {
      icon: BookOpen,
      title: "Daily Reading Plans",
      subtitle: "Join the community in studying God's word and tracking your daily progress.",
      scripture: "Your word is a lamp to my feet and a light to my path.",
      citation: "Psalm 119:105"
    },
    devotional: {
      icon: Sun,
      title: "Daily Devotions",
      subtitle: "Read today's inspiring devotional and spend time in quiet reflection.",
      scripture: "His compassions fail not. They are new every morning; great is Your faithfulness.",
      citation: "Lamentations 3:22-23"
    },
    profile: {
      icon: UserIcon,
      title: "Member Profile",
      subtitle: "Manage your contact details, view attendance, and configure your profile.",
      scripture: "But let all things be done decently and in order.",
      citation: "1 Corinthians 14:40"
    },
    attendance: {
      icon: ClipboardList,
      title: "Attendance Tracker",
      subtitle: "Check-in securely for church services, children's ministry, and community groups.",
      scripture: "Let us not neglect meeting together, as some have made a habit, but let us encourage one another.",
      citation: "Hebrews 10:25"
    },
    discipleship: {
      icon: Compass,
      title: "Discipleship Tracker",
      subtitle: "Celebrate spiritual milestones, view mentor conversations, and grow in your faith walk.",
      scripture: "But grow in the grace and knowledge of our Lord and Savior Jesus Christ.",
      citation: "2 Peter 3:18"
    },
    youth: {
      icon: Trophy,
      title: "Youth Group Hub",
      subtitle: "Join interactive verse memory challenges, group events, and chill discussions with teens.",
      scripture: "Don't let anyone look down on you because you are young, but set an example for the believers in speech, in conduct, in love, in faith.",
      citation: "1 Timothy 4:12"
    }
  };

  const current = settings[view] || {
    icon: UserIcon,
    title: "Fountain Gate Chapel Community",
    subtitle: "Sign in to connect with your spiritual community.",
    scripture: "Behold, how good and how pleasant it is for brethren to dwell together in unity!",
    citation: "Psalm 133:1"
  };

  const IconComponent = current.icon;
  const { mockLogin } = useAuth();

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 max-w-lg mx-auto text-center h-full">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="bg-white p-8 md:p-12 rounded-[2.5rem] border border-church-gold/20 shadow-xl overflow-hidden relative group"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-church-gold/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
        
        <div className="mx-auto w-16 h-16 bg-church-burgundy/10 text-church-burgundy rounded-2xl flex items-center justify-center mb-6 shadow-inner">
          <IconComponent size={32} />
        </div>

        <h3 className="text-3xl font-serif font-bold text-church-burgundy mb-3">{current.title}</h3>
        <p className="text-slate-500 mb-8 text-sm leading-relaxed">{current.subtitle}</p>

        <div className="bg-church-cream/40 border-l-4 border-church-gold p-4 mb-8 text-left rounded-r-2xl">
          <p className="text-slate-600 text-sm font-serif italic">"{current.scripture}"</p>
          <p className="text-church-gold text-xs font-bold mt-2 uppercase tracking-wide">— {current.citation}</p>
        </div>

        <button
          onClick={login}
          className="w-full flex items-center justify-center space-x-3 bg-church-burgundy hover:bg-church-burgundy/90 text-white py-4 px-6 rounded-2xl font-bold transition-all shadow-lg hover:shadow-xl hover:translate-y-[-2px] active:translate-y-0"
        >
          <LogIn size={20} />
          <span>Connect with Google</span>
        </button>

        <div className="my-6 flex items-center justify-center space-x-2">
          <div className="h-px bg-slate-100 flex-1"></div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Or Local Demo</span>
          <div className="h-px bg-slate-100 flex-1"></div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => mockLogin('member')}
            className="py-2.5 px-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition-colors border border-slate-100 hover:border-slate-200 cursor-pointer"
          >
            Member
          </button>
          <button
            onClick={() => mockLogin('leader')}
            className="py-2.5 px-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition-colors border border-slate-100 hover:border-slate-200 cursor-pointer"
          >
            Leader
          </button>
          <button
            onClick={() => mockLogin('admin')}
            className="py-2.5 px-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition-colors border border-slate-100 hover:border-slate-200 cursor-pointer"
          >
            Admin
          </button>
          <button
            onClick={() => mockLogin('new_user')}
            className="py-2.5 px-2 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-xl text-xs font-bold transition-colors border border-amber-100 hover:border-amber-200 cursor-pointer"
          >
            New User (Onboard)
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function renderView(view: View, user: any, onLogin: () => void, navigate: (view: View) => void) {
  if (view !== 'dashboard' && view !== 'giving' && !user) {
    return <AuthPrompt login={onLogin} view={view} />;
  }

  switch (view) {
    case 'dashboard': return <Dashboard onNavigate={navigate} />;
    case 'directory': return <Directory />;
    case 'prayer': return <PrayerWall />;
    case 'groups': return <SmallGroups />;
    case 'worship': return <WorshipView />;
    case 'giving': return <Giving />;
    case 'plans': return <ReadingPlans />;
    case 'devotional': return <Devotional />;
    case 'profile': return <Profile />;
    case 'attendance': return <AttendanceTracker />;
    case 'discipleship': return <DiscipleshipTracker />;
    case 'youth': return <YouthGroupHub />;
    case 'admin': return <AdminPortal />;
    default: return <Dashboard onNavigate={navigate} />;
  }
}

function Dashboard({ onNavigate }: { onNavigate: (view: View) => void }) {
  const { user, profile } = useAuth();
  const [announcements, setAnnouncements] = React.useState<any[]>([]);

  React.useEffect(() => {
    if (!user) {
      setAnnouncements([]);
      return;
    }
    const q = query(collection(db, 'announcements'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAnnouncements(data);
    }, (err) => {
      console.error("Error reading announcements: ", err);
    });
    return unsubscribe;
  }, [user]);

  const filteredAnnouncements = announcements;

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="relative overflow-hidden rounded-3xl bg-church-burgundy p-8 md:p-12 text-white shadow-2xl">
        <div className="relative z-10 p-1">
          <motion.h2 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-4xl md:text-6xl font-serif font-bold mb-4"
          >
            Welcome home, {profile?.displayName?.split(' ')[0] || 'Friend'}
          </motion.h2>
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold font-mono tracking-wider">
              ⛪ {profile?.branch || 'Ankaful'} Branch
            </span>
          </div>
          <p className="text-church-cream/80 text-lg max-w-xl">
            "For where two or three are gathered together in my name, there am I in the midst of them."
            <span className="block mt-2 font-serif italic text-church-gold">— Matthew 18:20</span>
          </p>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-church-gold/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-church-olive/20 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl"></div>
      </div>

      {filteredAnnouncements.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-1 border-b border-church-gold/10">
            <h3 className="text-2xl font-serif font-bold text-church-burgundy flex items-center gap-2">
              <span>📢 Parish Bulletin</span>
            </h3>
            <span className="text-xs font-bold text-slate-400">
              Showing bulletins for Ankaful
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredAnnouncements.slice(0, 4).map((ann) => (
              <div key={ann.id} className="bg-white p-6 rounded-3xl border border-church-gold/10 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-church-gold/5 rounded-full -translate-y-12 translate-x-12"></div>
                <div className="relative z-10 space-y-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center space-x-2">
                      <span className="px-2.5 py-0.5 bg-church-burgundy/10 text-church-burgundy rounded-full text-[9px] font-bold uppercase tracking-wider">
                        {ann.category}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {ann.timestamp ? format(new (ann.timestamp as any).toDate(), 'MMM d, h:mm a') : 'Bulletin'}
                    </span>
                  </div>
                  <h4 className="text-lg font-bold text-slate-900 leading-tight">{ann.title}</h4>
                  <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">{ann.content}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <DashboardCard 
          icon={Radio} 
          title="Next Service" 
          description="Join us live this Sunday at 10:00 AM" 
          actionLabel="Watch Live"
          accent="burgundy"
          onClick={() => onNavigate('worship')}
        />
        <DashboardCard 
          icon={Sun} 
          title="Daily Devotional" 
          description="Read today's message from Pastor John" 
          actionLabel="Read Now"
          accent="olive"
          onClick={() => onNavigate('devotional')}
        />
        <DashboardCard 
          icon={Heart} 
          title="Prayer Wall" 
          description="There are 5 new requests since your last visit" 
          actionLabel="Pray Now"
          accent="gold"
          onClick={() => onNavigate('prayer')}
        />
      </div>
    </div>
  );
}

function DashboardCard({ icon: Icon, title, description, actionLabel, accent, onClick }: any) {
  const accents = {
    burgundy: 'text-church-burgundy bg-church-burgundy/10',
    olive: 'text-church-olive bg-church-olive/10',
    gold: 'text-church-gold bg-church-gold/10'
  };

  return (
    <motion.div 
      whileHover={{ y: -5 }}
      onClick={onClick}
      className="bg-white p-6 rounded-2xl shadow-sm border border-church-gold/10 hover:shadow-md transition-all group cursor-pointer"
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 ${(accents as any)[accent]}`}>
        <Icon size={24} />
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-500 mb-6 text-sm">{description}</p>
      <button className="text-church-burgundy font-bold text-sm flex items-center space-x-1 group-hover:translate-x-1 transition-transform">
        <span>{actionLabel}</span>
        <Plus size={16} />
      </button>
    </motion.div>
  );
}

function WorshipView() {
  const [tab, setTab] = useState<'live' | 'archive'>('live');
  return (
    <div className="space-y-6">
      <div className="flex space-x-1 bg-white p-1 rounded-2xl border border-church-gold/10 w-fit">
        <button 
          onClick={() => setTab('live')}
          className={`px-6 py-2 rounded-xl font-bold transition-all ${tab === 'live' ? 'bg-church-burgundy text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
        >Live</button>
        <button 
          onClick={() => setTab('archive')}
          className={`px-6 py-2 rounded-xl font-bold transition-all ${tab === 'archive' ? 'bg-church-burgundy text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
        >Archive</button>
      </div>
      {tab === 'live' ? <LiveService /> : <WorshipArchive />}
    </div>
  );
}

function Profile() {
  const { profile, user } = useAuth();
  const [phone, setPhone] = React.useState(profile?.phone || '');
  const [bio, setBio] = React.useState(profile?.bio || '');
  const [occupation, setOccupation] = React.useState(profile?.occupation || '');
  const [isSaving, setIsSaving] = React.useState(false);
  const [success, setSuccess] = React.useState(false);

  React.useEffect(() => {
    if (profile) {
      setPhone(profile.phone || '');
      setBio(profile.bio || '');
      setOccupation(profile.occupation || '');
    }
  }, [profile]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSaving(true);
    setSuccess(false);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        branch: 'Ankaful',
        phone: phone.trim(),
        bio: bio.trim(),
        occupation: occupation.trim()
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    } catch (err) {
      console.error("Error updating user profile:", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-[2rem] p-8 border border-church-gold/10 shadow-sm max-w-2xl mx-auto animate-fade-in">
      <div className="flex flex-col items-center text-center space-y-4 mb-8">
        <div className="w-24 h-24 bg-church-burgundy rounded-[1.5rem] flex items-center justify-center text-white text-4xl font-serif font-bold shadow-md">
          {profile?.displayName?.[0] || 'U'}
        </div>
        <div>
          <h2 className="text-3xl font-serif font-bold text-[#1664a7]">{profile?.displayName}</h2>
          <p className="text-slate-500">{profile?.email}</p>
          <span className="inline-block mt-2 px-4 py-1.5 bg-church-gold/15 text-[#D1A129] rounded-full text-xs font-bold uppercase tracking-widest whitespace-nowrap">
            {profile?.role || 'Member'}
          </span>
        </div>
      </div>

      <form onSubmit={handleUpdate} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Phone Number</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+233..."
              className="w-full bg-slate-50 border border-slate-100 outline-none text-sm p-3.5 rounded-2xl focus:ring-2 focus:ring-church-burgundy placeholder:text-slate-300"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Occupation</label>
            <input
              type="text"
              value={occupation}
              onChange={(e) => setOccupation(e.target.value)}
              placeholder="e.g. Engineer, Student"
              className="w-full bg-slate-50 border border-slate-100 outline-none text-sm p-3.5 rounded-2xl focus:ring-2 focus:ring-church-burgundy placeholder:text-slate-300 font-medium"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Home Group / Bio</label>
            <input
              type="text"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="e.g. Youth Leader / Musician"
              className="w-full bg-slate-50 border border-slate-100 outline-none text-sm p-3.5 rounded-2xl focus:ring-2 focus:ring-church-burgundy placeholder:text-slate-300"
            />
          </div>
        </div>

        <div className="pt-4 flex flex-col items-center">
          <button
            type="submit"
            disabled={isSaving}
            className="w-full py-4 px-6 bg-[#1664a7] hover:bg-[#1664a7]/90 text-white rounded-2xl font-bold font-serif shadow-lg hover:shadow-xl transition-all hover:translate-y-[-1px] active:translate-y-0 disabled:opacity-50 cursor-pointer"
          >
            {isSaving ? "Saving details..." : "Save Profile Details"}
          </button>

          {success && (
            <div className="mt-4 text-xs font-bold text-emerald-600 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100/40 animate-fade-in text-center w-full">
              ✨ Profile successfully updated across church directories.
            </div>
          )}
        </div>
      </form>

      <div className="w-full pt-8 mt-8 border-t border-slate-50 grid grid-cols-2 gap-4 text-left">
        <div className="p-4 bg-slate-50 rounded-2xl">
          <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Joined</p>
          <p className="font-bold text-slate-800 text-sm">
            {profile?.createdAt ? format(new (profile.createdAt as any).toDate(), 'MMMM yyyy') : 'Recently'}
          </p>
        </div>
        <div className="p-4 bg-slate-50 rounded-2xl">
          <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Status</p>
          <div className="flex items-center space-x-2 text-[#D1A129] font-bold text-sm">
            <CheckCircle size={16} />
            <span>Active Member</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function OnboardingFlow() {
  const { user } = useAuth();
  const [phone, setPhone] = useState('');
  const [occupation, setOccupation] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!phone.trim()) {
      alert("Please enter your phone number to stay connected.");
      return;
    }
    if (!occupation.trim()) {
      alert("Please enter your occupation to help us build networking opportunities.");
      return;
    }
    
    setIsSaving(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        branch: 'Ankaful',
        phone: phone.trim(),
        occupation: occupation.trim(),
        onboarded: true
      });
    } catch (err) {
      console.error("Error completing onboarding:", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-church-cream flex items-center justify-center p-4 selection:bg-church-burgundy selection:text-white">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-[2.5rem] p-8 md:p-12 border border-church-gold/20 shadow-2xl relative overflow-hidden text-center space-y-8"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-church-gold/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
        
        <div>
          <div className="mx-auto w-16 h-16 bg-church-burgundy/10 text-church-burgundy rounded-2xl flex items-center justify-center mb-6 shadow-inner animate-bounce">
            <Users size={32} />
          </div>
          <h2 className="text-3xl font-serif font-bold text-church-burgundy">Welcome to FaithConnect</h2>
          <p className="text-slate-500 text-sm mt-2 leading-relaxed">
            Let's complete your profile to connect you with your home branch and fellowship.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
          <div className="space-y-2">
            <label className="block">Phone Number</label>
            <input
              type="tel"
              required
              placeholder="e.g. +233 24 123 4567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-slate-50 border border-slate-100 outline-none text-sm p-3.5 rounded-2xl focus:ring-2 focus:ring-church-burgundy placeholder:text-slate-300 normal-case font-medium text-slate-700"
            />
          </div>

          <div className="space-y-2">
            <label className="block">Occupation / Profession</label>
            <input
              type="text"
              required
              placeholder="e.g. Software Engineer, Teacher, Student"
              value={occupation}
              onChange={(e) => setOccupation(e.target.value)}
              className="w-full bg-slate-50 border border-slate-100 outline-none text-sm p-3.5 rounded-2xl focus:ring-2 focus:ring-church-burgundy placeholder:text-slate-300 normal-case font-medium text-slate-700"
            />
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="w-full mt-6 py-4 bg-church-burgundy disabled:bg-slate-400 text-white rounded-2xl font-bold font-serif text-sm shadow-xl shadow-church-burgundy/15 hover:shadow-2xl hover:translate-y-[-1px] active:translate-y-0 transition-all cursor-pointer text-center"
          >
            {isSaving ? "Completing Profile Setup..." : "Complete Registration"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

/** 
 * Placeholder components for sub-views. 
 * I will create these as separate files next.
 */
