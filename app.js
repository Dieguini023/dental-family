import { createStore, DEMO, datosExcel } from './data.js';
import { SOCIOS } from './config.js';

// ------------------------------------------------------------------ utilidades
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = n => String(n).padStart(2, '0');
const hoy = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
const mesActual = () => hoy().slice(0, 7);
const COP = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
const money = v => COP.format(Math.round(v || 0)).replace(/\s/g, ' ');
const num = v => Number(String(v ?? '').replace(/[^\d-]/g, '')) || 0;
const fmtNum = v => v ? new Intl.NumberFormat('es-CO').format(v) : '';
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const nomMes = m => { const [y, mm] = m.split('-'); return `${MESES[+mm - 1]} ${y}`; };
const addMes = (m, k) => { let [y, mm] = m.split('-').map(Number); mm += k; while (mm > 12) { mm -= 12; y++; } while (mm < 1) { mm += 12; y--; } return `${y}-${pad(mm)}`; };
const fDia = f => { if (!f) return ''; const [y, m, d] = f.split('-'); const s = new Date(+y, +m - 1, +d).toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' }); return s.charAt(0).toUpperCase() + s.slice(1); };
const fCorta = f => f ? `${f.slice(8, 10)}/${f.slice(5, 7)}` : '';
const daysInMonth = m => { const [y, mm] = m.split('-').map(Number); return new Date(y, mm, 0).getDate(); };


// Marca vectorial (nítida en cualquier tamaño)
const TOOTH = 'M7.5 3C5 3 3.5 5 3.5 7.5c0 2 .9 3.6 1.4 6C5.4 16 5.6 21 7.6 21c1.8 0 2.1-4 3.1-6 .4-.8 2.2-.8 2.6 0 1 2 1.3 6 3.1 6 2 0 2.2-5 2.7-7.5.5-2.4 1.4-4 1.4-6C20.5 5 19 3 16.5 3c-2 0-2.8 1-4.5 1S9.5 3 7.5 3z';
const HEART = 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z';
const brandMark = (cls = '') => `<div class="brand ${cls}"><span class="brand-ic"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="${TOOTH}" fill="#fff"/><path transform="translate(9.36 7.6) scale(.22)" fill="#E0306A" d="${HEART}"/></svg></span><span class="brand-tx"><b>Dental Family</b><small>Center</small></span></div>`;

// ------------------------------------------------------------------ configuración por defecto
const DEFAULT_CFG = {
  // pct = PARTES de cada socio (la ganancia se reparte en proporción: Adiela 10,2 · Alirio 25 · Hernán 25 = 60,2 partes)
  socios: SOCIOS.map(s => ({ nombre: s.nombre, email: s.email.toLowerCase(), pct: /adiela/i.test(s.nombre) ? 10.2 : 25 })),
  repartoV2: true,
  cuentas: ['Caja (efectivo)', 'Nequi', 'Banco'],
  saldosIniciales: {},
  pctGastos: 27,
  categorias: [
    ...['Pago de trabajo', 'Abono a trabajo', 'Otro ingreso'].map(n => ({ nombre: n, tipo: 'Ingreso', grupo: 'Ingreso' })),
    { nombre: 'Aporte de socio', tipo: 'Ingreso', grupo: 'Socios' },
    ...['Domicilios', 'Porcelana', 'Metal', 'Pastilla disilicato', 'Oxígeno', 'Gas', 'Alcohol', 'Agua destilada', 'Revestimiento',
      'Fresas, piedras, discos, émbolo', 'Maquinado / fresado externo', 'Otros materiales'].map(n => ({ nombre: n, tipo: 'Egreso', grupo: 'Material / operativo' })),
    ...['Arriendo', 'Recibo agua', 'Recibo luz', 'Internet', 'Descont', 'Nómina / salarios', 'Seguridad social', 'Contador',
      'Impuestos (ICA, renta)', 'Mantenimiento de equipos'].map(n => ({ nombre: n, tipo: 'Egreso', grupo: 'Fijo' })),
    { nombre: 'Otro gasto', tipo: 'Egreso', grupo: 'Otros egresos' },
    { nombre: 'Retiro de socio', tipo: 'Egreso', grupo: 'Socios' }
  ],
  fijos: [
    { concepto: 'Arriendo', dia: 5, valor: 1100000, activo: true },
    { concepto: 'Recibo agua', dia: 15, valor: 0, activo: true },
    { concepto: 'Recibo luz', dia: 15, valor: 408000, activo: true },
    { concepto: 'Internet', dia: 15, valor: 70800, activo: true },
    { concepto: 'Descont', dia: 15, valor: 35000, activo: true },
    { concepto: 'Nómina / salarios', dia: 30, valor: 0, activo: false },
    { concepto: 'Seguridad social', dia: 10, valor: 0, activo: false },
    { concepto: 'Contador', dia: 10, valor: 0, activo: false }
  ],
  odontologos: ['Viviana Callejas', 'Jairo Niño', 'Fabio Delgado', 'Yanneth Bernal'],
  tiposTrabajo: ['Corona metal porcelana', 'Corona sobre implante', 'Corona en zirconio', 'Incrustación en disilicato', 'Corona en disilicato',
    'Carilla', 'Provisional', 'Prótesis parcial removible', 'Prótesis total', 'Placa miorrelajante', 'Otro'],
  etapas: ['Prueba de metal', 'Ingreso p. metal', 'Prueba de porcelana', 'Ingreso p. porcelana', 'Terminado', 'Entregado'],
  diasAviso: 5
};

// ------------------------------------------------------------------ estado
const S = {
  user: null, movs: [], trabajos: [], cfg: null, cfgLoaded: false, pending: false,
  tab: 'inicio', mes: mesActual(), filtroMov: 'Todos', buscaMov: '', filtroTra: 'Activos', buscaTra: '', socAnual: false
};
const cfg = () => S.cfg || DEFAULT_CFG;
const socioDe = email => cfg().socios.find(s => s.email === email) || SOCIOS.find(s => s.email.toLowerCase() === email);
const esAdmin = () => !!S.user && !!SOCIOS.find(s => s.email.toLowerCase() === S.user.email && s.rol === 'admin');
const nombreDe = email => (socioDe(email) || {}).nombre || email || '';
const primerNombre = email => nombreDe(email).split(' ')[0];
const totalPartes = () => cfg().socios.reduce((a, s) => a + (Number(s.pct) || 0), 0) || 1;
const pctDe = s => (Number(s.pct) || 0) / totalPartes() * 100;
const fPct = v => (Math.round(v * 100) / 100).toLocaleString('es-CO', { maximumFractionDigits: 2 }) + ' %';
const fNum = v => (Number(v) || 0).toLocaleString('es-CO', { maximumFractionDigits: 2 });

// ------------------------------------------------------------------ cálculos
const vivos = () => S.movs.filter(m => !m.anulado);
const mesCont = m => m.periodo || (m.fecha || '').slice(0, 7);
const operativo = m => m.tipo !== 'Traslado' && m.grupo !== 'Socios';
function totalesMes(mes) {
  let ing = 0, egr = 0, mat = 0, fij = 0, otr = 0;
  vivos().filter(m => operativo(m) && mesCont(m) === mes).forEach(m => {
    if (m.tipo === 'Ingreso') ing += m.valor;
    else { egr += m.valor; if (m.grupo === 'Fijo') fij += m.valor; else if (m.grupo === 'Material / operativo') mat += m.valor; else otr += m.valor; }
  });
  return { ing, egr, mat, fij, otr, util: ing - egr };
}
function saldos() {
  const r = {}; cfg().cuentas.forEach(c => r[c] = num(cfg().saldosIniciales[c]));
  vivos().forEach(m => {
    if (!(m.cuenta in r)) r[m.cuenta] = 0;
    if (m.tipo === 'Ingreso') r[m.cuenta] += m.valor;
    else if (m.tipo === 'Egreso') r[m.cuenta] -= m.valor;
    else if (m.tipo === 'Traslado') { r[m.cuenta] -= m.valor; if (!(m.cuentaDestino in r)) r[m.cuentaDestino] = 0; r[m.cuentaDestino] += m.valor; }
  });
  return r;
}
const abonado = orden => vivos().filter(m => m.tipo === 'Ingreso' && String(m.orden || '') === String(orden)).reduce((a, m) => a + m.valor, 0);
const saldoTrabajo = t => (t.valor || 0) - abonado(t.orden);
function estadoTrabajo(t) {
  const e = t.etapas || {};
  if (e['Entregado']) return 'Entregado';
  if (e['Terminado']) return 'Terminado';
  if (Object.values(e).some(Boolean)) return 'En proceso';
  return 'Recibido';
}
function etapaActual(t) { const e = t.etapas || {}; let last = null; cfg().etapas.forEach(x => { if (e[x]) last = x; }); return last; }
function estadoFijo(f, mes) {
  const pagado = vivos().filter(m => m.tipo === 'Egreso' && m.categoria === f.concepto && mesCont(m) === mes).reduce((a, m) => a + m.valor, 0);
  const limite = `${mes}-${pad(Math.min(f.dia || 1, daysInMonth(mes)))}`;
  let est;
  if (!f.activo) est = 'Inactivo';
  else if (pagado > 0) est = pagado >= (f.valor || 0) ? 'Pagado' : 'Parcial';
  else if (hoy() > limite) est = 'Vencido';
  else { const diff = (new Date(limite) - new Date(hoy())) / 864e5; est = diff <= (cfg().diasAviso || 5) ? 'Por vencer' : 'Pendiente'; }
  return { pagado, limite, est };
}
function repartoSocios(meses) {
  let util = 0; meses.forEach(m => util += totalesMes(m).util);
  return cfg().socios.map(s => {
    const corresponde = util * (Number(s.pct) || 0) / totalPartes();
    const ret = vivos().filter(m => m.categoria === 'Retiro de socio' && m.socio === s.email && meses.includes(mesCont(m))).reduce((a, m) => a + m.valor, 0);
    const apo = vivos().filter(m => m.categoria === 'Aporte de socio' && m.socio === s.email && meses.includes(mesCont(m))).reduce((a, m) => a + m.valor, 0);
    return { ...s, corresponde, retirado: ret, aportado: apo, saldo: corresponde - ret + apo };
  }).concat([{ _util: util }]);
}

// ------------------------------------------------------------------ store
const store = await createStore({
  onAuth: u => { S.user = u; S.tab = 'inicio'; vistosIds.movs = vistosIds.trabajos = null; if (!u) { S.cfgLoaded = false; } render(); },
  onConfig: c => {
    S.cfgLoaded = true;
    if (c) {
      S.cfg = { ...DEFAULT_CFG, ...c };
      // Migración: pasar del reparto 33/33/33 a las partes reales (10,2 · 25 · 25)
      if (!c.repartoV2 && esAdmin()) {
        const partes = Object.fromEntries(DEFAULT_CFG.socios.map(s => [s.email, s.pct]));
        store.setConfig({ ...c, socios: (c.socios || DEFAULT_CFG.socios).map(s => ({ ...s, pct: partes[s.email] ?? s.pct })), repartoV2: true });
      } else if (!c.ntfyTopic && esAdmin()) {
        store.setConfig({ ...c, ntfyTopic: nuevoCanal() });
      }
    }
    else { S.cfg = null; if (esAdmin()) store.setConfig(DEFAULT_CFG); }
    render();
  },
  onMovs: (m, pend) => { detectarNovedades('movs', m); S.movs = m; S.pending = pend; render(); },
  onTrabajos: t => { detectarNovedades('trabajos', t); S.trabajos = t; render(); },
  onError: e => toast(traducirError(e), true)
});
function traducirError(e) {
  const c = (e && e.code) || '';
  if (c.includes('permission-denied')) return 'Sin permiso: su correo no está autorizado en las reglas de Firebase.';
  if (c.includes('invalid-credential') || c.includes('wrong-password') || c.includes('user-not-found')) return 'Correo o contraseña incorrectos.';
  if (c.includes('too-many-requests')) return 'Demasiados intentos. Espere unos minutos.';
  if (c.includes('network')) return 'Sin conexión. Los datos se guardan y se suben al volver internet.';
  return (e && e.message) || 'Ocurrió un error.';
}

// ------------------------------------------------------------------ render raíz
const app = $('#app');
function render() {
  if (!S.user) { app.innerHTML = loginView(); return; }
  if (!SOCIOS.some(s => s.email.toLowerCase() === S.user.email)) {
    app.innerHTML = `<div class="login">${brandMark('big')}<h1>Correo no autorizado</h1>
      <p class="muted">${esc(S.user.email)} no está en la lista de socios (config.js y firestore.rules).</p>
      <button class="btn btn-light btn-block" data-a="salir">Cerrar sesión</button></div>`;
    return;
  }
  const scroll = window.scrollY;
  app.innerHTML = `
    ${headerView()}
    <main class="view">${({ inicio: inicioView, movs: movsView, trabajos: trabajosView, socios: sociosView, mas: masView }[S.tab])()}</main>
    ${esAdmin() ? `<button class="fab" data-a="nuevoMov" aria-label="Registrar movimiento"><span>+</span></button>` : ''}
    ${navView()}`;
  window.scrollTo(0, scroll);
}

function loginView() {
  return `<div class="login">
    ${brandMark('big')}
    <h1>Finanzas del laboratorio</h1>
    <p class="muted">Ingreso para socios</p>
    ${DEMO ? `
      <div class="demo-badge">MODO DEMO · los datos quedan solo en este navegador</div>
      <p class="muted small">Elija con qué socio entrar:</p>
      ${SOCIOS.map(s => `<button class="btn btn-block ${s.rol === 'admin' ? 'btn-primary' : 'btn-light'}" data-a="demoLogin" data-email="${esc(s.email.toLowerCase())}">
        ${esc(s.nombre)} <small>· ${s.rol === 'admin' ? 'registra' : 'consulta'}</small></button>`).join('')}
    ` : `
      <form id="loginForm" class="card form">
        <label>Correo<input type="email" name="email" autocomplete="username" required></label>
        <label>Contraseña<input type="password" name="pass" autocomplete="current-password" required></label>
        <button class="btn btn-primary btn-block" type="submit">Entrar</button>
        <button class="link" type="button" data-a="olvide">Olvidé mi contraseña</button>
      </form>`}
  </div>`;
}

function headerView() {
  const conMes = ['inicio', 'movs', 'socios', 'mas'].includes(S.tab);
  return `<header class="top">
    <div class="top-row">
      ${brandMark()}
      <button class="user-chip" data-a="tab" data-tab="mas" title="Cuenta">
        <span class="avatar">${esc(primerNombre(S.user.email).charAt(0))}</span>${esc(primerNombre(S.user.email))}
        ${S.pending ? '<span class="sync" title="Pendiente de subir">●</span>' : ''}
      </button>
    </div>
    ${conMes ? `<div class="mes-row">
      <button class="icon-btn" data-a="mes" data-k="-1" aria-label="Mes anterior">‹</button>
      <label class="mes-label">${esc(nomMes(S.mes))}<input type="month" id="mesPick" value="${S.mes}"></label>
      <button class="icon-btn" data-a="mes" data-k="1" aria-label="Mes siguiente">›</button>
    </div>` : ''}
    ${DEMO ? '<div class="demo-strip">MODO DEMO</div>' : ''}
  </header>`;
}

function navView() {
  const items = [['inicio', 'Inicio', '<path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>'],
    ['movs', 'Movimientos', '<path d="M7 7h13M7 7l3-3M7 7l3 3M17 17H4m13 0l-3-3m3 3l-3 3"/>'],
    ['trabajos', 'Trabajos', '<path d="M7 3c-2.5 0-4 2-4 4.5 0 2 1 3.5 1.5 6S5 21 7 21s2-4 3-6c.4-.8 1.6-.8 2 0 1 2 1 6 3 6s2-4.5 2.5-7S21 9.5 21 7.5C21 5 19.5 3 17 3c-2 0-3 1-5 1S9 3 7 3z"/>'],
    ['socios', 'Socios', '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.5 3.4-5.5 6.5-5.5s5.7 2 6.5 5.5"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14.6c2.6-.3 4.8 1.4 5.5 4.4"/>'],
    ['mas', 'Más', '<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>']];
  return `<nav class="bottom">${items.map(([k, l, ic]) => `<button class="${S.tab === k ? 'on' : ''}" data-a="tab" data-tab="${k}">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ic}</svg><span>${l}</span></button>`).join('')}</nav>`;
}

