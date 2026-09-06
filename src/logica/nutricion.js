/*
 * Nutrición (§28–§35, §56).
 *
 * Adherencia, TDEE deducido, semáforo nutricional y sugerencia de kcal.
 * Todo son SUGERENCIAS: FORJA nunca cambia calorías sola. Ciclo:
 * medir → observar → comparar → decidir.
 */

import { CUT, MENSAJES, TDEE_ESTIMADO, UMBRALES } from "../datos/config.js";
import { diasEntre, sumarDias, ultimosDias } from "./fechas.js";
import { clasificarTendencia, media, media7, pesosValidos, tendenciaEnSemanas, tendenciaSemanal } from "./peso.js";

/* ---------- §4B · Tipo de día (3.1) ---------- */

/** SOCIAL > STRENGTH > REST. El running corto NO cambia el tipo. */
export function resolverTipoDia({ socialPlaneada = false, fuerzaPlaneadaOHecha = false }) {
  if (socialPlaneada) return "SOCIAL";
  if (fuerzaPlaneadaOHecha) return "STRENGTH";
  return "REST";
}

/** Objetivo del día según fase y tipo. Fuera del cut, un solo objetivo. */
export function objetivoDelDia({ fase, tipo, ajustes }) {
  if (fase === "CUT" || fase === "PRE_CUT") {
    const o = (ajustes?.objetivosDia || CUT.objetivosDia)[tipo] || CUT.objetivosDia.REST;
    return { kcal: o.kcal, proteinaG: o.proteinaG, carbosG: o.carbosG, grasaG: o.grasaG, tipo, flexible: tipo === "SOCIAL" };
  }
  return { kcal: ajustes?.kcalObjetivo ?? CUT.kcal, proteinaG: ajustes?.proteinaG ?? CUT.proteinaG, carbosG: ajustes?.carbosG ?? null, grasaG: ajustes?.grasaG ?? CUT.grasaG, tipo: null, flexible: false };
}

/** Lunes de la semana de una fecha (semana lunes–domingo). */
export function lunesDe(fecha) {
  const d = new Date(fecha + "T12:00:00");
  const dow = (d.getDay() + 6) % 7; // lunes = 0
  return sumarDias(fecha, -dow);
}

/**
 * §47, §57 · Presupuesto semanal: kcal consumidas en la semana en curso frente
 * a la referencia (16.050) y frente a lo esperado por los tipos de día de los
 * días ya registrados.
 */
export function semanaKcal(diario, hoy, ajustes, fase) {
  const lunes = lunesDe(hoy);
  const dias = diasEntreFechas(diario, lunes, hoy).filter(diaValido);
  const consumido = dias.reduce((t, d) => t + Number(d.kcal), 0);
  const esperado = dias.reduce((t, d) => t + objetivoDelDia({ fase, tipo: d.tipoDia || "REST", ajustes }).kcal, 0);
  const referencia = fase === "CUT" || fase === "PRE_CUT" ? CUT.semanaReferenciaKcal : (ajustes?.kcalObjetivo ?? CUT.kcal) * 7;
  const tipos = { REST: 0, STRENGTH: 0, SOCIAL: 0 };
  for (const d of dias) tipos[d.tipoDia || "REST"]++;
  return { lunes, diasRegistrados: dias.length, consumido, esperado, referencia, diferencia: consumido - esperado, tipos };
}

/** §28 · Un día es válido si tiene kcal y, si hubo comida social, se estimó. */
export function diaValido(d) {
  if (!d || d.kcal == null || Number(d.kcal) <= 0) return false;
  if (d.comidaSocial && !d.comidaSocialEstimada) return false;
  return true;
}

function diasEntreFechas(diario, desde, hasta) {
  return diario.filter((d) => d.fecha >= desde && d.fecha <= hasta);
}

/** §28 · adherencia = días válidos / 7, sobre los 7 días que terminan en `hasta`. */
export function adherencia(diario, hasta, dias = 7) {
  const desde = sumarDias(hasta, -(dias - 1));
  const validos = diasEntreFechas(diario, desde, hasta).filter(diaValido).length;
  return validos / dias;
}

export function diasValidosEn(diario, desde, hasta) {
  return diasEntreFechas(diario, desde, hasta).filter(diaValido);
}

