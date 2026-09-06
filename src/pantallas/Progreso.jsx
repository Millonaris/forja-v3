/*
 * PROGRESO · ¿Está funcionando? Cuatro pestañas: CUERPO · FUERZA · RUNNING ·
 * RECUPERACIÓN (§47–§52 del visual, §58 del técnico).
 */

import { useState } from "react";

import { FUNCIONES, MENSAJES } from "../datos/config.js";
import { RUTINAS, nombrePorClave } from "../datos/rutinas.js";
import { borrarCarrera, borrarCintura, borrarPeso, borrarSesion } from "../logica/acciones.js";
import { diaCorto, fechaCorta } from "../logica/fechas.js";
import { conSigno, n0, n1 } from "../logica/formato.js";
import { TEXTO_TENDENCIA } from "../logica/peso.js";
import { resumirSeries, veredicto } from "../logica/progresion.js";
import { semaforoDolor } from "../logica/running.js";
import { Boton, Semaforo } from "../componentes/Controles.jsx";
import Marco from "../componentes/Marco.jsx";
import Fotos from "./Fotos.jsx";

const PESTANAS = [["cuerpo", "Cuerpo"], ["fuerza", "Fuerza"], ["running", "Running"], ...(FUNCIONES.recuperacion ? [["recup", "Recup."]] : [])];

function GraficaPeso({ g }) {
  const puntos = g.pesos.map((p, i) => (p ? { i, kg: p.kg, dudosa: p.dudosa } : null)).filter(Boolean);
  const medias = g.media.map((m, i) => (m.kg != null ? { i, kg: m.kg } : null)).filter(Boolean);
  const todos = [...puntos.map((p) => p.kg), ...medias.map((m) => m.kg)];
  if (!todos.length) return <div className="p13 tenue centro" style={{ padding: 20 }}>Sin pesadas todavía. Registra el peso cada mañana y aquí aparecerá la media de 7 días.</div>;
  const mn = Math.min(...todos) - 0.3, mx = Math.max(...todos) + 0.3;
  const n = g.fechas.length;
  const px = (i) => (i / (n - 1)) * 330;
  const py = (v) => 125 - ((v - mn) / (mx - mn || 1)) * 115;
  const camino = (lista) => lista.map((p, k) => (k ? "L" : "M") + px(p.i).toFixed(1) + " " + py(p.kg).toFixed(1)).join(" ");
  return (
    <>
      <div className="entre etiqueta"><span>Peso · últimos {n} días</span><span>{n1(Math.min(...todos))}–{n1(Math.max(...todos))} kg</span></div>
      <svg viewBox="0 0 330 130" width="100%" style={{ display: "block", marginTop: 8, overflow: "visible" }}>
        <line x1="0" y1="129" x2="330" y2="129" stroke="rgba(255,255,255,.2)" />
        <path d={camino(puntos.filter((p) => !p.dudosa))} fill="none" stroke="rgba(255,255,255,.35)" strokeWidth="1.5" strokeLinejoin="round" />
        <path d={camino(medias)} fill="none" stroke="#FFD400" strokeWidth="2.5" strokeLinejoin="round" />
        {puntos.map((p) => <circle key={p.i} cx={px(p.i)} cy={py(p.kg)} r="2.5" fill={p.dudosa ? "none" : "#F2F2EE"} stroke="#F2F2EE" />)}
      </svg>
      <div style={{ display: "flex", gap: 14, marginTop: 8 }} className="etiqueta"><span><span style={{ display: "inline-block", width: 10, height: 2, background: "#FFD400", verticalAlign: "middle", marginRight: 4 }} />media 7 días</span><span><span style={{ display: "inline-block", width: 10, height: 2, background: "rgba(255,255,255,.35)", verticalAlign: "middle", marginRight: 4 }} />pesada diaria</span><span>○ dudosa</span></div>
    </>
  );
}