// ------------------------------------------------------------------ vistas
function movRow(m, showDate = false) {
  const sign = m.tipo === 'Ingreso' ? '+' : m.tipo === 'Egreso' ? '−' : '⇄';
  const cls = m.tipo === 'Ingreso' ? 'in' : m.tipo === 'Egreso' ? 'out' : 'tr';
  const sub = [m.tipo === 'Traslado' ? `${m.cuenta} → ${m.cuentaDestino}` : m.cuenta, m.orden ? `Orden ${m.orden}` : '', m.socio ? primerNombre(m.socio) : '', showDate ? fCorta(m.fecha) : ''].filter(Boolean).join(' · ');
  return `<button class="row ${m.anulado ? 'anulado' : ''}" data-a="verMov" data-id="${m.id}">
    <span class="dot ${cls}">${sign}</span>
    <span class="row-main"><b>${esc(m.descripcion || m.categoria)}</b><small>${esc(m.categoria)}${sub ? ' · ' + esc(sub) : ''}</small></span>
    <span class="amt ${cls}">${m.tipo === 'Egreso' ? '−' : ''}${money(m.valor)}</span></button>`;
}
const estadoChip = e => `<span class="chip st-${e.replace(/\s/g, '').toLowerCase()}">${esc(e)}</span>`;

function inicioView() {
  const t = totalesMes(S.mes), sal = saldos(), totalSal = Object.values(sal).reduce((a, b) => a + b, 0);
  const deHoy = vivos().filter(m => m.fecha === hoy()).sort((a, b) => (b.creadoMs || 0) - (a.creadoMs || 0));
  const inHoy = deHoy.filter(m => m.tipo === 'Ingreso').reduce((a, m) => a + m.valor, 0);
  const outHoy = deHoy.filter(m => m.tipo === 'Egreso').reduce((a, m) => a + m.valor, 0);
  const fijos = cfg().fijos.filter(f => f.activo).map(f => ({ f, ...estadoFijo(f, S.mes) })).filter(x => x.est !== 'Pagado');
  const cartera = S.trabajos.map(tr => ({ tr, s: saldoTrabajo(tr) })).filter(x => x.s > 0).sort((a, b) => b.s - a.s);
  const totCart = cartera.reduce((a, x) => a + x.s, 0);
  const max = Math.max(t.ing, t.egr, 1);
  const yo = socioDe(S.user.email);
  const avisoCopia = esAdmin() && ultimaCopia() !== hoy() && S.movs.length;
  const nov = novedades();
  return `
    ${nov.length ? `<div class="nov-banner"><span>🔔 <b>${nov.length} ${nov.length === 1 ? 'novedad' : 'novedades'} desde tu última visita</b><small>${esc(nov.slice(0, 2).map(n => n.txt).join(' · '))}${nov.length > 2 ? '…' : ''}</small></span><button class="btn-mini" data-a="verNovedades">Ver</button></div>` : ''}
    ${!esAdmin() && permisoAvisos() === 'default' ? `<div class="nov-banner soft"><span>🔔 <b>¿Avisarte de cada movimiento?</b><small>Te llega una notificación cuando se registre algo</small></span><button class="btn-mini" data-a="activarAvisos">Activar</button></div>` : ''}
    ${avisoCopia ? `<div class="backup-banner"><span>💾 <b>Copia de hoy pendiente</b><small>Última: ${ultimaCopia() ? fCorta(ultimaCopia()) + '/' + ultimaCopia().slice(0, 4) : 'nunca'}</small></span><button class="btn-mini" data-a="copia">Guardar</button></div>` : ''}
    <section class="hero">
      <small>Utilidad de ${esc(nomMes(S.mes))}</small>
      <div class="hero-num ${t.util < 0 ? 'neg' : ''}">${money(t.util)}</div>
      ${yo && yo.pct ? `<div class="hero-sub">Tu parte (${fPct(pctDe(yo))}): <b>${money(t.util * pctDe(yo) / 100)}</b></div>` : ''}
      <div class="bars">
        <div><span>Entró</span><i style="width:${t.ing / max * 100}%" class="b-in"></i><b>${money(t.ing)}</b></div>
        <div><span>Salió</span><i style="width:${t.egr / max * 100}%" class="b-out"></i><b>${money(t.egr)}</b></div>
      </div>
    </section>

    <h2 class="sec">Dinero disponible <span class="muted">${money(totalSal)}</span></h2>
    <div class="cuentas">${Object.entries(sal).map(([c, v]) => `<div class="cuenta"><small>${esc(c)}</small><b class="${v < 0 ? 'neg' : ''}">${money(v)}</b></div>`).join('')}</div>
    ${Object.values(sal).some(v => v < 0) && esAdmin() ? `<p class="hint">Si una cuenta sale negativa, registre el saldo con que arrancó en <a href="#" data-a="tab" data-tab="mas">Más → Saldos iniciales</a>.</p>` : ''}

    <h2 class="sec">Hoy <span class="muted">${fDia(hoy())}</span></h2>
    <div class="card list">
      ${deHoy.length ? `<div class="today-sum"><span class="in">+${money(inHoy)}</span><span class="out">−${money(outHoy)}</span></div>${deHoy.map(m => movRow(m)).join('')}`
        : `<p class="empty">Aún no hay movimientos hoy.${esAdmin() ? ' Pulse <b>+</b> para registrar.' : ''}</p>`}
    </div>

    <h2 class="sec">Pendientes de ${esc(MESES[+S.mes.slice(5) - 1])}</h2>
    <div class="card list">
      ${fijos.length ? fijos.map(x => `<button class="row" data-a="pagarFijo" data-c="${esc(x.f.concepto)}">
        <span class="row-main"><b>${esc(x.f.concepto)}</b><small>Vence ${fCorta(x.limite)}${x.f.valor ? ' · ' + money(x.f.valor) : ''}${x.pagado ? ' · pagado ' + money(x.pagado) : ''}</small></span>
        ${estadoChip(x.est)}</button>`).join('') : `<p class="empty ok">✓ Todos los pagos fijos del mes están al día.</p>`}
    </div>

    <h2 class="sec">Por cobrar <span class="muted">${money(totCart)}</span></h2>
    <div class="card list">
      ${cartera.length ? cartera.slice(0, 5).map(x => `<button class="row" data-a="verTrabajo" data-id="${x.tr.id}">
        <span class="row-main"><b>${esc(x.tr.paciente || 'Orden ' + x.tr.orden)}</b><small>${esc(x.tr.odontologo)} · ${esc(x.tr.tipo)}</small></span>
        <span class="amt warn">${money(x.s)}</span></button>`).join('') : `<p class="empty ok">✓ No hay saldos por cobrar.</p>`}
      ${cartera.length > 5 ? `<button class="more" data-a="tab" data-tab="trabajos">Ver los ${cartera.length}</button>` : ''}
    </div>`;
}

