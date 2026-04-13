import { db } from './firebase';
import { 
  collection, 
  getDocs, 
  getDoc, 
  addDoc, 
  setDoc, 
  deleteDoc, 
  doc, 
  query, 
  where,
  serverTimestamp
} from 'firebase/firestore';

/**
 * Global database request handler migrated to Firebase Firestore
 * @param {string} storeName - Collection name in Firestore
 * @param {string} action - Action to perform (getAll, get, add, put, delete, clear)
 * @param {any} data - Data for the action
 */
export const dbRequest = async (storeName, action, data) => {
  const colRef = collection(db, storeName);
  
  switch (action) {
    case 'getAll': {
      const snapshot = await getDocs(colRef);
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Emergercy seed for admin if users collection is empty
      if (storeName === 'users' && docs.length === 0) {
        const adminData = {
          username: 'admin',
          password: 'admin123',
          name: 'Dueño Principal',
          role: 'owner',
          status: 'active',
          createdAt: new Date().toISOString()
        };
        await setDoc(doc(db, 'users', 'admin'), adminData);
        return [{ id: 'admin', ...adminData }];
      }
      return docs;
    }


    case 'get': {
      // Data is assumed to be the ID
      const docRef = doc(db, storeName, data);
      const snapshot = await getDoc(docRef);
      return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
    }

    case 'add': {
      // Using addDoc for auto-generated IDs
      // If the data already has an ID (like username in users), we use setDoc
      if (storeName === 'users' && data.username) {
        await setDoc(doc(db, 'users', data.username), data);
        return data.username;
      }
      const docRef = await addDoc(colRef, {
        ...data,
        createdAt: data.createdAt || new Date().toISOString()
      });
      return docRef.id;
    }

    case 'put': {
      // Data must have an id
      const id = data.id || data.username; // handle product id or username
      if (!id) throw new Error('ID is required for update (put)');
      
      const { id: _, ...updateData } = data; // remove id from data itself
      const docRef = doc(db, storeName, id);
      await setDoc(docRef, updateData, { merge: true });
      return id;
    }

    case 'delete': {
      // Data is the ID
      const docRef = doc(db, storeName, data);
      await deleteDoc(docRef);
      return data;
    }

    case 'clear': {
      // Firestore doesn't have a simple 'clear' for security reasons.
      // We would have to delete docs one by one.
      const snapshot = await getDocs(colRef);
      const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
      return true;
    }

    default:
      throw new Error(`Unknown action: ${action}`);
  }
};
