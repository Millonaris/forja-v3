/*
 * ENTRENAR · ¿Cómo entreno? Menú, lista de rutinas, detalle de una rutina,
 * sesión en curso, running y rutinas cortas (postura / core).
 */

import { useEffect, useMemo, useState } from "react";

import { MENSAJES } from "../datos/config.js";
import { FASES_RUNNING, PLAN_RUNNING, RUTINAS, RUTINAS_CORTAS, SECUENCIA, seriesTotales } from "../datos/rutinas.js";
import { actualizarSerie, cancelarSesion, completarRutinaCorta, empezarSesion, fijarEstadoRunning, fijarSesionRunning, finalizarSesion, guardarDescanso } from "../logica/acciones.js";
import { fechaCorta, haceCuanto } from "../logica/fechas.js";
import { mmss, rango } from "../logica/formato.js";
import { objetivoDeHoy, resumirSeries } from "../logica/progresion.js";
import { TEXTO_ESTADO_RUNNING, semaforoDolor } from "../logica/running.js";
import { useSesion } from "../ganchos/useDatos.js";
import { useTemporizador } from "../ganchos/useTemporizador.js";
import { useWakeLock } from "../ganchos/useWakeLock.js";
import { Boton, Volver } from "../componentes/Controles.jsx";
import Marco from "../componentes/Marco.jsx";

const ICONO = {
  fuerza: <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#FFD400" strokeWidth="1.5" strokeLinecap="round"><path d="M2 12h3M19 12h3M5 8v8M19 8v8M8 6v12M16 6v12M8 12h8" /></svg>,
  running: <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#F2F2EE" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 20c4-1 5-6 8-8s5 1 10-4" /><circle cx="18" cy="5" r="1.5" /></svg>,
  postura: <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#F2F2EE" strokeWidth="1.5" strokeLinecap="round"><circle cx="12" cy="4" r="2" /><path d="M12 6v14M8 10h8M9 20h6" /></svg>,
  core: <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#F2F2EE" strokeWidth="1.5"><rect x="4" y="4" width="16" height="16" /><circle cx="12" cy="12" r="2.5" /></svg>,
};

export function Menu({ r, ir }) {
  const f = r.fuerza;
  return (
    <>
      <div className="titulo-xl">Entrenar</div>
      <div className="rejilla-2">
        <Marco acentuado suave onClick={() => ir("entrenar", "fuerza")} style={{ padding: "16px 14px", minHeight: 130, justifyContent: "space-between" }}>
          {ICONO.fuerza}
          <div><div className="titulo-m acento">Fuerza</div><div className="p12 medio" style={{ marginTop: 4 }}>{f.abierta ? "Sesión en curso" : `Próxima: ${f.rutina.nombre}`}</div></div>
        </Marco>
        <Marco onClick={() => ir("entrenar", "running")} style={{ padding: "16px 14px", minHeight: 130, justifyContent: "space-between" }}>
          {ICONO.running}
          <div><div className="titulo-m">Running</div><div className="p12 medio" style={{ marginTop: 4 }}>S{r.running.sesion} · {r.running.plan.codigo}</div></div>
        </Marco>
        <Marco onClick={() => ir("entrenar", "rutina", "postura")} style={{ padding: "16px 14px", minHeight: 130, justifyContent: "space-between" }}>
          {ICONO.postura}
          <div><div className="titulo-m">Postura</div><div className="p12 medio" style={{ marginTop: 4 }}>6 ejercicios · ~10 min{r.extras.posturaHoy ? " · hecha hoy" : ""}</div></div>
        </Marco>
        <Marco onClick={() => ir("entrenar", "rutina", "core")} style={{ padding: "16px 14px", minHeight: 130, justifyContent: "space-between" }}>
          {ICONO.core}
          <div><div className="titulo-m">Core</div><div className="p12 medio" style={{ marginTop: 4 }}>3 ejercicios · {r.extras.coreSemana}/2 esta semana</div></div>
        </Marco>
      </div>
      <div className="kicker tenue">Secuencia de fuerza · sin días fijos</div>
      <div style={{ display: "flex", gap: 6 }}>
        {f.porRutina.map((x) => (
          <div key={x.id} onClick={() => ir("entrenar", "sesion", x.id)} className="t" style={{ flex: 1, textAlign: "center", padding: "10px 4px", border: `1px solid ${x.esSiguiente ? "var(--acento)" : "rgba(255,255,255,.2)"}`, background: x.esSiguiente ? "var(--acento)" : "transparent", color: x.esSiguiente ? "var(--tinta)" : "var(--texto)", fontSize: 15, letterSpacing: ".04em", textTransform: "uppercase", cursor: "pointer", lineHeight: 1.1 }}>
            {x.rutina.corto}<div style={{ fontSize: 10, letterSpacing: ".1em", opacity: .8 }}>{x.esSiguiente ? "próxima" : x.esUltima ? "última" : " "}</div>
          </div>
        ))}
      </div>
      <div className="nota">Torso A → Pierna A → Torso B → Pierna B → repetir</div>
    </>
  );
}

