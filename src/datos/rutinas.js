/*
 * FORJA 3.0 · Rutinas de fuerza, core y postura, y la escalera CaCo.
 *
 * Fuente: Source of Truth §6–§10 (fuerza), §14 (core), §15 (postura), y el
 * documento visual §17–§20 para descansos, superseries y objetivos.
 *
 * Ids de ejercicio ESTABLES (`rutina:clave`): el historial se indexa por
 * ellos. Renombrar el texto visible no rompe nada; cambiar una clave, sí.
 */

export const SECUENCIA = ["TORSO_A", "PIERNA_A", "TORSO_B", "PIERNA_B"];

const ej = (clave, nombre, series, reps, descansoSeg, nota = null, superserie = null) => ({
  clave, nombre, series, reps, rir: "1-2", descansoSeg, nota, superserie,
  repMin: Number(reps.split("-")[0]), repMax: Number(reps.split("-")[1]),
});

export const RUTINAS = {
  TORSO_A: {
    id: "TORSO_A",
    nombre: "TORSO A",
    corto: "Torso A",
    objetivo: "Dorsal / anchura + hombro lateral",
    musculos: "Dorsal · hombro lateral · pecho · brazos",
    duracion: "~60 min",
    ejercicios: [
      ej("jalon-pecho-prono", "Jalón al pecho prono", 3, "8-12", 120),
      ej("remo-sentado-bajo", "Remo sentado máquina agarre bajo", 3, "8-12", 120, "sesgo dorsal"),
      ej("elevaciones-laterales", "Elevaciones laterales", 4, "12-20", 75),
      ej("press-inclinado", "Press inclinado máquina", 3, "8-12", 150),
      ej("reverse-pec-deck", "Reverse pec deck", 2, "12-20", 75),
      ej("press-hombro", "Press hombro máquina", 2, "8-12", 120),
      ej("curl-biceps", "Curl bíceps", 2, "10-15", 90),
      ej("triceps-polea", "Tríceps polea", 2, "10-15", 90),
    ],
  },
  PIERNA_A: {
    id: "PIERNA_A",
    nombre: "PIERNA A",
    corto: "Pierna A",
    objetivo: "Cuádriceps + glúteo + femoral + pantorrilla",
    musculos: "Cuádriceps · glúteo · femoral · pantorrilla",
    duracion: "~55–65 min",
    ejercicios: [
      ej("hack-squat", "Hack squat", 3, "8-12", 150),
      ej("hip-thrust", "Hip thrust", 3, "8-12", 120),
      ej("prensa", "Prensa", 2, "10-15", 120),
      ej("curl-femoral-sentado", "Curl femoral sentado", 3, "10-15", 90),
      ej("extension-cuadriceps", "Extensión cuádriceps", 2, "10-15", 75, null, "A"),
      ej("elevaciones-laterales", "Elevaciones laterales", 2, "12-20", 75, null, "A"),
      ej("gemelo-de-pie", "Gemelo de pie", 2, "10-20", 60, null, "B"),
      ej("pullover", "Pullover", 2, "10-15", 60, null, "B"),
      ej("soleo-sentado", "Sóleo sentado", 2, "12-20", 60, null, "C"),
      ej("tibial-anterior", "Tibial anterior", 2, "15-20", 60, null, "C"),
    ],
  },
  TORSO_B: {
    id: "TORSO_B",
    nombre: "TORSO B",
    corto: "Torso B",
    objetivo: "Hombro + espalda alta + pecho",
    musculos: "Hombro · espalda alta · pecho · brazos",
    duracion: "~60 min",
    ejercicios: [
      ej("elevaciones-laterales", "Elevaciones laterales", 4, "12-20", 75),
      ej("remo-sentado-alto", "Remo sentado máquina agarre alto", 3, "8-12", 120, "espalda alta / deltoide posterior"),
      ej("jalon-neutro", "Jalón neutro/medio", 3, "8-12", 120),
      ej("press-plano", "Press plano máquina", 3, "8-12", 150),
      ej("reverse-pec-deck", "Reverse pec deck", 2, "12-20", 75),
      ej("pec-deck", "Pec deck", 2, "10-15", 90),
      ej("curl-biceps", "Curl bíceps", 2, "10-15", 90),
      ej("triceps-overhead", "Tríceps overhead cable", 2, "10-15", 90),
    ],
  },
  PIERNA_B: {
    id: "PIERNA_B",
    nombre: "PIERNA B",
    corto: "Pierna B",
    objetivo: "Glúteo + femoral + pierna posterior",
    musculos: "Glúteo · femoral · pierna posterior",
    duracion: "~55 min",
    ejercicios: [
      ej("hip-thrust", "Hip thrust", 3, "8-12", 120),
      ej("prensa-gluteo", "Prensa sesgo glúteo", 3, "8-12", 150),
      ej("curl-femoral", "Curl femoral", 3, "10-15", 90),
      ej("extension-lumbar-45", "Extensión lumbar 45° sesgo glúteo", 2, "10-15", 90),
      ej("abductora", "Abductora", 2, "15-25", 60, null, "A"),
      ej("elevaciones-laterales", "Elevaciones laterales", 2, "12-20", 60, null, "A"),
      ej("pullover", "Pullover", 2, "10-15", 75),
      ej("soleo-sentado", "Sóleo sentado", 2, "12-20", 60, null, "B"),
      ej("tibial-anterior", "Tibial anterior", 2, "15-20", 60, null, "B"),
    ],
  },
};

