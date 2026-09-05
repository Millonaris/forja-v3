import { useEffect, useState } from "react";

export function Boton({ variante = "primario", children, onClick, disabled, className = "", style, tipo = "button" }) {
  return (
    <button type={tipo} className={`btn btn-${variante} ${className}`} onClick={onClick} disabled={disabled} style={style}>
      {children}
    </button>
  );
}

export function Volver({ texto, onClick }) {
  return <button className="btn-volver" onClick={onClick}>← {texto}</button>;
}

/** Selector 1–5 (o el rango que se pida). */
export function Escala({ valor, onChange, desde = 1, hasta = 5, etiquetas }) {
  const n = hasta - desde + 1;
  return (
    <div className="escala">
      {Array.from({ length: n }, (_, i) => {
        const v = desde + i;
        return (
          <button key={v} type="button" className={valor === v ? "activo" : ""} onClick={() => onChange(v)} title={etiquetas?.[i]}>
            {v}
          </button>
        );
      })}
    </div>
  );
}

/** −/valor/+ con límites. */
export function Stepper({ valor, onChange, paso = 1, min = 0, max = 999, formato = (v) => v, grande = false, unidad }) {
  const fijar = (v) => onChange(Math.min(max, Math.max(min, Math.round(v * 100) / 100)));
  return (
    <div className={`stepper ${grande ? "grande" : ""}`}>
      <button type="button" onClick={() => fijar((Number(valor) || 0) - paso)} aria-label="menos">−</button>
      <div className="valor">{formato(valor)}{unidad ? <span className="unidad" style={{ marginLeft: 4 }}>{unidad}</span> : null}</div>
      <button type="button" onClick={() => fijar((Number(valor) || 0) + paso)} aria-label="más">+</button>
    </div>
  );
}

/** Campo numérico grande con −/+ a los lados y edición directa. */
export function NumeroGrande({ valor, onChange, paso = 0.1, min = 0, max = 999, decimales = 1 }) {
  const [texto, setTexto] = useState(valor == null ? "" : String(valor));
  useEffect(() => { setTexto(valor == null || valor === "" ? "" : String(valor)); }, [valor]);
  const fijar = (v) => onChange(Math.min(max, Math.max(min, Math.round(v * 10 ** decimales) / 10 ** decimales)));
  return (
    <div className="stepper grande">
      <button type="button" onClick={() => fijar((Number(valor) || 0) - paso)} aria-label="menos">−</button>
      <input className="input grande" type="number" inputMode="decimal" step={paso} value={texto}
        onChange={(e) => { setTexto(e.target.value); const n = Number(e.target.value.replace(",", ".")); if (e.target.value !== "" && !Number.isNaN(n)) onChange(n); }}
        onBlur={() => { if (texto === "") onChange(null); }} />
      <button type="button" onClick={() => fijar((Number(valor) || 0) + paso)} aria-label="más">+</button>
    </div>
  );
}

export function Check({ activo, onChange, children }) {
  return (
    <div className={`check ${activo ? "activo" : ""}`} onClick={() => onChange(!activo)} role="checkbox" aria-checked={!!activo}>
      <div className="cajita" />
      <div>{children}</div>
    </div>
  );
}

export function Segmentos({ opciones, valor, onChange }) {
  return (
    <div className="segmentos">
      {opciones.map((o) => (
        <button key={o.id} type="button" className={valor === o.id ? "activo" : ""} onClick={() => onChange(o.id)}>{o.texto}</button>
      ))}
    </div>
  );
}

export function Campo({ etiqueta, children }) {
  return (
    <div className="campo">
      <div className="etiqueta">{etiqueta}</div>
      {children}
    </div>
  );
}

export function Semaforo({ color, children }) {
  const clase = { VERDE: "verde", AMARILLO: "amarillo", ROJO: "rojo", GREEN: "verde", YELLOW: "amarillo", RED: "rojo" }[color] || "gris";
  return (
    <div className="caja" style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div className={`punto ${clase}`} />
      <div className="p13 medio">{children}</div>
    </div>
  );
}