function movsView() {
  const q = S.buscaMov.toLowerCase();
  let list = S.movs.filter(m => (m.fecha || '').slice(0, 7) === S.mes || mesCont(m) === S.mes);
  if (S.filtroMov !== 'Todos') list = list.filter(m => m.tipo === S.filtroMov.replace(/s$/, '').replace('Ingreso', 'Ingreso'));
  if (q) list = list.filter(m => [m.descripcion, m.categoria, m.orden, m.tercero, m.cuenta].join(' ').toLowerCase().includes(q));
  list.sort((a, b) => (b.fecha || '').localeCompare(a.fecha || '') || (b.creadoMs || 0) - (a.creadoMs || 0));
  const byDay = {}; list.forEach(m => (byDay[m.fecha] = byDay[m.fecha] || []).push(m));
  const t = totalesMes(S.mes);
  return `
    <div class="kpis3"><div><small>Entradas</small><b class="in">${money(t.ing)}</b></div><div><small>Salidas</small><b class="out">${money(t.egr)}</b></div><div><small>Resultado</small><b class="${t.util < 0 ? 'neg' : ''}">${money(t.util)}</b></div></div>
    <input class="search" id="buscaMov" placeholder="Buscar descripción, orden, odontólogo…" value="${esc(S.buscaMov)}">
    <div class="chips">${['Todos', 'Ingresos', 'Egresos', 'Traslados'].map(x => `<button class="fchip ${S.filtroMov === x ? 'on' : ''}" data-a="filtroMov" data-v="${x}">${x}</button>`).join('')}</div>
    ${Object.keys(byDay).length ? Object.entries(byDay).map(([d, ms]) => {
      const net = ms.filter(m => !m.anulado).reduce((a, m) => a + (m.tipo === 'Ingreso' ? m.valor : m.tipo === 'Egreso' ? -m.valor : 0), 0);
      return `<h3 class="day">${fDia(d)}<span class="${net < 0 ? 'out' : 'in'}">${net < 0 ? '−' : '+'}${money(Math.abs(net))}</span></h3><div class="card list">${ms.map(m => movRow(m)).join('')}</div>`;
    }).join('') : `<p class="empty">No hay movimientos en ${esc(nomMes(S.mes))}.</p>`}`;
}

function trabajosView() {
  const q = S.buscaTra.toLowerCase();
  let list = S.trabajos.map(t => ({ t, est: estadoTrabajo(t), s: saldoTrabajo(t) }));
  const f = S.filtroTra;
  if (f === 'Activos') list = list.filter(x => x.est !== 'Entregado');
  if (f === 'Por cobrar') list = list.filter(x => x.s > 0);
  if (f === 'Entregados') list = list.filter(x => x.est === 'Entregado');
  if (q) list = list.filter(x => [x.t.orden, x.t.paciente, x.t.odontologo, x.t.tipo].join(' ').toLowerCase().includes(q));
  list.sort((a, b) => (b.t.fecha || '').localeCompare(a.t.fecha || ''));
  return `
    ${esAdmin() ? `<button class="btn btn-teal btn-block" data-a="nuevoTrabajo">＋ Nuevo trabajo</button>` : ''}
    <input class="search" id="buscaTra" placeholder="Buscar orden, paciente, odontólogo…" value="${esc(S.buscaTra)}">
    <div class="chips">${['Activos', 'Por cobrar', 'Entregados', 'Todos'].map(x => `<button class="fchip ${f === x ? 'on' : ''}" data-a="filtroTra" data-v="${x}">${x}</button>`).join('')}</div>
    ${list.length ? list.map(({ t, est, s }) => {
      const n = cfg().etapas.filter(e => (t.etapas || {})[e]).length;
      return `<button class="tcard" data-a="verTrabajo" data-id="${t.id}">
        <div class="tcard-top"><b>${esc(t.paciente || '(sin paciente)')}</b>${estadoChip(est)}</div>
        <small>Orden ${esc(t.orden)} · ${esc(t.odontologo)} · ${esc(t.tipo)}</small>
        <div class="progress"><i style="width:${n / cfg().etapas.length * 100}%"></i></div>
        <div class="tcard-bot"><span>${etapaActual(t) ? esc(etapaActual(t)) : 'Recibido ' + fCorta(t.fecha)}</span>
          <span>${t.valor ? (s > 0 ? `<b class="warn">Debe ${money(s)}</b>` : `<b class="in">Pagado</b>`) : '<span class="muted">Sin valor</span>'}</span></div>
      </button>`;
    }).join('') : `<p class="empty">No hay trabajos con este filtro.</p>`}`;
}

function sociosView() {
  const meses = S.socAnual ? Array.from({ length: +S.mes.slice(5) }, (_, i) => `${S.mes.slice(0, 4)}-${pad(i + 1)}`) : [S.mes];
  const rep = repartoSocios(meses), util = rep.pop()._util;
  return `
    <div class="seg"><button class="${!S.socAnual ? 'on' : ''}" data-a="socAnual" data-v="0">Este mes</button><button class="${S.socAnual ? 'on' : ''}" data-a="socAnual" data-v="1">Año ${S.mes.slice(0, 4)} acumulado</button></div>
    <section class="hero small"><small>Utilidad a repartir · ${S.socAnual ? 'ene – ' + MESES[+S.mes.slice(5) - 1] + ' ' + S.mes.slice(0, 4) : esc(nomMes(S.mes))}</small>
      <div class="hero-num ${util < 0 ? 'neg' : ''}">${money(util)}</div>
      <div class="hero-sub">Ingresos − gastos del laboratorio. No incluye retiros ni aportes de socios.</div></section>
    ${rep.map(s => `<div class="socio ${s.email === S.user.email ? 'yo' : ''}">
      <div class="socio-top"><span class="avatar big">${esc(s.nombre.charAt(0))}</span><div><b>${esc(s.nombre)}</b>${s.email === S.user.email ? ' <span class="chip st-pagado">Tú</span>' : ''}<small>${fPct(pctDe(s))} · ${fNum(s.pct)} de ${fNum(totalPartes())} partes</small></div></div>
      <div class="socio-grid">
        <div><small>Le corresponde</small><b class="${s.corresponde < 0 ? 'neg' : ''}">${money(s.corresponde)}</b></div>
        <div><small>Ya retiró</small><b>${money(s.retirado)}</b></div>
        <div><small>${s.saldo >= 0 ? 'Por entregarle' : 'Retiró de más'}</small><b class="${s.saldo < 0 ? 'neg' : 'in'}">${money(Math.abs(s.saldo))}</b></div>
      </div>
      ${s.aportado ? `<small class="muted">Aportes al laboratorio en el periodo: ${money(s.aportado)}</small>` : ''}
    </div>`).join('')}
    ${esAdmin() ? `<button class="btn btn-light btn-block" data-a="retiro">Registrar retiro o aporte de un socio</button>` : ''}
    <p class="hint">Cada vez que un socio saca dinero para él, regístrelo como <b>Retiro de socio</b>: no cuenta como gasto del laboratorio y se descuenta de su parte.</p>`;
}