/** Id estable de un ejercicio dentro de su rutina. */
export function idEjercicio(rutinaId, clave) {
  return `${rutinaId}:${clave}`;
}

/** Series totales de una rutina (21 / 23 / 21 / 21). */
export function seriesTotales(rutinaId) {
  return RUTINAS[rutinaId].ejercicios.reduce((t, e) => t + e.series, 0);
}

/** Los mismos ejercicios aparecen en varias rutinas: para PROGRESO se agrupan por clave. */
export function nombrePorClave(clave) {
  for (const r of Object.values(RUTINAS)) {
    const e = r.ejercicios.find((x) => x.clave === clave);
    if (e) return e.nombre;
  }
  return clave;
}

/** §14 · Core, ~2 veces/semana. */
export const CORE = {
  id: "core",
  nombre: "Core",
  sub: "~2 veces/semana · 3 ejercicios",
  cue: "Sin fallo ni técnicas avanzadas. Calidad de cada repetición.",
  items: [
    { nombre: "Dead bug", pauta: "2×8–10/lado" },
    { nombre: "Plancha lateral", pauta: "2×20–30 s/lado" },
    { nombre: "Pallof press", pauta: "2×10–12/lado" },
  ],
};

/** §15 · Postura. No diagnostica nada. */
export const POSTURA = {
  id: "postura",
  nombre: "Postura",
  sub: "Control cervical · movilidad torácica · costillas sobre pelvis",
  cue: "Cue: Rodillas suaves → costillas sobre pelvis → cuello largo. Mini-reset 3–5 veces al día, 10–20 s.",
  items: [
    { nombre: "Pelvic tilt", pauta: "1×8" },
    { nombre: "Extensión torácica con foam roller", pauta: "1×8" },
    { nombre: "Chin tuck", pauta: "2×8 · 5 s" },
    { nombre: "Wall slide", pauta: "2×8–10" },
    { nombre: "Low cobra", pauta: "2×20–30 s" },
    { nombre: "Standing stack", pauta: "3×20 s" },
  ],
};

export const RUTINAS_CORTAS = { postura: POSTURA, core: CORE };

/*
 * PLAN DE RUNNING DEFINITIVO (Jose, 2026-09-05): 66 sesiones en cinco fases,
 * CaCo → 30 min continuos → 5K → 10K → 15K → 20K. Dos sesiones por semana,
 * nunca dos días seguidos, todo a RPE 3–4 pudiendo hablar. Sin sprints ni
 * HIIT. Si una sesión cuesta demasiado, se repite. Dolor amarillo: no se
 * avanza. Si perjudica Pierna A/B o la fuerza, se congela. 20 km sin fecha.
 *
 * S3 y S4 ya estaban hechas antes de la 3.0; la app arranca en S5.
 */

const RITMO_FACIL_MIN_KM = 7; // para estimar la duración de las sesiones por distancia

