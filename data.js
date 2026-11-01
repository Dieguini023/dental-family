// Capa de datos: Firebase (en línea, compartido) o DEMO (localStorage).
import { firebaseConfig } from './config.js';

export const DEMO = !firebaseConfig.apiKey || firebaseConfig.apiKey.startsWith('PEGAR');

// Datos iniciales tomados del libro Excel (fotos del 31/10/2026)
export function datosExcel() { const s = seed(); return { movimientos: s.movimientos, trabajos: s.trabajos }; }

export function createStore(h) {
  return DEMO ? demoStore(h) : fbStore(h);
}

// ------------------------------------------------------------ Firebase
async function fbStore(h) {
  const base = 'https://www.gstatic.com/firebasejs/10.12.2/';
  const { initializeApp } = await import(base + 'firebase-app.js');
  const A = await import(base + 'firebase-auth.js');
  const F = await import(base + 'firebase-firestore.js');
  const app = initializeApp(firebaseConfig);
  const auth = A.getAuth(app);
  const db = F.initializeFirestore(app, {
    localCache: F.persistentLocalCache({ tabManager: F.persistentMultipleTabManager() })
  });
  let unsubs = [];
  const docs = s => s.docs.map(d => ({ id: d.id, ...d.data() }));
  const err = e => h.onError && h.onError(e);

  A.onAuthStateChanged(auth, u => {
    unsubs.forEach(f => f()); unsubs = [];
    if (u) {
      unsubs.push(F.onSnapshot(F.doc(db, 'config', 'general'), s => h.onConfig(s.exists() ? s.data() : null), err));
      unsubs.push(F.onSnapshot(F.collection(db, 'movimientos'), s => h.onMovs(docs(s), s.metadata.hasPendingWrites), err));
      unsubs.push(F.onSnapshot(F.collection(db, 'trabajos'), s => h.onTrabajos(docs(s)), err));
    }
    h.onAuth(u ? { email: (u.email || '').toLowerCase() } : null);
  });

  // Las escrituras no se esperan: funcionan sin conexión y se suben solas.
  const fire = p => { p.catch(err); return Promise.resolve(); };
  return {
    mode: 'firebase',
    login: (e, p) => A.signInWithEmailAndPassword(auth, e.trim(), p),
    logout: () => A.signOut(auth),
    reset: e => A.sendPasswordResetEmail(auth, e.trim()),
    add: (c, o) => fire(F.addDoc(F.collection(db, c), o)),
    update: (c, id, o) => fire(F.updateDoc(F.doc(db, c, id), o)),
    remove: (c, id) => fire(F.deleteDoc(F.doc(db, c, id))),
    setConfig: o => fire(F.setDoc(F.doc(db, 'config', 'general'), o)),
    batchDelete: async (c, ids) => {
      for (let i = 0; i < ids.length; i += 400) {
        const b = F.writeBatch(db);
        ids.slice(i, i + 400).forEach(id => b.delete(F.doc(db, c, id)));
        await b.commit();
      }
    },
    batchSet: async (c, arr) => {
      for (let i = 0; i < arr.length; i += 400) {
        const b = F.writeBatch(db);
        arr.slice(i, i + 400).forEach(({ id, ...o }) => b.set(F.doc(db, c, id), o));
        await b.commit();
      }
    },
    batchAdd: async (c, arr) => {
      for (let i = 0; i < arr.length; i += 400) {
        const b = F.writeBatch(db);
        arr.slice(i, i + 400).forEach(o => b.set(F.doc(F.collection(db, c)), o));
        await b.commit();
      }
    }
  };
}

// ------------------------------------------------------------ DEMO
function demoStore(h) {
  const KEY = 'df-demo-v1';
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)); } catch (e) { return null; } };
  let st = load() || seed();
  let user = null;
  try { user = JSON.parse(sessionStorage.getItem(KEY + '-user')); } catch (e) {}
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {} };
  const emit = () => { h.onConfig(st.config); h.onMovs(st.movimientos.slice(), false); h.onTrabajos(st.trabajos.slice()); };
  const id = () => Math.random().toString(36).slice(2, 11);
  setTimeout(() => { h.onAuth(user); if (user) emit(); }, 0);
  const done = () => { save(); emit(); return Promise.resolve(); };
  return {
    mode: 'demo',
    login: email => { user = { email }; try { sessionStorage.setItem(KEY + '-user', JSON.stringify(user)); } catch (e) {} h.onAuth(user); emit(); return Promise.resolve(); },
    logout: () => { user = null; try { sessionStorage.removeItem(KEY + '-user'); } catch (e) {} h.onAuth(null); return Promise.resolve(); },
    reset: () => Promise.resolve(),
    add: (c, o) => { st[c].push({ id: id(), ...o }); return done(); },
    update: (c, i, o) => { const x = st[c].find(d => d.id === i); if (x) Object.assign(x, o); return done(); },
    remove: (c, i) => { st[c] = st[c].filter(d => d.id !== i); return done(); },
    setConfig: o => { st.config = o; return done(); },
    batchDelete: (c, ids) => { st[c] = st[c].filter(x => !ids.includes(x.id)); return done(); },
    batchSet: (c, arr) => { arr.forEach(o => { st[c] = st[c].filter(x => x.id !== o.id); st[c].push({ ...o }); }); return done(); },
    batchAdd: (c, arr) => { arr.forEach(o => st[c].push({ id: id(), ...o })); return done(); },
    resetDemo: () => { st = seed(); return done(); }
  };
}

