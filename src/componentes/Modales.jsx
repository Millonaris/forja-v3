/*
 * Los formularios de registro (hojas inferiores): peso, cintura,
 * recuperación, cierre del día, sesión de running y cambio de kcal.
 */

import { useState } from "react";

import { CUT, MENSAJES, NOMBRE_TIPO_DIA, PROTEINA_RANGO, RESTAURANTE } from "../datos/config.js";
import { cambiarKcal, cambiarObjetivosDia, empezarGanancia, empezarMiniCut, guardarCarrera, guardarCierre, guardarCintura, guardarPeso, guardarRecuperacion } from "../logica/acciones.js";
import { fechaCorta } from "../logica/fechas.js";
import { n0, n1 } from "../logica/formato.js";
import { nutricionRunning } from "../logica/running.js";
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
  const social = r.enCut ? r.tipoDia === "SOCIAL" : !!d.comidaSocial;
  const [kcal, setKcal] = useState(d.kcal ?? "");
  const [p, setP] = useState(d.proteinaG ?? "");
  const [c, setC] = useState(d.carbosG ?? "");
  const [g, setG] = useState(d.grasaG ?? "");
  const [pasos, setPasos] = useState(d.pasos ?? "");
  const [notas, setNotas] = useState(d.notas ?? "");
  // Social (§45): lo de Fitia hasta el restaurante + estimación rápida del restaurante.
  const [antes, setAntes] = useState(d.restauranteKcal != null && d.kcal != null ? d.kcal - d.restauranteKcal : d.kcal ?? "");
  const [preset, setPreset] = useState(d.restaurantePreset ?? null);
  const [bebidas, setBebidas] = useState(d.bebidas ?? {});
  const [ayudas, setAyudas] = useState({});
  const [ajuste, setAjuste] = useState(d.restauranteKcal != null && d.restaurantePreset ? null : null);
  const [confianza, setConfianza] = useState(d.restauranteConfianza ?? "MEDIUM");
  const [estimadaOk, setEstimadaOk] = useState(!!d.comidaSocialEstimada || social);
  const kcalPreset = RESTAURANTE.presets.find((x) => x.id === preset)?.kcal ?? 0;
  const kcalBebidas = RESTAURANTE.bebidas.reduce((t, b) => t + (bebidas[b.id] || 0) * b.kcal, 0);
  const kcalAyudas = RESTAURANTE.ayudas.reduce((t, b) => t + (ayudas[b.id] || 0) * b.kcal, 0);
  const restauranteCalculado = kcalPreset + kcalBebidas + kcalAyudas;
  const restaurante = ajuste != null && ajuste !== "" ? Number(ajuste) : restauranteCalculado;
  const totalSocial = (Number(antes) || 0) + restaurante;
  const listo = social ? totalSocial > 0 : !!kcal;

  const guardar = async () => {
    if (social) {
      await guardarCierre({ fecha: r.hoy, tipoDia: r.enCut ? r.tipoDia : null, kcal: totalSocial, proteinaG: p, carbosG: null, grasaG: null, pasos, comidaSocial: true, comidaSocialEstimada: true, restaurantePreset: preset, restauranteKcal: restaurante, restauranteConfianza: confianza, bebidas, notas });
      avisar(MENSAJES.comidaSocial + " Mañana, día normal.");
    } else {
      await guardarCierre({ fecha: r.hoy, tipoDia: r.enCut ? r.tipoDia : null, kcal, proteinaG: p, carbosG: c, grasaG: g, pasos, comidaSocial: false, comidaSocialEstimada: false, notas });
      avisar("Día cerrado. " + MENSAJES.totalDelDia);
    }
    onCerrar();
  };
  const campo = (etiqueta, v, set, ph) => (
    <Campo etiqueta={etiqueta}><input className="input" type="number" inputMode="numeric" value={v} onChange={(e) => set(e.target.value)} placeholder={ph} /></Campo>
  );
  const contador = (lista, estado, set) => (
    <div className="columna" style={{ gap: 6 }}>
      {lista.map((b) => (
        <div key={b.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div className="p13 crece" style={{ flex: 1 }}>{b.nombre} <span className="tenue">· {b.kcal} kcal</span></div>
          <button type="button" className="btn btn-chip" style={{ width: 40, padding: 0 }} onClick={() => set({ ...estado, [b.id]: Math.max(0, (estado[b.id] || 0) - 1) })}>−</button>
          <div className="t" style={{ width: 22, textAlign: "center", fontSize: 18 }}>{estado[b.id] || 0}</div>
          <button type="button" className="btn btn-chip" style={{ width: 40, padding: 0 }} onClick={() => set({ ...estado, [b.id]: (estado[b.id] || 0) + 1 })}>+</button>
        </div>
      ))}
    </div>
  );

  return (
    <Hoja titulo="Cierre del día" sub={`${fechaCorta(r.hoy)}${r.enCut ? ` · ${NOMBRE_TIPO_DIA[r.tipoDia]}` : ""}`} onCerrar={onCerrar} onGuardar={guardar} guardarDeshabilitado={!listo}>
      {social ? (
        <>
          <div className="p13 medio">Día social: objetivo {n0(r.kcal)} kcal y ~{r.macros.p} g de proteína; carbos y grasa flexibles. No existe “comida gratis”, pero tampoco castigo.</div>
          {campo("Kcal de Fitia ANTES del restaurante", antes, setAntes, "1200")}
          <Campo etiqueta="Restaurante · tamaño (si dudas, el superior)">
            <div style={{ display: "flex", gap: 6 }}>
              {RESTAURANTE.presets.map((x) => <button key={x.id} type="button" className={`btn btn-chip ${preset === x.id ? "activo" : ""}`} style={{ flex: 1 }} onClick={() => { setPreset(x.id); setAjuste(null); }}>{x.nombre} · {x.kcal}</button>)}
            </div>
          </Campo>
          <Campo etiqueta="Bebidas">{contador(RESTAURANTE.bebidas, bebidas, setBebidas)}</Campo>
          <details>
            <summary className="etiqueta" style={{ cursor: "pointer" }}>Añadir por unidades (opcional)</summary>
            <div style={{ marginTop: 8 }}>{contador(RESTAURANTE.ayudas, ayudas, setAyudas)}</div>
          </details>
          <div className="rejilla-2">
            <Campo etiqueta="Restaurante estimado (editable)"><input className="input" type="number" inputMode="numeric" value={ajuste ?? restauranteCalculado} onChange={(e) => setAjuste(e.target.value)} /></Campo>
            <Campo etiqueta="Confianza"><div style={{ display: "flex", gap: 4 }}>{RESTAURANTE.confianzas.map((x) => <button key={x.id} type="button" className={`btn btn-chip ${confianza === x.id ? "activo" : ""}`} style={{ flex: 1, padding: 0 }} onClick={() => setConfianza(x.id)}>{x.nombre}</button>)}</div></Campo>
          </div>
          <div className="num num-28 centro">{n0(totalSocial)} <span className="unidad">kcal del día</span></div>
          <div className="rejilla-2">
            {campo("Proteína g (opcional)", p, setP, String(r.macros.p))}
            {campo("Pasos del día", pasos, setPasos, "10000")}
          </div>
        </>
      ) : (
        <>
          <div className="p13 medio">Copia el total del día de Fitia y los pasos del Garmin. Objetivo {n0(r.kcal)} kcal · {r.macros.p} P · {r.macros.c} C · {r.macros.g} G.</div>
          {campo("Kcal totales", kcal, setKcal, String(r.kcal))}
          <div className="rejilla-3">
            {campo("Proteína g", p, setP, String(r.macros.p))}
            {campo("Carbos g", c, setC, String(r.macros.c))}
            {campo("Grasa g", g, setG, String(r.macros.g))}
          </div>
          {campo("Pasos del día", pasos, setPasos, "10000")}
          {r.enCut ? <div className="p12 tenue">¿Ha habido comida social? Marca el día como Social en HOY y vuelve a cerrar.</div> : null}
        </>
      )}
      <Campo etiqueta="Notas (opcional)"><textarea className="input texto" value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Molestias, sueño raro, viaje…" /></Campo>
      <div className="p12 tenue">Proteína ~{PROTEINA_RANGO.min}–{PROTEINA_RANGO.max} g está bien. Sin ayuno punitivo ni cardio de castigo.{estimadaOk ? "" : ""}</div>
    </Hoja>
  );
}

