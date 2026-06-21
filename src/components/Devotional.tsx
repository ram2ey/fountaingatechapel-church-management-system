import React, { useState } from 'react';
import { Sun, Calendar, User, Quote, BookOpen, Share2, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';

export default function Devotional() {
  const today = new Date();
  
  const initialDevo = {
    date: format(today, 'MMMM do'),
    title: 'The Still Small Voice',
    author: 'Pastor Michael Henderson',
    scripture: '1 Kings 19:11-13',
    content: [
      `In a world that is constantly screaming for our attention, the most profound messages from God often come in the silence. Elijah looked for God in the great wind, the earthquake, and the fire, but God wasn't there. Instead, He appeared in a gentle whisper.`,
      `When we are overwhelmed by the "earthquakes" of life—the crises, the deadlines, the noise—we must learn the discipline of the secret place. Silence is not just the absence of sound; it is the presence of attention. Where are you directing your attention today?`,
      `Take five minutes today to simply be still. Put away the device, close the door, and ask: "Lord, what is Your whisper for me today?"`
    ],
    prayer: `"Lord, quiet the noise in my heart. Help me to hear Your whisper above the roar of the world. Give me ears that are tuned to Your frequency and a heart that is ready to obey. Amen."`
  };

  const pastDevotionals = [
    {
      date: 'May 13',
      title: 'The Desert Spring',
      author: 'Pastor Sarah Connor',
      scripture: 'Isaiah 43:19',
      content: [
        `Sometimes we find ourselves in seasons of dryness, where inspiration seems far and spiritual vitality feels low. But God declares: "Behold, I am doing a new thing; now it springs forth, do you not perceive it? I will make a way in the wilderness and rivers in the desert."`,
        `The desert is not a place of abandonment; it is a place of preparation. It is where our roots grow deep, searching for the hidden reservoirs of God's grace.`,
        `If you feel like you are in a desert season, lift your eyes. God is already opening up streams of refreshment for your soul today.`
      ],
      prayer: `"Father, thank You that even in my desert seasons, You are my spring. Pour out Your living water onto the dry ground of my heart today. Renew my strength and guide my steps. Amen."`
    },
    {
      date: 'May 12',
      title: 'Strength in Weakness',
      author: 'Brother James Miller',
      scripture: '2 Corinthians 12:9',
      content: [
        `Our culture celebrates self-sufficiency and raw strength. Yet, God's economy is entirely different. Paul writes that when he pleaded for his thorn to be removed, the Lord replied: "My grace is sufficient for you, for my power is made perfect in weakness."`,
        `When we reach the end of our own capability, we finally make room for the supernatural strength of God to manifest. Weakness is not a disqualification; it is a conduit for His glory.`,
        `Do not hide your limitations from God today. Bring them to Him as offerings, and watch how His strength takes over.`
      ],
      prayer: `"Lord Jesus, I surrender my limitations and fatigue to You. Where I am weak, be my absolute strength. Let Your power rest upon me and carry me through this day. Amen."`
    },
    {
      date: 'May 11',
      title: 'The Harvest is Near',
      author: 'Pastor Michael Henderson',
      scripture: 'Galatians 6:9',
      content: [
        `It is easy to grow weary when doing good, especially when the seeds we plant seem to take forever to grow. We pray, we serve, we invest in others, but we see no immediate fruit. But the apostle Paul encourages us: "Let us not grow weary of doing good, for in due season we will reap, if we do not give up."`,
        `Spiritual growth is organic and obeys God's timing. The seed is growing in the dark before it breaks the soil.`,
        `Do not lose heart. Keep watering the seeds of prayer, love, and faithfulness. Your harvest is promised and is drawing near.`
      ],
      prayer: `"Lord, grant me the patience to wait for Your harvest. Strengthen my hands when they grow heavy and renew my resolve to do good. I trust in Your perfect timing. Amen."`
    }
  ];

  const [activeDevo, setActiveDevo] = useState<any>(initialDevo);
  const [completedDevos, setCompletedDevos] = useState<Record<string, boolean>>({});
  const [showShareToast, setShowShareToast] = useState(false);

  const handleMarkAsRead = () => {
    setCompletedDevos(prev => ({
      ...prev,
      [activeDevo.title]: true
    }));
  };

  const handleShare = () => {
    navigator.clipboard.writeText(`"${activeDevo.title}" Daily Devotional - Fountain Gate Chapel`);
    setShowShareToast(true);
    setTimeout(() => setShowShareToast(false), 2500);
  };

  const isCompleted = completedDevos[activeDevo.title] || false;

  return (
    <div className="max-w-3xl mx-auto space-y-10">
      <div className="text-center">
        <div className="w-16 h-16 bg-church-gold/10 text-church-gold rounded-full flex items-center justify-center mx-auto mb-6">
          <Sun size={32} />
        </div>
        <h2 className="text-4xl font-serif font-bold text-church-burgundy mb-2">Daily Devotional</h2>
        <p className="text-slate-500 font-medium">{format(today, 'MMMM do, yyyy')}</p>
      </div>

      <motion.article 
        key={activeDevo.title}
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-[2.5rem] p-10 md:p-16 border border-church-gold/10 shadow-xl relative overflow-hidden"
      >
        <Quote className="absolute top-10 right-10 text-church-gold/5 w-40 h-40" />
        
        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="flex items-center space-x-2 text-[10px] font-bold text-church-olive uppercase tracking-widest mb-6">
            <User size={12} />
            <span>{activeDevo.author}</span>
          </div>

          <h3 className="text-4xl md:text-5xl font-serif font-bold text-slate-900 mb-8 leading-tight">
            {activeDevo.title}
          </h3>

          <div className="flex items-center space-x-3 px-6 py-3 bg-church-burgundy/5 rounded-2xl text-church-burgundy font-serif italic mb-12 border border-church-burgundy/10">
            <BookOpen size={20} />
            <span className="text-lg">{activeDevo.scripture}</span>
          </div>

          <div className="prose prose-slate max-w-none text-left space-y-6">
            {activeDevo.content.map((paragraph: string, idx: number) => {
              if (idx === 0) {
                return (
                  <p key={idx} className="text-xl text-slate-700 leading-relaxed first-letter:text-6xl first-letter:font-serif first-letter:float-left first-letter:mr-4 first-letter:text-church-burgundy first-letter:font-bold">
                    {paragraph}
                  </p>
                );
              }
              return (
                <p key={idx} className="text-xl text-slate-700 leading-relaxed mt-6">
                  {paragraph}
                </p>
              );
            })}
          </div>

          <div className="w-full h-px bg-slate-100 my-16"></div>

          <div className="w-full space-y-6">
            <h4 className="text-lg font-serif font-bold text-church-burgundy">Prayer for Today</h4>
            <p className="text-slate-655 italic text-lg max-w-lg mx-auto leading-relaxed">
              {activeDevo.prayer}
            </p>
          </div>

          <div className="flex items-center space-x-4 mt-16 pt-8 border-t border-slate-50 w-full">
            <button 
              onClick={handleMarkAsRead}
              className={`flex-1 flex items-center justify-center space-x-2 py-4 rounded-2xl font-bold transition-all cursor-pointer ${
                isCompleted 
                  ? 'bg-emerald-50 text-emerald-600 border border-emerald-100/50' 
                  : 'bg-church-olive text-white hover:shadow-lg'
              }`}
            >
              <CheckCircle size={20} />
              <span>{isCompleted ? 'Completed' : 'Mark as Read'}</span>
            </button>
            <button 
              onClick={handleShare}
              className="p-4 border border-church-gold/20 text-church-gold rounded-2xl hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <Share2 size={24} />
            </button>
          </div>
        </div>
      </motion.article>

      <div className="space-y-4">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Recent Devotionals</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {pastDevotionals.map((devo) => (
            <PastDevotionalCard 
              key={devo.title}
              date={devo.date} 
              title={devo.title} 
              onClick={() => setActiveDevo(devo)}
              isActive={activeDevo.title === devo.title}
            />
          ))}
        </div>
      </div>

      <AnimatePresence>
        {showShareToast && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs font-bold py-3 px-6 rounded-full shadow-2xl z-50 flex items-center space-x-2 pointer-events-none"
          >
            <span>🔗 Devotional link copied to clipboard!</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PastDevotionalCard({ date, title, onClick, isActive }: any) {
  return (
    <button 
      onClick={onClick}
      className={`p-6 rounded-3xl border text-left transition-all group cursor-pointer ${
        isActive 
          ? 'bg-church-burgundy/5 border-church-burgundy shadow-sm' 
          : 'bg-white border-church-gold/10 hover:border-church-burgundy'
      }`}
    >
      <div className="flex items-center space-x-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 group-hover:text-church-gold transition-colors">
        <Calendar size={12} />
        <span>{date}</span>
      </div>
      <h4 className={`font-serif font-bold line-clamp-1 ${isActive ? 'text-church-burgundy' : 'text-slate-800'}`}>{title}</h4>
    </button>
  );
}
