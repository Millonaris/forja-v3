/*
 * Fotos de progreso (§50): frente · lado · espalda · fecha. Cada ~4 semanas,
 * misma luz, misma distancia. No se calcula % de grasa visual. Todo local.
 */

import { useEffect, useRef, useState } from "react";

import { borrarFoto, guardarFoto } from "../logica/acciones.js";
import { fechaCorta } from "../logica/fechas.js";
import { useFotos } from "../ganchos/useDatos.js";
import { comprimir } from "../utiles/imagenes.js";
import { Boton, Volver } from "../componentes/Controles.jsx";

const POSES = [["front", "Frente"], ["side", "Lado"], ["back", "Espalda"]];

function Imagen({ blob, alt }) {
  const [url, setUrl] = useState(null);
  useEffect(() => { if (!blob) return undefined; const u = URL.createObjectURL(blob); setUrl(u); return () => URL.revokeObjectURL(u); }, [blob]);
  return url ? <img src={url} alt={alt} /> : null;
}

export default function Fotos({ r, ir, avisar }) {
  const fotos = useFotos();
  const [pose, setPose] = useState("front");
  const [guardando, setGuardando] = useState(false);
  const [borrar, setBorrar] = useState(null);
  const fichero = useRef(null);
  const dePose = fotos.filter((f) => f.pose === pose);

  const alElegir = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    setGuardando(true);
    try { await guardarFoto(await comprimir(f), { pose, fecha: r.hoy }); avisar("Foto guardada. Solo en este móvil."); } catch (err) { avisar(err.message); }
    setGuardando(false);
  };

  return (
    <>
      <Volver texto="Progreso" onClick={() => ir("progreso", "cuerpo")} />
      <div style={{ marginTop: -10 }}><div className="titulo-xl">Fotos</div><div className="p13 tenue">Cada ~4 semanas · misma luz, distancia y condiciones · {fotos.length} en total</div></div>
      <div className="segmentos">{POSES.map(([id, t]) => <button key={id} className={pose === id ? "activo" : ""} onClick={() => setPose(id)}>{t}</button>)}</div>
      <input ref={fichero} type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={alElegir} />
      <Boton variante="secundario" onClick={() => fichero.current?.click()} disabled={guardando}>{guardando ? "Guardando…" : `Añadir foto de ${POSES.find((p) => p[0] === pose)[1].toLowerCase()}`}</Boton>
      <div className="fotos-rejilla">
        {dePose.map((f) => (
          <div key={f.id} className="foto" onClick={() => setBorrar(borrar === f.id ? null : f.id)}>
            <Imagen blob={f.imagen} alt={`${f.pose} ${f.fecha}`} />
            <div className="pie"><span>{fechaCorta(f.fecha)}</span>{borrar === f.id ? <span className="rojo" onClick={async (e) => { e.stopPropagation(); await borrarFoto(f.id); setBorrar(null); }}>Borrar</span> : null}</div>
          </div>
        ))}
        {!dePose.length ? <div className="p13 tenue" style={{ gridColumn: "1 / -1" }}>Sin fotos de esta pose. La primera es la referencia del cut.</div> : null}
      </div>
      <div className="p12 tenue">FORJA no calcula % de grasa a partir de fotos. Se comparan a ojo, con las mismas condiciones.</div>
    </>
  );
}
