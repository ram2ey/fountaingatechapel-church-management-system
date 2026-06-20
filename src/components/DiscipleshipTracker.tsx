import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType, collection, query, where, getDocs, addDoc, updateDoc, doc, serverTimestamp, onSnapshot } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { UserProfile, DiscipleshipRecord } from '../types';
import { Award, BookOpen, CheckCircle, Compass, Heart, MessageSquare, Plus, Search, Shield, User, Users, Star, UserPlus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';

const MILESTONES_LIST = [
  'Water Baptism',
  'Church Membership Covenant',
  'Step 1: Faith Foundations',
  'Volunteer Orientation',
  'Active Service placement',
  'Leadership Commission'
];

const AVAILABLE_COURSES = [
  { id: 'alpha', name: 'The Alpha Course', desc: 'An interactive introduction to the Christian faith.' },
  { id: 'foundations', name: 'Foundations of Faith', desc: 'Deep dive into fundamental biblical doctrines.' },
  { id: 'servant', name: 'Servant Leadership', desc: 'Equipping volunteers for church-wide action.' },
  { id: 'hermeneutics', name: 'Basic Hermeneutics', desc: 'How to study, interpret, and apply scripture.' }
];

export default function DiscipleshipTracker() {
  const { user, profile } = useAuth();
  const isLeader = profile?.role === 'leader' || profile?.role === 'admin';
  const [activeTab, setActiveTab] = useState<'mygrowth' | 'leader'>('mygrowth');

  // Personal state
  const [personalRecord, setPersonalRecord] = useState<DiscipleshipRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [mentorRequestSent, setMentorRequestSent] = useState(false);

  // Leader state
  const [allRecords, setAllRecords] = useState<DiscipleshipRecord[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<DiscipleshipRecord | null>(null);
  const [searchMember, setSearchMember] = useState('');
  
  // Custom course creation & progress editing state
  const [newCourseName, setNewCourseName] = useState('');
  const [leaderMentorId, setLeaderMentorId] = useState('');
  const [leaderNotes, setLeaderNotes] = useState('');

  // Fetch personal discipleship progress
  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'discipleship'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snap) => {
      if (!snap.empty) {
        const docSnap = snap.docs[0];
        setPersonalRecord({ id: docSnap.id, ...docSnap.data() } as DiscipleshipRecord);
      } else {
        setPersonalRecord(null);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'discipleship');
    });

    return unsubscribe;
  }, [user]);

  // Fetch leader records list
  useEffect(() => {
    if (!isLeader) return;

    const unsubscribeRecords = onSnapshot(collection(db, 'discipleship'), (snap) => {
      const records = snap.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      })) as DiscipleshipRecord[];
      setAllRecords(records);
    });

    getDocs(collection(db, 'users')).then(snap => {
      const usersData = snap.docs.map(docSnap => ({
        uid: docSnap.id,
        ...docSnap.data()
      })) as UserProfile[];
      setAllUsers(usersData);
    });

    return unsubscribeRecords;
  }, [isLeader]);

  // Create discipleship record if missing
  const initDiscipleshipRecord = async (targetUid?: string, targetName?: string) => {
    const userIdToUse = targetUid || user?.uid;
    const userNameToUse = targetName || profile?.displayName || 'Member';
    if (!userIdToUse) return;

    setLoading(true);
    try {
      const defaultRecord: Omit<DiscipleshipRecord, 'id'> = {
        userId: userIdToUse,
        userName: userNameToUse,
        completedMilestones: [],
        completedCourses: [],
        lastUpdated: serverTimestamp(),
        notes: ''
      };

      const docRef = await addDoc(collection(db, 'discipleship'), defaultRecord);
      const newRec = { id: docRef.id, ...defaultRecord } as DiscipleshipRecord;
      if (!targetUid) {
        setPersonalRecord(newRec);
      } else {
        setSelectedRecord(newRec);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'discipleship_registration');
    } finally {
      setLoading(false);
    }
  };

  // Toggle water baptism or any milestone
  const toggleMilestone = async (record: DiscipleshipRecord, milestone: string) => {
    if (!isLeader) return; // milestones should be checked by leaders / verified officially
    const list = [...record.completedMilestones];
    const index = list.indexOf(milestone);
    
    if (index > -1) {
      list.splice(index, 1);
    } else {
      list.push(milestone);
    }

    try {
      const docRef = doc(db, 'discipleship', record.id);
      await updateDoc(docRef, {
        completedMilestones: list,
        lastUpdated: serverTimestamp()
      });
      
      // Update selected record state if editing in view
      if (selectedRecord?.id === record.id) {
        setSelectedRecord({ ...selectedRecord, completedMilestones: list });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'discipleship_milestone');
    }
  };

  // Add course completion
  const addCompletedCourse = async (record: DiscipleshipRecord, courseName: string) => {
    if (!isLeader || !courseName) return;

    const completedCourses = [...record.completedCourses, {
      courseName,
      completedAt: format(new Date(), 'yyyy-MM-dd')
    }];

    try {
      const docRef = doc(db, 'discipleship', record.id);
      await updateDoc(docRef, {
        completedCourses,
        lastUpdated: serverTimestamp()
      });

      if (selectedRecord?.id === record.id) {
        setSelectedRecord({ ...selectedRecord, completedCourses });
      }
      setNewCourseName('');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'discipleship_course');
    }
  };

  // Update leadership mentor configuration
  const handleAssignMentor = async (record: DiscipleshipRecord) => {
    if (!isLeader) return;
    const mentorProfile = allUsers.find(u => u.uid === leaderMentorId);
    
    try {
      const docRef = doc(db, 'discipleship', record.id);
      await updateDoc(docRef, {
        mentorId: leaderMentorId,
        mentorName: mentorProfile?.displayName || 'Assigned Mentor',
        notes: leaderNotes,
        lastUpdated: serverTimestamp()
      });

      if (selectedRecord?.id === record.id) {
        setSelectedRecord({ 
          ...selectedRecord, 
          mentorId: leaderMentorId,
          mentorName: mentorProfile?.displayName || 'Assigned Mentor',
          notes: leaderNotes
        });
      }
      alert('Mentor has been configured successfully.');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'discipleship_mentor');
    }
  };

  // Filter members list
  const filteredUsers = allUsers.filter(u => {
    return (u.displayName || '').toLowerCase().includes(searchMember.toLowerCase()) ||
           (u.email || '').toLowerCase().includes(searchMember.toLowerCase());
  });

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-church-gold/20 pb-4">
        <div>
          <h2 className="text-3xl font-serif font-bold text-church-burgundy">Discipleship Tracker</h2>
          <p className="text-slate-500 font-medium">
            Track your spiritual milestones, mentorship partnerships, and faith classes.
          </p>
        </div>

        {isLeader && (
          <div className="flex overflow-x-auto max-w-full -mx-4 px-4 sm:mx-0 sm:px-0 space-x-1 bg-white p-1 rounded-2xl border border-church-gold/10 shadow-sm text-xs scrollbar-none">
            <button 
              onClick={() => setActiveTab('mygrowth')}
              className={`px-4 py-2 rounded-xl font-bold transition-all flex-shrink-0 ${activeTab === 'mygrowth' ? 'bg-church-burgundy text-white' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              My Growth
            </button>
            <button 
              onClick={() => setActiveTab('leader')}
              className={`px-4 py-2 rounded-xl font-bold transition-all flex-shrink-0 ${activeTab === 'leader' ? 'bg-church-burgundy text-white' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              Mentorship Board
            </button>
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'mygrowth' && (
          <motion.div
            key="mygrowth"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* Milestones and Progress */}
            <div className="lg:col-span-2 bg-white rounded-3xl p-6 md:p-8 border border-church-gold/10 shadow-sm space-y-6">
              <div>
                <h3 className="text-2xl font-serif font-bold text-church-burgundy mb-2">My Growth Milestones</h3>
                <p className="text-slate-500 text-sm">Spiritual commitments represent active markers along your path. Reach out to pastoral leadership to verify your growth milestones.</p>
              </div>

              {!personalRecord ? (
                <div className="text-center py-8 space-y-4">
                  <p className="text-slate-500 text-sm">You haven't initiated a milestone tracker yet.</p>
                  <button
                    onClick={() => initDiscipleshipRecord()}
                    disabled={loading}
                    className="px-6 py-2.5 bg-church-burgundy hover:bg-church-burgundy/95 text-white font-bold rounded-2xl transition-all"
                  >
                    {loading ? 'Initializing...' : 'Get Started Now'}
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {MILESTONES_LIST.map((milestone) => {
                    const isCompleted = personalRecord.completedMilestones.includes(milestone);
                    return (
                      <div
                        key={milestone}
                        className={`p-4 rounded-2xl border flex items-center justify-between transition-colors ${
                          isCompleted
                            ? 'bg-church-olive/5 border-church-olive/20 text-church-olive'
                            : 'bg-slate-50/50 border-slate-100 text-slate-500'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isCompleted ? 'bg-church-olive/10' : 'bg-slate-200/50'}`}>
                            <Award size={18} />
                          </div>
                          <span className="font-bold text-xs">{milestone}</span>
                        </div>
                        {isCompleted ? (
                          <CheckCircle size={18} className="text-church-olive" />
                        ) : (
                          <span className="text-[10px] font-bold text-slate-400">In Progress</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Verified completed courses */}
              {personalRecord && (
                <div className="border-t border-church-gold/10 pt-6 space-y-4">
                  <h4 className="font-serif font-bold text-slate-800 text-lg">Completed Classes & Programs</h4>
                  {personalRecord.completedCourses.length === 0 ? (
                    <p className="text-xs text-slate-400">No courses listed as completed yet. Enroll in a weekly study circle or study group to begin tracking academic progress.</p>
                  ) : (
                    <div className="space-y-3">
                      {personalRecord.completedCourses.map((c, i) => (
                        <div key={i} className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-100 rounded-xl">
                          <div className="flex items-center space-x-3">
                            <BookOpen size={16} className="text-church-burgundy" />
                            <span className="font-bold text-xs text-slate-800">{c.courseName}</span>
                          </div>
                          <span className="text-[10px] font-bold text-slate-400">Completed: {c.completedAt}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Mentorship Column */}
            <div className="space-y-6">
              {/* Active Mentor status */}
              <div className="bg-white rounded-3xl p-6 border border-church-gold/10 shadow-sm space-y-4">
                <div className="flex items-center space-x-3 text-church-burgundy border-b pb-3 border-church-gold/10">
                  <Compass size={20} className="text-church-gold" />
                  <h3 className="font-serif font-bold text-slate-800 text-lg">Mentorship Connection</h3>
                </div>

                {personalRecord?.mentorId ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center space-x-3">
                      <div className="w-10 h-10 bg-church-burgundy rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {personalRecord.mentorName?.[0]}
                      </div>
                      <div>
                        <p className="font-bold text-xs text-slate-800">{personalRecord.mentorName}</p>
                        <p className="text-[10px] text-slate-400">Active Mentor</p>
                      </div>
                    </div>
                    {personalRecord.notes && (
                      <div className="p-4 bg-church-cream/40 rounded-2xl border border-church-gold/15 text-left">
                        <p className="text-[10px] uppercase font-bold text-church-gold tracking-wider mb-1">Encouragement Logs</p>
                        <p className="text-xs text-slate-600 leading-relaxed italic">"{personalRecord.notes}"</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6 space-y-3">
                    <Heart size={32} className="mx-auto text-church-burgundy/40" />
                    <p className="text-slate-500 text-xs">Request a mentoring partner or discipleship leader to guide your spiritual growth study.</p>
                    {mentorRequestSent ? (
                      <span className="inline-block px-4 py-1.5 bg-church-olive/15 text-church-olive rounded-full font-bold text-xs border border-church-olive/20">
                        Request Submitted
                      </span>
                    ) : (
                      <button
                        onClick={() => setMentorRequestSent(true)}
                        className="py-2 px-4 bg-church-burgundy hover:bg-church-burgundy/95 text-white font-bold text-xs rounded-xl"
                      >
                        Request Partner Link
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Class catalog suggestions */}
              <div className="bg-white rounded-3xl p-6 border border-church-gold/10 shadow-sm space-y-4">
                <h4 className="font-serif font-bold text-slate-800 text-lg">Faith Studies Catalog</h4>
                <div className="space-y-3">
                  {AVAILABLE_COURSES.map((course) => (
                    <div key={course.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                      <p className="font-bold text-xs text-slate-800">{course.name}</p>
                      <p className="text-[10px] text-slate-500 leading-relaxed">{course.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* LEADER ENROLLMENT & CONTROL PANEL */}
        {activeTab === 'leader' && isLeader && (
          <motion.div
            key="leader"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {/* Find Member and Enroll Panel */}
            <div className="bg-white rounded-3xl p-6 border border-church-gold/10 shadow-sm space-y-4 h-fit">
              <h3 className="text-xl font-serif font-bold text-slate-800">
                All Members
              </h3>
              
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400">
                  <Search size={16} />
                </span>
                <input
                  type="text"
                  placeholder="Search church body..."
                  value={searchMember}
                  onChange={(e) => setSearchMember(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 text-xs rounded-xl outline-none"
                />
              </div>

              <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                {filteredUsers.map((item) => {
                  const record = allRecords.find(r => r.userId === item.uid);
                  return (
                    <button
                      key={item.uid}
                      onClick={() => {
                        if (record) {
                          setSelectedRecord(record);
                          setLeaderMentorId(record.mentorId || '');
                          setLeaderNotes(record.notes || '');
                        } else {
                          // Initialize record for member on click
                          initDiscipleshipRecord(item.uid, item.displayName);
                        }
                      }}
                      className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-left transition-all ${
                        selectedRecord?.userId === item.uid
                          ? 'border-church-burgundy bg-church-burgundy/5'
                          : 'border-slate-100 bg-slate-50 hover:bg-slate-100/50'
                      }`}
                    >
                      <div>
                        <p className="font-bold text-xs text-slate-800">{item.displayName}</p>
                        <div className="flex items-center gap-1 flex-wrap">
                          <p className="text-[9px] text-slate-400 truncate max-w-[100px] leading-none">{item.email}</p>
                        </div>
                      </div>
                      {record ? (
                        <span className="text-[9px] bg-church-olive/10 text-church-olive border border-church-olive/20 font-bold px-2 py-0.5 rounded-full">
                          {record.completedMilestones.length} milestones
                        </span>
                      ) : (
                        <span className="text-[9px] bg-slate-200 text-slate-500 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <UserPlus size={10} />
                          <span>Initiate</span>
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Profile Modification Column */}
            <div className="md:col-span-2 bg-white rounded-3xl p-6 md:p-8 border border-church-gold/10 shadow-sm">
              {selectedRecord ? (
                <div className="space-y-6">
                  {/* Member Name */}
                  <div className="border-b pb-4 border-slate-100">
                    <p className="text-[10px] uppercase font-bold text-church-gold tracking-wide">Editing Progression For</p>
                    <h3 className="text-2xl font-serif font-bold text-church-burgundy mt-1">{selectedRecord.userName}</h3>
                  </div>

                  {/* Milestones Verification checkmarks */}
                  <div className="space-y-3">
                    <h4 className="font-bold text-sm text-slate-800 uppercase tracking-wide">Verify Milestones</h4>
                    <p className="text-xs text-slate-500">Check off commitments that have been completed and officially verified by pastoral team.</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                      {MILESTONES_LIST.map((milestone) => {
                        const isCompleted = selectedRecord.completedMilestones.includes(milestone);
                        return (
                          <button
                            key={milestone}
                            onClick={() => toggleMilestone(selectedRecord, milestone)}
                            className={`p-3.5 rounded-xl border text-left transition-all text-xs font-bold flex items-center justify-between ${
                              isCompleted
                                ? 'bg-church-olive/10 border-church-olive/30 text-church-olive'
                                : 'bg-slate-50 border-slate-100 text-slate-600 hover:border-slate-200'
                            }`}
                          >
                            <span>{milestone}</span>
                            <div className={`w-4 h-4 rounded border flex items-center justify-center ${isCompleted ? 'bg-church-olive text-white border-transparent' : 'border-slate-300'}`}>
                              {isCompleted && <CheckCircle size={12} />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Add Class Completion progress */}
                  <div className="border-t border-slate-100 pt-5 space-y-3">
                    <h4 className="font-bold text-sm text-slate-800 uppercase tracking-wide">Register Course Graduations</h4>
                    
                    <div className="flex gap-2">
                      <select
                        value={newCourseName}
                        onChange={(e) => setNewCourseName(e.target.value)}
                        className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-1 focus:ring-church-burgundy"
                      >
                        <option value="">-- Choose verified class graduation --</option>
                        {AVAILABLE_COURSES.map(c => (
                          <option key={c.id} value={c.name}>{c.name}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => addCompletedCourse(selectedRecord, newCourseName)}
                        disabled={!newCourseName}
                        className="px-4 py-2 bg-church-burgundy text-white text-xs font-bold rounded-xl hover:bg-church-burgundy/95 disabled:opacity-50"
                      >
                        Add Record
                      </button>
                    </div>

                    {/* Class List */}
                    <div className="space-y-2 mt-3">
                      {selectedRecord.completedCourses.map((c, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-slate-50 p-2 px-3 border border-slate-150 rounded-lg text-xs">
                          <span className="font-bold text-slate-700">{c.courseName}</span>
                          <span className="text-[10px] text-slate-500">Graduation: {c.completedAt}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Mentor Connection Assignment */}
                  <div className="border-t border-slate-100 pt-5 space-y-4">
                    <h4 className="font-bold text-sm text-slate-800 uppercase tracking-wide">Mentorship & Encourgement Logs</h4>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Assign Mentoring Leader</label>
                        <select
                          value={leaderMentorId}
                          onChange={(e) => setLeaderMentorId(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-1 focus:ring-church-burgundy"
                        >
                          <option value="">Unassigned</option>
                          {allUsers.filter(u => u.role === 'leader' || u.role === 'admin').map((l) => (
                            <option key={l.uid} value={l.uid}>{l.displayName} ({l.email})</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Mentoring Notes / Encouragement Log</label>
                        <textarea
                          placeholder="Write progress notes here..."
                          value={leaderNotes}
                          onChange={(e) => setLeaderNotes(e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-1 focus:ring-church-burgundy resize-none"
                        ></textarea>
                      </div>

                      <button
                        onClick={() => handleAssignMentor(selectedRecord)}
                        className="py-2.5 px-6 bg-church-olive text-white text-xs font-bold rounded-xl hover:bg-church-olive/95 transition-all shadow-md"
                      >
                        Save Discipleship Settings
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-16 text-slate-400">
                  <Star size={48} className="mx-auto mb-3 text-slate-200" />
                  <p className="text-sm">Please select a church member from the sidebar list to view or update progress milestones and course graduations.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