export function Fuerza({ r, ir }) {
  return (
    <>
      <Volver texto="Entrenar" onClick={() => ir("entrenar", "menu")} />
      <div className="titulo-xl" style={{ marginTop: -10 }}>Fuerza</div>
      {r.fuerza.abierta ? <Boton variante="primario" className="mediano" onClick={() => ir("entrenar", "live", r.fuerza.abierta.id)}>Continuar {RUTINAS[r.fuerza.abierta.rutinaId].nombre}</Boton> : null}
      <div className="columna" style={{ gap: 12 }}>
        {r.fuerza.porRutina.map((x) => (
          <Marco key={x.id} acentuado={x.esSiguiente} onClick={() => ir("entrenar", "sesion", x.id)} style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
            <div style={{ flex: 1 }}><div className="titulo-m">{x.rutina.nombre}</div><div className="p13 medio" style={{ marginTop: 4 }}>{x.rutina.objetivo}</div><div className="p12 tenue" style={{ marginTop: 2 }}>{x.ultima ? `Última: ${fechaCorta(x.ultima.fecha)} (${haceCuanto(x.ultima.fecha, r.hoy)})` : "Sin registro"}</div></div>
            <div className="der"><div className="num num-30">{x.total}</div><div className="etiqueta">series</div><div className="t acento" style={{ fontSize: 11, letterSpacing: ".1em", textTransform: "uppercase", marginTop: 4 }}>{x.esSiguiente ? "Próxima" : " "}</div></div>
          </Marco>
        ))}
      </div>
      <Marco>
        <div className="kicker">Doble progresión</div>
        <div className="t" style={{ fontSize: 22, lineHeight: 1.1 }}>{MENSAJES.dobleProgresion}</div>
        <div className="p13 medio">3×8–12 · 10/9/8 → mantén · 12/12/12 con RIR correcto → sube carga. No exigir récord cada sesión. RIR 1–2 en todo; última serie aislada ocasional RIR 0–1. No fallo sistemático.</div>
      </Marco>
      {r.fuerza.deload.sugerir ? <div className="caja acento p13"><strong>{MENSAJES.deload}</strong> Señales: {r.fuerza.deload.senales.join(" ")} FORJA no lo hace sin tu confirmación: si decides descargar, reduce ~1 serie por ejercicio una vuelta completa.</div> : null}
    </>
  );
}

