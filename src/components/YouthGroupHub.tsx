import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType, collection, query, orderBy, onSnapshot, addDoc, getDocs, doc, updateDoc, deleteDoc, serverTimestamp } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { YouthEvent, YouthChallenge, YouthPost } from '../types';
import { Calendar, MessageSquare, Plus, Send, Share2, ThumbsUp, Trophy, Zap, MapPin, Hash, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';

export default function YouthGroupHub() {
  const { user, profile } = useAuth();
  const isLeader = profile?.role === 'leader' || profile?.role === 'admin';
  const [activeTab, setActiveTab] = useState<'discussions' | 'challenges' | 'events'>('discussions');

  // Loaders
  const [events, setEvents] = useState<YouthEvent[]>([]);
  const [challenges, setChallenges] = useState<YouthChallenge[]>([]);
  const [posts, setPosts] = useState<YouthPost[]>([]);

  // Sub-forms or interactive fields
  const [newPostContent, setNewPostContent] = useState('');
  const [postCategory, setPostCategory] = useState<'General' | 'Prayer' | 'Encouragement'>('General');
  const [repliesOpenId, setRepliesOpenId] = useState<string | null>(null);
  const [replyInput, setReplyInput] = useState('');

  // Event forms for leaders
  const [eventTitle, setEventTitle] = useState('');
  const [eventDesc, setEventDesc] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventLocation, setEventLocation] = useState('');

  // Challenge forms for leaders
  const [challengeTitle, setChallengeTitle] = useState('');
  const [challengeDesc, setChallengeDesc] = useState('');
  const [challengeTarget, setChallengeTarget] = useState('');
  const [challengePoints, setChallengePoints] = useState(50);

  // Load All feeds
  useEffect(() => {
    if (!user) return;

    // Fetch youth events
    const unsubscribeEvents = onSnapshot(collection(db, 'youth_events'), (snap) => {
      const data = snap.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      })) as YouthEvent[];
      setEvents(data.sort((a,b) => a.date.localeCompare(b.date)));
    });

    // Fetch youth scripture challenges
    const unsubscribeChallenges = onSnapshot(collection(db, 'youth_challenges'), (snap) => {
      const data = snap.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      })) as YouthChallenge[];
      setChallenges(data);
    });

    // Fetch youth discussions
    const unsubscribePosts = onSnapshot(
      query(collection(db, 'youth_discussions'), orderBy('timestamp', 'desc')),
      (snap) => {
        const data = snap.docs.map(docSnap => ({
          id: docSnap.id,
          ...docSnap.data()
        })) as YouthPost[];
        setPosts(data);
      },
      (error) => {
        // Fallback without orderBy in case index hasn't finished spinning
        onSnapshot(collection(db, 'youth_discussions'), (snap) => {
          const data = snap.docs.map(docSnap => ({
            id: docSnap.id,
            ...docSnap.data()
          })) as YouthPost[];
          setPosts(data.sort((a,b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0)));
        });
      }
    );

    // Initial Seeding checking (safely verify in firestore so UI is pre-populated)
    const seedYouthData = async () => {
      const eventSnap = await getDocs(collection(db, 'youth_events'));
      if (eventSnap.empty) {
        await addDoc(collection(db, 'youth_events'), {
          title: 'Friday Movie & Pizza Night',
          description: 'Join us in the fellowship hall for personal testimony, pizza and a family friendly devotional review.',
          date: '2026-06-26',
          location: 'Main Fellowship Hall',
          branch: 'Ankaful'
        });
        await addDoc(collection(db, 'youth_events'), {
          title: 'Unstoppable Summer Youth Camp 2026',
          description: 'A 4-day outdoor discipleship retreat containing dynamic worship sessions and friendly competitions.',
          date: '2026-07-15',
          location: 'Alpine Retreat Arena',
          branch: 'Ankaful'
        });
      }

      const challengeSnap = await getDocs(collection(db, 'youth_challenges'));
      if (challengeSnap.empty) {
        await addDoc(collection(db, 'youth_challenges'), {
          title: 'Jonah Study Challenge',
          description: 'Read the complete book of Jonah and summarize three lessons of obedience.',
          target: 'Gospel reading logs & summaries',
          points: 100,
          participants: {},
          branch: 'Ankaful'
        });
        await addDoc(collection(db, 'youth_challenges'), {
          title: 'Romans 8 Recitation',
          description: 'Memorize and recite Romans 8:38-39 to any youth ministry leader.',
          target: 'Memory Scripture',
          points: 150,
          participants: {},
          branch: 'Ankaful'
        });
      }
    };
    seedYouthData();

    return () => {
      unsubscribeEvents();
      unsubscribeChallenges();
      unsubscribePosts();
    };
  }, [user]);

  // Submit new thread
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;

    try {
      const postDoc = {
        authorId: user?.uid,
        authorName: profile?.displayName || user?.displayName || 'Teen Member',
        content: `[#${postCategory}] ${newPostContent}`,
        timestamp: serverTimestamp(),
        branch: profile?.branch || 'Ankaful',
        likes: [],
        replies: []
      };

      await addDoc(collection(db, 'youth_discussions'), postDoc);
      setNewPostContent('');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'youth_post');
    }
  };

  // Like or unlike a post
  const handleLikePost = async (post: YouthPost) => {
    if (!user) return;
    const likes = [...post.likes];
    const idx = likes.indexOf(user.uid);
    if (idx > -1) {
      likes.splice(idx, 1);
    } else {
      likes.push(user.uid);
    }

    try {
      const docRef = doc(db, 'youth_discussions', post.id);
      await updateDoc(docRef, { likes });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'youth_like');
    }
  };

  // Reply onto a post
  const handleAddReply = async (post: YouthPost) => {
    if (!replyInput.trim()) return;

    const replies = [...post.replies, {
      authorName: profile?.displayName || user?.displayName || 'Teen Member',
      content: replyInput,
      timestamp: new Date().toISOString()
    }];

    try {
      const docRef = doc(db, 'youth_discussions', post.id);
      await updateDoc(docRef, { replies });
      setReplyInput('');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'youth_reply');
    }
  };

  // Joined/Completed Challenge Toggle
  const handleToggleChallenge = async (challenge: YouthChallenge, action: 'joined' | 'completed') => {
    if (!user) return;
    const participants = { ...challenge.participants };
    
    if (participants[user.uid]?.status === 'completed' && action === 'completed') {
      // already completed, ignore or toggle back to joined
      participants[user.uid] = { status: 'joined', date: format(new Date(), 'yyyy-MM-dd') };
    } else {
      participants[user.uid] = { status: action, date: format(new Date(), 'yyyy-MM-dd') };
    }

    try {
      const docRef = doc(db, 'youth_challenges', challenge.id);
      await updateDoc(docRef, { participants });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'youth_challenge_toggle');
    }
  };

  // Delete discussion thread (leaders or self)
  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this thread?')) return;
    try {
      await deleteDoc(doc(db, 'youth_discussions', postId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'youth_post_delete');
    }
  };

  // Leaders creating event
  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle || !eventDate) return;

    try {
      await addDoc(collection(db, 'youth_events'), {
        title: eventTitle,
        description: eventDesc,
        date: eventDate,
        location: eventLocation || 'Youth Room',
        branch: profile?.branch || 'Ankaful'
      });
      setEventTitle('');
      setEventDesc('');
      setEventDate('');
      setEventLocation('');
      alert('Event added successfully.');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'youth_event_add');
    }
  };

  // Leaders creating challenge
  const handleCreateChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!challengeTitle || !challengeTarget) return;

    try {
      await addDoc(collection(db, 'youth_challenges'), {
        title: challengeTitle,
        description: challengeDesc,
        target: challengeTarget,
        points: Number(challengePoints),
        participants: {},
        branch: profile?.branch || 'Ankaful'
      });
      setChallengeTitle('');
      setChallengeDesc('');
      setChallengeTarget('');
      setChallengePoints(50);
      alert('Challenge added successfully.');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'youth_challenge_add');
    }
  };

  const displayedEvents = events;
  const displayedChallenges = challenges;
  const displayedPosts = posts;

  return (
    <div className="space-y-6">
      {/* Header view */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-church-gold/20 pb-4">
        <div>
          <h2 className="text-3xl font-serif font-bold text-church-burgundy">Youth Group Hub</h2>
          <p className="text-slate-500 font-medium">A dedicated safe space for sharing encouragement, logging active verse challenges, and finding events.</p>
        </div>

        {/* Tab Selection */}
        <div className="flex overflow-x-auto max-w-full -mx-4 px-4 sm:mx-0 sm:px-0 space-x-1 bg-white p-1 rounded-2xl border border-church-gold/10 shadow-sm text-xs scrollbar-none">
          <button 
            onClick={() => setActiveTab('discussions')}
            className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center space-x-2 flex-shrink-0 ${activeTab === 'discussions' ? 'bg-church-burgundy text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <MessageSquare size={14} />
            <span>Encouragement board</span>
          </button>
          <button 
            onClick={() => setActiveTab('challenges')}
            className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center space-x-2 flex-shrink-0 ${activeTab === 'challenges' ? 'bg-church-burgundy text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <Trophy size={14} />
            <span>Challenges</span>
          </button>
          <button 
            onClick={() => setActiveTab('events')}
            className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center space-x-2 flex-shrink-0 ${activeTab === 'events' ? 'bg-church-burgundy text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <Calendar size={14} />
            <span>Events</span>
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        
        {/* DISCUSSIONS TAB */}
        {activeTab === 'discussions' && (
          <motion.div
            key="discussions"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* Feed Section */}
            <div className="lg:col-span-2 space-y-4">
              {/* Write Post Box */}
              <form onSubmit={handleCreatePost} className="bg-white p-5 rounded-3xl border border-church-gold/10 shadow-sm space-y-3">
                <div className="flex items-center space-x-2">
                  <Hash size={16} className="text-church-gold" />
                  <span className="font-bold text-xs text-slate-700">Tell us what's on your heart:</span>
                  <div className="ml-auto flex items-center gap-1.5">
                    {(['General', 'Prayer', 'Encouragement'] as const).map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setPostCategory(cat)}
                        className={`px-2.5 py-1 text-[10px] rounded-lg font-bold border transition-all ${
                          postCategory === cat
                            ? 'bg-church-burgundy text-white border-transparent'
                            : 'bg-slate-50 text-slate-500 border-slate-100 hover:bg-slate-100'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="relative">
                  <textarea
                    placeholder="Share a verse, prayer request, or comment..."
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    rows={2}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 outline-none text-sm transition-all focus:ring-1 focus:ring-church-burgundy rounded-2xl resize-none"
                  ></textarea>
                  <button
                    type="submit"
                    className="absolute right-2.5 bottom-3.5 p-1.5 bg-church-burgundy text-white rounded-xl shadow-md shadow-church-burgundy/15 hover:scale-105 transition-transform"
                  >
                    <Send size={16} />
                  </button>
                </div>
              </form>

              {/* Feed items */}
              {displayedPosts.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center text-slate-400 border border-church-gold/10">
                  <MessageSquare className="mx-auto mb-3 text-slate-200" size={48} />
                  <p className="text-sm">First post awaits! Write down something inspirational.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {displayedPosts.map((post) => (
                    <div key={post.id} className="bg-white p-5 rounded-3xl border border-church-gold/10 shadow-sm space-y-4">
                      {/* Post Head */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-church-gold/10 text-church-gold flex items-center justify-center font-bold text-xs uppercase">
                            {post.authorName?.[0]}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="font-bold text-xs text-slate-800">{post.authorName}</p>
                            </div>
                            <p className="text-[9px] text-slate-400">
                              {post.timestamp ? format(new Date(post.timestamp?.seconds * 1000), 'MMM d, h:mm a') : 'Now'}
                            </p>
                          </div>
                        </div>
                        
                        {(isLeader || post.authorId === user?.uid) && (
                          <button
                            onClick={() => handleDeletePost(post.id)}
                            className="text-slate-400 hover:text-red-500 p-1 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>

                      {/* Content */}
                      <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                        {post.content}
                      </p>

                      {/* Controls */}
                      <div className="flex items-center space-x-4 border-t pt-3 border-slate-100 text-xs">
                        <button
                          onClick={() => handleLikePost(post)}
                          className={`flex items-center space-x-1.5 font-bold transition-colors ${
                            post.likes.includes(user?.uid || '') ? 'text-church-burgundy' : 'text-slate-400 hover:text-slate-600'
                          }`}
                        >
                          <ThumbsUp size={14} />
                          <span>{post.likes.length} Likes</span>
                        </button>

                        <button
                          onClick={() => setRepliesOpenId(repliesOpenId === post.id ? null : post.id)}
                          className="flex items-center space-x-1.5 text-slate-400 hover:text-slate-600 font-bold"
                        >
                          <MessageSquare size={14} />
                          <span>{post.replies?.length || 0} Comments</span>
                        </button>
                      </div>

                      {/* Replies List */}
                      {repliesOpenId === post.id && (
                        <div className="bg-slate-50 rounded-2xl p-4 mt-2 space-y-3 border border-slate-100">
                          {post.replies?.map((r, rIdx) => (
                            <div key={rIdx} className="border-b pb-2 last:border-0 last:pb-0 border-slate-200/50">
                              <p className="font-bold text-[10px] text-church-gold uppercase tracking-wide">
                                {r.authorName} — <span className="font-normal text-slate-400 lowercase">{format(new Date(r.timestamp), 'h:mm a')}</span>
                              </p>
                              <p className="text-xs text-slate-700 leading-relaxed mt-0.5">{r.content}</p>
                            </div>
                          ))}

                          <div className="flex gap-2 pt-2">
                            <input
                              type="text"
                              value={replyInput}
                              onChange={(e) => setReplyInput(e.target.value)}
                              placeholder="Add details / encourage here..."
                              className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:ring-1 focus:ring-church-burgundy"
                            />
                            <button
                              onClick={() => handleAddReply(post)}
                              className="px-3 py-1.5 bg-church-burgundy text-white font-bold text-xs rounded-xl"
                            >
                              Reply
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Side Guidelines & rules */}
            <div className="bg-white rounded-3xl p-6 border border-church-gold/10 shadow-sm h-fit space-y-4">
              <h3 className="font-serif font-bold text-slate-800 border-b pb-2 border-slate-100">Teens Safe Covenant</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                We are built to lift each other up. Treat everyone with dignity, kindness, and love as instructed in 1 Thessalonians 5:11.
              </p>
              <div className="p-3.5 bg-church-cream/35 border-l-4 border-church-gold rounded-r-xl">
                <p className="text-xs text-slate-700 italic">"Encourage one another and build each other up, just as you are doing."</p>
                <p className="text-[10px] uppercase tracking-wider font-bold text-church-gold mt-1">— 1 Thessalonians 5:11</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* CHALLENGES TAB */}
        {activeTab === 'challenges' && (
          <motion.div
            key="challenges"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* Active Challenges feed */}
            <div className="lg:col-span-2 space-y-4">
              {displayedChallenges.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center text-slate-400 border border-church-gold/10">
                  <Trophy className="mx-auto mb-3 text-slate-200" size={48} />
                  <p className="text-sm">There are no scripture challenges running right now.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {displayedChallenges.map((c) => {
                    const status = c.participants?.[user?.uid || '']?.status;
                    return (
                      <div key={c.id} className="bg-white p-5 rounded-3xl border border-church-gold/10 shadow-sm flex flex-col justify-between">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] uppercase font-bold text-church-gold tracking-widest bg-church-gold/5 px-2.5 py-1 rounded-full border border-church-gold/15">
                              {c.target}
                            </span>
                            <span className="text-xs text-church-burgundy font-bold flex items-center space-x-1 bg-church-burgundy/5 px-2.5 py-1 rounded-full">
                              <Zap size={12} />
                              <span>{c.points} XP</span>
                            </span>
                          </div>

                          <h4 className="font-serif font-bold text-slate-800 text-lg">{c.title}</h4>
                          <p className="text-xs text-slate-500 leading-relaxed">{c.description}</p>
                        </div>

                        <div className="border-t border-slate-100 pt-4 mt-4 flex items-center justify-between gap-2">
                          {status === 'completed' ? (
                            <span className="text-xs text-church-olive font-bold bg-church-olive/5 px-4 py-1.5 rounded-xl border border-church-olive/20 flex items-center gap-1">
                              <Trophy size={12} />
                              <span>Completed!</span>
                            </span>
                          ) : status === 'joined' ? (
                            <div className="flex gap-2 w-full">
                              <button
                                onClick={() => handleToggleChallenge(c, 'completed')}
                                className="flex-1 py-1.5 bg-church-olive hover:bg-church-olive/90 text-white font-bold text-xs rounded-xl text-center"
                              >
                                Complete Thread
                              </button>
                              <button
                                onClick={() => handleToggleChallenge(c, 'joined')}
                                className="py-1.5 px-3 border border-slate-200 text-slate-500 font-bold text-xs rounded-xl"
                              >
                                Leave
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleToggleChallenge(c, 'joined')}
                              className="w-full py-2 bg-church-burgundy text-white font-bold text-xs rounded-xl hover:bg-church-burgundy/95 text-center"
                            >
                              Accept Challenge
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Leader Panel to create challenge */}
            <div className="space-y-6">
              {isLeader && (
                <div className="bg-white rounded-3xl p-6 border border-church-gold/10 shadow-sm space-y-4">
                  <h3 className="font-serif font-bold text-slate-800 flex items-center space-x-2">
                    <Plus size={18} className="text-church-burgundy" />
                    <span>Create New Challenge</span>
                  </h3>
                  <form onSubmit={handleCreateChallenge} className="space-y-3">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Challenge Title</label>
                      <input
                        type="text"
                        placeholder="e.g., Memorize Psalm 23"
                        value={challengeTitle}
                        onChange={(e) => setChallengeTitle(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Weekly Task Description</label>
                      <textarea
                        placeholder="Details of memory scriptures or passages..."
                        value={challengeDesc}
                        onChange={(e) => setChallengeDesc(e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none resize-none"
                      ></textarea>
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Verification Method / Target</label>
                      <input
                        type="text"
                        placeholder="e.g., Memory scripture, Quiz card"
                        value={challengeTarget}
                        onChange={(e) => setChallengeTarget(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Points (XP value)</label>
                      <input
                        type="number"
                        min="10"
                        max="500"
                        value={challengePoints}
                        onChange={(e) => setChallengePoints(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2 bg-church-burgundy hover:bg-church-burgundy/95 text-white font-bold text-xs rounded-xl"
                    >
                      Publish Challenge
                    </button>
                  </form>
                </div>
              )}

              {/* Top leaderboard highlights */}
              <div className="bg-white rounded-3xl p-6 border border-church-gold/10 shadow-sm space-y-4">
                <h4 className="font-serif font-bold text-slate-800 text-lg flex items-center space-x-2">
                  <Trophy size={18} className="text-church-gold" />
                  <span>Teens XP Leaderboard</span>
                </h4>
                <div className="space-y-2.5">
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                    <span>1. Daniel K.</span>
                    <span className="text-church-gold">450 XP</span>
                  </div>
                  <div className="flex justify-between text-xs font-medium text-slate-600">
                    <span>2. Rebecca J.</span>
                    <span className="text-church-gold">300 XP</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>3. Matthew H.</span>
                    <span className="text-church-gold">150 XP</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* EVENTS TAB */}
        {activeTab === 'events' && (
          <motion.div
            key="events"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* Events List */}
            <div className="lg:col-span-2 space-y-4">
              {displayedEvents.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center text-slate-400 border border-church-gold/10">
                  <Calendar className="mx-auto mb-3 text-slate-200" size={48} />
                  <p className="text-sm">No upcoming youth group events schedule.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {displayedEvents.map((ev) => (
                    <div key={ev.id} className="bg-white p-5 rounded-3xl border border-church-gold/10 shadow-sm flex flex-col md:flex-row justify-between gap-4">
                      <div className="flex items-start space-x-4">
                        <div className="w-12 h-12 bg-church-burgundy/5 text-church-burgundy rounded-xl flex items-center justify-center flex-shrink-0">
                          <Calendar size={22} />
                        </div>
                        <div>
                          <h4 className="font-serif font-bold text-slate-800 text-lg">{ev.title}</h4>
                          <p className="text-xs text-slate-500 leading-relaxed mt-1">{ev.description}</p>
                          
                          <div className="flex flex-wrap gap-4 mt-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                            <span className="flex items-center space-x-1">
                              <Calendar size={12} className="text-church-gold" />
                              <span>{format(new Date(ev.date + 'T00:00:00'), 'eeee, MMMM d, yyyy')}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <MapPin size={12} className="text-church-gold" />
                              <span>{ev.location}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Create Event for Leaders */}
            {isLeader && (
              <div className="bg-white rounded-3xl p-6 border border-church-gold/10 shadow-sm space-y-4 h-fit">
                <h3 className="font-serif font-bold text-slate-800 flex items-center space-x-2">
                  <Plus size={18} className="text-church-burgundy" />
                  <span>Create Youth Event</span>
                </h3>
                <form onSubmit={handleCreateEvent} className="space-y-3">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Event Title</label>
                    <input
                      type="text"
                      placeholder="e.g., Pizza Friday & Worship"
                      value={eventTitle}
                      onChange={(e) => setEventTitle(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Description</label>
                    <textarea
                      placeholder="Short plan outline..."
                      value={eventDesc}
                      onChange={(e) => setEventDesc(e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none resize-none"
                    ></textarea>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Date</label>
                    <input
                      type="date"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Location</label>
                    <input
                      type="text"
                      placeholder="e.g., Fellowship Hall"
                      value={eventLocation}
                      onChange={(e) => setEventLocation(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 bg-church-burgundy hover:bg-church-burgundy/95 text-white font-bold text-xs rounded-xl"
                  >
                    Add Event
                  </button>
                </form>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
