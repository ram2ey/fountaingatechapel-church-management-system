import React, { useState, useEffect } from 'react';
import { 
  db, 
  auth, 
  handleFirestoreError, 
  OperationType,
  collection, 
  query, 
  onSnapshot, 
  updateDoc, 
  deleteDoc, 
  addDoc, 
  setDoc,
  doc, 
  serverTimestamp, 
  orderBy 
} from '../lib/firebase';
import { useAuth } from '../lib/AuthContext';
import { UserProfile, SmallGroup, PrayerRequest, BRANCHES } from '../types';
import { 
  Shield, 
  Users, 
  Plus, 
  Trash2, 
  Tag, 
  Calendar, 
  Bell, 
  Sliders, 
  Check, 
  CircleAlert, 
  CheckCircle, 
  Heart, 
  Clock, 
  FileText,
  UserCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';

export interface Announcement {
  id: string;
  title: string;
  content: string;
  category: 'General' | 'Worship' | 'Service' | 'Youth' | 'Giving';
  branch?: string;
  timestamp: any;
  authorName: string;
}

export default function AdminPortal() {
  const { user, profile } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState<'stats' | 'users' | 'announcements' | 'groups' | 'prayers' | 'invite'>('stats');
  
  // Real-time Data States
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [groupsList, setGroupsList] = useState<SmallGroup[]>([]);
  const [prayersList, setPrayersList] = useState<PrayerRequest[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);

  // Pre-registration States
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'member' | 'leader' | 'admin'>('member');
  const [invitePhone, setInvitePhone] = useState('');
  const [inviteOccupation, setInviteOccupation] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState(false);
  const [inviteError, setInviteError] = useState('');

  const handlePreRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName.trim() || !inviteEmail.trim()) {
      setInviteError("Name and Email are required fields.");
      return;
    }
    setInviteError('');
    setInviteSuccess(false);

    try {
      const emailDocId = inviteEmail.trim().toLowerCase();
      const userRef = doc(db, 'users', emailDocId);
      await setDoc(userRef, {
        email: emailDocId,
        displayName: inviteName.trim(),
        role: inviteRole,
        branch: 'Ankaful',
        phone: invitePhone.trim(),
        occupation: inviteOccupation.trim(),
        onboarded: true,
        createdAt: serverTimestamp()
      });

      setInviteName('');
      setInviteEmail('');
      setInviteRole('member');
      setInvitePhone('');
      setInviteOccupation('');
      setInviteSuccess(true);
      setTimeout(() => setInviteSuccess(false), 4000);
    } catch (err: any) {
      console.error(err);
      setInviteError("Failed to pre-register member: " + err.message);
    }
  };

  // Search/Filters
  const [memberSearch, setMemberSearch] = useState('');

  // Form States
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementContent, setAnnouncementContent] = useState('');
  const [announcementCategory, setAnnouncementCategory] = useState<'General' | 'Worship' | 'Service' | 'Youth' | 'Giving'>('General');
  const announcementBranch = 'Ankaful';
  
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [newGroupTime, setNewGroupTime] = useState('');
  const [newGroupCat, setNewGroupCat] = useState('Bible Study');
  const [newGroupLeader, setNewGroupLeader] = useState('');
  const newGroupBranch = 'Ankaful';

  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const isAuthorized = profile?.role === 'admin' || profile?.role === 'leader';

  useEffect(() => {
    if (!user || !isAuthorized) return;

    // 1. Fetch Users
    const usersQuery = query(collection(db, 'users'));
    const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        ...doc.data(),
        uid: doc.id
      })) as UserProfile[];
      setUsersList(data);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'users');
    });

    // 2. Fetch Groups
    const groupsQuery = query(collection(db, 'small_groups'));
    const unsubscribeGroups = onSnapshot(groupsQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as SmallGroup[];
      setGroupsList(data);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'small_groups');
    });

    // 3. Fetch Prayers
    const prayersQuery = query(collection(db, 'prayer_requests'), orderBy('timestamp', 'desc'));
    const unsubscribePrayers = onSnapshot(prayersQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as PrayerRequest[];
      setPrayersList(data);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'prayer_requests');
    });

    // 4. Fetch Announcements
    const annQuery = query(collection(db, 'announcements'), orderBy('timestamp', 'desc'));
    const unsubscribeAnn = onSnapshot(annQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as Announcement[];
      setAnnouncements(data);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'announcements');
    });

    return () => {
      unsubscribeUsers();
      unsubscribeGroups();
      unsubscribePrayers();
      unsubscribeAnn();
    };
  }, [user, isAuthorized]);

  if (!isAuthorized) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center h-full max-w-md mx-auto">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-3xl flex items-center justify-center mb-6">
          <CircleAlert size={32} />
        </div>
        <h3 className="text-2xl font-serif font-bold text-church-burgundy mb-2">Access Restrained</h3>
        <p className="text-slate-500 text-sm leading-relaxed mb-6">
          The Leader Portal contains administration suites reserved strictly for ordinated leaders, staff, or system administrators.
        </p>
      </div>
    );
  }

  // Handle Role Modification
  const handleUpdateRole = async (targetUid: string, nextRole: 'member' | 'leader' | 'admin') => {
    if (targetUid === user?.uid) {
      alert("Self-modification constraint: Changing your own administration role is disabled to prevent lockout.");
      return;
    }
    setLoadingAction(targetUid);
    try {
      const userRef = doc(db, 'users', targetUid);
      await updateDoc(userRef, { role: nextRole });
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAction(null);
    }
  };

  // Create Announcement
  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementTitle.trim() || !announcementContent.trim()) return;

    try {
      await addDoc(collection(db, 'announcements'), {
        title: announcementTitle.trim(),
        content: announcementContent.trim(),
        category: announcementCategory,
        branch: announcementBranch,
        timestamp: serverTimestamp(),
        authorName: profile?.displayName || 'Church Administrator'
      });
      setAnnouncementTitle('');
      setAnnouncementContent('');
      setAnnouncementCategory('General');
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Announcement
  const handleDeleteAnnouncement = async (id: string) => {
    if (!window.confirm("Delete this announcement? This action is permanent.")) return;
    try {
      await deleteDoc(doc(db, 'announcements', id));
    } catch (err) {
      console.error(err);
    }
  };

  // Create Group
  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim() || !newGroupDesc.trim() || !newGroupLeader.trim() || !newGroupTime.trim()) return;

    try {
      await addDoc(collection(db, 'small_groups'), {
        name: newGroupName.trim(),
        description: newGroupDesc.trim(),
        category: newGroupCat,
        meetingTime: newGroupTime.trim(),
        leaderName: newGroupLeader.trim(),
        branch: newGroupBranch,
        leaderId: '',
        members: []
      });
      setNewGroupName('');
      setNewGroupDesc('');
      setNewGroupLeader('');
      setNewGroupTime('');
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Group
  const handleDeleteGroup = async (id: string) => {
    if (!window.confirm("Archive and delete this small group?")) return;
    try {
      await deleteDoc(doc(db, 'small_groups', id));
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Prayer Request
  const handleDeletePrayer = async (id: string) => {
    if (!window.confirm("Delete or hide this prayer request from the wall?")) return;
    try {
      await deleteDoc(doc(db, 'prayer_requests', id));
    } catch (err) {
      console.error(err);
    }
  };

  const filteredUsers = usersList.filter(u => {
    return (u.displayName?.toLowerCase().includes(memberSearch.toLowerCase()) || 
            u.email?.toLowerCase().includes(memberSearch.toLowerCase()));
  });

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-church-gold/20">
        <div>
          <h2 className="text-4xl font-serif font-bold text-church-burgundy flex items-center gap-3">
            <Shield className="text-church-burgundy" size={32} />
            <span>Leader Desk</span>
          </h2>
          <p className="text-slate-500 mt-1">Administer church ministries, adjust user credentials, and publish community news.</p>
        </div>
        
        {/* Navigation Tabs */}
        <div className="flex overflow-x-auto max-w-full -mx-4 px-4 sm:mx-0 sm:px-0 space-x-1 bg-white p-1 rounded-2xl border border-church-gold/10 shadow-sm text-xs scrollbar-none">
          <button 
            onClick={() => setActiveSubTab('stats')}
            className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center space-x-2 flex-shrink-0 ${activeSubTab === 'stats' ? 'bg-church-burgundy text-white' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            📊 Analytics
          </button>
          <button 
            onClick={() => setActiveSubTab('users')}
            className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center space-x-2 flex-shrink-0 ${activeSubTab === 'users' ? 'bg-church-burgundy text-white' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            👥 Membership
          </button>
          <button 
            onClick={() => setActiveSubTab('announcements')}
            className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center space-x-2 flex-shrink-0 ${activeSubTab === 'announcements' ? 'bg-church-burgundy text-white' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            📢 Bulletin
          </button>
          <button 
            onClick={() => setActiveSubTab('groups')}
            className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center space-x-2 flex-shrink-0 ${activeSubTab === 'groups' ? 'bg-church-burgundy text-white' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            ⛪ Small Groups
          </button>
          <button 
            onClick={() => setActiveSubTab('prayers')}
            className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center space-x-2 flex-shrink-0 ${activeSubTab === 'prayers' ? 'bg-church-burgundy text-white' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            🙏 Prayer Wall
          </button>
          <button 
            onClick={() => setActiveSubTab('invite')}
            className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center space-x-2 flex-shrink-0 ${activeSubTab === 'invite' ? 'bg-church-burgundy text-white' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            ✉️ Pre-Register
          </button>
        </div>
      </div>

      {/* Content Render panels */}
      <AnimatePresence mode="wait">
        {activeSubTab === 'stats' && (
          <motion.div 
            key="stats"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {/* Numeric Stats Panels */}
            <div className="bg-white p-6 rounded-3xl border border-church-gold/10 shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">Parishioners</span>
                <p className="text-4xl font-serif font-bold text-slate-900">{usersList.length}</p>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-50 flex items-center text-xs text-church-olive font-bold gap-1">
                <Users size={14} />
                <span>Active registered profiles</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-church-gold/10 shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">Small Groups</span>
                <p className="text-4xl font-serif font-bold text-slate-900">{groupsList.length}</p>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-50 flex items-center text-xs text-church-olive font-bold gap-1">
                <Shield size={14} />
                <span>Ministries & home fellowships</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-church-gold/10 shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">Prayer Requests</span>
                <p className="text-4xl font-serif font-bold text-slate-900">{prayersList.length}</p>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-50 flex items-center text-xs text-church-olive font-bold gap-1">
                <Heart size={14} />
                <span>Intercession postings</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-church-gold/10 shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">Current Announcements</span>
                <p className="text-4xl font-serif font-bold text-slate-900">{announcements.length}</p>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-50 flex items-center text-xs text-church-olive font-bold gap-1">
                <Bell size={14} />
                <span>Active bulletin cards</span>
              </div>
            </div>

            <div className="lg:col-span-4 bg-church-cream/50 p-6 md:p-8 rounded-[2rem] border border-church-gold/20 flex flex-col md:flex-row md:items-center justify-between gap-6 mt-4">
              <div className="space-y-2">
                <h4 className="text-lg font-serif font-bold text-church-burgundy flex items-center gap-2">
                  <UserCheck size={20} />
                  <span>Administrative Policy</span>
                </h4>
                <p className="text-slate-600 text-sm max-w-2xl leading-relaxed">
                  Assign administrative credentials carefully. Promoting a member to <strong>Leader</strong> allows them to moderate boards, create challenges, and check off discipleship programs. Promoting to <strong>Admin</strong> grants complete configuration capabilities over the full platform.
                </p>
              </div>
              <div className="flex bg-white py-3 px-6 rounded-2xl border border-church-gold/10 text-xs font-serif italic text-church-gold shadow-sm shrink-0">
                "As each has received a gift, use it to serve one another." — 1 Peter 4:10
              </div>
            </div>
          </motion.div>
        )}

        {/* Members Role Management */}
        {activeSubTab === 'users' && (
          <motion.div 
            key="users"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="w-full md:w-72 relative">
                <input 
                  type="text" 
                  placeholder="Search members by name/email..."
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-church-burgundy text-sm shadow-sm"
                />
                <Users className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
              </div>
              <span className="text-xs font-bold text-slate-400 shrink-0">Showing {filteredUsers.length} profile records</span>
            </div>

            <div className="bg-white rounded-3xl border border-church-gold/10 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-[10px] uppercase tracking-widest font-bold text-slate-400">
                      <th className="p-4 pl-6">Parishioner Info</th>
                      <th className="p-4">Credential Level (State Role)</th>
                      <th className="p-4 pr-6 text-right">Actions / Credentials Adjuster</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
                    {filteredUsers.map((u) => (
                      <tr key={u.uid} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4 pl-6">
                          <p className="font-bold text-slate-800">{u.displayName}</p>
                          <p className="text-xs text-slate-400">{u.email}</p>
                        </td>
                        <td className="p-4">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                            u.role === 'admin' 
                              ? 'bg-red-50 text-red-600 ring-1 ring-red-200' 
                              : u.role === 'leader' 
                              ? 'bg-church-burgundy/10 text-church-burgundy ring-1 ring-church-burgundy/20' 
                              : 'bg-slate-50 text-slate-500 ring-1 ring-slate-200'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="p-4 pr-6 text-right">
                          <div className="inline-flex rounded-xl bg-slate-100 p-1 flex-wrap justify-end gap-1">
                            <button
                              disabled={loadingAction === u.uid}
                              onClick={() => handleUpdateRole(u.uid, 'member')}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${u.role === 'member' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                              Member
                            </button>
                            <button
                              disabled={loadingAction === u.uid}
                              onClick={() => handleUpdateRole(u.uid, 'leader')}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${u.role === 'leader' ? 'bg-church-burgundy text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                              Leader
                            </button>
                            <button
                              disabled={loadingAction === u.uid}
                              onClick={() => handleUpdateRole(u.uid, 'admin')}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${u.role === 'admin' ? 'bg-red-600 text-white shadow-sm' : 'text-slate-400 hover:text-red-600'}`}
                            >
                              Admin
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredUsers.length === 0 && (
                      <tr>
                        <td colSpan={3} className="p-8 text-center text-slate-400 italic">No member matches found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* Announcements Tab */}
        {activeSubTab === 'announcements' && (
          <motion.div 
            key="announcements"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            {/* Publisher Form */}
            <div className="lg:col-span-1 bg-white p-6 rounded-3xl border border-church-gold/10 shadow-sm h-fit">
              <h3 className="text-xl font-serif font-bold text-church-burgundy mb-4 flex items-center gap-2">
                <Bell size={20} />
                <span>Write Announcement</span>
              </h3>
              <form onSubmit={handleCreateAnnouncement} className="space-y-4 text-xs font-bold text-slate-400">
                <div className="space-y-1">
                  <label className="uppercase tracking-wide block">Bulletin Title</label>
                  <input 
                    type="text" 
                    placeholder="Worship night update, project build, etc."
                    value={announcementTitle}
                    onChange={(e) => setAnnouncementTitle(e.target.value)}
                    className="w-full p-3 rounded-xl bg-slate-50 border border-slate-100 outline-none focus:bg-white text-sm text-slate-700"
                  />
                </div>
                  <div className="space-y-1">
                  <label className="uppercase tracking-wide block">Broaden Scope/Category</label>
                  <select
                    value={announcementCategory}
                    onChange={(e) => setAnnouncementCategory(e.target.value as any)}
                    className="w-full p-3 rounded-xl bg-slate-50 border border-slate-100 outline-none focus:bg-white text-sm text-slate-700"
                  >
                    <option value="General">General</option>
                    <option value="Worship">Worship</option>
                    <option value="Service">Service</option>
                    <option value="Youth">Youth Hub</option>
                    <option value="Giving">Giving</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="uppercase tracking-wide block">Bulletin Text Body</label>
                  <textarea 
                    placeholder="Type details in elegant bullet format..."
                    value={announcementContent}
                    onChange={(e) => setAnnouncementContent(e.target.value)}
                    className="w-full h-32 p-3 rounded-xl bg-slate-50 border border-slate-100 outline-none focus:bg-white text-sm text-slate-700 resize-none"
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full py-3 bg-church-burgundy text-white rounded-xl font-bold flex items-center justify-center space-x-2 shadow-lg shadow-church-burgundy/10 hover:shadow-xl hover:translate-y-[-1px] active:translate-y-0 transition-all text-sm"
                >
                  <Plus size={16} />
                  <span>Publish News</span>
                </button>
              </form>
            </div>

            {/* List Of Announcements */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-xl font-serif font-bold text-slate-800 mb-4 block">Active Parish Bulletins</h3>
              {announcements.map((ann) => (
                <div key={ann.id} className="bg-white p-6 rounded-3xl border border-church-gold/10 shadow-sm relative group flex flex-col justify-between">
                  <button 
                    onClick={() => handleDeleteAnnouncement(ann.id)}
                    className="absolute top-4 right-4 p-2 text-slate-300 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <span className="px-3 py-1 bg-church-gold/15 text-church-gold rounded-full text-[10px] font-bold uppercase tracking-widest leading-none">
                        {ann.category}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {ann.timestamp ? format(new (ann.timestamp as any).toDate(), 'MMM d, h:mm a') : 'Recently Posted'}
                      </span>
                    </div>
                    <h4 className="text-xl font-bold text-slate-900 mb-2">{ann.title}</h4>
                    <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">{ann.content}</p>
                  </div>
                  <div className="pt-4 border-t border-slate-50 mt-4 flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    <span>Written by {ann.authorName}</span>
                  </div>
                </div>
              ))}
              {announcements.length === 0 && (
                <div className="bg-white p-8 rounded-3xl border border-church-gold/10 text-center italic text-slate-400">
                  No active announcements published. Write one using the manager panel on the left!
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Small Groups Management */}
        {activeSubTab === 'groups' && (
          <motion.div 
            key="groups"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            {/* Form Setup */}
            <div className="lg:col-span-1 bg-white p-6 rounded-3xl border border-church-gold/10 shadow-sm h-fit">
              <h3 className="text-xl font-serif font-bold text-church-burgundy mb-4 flex items-center gap-2">
                <Plus size={20} />
                <span>Establish Small Group</span>
              </h3>
              <form onSubmit={handleCreateGroup} className="space-y-4 text-xs font-bold text-slate-400">
                <div className="space-y-1">
                  <label className="uppercase tracking-wide block">Group Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Wednesday Men's Discipleship"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    className="w-full p-3 rounded-xl bg-slate-50 border border-slate-100 outline-none focus:bg-white text-sm text-slate-700"
                  />
                </div>

                <div className="space-y-1">
                  <label className="uppercase tracking-wide block">Ministry Focus</label>
                  <select
                    value={newGroupCat}
                    onChange={(e) => setNewGroupCat(e.target.value)}
                    className="w-full p-3 rounded-xl bg-slate-50 border border-slate-100 outline-none focus:bg-white text-sm text-slate-700"
                  >
                    <option value="Bible Study">Bible Study</option>
                    <option value="Men">Men's Ministry</option>
                    <option value="Women">Women's Ministry</option>
                    <option value="Young Adults">Young Adults</option>
                    <option value="Couples">Couples</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="uppercase tracking-wide block">Leader Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Deacon Keith, Sarah Myers"
                    value={newGroupLeader}
                    onChange={(e) => setNewGroupLeader(e.target.value)}
                    className="w-full p-3 rounded-xl bg-slate-50 border border-slate-100 outline-none focus:bg-white text-sm text-slate-700"
                  />
                </div>

                <div className="space-y-1">
                  <label className="uppercase tracking-wide block">Meeting Time</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Thursdays at 7:00 PM"
                    value={newGroupTime}
                    onChange={(e) => setNewGroupTime(e.target.value)}
                    className="w-full p-3 rounded-xl bg-slate-50 border border-slate-100 outline-none focus:bg-white text-sm text-slate-700"
                  />
                </div>

                <div className="space-y-1">
                  <label className="uppercase tracking-wide block">Description</label>
                  <textarea 
                    placeholder="Explain group studies, expectations, child-care details, etc."
                    value={newGroupDesc}
                    onChange={(e) => setNewGroupDesc(e.target.value)}
                    className="w-full h-24 p-3 rounded-xl bg-slate-50 border border-slate-100 outline-none focus:bg-white text-sm text-slate-700 resize-none"
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full py-3 bg-church-burgundy text-white rounded-xl font-bold flex items-center justify-center space-x-2 shadow-lg shadow-church-burgundy/10 hover:shadow-xl hover:translate-y-[-1px] active:translate-y-0 transition-all text-sm"
                >
                  <Plus size={16} />
                  <span>Launch Small Group</span>
                </button>
              </form>
            </div>

            {/* List */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-xl font-serif font-bold text-slate-800 mb-4 block">Active Small Groups</h3>
              <div className="grid grid-cols-1 gap-4">
                {groupsList.map((g) => (
                  <div key={g.id} className="bg-white p-6 rounded-3xl border border-church-gold/10 shadow-sm relative group flex justify-between gap-6">
                    <div className="flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2.5 py-1 bg-church-olive/15 text-church-olive rounded-full text-[9px] font-bold uppercase tracking-wider">
                          {g.category}
                        </span>
                        <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                          <Clock size={12} />
                          {g.meetingTime}
                        </span>
                      </div>
                      <h4 className="text-lg font-bold text-slate-900">{g.name}</h4>
                      <p className="text-slate-500 text-xs leading-relaxed max-w-xl line-clamp-2">{g.description}</p>
                      
                      <div className="flex gap-4 pt-2 text-xs font-bold text-slate-400 uppercase tracking-wide">
                        <span>Led by {g.leaderName}</span>
                        <span>•</span>
                        <span className="text-church-burgundy">{g.members?.length || 0} Registered Members</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleDeleteGroup(g.id)}
                      className="p-2 text-slate-300 hover:text-red-600 rounded-lg hover:bg-red-50 self-start transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                {groupsList.length === 0 && (
                  <div className="bg-white p-8 rounded-3xl border border-church-gold/10 text-center italic text-slate-400">
                    No small groups currently launched.
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Prayer Board Moderation */}
        {activeSubTab === 'prayers' && (
          <motion.div 
            key="prayers"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <h3 className="text-xl font-serif font-bold text-slate-800 mb-4 block">Moderation: public prayers</h3>
            {prayersList.map((pr) => (
              <div key={pr.id} className="bg-white p-6 rounded-3xl border border-church-gold/10 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 group hover:border-red-100 transition-colors">
                <div className="space-y-2 flex-grow">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-800">{pr.authorName}</span>
                    <span className="text-[10px] text-slate-400">
                      {pr.timestamp ? format(new (pr.timestamp as any).toDate(), 'MMM d, yyyy h:mm a') : 'Recently Posted'}
                    </span>
                  </div>
                  <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">{pr.content}</p>
                  
                  <div className="flex items-center gap-4 text-xs font-semibold text-slate-400">
                    <span className="flex items-center gap-1">
                      <Heart size={14} className="text-church-burgundy" /> 
                      {pr.prayingUsers?.length || 0} intercessors praying
                    </span>
                  </div>
                </div>
                
                <button 
                  onClick={() => handleDeletePrayer(pr.id)}
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold transition-all shrink-0 self-start md:self-center"
                >
                  <Trash2 size={14} />
                  <span>Remove / Flag</span>
                </button>
              </div>
            ))}
            {prayersList.length === 0 && (
              <div className="bg-white p-8 rounded-3xl border border-church-gold/10 text-center italic text-slate-400">
                No active prayer wall postings reported.
              </div>
            )}
          </motion.div>
        )}

        {activeSubTab === 'invite' && (
          <motion.div
            key="invite"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="max-w-xl mx-auto bg-white p-8 rounded-3xl border border-church-gold/10 shadow-sm space-y-6"
          >
            <div>
              <h3 className="text-2xl font-serif font-bold text-church-burgundy flex items-center gap-2">
                <span>✉️ Pre-Register Member</span>
              </h3>
              <p className="text-slate-500 text-xs mt-1 font-medium">
                Add a member's details ahead of time. When they sign in with Google using this email, their profile will be linked automatically, bypassing onboarding.
              </p>
            </div>

            <form onSubmit={handlePreRegister} className="space-y-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block">Full Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. John Doe"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    className="w-full p-3 rounded-xl bg-slate-50 border border-slate-100 outline-none focus:bg-white text-sm text-slate-700 font-medium"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="block">Email Address</label>
                  <input 
                    type="email" 
                    placeholder="e.g. johndoe@gmail.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full p-3 rounded-xl bg-slate-50 border border-slate-100 outline-none focus:bg-white text-sm text-slate-700 font-medium normal-case font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block">System Role</label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as any)}
                    className="w-full p-3 rounded-xl bg-slate-50 border border-slate-100 outline-none focus:bg-white text-sm text-slate-700 font-bold"
                  >
                    <option value="member">Member</option>
                    <option value="leader">Leader</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block">Phone Number</label>
                  <input 
                    type="tel" 
                    placeholder="e.g. +233 24..."
                    value={invitePhone}
                    onChange={(e) => setInvitePhone(e.target.value)}
                    className="w-full p-3 rounded-xl bg-slate-50 border border-slate-100 outline-none focus:bg-white text-sm text-slate-700 font-medium normal-case"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block">Occupation</label>
                <input 
                  type="text" 
                  placeholder="e.g. Doctor, Builder"
                  value={inviteOccupation}
                  onChange={(e) => setInviteOccupation(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-50 border border-slate-100 outline-none focus:bg-white text-sm text-slate-700 font-medium normal-case"
                />
              </div>

              {inviteError && (
                <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs font-bold font-mono">
                  ⚠️ {inviteError}
                </div>
              )}

              <button 
                type="submit"
                className="w-full py-4 bg-church-burgundy text-white rounded-2xl font-bold flex items-center justify-center space-x-2 shadow-lg shadow-church-burgundy/10 hover:shadow-xl hover:translate-y-[-1px] active:translate-y-0 transition-all text-sm cursor-pointer mt-4"
              >
                <span>Complete Pre-Registration</span>
              </button>

              {inviteSuccess && (
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-bold text-center animate-fade-in uppercase tracking-wider">
                  ✨ Member successfully pre-registered. Profile is ready for sign-in.
                </div>
              )}
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
