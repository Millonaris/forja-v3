/*
 * Lectura en vivo. Todo sale de IndexedDB con `useLiveQuery`: si algo cambia
 * en una pantalla, las demás se enteran solas. Una sola fuente de verdad.
 */

import { useLiveQuery } from "dexie-react-hooks";
import { useMemo } from "react";

import { AJUSTES_INICIALES, db } from "../datos/db.js";
import { hoyISO, sumarDias } from "../logica/fechas.js";
import { calcularResumen } from "../logica/resumen.js";

export function useAjustes() {
  return useLiveQuery(async () => (await db.ajustes.get(1)) || AJUSTES_INICIALES, [], undefined);
}

export function useDiario(dias = 400) {
  return useLiveQuery(async () => db.diario.where("fecha").above(sumarDias(hoyISO(), -dias)).toArray(), [dias], []);
}

export function useCintura() {
  return useLiveQuery(async () => db.cintura.toArray(), [], []);
}

export function useSesiones() {
  return useLiveQuery(async () => db.sesionesFuerza.toArray(), [], []);
}

export function useSesion(id) {
  return useLiveQuery(async () => (id ? db.sesionesFuerza.get(id) : null), [id], undefined);
}

export function useCarreras() {
  return useLiveQuery(async () => db.carreras.toArray(), [], []);
}

export function useExtras() {
  return useLiveQuery(async () => db.extras.toArray(), [], []);
}

export function useFotos() {
  return useLiveQuery(async () => (await db.fotos.orderBy("fecha").reverse().toArray()) ?? [], [], []);
}

export function useHistorial() {
  return useLiveQuery(async () => (await db.historial.orderBy("fecha").reverse().toArray()) ?? [], [], []);
}

/** El resumen de todo, calculado una vez por cambio de datos. `null` mientras carga. */
export function useResumen(hoy = hoyISO()) {
  const ajustes = useAjustes();
  const diario = useDiario();
  const cintura = useCintura();
  const sesiones = useSesiones();
  const carreras = useCarreras();
  const extras = useExtras();
  return useMemo(() => {
    if (ajustes === undefined) return null;
    return calcularResumen({ hoy, ajustes, diario, cintura, sesiones, carreras, extras });
  }, [hoy, ajustes, diario, cintura, sesiones, carreras, extras]);
}
