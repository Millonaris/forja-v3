/*
 * FORJA 3.0 · Raíz de la app. Sin router: la navegación es estado. El hash
 * solo sirve para los atajos del manifest (#entrenar, #peso).
 */

import { useCallback, useEffect, useState } from "react";

import { Modales } from "./componentes/Modales.jsx";
import NavInferior from "./componentes/NavInferior.jsx";
import { ProveedorToast, useToast } from "./componentes/Toast.jsx";
import { asegurarAjustes } from "./datos/db.js";
import { useResumen } from "./ganchos/useDatos.js";
import { hoyISO } from "./logica/fechas.js";
import Ajustes from "./pantallas/Ajustes.jsx";
import Entrenar from "./pantallas/Entrenar.jsx";
import Hoy from "./pantallas/Hoy.jsx";
import Plan from "./pantallas/Plan.jsx";
import Progreso from "./pantallas/Progreso.jsx";
import Revision from "./pantallas/Revision.jsx";

function Cuerpo() {
  const [hoy, setHoy] = useState(hoyISO());
  const [nav, setNav] = useState({ tab: "hoy", vista: null, sel: null });
  const [modal, setModal] = useState(null);
  const avisar = useToast();
  const r = useResumen(hoy);

  // El día cambia a medianoche o al volver a la app al día siguiente.
  useEffect(() => {
    const comprobar = () => { const h = hoyISO(); setHoy((v) => (v === h ? v : h)); };
    const id = setInterval(comprobar, 60_000);
    document.addEventListener("visibilitychange", comprobar);
    return () => { clearInterval(id); document.removeEventListener("visibilitychange", comprobar); };
  }, []);

  useEffect(() => { asegurarAjustes(); }, []);

  const ir = useCallback((tab, vista = null, sel = null) => {
    setNav({ tab, vista, sel });
    setModal(null);
    window.scrollTo({ top: 0 });
  }, []);

  // Atajos del manifest.
  useEffect(() => {
    const h = window.location.hash;
    if (h === "#entrenar") ir("entrenar", "fuerza");
    if (h === "#peso") setModal("peso");
    if (h) history.replaceState(null, "", window.location.pathname);
  }, [ir]);

  // Si hay sesión abierta al arrancar, se va directo a ella la primera vez.
  const [saltado, setSaltado] = useState(false);
  useEffect(() => {
    if (r && !saltado) { setSaltado(true); if (r.fuerza.abierta) ir("entrenar", "live", r.fuerza.abierta.id); }
  }, [r, saltado, ir]);

  if (!r) return <div className="app"><div className="contenido"><div className="t acento" style={{ fontSize: 40 }}>FORJA</div></div></div>;

  const props = { r, ajustes: r.ajustes, ir, abrirModal: setModal, avisar, sel: nav.sel };
  const vistaEntrenar = nav.tab === "entrenar" ? nav.vista || "menu" : null;
  const cambiarTab = (t) => ir(t, t === "entrenar" && r.fuerza.abierta ? "live" : null, t === "entrenar" && r.fuerza.abierta ? r.fuerza.abierta.id : null);

  return (
    <div className="app">
      <main className="contenido" key={nav.tab + (nav.vista || "") + (nav.sel || "")}>
        {nav.tab === "hoy" ? <Hoy {...props} /> : null}
        {nav.tab === "entrenar" ? <Entrenar {...props} vista={vistaEntrenar} /> : null}
        {nav.tab === "progreso" ? <Progreso {...props} vista={nav.vista || "cuerpo"} /> : null}
        {nav.tab === "plan" ? (nav.vista === "revision" ? <Revision {...props} /> : nav.vista === "ajustes" ? <Ajustes {...props} /> : <Plan {...props} />) : null}
      </main>
      <NavInferior activa={nav.tab} onCambiar={cambiarTab} />
      <Modales modal={modal} r={r} ajustes={props.ajustes} onCerrar={() => setModal(null)} avisar={avisar} />
    </div>
  );
}

export default function App() {
  return (
    <ProveedorToast>
      <Cuerpo />
    </ProveedorToast>
  );
}
