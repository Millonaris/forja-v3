/*
 * Los formularios de registro (hojas inferiores): peso, cintura,
 * recuperación, cierre del día, sesión de running y cambio de kcal.
 */

import { useState } from "react";

import { CUT, MENSAJES, PROTEINA_RANGO } from "../datos/config.js";
import { CACO } from "../datos/rutinas.js";
import { cambiarKcal, empezarGanancia, empezarMiniCut, guardarCarrera, guardarCierre, guardarCintura, guardarPeso, guardarRecuperacion } from "../logica/acciones.js";
import { fechaCorta } from "../logica/fechas.js";
import { n0, n1 } from "../logica/formato.js";
import { nutricionRunning, semaforoDolor } from "../logica/running.js";
import { Campo, Check, Escala, NumeroGrande, Stepper } from "./Controles.jsx";
import Hoja from "./Hoja.jsx";

export function ModalPeso({ r, onCerrar, avisar }) {
  const inicial = r.peso.hoy?.kg ?? r.peso.ultimo?.kg ?? r.kgRef;
  const [kg, setKg] = useState(inicial);
  const [dudosa, setDudosa] = useState(!!r.peso.hoy?.dudosa);
  const [bia, setBia] = useState(r.nutricion.recHoy?.grasaBIA ?? "");
  const guardar = async () => {
    if (!kg) return;
    await guardarPeso({ fecha: r.hoy, kg, dudosa, grasaBIA: bia });
    avisar(dudosa ? "Pesada dudosa guardada. Queda fuera de las medias." : MENSAJES.pesoSubeUnDia.replace("Un día no cambia el plan. ", "Guardado. ") );
    onCerrar();
  };
  return (
    <Hoja titulo="Peso de hoy" sub={fechaCorta(r.hoy)} onCerrar={onCerrar} onGuardar={guardar} guardarDeshabilitado={!kg}>
      <NumeroGrande valor={kg} onChange={setKg} paso={0.1} min={40} max={200} />
      <Check activo={dudosa} onChange={setDudosa}>Marcar como <strong>PESADA DUDOSA</strong> (condiciones distintas)</Check>
      <Campo etiqueta="% grasa de la báscula (opcional · solo informativo)">
        <input className="input" type="number" inputMode="decimal" step="0.1" value={bia} onChange={(e) => setBia(e.target.value)} placeholder="—" />
      </Campo>
      <div className="p12 tenue">Mañana · tras orinar · antes de comer · misma báscula y posición. Si dudas, repite 2–3 veces. La BIA no decide calorías.</div>
    </Hoja>
  );
}

export function ModalCintura({ r, onCerrar, avisar }) {
  const [cm, setCm] = useState(r.cintura.ultima?.cm ?? 99);
  const guardar = async () => {
    if (!cm) return;
    await guardarCintura({ fecha: r.hoy, cm });
    avisar("Cintura guardada.");
    onCerrar();
  };
  return (
    <Hoja titulo="Cintura" sub="una vez por semana" onCerrar={onCerrar} onGuardar={guardar} guardarDeshabilitado={!cm}>
      <NumeroGrande valor={cm} onChange={setCm} paso={0.5} min={50} max={200} />
      <div className="p12 tenue">Mañana · ayunas · ombligo · relajado · fin de espiración normal · 2 medidas, apunta la media.</div>
    </Hoja>
  );
}

export function ModalRecuperacion({ r, onCerrar, avisar }) {
  const h = r.nutricion.recHoy || {};
  const [hambre, setHambre] = useState(h.hambre ?? null);
  const [energia, setEnergia] = useState(h.energia ?? null);
  const [horas, setHoras] = useState(h.suenoHoras ?? 7.5);
  const [calidad, setCalidad] = useState(h.suenoCalidad ?? null);
  const listo = hambre && energia && calidad && horas != null;
  const guardar = async () => {
    await guardarRecuperacion({ fecha: r.hoy, hambre, energia, suenoHoras: horas, suenoCalidad: calidad });
    avisar("Recuperación guardada.");
    onCerrar();
  };
  return (
    <Hoja titulo="Recuperación" sub={fechaCorta(r.hoy)} onCerrar={onCerrar} onGuardar={guardar} guardarDeshabilitado={!listo}>
      <Campo etiqueta="Hambre (1 poca · 5 mucha)"><Escala valor={hambre} onChange={setHambre} /></Campo>
      <Campo etiqueta="Energía (1 baja · 5 alta)"><Escala valor={energia} onChange={setEnergia} /></Campo>
      <div className="rejilla-2">
        <Campo etiqueta="Horas de sueño"><Stepper valor={horas} onChange={setHoras} paso={0.5} min={0} max={14} formato={n1} /></Campo>
        <Campo etiqueta="Calidad"><Escala valor={calidad} onChange={setCalidad} /></Campo>
      </div>
      <div className="p12 tenue">{MENSAJES.recuperacionImporta}</div>
    </Hoja>
  );
}

