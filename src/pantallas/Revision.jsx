/*
 * REVISIÓN DEL CUT · ¿Qué ha pasado? (§37 técnico, §54 visual).
 * Inicio · ahora · cambio. Tres salidas. Nunca se extiende automáticamente.
 */

import { useState } from "react";

import { decidirRevision } from "../logica/acciones.js";
import { fechaMedia } from "../logica/fechas.js";
import { conSigno, n0, n1 } from "../logica/formato.js";
import { DECISIONES, datosRevision } from "../logica/revision.js";
import { useCarreras, useCintura, useDiario, useSesiones } from "../ganchos/useDatos.js";
import { Boton, Volver } from "../componentes/Controles.jsx";

export default function Revision({ r, ajustes, ir, avisar }) {
  const diario = useDiario();
  const cintura = useCintura();
  const sesiones = useSesiones();
  const carreras = useCarreras();
  const d = datosRevision({ diario, cintura, sesiones, carreras, ajustes, hoy: r.hoy });
  const [elegida, setElegida] = useState(null);
  const yaDecidido = !!ajustes.decisionRevision;
  const antes = r.hoy < r.fechas.fin;

  const confirmar = async () => {
    await decidirRevision(elegida, r.nutricion.tdee);
    const t = DECISIONES.find((x) => x.id === elegida)?.texto;
    avisar(`Decisión guardada: ${t}.`);
    ir("plan", "plan");
  };

  const fmt = (v, dec) => (v == null ? "—" : dec === 0 ? n0(v) : n1(v));
  return (
    <>
      <Volver texto="Plan" onClick={() => ir("plan", "plan")} />
      <div style={{ marginTop: -10 }}><div className="kicker">Revisión del cut · {fechaMedia(r.fechas.fin)}</div><div className="t" style={{ fontSize: 52, lineHeight: .95, textTransform: "uppercase" }}>¿Qué ha pasado?</div></div>
      {antes ? <div className="caja acento p13">Todavía no es {fechaMedia(r.fechas.fin)}. Puedes mirar los datos, pero la decisión se toma en la revisión (salvo síntomas claros, pérdida excesivamente rápida o problema médico).</div> : null}
      <div className="lista">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 70px 70px 70px", gap: 6, padding: "8px 0", borderBottom: "1px solid var(--linea)" }} className="etiqueta"><div>Desde {fechaMedia(d.inicio)}</div><div className="der">inicio</div><div className="der">ahora</div><div className="der">cambio</div></div>
        {d.filas.map((f) => (
          <div key={f.k} style={{ display: "grid", gridTemplateColumns: "1fr 70px 70px 70px", gap: 6, padding: "10px 0", borderBottom: "1px solid var(--linea)", alignItems: "center" }}>
            <div className="p14" style={{ fontWeight: 500 }}>{f.k}</div>
            <div className="der t tenue" style={{ fontSize: 18 }}>{fmt(f.a, f.dec)}</div>
            <div className="der t" style={{ fontSize: 18 }}>{fmt(f.b, f.dec)}</div>
            <div className="der t acento" style={{ fontSize: 18 }}>{f.d == null ? "—" : conSigno(f.d, f.dec)}</div>
          </div>
        ))}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 70px 70px 70px", gap: 6, padding: "10px 0", borderBottom: "1px solid var(--linea)", alignItems: "center" }}><div className="p14" style={{ fontWeight: 500 }}>Fuerza · sesiones</div><div className="der t tenue" style={{ fontSize: 18 }}>4/sem</div><div className="der t" style={{ fontSize: 18 }}>{n1(d.sesionesPorSemana)}/sem</div><div className="der t acento" style={{ fontSize: 18 }}>{d.sesionesCut} ses.</div></div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 70px 70px 70px", gap: 6, padding: "10px 0", borderBottom: "1px solid var(--linea)", alignItems: "center" }}><div className="p14" style={{ fontWeight: 500 }}>Adherencia 28 d</div><div className="der t tenue" style={{ fontSize: 18 }}>≥85 %</div><div className="der t" style={{ fontSize: 18 }}>{Math.round(d.adherencia28 * 100)} %</div><div className="der t acento" style={{ fontSize: 18 }}>{d.carrerasCut} runs</div></div>
      </div>
      <div className="p12 tenue">Columnas: inicio · ahora · cambio. Fotos y rendimiento se valoran a mano (PROGRESO → Fotos / Fuerza). La fecha es una revisión obligatoria, no una orden automática.</div>
      <div className="caja p13 medio">TDEE {r.nutricion.tdee.valido ? `deducido ~${n0(r.nutricion.tdee.valor)} ±150 kcal` : "no deducido con validez: el mantenimiento arrancaría en el estimado (~2.850–3.000)"}{ajustes.tdeeReferencia ? ` · referencia aceptada ${n0(ajustes.tdeeReferencia)}` : ""}. El mantenimiento empieza ahí, sin restar 100 automáticamente.</div>
      {yaDecidido ? <div className="caja acento p13">Decisión tomada: <strong>{DECISIONES.find((x) => x.id === ajustes.decisionRevision)?.texto}</strong>.</div> : (
        <>
          <div className="kicker tenue">Decisión</div>
          <div className="columna">
            {DECISIONES.map((dd) => (
              <button key={dd.id} onClick={() => setElegida(dd.id)} className="t" style={{ minHeight: 64, width: "100%", textAlign: "left", padding: "12px 16px", background: elegida === dd.id ? "var(--acento)" : "transparent", color: elegida === dd.id ? "var(--tinta)" : "var(--acento)", border: "1px solid var(--acento)", fontSize: 20, letterSpacing: ".06em", textTransform: "uppercase", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                <span>{dd.texto}</span><span style={{ fontSize: 14, opacity: .7 }}>{dd.letra}</span>
              </button>
            ))}
          </div>
          {elegida ? <Boton variante="primario" className="mediano" onClick={confirmar}>Confirmar: {DECISIONES.find((x) => x.id === elegida).texto}</Boton> : null}
          {elegida === "EXTEND_CUT" ? <div className="p12 tenue">Extender añade 4 semanas y fija una nueva revisión obligatoria. Nunca indefinido.</div> : null}
        </>
      )}
    </>
  );
}
