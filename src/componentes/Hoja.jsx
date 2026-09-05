import { useEffect } from "react";
import { Boton } from "./Controles.jsx";

/** Modal inferior con título, subtítulo y botón Guardar. */
export default function Hoja({ titulo, sub, onCerrar, onGuardar, textoGuardar = "Guardar", children, guardarDeshabilitado = false, extra }) {
  useEffect(() => {
    const alTeclear = (e) => { if (e.key === "Escape") onCerrar?.(); };
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
  }, [onCerrar]);
  return (
    <>
      <div className="velo" onClick={onCerrar} />
      <div className="hoja" role="dialog" aria-modal="true">
        <div className="cabecera">
          <div className="titulo">{titulo}</div>
          {sub ? <div className="p12 tenue">{sub}</div> : null}
        </div>
        {children}
        {onGuardar ? <Boton variante="primario" className="mediano" onClick={onGuardar} disabled={guardarDeshabilitado}>{textoGuardar}</Boton> : null}
        {extra}
      </div>
    </>
  );
}
