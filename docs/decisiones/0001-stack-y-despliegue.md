# 0001 — Stack y despliegue

- **Fecha:** 2026-11-02
- **Estado:** Aceptada

## Contexto

Sitio para planear un huerto. v1 solo calcula fechas, pero se esperan más funciones
(riego, guía de camas, visualización del huerto). Un solo desarrollador por ahora.
Hosting gratuito deseable.

## Decisión

- React + TypeScript + Vite: componentes reutilizables y tipos para evitar errores en el
  cálculo de fechas y en los datos de cultivos.
- Sin backend; datos del usuario en `localStorage` con export/import JSON.
- Despliegue estático en GitHub Pages vía GitHub Actions.

## Consecuencias

- Los planes no se comparten entre dispositivos (salvo exportando el JSON).
- Si en el futuro se necesitan cuentas o planes compartidos, se agregará un backend; por
  eso la persistencia queda aislada en `src/storage/`.
