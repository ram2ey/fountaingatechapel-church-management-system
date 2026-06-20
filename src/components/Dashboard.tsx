'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../lib/AuthContext';
import { db, query, collection, orderBy, onSnapshot } from '../lib/supabase';
import { Radio, Sun, Heart, Plus } from 'lucide-react';
import { motion } from 'motion/react';
import { format } from 'date-fns';

export default function Dashboard() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [announcements, setAnnouncements] = useState<any[]>([]);

  useEffect(() => {
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
    }, (err: any) => {
      console.error("Error reading announcements: ", err);
    });
    return unsubscribe;
  }, [user]);

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

      {announcements.length > 0 && (
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
            {announcements.slice(0, 4).map((ann) => (
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
                      {ann.timestamp ? format(new Date(ann.timestamp), 'MMM d, h:mm a') : 'Bulletin'}
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
          onClick={() => router.push('/worship')}
        />
        <DashboardCard 
          icon={Sun} 
          title="Daily Devotional" 
          description="Read today's message from Pastor John" 
          actionLabel="Read Now"
          accent="olive"
          onClick={() => router.push('/devotional')}
        />
        <DashboardCard 
          icon={Heart} 
          title="Prayer Wall" 
          description="There are 5 new requests since your last visit" 
          actionLabel="Pray Now"
          accent="gold"
          onClick={() => router.push('/prayer')}
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