export function mediaKcal(diario, hasta, dias = 7) {
  const desde = sumarDias(hasta, -(dias - 1));
  return media(diasValidosEn(diario, desde, hasta).map((d) => Number(d.kcal)));
}

export function mediaProteina(diario, hasta, dias = 7) {
  const desde = sumarDias(hasta, -(dias - 1));
  const con = diasValidosEn(diario, desde, hasta).filter((d) => d.proteinaG != null);
  return media(con.map((d) => Number(d.proteinaG)));
}

export function mediaPasos(diario, hasta, dias = 7) {
  const desde = sumarDias(hasta, -(dias - 1));
  const con = diasEntreFechas(diario, desde, hasta).filter((d) => d.pasos != null && Number(d.pasos) > 0);
  return media(con.map((d) => Number(d.pasos)));
}

/**
 * §26, §31 · Actividad comparable: los pasos medios de esta semana están a
 * ±20 % de los de las tres anteriores. `null` si no hay datos para saberlo.
 */
export function pasosComparables(diario, hasta) {
  const ahora = mediaPasos(diario, hasta, 7);
  const antes = mediaPasos(diario, sumarDias(hasta, -7), 21);
  if (ahora == null || antes == null) return null;
  return Math.abs(ahora - antes) / antes <= UMBRALES.pasosComparablesTolerancia;
}

/** §27 · Medias de recuperación de los últimos `dias` días. */
export function recuperacionMedia(diario, hasta, dias = 7) {
  const desde = sumarDias(hasta, -(dias - 1));
  const con = diasEntreFechas(diario, desde, hasta).filter((d) => d.hambre != null || d.energia != null || d.suenoHoras != null);
  const de = (k) => media(con.filter((d) => d[k] != null).map((d) => Number(d[k])));
  return { hambre: de("hambre"), energia: de("energia"), sueno: de("suenoHoras"), calidad: de("suenoCalidad"), n: con.length };
}

/** §33 · TDEE deducido. Test del plan: 2.400 kcal con −0,50 kg/sem → ~2.950. */
export function tdeeDeducido(mediaCalorias, tendenciaKgSemana) {
  return mediaCalorias - (tendenciaKgSemana * UMBRALES.kcalPorKgGrasa) / 7;
}

/**
 * §34 · TDEE deducido con sus condiciones de validez. Se mide sobre las
 * últimas 3 semanas (21 días) que terminan en `hasta`. Devuelve siempre algo
 * que enseñar: si no es válido, el estimado y los motivos.
 */
export function calcularTdee(diario, hasta, ajustes) {
  const semanas = 3;
  const desde = sumarDias(hasta, -(semanas * 7 - 1));
  const validos = diasValidosEn(diario, desde, hasta);
  const motivos = [];

  if (validos.length < UMBRALES.diasValidosTdee) motivos.push(`Faltan días válidos: ${validos.length}/${UMBRALES.diasValidosTdee}.`);

  const adh = validos.length / (semanas * 7);
  if (adh < UMBRALES.adherenciaMinima) motivos.push(`Adherencia ${Math.round(adh * 100)} % (<85 %).`);

  const kcals = validos.map((d) => Number(d.kcal));
  const mKcal = media(kcals);
  if (mKcal != null && kcals.length > 3) {
    const desv = Math.sqrt(media(kcals.map((k) => (k - mKcal) ** 2)));
    if (desv / mKcal > 0.12) motivos.push("Ingesta poco estable entre días.");
  }

  const comparables = pasosComparables(diario, hasta);
  if (comparables === false) motivos.push("Actividad no comparable (pasos ±20 %).");

  if (ajustes?.ultimoCambioKcal && diasEntre(ajustes.ultimoCambioKcal, hasta) < UMBRALES.diasValidosTdee) {
    motivos.push("Menos de 21 días desde el último cambio de kcal.");
  }

  const pv = pesosValidos(diario);
  const tend = tendenciaEnSemanas(pv, hasta, semanas);
  if (tend == null) motivos.push("Peso no suficientemente fiable (faltan medias de 7 días).");

  const dudosas = diario.filter((d) => d.fecha >= desde && d.fecha <= hasta && d.pesoConfianza === "doubtful").length;
  if (dudosas >= 4) motivos.push("Demasiadas pesadas dudosas en la ventana.");

  const valido = motivos.length === 0;
  const valor = valido ? Math.round(tdeeDeducido(mKcal, tend)) : null;

  return {
    valido,
    estado: valido ? "DEDUCED" : "ESTIMATED",
    valor,
    rango: valido ? [valor - 150, valor + 150] : [TDEE_ESTIMADO.min, TDEE_ESTIMADO.max],
    motivos,
    diasValidos: validos.length,
    adherencia: adh,
    mediaKcal: mKcal,
    tendencia: tend,
  };
}

