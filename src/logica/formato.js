/** Números en español: coma decimal, punto de miles. */

export function n1(v) {
  if (v == null || Number.isNaN(v)) return "—";
  return (Math.round(v * 10) / 10).toLocaleString("es-ES", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

/** Con punto de miles siempre ("2.400"), como en el diseño. */
export function n0(v) {
  if (v == null || Number.isNaN(v)) return "—";
  const n = Math.round(v);
  const s = String(Math.abs(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return (n < 0 ? "−" : "") + s;
}

/** "+0,3" / "−0,5" / "±0,0" */
export function conSigno(v, dec = 1) {
  if (v == null || Number.isNaN(v)) return "—";
  const f = dec === 0 ? n0 : n1;
  return (v > 0.0001 ? "+" : v < -0.0001 ? "−" : "±") + f(Math.abs(v));
}

/** 125 → "2:05" */
export function mmss(segundos) {
  const m = Math.floor(segundos / 60);
  const s = Math.max(0, Math.round(segundos % 60));
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** "8-12" → "8–12" */
export function rango(reps) {
  return String(reps).replace("-", "–");
}

/** "70 kg" / "72,5 kg" */
export function kg(v) {
  if (v == null) return "—";
  return `${n1(v).replace(",0", "")} kg`;
}
