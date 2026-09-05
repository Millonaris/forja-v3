/*
 * Copia de seguridad: un único JSON con todo. Los datos viven solo en este
 * móvil; sin copia no hay datos. Importar NO borra: fusiona sobre lo que haya.
 */

import { db } from "../datos/db.js";
import { hoyISO } from "../logica/fechas.js";
import { aBlob, aDataUrl } from "./imagenes.js";

export const VERSION_COPIA = 3;
const TABLAS = ["ajustes", "diario", "cintura", "sesionesFuerza", "carreras", "extras", "fotos", "historial"];
const AUTONUMERICAS = ["sesionesFuerza", "carreras", "extras", "fotos", "historial"];

export async function construirCopia() {
  const datos = {};
  for (const t of TABLAS) datos[t] = await db[t].toArray();
  datos.fotos = await Promise.all(datos.fotos.map(async (f) => ({ ...f, imagen: f.imagen ? await aDataUrl(f.imagen) : null })));
  return { app: "FORJA", version: 3, schemaVersion: VERSION_COPIA, exportado: new Date().toISOString(), datos };
}

export async function exportar() {
  const copia = await construirCopia();
  const blob = new Blob([JSON.stringify(copia)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `forja3-${hoyISO()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  await db.ajustes.update(1, { ultimaCopia: hoyISO() });
  return copia;
}

export async function importar(texto) {
  const copia = JSON.parse(texto);
  if (copia.app !== "FORJA" || !copia.datos) throw new Error("Ese fichero no es una copia de FORJA.");
  const cuentas = {};
  await db.transaction("rw", TABLAS.map((t) => db[t]), async () => {
    const hayLocales = (await Promise.all(AUTONUMERICAS.map((t) => db[t].count()))).some((n) => n > 0);
    for (const t of TABLAS) {
      const filas = copia.datos[t];
      if (!Array.isArray(filas) || !filas.length) continue;
      cuentas[t] = filas.length;
      const listas = t === "fotos" ? await Promise.all(filas.map(async (f) => ({ ...f, imagen: typeof f.imagen === "string" ? await aBlob(f.imagen) : f.imagen }))) : filas;
      if (!hayLocales || !AUTONUMERICAS.includes(t)) {
        await db[t].bulkPut(listas);
      } else {
        for (const fila of listas) {
          const { id: _id, ...resto } = fila;
          await db[t].add(resto);
        }
      }
    }
  });
  return { exportado: copia.exportado, cuentas };
}

export async function inventario() {
  return { dias: await db.diario.count(), cintura: await db.cintura.count(), sesiones: await db.sesionesFuerza.count(), carreras: await db.carreras.count(), fotos: await db.fotos.count() };
}

/** Borra TODO. Solo desde Ajustes y con confirmación. */
export async function borrarTodo() {
  await db.transaction("rw", TABLAS.map((t) => db[t]), async () => {
    for (const t of TABLAS) await db[t].clear();
  });
}
