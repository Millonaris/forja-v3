/*
 * El resumen: UNA sola función pura que, a partir de todo lo guardado y de la
 * fecha de hoy, calcula lo que necesitan las cuatro pantallas (§57–§59). Así
 * HOY, PROGRESO y PLAN no pueden discrepar entre sí, y todo se prueba con
 * `node --test` sin navegador.
 */

import { CUT, FUNCIONES, MENSAJES, UMBRALES } from "../datos/config.js";
import { PLAN_RUNNING, RUTINAS, RUTINAS_CORTAS, SECUENCIA, sesionRunning, seriesTotales } from "../datos/rutinas.js";
import { diasEntre, sumarDias, ultimosDias } from "./fechas.js";
import { avisoCut, diaDeFase, etiquetaFase, faseActual, inicioFase, mantenimientoConfirmable, objetivoFase, subestado, sugerenciaGanancia } from "./fase.js";
import { completadas, fuerzaEstable, hechaEl as fuerzaHechaEl, historialPorEjercicio, resumenEjercicios, senalesDeload, sesionAbierta, siguienteRutina, ultimaCompletada, ultimaDe, veredictosDeRutina, volumen } from "./fuerza.js";
import { adherencia, calcularTdee, diaValido, mediaKcal, mediaPasos, mediaProteina, mensajePesoHoy, objetivoDelDia, pasosComparables, recuperacionMedia, resolverTipoDia, ritmoMensual, semaforoNutricional, semanaKcal, sugerenciaKcal } from "./nutricion.js";
import { cinturaBaja, cinturaDeReferencia, cinturaEstable, clasificarTendencia, media7, pesoDelDia, pesosTodos, pesosValidos, serieMedia7, tendenciaSemanal, tocaMedirCintura, ultimaCintura, ultimoPeso } from "./peso.js";
import { carrerasOrdenadas, estadoRunning, faseDe, hechaEl as runHechaEl, notaProgresion, nutricionRunning, recomendacionHoy, restante, semaforoDolor, sesionesEnSemana } from "./running.js";

