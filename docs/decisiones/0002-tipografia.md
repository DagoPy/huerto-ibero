# 0002 — Tipografía: "Letrero del huerto" (Recursive)

- **Fecha:** 2026-11-09
- **Estado:** Aceptada

## Contexto

La interfaz usaba `system-ui` como fuente provisional. Se compararon tres direcciones
con una muestra (título, encabezados de tabla y fechas) a 390 px y en escritorio:

- A. Cuaderno de campo: Fraunces + Public Sans.
- B. Letrero del huerto: Recursive (una sola familia).
- C. Cartel estudiantil: Bricolage Grotesque + Atkinson Hyperlegible Next / Mono.

## Decisión

Se eligió **B, Recursive**, una sola familia variable en la que cada rol cambia sus ejes:

| Rol | Uso | Ejes |
| --- | --- | --- |
| Display | h1, h2 | `CASL 1` (casual, como letrero pintado a mano) |
| Body | texto, controles, encabezados de tabla | `CASL 0`, `MONO 0` |
| Data | fechas (celdas y campo de trasplante) | `MONO 1` (dígitos alineados) |

- Fuente autoalojada con `@fontsource-variable/recursive` (`full.css`), sin peticiones a
  terceros. Funciona igual en GitHub Pages.
- Tokens en `src/styles/tokens.css`: `--font-family`, `--font-variation-*`,
  `--font-weight-*`, `--leading-*` y la escala `--text-xs` … `--text-2xl`. Hacia arriba es
  modular (razón 1.2 a 390 px que crece hasta 1.25 a 1280 px con `clamp()`); la base es
  16 px.

## Consecuencias

- Se descarga un solo archivo, de ~305 KB (subconjunto latino con todos los ejes), que
  queda en caché. Si el peso llega a importar, se puede servir solo `casl` + `mono` con
  `@font-face` propios.
- Los componentes nuevos no eligen fuente: usan los roles por token.