export function ModalCierre({ r, onCerrar, avisar }) {
  const d = r.nutricion.recHoy || {};
  const [kcal, setKcal] = useState(d.kcal ?? "");
  const [p, setP] = useState(d.proteinaG ?? "");
  const [c, setC] = useState(d.carbosG ?? "");
  const [g, setG] = useState(d.grasaG ?? "");
  const [pasos, setPasos] = useState(d.pasos ?? "");
  const [social, setSocial] = useState(!!d.comidaSocial);
  const [estimada, setEstimada] = useState(!!d.comidaSocialEstimada);
  const [notas, setNotas] = useState(d.notas ?? "");
  const guardar = async () => {
    await guardarCierre({ fecha: r.hoy, kcal, proteinaG: p, carbosG: c, grasaG: g, pasos, comidaSocial: social, comidaSocialEstimada: estimada, notas });
    avisar(social ? MENSAJES.comidaSocial : "Día cerrado. " + MENSAJES.totalDelDia);
    onCerrar();
  };
  const campo = (etiqueta, v, set, ph) => (
    <Campo etiqueta={etiqueta}><input className="input" type="number" inputMode="numeric" value={v} onChange={(e) => set(e.target.value)} placeholder={ph} /></Campo>
  );
  return (
    <Hoja titulo="Cierre del día" sub={fechaCorta(r.hoy)} onCerrar={onCerrar} onGuardar={guardar} guardarDeshabilitado={!kcal}>
      <div className="p13 medio">Copia el total del día de Fitia y los pasos del Garmin. Objetivo {n0(r.kcal)} kcal · {r.macros.p} P · {r.macros.c} C · {r.macros.g} G.</div>
      {campo("Kcal totales", kcal, setKcal, String(r.kcal))}
      <div className="rejilla-3">
        {campo("Proteína g", p, setP, String(r.macros.p))}
        {campo("Carbos g", c, setC, String(r.macros.c))}
        {campo("Grasa g", g, setG, String(r.macros.g))}
      </div>
      {campo("Pasos del día", pasos, setPasos, "12800")}
      <Check activo={social} onChange={(v) => { setSocial(v); if (!v) setEstimada(false); }}>Hubo comida social</Check>
      {social ? <Check activo={estimada} onChange={setEstimada}>La he estimado razonablemente y está dentro del total</Check> : null}
      <Campo etiqueta="Notas (opcional)"><textarea className="input texto" value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Molestias, sueño raro, viaje…" /></Campo>
      <div className="p12 tenue">Proteína ~{PROTEINA_RANGO.min}–{PROTEINA_RANGO.max} g está bien. Sin ayuno punitivo ni cardio de castigo.</div>
    </Hoja>
  );
}

