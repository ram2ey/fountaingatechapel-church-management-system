'use client';

import React, { useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import { Users } from 'lucide-react';
import { motion } from 'motion/react';
import { db, doc, updateDoc } from '../lib/supabase';

export default function OnboardingFlow() {
  const { user } = useAuth();
  const [phone, setPhone] = useState('');
  const [occupation, setOccupation] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!phone.trim()) {
      alert("Please enter your phone number to stay connected.");
      return;
    }
    if (!occupation.trim()) {
      alert("Please enter your occupation to help us build networking opportunities.");
      return;
    }
    
    setIsSaving(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        branch: 'Ankaful',
        phone: phone.trim(),
        occupation: occupation.trim(),
        onboarded: true
      });
      // Force page reload to refresh auth state
      window.location.reload();
    } catch (err) {
      console.error("Error completing onboarding:", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-church-cream flex items-center justify-center p-4 selection:bg-church-burgundy selection:text-white">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-[2.5rem] p-8 md:p-12 border border-church-gold/20 shadow-2xl relative overflow-hidden text-center space-y-8"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-church-gold/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
        
        <div>
          <div className="mx-auto w-16 h-16 bg-church-burgundy/10 text-church-burgundy rounded-2xl flex items-center justify-center mb-6 shadow-inner animate-bounce">
            <Users size={32} />
          </div>
          <h2 className="text-3xl font-serif font-bold text-church-burgundy">Welcome to FaithConnect</h2>
          <p className="text-slate-500 text-sm mt-2 leading-relaxed">
            Let's complete your profile to connect you with your home branch and fellowship.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
          <div className="space-y-2">
            <label className="block">Phone Number</label>
            <input
              type="tel"
              required
              placeholder="e.g. +233 24 123 4567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-slate-50 border border-slate-100 outline-none text-sm p-3.5 rounded-2xl focus:ring-2 focus:ring-church-burgundy placeholder:text-slate-300 normal-case font-medium text-slate-700"
            />
          </div>

          <div className="space-y-2">
            <label className="block">Occupation / Profession</label>
            <input
              type="text"
              required
              placeholder="e.g. Software Engineer, Teacher, Student"
              value={occupation}
              onChange={(e) => setOccupation(e.target.value)}
              className="w-full bg-slate-50 border border-slate-100 outline-none text-sm p-3.5 rounded-2xl focus:ring-2 focus:ring-church-burgundy placeholder:text-slate-300 normal-case font-medium text-slate-700"
            />
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="w-full py-4 bg-church-burgundy hover:bg-church-burgundy/90 text-white font-bold rounded-2xl text-center shadow-lg transition-transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 cursor-pointer"
          >
            {isSaving ? 'Saving...' : 'Complete Onboarding'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
