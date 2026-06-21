'use client';

import React, { useState } from 'react';
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
  LogIn,
  Key,
  Mail,
  UserPlus,
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
  Settings,
  ChevronDown,
  Phone,
  Briefcase,
  MapPin,
  Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BRANCHES } from '../types';
import FountainGateLogo from './FountainGateLogo';

export default function AuthPrompt({ view }: { view: string }) {
  const { mockLogin, signInWithCredentials, signUpWithCredentials } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [showPassword, setShowPassword] = useState(false);

  // Sign In Fields
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');

  // Sign Up Fields
  const [signUpFullName, setSignUpFullName] = useState('');
  const [signUpUsername, setSignUpUsername] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPhone, setSignUpPhone] = useState('');
  const [signUpOccupation, setSignUpOccupation] = useState('');
  const [signUpAddress, setSignUpAddress] = useState('');
  const [signUpDob, setSignUpDob] = useState('');
  const [signUpBranch, setSignUpBranch] = useState<string>('Ankaful');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState('');

  // Status
  const [formLoading, setFormLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameOrEmail.trim() || !password.trim()) {
      setErrorMsg('Please enter both username/email and password.');
      return;
    }

    setErrorMsg(null);
    setSuccessMsg(null);
    setFormLoading(true);

    try {
      await signInWithCredentials(usernameOrEmail, password);
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid credentials or connection issue.');
      setFormLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !signUpFullName.trim() ||
      !signUpUsername.trim() ||
      !signUpEmail.trim() ||
      !signUpPhone.trim() ||
      !signUpOccupation.trim() ||
      !signUpAddress.trim() ||
      !signUpDob.trim() ||
      !signUpPassword.trim() ||
      !signUpConfirmPassword.trim()
    ) {
      setErrorMsg('All fields are required.');
      return;
    }

    const usernameRegex = /^[a-zA-Z0-9_]{3,15}$/;
    if (!usernameRegex.test(signUpUsername)) {
      setErrorMsg('Username must be 3-15 alphanumeric characters or underscores.');
      return;
    }

    if (signUpPassword !== signUpConfirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    if (signUpPassword.length < 6) {
      setErrorMsg('Password should be at least 6 characters long.');
      return;
    }

    setErrorMsg(null);
    setSuccessMsg(null);
    setFormLoading(true);

    try {
      await signUpWithCredentials(
        signUpUsername,
        signUpEmail,
        signUpPassword,
        signUpFullName,
        signUpBranch,
        signUpOccupation,
        signUpPhone,
        signUpAddress,
        signUpDob
      );
      setSuccessMsg('Account created successfully! Welcome.');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to register account.');
      setFormLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-6 px-4 max-w-2xl mx-auto text-center w-full min-h-full">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-church-gold/20 shadow-2xl overflow-hidden relative group w-full"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-church-gold/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
        
        <div className="flex justify-center mb-5">
          <FountainGateLogo size="md" />
        </div>
        
        <div className="mx-auto w-12 h-12 bg-church-burgundy/10 text-church-burgundy rounded-2xl flex items-center justify-center mb-4 shadow-inner">
          <IconComponent size={24} />
        </div>

        <h3 className="text-xl md:text-2xl font-serif font-bold text-church-burgundy mb-1">{current.title}</h3>
        <p className="text-slate-500 mb-5 text-[11px] leading-relaxed max-w-xs mx-auto">{current.subtitle}</p>

        {/* Tab Switcher */}
        <div className="flex bg-slate-100 p-1 rounded-xl mb-5 border border-slate-200 max-w-xs mx-auto">
          <button
            type="button"
            onClick={() => {
              setActiveTab('login');
              setErrorMsg(null);
            }}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'login'
                ? 'bg-white text-church-burgundy shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Log In
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('signup');
              setErrorMsg(null);
            }}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'signup'
                ? 'bg-white text-church-burgundy shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Alerts */}
        <AnimatePresence mode="wait">
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="bg-red-50 border border-red-200 text-red-700 p-3 mb-5 rounded-xl text-left text-xs flex items-start space-x-2"
            >
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{errorMsg}</span>
            </motion.div>
          )}

          {successMsg && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-3 mb-5 rounded-xl text-left text-xs flex items-start space-x-2"
            >
              <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{successMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Login Form */}
        {activeTab === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4 text-left max-w-sm mx-auto">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 pl-1">
                Username or Email
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <UserIcon className="w-3.5 h-3.5" />
                </span>
                <input
                  type="text"
                  required
                  placeholder="e.g. pastor_michael"
                  value={usernameOrEmail}
                  onChange={(e) => setUsernameOrEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-church-gold/80 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 pl-1">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Key className="w-3.5 h-3.5" />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-church-gold/80 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={formLoading}
              className="w-full mt-5 flex items-center justify-center space-x-2 bg-church-burgundy hover:bg-church-burgundy/90 disabled:opacity-50 text-white py-3 px-6 rounded-xl font-bold transition-all shadow-md hover:shadow-lg cursor-pointer text-xs"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>{formLoading ? 'Logging in...' : 'Sign In'}</span>
            </button>
          </form>
        )}

        {/* Signup Form */}
        {activeTab === 'signup' && (
          <form onSubmit={handleSignUp} className="space-y-3.5 text-left">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              
              {/* Full Name (FIRST FIELD - Full Width) */}
              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 pl-1">
                  Full Name
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <UserIcon className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Doe"
                    value={signUpFullName}
                    onChange={(e) => setSignUpFullName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-church-gold/80 transition-colors"
                  />
                </div>
              </div>

              {/* Username */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 pl-1">
                  Username
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <UserIcon className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="Alphanumeric, e.g. john_doe"
                    value={signUpUsername}
                    onChange={(e) => setSignUpUsername(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-church-gold/80 transition-colors"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 pl-1">
                  Email Address
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <Mail className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type="email"
                    required
                    placeholder="e.g. john@example.com"
                    value={signUpEmail}
                    onChange={(e) => setSignUpEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-church-gold/80 transition-colors"
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 pl-1">
                  Phone Number
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <Phone className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. +233 24 123 4567"
                    value={signUpPhone}
                    onChange={(e) => setSignUpPhone(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-church-gold/80 transition-colors"
                  />
                </div>
              </div>

              {/* Occupation */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 pl-1">
                  Occupation / Profession
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <Briefcase className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Teacher, Nurse, Engineer"
                    value={signUpOccupation}
                    onChange={(e) => setSignUpOccupation(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-church-gold/80 transition-colors"
                  />
                </div>
              </div>

              {/* House Address */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 pl-1">
                  House Address
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <MapPin className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Hse No 4, Ankaful Rd"
                    value={signUpAddress}
                    onChange={(e) => setSignUpAddress(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-church-gold/80 transition-colors"
                  />
                </div>
              </div>

              {/* Date of Birth (DOB) */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 pl-1">
                  Date of Birth
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <Calendar className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type="date"
                    required
                    value={signUpDob}
                    onChange={(e) => setSignUpDob(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-church-gold/80 transition-colors"
                  />
                </div>
              </div>

              {/* Branch / Parish */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 pl-1">
                  Branch / Parish
                </label>
                <div className="relative">
                  <select
                    value={signUpBranch}
                    onChange={(e) => setSignUpBranch(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-church-gold/80 transition-colors appearance-none cursor-pointer"
                  >
                    {BRANCHES.map((b) => (
                      <option key={b} value={b}>
                        {b} Branch
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                    <ChevronDown className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 pl-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="Min 6 chars"
                  value={signUpPassword}
                  onChange={(e) => setSignUpPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-church-gold/80 transition-colors"
                />
              </div>

              {/* Confirm Password */}
              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 pl-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="Min 6 chars"
                  value={signUpConfirmPassword}
                  onChange={(e) => setSignUpConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-church-gold/80 transition-colors"
                />
              </div>

            </div>

            <button
              type="submit"
              disabled={formLoading}
              className="w-full mt-4 flex items-center justify-center space-x-2 bg-church-burgundy hover:bg-church-burgundy/90 disabled:opacity-50 text-white py-3 px-6 rounded-xl font-bold transition-all shadow-md hover:shadow-lg cursor-pointer text-xs"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>{formLoading ? 'Creating Account...' : 'Create Account'}</span>
            </button>
          </form>
        )}



        {/* Scripture quote banner */}
        <div className="bg-church-cream/40 border-l-4 border-church-gold p-3 mt-5 text-left rounded-r-2xl">
          <p className="text-slate-600 text-xs font-serif italic">"{current.scripture}"</p>
          <p className="text-church-gold text-[9px] font-bold mt-1 uppercase tracking-wider">— {current.citation}</p>
        </div>
      </motion.div>
    </div>
  );
}
