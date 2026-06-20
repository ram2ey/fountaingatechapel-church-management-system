import React, { useState, useEffect } from 'react';
import { db, auth, handleFirestoreError, OperationType, collection, query, orderBy, onSnapshot } from '../lib/firebase';
import { UserProfile } from '../types';
import { Search, Mail, Phone, Calendar, Users } from 'lucide-react';
import { format } from 'date-fns';

export default function Directory() {
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(collection(db, 'users'), orderBy('displayName'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        ...doc.data(),
        uid: doc.id
      })) as UserProfile[];
      setMembers(data);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'users');
    });
    return unsubscribe;
  }, []);

  const filteredMembers = members.filter(m => {
    const matchesSearch = (m.displayName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (m.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-serif font-bold text-church-burgundy">Church Directory</h2>
          <p className="text-slate-500">
            Connecting members at Ankaful branch
          </p>
        </div>
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-church-burgundy transition-colors" size={20} />
          <input 
            type="text"
            placeholder="Search members..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-3 bg-white border border-church-gold/10 rounded-2xl w-full md:w-80 shadow-sm focus:ring-2 focus:ring-church-burgundy focus:border-transparent outline-none transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMembers.map((member) => (
          <div key={member.uid} className="bg-white p-6 rounded-3xl border border-church-gold/10 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-church-gold/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform"></div>
            
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-church-burgundy rounded-2xl flex items-center justify-center text-white text-2xl font-serif shadow-sm font-bold">
                {member.displayName?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-slate-900 truncate">{member.displayName}</h3>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs text-church-gold uppercase font-bold tracking-wider leading-none">{member.role}</span>
                  {member.occupation && (
                    <>
                      <span className="text-slate-300 text-xs">•</span>
                      <span className="text-[9px] text-slate-650 font-bold uppercase tracking-normal bg-church-gold/10 px-2 py-0.5 rounded leading-none">{member.occupation}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <div className="flex items-center space-x-3 text-slate-500 text-sm">
                <Mail size={16} className="text-church-burgundy" />
                <span className="truncate">{member.email}</span>
              </div>
              {member.phone && (
                <div className="flex items-center space-x-3 text-slate-500 text-sm">
                  <Phone size={16} className="text-church-burgundy" />
                  <span>{member.phone}</span>
                </div>
              )}
              <div className="flex items-center space-x-3 text-slate-500 text-sm">
                <Calendar size={16} className="text-church-burgundy" />
                <span>Joined {member.createdAt ? format(new (member.createdAt as any).toDate(), 'MMM yyyy') : 'N/A'}</span>
              </div>
            </div>
            
            {member.bio && (
              <p className="mt-4 text-xs text-slate-400 italic line-clamp-2">"{member.bio}"</p>
            )}
          </div>
        ))}
      </div>
      
      {filteredMembers.length === 0 && (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-church-gold/30">
          <Users className="mx-auto text-slate-300 mb-4" size={48} />
          <p className="text-slate-500 font-medium">No members found matching your search</p>
        </div>
      )}
    </div>
  );
}