export function SesionDetalle({ r, ir, sel, avisar }) {
  const rutina = RUTINAS[sel];
  if (!rutina) return null;
  const hist = r.fuerza.historial;
  const empezar = async () => {
    if (r.fuerza.abierta && r.fuerza.abierta.rutinaId !== sel) { avisar(`Ya hay una sesión abierta (${RUTINAS[r.fuerza.abierta.rutinaId].nombre}).`); ir("entrenar", "live", r.fuerza.abierta.id); return; }
    const id = await empezarSesion(sel, r.hoy);
    ir("entrenar", "live", id);
  };
  return (
    <>
      <Volver texto="Fuerza" onClick={() => ir("entrenar", "fuerza")} />
      <div style={{ marginTop: -10 }}>
        <div className="kicker">{rutina.objetivo}</div>
        <div className="t" style={{ fontSize: 48, lineHeight: .95, textTransform: "uppercase" }}>{rutina.nombre}</div>
        <div className="p13 tenue" style={{ marginTop: 4 }}>{seriesTotales(sel)} series · RIR 1–2 · {rutina.duracion}{sel !== r.fuerza.siguiente ? ` · fuera de secuencia (toca ${r.fuerza.rutina.nombre})` : ""}</div>
      </div>
      <div className="lista">
        {rutina.ejercicios.map((e, i) => {
          const ultima = hist.get(e.clave)?.[0];
          const reto = ultima ? objetivoDeHoy(e, ultima.series) : null;
          return (
            <div key={e.clave + i} className="fila">
              <div className="t tenue" style={{ fontSize: 16, width: 22 }}>{i + 1}</div>
              <div className="crece"><div style={{ fontSize: 15, fontWeight: 500 }}>{e.nombre}</div><div className="p12 tenue">{e.superserie ? `Superserie ${e.superserie} · ` : ""}{e.nota || "RIR 1–2"}{reto ? ` · ${reto}` : ""}</div></div>
              <div className="der"><div className="num num-22">{e.series}×{rango(e.reps)}</div><div className="p12 tenue">desc. {mmss(e.descansoSeg)}</div></div>
            </div>
          );
        })}
      </div>
      <Boton variante="primario" onClick={empezar}>{r.fuerza.abierta?.rutinaId === sel ? "Continuar sesión" : "Empezar entrenamiento"}</Boton>
    </>
  );
}

