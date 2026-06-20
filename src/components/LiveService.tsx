import React, { useState } from 'react';
import { Radio, MessageCircle, Send, Heart, BookOpen, Music, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../lib/AuthContext';

export default function LiveService() {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'chat' | 'notes' | 'scripture'>('chat');
  const [messages, setMessages] = useState([
    { id: '1', user: 'Sarah M.', text: 'Good morning everyone! Greetings from Ohio.', time: '10:02 AM font-italic' },
    { id: '2', user: 'James T.', text: 'Amen! That worship song was beautiful.', time: '10:15 AM' },
  ]);
  const [newMessage, setNewMessage] = useState('');
  
  const [customNotes, setCustomNotes] = useState<string[]>([]);
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteText, setNoteText] = useState('');

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newMessage.trim()) return;

    const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages((prev) => [
      ...prev,
      {
        id: String(prev.length + 1),
        user: profile?.displayName || user?.displayName || 'Guest Believer',
        text: newMessage.trim(),
        time: timeString,
      },
    ]);
    setNewMessage('');
  };

  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    setCustomNotes(prev => [...prev, noteText.trim()]);
    setNoteText('');
    setIsEditingNote(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
      {/* Video Stream Section */}
      <div className="lg:col-span-2 space-y-6">
        <div className="aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl relative group">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="w-20 h-20 bg-church-burgundy/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                <Radio className="text-church-burgundy animate-pulse" size={40} />
              </div>
              <p className="text-white font-serif text-xl">Streaming will begin shortly</p>
              <p className="text-white/50 text-sm mt-2 font-bold uppercase tracking-widest">Next Live: Sunday 10:00 AM</p>
            </div>
          </div>
          
          <div className="absolute top-6 left-6 p-1 pr-4 bg-red-600 rounded-full flex items-center space-x-2 text-white text-[10px] font-bold uppercase tracking-widest shadow-lg">
            <div className="w-2 h-2 rounded-full bg-white animate-ping ml-1"></div>
            <span>Live Stream</span>
          </div>
          
          <div className="absolute bottom-6 left-6 flex items-center space-x-3">
             <div className="bg-black/50 backdrop-blur-md p-2 rounded-full flex items-center space-x-2 text-white text-xs px-4 border border-white/10">
               <Users size={14} />
               <span>1.2k Watching</span>
             </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-8 border border-church-gold/10 shadow-sm">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-3xl font-serif font-bold text-church-burgundy">Morning Celebration Service</h2>
              <p className="text-slate-500 font-medium">with Pastor Michael Henderson — May 14, 2026</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <span className="px-4 py-2 bg-slate-50 text-slate-600 text-xs font-bold rounded-xl flex items-center space-x-2 border border-slate-100 italic">
              <BookOpen size={14} className="text-church-burgundy" />
              <span>Genesis 12:1-4</span>
            </span>
            <span className="px-4 py-2 bg-slate-50 text-slate-600 text-xs font-bold rounded-xl flex items-center space-x-2 border border-slate-100 italic">
              <Music size={14} className="text-church-burgundy" />
              <span>Great is Thy Faithfulness</span>
            </span>
          </div>
        </div>
      </div>

      {/* Interaction Panel */}
      <div className="lg:col-span-1 flex flex-col h-full bg-white rounded-3xl border border-church-gold/10 shadow-sm overflow-hidden">
        <div className="flex border-b border-church-gold/10">
          <InteractionTab 
            active={activeTab === 'chat'} 
            onClick={() => setActiveTab('chat')} 
            icon={MessageCircle} 
            label="Chat" 
          />
          <InteractionTab 
            active={activeTab === 'notes'} 
            onClick={() => setActiveTab('notes')} 
            icon={BookOpen} 
            label="Notes" 
          />
          <InteractionTab 
            active={activeTab === 'scripture'} 
            onClick={() => setActiveTab('scripture')} 
            icon={Radio} 
            label="Lyrics" 
          />
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <AnimatePresence mode="wait">
            {activeTab === 'chat' && (
              <motion.div
                key="chat"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                {messages.map((m) => (
                  <div key={m.id} className="group">
                    <p className="text-[10px] font-bold text-church-gold uppercase tracking-widest mb-1">{m.user} — {m.time}</p>
                    <div className="bg-slate-50 p-3 rounded-2xl rounded-tl-none group-hover:bg-church-cream/50 transition-colors">
                      <p className="text-sm text-slate-700 leading-relaxed">{m.text}</p>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
            
            {activeTab === 'notes' && (
              <motion.div
                key="notes"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-4 space-y-6"
              >
                <div>
                  <h4 className="font-serif font-bold text-church-burgundy text-lg mb-4">Sermon Notes</h4>
                  <ul className="space-y-4">
                    <li className="flex items-start space-x-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-church-gold mt-2"></div>
                      <p className="text-sm text-slate-700">God's promises require a step of faith and movement.</p>
                    </li>
                    <li className="flex items-start space-x-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-church-gold mt-2"></div>
                      <p className="text-sm text-slate-700">Leaving the familiar (Haran) for the destination of purpose.</p>
                    </li>
                  </ul>
                </div>

                {customNotes.length > 0 && (
                  <div className="pt-4 border-t border-slate-100 space-y-3">
                    <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">My Notes</h5>
                    <ul className="space-y-3">
                      {customNotes.map((note, index) => (
                        <li key={index} className="bg-church-cream/30 p-3.5 rounded-2xl border border-church-gold/10 text-sm text-slate-750 relative group flex items-start justify-between">
                          <p className="flex-1 pr-4">{note}</p>
                          <button 
                            onClick={() => setCustomNotes(prev => prev.filter((_, i) => i !== index))}
                            className="text-[10px] text-slate-400 hover:text-red-500 font-bold opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                          >
                            Delete
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {isEditingNote ? (
                  <form onSubmit={handleSaveNote} className="space-y-3 pt-4 border-t border-slate-100">
                    <textarea
                      placeholder="Type your personal sermon note here..."
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 outline-none text-sm p-3.5 rounded-2xl focus:ring-2 focus:ring-church-burgundy h-24 resize-none"
                      autoFocus
                    />
                    <div className="flex space-x-2">
                      <button 
                        type="submit"
                        className="flex-1 py-2.5 bg-church-burgundy text-white rounded-xl text-xs font-bold hover:bg-church-burgundy/90 transition-colors cursor-pointer"
                      >
                        Save Note
                      </button>
                      <button 
                        type="button"
                        onClick={() => { setIsEditingNote(false); setNoteText(''); }}
                        className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <button 
                    onClick={() => setIsEditingNote(true)}
                    className="w-full py-3 border-2 border-dashed border-church-gold/30 rounded-2xl text-church-gold font-bold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    + Add Your Own Note
                  </button>
                )}
              </motion.div>
            )}

            {activeTab === 'scripture' && (
              <motion.div
                key="scripture"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-4 space-y-6"
              >
                <div>
                  <h4 className="font-serif font-bold text-church-burgundy text-lg mb-2">Synced Scripture</h4>
                  <div className="bg-church-cream/30 border-l-4 border-church-gold p-4 rounded-r-2xl">
                    <p className="text-slate-650 text-sm font-serif italic">
                      "Now the Lord said to Abram, 'Go from your country and your kindred and your father's house to the land that I will show you.'"
                    </p>
                    <p className="text-church-gold text-xs font-bold mt-2 uppercase tracking-wide">— Genesis 12:1</p>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-4">
                  <h4 className="font-serif font-bold text-church-burgundy text-lg mb-3">Worship Song Lyrics</h4>
                  <div className="bg-slate-50 p-4 rounded-2xl text-center space-y-3">
                    <p className="text-[10px] uppercase font-bold text-church-gold tracking-widest">Great is Thy Faithfulness</p>
                    <div className="text-xs text-slate-600 leading-relaxed font-serif space-y-1">
                      <p>Great is Thy faithfulness, O God my Father;</p>
                      <p>There is no shadow of turning with Thee;</p>
                      <p>Thou changest not, Thy compassions, they fail not;</p>
                      <p>As Thou hast been, Thou forever wilt be.</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {activeTab === 'chat' && (
          <form onSubmit={handleSendMessage} className="p-4 bg-slate-50/50 border-t border-church-gold/10">
            <div className="relative">
              <input 
                type="text"
                placeholder={user ? "Say something..." : "Please connect first / text as guest..."}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="w-full pl-4 pr-12 py-3 rounded-2xl bg-white border border-slate-200 outline-none focus:ring-2 focus:ring-church-burgundy transition-all text-sm"
              />
              <button 
                type="submit" 
                className="absolute right-2 top-1.5 p-1.5 bg-church-burgundy text-white rounded-xl shadow-lg shadow-church-burgundy/20 hover:scale-105 transition-transform cursor-pointer animate-fade-in"
              >
                <Send size={18} />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function InteractionTab({ active, onClick, icon: Icon, label }: any) {
  return (
    <button 
      onClick={onClick}
      className={`flex-1 flex flex-col items-center py-4 border-b-2 transition-all cursor-pointer ${
        active ? 'border-church-burgundy text-church-burgundy' : 'border-transparent text-slate-400 hover:text-slate-600'
      }`}
    >
      <Icon size={18} className="mb-1" />
      <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
    </button>
  );
}
