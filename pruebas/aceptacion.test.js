/*
 * Pruebas de aceptación: las reglas del Source of Truth técnico (2026-09-05)
 * que la app no puede romper. `npm test`.
 */

import { test } from "node:test";
import assert from "node:assert/strict";

import { CUT } from "../src/datos/config.js";
import { PLAN_RUNNING, RUTINAS, SECUENCIA, sesionRunning, seriesTotales } from "../src/datos/rutinas.js";
import { sumarDias } from "../src/logica/fechas.js";
import { avisoCut, faseActual, mantenimientoConfirmable, subestado } from "../src/logica/fase.js";
import { senalesDeload, siguienteRutina } from "../src/logica/fuerza.js";
import { adherencia, calcularTdee, diaValido, semaforoNutricional, sugerenciaKcal, tdeeDeducido } from "../src/logica/nutricion.js";
import { clasificarTendencia, media7, pesosValidos, tendenciaSemanal } from "../src/logica/peso.js";
import { veredicto } from "../src/logica/progresion.js";
import { calcularResumen } from "../src/logica/resumen.js";
import { aplicarDecision } from "../src/logica/revision.js";
import { avanza, estadoRunning, recomendacionHoy, semaforoDolor } from "../src/logica/running.js";

const dia = (fecha, extra = {}) => ({ fecha, ...extra });
const semanaDe = (desde, n, fn) => Array.from({ length: n }, (_, i) => fn(sumarDias(desde, i), i));

/* ---------- §3, §36 · fases por fecha ---------- */
test("hasta el 7 sep es PRE_CUT y desde el 8 sep es CUT", () => {
  assert.equal(faseActual(null, "2026-09-07"), "PRE_CUT");
  assert.equal(faseActual(null, "2026-09-08"), "CUT");
  assert.equal(faseActual({ faseManual: "MAINTENANCE" }, "2026-12-01"), "MAINTENANCE");
});

test("§13 visual · el aviso aparece el 16 nov y la revisión el 30 nov", () => {
  assert.equal(avisoCut(null, "2026-11-15").mostrar, false);
  const a = avisoCut(null, "2026-11-16");
  assert.equal(a.mostrar, true);
  assert.equal(a.esDiaRevision, false);
  assert.match(a.titulo, /2 semanas/);
  assert.equal(avisoCut(null, "2026-11-30").esDiaRevision, true);
});

/* ---------- §6–§10 · rutinas ---------- */
test("la secuencia avanza al completar y no se reinicia por calendario", () => {
  assert.equal(siguienteRutina([]), "TORSO_A");
  const s = [{ fecha: "2026-09-01", rutinaId: "TORSO_A", estado: "completada" }, { fecha: "2026-09-03", rutinaId: "PIERNA_A", estado: "completada" }];
  assert.equal(siguienteRutina(s), "TORSO_B");
  s.push({ fecha: "2026-09-05", rutinaId: "TORSO_B", estado: "completada" }, { fecha: "2026-09-07", rutinaId: "PIERNA_B", estado: "completada" });
  assert.equal(siguienteRutina(s), "TORSO_A");
  // una sesión abierta no mueve la secuencia
  s.push({ fecha: "2026-09-09", rutinaId: "TORSO_A", estado: "en-curso" });
  assert.equal(siguienteRutina(s), "TORSO_A");
});

test("series totales: 21 / 23 / 21 / 21", () => {
  assert.deepEqual(SECUENCIA.map(seriesTotales), [21, 23, 21, 21]);
  assert.equal(RUTINAS.TORSO_A.ejercicios[1].nombre, "Remo sentado máquina agarre bajo");
  assert.equal(RUTINAS.TORSO_B.ejercicios[1].nombre, "Remo sentado máquina agarre alto");
  for (const r of Object.values(RUTINAS)) for (const e of r.ejercicios) assert.equal(e.rir, "1-2");
});