export function SesionEnCurso({ r, ir, sel, avisar }) {
  const sesion = useSesion(sel);
  const [notas, setNotas] = useState("");
  const [confirmar, setConfirmar] = useState(null);
  useWakeLock(true);
  const temporizador = useTemporizador(sesion?.descansoFin ?? null, (fin) => { if (sesion) guardarDescanso(sesion.id, fin, sesion.descansoEjercicio); });

  const rutina = sesion ? RUTINAS[sesion.rutinaId] : null;
  const grupos = useMemo(() => {
    if (!sesion) return [];
    return rutina.ejercicios.map((e, i) => ({ e, i, indices: sesion.series.map((s, k) => (s.clave === e.clave && s.ejercicioId.endsWith(":" + e.clave) ? k : -1)).filter((k) => k >= 0) }));
  }, [sesion, rutina]);

  useEffect(() => { if (sesion === null) ir("entrenar", "fuerza"); }, [sesion, ir]);
  if (!sesion) return null;

  const hechas = sesion.series.filter((s) => s.completada).length;
  const total = sesion.series.length;
  const hist = r.fuerza.historial;

  const marcar = async (k, e) => {
    const serie = sesion.series[k];
    const nueva = !serie.completada;
    await actualizarSerie(sesion.id, k, { completada: nueva });
    if (nueva) temporizador.arrancar(e.descansoSeg);
  };
  const terminar = async () => {
    const res = await finalizarSesion(sesion.id, notas);
    if (!res.ok) { avisar(res.motivo); return; }
    const siguiente = SECUENCIA[(SECUENCIA.indexOf(sesion.rutinaId) + 1) % 4];
    avisar(`${rutina.nombre} guardada · ${res.series} series. Próxima: ${RUTINAS[siguiente].nombre}`);
    ir("hoy");
  };
  const cancelar = async () => { await cancelarSesion(sesion.id); avisar("Sesión cancelada. No se guarda nada."); ir("entrenar", "fuerza"); };

  return (
    <>
      <div className="cabecera-fija">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div><div className="kicker">Sesión en curso</div><div className="t" style={{ fontSize: 34, lineHeight: 1, textTransform: "uppercase" }}>{rutina.nombre}</div></div>
          <div className="der"><div className="num" style={{ fontSize: 34 }}>{hechas}<span className="tenue" style={{ fontSize: 20 }}>/{total}</span></div><div className="etiqueta">series</div></div>
        </div>
        <div className="barra fina" style={{ marginTop: 10 }}><div className="relleno" style={{ width: `${total ? (hechas / total) * 100 : 0}%` }} /></div>
        {temporizador.activo ? (
          <div className="descanso">
            <div className={`tiempo ${temporizador.terminado ? "fin" : ""}`}>{temporizador.terminado ? "¡Ya!" : temporizador.texto}</div>
            <div className="p12 tenue" style={{ flex: 1 }}>descanso</div>
            <Boton variante="chip" onClick={() => temporizador.sumar(30)}>+30 s</Boton>
            <Boton variante="chip" onClick={temporizador.parar}>Saltar</Boton>
          </div>
        ) : null}
      </div>

      <div className="columna" style={{ gap: 16 }}>
        {grupos.map(({ e, i, indices }) => {
          const ultima = hist.get(e.clave)?.[0];
          const ref = ultima ? resumirSeries(ultima.series) : null;
          const reto = ultima ? objetivoDeHoy(e, ultima.series) : null;
          return (
            <Marco key={e.clave + i} style={{ padding: 14, gap: 8 }}>
              <div className="entre" style={{ alignItems: "flex-start" }}>
                <div><div className="t" style={{ fontSize: 22, lineHeight: 1.05 }}>{i + 1}. {e.nombre}</div><div className="p12 tenue">{e.series}×{rango(e.reps)} · desc. {mmss(e.descansoSeg)}{e.superserie ? ` · superserie ${e.superserie}` : ""}{e.nota ? ` · ${e.nota}` : ""}</div></div>
                <div className="p12 acento" style={{ whiteSpace: "nowrap", textAlign: "right" }}>{ref ? `últ. ${ref}` : "sin histórico"}</div>
              </div>
              {reto ? <div className="p12 medio">Hoy: {reto}</div> : null}
              <div className="serie-rejilla etiqueta"><div>#</div><div>kg</div><div>reps</div><div>RIR</div><div /></div>
              {indices.map((k) => {
                const s = sesion.series[k];
                const previa = ultima?.series?.find((x) => x.numero === s.numero) || ultima?.series?.[0];
                return (
                  <div key={k} className="serie-rejilla">
                    <div className="n">{s.numero}</div>
                    <input className="input" type="number" inputMode="decimal" step="0.5" value={s.kg} placeholder={previa?.kg != null ? String(previa.kg) : "kg"} onChange={(ev) => actualizarSerie(sesion.id, k, { kg: ev.target.value })} />
                    <input className="input" type="number" inputMode="numeric" value={s.reps} placeholder={previa?.reps != null ? String(previa.reps) : String(e.repMin)} onChange={(ev) => actualizarSerie(sesion.id, k, { reps: ev.target.value })} />
                    <input className="input" type="number" inputMode="numeric" value={s.rir} placeholder="1–2" min="0" max="5" onChange={(ev) => actualizarSerie(sesion.id, k, { rir: ev.target.value })} />
                    <button type="button" className={`hecha ${s.completada ? "activo" : ""}`} onClick={() => marcar(k, e)}>{s.completada ? "Hecha" : "Hacer"}</button>
                  </div>
                );
              })}
            </Marco>
          );
        })}
      </div>
      <textarea className="input texto" placeholder="Notas de la sesión (opcional)" value={notas} onChange={(e) => setNotas(e.target.value)} />
      <div style={{ display: "flex", gap: 10 }}>
        <Boton variante="neutro" onClick={() => setConfirmar("cancelar")} style={{ flex: 1 }}>Cancelar</Boton>
        <Boton variante="primario" className="mediano" onClick={hechas ? () => setConfirmar("terminar") : terminar} style={{ flex: 2 }}>Finalizar sesión</Boton>
      </div>
      {confirmar ? (
        <div className="caja acento columna">
          <div className="p14">{confirmar === "cancelar" ? "¿Cancelar la sesión? No se guarda nada." : `¿Finalizar con ${hechas} de ${total} series?${hechas < total ? " Las no marcadas no se guardan." : ""}`}</div>
          <div style={{ display: "flex", gap: 10 }}>
            <Boton variante="neutro" onClick={() => setConfirmar(null)} style={{ flex: 1, height: 48 }}>Volver</Boton>
            <Boton variante={confirmar === "cancelar" ? "peligro" : "secundario"} onClick={confirmar === "cancelar" ? cancelar : terminar} style={{ flex: 1, height: 48 }}>{confirmar === "cancelar" ? "Sí, cancelar" : "Sí, finalizar"}</Boton>
          </div>
        </div>
      ) : null}
    </>
  );
}