function Cuerpo({ r, ir, avisar }) {
  const [verLista, setVerLista] = useState(false);
  const p = r.peso;
  const dudosas = p.grafica.pesos.filter((x) => x && x.dudosa).length;
  const mensaje = p.clase === "SIN_DATOS" ? MENSAJES.sinDatos : p.clase === "RAPIDA" ? MENSAJES.pesoBajaRapido : p.clase === "PLANA" ? MENSAJES.pesoPlanoSemana : p.clase === "LENTA" && r.cintura.baja ? MENSAJES.cinturaBajaPesoLento : MENSAJES.tendencias;
  return (
    <>
      <div className="rejilla-3">
        <div><div className="etiqueta">Media 7 d</div><div className="num num-30">{n1(p.media7)}</div></div>
        <div><div className="etiqueta">Semanal</div><div className="num num-30">{p.tendencia != null ? conSigno(p.tendencia) : "—"}</div></div>
        <div><div className="etiqueta">Tendencia</div><div className="t acento" style={{ fontSize: 18, lineHeight: 1.1, marginTop: 6 }}>{TEXTO_TENDENCIA[p.clase]}</div></div>
      </div>
      <Marco style={{ padding: 14 }}><GraficaPeso g={p.grafica} /></Marco>
      <div className="p12 tenue">Ritmo objetivo con {n1(r.kgRef)} kg: −{n1(r.kgRef * 0.004)} a −{n1(r.kgRef * 0.006)} kg/semana (techo blando −{n1(r.kgRef * 0.007)}).{dudosas ? ` ${dudosas} pesada(s) dudosa(s) fuera de la media.` : ""}</div>
      <div className="rejilla-2">
        <Marco style={{ padding: 14 }}><div className="etiqueta">Cintura</div><div className="num num-30">{r.cintura.ultima ? n1(r.cintura.ultima.cm) + " cm" : "—"}</div><div className="p12 medio">{r.cintura.delta != null ? conSigno(r.cintura.delta) + " cm desde inicio" : r.cintura.toca ? "toca medir" : "sin referencia"}</div></Marco>
        <Marco style={{ padding: 14 }}><div className="etiqueta">Pasos medios 7 d</div><div className="num num-30">{n0(r.nutricion.pasos7)}</div><div className="p12 medio">indicador de actividad, no kcal{r.nutricion.comparables === false ? " · no comparable" : ""}</div></Marco>
      </div>
      <div className="rejilla-2">
        <Marco style={{ padding: 14 }}><div className="etiqueta">Kcal medias 7 d</div><div className="num num-30">{n0(r.nutricion.kcal7)}</div><div className="p12 medio">{r.enCut ? `referencia ~${n0(r.objetivosDia ? 2293 : r.kcal)}/día` : `objetivo ${n0(r.kcal)}`} · proteína {n0(r.nutricion.prot7)} g</div></Marco>
        <Marco style={{ padding: 14 }}><div className="etiqueta">Semana en curso</div><div className="num num-30">{n0(r.semana.consumido)}</div><div className="p12 medio">{r.semana.diasRegistrados} {r.semana.diasRegistrados === 1 ? "día" : "días"} · esperado {n0(r.semana.esperado)} · ref. {n0(r.semana.referencia)}</div></Marco>
        <Marco style={{ padding: 14 }}><div className="etiqueta">Adherencia 7 d</div><div className="num num-30">{Math.round(r.nutricion.adherencia7 * 100)} %</div><div className="p12 medio">{r.nutricion.adherencia7 >= .85 ? "≥85 %: datos fiables" : "<85 %: una semana más limpia"}</div></Marco>
      </div>
      <Marco onClick={() => ir("progreso", "fotos")} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <div><div className="etiqueta">Fotos · cada 4 semanas</div><div className="p14 medio">Frente · lado · espalda · misma luz</div></div>
        <div className="t acento" style={{ fontSize: 15, letterSpacing: ".06em", textTransform: "uppercase" }}>Abrir →</div>
      </Marco>
      <div className="nota">{mensaje}</div>
      <Boton variante="chip" onClick={() => setVerLista((v) => !v)}>{verLista ? "Ocultar registros" : "Ver registros"}</Boton>
      {verLista ? (
        <div className="lista">
          {[...p.grafica.pesos].reverse().filter(Boolean).slice(0, 30).map((x) => (
            <div key={x.fecha} className="fila"><div className="p12 tenue" style={{ width: 56 }}>{fechaCorta(x.fecha)}</div><div className="crece num num-20">{n1(x.kg)} kg{x.dudosa ? <span className="p12 tenue"> dudosa</span> : null}</div><span className="p12 rojo" onClick={async () => { await borrarPeso(x.fecha); avisar("Pesada borrada."); }}>borrar</span></div>
          ))}
          {r.cintura.lista.slice(0, 10).map((c) => (
            <div key={"c" + c.fecha} className="fila"><div className="p12 tenue" style={{ width: 56 }}>{fechaCorta(c.fecha)}</div><div className="crece num num-20">{n1(c.cm)} cm <span className="p12 tenue">cintura</span></div><span className="p12 rojo" onClick={async () => { await borrarCintura(c.fecha); avisar("Cintura borrada."); }}>borrar</span></div>
          ))}
        </div>
      ) : null}
    </>
  );
}

