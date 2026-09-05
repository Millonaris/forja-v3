/*
 * FORJA 3.0 · Configuración global del plan.
 *
 * Fuente: FORJA_3_0_SOURCE_OF_TRUTH_TECNICO_2026-09-05.md (§1–§4, §16, §30,
 * §32, §36, §43, §44). Este fichero es el PLAN escrito, no el registro: lo que
 * Jose intenta conseguir y con qué números. Si el documento cambia, cambia aquí.
 */

export const USUARIO = {
  sexo: "male",
  edad: 41,
  alturaCm: 187,
  pesoRecienteKg: 97.0,
  objetivoPrincipal: "hypertrophy_physique",
  prioridadRunning: "secondary_hobby",
  creatinaGDia: 5,
};

/** §2 · Jerarquía de prioridades. El orden es la regla. */
export const PRIORIDADES = [
  { id: "hypertrophy_physique", titulo: "Físico de hipertrofia", texto: "Ganar y conservar músculo; hombros, espalda en V, glúteos; cintura visualmente menor." },
  { id: "fat_loss_with_muscle_retention", titulo: "Definición sin sacrificar músculo", texto: "Perder grasa manteniendo fuerza y masa muscular; sin déficits agresivos." },
  { id: "strength_performance", titulo: "Rendimiento de fuerza", texto: "Recuperar cargas, progresar, buena técnica. El déficit no es excusa para bajar intensidad." },
  { id: "recovery", titulo: "Recuperación", texto: "Sueño, energía, hambre, fatiga y molestias entre sesiones." },
  { id: "running_hobby", titulo: "Running", texto: "Hobby complementario. 20 km a largo plazo sin fecha. Nunca a costa de la hipertrofia." },
];

/** §3, §36 · Fase nutricional programada: el cut. */
export const CUT = {
  inicio: "2026-09-08",
  finProvisional: "2026-11-30",
  avisoPreRevision: "2026-11-16",
  kcal: 2400,
  proteinaG: 175,
  carbosG: 268,
  grasaG: 70,
};

/** §4 · Rango práctico de proteína: no se exige exactitud absoluta. */
export const PROTEINA_RANGO = { min: 165, max: 180 };

/** §32 · TDEE inicial: estimación provisional, nunca una verdad. */
export const TDEE_ESTIMADO = { min: 2850, max: 3000, estado: "ESTIMATED" };

/** §30 · Ritmo objetivo de pérdida, en % del peso corporal por semana. */
export const RITMO_CUT = { min: 0.004, max: 0.006, techoBlando: 0.007 };

/** §29, §31, §34 · Umbrales de decisión. */
export const UMBRALES = {
  diasMinimosAntesDeAjustar: 14,
  adherenciaMinima: 0.85,
  diasValidosTdee: 21,
  ajusteKcal: { min: 100, max: 150 },
  mantenimientoTendenciaMax: 0.2, // ±0,20 kg/semana (§39)
  mantenimientoSemanasMin: 2, // ~2–3 semanas como mínimo práctico (§38)
  gananciaSuperavit: { min: 150, max: 200 }, // §40
  gananciaRitmoMes: { min: 0.25, max: 0.45, techo: 0.6 }, // §40, §41
  gananciaRevisionSemanas: 4, // §41
  miniCutSemanas: { min: 4, max: 6 }, // §42
  pasosComparablesTolerancia: 0.2, // ±20 % de actividad para considerarla comparable
  kcalPorKgGrasa: 7700, // §33
};

/** §16, §18 · Running. */
export const RUNNING = {
  prioridad: "secondary",
  sesionesBaseSemana: 2,
  objetivoLargoPlazoKm: 20,
  fechaLimite: null,
  rpeObjetivo: "3–4",
};

/** §43, §44 · Hidratación y suplementos. */
export const HIDRATACION = "~2,5–3 L líquidos/día";
export const SUPLEMENTOS = [
  { nombre: "Creatina", pauta: "5 g/día" },
  { nombre: "Whey", pauta: "opcional" },
  { nombre: "Cafeína", pauta: "opcional" },
];

