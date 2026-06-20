import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db, doc, getDoc, setDoc, serverTimestamp, deleteDoc, onSnapshot } from './firebase';
import { UserProfile } from '../types';

interface AuthContextType {
  user: any;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  mockLogin: (role: 'member' | 'leader' | 'admin' | 'new_user') => void;
  mockLogout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  isAdmin: false,
  mockLogin: () => {},
  mockLogout: () => {}
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMocked, setIsMocked] = useState(false);

  const mockLogin = (role: 'member' | 'leader' | 'admin' | 'new_user') => {
    localStorage.setItem('faithconnect_mock_active', 'true');
    localStorage.setItem('faithconnect_mock_role', role);
    setIsMocked(true);
    const mockUid = `demo-${role}-123`;
    const dummyUser = {
      uid: mockUid,
      email: `demo-${role}@faithconnect.org`,
      displayName: role === 'admin' ? 'Pastor Michael' : role === 'leader' ? 'Sarah Leader' : 'John Member',
      photoURL: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100',
    };
    
    const dummyProfile: UserProfile = {
      uid: mockUid,
      email: dummyUser.email,
      displayName: dummyUser.displayName,
      role: role === 'new_user' ? 'member' : role,
      branch: 'Ankaful',
      createdAt: { toDate: function() { return new Date(); } },
      photoUrl: dummyUser.photoURL,
      bio: role === 'admin' ? 'Lead Pastor' : role === 'leader' ? 'Youth Fellowship Leader' : 'Active Member',
      phone: role === 'new_user' ? '' : '+233 24 123 4567',
      occupation: role === 'new_user' ? '' : 'Ministry',
      onboarded: role !== 'new_user'
    };
    
    setUser(dummyUser);
    setProfile(dummyProfile);
    setLoading(false);
  };

  const mockLogout = () => {
    localStorage.removeItem('faithconnect_mock_active');
    localStorage.removeItem('faithconnect_mock_role');
    setIsMocked(false);
    setUser(null);
    setProfile(null);
  };

  useEffect(() => {
    const isMock = localStorage.getItem('faithconnect_mock_active') === 'true';
    if (isMock) {
      const role = localStorage.getItem('faithconnect_mock_role') || 'member';
      mockLogin(role as any);
    }
  }, []);

  useEffect(() => {
    if (isMocked) return;

    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
      }

      setUser(firebaseUser);
      if (firebaseUser) {
        setLoading(true);
        const docRef = doc(db, 'users', firebaseUser.uid);
        
        try {
          const docSnap = await getDoc(docRef);
          if (!docSnap.exists()) {
            const emailId = (firebaseUser.email || '').toLowerCase();
            const preRegRef = doc(db, 'users', emailId);
            const preRegSnap = await getDoc(preRegRef);
            
            if (preRegSnap.exists()) {
              const preRegData = preRegSnap.data();
              const finalProfile = {
                ...preRegData,
                uid: firebaseUser.uid,
                photoUrl: firebaseUser.photoURL || preRegData.photoUrl || '',
                onboarded: true,
                createdAt: serverTimestamp()
              };
              await setDoc(docRef, finalProfile);
              await deleteDoc(preRegRef);
            } else {
              const newProfile = {
                uid: firebaseUser.uid,
                email: firebaseUser.email || '',
                displayName: firebaseUser.displayName || 'Member',
                role: 'member',
                branch: 'Ankaful',
                onboarded: false,
                createdAt: serverTimestamp(),
                photoUrl: firebaseUser.photoURL || ''
              };
              await setDoc(docRef, newProfile);
            }
          }
        } catch (error) {
          console.error("Error setting up user profile:", error);
        }

        unsubscribeProfile = onSnapshot(docRef, (snapshot) => {
          if (snapshot.exists()) {
            setProfile(snapshot.data() as UserProfile);
          } else {
            setProfile(null);
          }
          setLoading(false);
        }, (error) => {
          console.error("Profile onSnapshot error:", error);
          setLoading(false);
        });

      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, [isMocked]);

  const isAdmin = profile?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, profile, loading, isAdmin, mockLogin, mockLogout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