/**
 * §35 · Semáforo nutricional.
 *   AMARILLO  datos insuficientes, baja adherencia o actividad no comparable
 *   ROJO      problema claro de recuperación, o sin progreso con datos válidos
 *   VERDE     datos claros y progreso razonable
 */
export function semaforoNutricional({ diasEnFase, adherencia7, tendencia, comparables, recuperacion, tendenciaPrevia, cinturaEstableSemanas, kgRef, fase }) {
  const rec = recuperacion || {};
  const recuperacionMal = (rec.hambre != null && rec.hambre >= 4.5) && (rec.energia != null && rec.energia <= 2) ||
    (rec.energia != null && rec.energia <= 1.8 && rec.sueno != null && rec.sueno < 6);
  if (recuperacionMal) return { color: "ROJO", texto: "Problema claro de recuperación. " + MENSAJES.recuperacionEmpeora };

  if (diasEnFase < UMBRALES.diasMinimosAntesDeAjustar || tendencia == null || adherencia7 < UMBRALES.adherenciaMinima || comparables === false) {
    return { color: "AMARILLO", texto: "Datos insuficientes, baja adherencia o actividad no comparable. Sigue registrando." };
  }

  if (fase === "CUT" || fase === "MINI_CUT") {
    const clase = clasificarTendencia(tendencia, kgRef);
    const clasePrev = clasificarTendencia(tendenciaPrevia, kgRef);
    const sinProgreso = ["PLANA", "SUBE"].includes(clase) && ["PLANA", "SUBE"].includes(clasePrev) && cinturaEstableSemanas !== false && diasEnFase >= 28;
    if (sinProgreso) return { color: "ROJO", texto: "Ausencia persistente de progreso con datos válidos. Toca revisar el plan a mano; nunca cambiar kcal automáticamente." };
    if (clase === "RAPIDA" && clasePrev === "RAPIDA") return { color: "ROJO", texto: MENSAJES.pesoBajaRapido };
  }

  return { color: "VERDE", texto: "Todo va en dirección correcta." };
}

/**
 * §31 · Sugerencia de calorías. Nunca automática: devuelve qué haría un
 * entrenador prudente y por qué, y Jose decide.
 */
export function sugerenciaKcal({ fase, diasDesdeCambio, adherencia7, comparables, tendencia, tendenciaPrevia, cinturaBaja, cinturaEstable, recuperacion, kgRef, hayRuido, fuerzaEstable, kcalMinimaActual }) {
  if (fase !== "CUT" && fase !== "MINI_CUT") return { accion: "MANTENER", motivo: "Fuera de fase de definición no se ajusta con estas reglas." };
  const base = sugerenciaKcalSinSuelo({ fase, diasDesdeCambio, adherencia7, comparables, tendencia, tendenciaPrevia, cinturaBaja, cinturaEstable, recuperacion, kgRef, hayRuido, fuerzaEstable });
  // §31 (3.1) · FORJA no puede bajar sola de 2.150 kcal: si tocaría, revisión manual.
  if (base.accion === "CONSIDERAR_MENOS" && kcalMinimaActual != null && kcalMinimaActual - 100 < CUT.sueloKcalAutomatico) {
    return { accion: "MANUAL_REVIEW_REQUIRED", motivo: base.motivo + ` Pero el día más bajo ya está en ${kcalMinimaActual} kcal y el suelo es ${CUT.sueloKcalAutomatico}.`, mensaje: MENSAJES.sueloKcal };
  }
  return base;
}

