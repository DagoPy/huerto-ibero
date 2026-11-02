# Calendario de siembra (método biointensivo)

Modelo de dominio para el cálculo de fechas, basado en la *Tabla de datos de cultivo de
vegetales y hortalizas* de *Cómo cultivar más vegetales* (John Jeavons).

- Datos: [src/domain/crops/catalog.ts](../../src/domain/crops/catalog.ts)
- Cálculo: [src/domain/schedule/calculateSchedule.ts](../../src/domain/schedule/calculateSchedule.ts)

## Fecha ancla

**T = fecha de trasplante a la cama de siembra.** Si el cultivo se siembra directo en la
cama, T es la fecha de siembra directa. Todas las demás fechas se calculan desde T.

## Columnas del libro que se usan

| Columna | Significado | Uso en la app |
|---------|-------------|---------------|
| D | Tiempo de germinación (TE / TA / MT) | `germination` (informativo) |
| E | Almácigo o directo en la cama | `methods` |
| H | Semanas en el primer almácigo | `flat1` |
| L | Semanas en el segundo almácigo | `flat2` |
| M | Distancia entre plantas en la cama (cm) | `bedSpacingCm` (uso futuro) |

Cada valor conserva el texto original del libro en `bookValue` (p. ej. `"2-3^P / 3-4"`).

## Etapas calculadas

| Etapa | Fecha |
|-------|-------|
| Siembra en almácigo 1 | entre T − (H máx + L máx) y T − (H mín + L mín) |
| Repique a almácigo 2 (solo si hay L) | entre T − L máx y T − L mín |
| Trasplante a la cama | T |
| Siembra directa en la cama (cultivos directos) | T |

Como el libro da rangos (p. ej. 3-4 semanas), cada etapa es una **ventana de fechas**: la
fecha más temprana usa el tiempo máximo y la más tardía el mínimo.

Ejemplo — jitomate (H = 4-6, L = 3-4), trasplante el 1 de mayo de 2027:
- Siembra en almácigo 1: del 20 de febrero al 13 de marzo (10 a 7 semanas antes).
- Repique a almácigo 2: del 3 al 10 de abril (4 a 3 semanas antes).
- Trasplante: 1 de mayo.

## Criterios de interpretación

| Caso en la tabla | Interpretación |
|------------------|----------------|
| Alternativas con notas (`2-3^P / 3-4`) | Se toma la ventana completa: de 2 a 4 semanas. |
| `3-4+` | Se toma 3-4; el "+" queda registrado en `bookValue`. |
| `1-(2)` | Se toma 1-2. |
| `3-5 días` (maíz) | La unidad es días, no semanas. |
| `D` (espárrago, ruibarbo) | El libro no da número: no se calcula la siembra y se muestra un aviso. |
| Dos métodos (zanahoria, alcachofa, ruibarbo) | El usuario elige; el primero es el predeterminado. |
| Camote | Los 4-6 semanas de H se tratan como producción de brotes (Nota 27). |

## Pendiente

- Significado de las notas **P**, **LG**, **Q** y **D**: si cada una corresponde a una
  condición concreta, la ventana se podrá ajustar a esa condición en vez de abarcar todas.
- Cultivos **23 a 29**: no vienen en la tabla proporcionada.
- **Composta y preparación de la cama**: la tabla no incluye estos tiempos.
- **Cosecha**: la tabla no incluye días a madurez.
