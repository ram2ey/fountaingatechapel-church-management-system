import React, { useState, useEffect } from 'react';
import { db, auth, handleFirestoreError, OperationType, collection, query, onSnapshot, updateDoc, doc, arrayUnion, arrayRemove } from '../lib/firebase';
import { useAuth } from '../lib/AuthContext';
import { SmallGroup } from '../types';
import { Users, Clock, Tag, MessageCircle, ArrowRight, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function SmallGroups() {
  const { user, profile } = useAuth();
  const [groups, setGroups] = useState<SmallGroup[]>([]);
  const [filter, setFilter] = useState('All');
  
  const [activeChatGroup, setActiveChatGroup] = useState<SmallGroup | null>(null);
  const [groupMessages, setGroupMessages] = useState<Record<string, { sender: string; text: string; time: string }[]>>({});
  const [chatInput, setChatInput] = useState('');

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(collection(db, 'small_groups'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as SmallGroup[];
      setGroups(data);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'small_groups');
    });
    return unsubscribe;
  }, [user]);

  const toggleJoin = async (group: SmallGroup) => {
    if (!user) return;
    const groupRef = doc(db, 'small_groups', group.id);
    const isMember = group.members.includes(user.uid);

    await updateDoc(groupRef, {
      members: isMember ? arrayRemove(user.uid) : arrayUnion(user.uid)
    });
  };

  const handleSendGroupMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChatGroup || !chatInput.trim()) return;
    const groupId = activeChatGroup.id;
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const senderName = profile?.displayName || user?.displayName || 'Guest Believer';
    
    setGroupMessages(prev => ({
      ...prev,
      [groupId]: [
        ...(prev[groupId] || []),
        { sender: senderName, text: chatInput.trim(), time: timeString }
      ]
    }));
    setChatInput('');
  };

  const getGroupMessages = (groupId: string) => {
    const custom = groupMessages[groupId];
    if (custom) return custom;
    return [
      { sender: 'Sister Grace', text: 'Peace be with you all! Looking forward to our discussion this week.', time: 'Yesterday' },
      { sender: 'Brother Timothy', text: 'Amen! What chapter are we reading for study?', time: 'Yesterday' },
    ];
  };

  const categories = ['All', ...new Set(groups.map(g => g.category))];

  const displayedGroups = groups.filter(g => {
    return filter === 'All' || g.category === filter;
  });

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-4xl font-serif font-bold text-church-burgundy">Small Groups</h2>
          <p className="text-slate-500 mt-2">
            Find your circle at Ankaful branch
          </p>
        </div>
        <div className="flex overflow-x-auto max-w-full -mx-4 px-4 sm:mx-0 sm:px-0 space-x-2 pb-2 md:pb-0 scrollbar-none">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-6 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all flex-shrink-0 cursor-pointer ${
                filter === cat ? 'bg-church-burgundy text-white shadow-md' : 'bg-white text-slate-500 border border-church-gold/10 hover:border-church-gold/30'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {displayedGroups.map((group) => (
          <motion.div
            key={group.id}
            whileHover={{ y: -4 }}
            className="bg-white rounded-3xl p-8 border border-church-gold/10 shadow-sm flex flex-col h-full relative group overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-40 h-40 bg-church-olive/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform"></div>
            
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <div className="flex flex-wrap gap-1.5 items-center mb-3">
                    <span className="px-3 py-1 bg-church-olive/10 text-church-olive rounded-full text-[10px] font-bold uppercase tracking-widest inline-block leading-none">
                      {group.category}
                    </span>
                  </div>
                  <h3 className="text-2xl font-serif font-bold text-slate-900">{group.name}</h3>
                </div>
                <div className="flex -space-x-3">
                  {group.members.slice(0, 4).map((_, i) => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-400">
                      {i === 3 ? `+${group.members.length - 3}` : 'U'}
                    </div>
                  ))}
                </div>
              </div>

              <p className="text-slate-600 mb-8 line-clamp-3 leading-relaxed">
                {group.description}
              </p>

              <div className="space-y-3 pt-6 border-t border-slate-50 mt-auto">
                <div className="flex items-center text-sm text-slate-500">
                  <Clock size={16} className="mr-3 text-church-burgundy" />
                  <span className="font-medium">{group.meetingTime}</span>
                </div>
                <div className="flex items-center text-sm text-slate-500">
                  <Users size={16} className="mr-3 text-church-burgundy" />
                  <span className="font-medium">Led by {group.leaderName}</span>
                </div>
              </div>

              <div className="mt-8 flex items-center space-x-4">
                <button
                  onClick={() => toggleJoin(group)}
                  className={`flex-1 flex items-center justify-center space-x-2 py-4 rounded-2xl font-bold transition-all cursor-pointer ${
                    group.members.includes(user?.uid || '')
                      ? 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      : 'bg-church-burgundy text-white shadow-lg shadow-church-burgundy/20 hover:shadow-xl'
                  }`}
                >
                  {group.members.includes(user?.uid || '') ? (
                    <><span>Joined</span><ArrowRight size={18} /></>
                  ) : (
                    <><span>Request to Join</span><Plus size={18} /></>
                  )}
                </button>
                <button 
                  onClick={() => setActiveChatGroup(group)}
                  className="p-4 bg-church-olive/10 text-church-olive rounded-2xl hover:bg-church-olive/20 transition-colors cursor-pointer"
                >
                  <MessageCircle size={24} />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Group Chat Drawer */}
      <AnimatePresence>
        {activeChatGroup && (
          <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveChatGroup(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col border-l border-church-gold/20"
            >
              {/* Header */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-church-burgundy text-white">
                <div>
                  <span className="text-[10px] font-bold text-church-gold uppercase tracking-widest">Group Chat</span>
                  <h3 className="text-xl font-serif font-bold leading-tight mt-0.5">{activeChatGroup.name}</h3>
                  <p className="text-white/60 text-xs mt-0.5">Led by {activeChatGroup.leaderName}</p>
                </div>
                <button 
                  onClick={() => setActiveChatGroup(null)}
                  className="p-2 hover:bg-white/10 rounded-full text-white transition-colors cursor-pointer font-bold w-9 h-9 flex items-center justify-center"
                >
                  ✕
                </button>
              </div>

              {/* Message List */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-church-cream/10 flex flex-col justify-end">
                <div className="space-y-4">
                  {getGroupMessages(activeChatGroup.id).map((msg, index) => (
                    <div key={index} className="group">
                      <p className="text-[9px] font-bold text-church-gold uppercase tracking-widest mb-1">
                        {msg.sender} — {msg.time}
                      </p>
                      <div className="bg-white border border-slate-100/50 p-3.5 rounded-2xl rounded-tl-none group-hover:bg-church-cream/30 transition-colors shadow-sm">
                        <p className="text-sm text-slate-700 leading-relaxed">{msg.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendGroupMessage} className="p-4 bg-white border-t border-slate-100 flex items-center space-x-2">
                <input
                  type="text"
                  placeholder="Type a message to the group..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="flex-1 pl-4 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-church-burgundy focus:bg-white transition-all text-sm"
                />
                <button
                  type="submit"
                  className="p-3 bg-church-burgundy text-white rounded-xl shadow-lg hover:scale-105 transition-all cursor-pointer"
                >
                  <Send size={18} />
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Plus(props: any) { return <ArrowRight {...props} />; }
