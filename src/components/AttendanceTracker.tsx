import React, { useState, useEffect } from 'react';
import { db, auth, handleFirestoreError, OperationType, collection, query, where, getDocs, addDoc, serverTimestamp, orderBy, onSnapshot, deleteDoc, doc } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { UserProfile } from '../types';
import { Calendar, CheckCircle2, ClipboardList, Key, Plus, Shield, Search, User, Users, Clock, Trash2, CheckSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';

interface CheckInRecord {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  eventName: 'Sunday Service' | "Children's Ministry" | 'Youth Group' | 'Midweek Prayer';
  date: string;
  timestamp: any;
  securityPin?: string;
  familyMembersCount: number;
}

export default function AttendanceTracker() {
  const { user, profile } = useAuth();
  const isLeader = profile?.role === 'leader' || profile?.role === 'admin';
  const [activeTab, setActiveTab] = useState<'checkin' | 'history' | 'leader'>('checkin');

  // Client states
  const [selectedEvent, setSelectedEvent] = useState<'Sunday Service' | "Children's Ministry" | 'Youth Group' | 'Midweek Prayer'>('Sunday Service');
  const [familyCount, setFamilyCount] = useState(0);
  const [securityPin, setSecurityPin] = useState('');
  const [checkedInToday, setCheckedInToday] = useState<CheckInRecord | null>(null);
  const [loading, setLoading] = useState(false);
  
  // History states
  const [myHistory, setMyHistory] = useState<CheckInRecord[]>([]);
  
  // Leader states
  const [allRecords, setAllRecords] = useState<CheckInRecord[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [searchMember, setSearchMember] = useState('');
  const [selectedEventFilter, setSelectedEventFilter] = useState<string>('All');

  // Helper for today's date string
  const todayStr = format(new Date(), 'yyyy-MM-dd');

  // Generate random 4-digit pin for Children's ministry
  useEffect(() => {
    if (selectedEvent === "Children's Ministry" && !securityPin) {
      const pin = Math.floor(1000 + Math.random() * 9000).toString();
      setSecurityPin(pin);
    } else if (selectedEvent !== "Children's Ministry") {
      setSecurityPin('');
    }
  }, [selectedEvent]);

  // Fetch / check if checked in today + fetch history
  useEffect(() => {
    if (!user) return;

    // Check check-ins for the current user today
    const checkTodayQuery = query(
      collection(db, 'attendance'),
      where('userId', '==', user.uid),
      where('date', '==', todayStr)
    );

    const unsubscribeToday = onSnapshot(checkTodayQuery, (snap) => {
      if (!snap.empty) {
        const docSnap = snap.docs[0];
        setCheckedInToday({ id: docSnap.id, ...docSnap.data() } as CheckInRecord);
      } else {
        setCheckedInToday(null);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'attendance');
    });

    // Load history
    const historyQuery = query(
      collection(db, 'attendance'),
      where('userId', '==', user.uid),
      orderBy('date', 'desc')
    );

    const unsubscribeHistory = onSnapshot(historyQuery, (snap) => {
      const records = snap.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      })) as CheckInRecord[];
      setMyHistory(records);
    }, (error) => {
      console.log("No existing order by index or error fetching personal history:", error);
      // Fallback query without orderBy to ensure it works even before indexes are generated
      const simpleQuery = query(
        collection(db, 'attendance'),
        where('userId', '==', user.uid)
      );
      getDocs(simpleQuery).then((snap) => {
        const records = snap.docs.map(docSnap => ({
          id: docSnap.id,
          ...docSnap.data()
        })) as CheckInRecord[];
        setMyHistory(records.sort((a, b) => b.date.localeCompare(a.date)));
      }).catch(err => handleFirestoreError(err, OperationType.GET, 'attendance_history'));
    });

    return () => {
      unsubscribeToday();
      unsubscribeHistory();
    };
  }, [user, todayStr]);

  // Lead-only Fetching
  useEffect(() => {
    if (!isLeader) return;

    // Subscribe to all check-ins today
    const allTodayQuery = query(
      collection(db, 'attendance'),
      where('date', '==', todayStr)
    );

    const unsubscribeAllToday = onSnapshot(allTodayQuery, (snap) => {
      const records = snap.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      })) as CheckInRecord[];
      setAllRecords(records);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'all_attendance');
    });

    // Load users list for leader check-in helper
    const usersCollection = collection(db, 'users');
    getDocs(usersCollection).then((snap) => {
      const members = snap.docs.map(docSnap => ({
        uid: docSnap.id,
        ...docSnap.data()
      })) as UserProfile[];
      setAllUsers(members);
    }).catch((error) => {
      handleFirestoreError(error, OperationType.GET, 'users_list');
    });

    return () => {
      unsubscribeAllToday();
    };
  }, [isLeader, todayStr]);

  // Perform self check-in
  const handleSelfCheckIn = async () => {
    if (!user || loading) return;
    setLoading(true);

    try {
      const record = {
        userId: user.uid,
        userName: profile?.displayName || user.displayName || 'Member',
        userEmail: user.email || '',
        eventName: selectedEvent,
        branch: profile?.branch || 'Ankaful',
        date: todayStr,
        timestamp: serverTimestamp(),
        familyMembersCount: familyCount,
        ...(securityPin ? { securityPin } : {})
      };

      await addDoc(collection(db, 'attendance'), record);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'attendance');
    } finally {
      setLoading(false);
    }
  };

  // Perform leader check-in for someone else
  const handleLeaderCheckIn = async (member: UserProfile) => {
    if (loading) return;

    // Check if member already checked into current event today
    const exists = allRecords.some(r => r.userId === member.uid && r.eventName === selectedEvent);
    if (exists) {
      alert(`${member.displayName} is already checked into ${selectedEvent} for today.`);
      return;
    }

    setLoading(true);
    try {
      const record = {
        userId: member.uid,
        userName: member.displayName,
        userEmail: member.email,
        eventName: selectedEvent,
        branch: member.branch || 'Ankaful',
        date: todayStr,
        timestamp: serverTimestamp(),
        familyMembersCount: 0,
        ...(selectedEvent === "Children's Ministry" ? { securityPin: Math.floor(1000 + Math.random() * 9000).toString() } : {})
      };

      await addDoc(collection(db, 'attendance'), record);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'attendance_leader');
    } finally {
      setLoading(false);
    }
  };

  // Turn off or delete a check-in
  const handleDeleteCheckIn = async (recordId: string) => {
    if (!confirm('Are you sure you want to remove this check-in?')) return;
    try {
      await deleteDoc(doc(db, 'attendance', recordId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'attendance_remove');
    }
  };

  const filteredMembersForCheckIn = allUsers.filter(u => {
    return u.displayName.toLowerCase().includes(searchMember.toLowerCase()) ||
           u.email.toLowerCase().includes(searchMember.toLowerCase());
  });

  const filteredRecordsForBranch = allRecords;

  const displayedRecords = selectedEventFilter === 'All' 
    ? filteredRecordsForBranch 
    : filteredRecordsForBranch.filter(r => r.eventName === selectedEventFilter);

  return (
    <div className="space-y-6">
      {/* Navigation Headers */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-church-gold/20 pb-4">
        <div>
          <h2 className="text-3xl font-serif font-bold text-church-burgundy">Attendance Tracker</h2>
          <p className="text-slate-500 font-medium">Simple, secure check-in portal for children's ministry and services.</p>
        </div>

        {/* Tab switcher */}
        <div className="flex overflow-x-auto max-w-full -mx-4 px-4 sm:mx-0 sm:px-0 space-x-1 bg-white p-1 rounded-2xl border border-church-gold/10 shadow-sm text-xs scrollbar-none">
          <button 
            onClick={() => setActiveTab('checkin')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 flex-shrink-0 ${activeTab === 'checkin' ? 'bg-church-burgundy text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <CheckSquare size={14} />
            <span>Check-In</span>
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 flex-shrink-0 ${activeTab === 'history' ? 'bg-church-burgundy text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <ClipboardList size={14} />
            <span>My History</span>
          </button>
          {isLeader && (
            <button 
              onClick={() => setActiveTab('leader')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 flex-shrink-0 ${activeTab === 'leader' ? 'bg-church-burgundy text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <Users size={14} />
              <span>Leader Console</span>
            </button>
          )}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* CHECK-IN TAB */}
        {activeTab === 'checkin' && (
          <motion.div
            key="checkin"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {/* Form Column */}
            <div className="md:col-span-2 bg-white rounded-3xl p-6 md:p-8 border border-church-gold/10 shadow-sm space-y-6">
              {checkedInToday ? (
                <div className="text-center py-8 space-y-4">
                  <div className="w-16 h-16 bg-church-olive/10 text-church-olive rounded-full flex items-center justify-center mx-auto shadow-inner">
                    <CheckCircle2 size={36} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-serif font-bold text-slate-800">Check-In Completed!</h3>
                    <p className="text-slate-500 mt-1">You are all set for today's services.</p>
                  </div>

                  <div className="max-w-md mx-auto bg-slate-50 rounded-2xl p-6 border border-slate-100 text-left space-y-3 mt-6">
                    <div className="flex justify-between border-b pb-2 text-sm border-slate-200">
                      <span className="text-slate-500 font-medium">Program</span>
                      <strong className="text-slate-800">{checkedInToday.eventName}</strong>
                    </div>
                    <div className="flex justify-between border-b pb-2 text-sm border-slate-200">
                      <span className="text-slate-500 font-medium">Date</span>
                      <strong className="text-slate-800">{format(new Date(checkedInToday.date + 'T00:00:00'), 'eeee, MMMM d, yyyy')}</strong>
                    </div>
                    {checkedInToday.familyMembersCount > 0 && (
                      <div className="flex justify-between border-b pb-2 text-sm border-slate-200">
                        <span className="text-slate-500 font-medium">Generations / Guests</span>
                        <strong className="text-slate-800">+{checkedInToday.familyMembersCount} guests</strong>
                      </div>
                    )}
                    {checkedInToday.securityPin && (
                      <div className="bg-church-gold/5 border border-church-gold/20 rounded-xl p-4 mt-4 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-church-gold/10 text-church-gold rounded-lg flex items-center justify-center">
                            <Shield size={20} />
                          </div>
                          <div>
                            <p className="text-[10px] uppercase font-bold text-church-gold tracking-wider">Pick-up Claim Pin</p>
                            <p className="text-xs text-slate-500">Provide this code during checkout</p>
                          </div>
                        </div>
                        <span className="font-mono text-2xl font-bold tracking-widest text-church-burgundy bg-white px-4 py-1.5 rounded-lg border border-church-gold/20 shadow-sm">
                          {checkedInToday.securityPin}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-2xl font-serif font-bold text-church-burgundy mb-1">Weekly Program Check-In</h3>
                    <p className="text-slate-500 text-sm">Please select the fellowship, service, or program you are attending today.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {(['Sunday Service', "Children's Ministry", 'Youth Group', 'Midweek Prayer'] as const).map((event) => (
                      <button
                        key={event}
                        onClick={() => setSelectedEvent(event)}
                        className={`p-4 rounded-2xl border text-left transition-all relative ${
                          selectedEvent === event
                            ? 'border-church-burgundy bg-church-burgundy/5 text-church-burgundy ring-1 ring-church-burgundy'
                            : 'border-slate-100 bg-slate-50/50 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                        }`}
                      >
                        <p className="font-bold text-sm">{event}</p>
                        <p className="text-[10px] text-slate-500 mt-1">
                          {event === 'Sunday Service' && 'Morning Fellowship'}
                          {event === "Children's Ministry" && 'Grades Pre-K to 5'}
                          {event === 'Youth Group' && 'Grades 6 to 12'}
                          {event === 'Midweek Prayer' && 'Wednesday Fellowship'}
                        </p>
                        {selectedEvent === event && (
                          <div className="absolute right-3 top-3 w-4 h-4 bg-church-burgundy rounded-full flex items-center justify-center text-white">
                            <CheckSquare size={10} />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Family Counts */}
                  <div className="space-y-3 pt-2">
                    <label className="block text-sm font-bold text-slate-700">Guests & Family Members Checked In With You</label>
                    <div className="flex items-center space-x-4 bg-slate-50 rounded-2xl p-4 border border-slate-100 max-w-sm">
                      <button
                        type="button"
                        onClick={() => setFamilyCount(Math.max(0, familyCount - 1))}
                        className="w-10 h-10 rounded-xl bg-white text-slate-600 border border-slate-200 flex items-center justify-center hover:bg-slate-100 transition-colors font-bold text-lg"
                      >
                        -
                      </button>
                      <span className="flex-1 text-center font-bold text-lg text-slate-800">{familyCount}</span>
                      <button
                        type="button"
                        onClick={() => setFamilyCount(Math.min(10, familyCount + 1))}
                        className="w-10 h-10 rounded-xl bg-white text-slate-600 border border-slate-200 flex items-center justify-center hover:bg-slate-100 transition-colors font-bold text-lg"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Children's Ministry Security Alert Pin */}
                  {selectedEvent === "Children's Ministry" && (
                    <div className="bg-church-gold/5 border border-church-gold/20 rounded-2xl p-4 space-y-2">
                      <div className="flex items-center space-x-3 text-church-burgundy">
                        <Key size={18} />
                        <h4 className="font-bold text-sm font-serif">Security Claim Code</h4>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        To protect your young ones, Fountain Gate Chapel automatically issues a unique security pin. Department leads will match this claim code on checkout.
                      </p>
                      <div className="font-mono text-xl font-bold tracking-widest text-church-burgundy bg-white px-4 py-2 rounded-xl border border-church-gold/15 w-fit mt-2">
                        {securityPin}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleSelfCheckIn}
                    disabled={loading}
                    className="w-full py-4 bg-church-burgundy hover:bg-church-burgundy/90 text-white font-bold rounded-2xl text-center shadow-lg transition-transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
                  >
                    {loading ? 'Processing...' : 'Confirm My Check-In'}
                  </button>
                </div>
              )}
            </div>

            {/* Sidebar Guidelines */}
            <div className="bg-white rounded-3xl p-6 border border-church-gold/10 shadow-sm h-fit space-y-6">
              <div className="flex items-center space-x-3 text-church-burgundy border-b pb-3 border-church-gold/10">
                <Shield size={20} className="text-church-gold" />
                <h3 className="font-serif font-bold text-lg text-slate-800">Safety Guidelines</h3>
              </div>
              <ul className="space-y-4">
                <li className="flex items-start space-x-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-church-gold mt-1.5"></div>
                  <div>
                    <p className="font-bold text-xs text-slate-800">Child Lock-In Protection</p>
                    <p className="text-[11px] text-slate-500">Pick-up pin must match on children's dismissal tags.</p>
                  </div>
                </li>
                <li className="flex items-start space-x-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-church-gold mt-1.5"></div>
                  <div>
                    <p className="font-bold text-xs text-slate-800">Medical Notifications</p>
                    <p className="text-[11px] text-slate-500">Alert our classroom leads about any allergies or medications.</p>
                  </div>
                </li>
                <li className="flex items-start space-x-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-church-gold mt-1.5"></div>
                  <div>
                    <p className="font-bold text-xs text-slate-800">Annual Tax Documents</p>
                    <p className="text-[11px] text-slate-500">Attendance data is preserved for tax receipt claims where relevant.</p>
                  </div>
                </li>
              </ul>
            </div>
          </motion.div>
        )}

        {/* PERSONAL HISTORY TAB */}
        {activeTab === 'history' && (
          <motion.div
            key="history"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white rounded-3xl p-6 border border-church-gold/10 shadow-sm max-w-3xl mx-auto"
          >
            <h3 className="text-2xl font-serif font-bold text-church-burgundy mb-4">My Past Check-Ins</h3>
            
            {myHistory.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Calendar className="mx-auto mb-3 text-slate-300" size={48} />
                <p className="text-sm">No attendance check-ins found. Check back once you log in today!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {myHistory.map((record) => (
                  <div 
                    key={record.id}
                    className="flex flex-wrap items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-church-burgundy/5 text-church-burgundy rounded-xl flex items-center justify-center">
                        <Calendar size={22} />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800">{record.eventName}</h4>
                        <p className="text-[11px] text-slate-500 flex items-center space-x-1.5">
                          <span>{format(new Date(record.date + 'T00:00:00'), 'EEEE, MMMM d, yyyy')}</span>
                          {record.familyMembersCount > 0 && (
                            <span className="text-church-gold font-bold">({record.familyMembersCount + 1} Attendees)</span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      {record.securityPin && (
                        <span className="font-mono text-xs font-bold bg-white text-church-burgundy border border-church-gold/20 px-3 py-1 rounded-lg">
                          Pin: {record.securityPin}
                        </span>
                      )}
                      <span className="text-xs text-church-olive font-bold bg-church-olive/5 px-3 py-1 rounded-full border border-church-olive/15 flex items-center space-x-1">
                        <CheckCircle2 size={12} />
                        <span>Verified</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* LEADER CONSOLE TAB */}
        {activeTab === 'leader' && isLeader && (
          <motion.div
            key="leader"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Quick stats board */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-church-gold/10 shadow-sm">
                <p className="text-[10px] uppercase font-bold text-slate-400">Total Check-Ins Today</p>
                <p className="text-3xl font-serif font-bold text-church-burgundy mt-1">
                  {filteredRecordsForBranch.reduce((total, r) => total + 1 + r.familyMembersCount, 0)}
                </p>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-church-gold/10 shadow-sm">
                <p className="text-[10px] uppercase font-bold text-slate-400">Sunday Service</p>
                <p className="text-3xl font-serif font-bold text-slate-800">
                  {filteredRecordsForBranch.filter(r => r.eventName === 'Sunday Service').reduce((total, r) => total + 1 + r.familyMembersCount, 0)}
                </p>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-church-gold/10 shadow-sm">
                <p className="text-[10px] uppercase font-bold text-slate-400">Children's Ministry</p>
                <p className="text-3xl font-serif font-bold text-slate-800">
                  {filteredRecordsForBranch.filter(r => r.eventName === "Children's Ministry").reduce((total, r) => total + 1 + r.familyMembersCount, 0)}
                </p>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-church-gold/10 shadow-sm">
                <p className="text-[10px] uppercase font-bold text-slate-400">Other Activities</p>
                <p className="text-3xl font-serif font-bold text-slate-800">
                  {filteredRecordsForBranch.filter(r => r.eventName !== 'Sunday Service' && r.eventName !== "Children's Ministry").reduce((total, r) => total + 1 + r.familyMembersCount, 0)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Daily Attendees Feed */}
              <div className="md:col-span-2 bg-white rounded-3xl p-6 border border-church-gold/10 shadow-sm space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-3 border-church-gold/10">
                  <h3 className="text-xl font-serif font-bold text-slate-800">Checked-In Feed</h3>
                  <div className="flex space-x-1 bg-slate-50 p-1 rounded-xl border border-slate-100">
                    {['All', 'Sunday Service', "Children's Ministry", 'Youth Group'].map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSelectedEventFilter(cat)}
                        className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-colors ${
                          selectedEventFilter === cat ? 'bg-church-burgundy text-white' : 'text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        {cat === 'all' ? 'All' : cat}
                      </button>
                    ))}
                  </div>
                </div>

                {displayedRecords.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    <ClipboardList className="mx-auto mb-3 text-slate-200" size={40} />
                    <p className="text-sm">No members are checked into this program yet.</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                    {displayedRecords.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl hover:bg-church-cream/20 transition-colors">
                        <div>
                          <p className="font-bold text-sm text-slate-800">{item.userName}</p>
                          <p className="text-[10px] text-slate-500 flex items-center space-x-2">
                            <span>{item.eventName}</span>
                            {item.familyMembersCount > 0 && (
                              <span className="text-church-burgundy font-bold">(+{item.familyMembersCount} guests)</span>
                            )}
                          </p>
                        </div>
                        <div className="flex items-center space-x-3">
                          {item.securityPin && (
                            <span className="font-mono text-xs font-bold text-church-gold bg-church-gold/5 px-2 py-0.5 rounded border border-church-gold/20">
                              Pin: {item.securityPin}
                            </span>
                          )}
                          <button
                            onClick={() => handleDeleteCheckIn(item.id)}
                            className="text-slate-400 hover:text-red-500 p-1 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Leader Quick Check-In Side Panel */}
              <div className="bg-white rounded-3xl p-6 border border-church-gold/10 shadow-sm space-y-4">
                <h3 className="text-lg font-serif font-bold text-slate-800">Manual Check-In</h3>
                <p className="text-xs text-slate-500">Log attendance manually for members arriving without devices.</p>
                
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400">
                    <Search size={16} />
                  </span>
                  <input
                    type="text"
                    placeholder="Search church body..."
                    value={searchMember}
                    onChange={(e) => setSearchMember(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 text-xs rounded-xl outline-none focus:ring-2 focus:ring-church-burgundy"
                  />
                </div>

                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {filteredMembersForCheckIn.slice(0, 10).map((member) => (
                    <div 
                      key={member.uid}
                      className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-100 rounded-xl"
                    >
                      <div className="text-left">
                        <p className="font-bold text-xs text-slate-800">{member.displayName}</p>
                        <p className="text-[9px] text-slate-400 truncate max-w-[120px]">{member.email}</p>
                      </div>
                      <button
                        onClick={() => handleLeaderCheckIn(member)}
                        className="py-1 px-2.5 bg-church-burgundy text-white text-[9px] font-bold rounded-lg hover:bg-church-burgundy/95 transition-all text-center flex items-center space-x-1"
                      >
                        <Plus size={10} />
                        <span>Log</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