// Datos traídos del libro Excel actual (octubre 2026)
function seed() {
  const f = '2026-10-30', by = 'adielainesquiroga@gmail.com';
  const M = (tipo, categoria, grupo, descripcion, valor, cuenta, extra = {}) =>
    ({ fecha: f, tipo, categoria, grupo, descripcion, valor, cuenta, creadoPor: by, creadoMs: Date.now(), ...extra });
  return {
    config: null,
    movimientos: [
      M('Egreso', 'Domicilios', 'Material / operativo', 'Domicilios del día (registro anterior)', 6000, 'Caja (efectivo)'),
      M('Egreso', 'Porcelana', 'Material / operativo', 'Compra de porcelana (registro anterior)', 38500, 'Caja (efectivo)'),
      M('Egreso', 'Revestimiento', 'Material / operativo', 'Revestimiento (registro anterior)', 8500, 'Caja (efectivo)'),
      M('Egreso', 'Domicilios', 'Material / operativo', 'Domicilios viernes 30/10', 24000, 'Caja (efectivo)'),
      M('Egreso', 'Arriendo', 'Fijo', 'Arriendo octubre', 1100000, 'Banco', { periodo: '2026-10' }),
      M('Egreso', 'Recibo luz', 'Fijo', 'Luz octubre', 408000, 'Banco', { periodo: '2026-10' }),
      M('Egreso', 'Internet', 'Fijo', 'Internet octubre', 70800, 'Banco', { periodo: '2026-10' }),
      M('Egreso', 'Descont', 'Fijo', 'Descont octubre', 35000, 'Banco', { periodo: '2026-10' }),
      M('Ingreso', 'Abono a trabajo', 'Ingreso', 'Abono corona en zirconio – Jair Ruiz Lobo', 150000, 'Caja (efectivo)', { orden: 'DF-0001', tercero: 'Fabio Delgado' }),
      M('Ingreso', 'Pago de trabajo', 'Ingreso', 'Incrustación en disilicato', 230000, 'Caja (efectivo)', { orden: '8909', tercero: 'Viviana Callejas' })
    ].map((m, i) => ({ id: 'm' + i, ...m, creadoMs: m.creadoMs + i })),
    trabajos: [
      { orden: '8909', fecha: f, paciente: '', odontologo: 'Viviana Callejas', tipo: 'Incrustación en disilicato', valor: 230000, etapas: {}, obs: 'Marcado «cancelado» en el libro anterior' },
      { orden: '6083', fecha: f, paciente: 'Carlos Bernal', odontologo: 'Jairo Niño', tipo: 'Corona sobre implante', valor: 295000, etapas: {} },
      { orden: 'DF-0001', fecha: f, paciente: 'Jair Ruiz Lobo', odontologo: 'Fabio Delgado', tipo: 'Corona en zirconio', valor: 300000, maquinado: 126000, etapas: {} },
      { orden: 'DF-0002', fecha: f, paciente: 'Valeria Santa Maria', odontologo: 'Jairo Niño', tipo: 'Corona metal porcelana', valor: 0, etapas: { 'Prueba de metal': f } },
      { orden: 'DF-0003', fecha: f, paciente: 'Levis', odontologo: 'Jairo Niño', tipo: 'Corona metal porcelana', valor: 0, etapas: { 'Prueba de metal': f } },
      { orden: 'DF-0004', fecha: f, paciente: 'Emilsen', odontologo: 'Yanneth Bernal', tipo: 'Corona metal porcelana', valor: 0, etapas: { 'Prueba de metal': f } }
    ].map((t, i) => ({ id: 't' + i, ...t }))
  };
}