export function ModalCarrera({ r, onCerrar, avisar }) {
  // Duración, FC, km, RPE y dolor numérico los tiene el Garmin: aquí solo lo
  // que el reloj no sabe. Los minutos se guardan con lo que marca el plan.
  const plan = r.running.plan;
  const sesion = r.running.sesion;
  const [sens, setSens] = useState(null);
  const [persiste, setPersiste] = useState(false);
  const [altera, setAltera] = useState(false);
  const [interfiere, setInterfiere] = useState(false);
  const [repetir, setRepetir] = useState(false);
  const [notas, setNotas] = useState("");
  const guardar = async () => {
    const res = await guardarCarrera({ fecha: r.hoy, sesion, duracionMin: plan.minEstimados, correrMin: plan.correrMin, andarMin: plan.andarMin, sensacion: sens, dolor: altera ? 6 : persiste ? 3 : 0, persiste, alteraMarcha: altera, interfiere, repetir, notas });
    if (res.semaforo === "RED") avisar("Rojo: parar running y valorar.");
    else if (res.semaforo === "YELLOW") avisar(`Amarillo: repite S${sesion}, no progreses.`);
    else if (res.hold) avisar(MENSAJES.runningInterfiere);
    else if (res.repetir) avisar(`Guardada. S${sesion} se repite la próxima vez. No pasa nada.`);
    else if (res.avanzaA) avisar(`S${sesion} en verde. La siguiente: S${res.avanzaA.n} · ${res.avanzaA.codigo}.`);
    else avisar("Sesión guardada. El running no debe perjudicar la hipertrofia.");
    onCerrar();
  };
  return (
    <Hoja titulo={`S${sesion} · ${plan.codigo}`} sub={fechaCorta(r.hoy)} onCerrar={onCerrar} onGuardar={guardar} textoGuardar="Sesión hecha">
      <div className="p13 medio">{plan.desc}. Los datos del reloj se quedan en el Garmin; aquí solo cómo ha ido.</div>
      <Campo etiqueta="Sensación (1 mal · 5 genial)"><Escala valor={sens} onChange={setSens} /></Campo>
      <Check activo={repetir} onChange={setRepetir}>Me costó demasiado: repetir esta sesión la próxima vez</Check>
      <Check activo={persiste} onChange={(v) => { setPersiste(v); if (v) setAltera(false); }}>Dolor localizado, recurrente o que persiste (amarillo · no progresar)</Check>
      <Check activo={altera} onChange={(v) => { setAltera(v); if (v) setPersiste(false); }}>Altera la marcha, hinchazón o duele andando (rojo · parar y valorar)</Check>
      <Check activo={interfiere} onChange={setInterfiere}>Interfiere con la fuerza: piernas fatigadas, rendimiento a la baja (congela la progresión)</Check>
      <Campo etiqueta="Notas (opcional)"><input className="input texto" value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Molestia en el sóleo, mucho calor…" /></Campo>
      <div className="p12 tenue">Sin marcar nada: sesión en verde y se avanza a la siguiente. {nutricionRunning(plan.minEstimados)}</div>
    </Hoja>
  );
}