export function ModalCarrera({ r, onCerrar, avisar }) {
  const caco = r.running.caco;
  const nivel = r.running.nivel;
  const [correr, setCorrer] = useState(caco.correr * caco.bloques);
  const [andar, setAndar] = useState(caco.andar * caco.bloques);
  const [km, setKm] = useState("");
  const [fc, setFc] = useState(r.running.ultima?.fcMedia ?? 125);
  const [fcMax, setFcMax] = useState("");
  const [rpe, setRpe] = useState(null);
  const [sens, setSens] = useState(null);
  const [dolor, setDolor] = useState(0);
  const [persiste, setPersiste] = useState(false);
  const [altera, setAltera] = useState(false);
  const [interfiere, setInterfiere] = useState(false);
  const sem = semaforoDolor({ dolor, persiste, alteraMarcha: altera });
  const colorDolor = { GREEN: "var(--verde)", YELLOW: "var(--acento)", RED: "var(--rojo)" }[sem];
  const guardar = async () => {
    const res = await guardarCarrera({ fecha: r.hoy, nivel, duracionMin: Number(correr) + Number(andar), correrMin: correr, andarMin: andar, distanciaKm: km, fcMedia: fc, fcMax, rpe, sensacion: sens, dolor, persiste, alteraMarcha: altera, interfiere });
    if (res.semaforo === "RED") avisar("Rojo: parar running y valorar.");
    else if (res.semaforo === "YELLOW") avisar("Amarillo: mantén esta sesión, no progreses.");
    else if (res.hold) avisar(MENSAJES.runningInterfiere);
    else if (res.subeA) avisar(`Sesión guardada. Dos en verde: la próxima puede ser ${res.subeA}.`);
    else avisar("Sesión guardada. El running no debe perjudicar la hipertrofia.");
    onCerrar();
  };
  return (
    <Hoja titulo={`Sesión CaCo ${caco.codigo}`} sub={fechaCorta(r.hoy)} onCerrar={onCerrar} onGuardar={guardar}>
      <div className="rejilla-2">
        <Campo etiqueta="Min corriendo"><Stepper valor={correr} onChange={setCorrer} min={0} max={180} /></Campo>
        <Campo etiqueta="Min andando"><Stepper valor={andar} onChange={setAndar} min={0} max={120} /></Campo>
        <Campo etiqueta="FC media"><Stepper valor={fc} onChange={setFc} min={60} max={220} /></Campo>
        <Campo etiqueta="Dolor 0–10"><div className="stepper"><button type="button" onClick={() => setDolor(Math.max(0, dolor - 1))}>−</button><div className="valor" style={{ borderColor: colorDolor, color: colorDolor }}>{dolor}</div><button type="button" onClick={() => setDolor(Math.min(10, dolor + 1))}>+</button></div></Campo>
      </div>
      <div className="rejilla-2">
        <Campo etiqueta="Km (Garmin, opcional)"><input className="input" type="number" inputMode="decimal" step="0.01" value={km} onChange={(e) => setKm(e.target.value)} placeholder="—" /></Campo>
        <Campo etiqueta="FC máx (opcional)"><input className="input" type="number" inputMode="numeric" value={fcMax} onChange={(e) => setFcMax(e.target.value)} placeholder="—" /></Campo>
      </div>
      <Campo etiqueta="RPE (objetivo 3–4)"><Escala valor={rpe} onChange={setRpe} desde={1} hasta={10} /></Campo>
      <Campo etiqueta="Sensación (1 mal · 5 genial)"><Escala valor={sens} onChange={setSens} /></Campo>
      <Check activo={persiste} onChange={setPersiste}>Dolor localizado, recurrente o que persistió al día siguiente (amarillo)</Check>
      <Check activo={altera} onChange={setAltera}>Altera la marcha, hinchazón o duele andando (rojo)</Check>
      <Check activo={interfiere} onChange={setInterfiere}>Interfiere con la fuerza: piernas fatigadas, rendimiento a la baja (congela la progresión)</Check>
      <div className="p12 tenue">{nutricionRunning(Number(correr) + Number(andar))}</div>
    </Hoja>
  );
}

