/*
 * PLAN · ¿Qué estamos intentando conseguir y cómo decidimos? (§31–§40 del
 * visual, §59 del técnico). Fase, dieta, reparto, reglas, TDEE, fases futuras.
 */

import { HIDRATACION, MENSAJES, NOMBRE_FASE, PRIORIDADES, PROHIBICIONES, PROTEINA_RANGO, REPARTO_COMIDAS, SUPLEMENTOS, TDEE_ESTIMADO } from "../datos/config.js";
import { aceptarTdee, confirmarMantenimiento, volverAMantenimiento } from "../logica/acciones.js";
import { posicionAviso, progresoCut, TEXTO_SUBESTADO } from "../logica/fase.js";
import { fechaCorta, fechaLarga, fechaMedia } from "../logica/fechas.js";
import { conSigno, n0, n1 } from "../logica/formato.js";
import { Boton, Semaforo } from "../componentes/Controles.jsx";
import Marco from "../componentes/Marco.jsx";

const TEXTO_ACCION = { MANTENER: "Mantener", ESPERAR: "Esperar", CONSIDERAR_MENOS: "Considerar −100 a −150 kcal", CONSIDERAR_MAS: "Considerar +100 a +150 kcal" };

export default function Plan({ r, ajustes, ir, abrirModal, avisar }) {
  const enCut = r.fase === "CUT" || r.fase === "PRE_CUT";
  const tdee = r.nutricion.tdee;
  const sug = r.nutricion.sugerencia;
  return (
    <>
      <div className="entre"><div className="titulo-xl">Plan</div><Boton variante="chip" onClick={() => ir("plan", "ajustes")}>Ajustes</Boton></div>

      <Marco acentuado style={{ padding: 16, gap: 8 }}>
        <div className="kicker">Fase actual{enCut ? " · ~12 semanas" : ""} · {TEXTO_SUBESTADO[r.sub]}</div>
        <div className="t" style={{ fontSize: 52, lineHeight: .95, textTransform: "uppercase" }}>{NOMBRE_FASE[r.fase]}</div>
        <div className="p14 medio">
          {r.fase === "PRE_CUT" ? "Hasta el 7 de septiembre no se juzga la dieta. Inicio limpio el martes 8 de septiembre de 2026." : null}
          {r.fase === "CUT" ? `Verse claramente más definido manteniendo el máximo músculo y rendimiento posible. Ritmo orientativo ~0,4–0,6 %/semana (~${n1(r.kgRef * 0.004)}–${n1(r.kgRef * 0.006)} kg).` : null}
          {r.fase === "MAINTENANCE" ? "Estabilizar el nuevo peso y confirmar el mantenimiento: tendencia ±0,20 kg/semana, cintura estable, actividad comparable, durante varias semanas." : null}
          {r.fase === "GAIN" ? "Superávit pequeño (+150–200 kcal). Ritmo deseado +0,25–0,45 kg/mes. Revisión cada ~4 semanas." : null}
          {r.fase === "MINI_CUT" ? "Corregir grasa acumulada en 4–6 semanas con el mantenimiento conocido como referencia." : null}
        </div>
        {enCut ? (
          <>
            <div className="barra" style={{ marginTop: 6 }}><div className="relleno" style={{ width: `${progresoCut(ajustes, r.hoy)}%` }} /><div className="marca" style={{ left: `${posicionAviso(ajustes)}%` }} /></div>
            <div className="entre etiqueta"><span>{fechaCorta(r.fechas.inicioCut)} · inicio</span><span>{fechaCorta(r.fechas.aviso)} · aviso</span><span>{fechaCorta(r.fechas.fin)} · revisión</span></div>
          </>
        ) : <div className="p12 tenue">Desde {fechaLarga(r.inicio)} · día {r.diaFase}</div>}
        {r.fase === "MAINTENANCE" ? (
          <div className="columna" style={{ marginTop: 6 }}>
            <div className="p13">{ajustes.mantenimientoConfirmado ? <><strong className="verde">Mantenimiento confirmado</strong> el {fechaMedia(ajustes.mantenimientoConfirmado)} a {n0(ajustes.mantenimientoKcal || ajustes.kcalObjetivo)} kcal.</> : <>Confirmable: <strong className={r.mantenimiento?.ok ? "verde" : "acento"}>{r.mantenimiento?.ok ? "sí" : "todavía no"}</strong> · {r.mantenimiento?.motivo}</>}</div>
            {!ajustes.mantenimientoConfirmado && r.mantenimiento?.ok ? <Boton variante="secundario" onClick={async () => { await confirmarMantenimiento(); avisar("Mantenimiento confirmado."); }}>Confirmar mantenimiento</Boton> : null}
            {ajustes.mantenimientoConfirmado ? <div style={{ display: "flex", gap: 8 }}><Boton variante="secundario" onClick={() => abrirModal("ganancia")} style={{ flex: 1 }}>Empezar ganancia</Boton><Boton variante="chip" onClick={() => abrirModal("minicut")}>Mini-cut</Boton></div> : null}
            {ajustes.segundoBloquePendiente ? <div className="p12 tenue">Segundo bloque de definición pendiente: cuando el mantenimiento esté confirmado, se arranca como mini-cut o cut desde aquí.</div> : null}
          </div>
        ) : null}
        {r.fase === "GAIN" ? (
          <div className="columna" style={{ marginTop: 6 }}>
            <div className="p13">Ritmo actual: <strong>{r.peso.tendencia != null ? conSigno(r.peso.tendencia * 4.33) + " kg/mes" : "—"}</strong> · {r.ganancia?.accion.replace("_", " ").toLowerCase()} · {r.ganancia?.motivo}</div>
            <div style={{ display: "flex", gap: 8 }}><Boton variante="chip" onClick={() => abrirModal("kcal")}>Ajustar kcal</Boton><Boton variante="chip" onClick={() => abrirModal("minicut")}>Mini-cut</Boton><Boton variante="chip" onClick={async () => { await volverAMantenimiento(); avisar("De vuelta a mantenimiento."); }}>Volver a mantenimiento</Boton></div>
          </div>
        ) : null}
        {r.fase === "MINI_CUT" ? <div style={{ display: "flex", gap: 8, marginTop: 6 }}><Boton variante="chip" onClick={async () => { await volverAMantenimiento(); avisar("Mini-cut terminado: mantenimiento."); }}>Terminar mini-cut</Boton></div> : null}
      </Marco>

      <Marco style={{ padding: 16, gap: 8 }}>
        <div className="entre"><div className="kicker">Dieta {r.fase === "CUT" ? "del cut" : `de ${NOMBRE_FASE[r.fase].toLowerCase()}`}</div><div className="p12 tenue">Objetivo diario, no examen</div></div>
        <div className="num" style={{ fontSize: 46 }}>{n0(r.kcal)} <span className="unidad" style={{ fontSize: 18 }}>kcal/día</span></div>
        <div className="rejilla-3" style={{ gap: 8, textAlign: "center" }}>
          <div className="caja" style={{ padding: "10px 4px" }}><div className="num num-28">{r.macros.p}<span className="unidad" style={{ fontSize: 14 }}> g</span></div><div className="etiqueta">proteína</div><div className="p12 medio">{PROTEINA_RANGO.min}–{PROTEINA_RANGO.max} ok</div></div>
          <div className="caja" style={{ padding: "10px 4px" }}><div className="num num-28">{r.macros.c}<span className="unidad" style={{ fontSize: 14 }}> g</span></div><div className="etiqueta">carbos</div><div className="p12 medio">ajusta el resto</div></div>
          <div className="caja" style={{ padding: "10px 4px" }}><div className="num num-28">{r.macros.g}<span className="unidad" style={{ fontSize: 14 }}> g</span></div><div className="etiqueta">grasa</div><div className="p12 medio">cerca</div></div>
        </div>
        <div className="p13 medio">Mismo objetivo todos los días. No se añaden kcal por gym o CaCo. No se comen “las calorías del Garmin”. {r.nutricion.diasDesdeCambio < 0 ? `Objetivo vigente desde el ${fechaMedia(ajustes.ultimoCambioKcal)}.` : `Último cambio: ${fechaMedia(ajustes.ultimoCambioKcal)} (hace ${r.nutricion.diasDesdeCambio} días).`}</div>
        <div className="caja columna" style={{ gap: 6 }}>
          <div className="p13"><strong>Sugerencia de FORJA: {TEXTO_ACCION[sug.accion]}.</strong> {sug.motivo}</div>
          {sug.mensaje ? <div className="p12 tenue">{sug.mensaje}</div> : null}
          <Boton variante="chip" onClick={() => abrirModal("kcal")}>Cambiar kcal a mano</Boton>
        </div>
      </Marco>

      <Marco style={{ padding: 16, gap: 8 }}>
        <div className="entre"><div className="kicker">TDEE</div><div className="p12 tenue">{tdee.estado === "DEDUCED" ? "DEDUCIDO" : "ESTIMADO"}</div></div>
        <div className="num" style={{ fontSize: 36 }}>{tdee.valido ? `~${n0(tdee.valor)} ±150` : `~${n0(TDEE_ESTIMADO.min)}–${n0(TDEE_ESTIMADO.max)}`} <span className="unidad">kcal</span></div>
        {tdee.valido ? <div className="p13 medio">Deducido de {n0(tdee.mediaKcal)} kcal medias y {conSigno(tdee.tendencia)} kg/semana en 3 semanas ({tdee.diasValidos} días válidos, adherencia {Math.round(tdee.adherencia * 100)} %).</div> : <div className="p13 medio">Estimación provisional. Para deducirlo hacen falta: {tdee.motivos.join(" ")}</div>}
        {ajustes.tdeeReferencia ? <div className="p12 tenue">Referencia aceptada: {n0(ajustes.tdeeReferencia)} kcal.</div> : null}
        {tdee.valido && ajustes.tdeeReferencia !== tdee.valor ? <Boton variante="chip" onClick={async () => { await aceptarTdee(tdee.valor); avisar(`TDEE de referencia: ${n0(tdee.valor)} kcal.`); }}>Aceptar como referencia</Boton> : null}
        <div className="p12 tenue">FORJA nunca asume que el TDEE estimado es real.</div>
      </Marco>

      <Semaforo color={r.nutricion.semaforo.color}><strong style={{ color: "var(--texto)" }}>Semáforo nutricional: {r.nutricion.semaforo.color.toLowerCase()}.</strong> {r.nutricion.semaforo.texto}</Semaforo>

      <div className="kicker tenue">Reparto habitual</div>
      <div className="lista">
        {REPARTO_COMIDAS.map((c) => <div key={c.hora} className="fila" style={{ gap: 14, padding: "9px 0" }}><div className="t" style={{ width: 90, fontSize: 18, color: c.destacado ? "var(--acento)" : undefined }}>{c.hora}</div><div className="p14" style={{ color: c.destacado ? "var(--acento)" : undefined }}>{c.que}</div></div>)}
      </div>
      <div className="rejilla-3">
        <div className="caja" style={{ padding: 10 }}><div className="etiqueta">Líquidos</div><div className="t" style={{ fontSize: 22, lineHeight: 1.1 }}>{HIDRATACION.replace("~", "").replace(" líquidos/día", "")}</div></div>
        {SUPLEMENTOS.slice(0, 1).map((s) => <div key={s.nombre} className="caja" style={{ padding: 10 }}><div className="etiqueta">{s.nombre}</div><div className="t" style={{ fontSize: 22, lineHeight: 1.1 }}>{s.pauta}</div></div>)}
        <div className="caja" style={{ padding: 10 }}><div className="etiqueta">Whey · cafeína</div><div className="t" style={{ fontSize: 22, lineHeight: 1.1 }}>opcional</div></div>
      </div>

      <div className="kicker tenue">Prioridades</div>
      <div className="lista">
        {PRIORIDADES.map((p, i) => <div key={p.id} className="fila" style={{ gap: 14 }}><div className="t acento" style={{ fontSize: 22, width: 26 }}>{i + 1}</div><div className="crece"><div className="t" style={{ fontSize: 18, textTransform: "uppercase" }}>{p.titulo}</div><div className="p12 tenue">{p.texto}</div></div></div>)}
      </div>

      <div className="kicker tenue">Reglas de decisión</div>
      <div className="columna">
        <div className="caja"><div className="titulo-s">Tendencias, no pesadas</div><div className="p13 medio">Nunca se cambian kcal por un día. Sin datos suficientes, FORJA no ajusta el plan. Mínimo 14 días entre cambios, adherencia ≥85 %, y siempre de 100 en 100.</div></div>
        <div className="caja"><div className="titulo-s">Hipertrofia manda sobre running</div><div className="p13 medio">Si el running interfiere con piernas, fuerza o recuperación, se congela su progresión.</div></div>
        <div className="caja"><div className="titulo-s">Descargas por señales, no por calendario</div><div className="p13 medio">Regresión repetida, fatiga, sueño peor o molestias → FORJA sugiere; tú confirmas.</div></div>
        <div className="caja"><div className="titulo-s">Comidas sociales</div><div className="p13 medio">{MENSAJES.comidaSocial} Sin ayuno punitivo ni cardio de castigo.</div></div>
        <div className="caja"><div className="titulo-s">medir → observar → comparar → decidir</div><div className="p13 medio">Nunca reaccionar → cambiar → volver a reaccionar. El físico de hipertrofia tiene prioridad sobre el running.</div></div>
      </div>

      <div className="kicker tenue">Después del cut</div>
      <div className="lista">
        {[["1", "Mantenimiento", "Estabilizar el nuevo peso · ~2–3 semanas, ampliable · arranca en el último TDEE deducido válido"], ["2", "Ganancia muscular", "+150–200 kcal/día · ~0,25–0,45 kg/mes · revisión cada ~4 semanas"], ["3", "Mini-cut (solo si hace falta)", "4–6 semanas · si la cintura sube demasiado o se pierde definición"]].map(([n, t, s]) => (
          <div key={n} className="fila" style={{ gap: 14 }}><div className="t acento" style={{ fontSize: 22, width: 26 }}>{n}</div><div className="crece"><div className="t" style={{ fontSize: 18, textTransform: "uppercase" }}>{t}</div><div className="p12 tenue">{s}</div></div></div>
        ))}
      </div>
      {enCut ? <Boton variante="secundario" onClick={() => ir("plan", "revision")} style={{ height: 56 }}>{r.aviso.esDiaRevision ? "Abrir revisión del cut" : `Ver pantalla de revisión (${fechaCorta(r.fechas.fin)})`}</Boton> : null}

      <details>
        <summary className="kicker tenue" style={{ cursor: "pointer" }}>Lo que FORJA nunca hace</summary>
        <div className="lista" style={{ marginTop: 8 }}>{PROHIBICIONES.map((p, i) => <div key={i} className="fila p13 medio" style={{ padding: "7px 0" }}><span className="tenue" style={{ width: 22 }}>{i + 1}</span>{p}</div>)}</div>
      </details>
    </>
  );
}
