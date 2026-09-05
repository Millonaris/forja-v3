/*
 * AJUSTES · copia de seguridad, variante de HOY, fechas del cut, historial,
 * versión. Lo que no es entrenar ni decidir.
 */

import { useRef, useState } from "react";

import { fijarFechasCut, fijarVariante } from "../logica/acciones.js";
import { diasEntre, fechaMedia, hoyISO } from "../logica/fechas.js";
import { useHistorial } from "../ganchos/useDatos.js";
import { borrarTodo, exportar, importar, inventario } from "../utiles/copiaSeguridad.js";
import { Boton, Campo, Segmentos, Volver } from "../componentes/Controles.jsx";

export default function Ajustes({ r, ajustes, ir, avisar }) {
  const historial = useHistorial();
  const fichero = useRef(null);
  const [inv, setInv] = useState(null);
  const [fin, setFin] = useState(ajustes.finProvisional);
  const [aviso, setAviso] = useState(ajustes.avisoPreRevision);
  const [confirmarBorrado, setConfirmarBorrado] = useState(false);
  const diasSinCopia = ajustes.ultimaCopia ? diasEntre(ajustes.ultimaCopia, hoyISO()) : null;

  const alImportar = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    try { const res = await importar(await f.text()); avisar(`Copia restaurada (${Object.values(res.cuentas).reduce((a, b) => a + b, 0)} registros).`); } catch (err) { avisar(err.message); }
  };

  return (
    <>
      <Volver texto="Plan" onClick={() => ir("plan", "plan")} />
      <div className="titulo-xl" style={{ marginTop: -10 }}>Ajustes</div>

      <div className="kicker tenue">Copia de seguridad</div>
      <div className="p13 medio">Todo vive en este móvil. {diasSinCopia == null ? "Nunca has hecho copia." : diasSinCopia === 0 ? "Copia hecha hoy." : `Última copia hace ${diasSinCopia} días.`}</div>
      <div style={{ display: "flex", gap: 10 }}>
        <Boton variante="secundario" onClick={async () => { await exportar(); avisar("Copia descargada."); }} style={{ flex: 1 }}>Exportar</Boton>
        <Boton variante="neutro" onClick={() => fichero.current?.click()} style={{ flex: 1, height: 52 }}>Importar</Boton>
        <input ref={fichero} type="file" accept="application/json" style={{ display: "none" }} onChange={alImportar} />
      </div>
      <Boton variante="chip" onClick={async () => setInv(await inventario())}>Ver inventario</Boton>
      {inv ? <div className="p12 tenue">{inv.dias} días · {inv.cintura} cinturas · {inv.sesiones} sesiones · {inv.carreras} carreras · {inv.fotos} fotos</div> : null}

      <div className="kicker tenue">Pantalla HOY</div>
      <Segmentos opciones={[{ id: "panel", texto: "Panel" }, { id: "foco", texto: "Foco" }]} valor={ajustes.varianteHoy} onChange={async (v) => { await fijarVariante(v); avisar(v === "foco" ? "HOY en modo foco." : "HOY en modo panel."); }} />
      <div className="p12 tenue">Panel: tarjetas independientes. Foco: un bloque amarillo con lo que toca y la lista de pendientes.</div>

      {r.fase === "CUT" || r.fase === "PRE_CUT" ? (
        <>
          <div className="kicker tenue">Fechas del cut</div>
          <div className="rejilla-2">
            <Campo etiqueta="Revisión provisional"><input className="input texto" type="date" value={fin} onChange={(e) => setFin(e.target.value)} /></Campo>
            <Campo etiqueta="Aviso previo"><input className="input texto" type="date" value={aviso} onChange={(e) => setAviso(e.target.value)} /></Campo>
          </div>
          <Boton variante="chip" onClick={async () => { await fijarFechasCut({ finProvisional: fin, avisoPreRevision: aviso }); avisar("Fechas guardadas."); }}>Guardar fechas</Boton>
          <div className="p12 tenue">Inicio oficial fijo: {fechaMedia(r.fechas.inicioCut)}. La revisión es obligatoria: la fecha se puede mover, no quitar.</div>
        </>
      ) : null}

      <div className="kicker tenue">Historial de decisiones</div>
      <div className="lista">
        {historial.length ? historial.map((h) => <div key={h.id} className="fila"><div className="p12 tenue" style={{ width: 70 }}>{fechaMedia(h.fecha)}</div><div className="crece p13">{h.texto}</div></div>) : <div className="fila p13 tenue">Sin cambios todavía. Aquí quedan los cambios de kcal y de fase.</div>}
      </div>

      <div className="kicker tenue">Zona peligrosa</div>
      {!confirmarBorrado ? <Boton variante="peligro" onClick={() => setConfirmarBorrado(true)}>Borrar todos los datos</Boton> : (
        <div className="caja columna" style={{ borderColor: "var(--rojo)" }}>
          <div className="p13">Se borra TODO: pesos, sesiones, carreras, fotos y ajustes. Haz una copia antes. ¿Seguro?</div>
          <div style={{ display: "flex", gap: 10 }}><Boton variante="neutro" onClick={() => setConfirmarBorrado(false)} style={{ flex: 1, height: 48 }}>No</Boton><Boton variante="peligro" onClick={async () => { await borrarTodo(); setConfirmarBorrado(false); avisar("Todo borrado."); ir("hoy"); }} style={{ flex: 1, height: 48 }}>Sí, borrar todo</Boton></div>
        </div>
      )}

      <div className="p12 tenue centro">FORJA {typeof __VERSION_FORJA__ !== "undefined" ? __VERSION_FORJA__ : "3.0"} · compilada {typeof __FECHA_FORJA__ !== "undefined" ? __FECHA_FORJA__ : "—"} · datos solo en este móvil</div>
    </>
  );
}