export function ModalKcal({ r, ajustes, onCerrar, avisar }) {
  const [kcal, setKcal] = useState(ajustes.kcalObjetivo);
  const [p, setP] = useState(ajustes.proteinaG);
  const [g, setG] = useState(ajustes.grasaG);
  const [motivo, setMotivo] = useState("");
  const c = Math.max(0, Math.round((Number(kcal) - Number(p) * 4 - Number(g) * 9) / 4));
  const salto = Math.abs(Number(kcal) - ajustes.kcalObjetivo);
  const guardar = async () => {
    await cambiarKcal({ kcal, proteinaG: p, carbosG: c, grasaG: g, motivo });
    avisar(`Objetivo actualizado: ${n0(kcal)} kcal.`);
    onCerrar();
  };
  return (
    <Hoja titulo="Cambiar kcal" sub={`ahora ${n0(ajustes.kcalObjetivo)}`} onCerrar={onCerrar} onGuardar={guardar} guardarDeshabilitado={!kcal || Number(kcal) < 1200}>
      <div className="p13 medio">Sugerencia de FORJA: <strong className="acento">{r.nutricion.sugerencia.accion.replace("_", " ")}</strong> · {r.nutricion.sugerencia.motivo}</div>
      <Campo etiqueta="Kcal/día"><Stepper valor={kcal} onChange={setKcal} paso={50} min={1200} max={5000} formato={n0} /></Campo>
      <div className="rejilla-3">
        <Campo etiqueta="Proteína g"><Stepper valor={p} onChange={setP} paso={5} min={100} max={300} /></Campo>
        <Campo etiqueta="Grasa g"><Stepper valor={g} onChange={setG} paso={5} min={40} max={150} /></Campo>
        <Campo etiqueta="Carbos g"><div className="stepper"><div className="valor">{c}</div></div></Campo>
      </div>
      <Campo etiqueta="Motivo (queda en el historial)"><input className="input texto" value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Ej.: 2 semanas plano con adherencia 90 %" /></Campo>
      {salto > 150 ? <div className="caja acento p13">Salto de {n0(salto)} kcal: el plan habla de ajustes de 100–150. Tú decides.</div> : null}
      <div className="p12 tenue">Cambios de 100 en 100, mínimo 14 días entre cambios. El carbohidrato ajusta el resto.</div>
    </Hoja>
  );
}

export function ModalGanancia({ ajustes, onCerrar, avisar }) {
  const [sup, setSup] = useState(150);
  const guardar = async () => { await empezarGanancia(sup); avisar(`Ganancia iniciada: ${n0(ajustes.kcalObjetivo + sup)} kcal.`); onCerrar(); };
  return (
    <Hoja titulo="Empezar ganancia" sub="solo con mantenimiento confirmado" onCerrar={onCerrar} onGuardar={guardar} textoGuardar="Empezar ganancia">
      <div className="p13 medio">Mantenimiento confirmado: <strong>{n0(ajustes.kcalObjetivo)} kcal</strong>. Superávit inicial +150–200 kcal. Ritmo deseado ~0,25–0,45 kg/mes. Revisión cada ~4 semanas.</div>
      <Campo etiqueta="Superávit"><Stepper valor={sup} onChange={setSup} paso={25} min={150} max={200} formato={(v) => `+${v}`} /></Campo>
      <div className="num num-36 centro">{n0(ajustes.kcalObjetivo + sup)} <span className="unidad">kcal/día</span></div>
    </Hoja>
  );
}

export function ModalMiniCut({ ajustes, onCerrar, avisar }) {
  const mant = ajustes.mantenimientoKcal || ajustes.tdeeReferencia || ajustes.kcalObjetivo;
  const [kcal, setKcal] = useState(mant - 400);
  const guardar = async () => { await empezarMiniCut(kcal); avisar(`Mini-cut iniciado a ${n0(kcal)} kcal · 4–6 semanas.`); onCerrar(); };
  return (
    <Hoja titulo="Mini-cut" sub="4–6 semanas · no por calendario" onCerrar={onCerrar} onGuardar={guardar} textoGuardar="Empezar mini-cut">
      <div className="p13 medio">Solo si hay acumulación clara de grasa, quieres reducirla y el mantenimiento actual es conocido ({n0(mant)} kcal). El ritmo objetivo es el mismo del cut: ~0,4–0,6 %/semana.</div>
      <Campo etiqueta="Kcal/día del mini-cut"><Stepper valor={kcal} onChange={setKcal} paso={50} min={1500} max={mant} formato={n0} /></Campo>
      <div className="p12 tenue">Déficit: {n0(mant - kcal)} kcal/día respecto al mantenimiento conocido.</div>
    </Hoja>
  );
}

export function Modales({ modal, r, ajustes, onCerrar, avisar }) {
  if (!modal || !r) return null;
  const props = { r, ajustes, onCerrar, avisar };
  switch (modal) {
    case "peso": return <ModalPeso {...props} />;
    case "cintura": return <ModalCintura {...props} />;
    case "recup": return <ModalRecuperacion {...props} />;
    case "cierre": return <ModalCierre {...props} />;
    case "carrera": return <ModalCarrera {...props} />;
    case "kcal": return <ModalKcal {...props} />;
    case "ganancia": return <ModalGanancia {...props} />;
    case "minicut": return <ModalMiniCut {...props} />;
    default: return null;
  }
}

export { CACO, CUT };
