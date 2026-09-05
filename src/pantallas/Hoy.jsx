/*
 * HOY · ¿Qué hago ahora? (§6–§13 del visual, §57 del técnico).
 * Dos variantes del diseño: PANEL (tarjetas independientes) y FOCO (un bloque
 * amarillo con lo que toca y una lista de pendientes). Se elige en Ajustes.
 */

import { MENSAJES } from "../datos/config.js";
import { RUTINAS_CORTAS } from "../datos/rutinas.js";
import { fechaMedia } from "../logica/fechas.js";
import { conSigno, n0, n1 } from "../logica/formato.js";
import { Boton } from "../componentes/Controles.jsx";
import Marco from "../componentes/Marco.jsx";

function loQueToca(r, ir, abrirModal) {
  const f = r.fuerza;
  if (f.abierta) {
    return { kicker: "Sesión en curso", titulo: f.abierta.rutinaId.replace("_", " "), sub: "Tienes una sesión abierta. Termínala o cancélala.", meta: [], cta: "Continuar sesión", accion: () => ir("entrenar", "live", f.abierta.id), sec: null };
  }
  if (f.hechaHoy) {
    const sec = !r.extras.posturaHoy ? { cta: "Rutina corta de postura", accion: () => ir("entrenar", "rutina", "postura") } : r.extras.corePendiente ? { cta: "Core · pendiente esta semana", accion: () => ir("entrenar", "rutina", "core") } : null;
    return { kicker: "Sesión completada", titulo: "Hoy no tienes que forzar nada.", sub: `Descansa. La próxima sesión será ${f.rutina.nombre}.`, meta: ["Recuperación"], cta: "Ver progreso", accion: () => ir("progreso", "fuerza"), sec, chico: true };
  }
  const run = r.running.recomendacion;
  const sec = run.hacer ? { cta: `Running fácil — CaCo ${r.running.caco.codigo}`, accion: () => ir("entrenar", "running") } : null;
  return { kicker: "Próxima sesión", titulo: f.rutina.nombre, sub: f.rutina.musculos, meta: [`${f.porRutina.find((x) => x.id === f.siguiente).total} series`, "RIR 1–2", f.rutina.duracion], cta: "Empezar entrenamiento", accion: () => ir("entrenar", "sesion", f.siguiente), sec };
}

