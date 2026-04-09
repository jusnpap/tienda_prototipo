import { openDB } from 'idb';

const DATABASE_NAME = 'LaTiendaDB';
const DATABASE_VERSION = 2;

export const initDB = async () => {
  return openDB(DATABASE_NAME, DATABASE_VERSION, {
    upgrade(db, oldVersion, newVersion, transaction) {
      // Products store (v1)
      if (!db.objectStoreNames.contains('products')) {
        const productStore = db.createObjectStore('products', {
          keyPath: 'id',
          autoIncrement: true,
        });
        productStore.createIndex('name', 'name', { unique: false });
        productStore.createIndex('category', 'category', { unique: false });
      }

      // Sales store (v1)
      if (!db.objectStoreNames.contains('sales')) {
        const salesStore = db.createObjectStore('sales', {
          keyPath: 'id',
          autoIncrement: true,
        });
        salesStore.createIndex('date', 'date', { unique: false });
        salesStore.createIndex('productId', 'productId', { unique: false });
      }

      // Settings store (v1)
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }

      // Users store (v2)
      if (!db.objectStoreNames.contains('users')) {
        const userStore = db.createObjectStore('users', { keyPath: 'username' });
        userStore.createIndex('role', 'role', { unique: false });
        
        // Initial Seed (Owner)
        transaction.objectStore('users').add({
          username: 'admin',
          password: 'admin123',
          name: 'Dueño Principal',
          role: 'owner',
          status: 'active',
          createdAt: new Date().toISOString()
        });
      }
    },
  });
};

export const dbRequest = async (storeName, action, data) => {
  const db = await initDB();
  const tx = db.transaction(storeName, 'readwrite');
  const store = tx.objectStore(storeName);
  let result;

  switch (action) {
    case 'getAll':
      result = await store.getAll();
      break;
    case 'get':
      result = await store.get(data);
      break;
    case 'add':
      result = await store.add(data);
      break;
    case 'put':
      result = await store.put(data);
      break;
    case 'delete':
      result = await store.delete(data);
      break;
    case 'clear':
      result = await store.clear();
      break;
    default:
      throw new Error(`Unknown action: ${action}`);
  }

  await tx.done;
  return result;
};