function masView() {
  const fijos = cfg().fijos.map(f => ({ f, ...estadoFijo(f, S.mes) }));
  const totRef = cfg().fijos.filter(f => f.activo).reduce((a, f) => a + (f.valor || 0), 0);
  const totPag = fijos.reduce((a, x) => a + x.pagado, 0);
  return `
    <h2 class="sec">Pagos fijos · ${esc(nomMes(S.mes))} <span class="muted">${money(totPag)} / ${money(totRef)}</span></h2>
    <div class="card list">${fijos.filter(x => x.f.activo).map(x => `<button class="row" data-a="pagarFijo" data-c="${esc(x.f.concepto)}">
      <span class="row-main"><b>${esc(x.f.concepto)}</b><small>Día ${x.f.dia} · ref. ${x.f.valor ? money(x.f.valor) : '—'}${x.pagado ? ' · pagado ' + money(x.pagado) : ''}</small></span>${estadoChip(x.est)}</button>`).join('')}</div>

    <h2 class="sec">Avisos</h2>
    <div class="card list">
      <button class="row" data-a="activarAvisos"><span class="row-main"><b>Avisos en este celular</b><small>${({ granted: '✓ Activados: llegan mientras la app esté abierta o reciente', denied: 'Bloqueados: actívelos en Ajustes del celular → Apps → Dental Family → Notificaciones', default: 'Toque para activarlos', none: 'Este navegador no permite avisos' })[permisoAvisos()]}</small></span><span class="go">›</span></button>
      <button class="row" data-a="ntfyInfo"><span class="row-main"><b>Avisos con la app cerrada (ntfy)</b><small>${cfg().ntfyTopic ? 'Canal: ' + esc(cfg().ntfyTopic) : 'Se crea al abrir la app Adiela'}${cfg().ntfyOff ? ' · apagado' : ''}</small></span><span class="go">›</span></button>
    </div>

    <h2 class="sec">Copia de seguridad</h2>
    <div class="card list">
      <button class="row" data-a="copia"><span class="row-main"><b>Guardar copia en Descargas</b><small>Última copia en este celular: ${ultimaCopia() ? fCorta(ultimaCopia()) + '/' + ultimaCopia().slice(0, 4) : 'nunca'}</small></span><span class="go">›</span></button>
      ${esAdmin() ? `<button class="row" data-a="restaurar"><span class="row-main"><b>Restaurar desde una copia</b><small>Recupera lo que falte a partir de un archivo DentalFamily_copia_….json</small></span><span class="go">›</span></button>` : ''}
    </div>

    <h2 class="sec">Informes</h2>
    <div class="card list">
      <button class="row" data-a="exportar"><span class="row-main"><b>Descargar en Excel</b><small>Movimientos y trabajos, con las columnas del libro de Excel</small></span><span class="go">›</span></button>
      <button class="row" data-a="resumenMes"><span class="row-main"><b>Resumen de ${esc(nomMes(S.mes))}</b><small>Gastos por categoría</small></span><span class="go">›</span></button>
    </div>

    ${esAdmin() ? `<h2 class="sec">Ajustes (solo ${esc(primerNombre(S.user.email))})</h2>
    <div class="card list">
      <button class="row" data-a="cfgPct"><span class="row-main"><b>Reparto entre socios</b><small>${cfg().socios.map(s => primerNombre(s.email) + ' ' + fNum(s.pct)).join(' · ')} partes</small></span><span class="go">›</span></button>
      <button class="row" data-a="cfgSaldos"><span class="row-main"><b>Saldos iniciales</b><small>Dinero con que arrancó cada cuenta</small></span><span class="go">›</span></button>
      <button class="row" data-a="cfgFijos"><span class="row-main"><b>Pagos fijos</b><small>Valor de referencia y día de pago</small></span><span class="go">›</span></button>
      <button class="row" data-a="cfgListas"><span class="row-main"><b>Listas</b><small>Odontólogos, tipos de trabajo, cuentas</small></span><span class="go">›</span></button>
      ${!cfg().reiniciado ? `<button class="row" data-a="reiniciar"><span class="row-main"><b class="out">Empezar de cero con los datos del Excel</b><small>Borra todas las pruebas y deja solo lo que había en el Excel. Se usa una sola vez.</small></span><span class="go">›</span></button>` : ''}
      <button class="row" data-a="importar"><span class="row-main"><b>Importar desde el Excel</b><small>Trae MOVIMIENTOS y TRABAJOS de Dental_Family_Control.xlsx</small></span><span class="go">›</span></button>
    </div>` : ''}

    <h2 class="sec">Cuenta</h2>
    <div class="card list">
      <div class="row static"><span class="row-main"><b>${esc(nombreDe(S.user.email))}</b><small>${esc(S.user.email)} · ${esAdmin() ? 'registra y edita' : 'solo consulta'}</small></span></div>
      ${DEMO ? `<button class="row" data-a="resetDemo"><span class="row-main"><b>Reiniciar datos de demostración</b></span></button>` : ''}
      <button class="row" data-a="salir"><span class="row-main"><b class="out">Cerrar sesión</b></span></button>
    </div>
    <p class="hint center">Dental Family Center · ${DEMO ? 'modo demo' : 'datos en línea (Firebase)'}</p>`;
}

// ------------------------------------------------------------------ hoja inferior
let sheetState = null;
function openSheet(title, body, onMount) {
  const prev = $('#sheet'); if (prev) prev.remove();
  const el = document.createElement('div');
  el.className = 'sheet-wrap'; el.id = 'sheet';
  el.innerHTML = `<div class="sheet" role="dialog" aria-label="${esc(title)}"><div class="sheet-head"><b>${esc(title)}</b><button class="icon-btn" data-a="close" aria-label="Cerrar">✕</button></div><div class="sheet-body">${body}</div></div>`;
  document.body.appendChild(el); document.body.classList.add('noscroll');
  el.addEventListener('click', e => { if (e.target === el) closeSheet(); });
  onMount && onMount(el);
}
function closeSheet() { const s = $('#sheet'); if (s) s.remove(); document.body.classList.remove('noscroll'); sheetState = null; }
function setSheetBody(html) { const b = $('#sheet .sheet-body'); if (b) b.innerHTML = html; }

// ---- formulario de movimiento
function movForm(f) {
  const c = cfg();
  const cats = c.categorias.filter(x => x.tipo === f.tipo);
  const cat = c.categorias.find(x => x.nombre === f.categoria);
  const esTrabajo = ['Pago de trabajo', 'Abono a trabajo'].includes(f.categoria);
  const esSocio = cat && cat.grupo === 'Socios';
  const esFijo = cat && cat.grupo === 'Fijo';
  const tr = esTrabajo && f.orden ? S.trabajos.find(t => String(t.orden) === String(f.orden)) : null;
  const grupos = {}; cats.forEach(x => (grupos[x.grupo] = grupos[x.grupo] || []).push(x.nombre));
  return `
    <div class="seg big3">
      <button class="${f.tipo === 'Ingreso' ? 'on in' : ''}" data-set="tipo" data-v="Ingreso">↓ Entró dinero</button>
      <button class="${f.tipo === 'Egreso' ? 'on out' : ''}" data-set="tipo" data-v="Egreso">↑ Salió dinero</button>
      <button class="${f.tipo === 'Traslado' ? 'on tr' : ''}" data-set="tipo" data-v="Traslado">⇄ Mover</button>
    </div>
    <label class="money-in"><span>$</span><input id="fValor" inputmode="numeric" placeholder="0" value="${fmtNum(f.valor)}" autocomplete="off"></label>
    ${f.tipo === 'Traslado' ? `
      <p class="lbl">Sale de</p><div class="chips wrap">${c.cuentas.map(x => `<button class="fchip ${f.cuenta === x ? 'on' : ''}" data-set="cuenta" data-v="${esc(x)}">${esc(x)}</button>`).join('')}</div>
      <p class="lbl">Entra a</p><div class="chips wrap">${c.cuentas.map(x => `<button class="fchip ${f.cuentaDestino === x ? 'on' : ''}" data-set="cuentaDestino" data-v="${esc(x)}">${esc(x)}</button>`).join('')}</div>
      <p class="hint">Ej.: consignar en el banco el efectivo de la caja. No cambia la utilidad.</p>
    ` : `
      <p class="lbl">¿Por qué concepto?</p>
      ${Object.entries(grupos).map(([g, ns]) => `<small class="grp">${esc(g === 'Ingreso' ? 'Trabajos' : g)}</small><div class="chips wrap">${ns.map(n => `<button class="fchip ${f.categoria === n ? 'on' : ''}" data-set="categoria" data-v="${esc(n)}">${esc(n)}</button>`).join('')}</div>`).join('')}
      ${esTrabajo ? `<label class="fl">Nº de orden<input id="fOrden" list="ordenes" value="${esc(f.orden || '')}" placeholder="Escriba o elija"></label>
        <datalist id="ordenes">${S.trabajos.filter(t => saldoTrabajo(t) > 0 || String(t.orden) === String(f.orden)).map(t => `<option value="${esc(t.orden)}">${esc(t.paciente)} · ${esc(t.odontologo)} · debe ${money(saldoTrabajo(t))}</option>`).join('')}</datalist>
        ${tr ? `<div class="info">${esc(tr.paciente || '')} · ${esc(tr.tipo)} · <b>debe ${money(saldoTrabajo(tr))}</b> ${saldoTrabajo(tr) > 0 ? `<button class="link" data-a="valorSaldo">usar este valor</button>` : ''}</div>` : f.orden ? `<div class="info warn">Esa orden no está en Trabajos.</div>` : ''}` : ''}
      ${esSocio ? `<p class="lbl">¿Qué socio?</p><div class="chips wrap">${c.socios.map(s => `<button class="fchip ${f.socio === s.email ? 'on' : ''}" data-set="socio" data-v="${esc(s.email)}">${esc(s.nombre)}</button>`).join('')}</div>` : ''}
      <p class="lbl">${f.tipo === 'Ingreso' ? '¿Dónde entró?' : '¿De dónde salió?'}</p>
      <div class="chips wrap">${c.cuentas.map(x => `<button class="fchip ${f.cuenta === x ? 'on' : ''}" data-set="cuenta" data-v="${esc(x)}">${esc(x)}</button>`).join('')}</div>
    `}
    <label class="fl">Descripción<input id="fDesc" value="${esc(f.descripcion || '')}" placeholder="${f.tipo === 'Egreso' ? 'Ej.: compra de porcelana Ivoclar' : 'Ej.: pago corona paciente…'}"></label>
    <div class="two">
      <label class="fl">Fecha<input id="fFecha" type="date" value="${esc(f.fecha)}"></label>
      ${f.tipo !== 'Traslado' ? `<label class="fl">${f.tipo === 'Ingreso' ? 'Odontólogo' : 'Proveedor'}<input id="fTercero" list="terceros" value="${esc(f.tercero || '')}"></label>
        <datalist id="terceros">${(f.tipo === 'Ingreso' ? c.odontologos : []).map(o => `<option value="${esc(o)}">`).join('')}</datalist>` : ''}
    </div>
    ${esFijo ? `<label class="fl">Mes que se paga<input id="fPeriodo" type="month" value="${esc(f.periodo || S.mes)}"></label>` : ''}
    <button class="btn btn-primary btn-block btn-lg" data-a="guardarMov">${f.id ? 'Guardar cambios' : 'Guardar'}</button>
    ${f.id ? `<button class="btn btn-light btn-block" data-a="anularMov">${f.anulado ? 'Restaurar movimiento' : 'Anular movimiento'}</button>` : ''}`;
}
function readMovInputs() {
  const f = sheetState; if (!f) return;
  const g = id => { const el = document.getElementById(id); return el ? el.value : undefined; };
  if (g('fValor') !== undefined) f.valor = num(g('fValor'));
  ['descripcion:fDesc', 'fecha:fFecha', 'tercero:fTercero', 'orden:fOrden', 'periodo:fPeriodo'].forEach(p => { const [k, id] = p.split(':'); const v = g(id); if (v !== undefined) f[k] = v.trim(); });
}
function openMov(init = {}) {
  sheetState = { tipo: 'Egreso', cuenta: cfg().cuentas[0], fecha: hoy(), valor: 0, ...init };
  openSheet(init.id ? 'Editar movimiento' : 'Registrar movimiento', movForm(sheetState), el => { const v = el.querySelector('#fValor'); if (v && !init.valor) setTimeout(() => v.focus(), 150); });
}
function guardarMov() {
  readMovInputs(); const f = sheetState, c = cfg();
  if (!f.valor || f.valor <= 0) return toast('Escriba el valor.', true);
  if (f.tipo === 'Traslado') {
    if (!f.cuenta || !f.cuentaDestino || f.cuenta === f.cuentaDestino) return toast('Elija cuentas de origen y destino distintas.', true);
    f.categoria = 'Traslado'; f.grupo = 'Traslado';
  } else {
    if (!f.categoria) return toast('Elija el concepto.', true);
    const cat = c.categorias.find(x => x.nombre === f.categoria);
    f.grupo = cat ? cat.grupo : (f.tipo === 'Ingreso' ? 'Ingreso' : 'Otros egresos');
    if (['Pago de trabajo', 'Abono a trabajo'].includes(f.categoria) && !f.orden) return toast('Escriba el Nº de orden del trabajo.', true);
    if (f.grupo === 'Socios' && !f.socio) return toast('Elija el socio.', true);
    if (!f.cuenta) return toast('Elija la cuenta.', true);
  }
  const doc = { fecha: f.fecha || hoy(), tipo: f.tipo, categoria: f.categoria, grupo: f.grupo, descripcion: f.descripcion || '', valor: f.valor, cuenta: f.cuenta };
  if (f.tipo === 'Traslado') doc.cuentaDestino = f.cuentaDestino;
  if (f.orden && ['Pago de trabajo', 'Abono a trabajo'].includes(f.categoria)) doc.orden = String(f.orden);
  if (f.tercero) doc.tercero = f.tercero;
  if (f.grupo === 'Socios') doc.socio = f.socio;
  if (f.grupo === 'Fijo' && f.periodo) doc.periodo = f.periodo;
  if (f.id) { store.update('movimientos', f.id, { ...doc, editadoPor: S.user.email, editadoMs: Date.now() }); toast('Cambios guardados'); avisar('✏️ Movimiento corregido', textoMov(doc)); }
  else { store.add('movimientos', { ...doc, creadoPor: S.user.email, creadoMs: Date.now() }); avisar(tituloMov(doc), textoMov(doc)); toast(`${f.tipo === 'Ingreso' ? 'Entrada' : f.tipo === 'Egreso' ? 'Salida' : 'Traslado'} de ${money(f.valor)} guardada`); }
  closeSheet();
}