/** Reparto habitual de comidas (documento visual §36). Orientativo. */
export const REPARTO_COMIDAS = [
  { hora: "09:00–09:30", que: "Desayuno" },
  { hora: "~12:00", que: "Gym", destacado: true },
  { hora: "13:00–13:30", que: "Comida post-entreno" },
  { hora: "17:00–18:00", que: "Merienda" },
  { hora: "~21:00", que: "Cena" },
];

/**
 * Interruptores de funciones. Lo que está en `false` sigue en el código (datos,
 * lógica y pantallas) pero no se enseña en la app. Para reactivar algo basta
 * con ponerlo en `true`.
 */
export const FUNCIONES = {
  // Registro diario de hambre / energía / sueño (§27). Jose lo aparcó el 5 sep 2026.
  recuperacion: false,
};

/** §52, §53, §54 · Estados. */
export const FASES = ["PRE_CUT", "CUT", "MAINTENANCE", "GAIN", "MINI_CUT"];
export const SUBESTADOS = ["ACTIVE", "INSUFFICIENT_DATA", "REVIEW_DUE", "RECOVERY_WARNING", "TRANSITION"];
export const ESTADOS_RUNNING = ["PROGRESS", "HOLD", "YELLOW_PAIN", "RED_PAIN"];

export const NOMBRE_FASE = {
  PRE_CUT: "Pre-cut",
  CUT: "Definición",
  MAINTENANCE: "Mantenimiento",
  GAIN: "Ganancia muscular",
  MINI_CUT: "Mini-cut",
};

/** §55 · Lo que FORJA nunca hace. Se enseña en PLAN tal cual. */
export const PROHIBICIONES = [
  "Cambiar kcal por un peso aislado.",
  "Reducir kcal por 2–3 días planos.",
  "Aumentar running porque “toca calendario”.",
  "Sacrificar fuerza por el objetivo 20K.",
  "Comer automáticamente las kcal del Garmin.",
  "Duplicar running + pasos.",
  "Usar la BIA como dato real de grasa.",
  "Obligar a descargar cada X semanas.",
  "Diagnosticar postura.",
  "Diagnosticar ginecomastia.",
  "Castigar una comida social.",
  "Exigir macros perfectos.",
  "Asumir que el TDEE estimado es real.",
  "Continuar el cut indefinidamente sin revisión.",
];

/** §56 · Mensajes automáticos, literales. */
export const MENSAJES = {
  pesoSubeUnDia: "Un día no cambia el plan. Mira la media de 7 días.",
  menosDe14Dias: "Todavía no hay suficiente tiempo para ajustar.",
  adherenciaBaja: "Necesitamos una semana más limpia antes de tocar calorías.",
  cinturaBajaPesoLento: "Hay progreso. Mantén el plan.",
  runningInterfiere: "Mantén esta sesión de running. La hipertrofia tiene prioridad.",
  recuperacionEmpeora: "Revisa sueño, energía, hambre y rendimiento antes de modificar el plan.",
  pesoBajaRapido: "La tendencia es rápida. Comprueba hambre, energía, sueño y rendimiento antes de tocar calorías.",
  pesoPlanoSemana: "Todavía no hay evidencia suficiente para cambiar el plan.",
  faltaCintura: "La báscula no cuenta toda la historia. Mide cintura esta semana.",
  faltaRegistro: "Sin datos suficientes, FORJA no debe ajustar el plan.",
  sinDatos: "Sin datos suficientes, FORJA no debe ajustar el plan.",
  deload: "Parece que acumulas fatiga. Puede ser buen momento para reducir volumen temporalmente.",
  running20k: "El objetivo de 20 km no tiene fecha límite. Mantén esta sesión hasta que deje de interferir con fuerza y recuperación.",
  comidaSocial: "Una comida social puede reducir el déficit semanal, pero no arruina el proceso.",
  tendencias: "FORJA decide por tendencias, no por una pesada aislada.",
  totalDelDia: "No necesitas clavar cada comida. Prioriza el total del día.",
  recuperacionImporta: "La recuperación importa tanto como la báscula.",
  dobleProgresion: "Primero ganas repeticiones. Después ganas peso.",
};