function FuerzaProg({ r, ir, avisar }) {
  const [abierto, setAbierto] = useState(null);
  const f = r.fuerza;
  const sesionesGuardadas = Array.from(f.historial.values()).flat().reduce((m, h) => { if (!m.some((x) => x.sesionId === h.sesionId)) m.push(h); return m; }, []).sort((a, b) => b.fecha.localeCompare(a.fecha));
  return (
    <>
      <div className="rejilla-3">
        <div><div className="etiqueta">Sesiones</div><div className="num num-30">{f.totalSesiones}</div></div>
        <div><div className="etiqueta">Series</div><div className="num num-30">{f.totalSeries}</div></div>
        <div><div className="etiqueta">Volumen</div><div className="num num-30">{n0(f.volumenTotal / 1000)}<span className="unidad" style={{ fontSize: 14 }}> t</span></div></div>
      </div>
      {f.deload.sugerir ? <div className="caja acento p13"><strong>{MENSAJES.deload}</strong> {f.deload.senales.join(" ")} Tú decides.</div> : null}
      <div className="lista">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 64px 70px", gap: 8, padding: "8px 0", borderBottom: "1px solid var(--linea)" }} className="etiqueta"><div>Ejercicio</div><div className="der">Última</div><div className="der">Mejor serie</div></div>
        {f.ejercicios.length ? f.ejercicios.map((e) => {
          const hist = f.historial.get(e.clave) || [];
          const ej = Object.values(RUTINAS).flatMap((x) => x.ejercicios).find((x) => x.clave === e.clave);
          const v = ej ? veredicto(ej, hist) : null;
          return (
            <div key={e.clave} onClick={() => setAbierto(abierto === e.clave ? null : e.clave)} style={{ cursor: "pointer", borderBottom: "1px solid var(--linea)" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 64px 70px", gap: 8, padding: "10px 0", alignItems: "center" }}>
                <div><div className="p14" style={{ fontWeight: 500 }}>{nombrePorClave(e.clave)}</div><div className="p12 tenue">{e.sesiones} {e.sesiones === 1 ? "sesión" : "sesiones"}{v ? ` · ${v.texto}` : ""}</div></div>
                <div className="der num num-20">{e.ultima}</div>
                <div className="der num num-20 acento">{e.mejor}</div>
              </div>
              {abierto === e.clave ? (
                <div className="columna" style={{ paddingBottom: 10 }}>
                  {v ? <div className="p13 medio">{v.motivo}</div> : null}
                  {hist.slice(0, 8).map((h) => <div key={h.sesionId} className="p12 tenue">{fechaCorta(h.fecha)} · {RUTINAS[h.rutinaId]?.corto} · {resumirSeries(h.series) || "sin reps"}</div>)}
                </div>
              ) : null}
            </div>
          );
        }) : <div className="fila p13 tenue">Sin sesiones todavía. La primera de la 3.0 será {f.rutina.nombre}.</div>}
      </div>
      <div className="nota">{MENSAJES.dobleProgresion}</div>
      {f.totalSesiones ? (
        <details>
          <summary className="p12 tenue" style={{ cursor: "pointer" }}>Sesiones guardadas ({f.totalSesiones})</summary>
          <div className="lista" style={{ marginTop: 8 }}>
            {sesionesGuardadas.map((h) => (
              <div key={h.sesionId} className="fila"><div className="p12 tenue" style={{ width: 56 }}>{fechaCorta(h.fecha)}</div><div className="crece num num-20">{RUTINAS[h.rutinaId]?.nombre}</div><span className="p12 rojo" onClick={async () => { if (window.confirm("¿Borrar esta sesión? Se pierden sus series.")) { await borrarSesion(h.sesionId); avisar("Sesión borrada."); } }}>borrar</span></div>
            ))}
          </div>
        </details>
      ) : null}
    </>
  );
}

function RunningProg({ r, avisar }) {
  const run = r.running;
  return (
    <>
      <div className="rejilla-3">
        <div><div className="etiqueta">Sesión del plan</div><div className="num num-30">S{run.sesion}<span className="unidad" style={{ fontSize: 14 }}>/66</span></div></div>
        <div><div className="etiqueta">Sesiones/sem</div><div className="num num-30">{run.lista.length ? n1(run.porSemana4) : "—"}</div></div>
        <div><div className="etiqueta">Sensación media</div><div className="num num-30">{run.sensacionMedia != null ? n1(run.sensacionMedia) : "—"}<span className="unidad" style={{ fontSize: 14 }}>/5</span></div></div>
      </div>
      <div className="lista">
        {run.lista.length ? run.lista.map((c) => {
          const sem = semaforoDolor(c);
          return (
            <div key={c.id} className="fila">
              <div className={`punto ${sem === "GREEN" ? "verde" : sem === "YELLOW" ? "amarillo" : "rojo"}`} style={{ width: 10, height: 10 }} />
              <div className="p12 tenue" style={{ width: 52 }}>{fechaCorta(c.fecha)}</div>
              <div className="crece"><div className="num num-20">{c.sesion ? `S${c.sesion} · ` : ""}{c.codigo}</div><div className="p12 tenue">{sem === "GREEN" ? "verde" : sem === "YELLOW" ? "amarillo" : "rojo"}{c.repetir ? " · repetir" : ""}{c.interfiere ? " · interfiere" : ""}{c.notas ? ` · ${c.notas}` : ""}</div></div>
              <div className="der p12 medio">sens. {c.sensacion ?? "—"}/5</div>
              <span className="p12 rojo" onClick={async () => { await borrarCarrera(c.id); avisar("Sesión borrada."); }}>×</span>
            </div>
          );
        }) : <div className="fila p13 tenue">Sin sesiones registradas.</div>}
      </div>
      <div className="nota">Los datos recientes no prueban mejora fisiológica por sí solos.</div>
    </>
  );
}

function Recup({ r }) {
  const rec = r.nutricion.rec7;
  const dias = Object.keys(r.nutricion.diario7);
  return (
    <>
      <div className="rejilla-3">
        <div><div className="etiqueta">Hambre 7 d</div><div className="num num-30">{n1(rec.hambre)}<span className="unidad" style={{ fontSize: 14 }}>/5</span></div></div>
        <div><div className="etiqueta">Energía 7 d</div><div className="num num-30">{n1(rec.energia)}<span className="unidad" style={{ fontSize: 14 }}>/5</span></div></div>
        <div><div className="etiqueta">Sueño 7 d</div><div className="num num-30">{n1(rec.sueno)}<span className="unidad" style={{ fontSize: 14 }}> h</span></div></div>
      </div>
      <Marco style={{ padding: 14 }}>
        <div className="etiqueta" style={{ marginBottom: 10 }}>Últimos 7 días</div>
        <div style={{ display: "flex", gap: 6, alignItems: "flex-end", height: 110 }}>
          {dias.map((f) => <Barra key={f} fecha={f} d={r.nutricion.diario7[f]} />)}
        </div>
        <div style={{ display: "flex", gap: 12, marginTop: 8 }} className="etiqueta"><span><span style={{ display: "inline-block", width: 8, height: 8, background: "#FFD400", marginRight: 4 }} />hambre</span><span><span style={{ display: "inline-block", width: 8, height: 8, background: "rgba(255,255,255,.45)", marginRight: 4 }} />energía</span><span><span style={{ display: "inline-block", width: 8, height: 8, background: "rgba(255,212,0,.35)", marginRight: 4 }} />sueño</span></div>
      </Marco>
      <Semaforo color={r.nutricion.semaforo.color}><strong style={{ color: "var(--texto)" }}>Semáforo nutricional: {r.nutricion.semaforo.color.toLowerCase()}.</strong> {r.nutricion.semaforo.texto}</Semaforo>
      {r.fuerza.deload.sugerir ? <div className="caja acento p13"><strong>{MENSAJES.deload}</strong> FORJA no lo hace sin tu confirmación.</div> : null}
      <div className="p12 tenue">Sugerencia de kcal: <strong className="acento">{r.nutricion.sugerencia.accion.replace("_", " ")}</strong> · {r.nutricion.sugerencia.motivo}</div>
      <div className="nota">{MENSAJES.recuperacionImporta}</div>
    </>
  );
}

function Barra({ fecha, d }) {
  const h = d?.hambre ? (d.hambre / 5) * 100 : 0, e = d?.energia ? (d.energia / 5) * 100 : 0, s = d?.suenoHoras ? (Math.min(d.suenoHoras, 10) / 10) * 100 : 0;
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: 2, height: "100%" }}>
      <div style={{ display: "flex", gap: 2, alignItems: "flex-end", flex: 1 }}>
        <div style={{ flex: 1, background: "#FFD400", height: `${h}%` }} /><div style={{ flex: 1, background: "rgba(255,255,255,.45)", height: `${e}%` }} /><div style={{ flex: 1, background: "rgba(255,212,0,.35)", height: `${s}%` }} />
      </div>
      <div className="centro" style={{ fontSize: 10, color: "var(--texto-tenue)" }}>{diaCorto(fecha)}</div>
    </div>
  );
}

export default function Progreso({ vista = "cuerpo", ...props }) {
  const { ir } = props;
  if (vista === "fotos") return <Fotos {...props} />;
  return (
    <>
      <div className="titulo-xl">Progreso</div>
      <div className="segmentos">{PESTANAS.map(([id, t]) => <button key={id} className={vista === id ? "activo" : ""} onClick={() => ir("progreso", id)}>{t}</button>)}</div>
      {vista === "fuerza" ? <FuerzaProg {...props} /> : vista === "running" ? <RunningProg {...props} /> : vista === "recup" && FUNCIONES.recuperacion ? <Recup {...props} /> : <Cuerpo {...props} />}
    </>
  );
}