function verMov(id) {
  const m = S.movs.find(x => x.id === id); if (!m) return;
  if (esAdmin()) return openMov({ ...m });
  openSheet('Detalle del movimiento', `
    <div class="detail">
      <div class="amt-big ${m.tipo === 'Ingreso' ? 'in' : m.tipo === 'Egreso' ? 'out' : ''}">${m.tipo === 'Egreso' ? '−' : ''}${money(m.valor)}</div>
      ${m.anulado ? '<p class="chip st-vencido">Anulado</p>' : ''}
      <dl>
        <dt>Concepto</dt><dd>${esc(m.categoria)}</dd>
        <dt>Descripción</dt><dd>${esc(m.descripcion || '—')}</dd>
        <dt>Fecha</dt><dd>${fDia(m.fecha)}</dd>
        <dt>Cuenta</dt><dd>${esc(m.tipo === 'Traslado' ? m.cuenta + ' → ' + m.cuentaDestino : m.cuenta)}</dd>
        ${m.orden ? `<dt>Orden</dt><dd>${esc(m.orden)}</dd>` : ''}
        ${m.tercero ? `<dt>Tercero</dt><dd>${esc(m.tercero)}</dd>` : ''}
        ${m.socio ? `<dt>Socio</dt><dd>${esc(nombreDe(m.socio))}</dd>` : ''}
        <dt>Registró</dt><dd>${esc(nombreDe(m.creadoPor))}${m.creadoMs ? ' · ' + new Date(m.creadoMs).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' }) : ''}</dd>
      </dl></div>`);
}

// ---- trabajos
function trabajoForm(t) {
  const c = cfg();
  return `
    <div class="two"><label class="fl">Nº de orden<input id="tOrden" value="${esc(t.orden || '')}" placeholder="Automático"></label>
      <label class="fl">Fecha ingreso<input id="tFecha" type="date" value="${esc(t.fecha || hoy())}"></label></div>
    <label class="fl">Paciente<input id="tPaciente" value="${esc(t.paciente || '')}"></label>
    <label class="fl">Odontólogo<input id="tOdont" list="odl" value="${esc(t.odontologo || '')}"></label>
    <datalist id="odl">${c.odontologos.map(o => `<option value="${esc(o)}">`).join('')}</datalist>
    <label class="fl">Tipo de trabajo<input id="tTipo" list="tpl" value="${esc(t.tipo || '')}"></label>
    <datalist id="tpl">${c.tiposTrabajo.map(o => `<option value="${esc(o)}">`).join('')}</datalist>
    <div class="two"><label class="fl">Valor del trabajo<input id="tValor" inputmode="numeric" value="${fmtNum(t.valor)}"></label>
      <label class="fl">Maquinado<input id="tMaq" inputmode="numeric" value="${fmtNum(t.maquinado)}"></label></div>
    ${!t.id ? `<div class="two"><label class="fl">Abono inicial<input id="tAbono" inputmode="numeric" placeholder="Opcional"></label>
      <label class="fl">Recibido en<select id="tCuenta">${c.cuentas.map(x => `<option>${esc(x)}</option>`).join('')}</select></label></div>` : ''}
    <label class="fl">Observaciones<input id="tObs" value="${esc(t.obs || '')}"></label>
    <button class="btn btn-teal btn-block btn-lg" data-a="guardarTrabajo">${t.id ? 'Guardar cambios' : 'Guardar trabajo'}</button>
    ${t.id ? `<button class="btn btn-light btn-block" data-a="borrarTrabajo">Eliminar trabajo</button>` : ''}`;
}
function guardarTrabajo() {
  const t = sheetState, g = id => (document.getElementById(id) || {}).value;
  let orden = (g('tOrden') || '').trim();
  if (!g('tPaciente').trim() && !orden) return toast('Escriba el paciente o el Nº de orden.', true);
  if (!orden) { let n = 1; while (S.trabajos.some(x => x.orden === `DF-${String(n).padStart(4, '0')}`)) n++; orden = `DF-${String(n).padStart(4, '0')}`; }
  if (S.trabajos.some(x => String(x.orden) === orden && x.id !== t.id)) return toast(`La orden ${orden} ya existe.`, true);
  const doc = { orden, fecha: g('tFecha') || hoy(), paciente: g('tPaciente').trim(), odontologo: g('tOdont').trim(), tipo: g('tTipo').trim(),
    valor: num(g('tValor')), maquinado: num(g('tMaq')), obs: g('tObs').trim() };
  if (t.id) { store.update('trabajos', t.id, doc); toast('Trabajo actualizado'); avisar('✏️ Trabajo actualizado', `Orden ${doc.orden} · ${doc.paciente} · ${doc.tipo}`); }
  else {
    store.add('trabajos', { ...doc, etapas: {}, creadoPor: S.user.email, creadoMs: Date.now() });
    avisar('🦷 Nuevo trabajo', `Orden ${orden} · ${doc.paciente} · ${doc.odontologo} · ${doc.tipo}${doc.valor ? ' · ' + money(doc.valor) : ''}`);
    const ab = num(g('tAbono'));
    if (ab > 0) store.add('movimientos', { fecha: doc.fecha, tipo: 'Ingreso', categoria: 'Abono a trabajo', grupo: 'Ingreso', descripcion: `Abono inicial – ${doc.paciente}`,
      valor: ab, cuenta: g('tCuenta'), orden, tercero: doc.odontologo, creadoPor: S.user.email, creadoMs: Date.now() });
    toast(`Trabajo guardado · orden ${orden}`);
  }
  closeSheet();
}
function verTrabajo(id) {
  const t = S.trabajos.find(x => x.id === id); if (!t) return;
  const abonos = vivos().filter(m => m.tipo === 'Ingreso' && String(m.orden || '') === String(t.orden)).sort((a, b) => (a.fecha || '').localeCompare(b.fecha || ''));
  const s = saldoTrabajo(t), e = t.etapas || {}, c = cfg();
  const next = c.etapas.find(x => !e[x]);
  const gastos = (t.valor || 0) * (c.pctGastos || 0) / 100;
  sheetState = { ...t };
  openSheet(`Orden ${t.orden}`, `
    <div class="detail">
      <h3 class="dtitle">${esc(t.paciente || '(sin paciente)')}</h3>
      <p class="muted">${esc(t.odontologo)} · ${esc(t.tipo)} · recibido ${fCorta(t.fecha)}</p>
      <div class="kpis3"><div><small>Valor</small><b>${money(t.valor)}</b></div><div><small>Abonado</small><b class="in">${money(abonos.reduce((a, m) => a + m.valor, 0))}</b></div><div><small>Saldo</small><b class="${s > 0 ? 'warn' : 'in'}">${money(Math.max(s, 0))}</b></div></div>
      ${t.valor ? `<p class="muted small">Gastos de laboratorio (${c.pctGastos}%): ${money(gastos)} · Valor a liquidar: ${money(t.valor - gastos)}</p>` : ''}
      <p class="lbl">Etapas</p>
      <ol class="steps">${c.etapas.map(x => `<li class="${e[x] ? 'done' : x === next ? 'next' : ''}"><span></span>${esc(x)}<small>${e[x] ? fCorta(e[x]) : ''}</small></li>`).join('')}</ol>
      ${abonos.length ? `<p class="lbl">Pagos recibidos</p><div class="card list">${abonos.map(m => movRow(m, true)).join('')}</div>` : ''}
      ${t.obs ? `<p class="muted small">📝 ${esc(t.obs)}</p>` : ''}
      ${esAdmin() ? `
        ${next ? `<button class="btn btn-teal btn-block" data-a="etapa" data-e="${esc(next)}">Marcar «${esc(next)}» hoy</button>` : ''}
        ${s > 0 ? `<button class="btn btn-primary btn-block" data-a="abonar">Registrar pago o abono</button>` : ''}
        <button class="btn btn-light btn-block" data-a="editarTrabajo">Editar datos</button>` : ''}
    </div>`);
}