function sugerenciaKcalSinSuelo({ fase, diasDesdeCambio, adherencia7, comparables, tendencia, tendenciaPrevia, cinturaBaja, cinturaEstable, recuperacion, kgRef, hayRuido, fuerzaEstable }) {

  const clase = clasificarTendencia(tendencia, kgRef);
  const clasePrev = clasificarTendencia(tendenciaPrevia, kgRef);
  const rec = recuperacion || {};

  // Excepción §29: señales claras o pérdida excesivamente rápida sí se miran antes de 14 días.
  const hambreAlta = rec.hambre != null && rec.hambre >= 4;
  const energiaBaja = rec.energia != null && rec.energia <= 2;
  const suenoPeor = rec.sueno != null && rec.sueno < 6.5;
  const perdidaRapidaPersistente = clase === "RAPIDA" && clasePrev === "RAPIDA";
  if (perdidaRapidaPersistente && (hambreAlta || energiaBaja || suenoPeor || fuerzaEstable === false)) {
    return { accion: "CONSIDERAR_MAS", motivo: "Pérdida persistentemente rápida con hambre alta, energía baja, sueño peor o rendimiento a la baja.", mensaje: MENSAJES.pesoBajaRapido };
  }

  if (diasDesdeCambio < UMBRALES.diasMinimosAntesDeAjustar) return { accion: "ESPERAR", motivo: `${diasDesdeCambio} días desde el último cambio (mínimo 14).`, mensaje: MENSAJES.menosDe14Dias };
  if (adherencia7 < UMBRALES.adherenciaMinima) return { accion: "ESPERAR", motivo: `Adherencia ${Math.round(adherencia7 * 100)} % (<85 %).`, mensaje: MENSAJES.adherenciaBaja };
  if (clase === "SIN_DATOS") return { accion: "ESPERAR", motivo: "Sin media de 7 días fiable.", mensaje: MENSAJES.sinDatos };

  if (clase === "EN_RANGO") return { accion: "MANTENER", motivo: "Pérdida dentro del objetivo (0,4–0,6 %/semana)." };
  if (clase === "LENTA" && (cinturaBaja || fuerzaEstable !== false)) return { accion: "MANTENER", motivo: "Algo más lenta, pero la cintura baja y la fuerza se mantiene.", mensaje: MENSAJES.cinturaBajaPesoLento };
  if (clase === "RAPIDA") {
    if (hambreAlta || energiaBaja || suenoPeor) return { accion: "CONSIDERAR_MAS", motivo: "Ritmo rápido y señales de recuperación.", mensaje: MENSAJES.pesoBajaRapido };
    return { accion: "MANTENER", motivo: "Ritmo algo rápido pero sin señales de recuperación. Vigilar una semana más.", mensaje: MENSAJES.pesoBajaRapido };
  }

  // PLANA o SUBE
  const planoDosSemanas = ["PLANA", "SUBE"].includes(clase) && ["PLANA", "SUBE"].includes(clasePrev);
  if (planoDosSemanas && comparables !== false && cinturaEstable !== false && !hayRuido) {
    return { accion: "CONSIDERAR_MENOS", motivo: "≥14 días, adherencia ≥85 %, actividad comparable, peso y cintura planos, sin ruido claro.", mensaje: "Valorar −100 a −150 kcal. Tú decides." };
  }
  if (cinturaBaja) return { accion: "MANTENER", motivo: "El peso no baja pero la cintura sí.", mensaje: MENSAJES.cinturaBajaPesoLento };
  return { accion: "MANTENER", motivo: planoDosSemanas ? "Plano, pero hay ruido o la actividad no es comparable." : "Una semana plana no es evidencia.", mensaje: MENSAJES.pesoPlanoSemana };
}

/** §56 · Mensaje automático para el peso de hoy frente al de ayer y la media. */
export function mensajePesoHoy(diario, hoy) {
  const pv = pesosValidos(diario);
  const hoyP = pv.find((p) => p.fecha === hoy);
  const anteriores = pv.filter((p) => p.fecha < hoy);
  if (!hoyP || !anteriores.length) return null;
  const ayer = anteriores[anteriores.length - 1];
  if (hoyP.kg > ayer.kg) return MENSAJES.pesoSubeUnDia;
  return null;
}

/** Ayuda para la fase de GANANCIA (§41): kg/mes a partir de la tendencia semanal. */
export function ritmoMensual(tendenciaSemana) {
  return tendenciaSemana == null ? null : tendenciaSemana * 4.33;
}

export { tendenciaSemanal, media7, ultimosDias };
