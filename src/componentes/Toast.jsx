import { createContext, useCallback, useContext, useRef, useState } from "react";

const Contexto = createContext(() => {});

export function ProveedorToast({ children }) {
  const [texto, setTexto] = useState(null);
  const tiempo = useRef(null);
  const avisar = useCallback((t, ms = 2600) => {
    setTexto(t);
    clearTimeout(tiempo.current);
    tiempo.current = setTimeout(() => setTexto(null), ms);
  }, []);
  return (
    <Contexto.Provider value={avisar}>
      {children}
      {texto ? <div className="toast" onClick={() => setTexto(null)}>{texto}</div> : null}
    </Contexto.Provider>
  );
}

export function useToast() {
  return useContext(Contexto);
}
