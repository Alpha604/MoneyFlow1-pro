import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, setDoc, updateDoc, deleteDoc, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';

export function useFirebaseData<T>(collectionName: string) {
  const { user } = useAuth();
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setData([]);
      setLoading(false);
      return;
    }

    const q = query(collection(db, collectionName), where("userId", "==", user.uid));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as T[];
      setData(items);
      setLoading(false);
    }, (error) => {
      console.error(`Firebase error on ${collectionName}:`, error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, collectionName]);

  const add = async (item: Omit<T, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return;
    const now = new Date().toISOString();
    await addDoc(collection(db, collectionName), {
      ...item,
      userId: user.uid,
      createdAt: now,
      updatedAt: now
    });
  };

  const update = async (id: string, item: Partial<Omit<T, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>) => {
    if (!user) return;
    const now = new Date().toISOString();
    const docRef = doc(db, collectionName, id);
    await updateDoc(docRef, {
      ...item,
      updatedAt: now
    });
  };

  const remove = async (id: string) => {
    if (!user) return;
    await deleteDoc(doc(db, collectionName, id));
  };

  return { data, loading, add, update, remove };
}