export function ModalKcal({ r, ajustes, onCerrar, avisar }) {
  const o = ajustes.objetivosDia || CUT.objetivosDia;
  const [rest, setRest] = useState(o.REST.kcal);
  const [strength, setStrength] = useState(o.STRENGTH.kcal);
  const [social, setSocial] = useState(o.SOCIAL.kcal);
  const [kcal, setKcal] = useState(ajustes.kcalObjetivo);
  const [p, setP] = useState(ajustes.proteinaG);
  const [g, setG] = useState(ajustes.grasaG);
  const [motivo, setMotivo] = useState("");
  const carbos = (k) => Math.max(0, Math.round((Number(k) - Number(p) * 4 - Number(g) * 9) / 4));
  const sug = r.nutricion.sugerencia;
  const bajoSuelo = r.enCut && Math.min(rest, strength) < CUT.sueloKcalAutomatico;
  const media = Math.round((rest * 2 + strength * 3 + social * 2) / 7);
  const guardar = async () => {
    if (r.enCut) { await cambiarObjetivosDia({ rest, strength, social, proteinaG: p, grasaG: g, motivo }); avisar(`Objetivos actualizados: ${n0(rest)} / ${n0(strength)} / ${n0(social)} kcal.`); }
    else { await cambiarKcal({ kcal, proteinaG: p, carbosG: carbos(kcal), grasaG: g, motivo }); avisar(`Objetivo actualizado: ${n0(kcal)} kcal.`); }
    onCerrar();
  };
  return (
    <Hoja titulo="Cambiar kcal" sub={r.enCut ? `media ${n0(media)}/día` : `ahora ${n0(ajustes.kcalObjetivo)}`} onCerrar={onCerrar} onGuardar={guardar} guardarDeshabilitado={r.enCut ? !(rest && strength && social) : !kcal || Number(kcal) < 1200}>
      <div className="p13 medio">Sugerencia de FORJA: <strong className="acento">{sug.accion.replace(/_/g, " ")}</strong> · {sug.motivo}</div>
      {r.enCut ? (
        <>
          <Campo etiqueta="Descanso · kcal"><Stepper valor={rest} onChange={setRest} paso={50} min={1500} max={4000} formato={n0} /></Campo>
          <Campo etiqueta="Fuerza · kcal"><Stepper valor={strength} onChange={setStrength} paso={50} min={1500} max={4000} formato={n0} /></Campo>
          <Campo etiqueta="Social · kcal"><Stepper valor={social} onChange={setSocial} paso={50} min={1500} max={4500} formato={n0} /></Campo>
          <div className="p12 tenue">Semana estándar 2 descanso + 3 fuerza + 2 social = {n0(rest * 2 + strength * 3 + social * 2)} kcal (~{n0(media)}/día). Carbos: descanso {carbos(rest)} g · fuerza {carbos(strength)} g.</div>
          {bajoSuelo ? <div className="caja acento p13"><strong>Por debajo de 2.150 kcal.</strong> {MENSAJES.sueloKcal} Si lo haces, es decisión tuya y queda en el historial.</div> : null}
        </>
      ) : (
        <>
          <Campo etiqueta="Kcal/día"><Stepper valor={kcal} onChange={setKcal} paso={50} min={1200} max={5000} formato={n0} /></Campo>
          <div className="p12 tenue">Carbos resultantes: {carbos(kcal)} g.</div>
        </>
      )}
      <div className="rejilla-2">
        <Campo etiqueta="Proteína g"><Stepper valor={p} onChange={setP} paso={5} min={100} max={300} /></Campo>
        <Campo etiqueta="Grasa g"><Stepper valor={g} onChange={setG} paso={5} min={40} max={150} /></Campo>
      </div>
      <Campo etiqueta="Motivo (queda en el historial)"><input className="input texto" value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Ej.: 2 semanas plano con adherencia 90 %" /></Campo>
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

export { CUT };