function caco(n, bloques, correr, andar) {
  return { n, fase: 1, tipo: "caco", codigo: `${bloques}×${correr}`, desc: `${bloques} bloques · ${correr} min correr / ${andar} min andar`, correrMin: bloques * correr, andarMin: bloques * andar, bloques, tramos: Array.from({ length: bloques }, () => correr), minEstimados: bloques * (correr + andar) };
}
function tramos(n, lista, andar = 2) {
  const correr = lista.reduce((a, b) => a + b, 0);
  const andarMin = andar * (lista.length - 1);
  return { n, fase: 1, tipo: "tramos", codigo: lista.join("+"), desc: lista.map((m) => `${m} min correr`).join(` · ${andar} andar · `), correrMin: correr, andarMin, bloques: lista.length, tramos: lista, minEstimados: correr + andarMin };
}
function tiempo(n, fase, min, minMax = null, nota = "") {
  const rango = minMax ? `${min}–${minMax}` : `${min}`;
  return { n, fase, tipo: "tiempo", codigo: `${rango} min`, desc: `${rango} min continuos fáciles${nota ? " · " + nota : ""}`, correrMin: min, andarMin: 0, bloques: 1, tramos: [min], minEstimados: minMax ? Math.round((min + minMax) / 2) : min };
}
function km(n, fase, km, kmMax = null, opciones = {}) {
  const rango = kmMax ? `${km}–${kmMax}` : `${km}`;
  const etiqueta = opciones.descarga ? " · descarga" : opciones.muyFacil ? " · muy fácil" : opciones.facil ? " · fácil" : "";
  const mid = kmMax ? (km + kmMax) / 2 : km;
  return { n, fase, tipo: "km", codigo: `${rango} km`, desc: `${rango} km a ritmo cómodo${etiqueta}`, km, kmMax, descarga: !!opciones.descarga, correrMin: Math.round(mid * RITMO_FACIL_MIN_KM), andarMin: 0, bloques: 1, tramos: [], minEstimados: Math.round(mid * RITMO_FACIL_MIN_KM) };
}

export const FASES_RUNNING = [
  { fase: 1, nombre: "CaCo hasta correr continuo", meta: "Correr 30 minutos seguidos pudiendo hablar." },
  { fase: 2, nombre: "Base de 5 km", meta: "5 km cómodos y sin dolor. No importa cuánto tardes." },
  { fase: 3, nombre: "De 5 a 10 km", meta: "10 km a ritmo cómodo, no una carrera a tope." },
  { fase: 4, nombre: "De 10 a 15 km", meta: "15 km con descargas: corazón y pulmones mejoran antes que tendones y tibias." },
  { fase: 5, nombre: "De 15 a 20 km", meta: "20 km. Sin fecha límite." },
];

const F = (n) => km(n, 3, 5, null, { facil: true });
const F56 = (n, fase) => km(n, fase, 5, 6, { facil: true });

export const PLAN_RUNNING = [
  caco(1, 6, 2, 2), caco(2, 5, 3, 2), caco(3, 5, 3, 2), caco(4, 4, 5, 2), caco(5, 4, 6, 2), caco(6, 3, 8, 2), caco(7, 3, 10, 2), caco(8, 2, 12, 2),
  tramos(9, [15, 15]), tramos(10, [20, 10]), tramos(11, [25, 10]), tiempo(12, 1, 30),
  tiempo(13, 2, 30), tiempo(14, 2, 35), tiempo(15, 2, 30), tiempo(16, 2, 40), tiempo(17, 2, 30, 35), tiempo(18, 2, 45), km(19, 2, 4, null, { facil: true }), km(20, 2, 5, null, { facil: true }),
  F(21), km(22, 3, 6), F(23), km(24, 3, 7), F(25), km(26, 3, 6, null, { descarga: true }), F(27), km(28, 3, 8), F(29), km(30, 3, 9), F56(31, 3), km(32, 3, 7, null, { descarga: true }), F56(33, 3), km(34, 3, 10),
  F56(35, 4), km(36, 4, 11), F56(37, 4), km(38, 4, 8, null, { descarga: true }), F56(39, 4), km(40, 4, 12), F56(41, 4), km(42, 4, 13), F56(43, 4), km(44, 4, 9, null, { descarga: true }), F56(45, 4), km(46, 4, 14), F56(47, 4), km(48, 4, 15),
  F56(49, 5), km(50, 5, 10, null, { descarga: true }), F56(51, 5), km(52, 5, 16), F56(53, 5), km(54, 5, 17), F56(55, 5), km(56, 5, 12, null, { descarga: true }), F56(57, 5), km(58, 5, 18), F56(59, 5), km(60, 5, 14), F56(61, 5), km(62, 5, 19), km(63, 5, 4, 5, { muyFacil: true }), km(64, 5, 10, 12, { facil: true }), km(65, 5, 4, 5, { muyFacil: true }), km(66, 5, 20),
];

/** Sesión del plan por su número (S1 → n = 1). */
export function sesionRunning(n) {
  return PLAN_RUNNING[Math.min(Math.max(1, n), PLAN_RUNNING.length) - 1];
}

/** La 3.0 arranca en S5: S3 y S4 ya estaban hechas. */
export const SESION_RUNNING_INICIAL = 5;

/** Compatibilidad con el nombre antiguo: minutos totales de una sesión. */
export function duracionRunning(n) {
  return sesionRunning(n).minEstimados;
}
