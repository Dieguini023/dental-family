// =====================================================================
//  DENTAL FAMILY · CONFIGURACIÓN
//  1) Pegue aquí los datos de su proyecto Firebase (ver GUIA.html, paso 2).
//     Mientras apiKey diga "PEGAR_AQUI" la app funciona en MODO DEMO
//     (datos solo en ese navegador, para probarla).
//  2) Escriba el correo real de cada socio. DEBEN coincidir con los
//     correos del archivo firestore.rules.
// =====================================================================

export const firebaseConfig = {
  apiKey: "AIzaSyB5Kcb8D0w5DItjGBKPqhhbWGsyYGxMOBY",
  authDomain: "dental-family-b3e48.firebaseapp.com",
  projectId: "dental-family-b3e48",
  storageBucket: "dental-family-b3e48.firebasestorage.app",
  messagingSenderId: "864969773305",
  appId: "1:864969773305:web:a2dd1a5c4d9767e5c75228"
};

// rol "admin" = registra y edita (Adiela). rol "lectura" = solo consulta.
export const SOCIOS = [
  { nombre: "Adiela Quiroga",     email: "adielainesquiroga@gmail.com",  rol: "admin"   },
  { nombre: "Alirio Muñoz",       email: "laboratoriotecnodent@hotmail.com",  rol: "lectura" },
  { nombre: "Hernán Darío Muñoz", email: "mq.hernand03@gmail.com",  rol: "lectura" }
];
