import React, { useState, useEffect } from 'react';
import { db, auth, handleFirestoreError, OperationType, collection, query, orderBy, onSnapshot } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { Sermon } from '../types';
import { Play, FileText, Music, Calendar, User, Search, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function WorshipArchive() {
  const { user } = useAuth();
  const [sermons, setSermons] = useState<Sermon[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [activeVideoSermon, setActiveVideoSermon] = useState<Sermon | null>(null);
  const [activeNotesSermon, setActiveNotesSermon] = useState<Sermon | null>(null);

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(collection(db, 'sermons'), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as Sermon[];
      setSermons(data);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'sermons');
    });
    return unsubscribe;
  }, [user]);

  const filteredSermons = sermons.filter(s => 
    s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.speaker.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-serif font-bold text-church-burgundy">Sermon Archive</h2>
          <p className="text-slate-500">Search past messages, notes, and scripture</p>
        </div>
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-church-burgundy" size={20} />
          <input 
            type="text"
            placeholder="Title, speaker, or scripture..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-3 bg-white border border-church-gold/10 rounded-2xl w-full md:w-80 shadow-sm focus:ring-2 focus:ring-church-burgundy outline-none transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSermons.map((sermon) => (
          <motion.div
            key={sermon.id}
            whileHover={{ scale: 1.02 }}
            className="bg-white rounded-3xl border border-church-gold/10 shadow-sm overflow-hidden group flex flex-col"
          >
            <div 
              onClick={() => setActiveVideoSermon(sermon)}
              className="aspect-video bg-slate-100 relative overflow-hidden flex items-center justify-center cursor-pointer"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
              <Play className="relative z-10 text-church-burgundy w-12 h-12 fill-current opacity-70 group-hover:scale-110 group-hover:opacity-100 transition-all pointer-events-none" />
              <div className="absolute bottom-4 left-4">
                <span className="px-2 py-1 bg-white/90 text-slate-900 text-[10px] font-bold rounded uppercase tracking-widest">
                  Video Available
                </span>
              </div>
            </div>

            <div className="p-6 flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center space-x-2 text-[10px] font-bold text-church-gold uppercase tracking-widest">
                  <Calendar size={12} />
                  <span>{sermon.date}</span>
                </div>
              </div>

              <h3 className="text-xl font-serif font-bold text-slate-900 mb-2 leading-tight">
                {sermon.title}
              </h3>
              
              <div className="flex items-center space-x-2 text-sm text-slate-500 mb-6">
                <User size={14} className="text-church-burgundy" />
                <span className="font-medium">{sermon.speaker}</span>
              </div>

              {sermon.scriptureRefs && (
                <div className="flex flex-wrap gap-2 mb-8">
                  {sermon.scriptureRefs.map(ref => (
                    <span key={ref} className="px-3 py-1 bg-slate-50 text-slate-500 text-[10px] font-bold rounded-lg flex items-center space-x-1">
                      <BookOpen size={10} />
                      <span>{ref}</span>
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-auto grid grid-cols-2 gap-3 pt-6 border-t border-slate-50">
                <button 
                  onClick={() => setActiveVideoSermon(sermon)}
                  className="flex items-center justify-center space-x-2 py-3 bg-church-burgundy text-white rounded-xl text-xs font-bold hover:bg-church-burgundy/90 transition-colors cursor-pointer"
                >
                  <Play size={14} />
                  <span>Watch</span>
                </button>
                <button 
                  onClick={() => setActiveNotesSermon(sermon)}
                  className="flex items-center justify-center space-x-2 py-3 border border-church-gold/20 text-church-burgundy rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <FileText size={14} />
                  <span>Notes</span>
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Video Modal */}
      <AnimatePresence>
        {activeVideoSermon && (
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveVideoSermon(null)}
              className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-black w-full max-w-3xl aspect-video rounded-3xl overflow-hidden shadow-2xl relative z-10 border border-white/10"
            >
              <button 
                onClick={() => setActiveVideoSermon(null)}
                className="absolute top-4 right-4 z-20 p-2 bg-black/60 hover:bg-black text-white rounded-full transition-colors cursor-pointer font-bold w-8 h-8 flex items-center justify-center"
              >
                ✕
              </button>
              
              <div className="w-full h-full flex flex-col justify-center items-center relative p-6">
                <div className="absolute top-6 left-6 text-left z-10">
                  <p className="text-xs font-bold text-church-gold uppercase tracking-widest">{activeVideoSermon.date}</p>
                  <h4 className="text-white font-serif font-bold text-lg md:text-2xl mt-1">{activeVideoSermon.title}</h4>
                  <p className="text-white/60 text-xs md:text-sm">{activeVideoSermon.speaker}</p>
                </div>
                
                <div className="text-center space-y-4">
                  <div className="w-20 h-20 bg-church-burgundy/20 rounded-full flex items-center justify-center mx-auto mb-2 animate-pulse">
                    <Play className="text-church-burgundy fill-current" size={36} />
                  </div>
                  <p className="text-white font-medium text-sm md:text-base">Streaming Sermon Video Archive...</p>
                  <p className="text-white/40 text-[10px] uppercase tracking-widest font-mono">0:00 / 48:24</p>
                </div>
                
                <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between text-white/50 text-[10px] font-mono">
                  <span>VOD Player</span>
                  <span>1080p HD</span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Notes Modal */}
      <AnimatePresence>
        {activeNotesSermon && (
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveNotesSermon(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[2rem] p-8 md:p-10 max-w-xl w-full relative z-10 border border-church-gold/20 shadow-2xl space-y-6"
            >
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-bold text-church-gold uppercase tracking-widest">{activeNotesSermon.date}</span>
                  <h3 className="text-2xl font-serif font-bold text-slate-900 mt-1 leading-tight">{activeNotesSermon.title}</h3>
                  <p className="text-sm text-slate-500 font-medium">with {activeNotesSermon.speaker}</p>
                </div>
                <button 
                  onClick={() => setActiveNotesSermon(null)}
                  className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="bg-church-cream/40 border-l-4 border-church-gold p-4 rounded-r-2xl">
                <h4 className="text-xs font-bold text-church-gold uppercase tracking-wide mb-1">Key Scriptures</h4>
                <div className="flex flex-wrap gap-2 mt-1">
                  {activeNotesSermon.scriptureRefs?.map(ref => (
                    <span key={ref} className="px-2 py-0.5 bg-white text-slate-700 text-xs font-bold rounded-md shadow-sm border border-church-gold/10">
                      📖 {ref}
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-serif font-bold text-church-burgundy text-lg">Sermon Summary & Study Guide</h4>
                <div className="text-slate-600 text-sm leading-relaxed space-y-3 max-h-60 overflow-y-auto pr-2">
                  <p className="font-bold">Main Outline:</p>
                  <ul className="list-decimal pl-5 space-y-2">
                    <li>
                      <strong>The Foundation of Faith:</strong> Recognizing God's sovereignty even in times of testing.
                    </li>
                    <li>
                      <strong>The Action of Trust:</strong> True faith requires steps of obedience that push beyond comfort zones.
                    </li>
                    <li>
                      <strong>The Fruit of Perseverance:</strong> Patient endurance yields a harvest of righteousness and spiritual maturity.
                    </li>
                  </ul>
                  <p className="mt-4 pt-2 border-t border-slate-50 text-slate-500 italic">
                    {activeNotesSermon.notes || "Additional study guide notes will be distributed during mid-week cell groups."}
                  </p>
                </div>
              </div>

              <button 
                onClick={() => setActiveNotesSermon(null)}
                className="w-full py-4 bg-church-burgundy text-white rounded-2xl font-bold shadow-md hover:shadow-lg transition-all cursor-pointer"
              >
                Close Notes
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