/* ---------- §11 · doble progresión ---------- */
test("§11 · doble progresión: llenar el rango con RIR correcto → subir; si no, mantener", () => {
  const e = RUTINAS.TORSO_A.ejercicios[0]; // 3×8–12
  const h = (reps, rir = 2, kg = 60) => ({ fecha: "x", series: reps.map((r, i) => ({ numero: i + 1, kg, reps: r, rir })) });
  assert.equal(veredicto(e, [h([10, 9, 8])]).id, "llena");
  assert.equal(veredicto(e, [h([12, 12, 12])]).id, "sube");
  assert.equal(veredicto(e, [h([12, 12, 12], 0)]).id, "manten");
  assert.equal(veredicto(e, [h([7, 6, 6])]).id, "revisar");
  // peso recién subido y reps bajan: reconstrucción, no retroceso
  assert.equal(veredicto(e, [h([9, 8, 8], 2, 65), h([12, 12, 12], 2, 60)]).id, "llena");
});

/* ---------- §13 · deload ---------- */
test("§13 · la descarga se sugiere con varias señales y nunca se ejecuta sola", () => {
  const ok = senalesDeload({ sesiones: [], recuperacion: { energia: 4, sueno: 7.5, n: 7 }, veredictosTodos: [] });
  assert.equal(ok.sugerir, false);
  const mal = senalesDeload({ sesiones: [], recuperacion: { energia: 2, sueno: 5.5, n: 7 }, veredictosTodos: [] });
  assert.equal(mal.sugerir, true);
  assert.equal(mal.senales.length >= 2, true);
});

/* ---------- §21–§24 · peso ---------- */
test("§22–§23 · las dudosas no cuentan y la media7 necesita ≥5 pesadas", () => {
  const d = semanaDe("2026-09-08", 7, (f, i) => dia(f, { pesoKg: 97 - i * 0.1, pesoConfianza: i === 3 ? "doubtful" : "normal" }));
  const v = pesosValidos(d);
  assert.equal(v.length, 6);
  assert.ok(Math.abs(media7(v, "2026-09-14") - 96.7) < 0.001);
  assert.equal(media7(v.slice(0, 4), "2026-09-14"), null);
});

test("§24 · tendencia = media7 actual − media7 previa; un día no cambia nada", () => {
  const d = semanaDe("2026-09-08", 14, (f, i) => dia(f, { pesoKg: 97.5 - i * 0.07, pesoConfianza: "normal" }));
  const t = tendenciaSemanal(pesosValidos(d), "2026-09-21");
  assert.ok(Math.abs(t - -0.49) < 0.01);
  assert.equal(clasificarTendencia(t, 97), "EN_RANGO");
  assert.equal(clasificarTendencia(-0.8, 97), "RAPIDA");
  assert.equal(clasificarTendencia(0.05, 97), "PLANA");
  assert.equal(clasificarTendencia(null, 97), "SIN_DATOS");
});

/* ---------- §28 · adherencia ---------- */
test("§28 · día válido = kcal registradas y comida social estimada", () => {
  assert.equal(diaValido({ kcal: 2400 }), true);
  assert.equal(diaValido({ kcal: null }), false);
  assert.equal(diaValido({ kcal: 2400, comidaSocial: true, comidaSocialEstimada: false }), false);
  assert.equal(diaValido({ kcal: 2600, comidaSocial: true, comidaSocialEstimada: true }), true);
  const d = semanaDe("2026-09-08", 7, (f, i) => dia(f, { kcal: i < 6 ? 2400 : null }));
  assert.ok(Math.abs(adherencia(d, "2026-09-14") - 6 / 7) < 0.001);
});

/* ---------- §33–§34 · TDEE ---------- */
test("§33 · 2.400 kcal con −0,50 kg/sem → ~2.950", () => {
  assert.equal(Math.round(tdeeDeducido(2400, -0.5)), 2950);
});

