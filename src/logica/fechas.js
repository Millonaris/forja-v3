/*
 * Fechas. Convención de toda la app: una fecha es SIEMPRE la cadena
 * "YYYY-MM-DD" en hora local. Nunca un Date ni UTC: así se comparan como texto
 * y no hay sorpresas con los cambios de hora.
 */

const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

export function aISO(fecha) {
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, "0");
  const d = String(fecha.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function hoyISO() {
  return aISO(new Date());
}

/** "YYYY-MM-DD" → Date a mediodía local (a mediodía para esquivar los cambios de hora). */
export function aFecha(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d, 12, 0, 0, 0);
}

export function sumarDias(iso, dias) {
  const f = aFecha(iso);
  f.setDate(f.getDate() + dias);
  return aISO(f);
}

/** Días entre dos fechas: positivo si `b` es posterior a `a`. */
export function diasEntre(a, b) {
  return Math.round((aFecha(b) - aFecha(a)) / 86400000);
}

/** "8 sep" */
export function fechaCorta(iso) {
  const f = aFecha(iso);
  return `${f.getDate()} ${MESES[f.getMonth()].slice(0, 3)}`;
}

/** "8 sep 2026" */
export function fechaMedia(iso) {
  const f = aFecha(iso);
  return `${f.getDate()} ${MESES[f.getMonth()].slice(0, 3)} ${f.getFullYear()}`;
}

/** "8 septiembre 2026" */
export function fechaLarga(iso) {
  const f = aFecha(iso);
  return `${f.getDate()} ${MESES[f.getMonth()]} ${f.getFullYear()}`;
}

/** "Martes, 8 septiembre" */
export function fechaConDia(iso) {
  const f = aFecha(iso);
  const dia = DIAS[f.getDay()];
  return `${dia[0].toUpperCase()}${dia.slice(1)}, ${f.getDate()} ${MESES[f.getMonth()]}`;
}

/** "Lun", "Mar"… */
export function diaCorto(iso) {
  const d = DIAS[aFecha(iso).getDay()];
  return `${d[0].toUpperCase()}${d.slice(1, 3)}`;
}

/** "hoy" / "ayer" / "hace 3 días" / "en 2 días". Contexto, nunca reproche. */
export function haceCuanto(iso, hoy = hoyISO()) {
  if (!iso) return "nunca";
  const d = diasEntre(iso, hoy);
  if (d === 0) return "hoy";
  if (d === 1) return "ayer";
  if (d < 0) return `en ${-d} ${-d === 1 ? "día" : "días"}`;
  return `hace ${d} días`;
}

/** Las fechas de los últimos `n` días, de la más antigua a `desde`. */
export function ultimosDias(n, desde = hoyISO()) {
  return Array.from({ length: n }, (_, i) => sumarDias(desde, i - n + 1));
}
