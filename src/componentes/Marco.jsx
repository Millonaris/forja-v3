/** Tarjeta "blueprint": borde fino y marcas de registro en las esquinas. */
export default function Marco({ children, acentuado = false, suave = false, onClick, className = "", style }) {
  const clases = ["marco", acentuado && "acentuado", suave && "suave", onClick && "pulsable", className].filter(Boolean).join(" ");
  return (
    <div className={clases} onClick={onClick} style={style} role={onClick ? "button" : undefined}>
      <i className="esquina tl" /><i className="esquina tr" /><i className="esquina bl" /><i className="esquina br" />
      {children}
    </div>
  );
}