// ---- configuración
function cfgSheet(kind) {
  const c = cfg();
  if (kind === 'pct') openSheet('Reparto entre socios', `
    <p class="hint">Escriba las <b>partes</b> de cada socio. La ganancia se divide entre el total de partes y se multiplica por las de cada uno (ej.: 25 + 25 + 10,2 = 60,2).</p>
    ${c.socios.map((s, i) => `<label class="fl">${esc(s.nombre)} · partes<input class="cfgPct" data-i="${i}" inputmode="decimal" value="${fNum(s.pct)}"></label>`).join('')}
    <p class="hint" id="pctSum"></p>
    <button class="btn btn-primary btn-block" data-a="saveCfg" data-k="pct">Guardar</button>`);
  if (kind === 'saldos') openSheet('Saldos iniciales', `
    <p class="hint">Dinero que había en cada cuenta antes del primer movimiento registrado.</p>
    ${c.cuentas.map(x => `<label class="fl">${esc(x)}<input class="cfgSal" data-c="${esc(x)}" inputmode="numeric" value="${fmtNum(num(c.saldosIniciales[x]))}"></label>`).join('')}
    <button class="btn btn-primary btn-block" data-a="saveCfg" data-k="saldos">Guardar</button>`);
  if (kind === 'fijos') openSheet('Pagos fijos', `
    ${c.fijos.map((f, i) => `<div class="fijo-ed"><b>${esc(f.concepto)}</b>
      <div class="three"><label class="fl">Día<input class="cfgFD" data-i="${i}" inputmode="numeric" value="${f.dia}"></label>
      <label class="fl">Valor ref.<input class="cfgFV" data-i="${i}" inputmode="numeric" value="${fmtNum(f.valor)}"></label>
      <label class="fl chk"><input type="checkbox" class="cfgFA" data-i="${i}" ${f.activo ? 'checked' : ''}> Activo</label></div></div>`).join('')}
    <label class="fl">Nuevo pago fijo (nombre)<input id="cfgFNew" placeholder="Ej.: Plan de celular"></label>
    <button class="btn btn-primary btn-block" data-a="saveCfg" data-k="fijos">Guardar</button>`);
  if (kind === 'listas') openSheet('Listas', `
    <label class="fl">Odontólogos (uno por línea)<textarea id="cfgOd" rows="5">${esc(c.odontologos.join('\n'))}</textarea></label>
    <label class="fl">Tipos de trabajo<textarea id="cfgTp" rows="6">${esc(c.tiposTrabajo.join('\n'))}</textarea></label>
    <label class="fl">Cuentas de dinero<textarea id="cfgCu" rows="3">${esc(c.cuentas.join('\n'))}</textarea></label>
    <label class="fl">Conceptos de gasto de material (uno por línea)<textarea id="cfgMat" rows="6">${esc(c.categorias.filter(x => x.grupo === 'Material / operativo').map(x => x.nombre).join('\n'))}</textarea></label>
    <label class="fl">% gastos de laboratorio sobre el valor del trabajo<input id="cfgPG" inputmode="decimal" value="${c.pctGastos}"></label>
    <button class="btn btn-primary btn-block" data-a="saveCfg" data-k="listas">Guardar</button>`);
}
function saveCfg(k) {
  const c = JSON.parse(JSON.stringify(cfg()));
  const lines = id => document.getElementById(id).value.split('\n').map(s => s.trim()).filter(Boolean);
  if (k === 'pct') {
    document.querySelectorAll('.cfgPct').forEach(el => c.socios[+el.dataset.i].pct = Number(el.value.replace(/\./g, '').replace(',', '.')) || 0);
    const sum = c.socios.reduce((a, s) => a + s.pct, 0);
    if (sum <= 0) return toast('Escriba las partes de cada socio.', true);
    c.repartoV2 = true;
  }
  if (k === 'saldos') { c.saldosIniciales = {}; document.querySelectorAll('.cfgSal').forEach(el => c.saldosIniciales[el.dataset.c] = num(el.value)); }
  if (k === 'fijos') {
    document.querySelectorAll('.cfgFD').forEach(el => c.fijos[+el.dataset.i].dia = Math.min(31, Math.max(1, num(el.value) || 1)));
    document.querySelectorAll('.cfgFV').forEach(el => c.fijos[+el.dataset.i].valor = num(el.value));
    document.querySelectorAll('.cfgFA').forEach(el => c.fijos[+el.dataset.i].activo = el.checked);
    const nuevo = document.getElementById('cfgFNew').value.trim();
    if (nuevo) { c.fijos.push({ concepto: nuevo, dia: 15, valor: 0, activo: true }); if (!c.categorias.some(x => x.nombre === nuevo)) c.categorias.splice(c.categorias.findIndex(x => x.nombre === 'Otro gasto'), 0, { nombre: nuevo, tipo: 'Egreso', grupo: 'Fijo' }); }
    c.fijos.forEach(f => { if (!c.categorias.some(x => x.nombre === f.concepto)) c.categorias.push({ nombre: f.concepto, tipo: 'Egreso', grupo: 'Fijo' }); });
  }
  if (k === 'listas') {
    c.odontologos = lines('cfgOd'); c.tiposTrabajo = lines('cfgTp');
    const cu = lines('cfgCu'); if (cu.length) c.cuentas = cu;
    const mats = lines('cfgMat');
    const idx = c.categorias.findIndex(x => x.grupo === 'Material / operativo');
    c.categorias = c.categorias.filter(x => x.grupo !== 'Material / operativo');
    c.categorias.splice(idx < 0 ? c.categorias.length : idx, 0, ...mats.map(n => ({ nombre: n, tipo: 'Egreso', grupo: 'Material / operativo' })));
    c.pctGastos = Number(document.getElementById('cfgPG').value.replace(',', '.')) || 0;
  }
  store.setConfig(c); toast('Ajustes guardados'); closeSheet();
}

// ---- resumen por categoría
function resumenMes() {
  const t = totalesMes(S.mes), by = {};
  vivos().filter(m => operativo(m) && m.tipo === 'Egreso' && mesCont(m) === S.mes).forEach(m => by[m.categoria] = (by[m.categoria] || 0) + m.valor);
  const rows = Object.entries(by).sort((a, b) => b[1] - a[1]), max = rows.length ? rows[0][1] : 1;
  openSheet(`Resumen de ${nomMes(S.mes)}`, `
    <div class="kpis3"><div><small>Entradas</small><b class="in">${money(t.ing)}</b></div><div><small>Salidas</small><b class="out">${money(t.egr)}</b></div><div><small>Utilidad</small><b class="${t.util < 0 ? 'neg' : ''}">${money(t.util)}</b></div></div>
    <p class="lbl">¿En qué se fue el dinero?</p>
    ${rows.length ? rows.map(([k, v]) => `<div class="hbar"><span>${esc(k)}</span><i style="width:${v / max * 100}%"></i><b>${money(v)}</b></div>`).join('') : '<p class="empty">Sin gastos este mes.</p>'}
    <p class="muted small">Materiales: ${money(t.mat)} · Fijos: ${money(t.fij)} · Otros: ${money(t.otr)}</p>`);
}

// ---- Excel (SheetJS desde CDN)
let xlsxP = null;
function loadXLSX() {
  if (window.XLSX) return Promise.resolve(window.XLSX);
  return xlsxP = xlsxP || new Promise((ok, ko) => {
    const s = document.createElement('script'); s.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
    s.onload = () => ok(window.XLSX); s.onerror = () => { xlsxP = null; ko(new Error('No se pudo cargar el módulo de Excel. Revise la conexión.')); };
    document.head.appendChild(s);
  });
}
async function exportar() {
  try {
    const X = await loadXLSX();
    const toDate = f => { if (!f) return ''; const [y, m, d] = f.split('-'); return new Date(+y, +m - 1, +d); };
    const movs = S.movs.slice().sort((a, b) => (a.fecha || '').localeCompare(b.fecha || '') || (a.creadoMs || 0) - (b.creadoMs || 0));
    const mv = [['ID', 'Fecha', 'Tipo', 'Categoría', 'Grupo', 'Descripción', 'Nº orden', 'Tercero (odontólogo / proveedor)', 'Medio de pago', 'Valor', 'Periodo (opcional)', 'Socio', 'Cuenta destino', 'Registrado por', 'Anulado']]
      .concat(movs.map((m, i) => [i + 1, toDate(m.fecha), m.tipo, m.categoria, m.grupo, m.descripcion, m.orden || '', m.tercero || '', m.cuenta, m.valor, m.periodo ? toDate(m.periodo + '-01') : '', m.socio ? nombreDe(m.socio) : '', m.cuentaDestino || '', nombreDe(m.creadoPor), m.anulado ? 'Sí' : '']));
    const et = cfg().etapas;
    const tr = [['Nº orden', 'Fecha ingreso', 'Paciente', 'Odontólogo', 'Tipo de trabajo', ...et, 'Valor', 'Maquinado', 'Abonado', 'Saldo', 'Estado', 'Observaciones']]
      .concat(S.trabajos.map(t => [t.orden, toDate(t.fecha), t.paciente, t.odontologo, t.tipo, ...et.map(e => toDate((t.etapas || {})[e])), t.valor || 0, t.maquinado || 0, abonado(t.orden), saldoTrabajo(t), estadoTrabajo(t), t.obs || '']));
    const wb = X.utils.book_new();
    const ws1 = X.utils.aoa_to_sheet(mv, { cellDates: true }); ws1['!cols'] = [6, 12, 10, 24, 18, 40, 10, 24, 16, 12, 12, 18, 16, 18, 8].map(w => ({ wch: w }));
    const ws2 = X.utils.aoa_to_sheet(tr, { cellDates: true }); ws2['!cols'] = [10, 12, 22, 18, 26, ...et.map(() => 11), 12, 12, 12, 12, 12, 40].map(w => ({ wch: w }));
    X.utils.book_append_sheet(wb, ws1, 'MOVIMIENTOS'); X.utils.book_append_sheet(wb, ws2, 'TRABAJOS');
    X.writeFile(wb, `DentalFamily_${hoy()}.xlsx`, { cellDates: true });
  } catch (e) { toast(e.message, true); }
}
async function importar(file) {
  try {
    const X = await loadXLSX();
    const wb = X.read(await file.arrayBuffer(), { cellDates: true });
    const iso = d => d instanceof Date ? new Date(d.getTime() + 12 * 3600e3).toISOString().slice(0, 10) : (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}/.test(d) ? d.slice(0, 10) : '');
    const cuentaDe = medio => { const m = String(medio || '').toLowerCase(); const c = cfg().cuentas; if (m.includes('efect')) return c.find(x => /efect|caja/i.test(x)) || c[0]; const hit = c.find(x => x.toLowerCase() === m); return hit || c.find(x => /banco/i.test(x)) || c[c.length - 1]; };
    const out = { movimientos: [], trabajos: [] };
    const wm = wb.Sheets['MOVIMIENTOS'];
    if (wm) X.utils.sheet_to_json(wm, { header: 1, range: 4, raw: true, defval: '' }).forEach(r => {
      const fecha = iso(r[1]), tipo = r[2], valor = num(r[9]);
      if (!fecha || !['Ingreso', 'Egreso'].includes(tipo) || !valor) return;
      const cat = cfg().categorias.find(x => x.nombre === r[3]);
      const m = { fecha, tipo, categoria: r[3] || (tipo === 'Ingreso' ? 'Otro ingreso' : 'Otro gasto'), grupo: cat ? cat.grupo : (tipo === 'Ingreso' ? 'Ingreso' : 'Otros egresos'),
        descripcion: String(r[5] || ''), valor, cuenta: cuentaDe(r[8]), creadoPor: S.user.email, creadoMs: Date.now() + out.movimientos.length, importado: true };
      if (r[6] !== '') m.orden = String(r[6]); if (r[7]) m.tercero = String(r[7]); const p = iso(r[10]); if (p) m.periodo = p.slice(0, 7);
      out.movimientos.push(m);
    });
    const wt = wb.Sheets['TRABAJOS'];
    if (wt) X.utils.sheet_to_json(wt, { header: 1, range: 4, raw: true, defval: '' }).forEach(r => {
      if (r[0] === '' || S.trabajos.some(t => String(t.orden) === String(r[0]))) return;
      const etapas = {}; cfg().etapas.forEach((e, i) => { const d = iso(r[5 + i]); if (d) etapas[e] = d; });
      out.trabajos.push({ orden: String(r[0]), fecha: iso(r[1]) || hoy(), paciente: String(r[2] || ''), odontologo: String(r[3] || ''), tipo: String(r[4] || ''), etapas,
        valor: num(r[11]), maquinado: num(r[12]), obs: String(r[20] || ''), creadoPor: S.user.email, creadoMs: Date.now(), importado: true });
    });
    if (!out.movimientos.length && !out.trabajos.length) return toast('No encontré datos en las hojas MOVIMIENTOS / TRABAJOS.', true);
    const dup = S.movs.filter(m => m.importado).length;
    if (!confirm(`Se importarán ${out.movimientos.length} movimientos y ${out.trabajos.length} trabajos.${dup ? `\n\nATENCIÓN: ya hay ${dup} movimientos importados antes; se duplicarían.` : ''}\n\n¿Continuar?`)) return;
    await store.batchAdd('movimientos', out.movimientos); await store.batchAdd('trabajos', out.trabajos);
    toast('Importación terminada'); closeSheet();
  } catch (e) { toast(e.message || 'No se pudo leer el archivo.', true); }
}

