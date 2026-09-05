/*
 * Temporizador de descanso. Cuenta contra el reloj del sistema (no sumando
 * segundos) para que al volver a la app el número sea el correcto. El fin se
 * persiste en la sesión para sobrevivir a una recarga.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { mmss } from "../logica/formato.js";

function vibrar() {
  try { navigator.vibrate?.([200, 100, 200, 100, 400]); } catch { /* sin vibración */ }
}

export function useTemporizador(finInicial = null, alCambiar) {
  const [finEn, setFinEn] = useState(finInicial);
  const [restante, setRestante] = useState(0);
  const avisado = useRef(false);

  useEffect(() => { setFinEn(finInicial); }, [finInicial]);

  useEffect(() => {
    if (finEn == null) return undefined;
    const tick = () => {
      const quedan = Math.max(0, Math.round((finEn - Date.now()) / 1000));
      setRestante(quedan);
      if (quedan === 0 && !avisado.current) { avisado.current = true; vibrar(); }
    };
    tick();
    const id = setInterval(tick, 250);
    document.addEventListener("visibilitychange", tick);
    return () => { clearInterval(id); document.removeEventListener("visibilitychange", tick); };
  }, [finEn]);

  const arrancar = useCallback((segundos) => {
    avisado.current = false;
    const fin = Date.now() + segundos * 1000;
    setFinEn(fin);
    alCambiar?.(fin);
  }, [alCambiar]);

  const sumar = useCallback((segundos) => {
    avisado.current = false;
    setFinEn((f) => { const n = (f ?? Date.now()) + segundos * 1000; alCambiar?.(n); return n; });
  }, [alCambiar]);

  const parar = useCallback(() => { setFinEn(null); setRestante(0); alCambiar?.(null); }, [alCambiar]);

  return { activo: finEn != null, restante, terminado: finEn != null && restante === 0, texto: mmss(restante), arrancar, sumar, parar };
}
