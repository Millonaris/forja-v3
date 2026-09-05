# FORJA 3.0

App personal de entrenamiento y nutrición: hipertrofia, definición, running
CaCo, postura, core y recuperación. Local, sin cuentas, sin servidor.

> **FORJA te dice qué toca después; tú decides cuándo hacerlo.**

Rehecha desde cero sobre el diseño de Claude Design (carpeta
`Aplicación de Gym Industrial/`) y los dos documentos del 5 de septiembre de
2026 que están en `docs/`.

## Instalarla en el móvil

1. Abre la URL publicada en Chrome (Android) o Safari (iPhone).
2. Menú del navegador → **Añadir a pantalla de inicio** / **Instalar app**.
3. Funciona sin conexión y se actualiza sola al publicar una versión nueva.

## Comandos

```bash
npm install
npm run dev        # http://localhost:5174 (también en la wifi, para el móvil)
npm test           # pruebas de las reglas del plan
npm run build      # genera dist/
npm run publicar   # sube dist/ a la rama gh-pages del repo (ver scripts/publicar.sh)
```

## Copia de seguridad

Todos los datos viven en el móvil (IndexedDB). En PLAN → Ajustes se exporta un
JSON con todo (fotos incluidas) y se importa en otro dispositivo sin borrar
nada de lo que hubiera.
