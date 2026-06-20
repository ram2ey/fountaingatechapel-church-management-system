'use client';

import React from 'react';
import { useAuth } from '../lib/AuthContext';
import { 
  Users, 
  Heart, 
  Radio, 
  BookOpen, 
  Sun,
  User as UserIcon,
  ClipboardList,
  Compass,
  Trophy,
  LogIn
} from 'lucide-react';
import { motion } from 'motion/react';

export default function AuthPrompt({ view }: { view: string }) {
  const { mockLogin } = useAuth();

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

  const login = async () => {
    const { signInWithPopup, GoogleAuthProvider, auth } = require('../lib/supabase');
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      console.error('Sign in error:', err);
    }
  };

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
          className="w-full flex items-center justify-center space-x-3 bg-church-burgundy hover:bg-church-burgundy/90 text-white py-4 px-6 rounded-2xl font-bold transition-all shadow-lg hover:shadow-xl hover:translate-y-[-2px] active:translate-y-0 cursor-pointer"
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
