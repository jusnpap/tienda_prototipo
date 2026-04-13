import { initializeApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";

// CONFIGURACIÓN DE FIREBASE
// IMPORTANTE: Debes reemplazar estos valores con tus propias llaves desde la consola de Firebase
// para que la sincronización entre dispositivos funcione correctamente.
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

// Habilitar persistencia offline para que funcione sin internet temporalmente
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

