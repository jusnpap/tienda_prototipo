import { initializeApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";

// CONFIGURACIÓN DE FIREBASE
// IMPORTANTE: Debes reemplazar estos valores con tus propias llaves desde la consola de Firebase
// para que la sincronización entre dispositivos funcione correctamente.
const firebaseConfig = {
  apiKey: "AIzaSyB_znON6IQ39iM-JmOlE9KOMeLwfuNaA2Q",
  authDomain: "la-tienda-586ba.firebaseapp.com",
  projectId: "la-tienda-586ba",
  storageBucket: "la-tienda-586ba.firebasestorage.app",
  messagingSenderId: "73464516933",
  appId: "1:73464516933:web:0e0002cff61358d703ae2c",
  measurementId: "G-NCH1JZR1ZB"
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