test("§34 · el TDEE deducido exige 21 días válidos, adherencia y peso fiable; si no, ESTIMATED", () => {
  const pocos = semanaDe("2026-09-08", 10, (f, i) => dia(f, { kcal: 2400, pesoKg: 97 - i * 0.07, pesoConfianza: "normal" }));
  const t1 = calcularTdee(pocos, "2026-09-17", { ultimoCambioKcal: "2026-09-08" });
  assert.equal(t1.valido, false);
  assert.equal(t1.estado, "ESTIMATED");
  const muchos = semanaDe("2026-09-08", 28, (f, i) => dia(f, { kcal: 2400, pasos: 12800, pesoKg: 97.5 - i * 0.07, pesoConfianza: "normal" }));
  const t2 = calcularTdee(muchos, "2026-10-05", { ultimoCambioKcal: "2026-09-08" });
  assert.equal(t2.valido, true, t2.motivos.join(" | "));
  assert.ok(t2.valor > 2850 && t2.valor < 3000, String(t2.valor));
  assert.equal(t2.rango[1] - t2.rango[0], 300);
});

/* ---------- §29, §31 · ajuste de kcal ---------- */
test("§29 · antes de 14 días no se sugiere ajustar (salvo señales claras)", () => {
  const s = sugerenciaKcal({ fase: "CUT", diasDesdeCambio: 10, adherencia7: 0.9, comparables: true, tendencia: 0, tendenciaPrevia: 0, recuperacion: {}, kgRef: 97 });
  assert.equal(s.accion, "ESPERAR");
  assert.match(s.mensaje, /suficiente tiempo/);
});

test("§31 · adherencia <85 % → una semana más limpia", () => {
  const s = sugerenciaKcal({ fase: "CUT", diasDesdeCambio: 20, adherencia7: 0.7, comparables: true, tendencia: 0, tendenciaPrevia: 0, recuperacion: {}, kgRef: 97 });
  assert.equal(s.accion, "ESPERAR");
  assert.match(s.mensaje, /semana más limpia/);
});

test("§31 · en rango → mantener; plano 2 semanas con todo en orden → considerar −100/−150; rápido con hambre → considerar +", () => {
  const base = { fase: "CUT", diasDesdeCambio: 20, adherencia7: 0.9, comparables: true, recuperacion: {}, kgRef: 97, cinturaEstable: true, hayRuido: false };
  assert.equal(sugerenciaKcal({ ...base, tendencia: -0.5, tendenciaPrevia: -0.45 }).accion, "MANTENER");
  assert.equal(sugerenciaKcal({ ...base, tendencia: 0.05, tendenciaPrevia: -0.05 }).accion, "CONSIDERAR_MENOS");
  assert.equal(sugerenciaKcal({ ...base, tendencia: 0.05, tendenciaPrevia: -0.05, hayRuido: true }).accion, "MANTENER");
  assert.equal(sugerenciaKcal({ ...base, tendencia: 0.05, tendenciaPrevia: -0.5 }).accion, "MANTENER"); // una semana plana no es evidencia
  assert.equal(sugerenciaKcal({ ...base, tendencia: -0.9, tendenciaPrevia: -0.85, recuperacion: { hambre: 4.5, energia: 2 } }).accion, "CONSIDERAR_MAS");
  assert.equal(sugerenciaKcal({ ...base, tendencia: -0.3, tendenciaPrevia: -0.3, cinturaBaja: true }).accion, "MANTENER");
});

