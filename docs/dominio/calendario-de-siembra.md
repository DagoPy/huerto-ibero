# Calendario de siembra (método biointensivo)

Modelo de dominio para el cálculo de fechas. **Los valores numéricos se completan con
datos del libro** *Cómo cultivar más vegetales* (John Jeavons). Todo lo marcado como
`PENDIENTE` debe confirmarse con el libro antes de usarse en la app.

## Fecha ancla

**T = fecha de trasplante a la cama de siembra.** Todas las etapas se expresan como un
desplazamiento (en días o semanas) respecto a T: negativo = antes, positivo = después.

## Etapas (borrador)

| Etapa | Relación con T | Dato que la define | Fuente |
|-------|----------------|--------------------|--------|
| Iniciar pila de composta | T − (tiempo de maduración de composta) | Meses de maduración | PENDIENTE |
| Siembra en almácigo 1 (semillero) | T − (semanas totales en almácigo) | Semanas en almácigo por cultivo | PENDIENTE |
| Repique a almácigo 2 | Entre siembra en almácigo 1 y T | Semanas en almácigo 1 | PENDIENTE |
| Preparación de cama (doble excavación + composta) | T − (pocos días) | Días antes del trasplante | PENDIENTE |
| Trasplante a la cama | **T** | — | — |
| Inicio de cosecha | T + (días a madurez desde trasplante) | Días a madurez | PENDIENTE |
| Fin de cosecha | Inicio de cosecha + duración | Duración de cosecha | PENDIENTE |

Notas:
- Algunos cultivos **se siembran directo** en la cama (sin almácigo). Para ellos T es la
  fecha de siembra directa y las etapas de almácigo no aplican.
- Algunos cultivos podrían usar solo un almácigo. El modelo debe permitir 0, 1 o 2.

## Datos por cultivo (campos previstos)

| Campo | Descripción |
|-------|-------------|
| `id` | Identificador (inglés, kebab-case), p. ej. `lettuce` |
| `name` | Nombre en español, p. ej. "Lechuga" |
| `sowingMethod` | `flats` (almácigo) o `direct` (siembra directa) |
| `weeksInFlat1` | Semanas en almácigo 1 |
| `weeksInFlat2` | Semanas en almácigo 2 (0 si no aplica) |
| `daysToMaturity` | Días de trasplante a cosecha |
| `harvestDurationDays` | Duración del periodo de cosecha |
| `spacingCm` | Distancia entre plantas en la cama (uso futuro) |
| `source` | Libro + página/tabla, o URL |

## Preguntas abiertas

- ¿Tiempo de maduración de la composta que se usará (según el libro / el curso)?
- ¿Cuántos días antes del trasplante se prepara la cama?
- ¿"Días a madurez" en el libro se cuentan desde la siembra o desde el trasplante?
- ¿Qué hortalizas formarán el catálogo inicial?
