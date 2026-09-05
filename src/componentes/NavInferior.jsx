const PESTANAS = [
  { id: "hoy", texto: "Hoy", glifo: "◉" },
  { id: "entrenar", texto: "Entrenar", glifo: "▲" },
  { id: "progreso", texto: "Progreso", glifo: "◢" },
  { id: "plan", texto: "Plan", glifo: "▤" },
];

export default function NavInferior({ activa, onCambiar }) {
  return (
    <nav className="tabbar">
      {PESTANAS.map((p) => (
        <button key={p.id} className={activa === p.id ? "activo" : ""} onClick={() => onCambiar(p.id)}>
          <div className="glifo">{p.glifo}</div>
          <div className="rotulo">{p.texto}</div>
        </button>
      ))}
    </nav>
  );
}