export default function Hoy({ r, ajustes, ir, abrirModal }) {
  const foco = ajustes.varianteHoy === "foco";
  const main = loQueToca(r, ir, abrirModal);
  const rec = r.nutricion.recHoy;
  const recHecha = !r.pendientes.recuperacion;

  return (
    <>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12 }}>
        <div>
          <div className="t" style={{ fontSize: 40, lineHeight: 1, letterSpacing: ".02em", color: "var(--acento)" }}>FORJA</div>
          <div className="t" style={{ fontSize: 18, letterSpacing: ".1em", textTransform: "uppercase", marginTop: 6 }}>{r.etiqueta}</div>
        </div>
        <div className="der p12 tenue" style={{ lineHeight: 1.35 }}>
          {r.fase === "PRE_CUT" || r.fase === "CUT" ? <>Inicio {fechaMedia(r.fechas.inicioCut)}<br />Revisión {fechaMedia(r.fechas.fin)}</> : <>Desde {fechaMedia(r.inicio)}<br />{r.sub === "ACTIVE" ? "Activo" : r.sub === "TRANSITION" ? "Sin confirmar" : r.sub === "REVIEW_DUE" ? "Revisión pendiente" : "Datos insuficientes"}</>}
        </div>
      </div>
      <p className="medio" style={{ margin: "-6px 0 0" }}>
        {r.fase === "PRE_CUT" ? <strong style={{ color: "var(--texto)" }}>{r.objetivo}</strong> : <>Objetivo actual: <strong style={{ color: "var(--texto)" }}>{r.objetivo}</strong></>}
      </p>

      {r.aviso.mostrar ? (
        <div className="aviso">
          <div className="titulo">{r.aviso.titulo}</div>
          <div className="p13">Peso · cintura · fotos · fuerza · hambre · energía · sueño</div>
          {r.aviso.esDiaRevision ? <Boton variante="tinta" onClick={() => ir("plan", "revision")} style={{ marginTop: 8 }}>Abrir revisión del cut</Boton> : null}
        </div>
      ) : null}

      {r.alertas.filter((a) => a.id !== "revision" && a.id !== "cintura").map((a) => (
        <div key={a.id} className="caja acento p13"><strong>{a.tipo === "deload" || a.id === "deload" ? "Descarga sugerida. " : ""}</strong>{a.texto}{a.id === "deload" ? " FORJA no lo hace sin tu confirmación." : ""}</div>
      ))}

      {!foco ? (
        <>
          <Marco style={{ padding: "18px 16px 16px" }}>
            <div className="kicker">{main.kicker}</div>
            <div className="t" style={{ fontSize: main.chico ? 30 : 46, lineHeight: main.chico ? 1.05 : .95, textTransform: main.chico ? "none" : "uppercase" }}>{main.titulo}</div>
            <div className="p14 medio">{main.sub}</div>
            {main.meta.length ? <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 4 }}>{main.meta.map((m) => <span key={m} className="chip">{m}</span>)}</div> : null}
            <Boton variante="primario" onClick={main.accion} style={{ marginTop: 12 }}>{main.cta}</Boton>
            {main.sec ? <Boton variante="secundario" onClick={main.sec.accion}>{main.sec.cta}</Boton> : null}
          </Marco>

          <div className="rejilla-2">
            <Marco onClick={() => abrirModal("cierre")} style={{ padding: 14 }}>
              <div className="kicker">Nutrición</div>
              <div className="num num-36">{n0(r.kcal)} <span className="unidad">kcal</span></div>
              <div className="p13 medio" style={{ lineHeight: 1.5 }}>{r.macros.p} g proteína<br />{r.macros.c} g carbohidratos<br />{r.macros.g} g grasa</div>
              <div className="t acento" style={{ marginTop: "auto", fontSize: 15, letterSpacing: ".06em", textTransform: "uppercase" }}>{r.pendientes.cierre ? "Cerrar el día →" : `Cerrado · ${n0(rec.kcal)} kcal →`}</div>
            </Marco>
            <Marco onClick={() => abrirModal("peso")} style={{ padding: 14 }}>
              <div className="kicker">Peso de hoy</div>
              <div className="num num-36">{r.peso.hoy ? n1(r.peso.hoy.kg) : "—"} <span className="unidad">kg</span>{r.peso.hoy?.dudosa ? <span className="p12 tenue"> dudosa</span> : null}</div>
              <div className="p13 medio" style={{ lineHeight: 1.5 }}>Media 7 días <strong style={{ color: "var(--texto)" }}>{n1(r.peso.media7)}</strong><br />Semanal <strong style={{ color: "var(--texto)" }}>{r.peso.tendencia != null ? conSigno(r.peso.tendencia) + " kg" : "—"}</strong></div>
              <div className="t acento" style={{ marginTop: "auto", fontSize: 15, letterSpacing: ".06em", textTransform: "uppercase" }}>{r.peso.hoy ? "Editar" : "Registrar"} →</div>
            </Marco>
          </div>

          <Marco>
            <div className="entre">
              <div className="kicker">Recuperación</div>
              <div className="p12 tenue">{recHecha ? "Registrado hoy" : "Pendiente"}</div>
            </div>
            <div className="rejilla-4">
              {[["hambre", rec?.hambre], ["energía", rec?.energia], ["sueño h", rec?.suenoHoras != null ? n1(rec.suenoHoras) : null], ["calidad", rec?.suenoCalidad]].map(([k, v]) => (
                <div key={k} className="centro"><div className="num num-28">{v ?? "—"}</div><div className="etiqueta">{k}</div></div>
              ))}
            </div>
            <Boton variante="secundario" onClick={() => abrirModal("recup")}>{recHecha ? "Editar recuperación" : "Registrar recuperación"}</Boton>
            <div className="p12 tenue">{MENSAJES.recuperacionImporta}</div>
          </Marco>

          <Marco onClick={() => abrirModal("cintura")} style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
            <div style={{ flex: 1 }}>
              <div className="kicker">Cintura · semanal</div>
              <div className="p14 medio" style={{ marginTop: 2 }}>{r.cintura.toca ? "Toca medir cintura esta semana." : `Medida el ${fechaMedia(r.cintura.ultima.fecha).replace(/ \d{4}$/, "")} · próxima en ${7 - Math.min(7, Math.round((new Date(r.hoy + "T12:00") - new Date(r.cintura.ultima.fecha + "T12:00")) / 864e5))} días`}</div>
            </div>
            <div className="der"><div className="num" style={{ fontSize: 32 }}>{r.cintura.ultima ? n1(r.cintura.ultima.cm) + " cm" : "—"}</div><div className="p12 tenue">{r.cintura.delta != null ? conSigno(r.cintura.delta) + " cm desde inicio" : "sin referencia"}</div></div>
          </Marco>
          <div className="nota">{r.peso.mensaje || MENSAJES.tendencias}</div>
        </>
      ) : (
        <>
          <div onClick={main.accion} style={{ position: "relative", background: "var(--acento)", color: "var(--tinta)", padding: "22px 18px 18px", display: "flex", flexDirection: "column", gap: 4, cursor: "pointer", margin: "0 -18px" }}>
            <div className="t" style={{ fontSize: 13, letterSpacing: ".18em", textTransform: "uppercase" }}>{main.kicker}</div>
            <div className="t" style={{ fontSize: main.chico ? 40 : 72, lineHeight: .9, textTransform: main.chico ? "none" : "uppercase", letterSpacing: "-.01em" }}>{main.titulo}</div>
            <div style={{ fontSize: 15, fontWeight: 500, marginTop: 6 }}>{main.sub}</div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14, borderTop: "1px solid rgba(0,0,0,.25)", paddingTop: 12 }}>
              <div className="t" style={{ fontSize: 22, letterSpacing: ".06em", textTransform: "uppercase" }}>{main.cta}</div>
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#0A0A0B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </div>
          </div>
          {main.sec ? <Boton variante="secundario" onClick={main.sec.accion} style={{ height: 56 }}>{main.sec.cta}</Boton> : null}
          <div className="kicker tenue" style={{ marginTop: 4 }}>Datos de hoy</div>
          <div className="lista">
            {[
              { titulo: "Peso", sub: r.peso.hoy ? `Media 7 d ${n1(r.peso.media7)} · semanal ${r.peso.tendencia != null ? conSigno(r.peso.tendencia) : "—"}` : "Pendiente · tras orinar, antes de comer", valor: r.peso.hoy ? n1(r.peso.hoy.kg) : "—", unidad: "kg", hecho: !!r.peso.hoy, on: () => abrirModal("peso") },
              { titulo: "Recuperación", sub: recHecha ? `Hambre ${rec.hambre} · energía ${rec.energia} · calidad ${rec.suenoCalidad}` : "Pendiente · hambre, energía, sueño", valor: recHecha ? n1(rec.suenoHoras) : "—", unidad: "h", hecho: recHecha, on: () => abrirModal("recup") },
              { titulo: "Cintura", sub: r.cintura.toca ? "Toca medir cintura esta semana." : `Medida ${fechaMedia(r.cintura.ultima.fecha)} · ${r.cintura.delta != null ? conSigno(r.cintura.delta) + " cm desde inicio" : ""}`, valor: r.cintura.ultima ? n1(r.cintura.ultima.cm) : "—", unidad: "cm", hecho: !r.cintura.toca, on: () => abrirModal("cintura") },
              { titulo: "Nutrición", sub: r.pendientes.cierre ? `${r.macros.p} P · ${r.macros.c} C · ${r.macros.g} G · cierra el día con el total` : `Cerrado · ${n0(rec.kcal)} kcal · ${rec.proteinaG ?? "–"} P`, valor: n0(r.kcal), unidad: "kcal", hecho: !r.pendientes.cierre, on: () => abrirModal("cierre") },
            ].map((c) => (
              <div key={c.titulo} className="fila pulsable" style={{ minHeight: 68, gap: 14 }} onClick={c.on}>
                <div style={{ width: 14, height: 14, border: "1.5px solid var(--acento)", background: c.hecho ? "var(--acento)" : "transparent", flex: "none" }} />
                <div className="crece"><div className="t" style={{ fontSize: 20, letterSpacing: ".04em", textTransform: "uppercase", lineHeight: 1.1 }}>{c.titulo}</div><div className="p13 tenue">{c.sub}</div></div>
                <div className="num" style={{ fontSize: 26, textAlign: "right" }}>{c.valor}<span className="p13 tenue" style={{ marginLeft: 3 }}>{c.unidad}</span></div>
              </div>
            ))}
          </div>
          <div className="nota">{MENSAJES.totalDelDia}</div>
        </>
      )}
      {(r.extras.corePendiente || !r.extras.posturaHoy) && !main.sec && !main.chico ? (
        <div className="p12 tenue centro">Rutina corta disponible: {!r.extras.posturaHoy ? <a onClick={() => ir("entrenar", "rutina", "postura")}>{RUTINAS_CORTAS.postura.nombre}</a> : null}{!r.extras.posturaHoy && r.extras.corePendiente ? " · " : ""}{r.extras.corePendiente ? <a onClick={() => ir("entrenar", "rutina", "core")}>Core ({r.extras.coreSemana}/2 esta semana)</a> : null}</div>
      ) : null}
    </>
  );
}
