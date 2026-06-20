import React, { useState, useEffect } from 'react';
import { db, auth, handleFirestoreError, OperationType, collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, arrayUnion, arrayRemove } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { PrayerRequest } from '../types';
import { Heart, Send, MessageCircle, Quote } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';

export default function PrayerWall() {
  const { user, profile } = useAuth();
  const [requests, setRequests] = useState<PrayerRequest[]>([]);
  const [newRequest, setNewRequest] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(collection(db, 'prayer_requests'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as PrayerRequest[];
      setRequests(data);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'prayer_requests');
    });
    return unsubscribe;
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newRequest.trim()) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'prayer_requests'), {
        authorId: user.uid,
        authorName: profile?.displayName || 'Anonymous',
        content: newRequest.trim(),
        timestamp: serverTimestamp(),
        encouragementCount: 0,
        prayingUsers: []
      });
      setNewRequest('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePraying = async (requestId: string, currentPraying: string[]) => {
    if (!user) return;
    const requestRef = doc(db, 'prayer_requests', requestId);
    const isPraying = currentPraying.includes(user.uid);

    await updateDoc(requestRef, {
      prayingUsers: isPraying ? arrayRemove(user.uid) : arrayUnion(user.uid),
      encouragementCount: isPraying ? Math.max(0, currentPraying.length - 1) : currentPraying.length + 1
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="text-center mb-10">
        <h2 className="text-4xl font-serif font-bold text-church-burgundy mb-2">Prayer Wall</h2>
        <p className="text-slate-500 italic">"Bear ye one another's burdens, and so fulfil the law of Christ."</p>
      </div>

      {user && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-3xl border border-church-gold/20 shadow-md">
          <textarea
            value={newRequest}
            onChange={(e) => setNewRequest(e.target.value)}
            placeholder="Share a request or gratitude..."
            className="w-full h-32 p-4 rounded-2xl border border-slate-100 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-church-burgundy outline-none transition-all resize-none text-slate-700"
          />
          <div className="flex justify-between items-center mt-4">
            <p className="text-xs text-slate-400">Your request will be visible to our community.</p>
            <button
              disabled={isSubmitting || !newRequest.trim()}
              className="bg-church-burgundy text-white px-6 py-2 rounded-xl font-bold flex items-center space-x-2 disabled:opacity-50 hover:shadow-lg transition-all"
            >
              <Send size={18} />
              <span>Post Request</span>
            </button>
          </div>
        </form>
      )}

      <div className="space-y-6">
        <AnimatePresence>
          {requests.map((req) => (
            <motion.div
              key={req.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              layout
              className="bg-white p-6 rounded-3xl border border-church-gold/10 shadow-sm relative group"
            >
              <Quote className="absolute top-4 right-6 text-church-gold/10" size={48} />
              
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-church-olive/10 text-church-olive rounded-full flex items-center justify-center font-bold">
                    {req.authorName[0]}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">{req.authorName}</h4>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest">
                      {req.timestamp ? format(new (req.timestamp as any).toDate(), 'MMM d, h:mm a') : 'Just now'}
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-slate-700 leading-relaxed text-lg mb-6 whitespace-pre-wrap">
                {req.content}
              </p>

              <div className="flex items-center space-x-4 border-t border-slate-50 pt-4">
                <button
                  onClick={() => togglePraying(req.id, req.prayingUsers || [])}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-all scale-100 active:scale-95 ${
                    req.prayingUsers?.includes(user?.uid || '')
                      ? 'bg-church-burgundy text-white shadow-md'
                      : 'bg-church-burgundy/5 text-church-burgundy hover:bg-church-burgundy/10'
                  }`}
                >
                  <Heart size={18} fill={req.prayingUsers?.includes(user?.uid || '') ? 'currentColor' : 'none'} />
                  <span className="font-bold text-sm">
                    {req.prayingUsers?.includes(user?.uid || '') ? 'Praying' : 'I am praying'}
                  </span>
                </button>
                
                <div className="flex -space-x-2">
                  {req.prayingUsers?.slice(0, 3).map((_, i) => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200" />
                  ))}
                  {req.prayingUsers?.length > 0 && (
                    <span className="ml-3 text-xs font-bold text-slate-400 self-center">
                      {req.prayingUsers.length} {req.prayingUsers.length === 1 ? 'person is' : 'people are'} praying
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