export function Running({ r, ir, abrirModal, avisar }) {
  const run = r.running;
  const [ajustando, setAjustando] = useState(false);
  const [verPlan, setVerPlan] = useState(false);
  const [verReglas, setVerReglas] = useState(false);
  const colorEstado = { PROGRESS: "verde", HOLD: "amarillo", YELLOW_PAIN: "amarillo", RED_PAIN: "rojo" }[run.estado];
  const pct = ((run.sesion - 1) / PLAN_RUNNING.length) * 100;
  const largo = run.duracionMin >= 45;
  return (
    <>
      <Volver texto="Entrenar" onClick={() => ir("entrenar", "menu")} />
      <div style={{ marginTop: -10 }}><div className="titulo-xl">Running</div><div className="p13 tenue">2 por semana · nunca dos días seguidos · fácil, pudiendo hablar</div></div>
      <Marco style={{ padding: 16 }}>
        <div className="kicker">Fase {run.fase.fase} · {run.fase.nombre}</div>
        <div className="t" style={{ fontSize: 46, lineHeight: .95 }}>S{run.sesion} <span style={{ fontSize: 30, color: "var(--texto-medio)" }}>· {run.plan.codigo}</span></div>
        <div className="p14 medio">{run.plan.desc} · ~{run.duracionMin} min</div>
        {run.estado !== "PROGRESS" || (run.ultima && run.ultima.repetir && run.ultima.sesion === run.sesion) ? <div className="p13 acento">{run.nota}</div> : null}
        {largo ? <div className="p12 tenue">{run.nutricion}</div> : null}
        <Boton variante="primario" className="mediano" onClick={() => abrirModal("carrera")} style={{ marginTop: 8 }} disabled={run.estado === "RED_PAIN"}>{run.hechaHoy ? "Registrar otra sesión" : "Sesión hecha"}</Boton>
      </Marco>
      <div>
        <div className="barra"><div className="relleno" style={{ width: `${pct}%` }} /></div>
        <div className="entre etiqueta" style={{ marginTop: 6 }}><span>S{run.sesion} de {PLAN_RUNNING.length}</span><span>{run.fase.meta}</span></div>
      </div>
      <div className="kicker tenue">Siguientes</div>
      <div className="lista">
        {run.siguientes.map((p) => <div key={p.n} className="fila" style={{ padding: "8px 0" }}><div className="t tenue" style={{ width: 40, fontSize: 16 }}>S{p.n}</div><div className="crece p13">{p.desc}</div><div className="num num-20">{p.codigo}</div></div>)}
      </div>
      <div className="caja" style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div className={`punto ${colorEstado}`} />
        <div className="p13 medio" style={{ flex: 1 }}><strong style={{ color: "var(--texto)" }}>{TEXTO_ESTADO_RUNNING[run.estado]}.</strong> {run.ultima ? `Última: ${fechaCorta(run.ultima.fecha)} · S${run.ultima.sesion ?? "?"} · ${run.semaforoUltima === "GREEN" ? "verde" : run.semaforoUltima === "YELLOW" ? "amarillo" : "rojo"}.` : "Sin sesiones en la 3.0 (S3 y S4 ya hechas)."}</div>
      </div>
      <div className="rejilla-2" style={{ gap: 8 }}>
        <Boton variante="chip" className={run.estado === "HOLD" ? "activo" : ""} style={{ width: "100%", height: 48 }} onClick={async () => { await fijarEstadoRunning(run.estado === "HOLD" ? "PROGRESS" : "HOLD"); avisar(run.estado === "HOLD" ? "Progresión abierta de nuevo." : MENSAJES.runningInterfiere); }}>{run.estado === "HOLD" ? "Abrir progresión" : "Congelar"}</Boton>
        <Boton variante="chip" style={{ width: "100%", height: 48 }} onClick={() => setAjustando((v) => !v)}>Cambiar sesión</Boton>
        <Boton variante="chip" style={{ width: "100%", height: 48 }} onClick={() => setVerPlan((v) => !v)}>{verPlan ? "Ocultar plan" : "Plan completo"}</Boton>
        <Boton variante="chip" style={{ width: "100%", height: 48 }} onClick={() => setVerReglas((v) => !v)}>{verReglas ? "Ocultar reglas" : "Reglas"}</Boton>
      </div>
      {ajustando ? (
        <div className="caja columna">
          <div className="p12 tenue">Solo para corregir: la progresión avanza sola con cada sesión en verde.</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Boton variante="chip" onClick={async () => { await fijarSesionRunning(run.sesion - 1); avisar(`Sesión S${Math.max(1, run.sesion - 1)}.`); }} disabled={run.sesion <= 1}>← S{Math.max(1, run.sesion - 1)}</Boton>
            <div className="t" style={{ fontSize: 22, flex: 1, textAlign: "center" }}>S{run.sesion}</div>
            <Boton variante="chip" onClick={async () => { await fijarSesionRunning(run.sesion + 1); avisar(`Sesión S${Math.min(PLAN_RUNNING.length, run.sesion + 1)}.`); }} disabled={run.sesion >= PLAN_RUNNING.length}>S{Math.min(PLAN_RUNNING.length, run.sesion + 1)} →</Boton>
          </div>
        </div>
      ) : null}
      {verReglas ? (
        <div className="columna">
          <div className="rejilla-3" style={{ gap: 8 }}>
            <div style={{ borderTop: "3px solid var(--verde)", paddingTop: 8 }}><div className="t verde" style={{ fontSize: 16, textTransform: "uppercase", letterSpacing: ".06em" }}>Verde</div><div className="p12 medio">Molestia pasajera, normal al día siguiente. <strong>Continuar.</strong></div></div>
            <div style={{ borderTop: "3px solid var(--acento)", paddingTop: 8 }}><div className="t acento" style={{ fontSize: 16, textTransform: "uppercase", letterSpacing: ".06em" }}>Amarillo</div><div className="p12 medio">Localizado, recurrente o persiste. <strong>No progresar.</strong></div></div>
            <div style={{ borderTop: "3px solid var(--rojo)", paddingTop: 8 }}><div className="t rojo" style={{ fontSize: 16, textTransform: "uppercase", letterSpacing: ".06em" }}>Rojo</div><div className="p12 medio">Altera marcha, hinchazón, duele andando. <strong>Parar y valorar.</strong></div></div>
          </div>
          <div className="p12 tenue">Se avanza una sesión por cada sesión en verde. Si cuesta demasiado, se repite. Si interfiere con Pierna A/B o la fuerza, se congela. Quedan {run.restante.quedan} sesiones (~{run.restante.semanas} semanas a 2/semana, sin contar repeticiones). {MENSAJES.running20k} Cuando las tiradas sean largas ya habremos salido del cut: FORJA adaptará carbohidratos, no te hará correr 18 km en déficit.</div>
        </div>
      ) : null}
      {verPlan ? (
        <div className="columna">
          {FASES_RUNNING.map((f) => (
            <div key={f.fase}>
              <div className="kicker tenue" style={{ marginBottom: 4 }}>Fase {f.fase} · {f.nombre}</div>
              <div className="lista">
                {PLAN_RUNNING.filter((p) => p.fase === f.fase).map((p) => (
                  <div key={p.n} className="fila" style={{ padding: "6px 0", background: p.n === run.sesion ? "var(--acento-suave)" : undefined, opacity: p.n < run.sesion ? .55 : 1 }}>
                    <div className="t" style={{ width: 40, fontSize: 15, color: p.n === run.sesion ? "var(--acento)" : "var(--texto-tenue)" }}>S{p.n}</div>
                    <div className="crece p13">{p.desc}{p.n < run.sesion ? " ✓" : ""}</div>
                    <div className="num num-20">{p.codigo}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : null}
      {run.lista.length ? (
        <>
          <div className="kicker tenue">Últimas sesiones</div>
          <div className="lista">
            {run.lista.slice(0, 6).map((c) => {
              const sem = semaforoDolor(c);
              return (
                <div key={c.id} className="fila">
                  <div className={`punto ${sem === "GREEN" ? "verde" : sem === "YELLOW" ? "amarillo" : "rojo"}`} style={{ width: 10, height: 10 }} />
                  <div className="p12 tenue" style={{ width: 52 }}>{fechaCorta(c.fecha)}</div>
                  <div className="crece"><div className="num num-20">{c.sesion ? `S${c.sesion} · ` : ""}{c.codigo}</div>{c.repetir || c.interfiere || c.notas ? <div className="p12 tenue">{[c.repetir ? "repetir" : null, c.interfiere ? "interfiere" : null, c.notas || null].filter(Boolean).join(" · ")}</div> : null}</div>
                  <div className="der p12 medio">sens. {c.sensacion ?? "—"}/5</div>
                </div>
              );
            })}
          </div>
        </>
      ) : null}
    </>
  );
}

export function RutinaCorta({ r, ir, sel, avisar }) {
  const rut = RUTINAS_CORTAS[sel] || RUTINAS_CORTAS.postura;
  const [hechos, setHechos] = useState({});
  useEffect(() => { setHechos({}); }, [sel]);
  const completar = async () => {
    await completarRutinaCorta(rut.id, r.hoy);
    avisar(`Rutina de ${rut.nombre.toLowerCase()} completada.`);
    ir("entrenar", "menu");
  };
  const hechaHoy = r.extras.lista.some((e) => e.fecha === r.hoy && e.tipo === rut.id);
  return (
    <>
      <Volver texto="Entrenar" onClick={() => ir("entrenar", "menu")} />
      <div style={{ marginTop: -10 }}><div className="titulo-xl">{rut.nombre}</div><div className="p13 tenue">{rut.sub}{hechaHoy ? " · hecha hoy" : ""}</div></div>
      <div className="lista">
        {rut.items.map((it, i) => (
          <div key={it.nombre} className="fila pulsable" style={{ minHeight: 64, gap: 14 }} onClick={() => setHechos((h) => ({ ...h, [i]: !h[i] }))}>
            <div style={{ width: 26, height: 26, border: "1.5px solid var(--acento)", background: hechos[i] ? "var(--acento)" : "transparent", flex: "none", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0A0A0B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7" /></svg>
            </div>
            <div className="crece" style={{ fontSize: 16, fontWeight: 500, opacity: hechos[i] ? .55 : 1 }}>{it.nombre}</div>
            <div className="num num-20">{it.pauta}</div>
          </div>
        ))}
      </div>
      <div className="p13 medio">{rut.cue}</div>
      {rut.id === "postura" ? <div className="p12 tenue">FORJA no diagnostica postura estructural. Esto es control y movilidad, no un tratamiento.</div> : null}
      <Boton variante="primario" className="mediano" onClick={completar}>Completar rutina</Boton>
    </>
  );
}

export default function Entrenar({ vista = "menu", ...props }) {
  switch (vista) {
    case "fuerza": return <Fuerza {...props} />;
    case "sesion": return <SesionDetalle {...props} />;
    case "live": return <SesionEnCurso {...props} />;
    case "running": return <Running {...props} />;
    case "rutina": return <RutinaCorta {...props} />;
    default: return <Menu {...props} />;
  }
}
