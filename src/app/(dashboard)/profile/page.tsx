'use client';

import React from 'react';
import { useAuth } from '../../../lib/AuthContext';
import { db, doc, updateDoc } from '../../../lib/supabase';
import { CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function ProfilePage() {
  const { profile, user } = useAuth();
  const [phone, setPhone] = React.useState(profile?.phone || '');
  const [bio, setBio] = React.useState(profile?.bio || '');
  const [occupation, setOccupation] = React.useState(profile?.occupation || '');
  const [isSaving, setIsSaving] = React.useState(false);
  const [success, setSuccess] = React.useState(false);

  React.useEffect(() => {
    if (profile) {
      setPhone(profile.phone || '');
      setBio(profile.bio || '');
      setOccupation(profile.occupation || '');
    }
  }, [profile]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSaving(true);
    setSuccess(false);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        branch: 'Ankaful',
        phone: phone.trim(),
        bio: bio.trim(),
        occupation: occupation.trim()
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    } catch (err) {
      console.error("Error updating user profile:", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-[2rem] p-8 border border-church-gold/10 shadow-sm max-w-2xl mx-auto animate-fade-in">
      <div className="flex flex-col items-center text-center space-y-4 mb-8">
        <div className="w-24 h-24 bg-church-burgundy rounded-[1.5rem] flex items-center justify-center text-white text-4xl font-serif font-bold shadow-md">
          {profile?.displayName?.[0] || 'U'}
        </div>
        <div>
          <h2 className="text-3xl font-serif font-bold text-[#1664a7]">{profile?.displayName}</h2>
          <p className="text-slate-500">{profile?.email}</p>
          <span className="inline-block mt-2 px-4 py-1.5 bg-church-gold/15 text-[#D1A129] rounded-full text-xs font-bold uppercase tracking-widest whitespace-nowrap">
            {profile?.role || 'Member'}
          </span>
        </div>
      </div>

      <form onSubmit={handleUpdate} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Phone Number</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+233..."
              className="w-full bg-slate-50 border border-slate-100 outline-none text-sm p-3.5 rounded-2xl focus:ring-2 focus:ring-church-burgundy placeholder:text-slate-300"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Occupation</label>
            <input
              type="text"
              value={occupation}
              onChange={(e) => setOccupation(e.target.value)}
              placeholder="e.g. Engineer, Student"
              className="w-full bg-slate-50 border border-slate-100 outline-none text-sm p-3.5 rounded-2xl focus:ring-2 focus:ring-church-burgundy placeholder:text-slate-300 font-medium"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Home Group / Bio</label>
            <input
              type="text"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="e.g. Youth Leader / Musician"
              className="w-full bg-slate-50 border border-slate-100 outline-none text-sm p-3.5 rounded-2xl focus:ring-2 focus:ring-church-burgundy placeholder:text-slate-300"
            />
          </div>
        </div>

        <div className="pt-4 flex flex-col items-center">
          <button
            type="submit"
            disabled={isSaving}
            className="w-full py-4 px-6 bg-[#1664a7] hover:bg-[#1664a7]/90 text-white rounded-2xl font-bold font-serif shadow-lg hover:shadow-xl transition-all hover:translate-y-[-1px] active:translate-y-0 disabled:opacity-50 cursor-pointer"
          >
            {isSaving ? "Saving details..." : "Save Profile Details"}
          </button>

          {success && (
            <div className="mt-4 text-xs font-bold text-emerald-600 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100/40 animate-fade-in text-center w-full">
              ✨ Profile successfully updated across church directories.
            </div>
          )}
        </div>
      </form>

      <div className="w-full pt-8 mt-8 border-t border-slate-50 grid grid-cols-2 gap-4 text-left">
        <div className="p-4 bg-slate-50 rounded-2xl">
          <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Joined</p>
          <p className="font-bold text-slate-800 text-sm">
            {profile?.createdAt ? format(new Date(profile.createdAt.toDate()), 'MMMM yyyy') : 'Recently'}
          </p>
        </div>
        <div className="p-4 bg-slate-50 rounded-2xl">
          <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Status</p>
          <div className="flex items-center space-x-2 text-[#D1A129] font-bold text-sm">
            <CheckCircle size={16} />
            <span>Active Member</span>
          </div>
        </div>
      </div>
    </div>
  );
}
