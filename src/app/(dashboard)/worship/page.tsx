'use client';

import React, { useState } from 'react';
import LiveService from '../../../components/LiveService';
import WorshipArchive from '../../../components/WorshipArchive';

export default function WorshipPage() {
  const [tab, setTab] = useState<'live' | 'archive'>('live');

  return (
    <div className="space-y-6">
      <div className="flex space-x-1 bg-white p-1 rounded-2xl border border-church-gold/10 w-fit">
        <button 
          onClick={() => setTab('live')}
          className={`px-6 py-2 rounded-xl font-bold transition-all ${tab === 'live' ? 'bg-church-burgundy text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
        >Live</button>
        <button 
          onClick={() => setTab('archive')}
          className={`px-6 py-2 rounded-xl font-bold transition-all ${tab === 'archive' ? 'bg-church-burgundy text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
        >Archive</button>
      </div>
      {tab === 'live' ? <LiveService /> : <WorshipArchive />}
    </div>
  );
}
