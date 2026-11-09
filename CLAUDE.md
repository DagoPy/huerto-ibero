# Planeador de Huerto Biointensivo

Contexto del proyecto para Claude Code y cualquier persona que colabore.

## Qué es

Sitio web para planear la siembra de un huerto universitario (grupo estudiantil).
El usuario elige las hortalizas que quiere cultivar, fija la **fecha de trasplante a la
cama de siembra** y la app calcula hacia atrás y hacia adelante todas las demás fechas
(preparación de composta, siembra en almácigo 1, repique a almácigo 2, preparación de la
cama, cosecha, etc.).

**Principio central:** la fecha de trasplante es el ancla. Toda fecha se deriva de ella.

## Fuente de conocimiento

- Libro principal: *Cómo cultivar más vegetales* — John Jeavons (método biointensivo).
- El usuario irá proporcionando datos del libro (tablas maestras, tiempos en almácigo,
  días a cosecha, etc.). **Los datos de cultivos no se inventan**: si un valor no viene
  del libro o de una fuente citada, se marca como `TODO` / pendiente de confirmar.
- Cada dato de cultivo debe registrar su fuente (libro + página/tabla, o URL).
- El conocimiento del dominio se documenta en [docs/dominio/](docs/dominio/).

## Alcance actual (v1)

Solo **cálculo de fechas**:
1. Catálogo de hortalizas con sus tiempos (semanas en almácigo, días a cosecha, ...).
2. Seleccionar hortalizas y asignar fecha de trasplante a cada una (o a la cama).
3. Mostrar el calendario/línea de tiempo resultante de cada cultivo.
4. Guardar el plan en el navegador (localStorage) y exportar/importar (JSON).

### Futuro (no implementar todavía, pero no bloquear)
- Cálculo de riego.
- Guía paso a paso para preparar una cama de siembra (doble excavación).
- Visualización/plano del huerto y de las camas.
- Rotación de cultivos, asociaciones, rendimientos esperados.
- Posible backend / cuentas compartidas.

## Stack

- **React + TypeScript + Vite**
- **date-fns** para aritmética de fechas.
- **Vitest** + Testing Library para pruebas.
- **oxlint** para lint (viene con la plantilla actual de Vite).
- Sin backend. Persistencia en `localStorage`.
- Despliegue en **GitHub Pages** mediante GitHub Actions.
- Gestor de paquetes: **npm** (Node 22).

Decisiones de arquitectura registradas en [docs/decisiones/](docs/decisiones/).

## Arquitectura (planeada)

```
src/
  domain/            # Lógica pura, SIN React. Tipos y cálculos.
    crops/           # Tipos de cultivo y catálogo de datos
    schedule/        # Cálculo de fechas a partir del trasplante
  features/          # Una carpeta por funcionalidad de UI
    planner/         # v1: planeador de fechas
    (irrigation/, bed-guide/, garden-map/ ... a futuro)
  shared/            # Componentes, hooks y utilidades reutilizables
  styles/            # tokens.css (tokens de diseño)
  storage/           # (futuro) Persistencia (localStorage, export/import)
  app/               # Componente raíz; a futuro rutas, layout, providers
```

Reglas:
- `domain/` no importa nada de React ni del navegador → se prueba con tests unitarios.
- Cada feature nueva vive en `features/<nombre>/` y consume `domain/`.
- Los datos de cultivos son datos (archivo TS/JSON tipado), no lógica dispersa en componentes.
- Las etapas del calendario se definen como datos (offset relativo al trasplante), para
  poder añadir etapas nuevas sin reescribir el cálculo.

## Convenciones

- **Idioma:** código (variables, funciones, tipos, archivos) en **inglés**.
  Interfaz de usuario, documentación y comentarios explicativos del dominio en **español**.
- **Commits:** [Conventional Commits](https://www.conventionalcommits.org/) con la
  descripción en **español** (`feat: agrega cálculo de fecha de almácigo`). Los prefijos
  (`feat`, `fix`, `docs`, `test`, `refactor`, `chore`) se mantienen en inglés.
- **Ramas:** `main` siempre desplegable. Trabajo en `feat/<tema>`, `fix/<tema>`,
  `docs/<tema>`; se integran a `main` al terminar.
- **Fechas:** manejar fechas de calendario como *date-only* (`YYYY-MM-DD`) para evitar
  desfases por zona horaria. Nunca usar `new Date("YYYY-MM-DD")` directo (lo interpreta en
  UTC); usar `parseISO` de date-fns.
- Todo cálculo de fechas nuevo lleva su test.

## Comandos

```
npm install          # instalar dependencias
npm run dev          # servidor de desarrollo (http://localhost:5173/huerto-ibero/)
npm run test         # pruebas en modo watch (Vitest); `npm run test -- --run` una sola vez
npm run lint         # oxlint
npm run build        # verificación de tipos + build de producción
```

`vite.config.ts` usa `base: '/huerto-ibero/'` porque GitHub Pages publica en
`https://dagopy.github.io/huerto-ibero/`.

## Estado

- [x] Estructura inicial del repositorio y contexto.
- [x] Scaffold de Vite + React + TS.
- [x] Modelo de dominio y cálculo de almácigos y cosecha ([docs](docs/dominio/calendario-de-siembra.md)).
- [x] Catálogo de los 60 vegetales y hortalizas del libro (columnas D, E, H, L, M, R, S, T).
- [x] UI mínima del planeador.
- [ ] Composta y preparación de cama (faltan datos del libro).
- [x] Condición de siembra para los valores con código `#`.
- [ ] Guardar el plan en localStorage y exportar/importar.
- [ ] Despliegue en GitHub Pages.

## Diseño de interfaz

- Estilos en CSS plano (sin Tailwind). Única fuente de diseño: `src/styles/tokens.css`.
  Usar solo `var(--token)`; no escribir colores sueltos ni leer archivos de paleta.
- El color nunca es la única señal (etapas, estados): acompañar con texto, icono o patrón.
- Texto de interfaz en español; no inventar datos de cultivos ni textos agronómicos.
- Mobile-first: verificar cada cambio visual con Playwright en 390px y en escritorio,
  una captura por vista y solo al final de la iteración.
- No instalar librerías de UI sin consultarme (usar /pick-ui-library).
- Respetar prefers-reduced-motion. Movimiento solo como respuesta a una acción del usuario.