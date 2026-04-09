import { initializeApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";

// Configuración de Firebase (El usuario debe completar esto en una consola real)
const firebaseConfig = {
  apiKey: "PLACEHOLDER",
  authDomain: "la-tienda-pwa.firebaseapp.com",
  projectId: "la-tienda-pwa",
  storageBucket: "la-tienda-pwa.appspot.com",
  messagingSenderId: "PLACEHOLDER",
  appId: "PLACEHOLDER"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Habilitar persistencia offline nativa de Firebase
if (typeof window !== "undefined") {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn("Múltiples pestañas abiertas, persistencia solo en una.");
    } else if (err.code === 'unimplemented') {
      console.warn("Navegador no soporta persistencia offline.");
    }
  });
}

export { db };