/* ---------- §35 · semáforo ---------- */
test("§35 · semáforo: amarillo sin datos, verde con progreso, rojo con recuperación mal", () => {
  assert.equal(semaforoNutricional({ diasEnFase: 5, adherencia7: 0.9, tendencia: null, comparables: null, recuperacion: {}, fase: "CUT", kgRef: 97 }).color, "AMARILLO");
  assert.equal(semaforoNutricional({ diasEnFase: 20, adherencia7: 0.9, tendencia: -0.5, tendenciaPrevia: -0.4, comparables: true, recuperacion: { hambre: 3, energia: 4, sueno: 7.5 }, fase: "CUT", kgRef: 97 }).color, "VERDE");
  assert.equal(semaforoNutricional({ diasEnFase: 20, adherencia7: 0.9, tendencia: -0.5, tendenciaPrevia: -0.4, comparables: true, recuperacion: { hambre: 5, energia: 1.5, sueno: 5 }, fase: "CUT", kgRef: 97 }).color, "ROJO");
});

/* ---------- §17–§19 · running ---------- */
test("§19 · semáforo de dolor", () => {
  assert.equal(semaforoDolor({ dolor: 2 }), "GREEN");
  assert.equal(semaforoDolor({ dolor: 1, persiste: true }), "YELLOW");
  assert.equal(semaforoDolor({ dolor: 4 }), "YELLOW");
  assert.equal(semaforoDolor({ dolor: 7 }), "RED");
  assert.equal(semaforoDolor({ dolor: 1, alteraMarcha: true }), "RED");
});

test("plan de running: 66 sesiones, S3/S4 hechas, arranca en S5, y avanza una a una solo en verde", () => {
  assert.equal(PLAN_RUNNING.length, 66);
  assert.equal(sesionRunning(4).codigo, "4×5");
  assert.equal(sesionRunning(5).codigo, "4×6");
  assert.equal(sesionRunning(12).correrMin, 30);
  assert.equal(sesionRunning(20).km, 5);
  assert.equal(sesionRunning(34).km, 10);
  assert.equal(sesionRunning(48).km, 15);
  assert.equal(sesionRunning(66).km, 20);
  assert.equal(PLAN_RUNNING.filter((p) => p.descarga).length, 6);
  const verde = { dolor: 1 };
  assert.equal(avanza({ carrera: verde, estado: "PROGRESS", sesion: 5 }), true);
  assert.equal(avanza({ carrera: { dolor: 4 }, estado: "PROGRESS", sesion: 5 }), false);
  assert.equal(avanza({ carrera: { ...verde, repetir: true }, estado: "PROGRESS", sesion: 5 }), false);
  assert.equal(avanza({ carrera: { ...verde, interfiere: true }, estado: "PROGRESS", sesion: 5 }), false);
  assert.equal(avanza({ carrera: verde, estado: "HOLD", sesion: 5 }), false);
  assert.equal(avanza({ carrera: verde, estado: "PROGRESS", sesion: 66 }), false);
  const c = [{ fecha: "2026-09-01", sesion: 5, dolor: 1 }];
  assert.equal(estadoRunning({ estadoRunning: "HOLD" }, c), "HOLD");
  assert.equal(estadoRunning({ estadoRunning: "PROGRESS" }, [...c, { fecha: "2026-09-06", sesion: 6, dolor: 7 }]), "RED_PAIN");
});

test("nunca dos días seguidos de running, y máximo 2 por semana", () => {
  const ayer = [{ fecha: "2026-09-09", sesion: 5, dolor: 0 }];
  assert.equal(recomendacionHoy({ estado: "PROGRESS", carreras: ayer, hoy: "2026-09-10", fuerzaHoy: false }).hacer, false);
  assert.equal(recomendacionHoy({ estado: "PROGRESS", carreras: ayer, hoy: "2026-09-11", fuerzaHoy: false }).hacer, true);
  const dos = [{ fecha: "2026-09-07", sesion: 5, dolor: 0 }, { fecha: "2026-09-09", sesion: 6, dolor: 0 }];
  assert.equal(recomendacionHoy({ estado: "PROGRESS", carreras: dos, hoy: "2026-09-12", fuerzaHoy: false }).hacer, false);
});

