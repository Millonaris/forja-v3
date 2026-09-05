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
 * Escalera CaCo (correr/andar). El documento no fija un calendario: se sube
 * de nivel por sesiones completadas en verde, y solo si el running no
 * interfiere con la fuerza (§17). Los primeros niveles son los que Jose ya
 * ha hecho (documento visual §29); el resto es la rampa hacia los 20 km.
 */
export const CACO = [
  { codigo: "5×3", desc: "5 bloques · 3 min correr / 2 min andar · ~8 km/h", correr: 3, andar: 2, bloques: 5 },
  { codigo: "4×5", desc: "4 bloques · 5 min correr / 2 min andar · ~7,5 km/h", correr: 5, andar: 2, bloques: 4 },
  { codigo: "3×7", desc: "3 bloques · 7 min correr / 2 min andar", correr: 7, andar: 2, bloques: 3 },
  { codigo: "2×10", desc: "2 bloques · 10 min correr / 2 min andar", correr: 10, andar: 2, bloques: 2 },
  { codigo: "1×20", desc: "20 min correr continuo", correr: 20, andar: 0, bloques: 1 },
  { codigo: "1×25", desc: "25 min correr continuo", correr: 25, andar: 0, bloques: 1 },
  { codigo: "1×30", desc: "30 min correr continuo", correr: 30, andar: 0, bloques: 1 },
  { codigo: "1×35", desc: "35 min correr continuo", correr: 35, andar: 0, bloques: 1 },
  { codigo: "1×40", desc: "40 min correr continuo", correr: 40, andar: 0, bloques: 1 },
  { codigo: "1×45", desc: "45 min correr continuo", correr: 45, andar: 0, bloques: 1 },
  { codigo: "1×50", desc: "50 min correr continuo", correr: 50, andar: 0, bloques: 1 },
  { codigo: "1×60", desc: "60 min correr continuo", correr: 60, andar: 0, bloques: 1 },
  { codigo: "1×70", desc: "70 min correr continuo", correr: 70, andar: 0, bloques: 1 },
  { codigo: "1×80", desc: "80 min correr continuo", correr: 80, andar: 0, bloques: 1 },
  { codigo: "1×90", desc: "90 min correr continuo", correr: 90, andar: 0, bloques: 1 },
  { codigo: "1×105", desc: "105 min correr continuo", correr: 105, andar: 0, bloques: 1 },
  { codigo: "1×120", desc: "120 min correr continuo · ~20 km", correr: 120, andar: 0, bloques: 1 },
];

/** Nivel CaCo con el que arranca la 3.0: el último que hizo Jose (4×5, 31 ago). */
export const NIVEL_CACO_INICIAL = 1;

/** Minutos totales de una sesión CaCo. */
export function duracionCaco(nivel) {
  const c = CACO[Math.min(nivel, CACO.length - 1)];
  return c.bloques * (c.correr + c.andar);
}