// ---- copia de seguridad (JSON en Descargas)
const BK = 'df-ultima-copia';
const ultimaCopia = () => { try { return localStorage.getItem(BK) || ''; } catch (e) { return ''; } };
function descargarCopia() {
  const limpio = o => JSON.parse(JSON.stringify(o, (k, v) => (v && typeof v === 'object' && 'seconds' in v && 'nanoseconds' in v) ? undefined : v));
  const data = { app: 'DentalFamily', version: 1, fecha: new Date().toISOString(), por: S.user.email,
    config: S.cfg ? limpio(S.cfg) : null, movimientos: limpio(S.movs), trabajos: limpio(S.trabajos) };
  const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `DentalFamily_copia_${hoy()}.json`;
  document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
  try { localStorage.setItem(BK, hoy()); } catch (e) {}
  toast(`Copia guardada en Descargas (${S.movs.length} movimientos, ${S.trabajos.length} trabajos)`); render();
}
async function restaurarCopia(file) {
  try {
    const data = JSON.parse(await file.text());
    if (data.app !== 'DentalFamily' || !Array.isArray(data.movimientos)) return toast('Ese archivo no es una copia de Dental Family.', true);
    const ids = new Set(S.movs.map(m => m.id)), idsT = new Set(S.trabajos.map(t => t.id));
    const nm = data.movimientos.filter(m => m.id && !ids.has(m.id)), nt = (data.trabajos || []).filter(t => t.id && !idsT.has(t.id));
    const sinCfg = !S.cfg && data.config;
    if (!nm.length && !nt.length && !sinCfg) return toast('La app ya tiene toda la información de esa copia.');
    if (!confirm(`Copia del ${new Date(data.fecha).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' })}.\n\nSe recuperarán ${nm.length} movimientos y ${nt.length} trabajos que faltan.${sinCfg ? ' También los ajustes.' : ''} Lo que ya está en la app no se toca.\n\n¿Continuar?`)) return;
    if (sinCfg) store.setConfig(data.config);
    await store.batchSet('movimientos', nm); await store.batchSet('trabajos', nt);
    toast('Información restaurada'); closeSheet();
  } catch (e) { toast('No se pudo leer la copia: ' + (e.message || e), true); }
}


// ------------------------------------------------------------------ avisos
const nuevoCanal = () => 'dentalfamily-' + Array.from(crypto.getRandomValues(new Uint8Array(9)), b => 'abcdefghijkmnpqrstuvwxyz23456789'[b % 32]).join('');
const tituloMov = m => m.tipo === 'Ingreso' ? `💰 Entró ${money(m.valor)}` : m.tipo === 'Egreso' ? (m.categoria === 'Retiro de socio' ? `👤 Retiro de ${money(m.valor)}` : `💸 Salió ${money(m.valor)}`) : `⇄ Traslado de ${money(m.valor)}`;
const textoMov = m => [m.categoria, m.descripcion, m.tipo === 'Traslado' ? `${m.cuenta} → ${m.cuentaDestino}` : m.cuenta, m.orden ? 'Orden ' + m.orden : '', m.socio ? nombreDe(m.socio) : ''].filter(Boolean).join(' · ');

// ntfy: avisos push aunque la app esté cerrada (gratis, sin cuenta)
const NQ = 'df-ntfy-cola';
function avisar(title, message, forzar = false) {
  const c = cfg(); if (!c.ntfyTopic || (c.ntfyOff && !forzar) || DEMO) return;
  const item = { topic: c.ntfyTopic, title, message: `${message}\n— ${primerNombre(S.user.email)}, ${new Date().toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })}`, tags: ['tooth'], click: location.href.split('#')[0] };
  let q = []; try { q = JSON.parse(localStorage.getItem(NQ) || '[]'); } catch (e) {}
  q.push(item); try { localStorage.setItem(NQ, JSON.stringify(q.slice(-50))); } catch (e) {}
  enviarCola();
}
let enviando = false;
async function enviarCola() {
  if (enviando) return; enviando = true;
  try {
    let q = []; try { q = JSON.parse(localStorage.getItem(NQ) || '[]'); } catch (e) {}
    while (q.length) {
      const r = await fetch('https://ntfy.sh/', { method: 'POST', body: JSON.stringify(q[0]) });
      if (!r.ok) break;
      q.shift(); try { localStorage.setItem(NQ, JSON.stringify(q)); } catch (e) {}
    }
  } catch (e) { /* sin internet: se reintenta al volver la conexión */ }
  enviando = false;
}
window.addEventListener('online', enviarCola);
setTimeout(enviarCola, 3000);

function ntfyHTML() {
  const t = cfg().ntfyTopic || '(se crea cuando Adiela abra la app)';
  return `
    <p>Con la app gratuita <b>ntfy</b> llega una notificación al instante cada vez que ${esc(primerNombre(SOCIOS.find(s => s.rol === 'admin').email))} registra algo, <b>aunque la app esté cerrada</b>.</p>
    <p class="lbl">Instalarlo (una sola vez por celular)</p>
    <ol class="pasos">
      <li>En Play Store busque e instale <b>ntfy</b> (icono verde con una campana).</li>
      <li>Ábrala y toque el botón <b>+</b>.</li>
      <li>En «Topic name» pegue el nombre del canal de abajo y toque <b>Subscribe</b>.</li>
      <li>Si Android pregunta por notificaciones, toque <b>Permitir</b>.</li>
    </ol>
    <div class="canal"><code>${esc(t)}</code><button class="btn-mini" data-a="ntfyCopiar">Copiar</button></div>
    <p class="hint">Mantenga este nombre en familia: quien lo conozca podría ver los avisos.</p>
    <button class="btn btn-teal btn-block" data-a="ntfyProbar">Enviar aviso de prueba</button>
    ${esAdmin() ? `<button class="btn btn-light btn-block" data-a="ntfyToggle">${cfg().ntfyOff ? 'Encender avisos ntfy' : 'Apagar avisos ntfy'}</button>
      <button class="btn btn-light btn-block" data-a="ntfyNuevo">Crear canal nuevo</button>` : ''}`;
}

// Avisos dentro de la app (sin instalar nada)
const LS_VISTO = () => 'df-visto-' + (S.user ? S.user.email : '');
const getVisto = () => { try { return Number(localStorage.getItem(LS_VISTO())) || 0; } catch (e) { return 0; } };
function marcarVisto() { try { localStorage.setItem(LS_VISTO(), String(Date.now())); } catch (e) {} }
const permisoAvisos = () => ('Notification' in window) ? Notification.permission : 'none';
function novedades() {
  if (!S.user) return [];
  const v = getVisto(); if (!v) { marcarVisto(); return []; }
  const me = S.user.email, out = [];
  S.movs.forEach(m => {
    const t = Math.max(m.creadoMs || 0, m.editadoMs || 0), por = m.editadoMs > (m.creadoMs || 0) ? m.editadoPor : m.creadoPor;
    if (t > v && por !== me) out.push({ t, txt: `${m.tipo === 'Ingreso' ? '+' : m.tipo === 'Egreso' ? '−' : '⇄'}${money(m.valor)} ${m.categoria}` });
  });
  S.trabajos.forEach(tr => {
    const t = Math.max(tr.creadoMs || 0, tr.editadoMs || 0), por = tr.editadoMs > (tr.creadoMs || 0) ? tr.editadoPor : tr.creadoPor;
    if (t > v && por !== me) out.push({ t, txt: `Orden ${tr.orden}` });
  });
  return out.sort((a, b) => b.t - a.t);
}
const vistosIds = { movs: null, trabajos: null };
function detectarNovedades(tipo, docs) {
  if (!S.user) return;
  const prev = vistosIds[tipo];
  vistosIds[tipo] = new Map(docs.map(d => [d.id, Math.max(d.creadoMs || 0, d.editadoMs || 0)]));
  if (!prev) return; // primera carga
  const me = S.user.email;
  docs.forEach(d => {
    const t = Math.max(d.creadoMs || 0, d.editadoMs || 0);
    if (prev.has(d.id) && prev.get(d.id) === t) return;
    const por = d.editadoMs > (d.creadoMs || 0) ? d.editadoPor : d.creadoPor;
    if (!por || por === me) return;
    const nuevo = !prev.has(d.id);
    const title = tipo === 'movs' ? (nuevo ? tituloMov(d) : (d.anulado ? '🚫 Movimiento anulado' : '✏️ Movimiento corregido')) : (nuevo ? '🦷 Nuevo trabajo' : '🦷 Trabajo actualizado');
    const body = tipo === 'movs' ? textoMov(d) : `Orden ${d.orden} · ${d.paciente || ''} · ${d.tipo || ''}`;
    toast(`${title} · ${primerNombre(por)}`);
    notificar(title, `${body} — ${primerNombre(por)}`);
  });
}
async function notificar(title, body) {
  if (permisoAvisos() !== 'granted') return;
  try {
    const reg = navigator.serviceWorker && await navigator.serviceWorker.getRegistration();
    const opt = { body, icon: './icon-192.png', badge: './icon-192.png', tag: 'df-' + Date.now(), vibrate: [120, 60, 120] };
    if (reg) await reg.showNotification(title, opt); else new Notification(title, opt);
  } catch (e) {}
}

// ------------------------------------------------------------------ toast
let toastT;
function toast(msg, bad = false) {
  let t = $('#toast'); if (!t) { t = document.createElement('div'); t.id = 'toast'; document.body.appendChild(t); }
  t.textContent = msg; t.className = 'show' + (bad ? ' bad' : '');
  clearTimeout(toastT); toastT = setTimeout(() => t.className = '', 3200);
}