export function calcularResumen({ hoy, ajustes, diario = [], cintura = [], sesiones = [], carreras = [], extras = [] }) {
  const fase = faseActual(ajustes, hoy);
  const inicio = inicioFase(ajustes, hoy);
  const diaFase = diaDeFase(ajustes, hoy);
  const diasEnFase = inicio ? Math.max(0, diasEntre(inicio, hoy) + 1) : 0;
  const kgRef = ultimoPeso(diario, hoy)?.kg ?? ajustes?.pesoReferencia ?? 97;

  /* ---- peso ---- */
  const pv = pesosValidos(diario);
  const pesoHoy = pesoDelDia(diario, hoy);
  const ultimo = ultimoPeso(diario, hoy);
  const m7 = media7(pv, hoy);
  const tendencia = tendenciaSemanal(pv, hoy);
  const tendenciaPrevia = tendenciaSemanal(pv, sumarDias(hoy, -7));
  const claseTendencia = clasificarTendencia(tendencia, kgRef);
  const diasGrafica = ultimosDias(28, hoy);
  const todos = pesosTodos(diario);
  const grafica = {
    fechas: diasGrafica,
    pesos: diasGrafica.map((f) => todos.find((p) => p.fecha === f) || null),
    media: serieMedia7(pv, diasGrafica),
  };

  /* ---- cintura ---- */
  const cUltima = ultimaCintura(cintura, hoy);
  const cRef = inicio ? cinturaDeReferencia(cintura, inicio) : null;
  const cToca = tocaMedirCintura(cintura, hoy);
  const cEstable = cinturaEstable(cintura, hoy);
  const cBaja = cinturaBaja(cintura, hoy);

  /* ---- nutrición ---- */
  const adh7 = adherencia(diario, hoy, 7);
  const kcal7 = mediaKcal(diario, hoy, 7);
  const prot7 = mediaProteina(diario, hoy, 7);
  const pasos7 = mediaPasos(diario, hoy, 7);
  const comparables = pasosComparables(diario, hoy);
  const rec7 = recuperacionMedia(diario, hoy, 7);
  const recHoy = diario.find((d) => d.fecha === hoy) || null;
  const cierreHoy = recHoy && diaValido(recHoy);
  const tdee = calcularTdee(diario, hoy, ajustes);
  const semaforo = semaforoNutricional({ diasEnFase, adherencia7: adh7, tendencia, tendenciaPrevia, comparables, recuperacion: rec7, cinturaEstableSemanas: cEstable, kgRef, fase });
  const diasDesdeCambio = ajustes?.ultimoCambioKcal ? diasEntre(ajustes.ultimoCambioKcal, hoy) : diasEnFase;
  const hayRuido = diario.filter((d) => diasEntre(d.fecha, hoy) < 14 && diasEntre(d.fecha, hoy) >= 0 && (d.pesoConfianza === "doubtful" || d.comidaSocial)).length >= 2;
  const fEstable = fuerzaEstable(sesiones);
  const objetivosDia = ajustes?.objetivosDia || CUT.objetivosDia;
  const kcalMinimaActual = Math.min(objetivosDia.REST.kcal, objetivosDia.STRENGTH.kcal);
  const sugerencia = sugerenciaKcal({ fase, diasDesdeCambio, adherencia7: adh7, comparables, tendencia, tendenciaPrevia, cinturaBaja: cBaja, cinturaEstable: cEstable, recuperacion: rec7, kgRef, hayRuido, fuerzaEstable: fEstable, kcalMinimaActual });
  const sub = subestado({ fase, hoy, ajustes, diasEnFase, adherencia7: adh7, tendencia, semaforo });

  /* ---- fuerza ---- */
  const siguiente = siguienteRutina(sesiones);
  const ultimaSesion = ultimaCompletada(sesiones);
  const abierta = sesionAbierta(sesiones);
  const fuerzaHoy = fuerzaHechaEl(sesiones, hoy);
  const historial = historialPorEjercicio(sesiones);
  const veredictosTodos = SECUENCIA.flatMap((id) => veredictosDeRutina(id, historial));
  const deload = senalesDeload({ sesiones, recuperacion: rec7, veredictosTodos });
  const listaSesiones = completadas(sesiones);
  const fuerza = {
    siguiente,
    rutina: RUTINAS[siguiente],
    ultima: ultimaSesion,
    abierta,
    hechaHoy: fuerzaHoy,
    porRutina: SECUENCIA.map((id) => ({ id, rutina: RUTINAS[id], total: seriesTotales(id), ultima: ultimaDe(sesiones, id), esSiguiente: id === siguiente, esUltima: ultimaSesion?.rutinaId === id })),
    historial,
    veredictosTodos,
    deload,
    totalSesiones: listaSesiones.length,
    totalSeries: listaSesiones.reduce((t, s) => t + (s.series || []).filter((x) => x.completada || Number(x.reps) > 0).length, 0),
    volumenTotal: listaSesiones.reduce((t, s) => t + volumen(s), 0),
    ejercicios: resumenEjercicios(historial),
    sesionesEnFase: inicio ? listaSesiones.filter((s) => s.fecha >= inicio).length : listaSesiones.length,
  };

  /* ---- running ---- */
  const sesionN = Math.min(Math.max(1, ajustes?.sesionRunning ?? 5), PLAN_RUNNING.length);
  const estadoRun = estadoRunning(ajustes, carreras);
  const ordenadas = carrerasOrdenadas(carreras);
  const ultimaRun = ordenadas[0] || null;
  const planSesion = sesionRunning(sesionN);
  const running = {
    sesion: sesionN,
    plan: planSesion,
    fase: faseDe(sesionN),
    restante: restante(sesionN),
    siguientes: PLAN_RUNNING.slice(sesionN, sesionN + 3),
    duracionMin: planSesion.minEstimados,
    estado: estadoRun,
    nota: notaProgresion({ estado: estadoRun, sesion: sesionN, ultima: ultimaRun }),
    nutricion: nutricionRunning(planSesion.minEstimados),
    ultima: ultimaRun,
    semaforoUltima: ultimaRun ? semaforoDolor(ultimaRun) : null,
    hechaHoy: runHechaEl(carreras, hoy),
    enSemana: sesionesEnSemana(carreras, hoy),
    recomendacion: recomendacionHoy({ estado: estadoRun, carreras, hoy, fuerzaHoy }),
    lista: ordenadas.slice(0, 12),
    porSemana4: carreras.filter((c) => diasEntre(c.fecha, hoy) < 28 && diasEntre(c.fecha, hoy) >= 0).length / 4,
    sensacionMedia: (() => { const con = ordenadas.slice(0, 5).filter((c) => c.sensacion != null); return con.length ? con.reduce((t, c) => t + Number(c.sensacion), 0) / con.length : null; })(),
  };

  /* ---- tipo de día y objetivo de hoy (§4B, 3.1) ---- */
  const fuerzaAbiertaHoy = !!(abierta && abierta.fecha === hoy);
  const tipoDia = resolverTipoDia({ socialPlaneada: !!recHoy?.socialPlaneada, fuerzaPlaneadaOHecha: !!recHoy?.fuerzaPlaneada || fuerzaHoy || fuerzaAbiertaHoy });
  const objetivoHoy = objetivoDelDia({ fase, tipo: tipoDia, ajustes });
  const semana = semanaKcal(diario, hoy, ajustes, fase);
  const ayer = diario.find((d) => d.fecha === sumarDias(hoy, -1));
  const ayerSocial = !!(ayer && (ayer.tipoDia === "SOCIAL" || ayer.comidaSocial));

  /* ---- rutinas cortas ---- */
  const extrasSemana = extras.filter((e) => diasEntre(e.fecha, hoy) < 7 && diasEntre(e.fecha, hoy) >= 0);
  const posturaHoy = extras.some((e) => e.fecha === hoy && e.tipo === "postura");
  const coreSemana = extrasSemana.filter((e) => e.tipo === "core").length;
  const corePendiente = coreSemana < 2;

  /* ---- fase / revisión ---- */
  const aviso = avisoCut(ajustes, hoy);
  const tendencias3 = [0, 1, 2].map((i) => tendenciaSemanal(pv, sumarDias(hoy, -7 * i)));
  const mantenimiento = fase === "MAINTENANCE" ? mantenimientoConfirmable({ tendencias: tendencias3, cinturaEstable: cEstable, comparables }) : null;
  const ganancia = fase === "GAIN" ? sugerenciaGanancia({ kgMes: ritmoMensual(tendencia), cinturaSube: cEstable === false && cBaja === false && cUltima && cRef && cUltima.cm - cRef.cm > 1.5, fuerzaProgresa: fEstable, semanasPlano: tendencias3.filter((t) => t != null && Math.abs(t) <= 0.1).length * (tendencias3.every((t) => t != null && Math.abs(t) <= 0.1) ? 3 : 1), adherencia7: adh7 }) : null;

  /* ---- alertas (§57 alerts) ---- */
  const alertas = [];
  if (aviso.mostrar) alertas.push({ id: "revision", texto: aviso.titulo, tipo: "cut" });
  if (sub === "REVIEW_DUE" && fase === "GAIN") alertas.push({ id: "revision-ganancia", texto: "Toca revisar la ganancia (cada ~4 semanas).", tipo: "fase" });
  if (deload.sugerir) alertas.push({ id: "deload", texto: MENSAJES.deload, tipo: "fuerza" });
  if (estadoRun === "RED_PAIN") alertas.push({ id: "rojo", texto: "Running en rojo: parar y valorar.", tipo: "running" });
  if (semaforo.color === "ROJO" && (FUNCIONES.recuperacion || !/recuperación/i.test(semaforo.texto))) alertas.push({ id: "semaforo", texto: semaforo.texto, tipo: "nutricion" });
  if (cToca && fase !== "PRE_CUT") alertas.push({ id: "cintura", texto: MENSAJES.faltaCintura, tipo: "cuerpo" });
  const msgPeso = mensajePesoHoy(diario, hoy);

  /* ---- pendientes de hoy ---- */
  const pendientes = {
    peso: !pesoHoy,
    recuperacion: !(recHoy && recHoy.hambre != null && recHoy.energia != null && recHoy.suenoHoras != null),
    cierre: !cierreHoy,
    cintura: cToca,
  };

  const diario7 = Object.fromEntries(ultimosDias(7, hoy).map((f) => [f, diario.find((d) => d.fecha === f) || null]));

  return {
    ajustes,
    hoy, fase, inicio, diaFase, diasEnFase, etiqueta: etiquetaFase(ajustes, hoy), objetivo: objetivoFase(fase), sub, kgRef,
    fechas: { inicioCut: CUT.inicio, fin: ajustes?.finProvisional || CUT.finProvisional, aviso: ajustes?.avisoPreRevision || CUT.avisoPreRevision },
    kcal: objetivoHoy.kcal, macros: { p: objetivoHoy.proteinaG, c: objetivoHoy.carbosG, g: objetivoHoy.grasaG }, tipoDia, objetivoHoy, objetivosDia, semana, ayerSocial,
    enCut: fase === "CUT" || fase === "PRE_CUT",
    peso: { hoy: pesoHoy, ultimo, media7: m7, tendencia, tendenciaPrevia, clase: claseTendencia, grafica, validos: pv.length, mensaje: msgPeso },
    cintura: { ultima: cUltima, referencia: cRef, toca: cToca, estable: cEstable, baja: cBaja, delta: cUltima && cRef ? cUltima.cm - cRef.cm : null, lista: [...cintura].sort((a, b) => b.fecha.localeCompare(a.fecha)) },
    nutricion: { diario7, adherencia7: adh7, kcal7, prot7, pasos7, comparables, rec7, recHoy, cierreHoy, tdee, semaforo, sugerencia, diasDesdeCambio, hayRuido, fuerzaEstable: fEstable },
    fuerza, running,
    extras: { posturaHoy, coreSemana, corePendiente, lista: extras },
    aviso, alertas, pendientes, mantenimiento, ganancia,
    diasMinimos: UMBRALES.diasMinimosAntesDeAjustar,
  };
}

export { RUTINAS_CORTAS };