/* ---------- §37–§39 · revisión y mantenimiento ---------- */
test("§37 · la decisión A/C pasa a mantenimiento en el TDEE deducido; B extiende 4 semanas con nueva revisión", () => {
  const ajustes = { finProvisional: CUT.finProvisional, proteinaG: 175, grasaG: 70, kcalObjetivo: 2400 };
  const a = aplicarDecision("MAINTENANCE", { ajustes, hoy: "2026-11-30", tdee: { valido: true, valor: 2950 } });
  assert.equal(a.parche.faseManual, "MAINTENANCE");
  assert.equal(a.parche.kcalObjetivo, 2950); // sin restar 100
  assert.equal(a.parche.mantenimientoConfirmado, null);
  const b = aplicarDecision("EXTEND_CUT", { ajustes, hoy: "2026-11-30", tdee: { valido: false } });
  assert.equal(b.parche.faseManual, undefined);
  assert.equal(b.parche.finProvisional, "2026-12-28");
  assert.equal(b.parche.avisoPreRevision, "2026-12-14");
  const c = aplicarDecision("MAINTENANCE_THEN_SECOND_CUT", { ajustes, hoy: "2026-11-30", tdee: { valido: false } });
  assert.equal(c.parche.segundoBloquePendiente, true);
  assert.ok(c.parche.kcalObjetivo >= 2850 && c.parche.kcalObjetivo <= 3000);
});

test("§39 · mantenimiento confirmable: ±0,20 kg/sem varias semanas + cintura estable + actividad comparable", () => {
  assert.equal(mantenimientoConfirmable({ tendencias: [0.1, -0.15, 0.05], cinturaEstable: true, comparables: true }).ok, true);
  assert.equal(mantenimientoConfirmable({ tendencias: [0.1, -0.4, 0.05], cinturaEstable: true, comparables: true }).ok, false);
  assert.equal(mantenimientoConfirmable({ tendencias: [0.1], cinturaEstable: true, comparables: true }).ok, false);
});

/* ---------- §53 · subestados ---------- */
test("§53 · subestados", () => {
  assert.equal(subestado({ fase: "CUT", hoy: "2026-12-01", ajustes: {}, diasEnFase: 85, adherencia7: 0.9, tendencia: -0.5, semaforo: { color: "VERDE" } }), "REVIEW_DUE");
  assert.equal(subestado({ fase: "CUT", hoy: "2026-09-10", ajustes: {}, diasEnFase: 3, adherencia7: 0.9, tendencia: null, semaforo: { color: "AMARILLO", texto: "" } }), "INSUFFICIENT_DATA");
  assert.equal(subestado({ fase: "MAINTENANCE", hoy: "2026-12-10", ajustes: {}, diasEnFase: 10, adherencia7: 0.9, tendencia: 0, semaforo: { color: "VERDE" } }), "TRANSITION");
});

/* ---------- §57 · pantalla HOY ---------- */
test("§57 · el resumen arranca limpio, sin datos de prueba, y dice lo que toca", () => {
  const r = calcularResumen({ hoy: "2026-09-08", ajustes: { kcalObjetivo: 2400, proteinaG: 175, carbosG: 268, grasaG: 70, sesionRunning: 5, estadoRunning: "PROGRESS", ultimoCambioKcal: "2026-09-08" } });
  assert.equal(r.fase, "CUT");
  assert.equal(r.diaFase, 1);
  assert.equal(r.etiqueta, "Definición · Día 1");
  assert.equal(r.fuerza.siguiente, "TORSO_A");
  assert.equal(r.running.sesion, 5);
  assert.equal(r.running.plan.codigo, "4×6");
  assert.equal(r.kcal, 2400);
  assert.deepEqual(r.macros, { p: 175, c: 268, g: 70 });
  assert.equal(r.peso.media7, null);
  assert.equal(r.nutricion.tdee.estado, "ESTIMATED");
  assert.equal(r.nutricion.semaforo.color, "AMARILLO");
  assert.equal(r.pendientes.peso, true);
  assert.equal(r.aviso.mostrar, false);
});
