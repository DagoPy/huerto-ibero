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
- **ESLint + Prettier** para estilo.
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
  storage/           # Persistencia (localStorage, export/import)
  app/               # Rutas, layout, providers
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

> Se definirán al crear el proyecto con Vite. Previstos:

```
npm install        # instalar dependencias
npm run dev        # servidor de desarrollo
npm run test       # pruebas (Vitest)
npm run lint       # ESLint
npm run build      # build de producción
```

## Estado

- [x] Estructura inicial del repositorio y contexto.
- [ ] Scaffold de Vite + React + TS.
- [ ] Modelo de dominio (cultivo, etapas, plan).
- [ ] Datos de cultivos del libro.
- [ ] UI del planeador.
- [ ] Despliegue en GitHub Pages.
