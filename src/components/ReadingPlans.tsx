import React, { useState } from 'react';
import { BookOpen, CheckCircle, ChevronRight, Users, Sparkles, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function ReadingPlans() {
  const [plans, setPlans] = useState([
    {
      id: '1',
      title: '30 Days of Grace',
      description: 'A deep dive into the letters of Paul and the message of unmerited favor.',
      participants: 124,
      currentDay: 12,
      totalDays: 30,
      image: 'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?auto=format&fit=crop&q=80&w=400'
    },
    {
      id: '2',
      title: 'Foundations of Faith',
      description: 'New to the faith? Start here with a 14-day walkthrough of the Gospels.',
      participants: 89,
      currentDay: 0,
      totalDays: 14,
      image: 'https://images.unsplash.com/photo-1490730141103-6ac27d020058?auto=format&fit=crop&q=80&w=400'
    }
  ]);

  const [activePlan, setActivePlan] = useState<any | null>(null);
  const [completedDays, setCompletedDays] = useState<Record<string, number[]>>({});

  const getCompletedDays = (planId: string) => {
    const list = completedDays[planId];
    if (list) return list;
    
    const plan = plans.find(p => p.id === planId);
    if (plan && plan.currentDay > 0) {
      const initial = Array.from({ length: plan.currentDay }, (_, i) => i + 1);
      return initial;
    }
    return [];
  };

  const toggleDayComplete = (planId: string, day: number) => {
    const current = getCompletedDays(planId);
    let updated: number[];
    if (current.includes(day)) {
      updated = current.filter(d => d !== day);
    } else {
      updated = [...current, day].sort((a, b) => a - b);
    }
    
    setCompletedDays(prev => ({
      ...prev,
      [planId]: updated
    }));

    setPlans(prevPlans => prevPlans.map(p => {
      if (p.id === planId) {
        return {
          ...p,
          currentDay: updated.length
        };
      }
      return p;
    }));
  };

  const getDayScripture = (planId: string, day: number) => {
    if (planId === '1') {
      const ephesiansDays = [
        'Ephesians 1:1-14', 'Ephesians 2:1-10', 'Ephesians 2:11-22', 'Ephesians 3:1-13', 'Ephesians 3:14-21',
        'Ephesians 4:1-16', 'Ephesians 4:17-32', 'Ephesians 5:1-21', 'Ephesians 5:22-33', 'Ephesians 6:1-9',
        'Ephesians 6:10-24', 'Romans 3:21-31', 'Romans 4:1-12', 'Romans 5:1-11', 'Romans 5:12-21',
        'Romans 6:1-14', 'Romans 8:1-17', 'Romans 8:18-39', 'Galatians 1:1-10', 'Galatians 2:15-21',
        'Galatians 3:1-14', 'Galatians 3:15-29', 'Galatians 4:1-7', 'Galatians 5:1-6', 'Galatians 5:13-26',
        'Galatians 6:1-10', 'Titus 2:11-15', 'Titus 3:1-8', '2 Timothy 1:8-18', '2 Timothy 2:1-13'
      ];
      return ephesiansDays[day - 1] || `Ephesians Chapter ${day - 10}`;
    } else {
      const johnDays = [
        'John 1:1-18', 'John 3:1-21', 'John 4:1-42', 'John 5:1-18', 'John 6:1-21',
        'John 8:31-47', 'John 10:1-21', 'John 11:1-44', 'John 13:1-20', 'John 14:1-31',
        'John 15:1-17', 'John 17:1-26', 'John 20:1-31', 'John 21:1-25'
      ];
      return johnDays[day - 1] || `John Chapter ${day}`;
    }
  };

  return (
    <div className="space-y-10 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-4xl font-serif font-bold text-church-burgundy">Bible Reading Plans</h2>
          <p className="text-slate-500 mt-2">Daily schedules to help you stay rooted in the Word.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {plans.map((plan) => (
          <motion.div
            key={plan.id}
            whileHover={{ y: -5 }}
            className="bg-white rounded-3xl overflow-hidden border border-church-gold/10 shadow-sm flex flex-col md:flex-row"
          >
            <div className="md:w-48 h-48 md:h-auto bg-slate-200 relative">
              <img src={plan.image} alt={plan.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
              {plan.currentDay > 0 && (
                <div className="absolute top-4 left-4 px-3 py-1 bg-church-burgundy text-white text-[10px] font-bold rounded-full uppercase tracking-widest shadow-lg">
                  In Progress
                </div>
              )}
            </div>
            
            <div className="flex-1 p-8 flex flex-col">
              <div className="flex items-center space-x-2 text-[10px] font-bold text-church-gold uppercase tracking-widest mb-2">
                <Sparkles size={12} />
                <span>Bible Study</span>
              </div>
              <h3 className="text-2xl font-serif font-bold text-slate-900 mb-3">{plan.title}</h3>
              <p className="text-slate-500 text-sm mb-6 flex-1 line-clamp-2">
                {plan.description}
              </p>
              
              <div className="space-y-4 pt-6 border-t border-slate-50">
                <div className="flex justify-between items-end mb-1">
                  <p className="text-xs font-bold text-slate-400">PROGRESS</p>
                  <p className="text-sm font-bold text-church-burgundy">{plan.currentDay}/{plan.totalDays} Days</p>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(plan.currentDay / plan.totalDays) * 100}%` }}
                    className="h-full bg-church-burgundy rounded-full"
                  />
                </div>
                
                <div className="flex items-center justify-between mt-6">
                  <div className="flex items-center space-x-2 text-xs text-slate-400 font-medium">
                    <Users size={14} className="text-church-olive" />
                    <span>{plan.participants} others reading</span>
                  </div>
                  <button 
                    onClick={() => setActivePlan(plan)}
                    className={`px-6 py-2 rounded-xl font-bold text-sm transition-all cursor-pointer ${
                      plan.currentDay > 0 ? 'bg-slate-100 text-slate-500 hover:bg-slate-200' : 'bg-church-burgundy text-white shadow-lg shadow-church-burgundy/20'
                    }`}
                  >
                    {plan.currentDay > 0 ? 'Continue' : 'Start Plan'}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="bg-church-olive/5 rounded-3xl p-8 border border-dashed border-church-olive/20 text-center">
        <TrendingUp className="mx-auto text-church-olive mb-4" size={32} />
        <h4 className="text-xl font-serif font-bold text-slate-800 mb-2">Your Spiritual Growth</h4>
        <p className="text-slate-500 text-sm max-w-md mx-auto">
          You've read for 12 consecutive days. Keep the momentum going!
        </p>
      </div>

      {/* Reading Plan Checklist Drawer */}
      <AnimatePresence>
        {activePlan && (
          <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActivePlan(null)}
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
                  <span className="text-[10px] font-bold text-church-gold uppercase tracking-widest">Reading Plan Checklist</span>
                  <h3 className="text-xl font-serif font-bold leading-tight mt-0.5">{activePlan.title}</h3>
                  <p className="text-white/60 text-xs mt-0.5">Progress: {activePlan.currentDay}/{activePlan.totalDays} Days Completed</p>
                </div>
                <button 
                  onClick={() => setActivePlan(null)}
                  className="p-2 hover:bg-white/10 rounded-full text-white transition-colors cursor-pointer font-bold w-9 h-9 flex items-center justify-center"
                >
                  ✕
                </button>
              </div>

              {/* Day Checklist List */}
              <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-church-cream/10">
                {Array.from({ length: activePlan.totalDays }, (_, i) => i + 1).map((day) => {
                  const isDone = getCompletedDays(activePlan.id).includes(day);
                  const scripture = getDayScripture(activePlan.id, day);
                  return (
                    <div 
                      key={day}
                      onClick={() => toggleDayComplete(activePlan.id, day)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                        isDone 
                          ? 'bg-church-burgundy/5 border-church-burgundy/20 shadow-sm' 
                          : 'bg-white border-slate-100 hover:border-church-gold/20'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                          isDone ? 'bg-church-burgundy text-white' : 'bg-slate-100 text-slate-500'
                        }`}>
                          Day {day}
                        </div>
                        <div>
                          <p className={`text-sm font-bold ${isDone ? 'text-church-burgundy line-through' : 'text-slate-800'}`}>
                            {scripture}
                          </p>
                          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Bible Study Reading</p>
                        </div>
                      </div>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                        isDone ? 'border-church-burgundy bg-church-burgundy text-white' : 'border-slate-200 bg-white'
                      }`}>
                        {isDone && <CheckCircle size={14} className="stroke-[3px]" />}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Action Close */}
              <div className="p-4 bg-white border-t border-slate-100">
                <button 
                  onClick={() => setActivePlan(null)}
                  className="w-full py-4 bg-church-burgundy text-white rounded-2xl font-bold shadow-md hover:shadow-lg transition-all cursor-pointer text-center text-sm"
                >
                  Save & Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
