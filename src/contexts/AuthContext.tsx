import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signOut as firebaseSignOut, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp, collection, addDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  userDisabled: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  logSystemAction: (action: string, details?: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userDisabled, setUserDisabled] = useState(false);

  useEffect(() => {
    let unsubscribeDoc: () => void;
    
    const unsubscribeAuth = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      
      if (u) {
        // Listen to live user doc for bans
        unsubscribeDoc = onSnapshot(doc(db, 'users', u.uid), async (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            if (data.disabled) {
              setUserDisabled(true);
              setUser(null); // Force local restrict
              await firebaseSignOut(auth);
            } else {
              setUserDisabled(false);
            }
          }
        });

        // Save user profile for admin dashboard
        try {
          await setDoc(doc(db, 'users', u.uid), {
            uid: u.uid,
            email: u.email,
            displayName: u.displayName,
            photoURL: u.photoURL,
            lastLogin: serverTimestamp(),
          }, { merge: true });
        } catch (err) {
          console.error("Error saving user profile:", err);
        }
      } else {
        if (unsubscribeDoc) unsubscribeDoc();
        setUserDisabled(false);
      }
      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeDoc) unsubscribeDoc();
    };
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    // Use custom client ID if provided via environment
    if (import.meta.env.VITE_GOOGLE_CLIENT_ID) {
      provider.setCustomParameters({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID
      });
    }

    const result = await signInWithPopup(auth, provider);
    if (result.user) {
      try {
        await addDoc(collection(db, 'sys_logs'), {
          message: 'Utilisateur connecté avec succès',
          details: { method: 'GooglePopup' },
          userId: result.user.uid,
          userEmail: result.user.email,
          timestamp: serverTimestamp(),
        });
      } catch (e) {
        console.error(e);
      }
    }
  };

  const signOut = async () => {
    if (user) {
      await logSystemAction('Utilisateur déconnecté', { method: 'SignOut' });
    }
    return firebaseSignOut(auth);
  };

  const logSystemAction = async (message: string, details?: any) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'sys_logs'), {
        message,
        details: details || null,
        userId: user.uid,
        userEmail: user.email,
        timestamp: serverTimestamp(),
      });
    } catch (err) {
      console.error("Error logging action:", err);
    }
  };

  const isAdmin = user?.email === 'romeo.brawlstars59@gmail.com';

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, userDisabled, signInWithGoogle, signOut, logSystemAction }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