// ------------------------------------------------------------------ eventos
document.addEventListener('click', e => {
  const set = e.target.closest('[data-set]');
  if (set && sheetState) {
    readMovInputs();
    const k = set.dataset.set, v = set.dataset.v;
    if (k === 'tipo' && sheetState.tipo !== v) { sheetState.categoria = ''; sheetState.socio = ''; sheetState.orden = ''; }
    sheetState[k] = (k !== 'tipo' && sheetState[k] === v) ? '' : v;
    if (k === 'categoria' && !sheetState.descripcion && v === 'Retiro de socio') sheetState.descripcion = 'Retiro de utilidades';
    setSheetBody(movForm(sheetState)); return;
  }
  const a = e.target.closest('[data-a]'); if (!a) return;
  const act = a.dataset.a;
  if (a.tagName === 'A') e.preventDefault();
  const A = {
    demoLogin: () => store.login(a.dataset.email),
    olvide: () => { const em = (document.querySelector('#loginForm [name=email]') || {}).value; if (!em) return toast('Escriba su correo primero.', true); store.reset(em).then(() => toast('Le enviamos un correo para cambiar la contraseña.')).catch(er => toast(traducirError(er), true)); },
    tab: () => { S.tab = a.dataset.tab; closeSheet(); render(); window.scrollTo(0, 0); },
    mes: () => { S.mes = addMes(S.mes, +a.dataset.k); render(); },
    filtroMov: () => { S.filtroMov = a.dataset.v; render(); },
    filtroTra: () => { S.filtroTra = a.dataset.v; render(); },
    socAnual: () => { S.socAnual = a.dataset.v === '1'; render(); },
    close: closeSheet,
    nuevoMov: () => openMov(),
    verMov: () => verMov(a.dataset.id),
    guardarMov,
    anularMov: () => { const f = sheetState; if (!confirm(f.anulado ? '¿Restaurar este movimiento?' : '¿Anular este movimiento? Dejará de contar en los totales.')) return; store.update('movimientos', f.id, { anulado: !f.anulado, editadoPor: S.user.email, editadoMs: Date.now() }); avisar(f.anulado ? '↩️ Movimiento restaurado' : '🚫 Movimiento anulado', textoMov(f)); toast(f.anulado ? 'Restaurado' : 'Movimiento anulado'); closeSheet(); },
    valorSaldo: () => { readMovInputs(); const tr = S.trabajos.find(t => String(t.orden) === String(sheetState.orden)); if (tr) { sheetState.valor = saldoTrabajo(tr); sheetState.categoria = sheetState.valor >= tr.valor ? 'Pago de trabajo' : sheetState.categoria; } setSheetBody(movForm(sheetState)); },
    nuevoTrabajo: () => { sheetState = {}; openSheet('Nuevo trabajo', trabajoForm({})); },
    verTrabajo: () => verTrabajo(a.dataset.id),
    editarTrabajo: () => { openSheet(`Editar orden ${sheetState.orden}`, trabajoForm(sheetState)); },
    guardarTrabajo,
    borrarTrabajo: () => { if (confirm('¿Eliminar este trabajo? Los pagos registrados no se borran.')) { store.remove('trabajos', sheetState.id); toast('Trabajo eliminado'); closeSheet(); } },
    etapa: () => { const t = sheetState; store.update('trabajos', t.id, { etapas: { ...(t.etapas || {}), [a.dataset.e]: hoy() }, editadoPor: S.user.email, editadoMs: Date.now() }); avisar(`🦷 ${a.dataset.e}`, `Orden ${t.orden} · ${t.paciente || ''} · ${t.tipo}`); toast(`${a.dataset.e} · registrado`); closeSheet(); },
    abonar: () => { const t = sheetState, s = saldoTrabajo(t); openMov({ tipo: 'Ingreso', categoria: s >= t.valor ? 'Pago de trabajo' : 'Abono a trabajo', orden: String(t.orden), tercero: t.odontologo, descripcion: `${t.tipo} – ${t.paciente}`.trim() }); },
    pagarFijo: () => { if (!esAdmin()) return; const f = cfg().fijos.find(x => x.concepto === a.dataset.c); const st = estadoFijo(f, S.mes); openMov({ tipo: 'Egreso', categoria: f.concepto, valor: Math.max((f.valor || 0) - st.pagado, 0), periodo: S.mes, descripcion: `${f.concepto} ${nomMes(S.mes)}`, cuenta: cfg().cuentas.find(c => /banco/i.test(c)) || cfg().cuentas[0] }); },
    retiro: () => openMov({ tipo: 'Egreso', categoria: 'Retiro de socio', descripcion: 'Retiro de utilidades' }),
    exportar, resumenMes,
    copia: descargarCopia,
    verNovedades: () => { marcarVisto(); S.tab = 'movs'; render(); window.scrollTo(0, 0); },
    activarAvisos: async () => {
      if (!('Notification' in window)) return toast('Este celular no permite avisos desde aquí. Use ntfy.', true);
      const p = await Notification.requestPermission();
      if (p === 'granted') { toast('Avisos activados'); notificar('Dental Family', 'Así se verán los avisos de cada movimiento.'); }
      else toast('No se activaron. Puede hacerlo en Ajustes del celular → Apps → Dental Family → Notificaciones.', true);
      render();
    },
    ntfyInfo: () => { sheetState = null; openSheet('Avisos con la app cerrada', ntfyHTML()); },
    ntfyCopiar: () => { const t = cfg().ntfyTopic; (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(() => toast('Nombre del canal copiado')).catch(() => prompt('Copie el nombre del canal:', t)); },
    ntfyProbar: () => { avisar('🔔 Prueba de Dental Family', `Aviso de prueba enviado por ${primerNombre(S.user.email)}`, true); toast('Aviso de prueba enviado'); },
    ntfyToggle: () => { store.setConfig({ ...JSON.parse(JSON.stringify(cfg())), ntfyOff: !cfg().ntfyOff }); toast(cfg().ntfyOff ? 'Avisos ntfy encendidos' : 'Avisos ntfy apagados'); closeSheet(); },
    ntfyNuevo: () => { if (!confirm('Se creará un canal nuevo. Todos tendrán que suscribirse otra vez en ntfy. ¿Continuar?')) return; store.setConfig({ ...JSON.parse(JSON.stringify(cfg())), ntfyTopic: nuevoCanal() }); toast('Canal nuevo creado'); closeSheet(); },
    reiniciar: async () => {
      if (!confirm(`Se borrarán TODOS los registros actuales (${S.movs.length} movimientos y ${S.trabajos.length} trabajos) y quedarán solo los datos del Excel (10 movimientos y 6 trabajos de octubre).\n\nLos ajustes y el reparto entre socios se conservan.\n\n¿Continuar?`)) return;
      const ok = prompt('Para confirmar, escriba BORRAR');
      if ((ok || '').trim().toUpperCase() !== 'BORRAR') return toast('Cancelado. No se borró nada.');
      try {
        toast('Reiniciando…');
        await store.batchDelete('movimientos', S.movs.map(m => m.id));
        await store.batchDelete('trabajos', S.trabajos.map(t => t.id));
        const d = datosExcel(), now = Date.now();
        await store.batchSet('movimientos', d.movimientos.map((m, i) => ({ ...m, id: 'excel-m' + i, creadoPor: S.user.email, creadoMs: now + i })));
        await store.batchSet('trabajos', d.trabajos.map((t, i) => ({ ...t, id: 'excel-t' + i, creadoPor: S.user.email, creadoMs: now + i })));
        store.setConfig({ ...JSON.parse(JSON.stringify(cfg())), reiniciado: true });
        try { localStorage.removeItem(BK); } catch (e) {}
        toast('Listo: quedaron solo los datos del Excel');
      } catch (e) { toast(traducirError(e), true); }
    },
    restaurar: () => (sheetState = null, openSheet('Restaurar copia', `<p>Elija el archivo <b>DentalFamily_copia_AAAA-MM-DD.json</b> (está en la carpeta <b>Descargas</b> o donde lo haya guardado).</p>
      <p class="hint">Solo se agregan los registros que falten. Nada de lo que ya está se borra ni se duplica.</p>
      <input type="file" id="fileCopia" accept=".json,application/json" class="file">`)),
    importar: () => (sheetState = null, openSheet('Importar desde Excel', `<p>Elija el archivo <b>Dental_Family_Control.xlsx</b> (o .xlsm). Se leen las hojas MOVIMIENTOS y TRABAJOS.</p>
      <p class="hint">Hágalo una sola vez, al empezar. Los trabajos cuyo Nº de orden ya exista se omiten.</p>
      <input type="file" id="fileImp" accept=".xlsx,.xlsm,.xls" class="file">`)),
    cfgPct: () => cfgSheet('pct'), cfgSaldos: () => cfgSheet('saldos'), cfgFijos: () => cfgSheet('fijos'), cfgListas: () => cfgSheet('listas'),
    saveCfg: () => saveCfg(a.dataset.k),
    resetDemo: () => { if (confirm('¿Volver a los datos iniciales de demostración?')) store.resetDemo(); },
    salir: () => { if (confirm('¿Cerrar sesión?')) store.logout(); }
  };
  A[act] && A[act]();
});
document.addEventListener('input', e => {
  const id = e.target.id;
  if (['fValor', 'tValor', 'tMaq', 'tAbono'].includes(id) || e.target.classList.contains('cfgSal') || e.target.classList.contains('cfgFV')) {
    const v = num(e.target.value); e.target.value = fmtNum(v);
  }
  if (id === 'buscaMov' || id === 'buscaTra') {
    S[id] = e.target.value; const pos = e.target.selectionStart; render();
    const el = document.getElementById(id); el.focus(); el.setSelectionRange(pos, pos);
  }
  if (e.target.classList.contains('cfgPct')) {
    const els = [...document.querySelectorAll('.cfgPct')], vals = els.map(el => Number(el.value.replace(/\./g, '').replace(',', '.')) || 0), s = vals.reduce((a, b) => a + b, 0);
    $('#pctSum').innerHTML = s ? `Total: ${fNum(s)} partes → ` + cfg().socios.map((x, i) => `${esc(primerNombre(x.email))} ${fPct(vals[i] / s * 100)}`).join(' · ') : '';
  }
});
document.addEventListener('change', e => {
  if (e.target.id === 'mesPick' && e.target.value) { S.mes = e.target.value; render(); }
  if (e.target.id === 'fOrden') {
    readMovInputs(); const tr = S.trabajos.find(t => String(t.orden) === String(sheetState.orden));
    if (tr) { if (!sheetState.descripcion) sheetState.descripcion = `${tr.tipo} – ${tr.paciente}`.replace(/ – $/, ''); if (!sheetState.tercero) sheetState.tercero = tr.odontologo; }
    setSheetBody(movForm(sheetState));
  }
  if (e.target.id === 'fileImp' && e.target.files[0]) importar(e.target.files[0]);
  if (e.target.id === 'fileCopia' && e.target.files[0]) restaurarCopia(e.target.files[0]);
});
document.addEventListener('submit', e => {
  if (e.target.id === 'loginForm') {
    e.preventDefault(); const fd = new FormData(e.target);
    const b = e.target.querySelector('button[type=submit]'); b.disabled = true; b.textContent = 'Entrando…';
    store.login(fd.get('email'), fd.get('pass')).catch(er => { toast(traducirError(er), true); b.disabled = false; b.textContent = 'Entrar'; });
  }
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeSheet(); });

if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
render();
