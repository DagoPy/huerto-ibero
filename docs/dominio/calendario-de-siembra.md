# Calendario de siembra (método biointensivo)

Modelo de dominio para el cálculo de fechas, basado en *Cómo cultivar más vegetales*
(John Jeavons):

- *Tabla de datos de cultivo de vegetales y hortalizas* (cultivos 1 a 60, columnas A-N).
- *Tablas de referencia y planeación del huerto* (columnas O-Z).
- *Código de letras* (significado de los superíndices).

Código:
- Datos: [src/domain/crops/catalog.ts](../../src/domain/crops/catalog.ts)
- Cálculo: [src/domain/schedule/calculateSchedule.ts](../../src/domain/schedule/calculateSchedule.ts)

## Fecha ancla

**T = fecha de trasplante a la cama de siembra.** Si el cultivo se siembra directo en la
cama, T es la fecha de siembra directa. Todas las demás fechas se calculan desde T.

## Columnas del libro que se usan

| Columna | Significado | Campo |
|---------|-------------|-------|
| D | Tiempo de germinación (TE / TA / MT) | `germination` |
| E | Almácigo (Al) o directo en la cama | `propagations[].method` |
| H | Semanas en el primer almácigo | `propagations[].flats[0]` |
| L | Semanas en el segundo almácigo | `propagations[].flats[1]` |
| M | Distancia entre plantas en la cama (cm) | `bedSpacingCm` (uso futuro) |
| R | Semanas hasta la madurez | `maturity` (o `propagations[].maturity`) |
| S | Semanas en período de cosecha | `harvestPeriod` |
| T | Temporada de siembra (PR / VE / OT / IN) | `seasons` |

Cada valor conserva el texto original del libro en `bookValue` (p. ej. `"2-3^P / 3-4"`).

## Etapas calculadas

Sea `A1, A2, ... An` el tiempo en cada almácigo, `R` la madurez y `S` la cosecha:

| Etapa | Fecha |
|-------|-------|
| Siembra en almácigo 1 | T − (A1 + A2 + ... + An) |
| Repique a almácigo k | T − (Ak + ... + An) |
| Trasplante a la cama / siembra directa | T |
| Inicio de cosecha | T + R |
| Fin de cosecha (si S no es "-") | T + R + S |

Como el libro da rangos (p. ej. 3-4 semanas), cada etapa es una **ventana de fechas**.
Antes de T, la fecha más temprana usa los tiempos máximos; después de T, los mínimos.

Ejemplo: jitomate (H = 4-6, L = 3-4, R = 8-13, S = 17+), trasplante el 1 de mayo de 2027:

| Etapa | Ventana |
|-------|---------|
| Siembra en almácigo 1 | 20 feb – 13 mar (10 a 7 semanas antes) |
| Repique a almácigo 2 | 3 – 10 abr (4 a 3 semanas antes) |
| Trasplante | 1 may |
| Inicio de cosecha | 26 jun – 31 jul (8 a 13 semanas después) |
| Fin de cosecha | 23 oct – 27 nov (25 a 30 semanas después) |

## Códigos de letras relevantes para las fechas

| Código | Significado | Cómo se aplica |
|--------|-------------|----------------|
| D | Desconocido | No se calcula esa fecha y se muestra un aviso. |
| Q | El apio pasa a un **tercer almácigo** 4-6 semanas más (3-4 meses en total) | El apio tiene 3 almácigos. |
| LG | Trasplantar cuando la plántula mida ~15 cm | Solo informativo; no cambia el tiempo. |
| P | Perenne | Ver "Pendiente". |
| ** | Depende de la variedad | Se usa el rango completo. |
| + | El rendimiento puede ser mayor | No afecta el tiempo; se usa el número. |

## Criterios de interpretación

| Caso en la tabla | Interpretación |
|------------------|----------------|
| Alternativas (`2-3^P / 3-4`) | Ventana completa: de 2 a 4 semanas. |
| `4+`, `3-4+`, `17+` | Se usa el número; el "+" queda en `bookValue`. |
| `1-(2)` | 1-2. |
| `3-5 días` (maíz) | La unidad es días. |
| `Más de 42` (bardana) | 42 semanas. |
| `3-4 a 26` (cosecha del apio) | 3 a 26 semanas. |
| Madurez en años (espárrago, ruibarbo) | Depende del método: por semilla 4 y 3 años; por raíz 1 año. |
| Camote, madurez por variedad | Ventana 13-34 semanas (variedades de 3 y de 6 meses). |
| Dos métodos (zanahoria, alcachofa, espárrago, ruibarbo) | El usuario elige; el primero es el predeterminado. |
| Camote, almácigo | Las 4-6 semanas de H son la producción de brotes (Nota 27). |

**Supuesto:** las semanas a madurez (R) se cuentan **desde el trasplante a la cama**. Los
valores coinciden con los tiempos habituales desde el trasplante (p. ej. jitomate 8-13
semanas), pero el libro no lo dice explícitamente en las tablas proporcionadas.

## Pendiente

- **Código P:** el código de letras dice "Perene", pero aparece en cultivos que no son
  perennes, como pepino (`2-3^P / 3-4`) y cebolla (`6-8^P / 8-10`). Hay que revisar en el
  libro si es otro símbolo, por ejemplo `#`, que distingue la siembra en verano o en
  invierno con poco frío de la siembra en invernadero en climas muy fríos.
- **Composta y preparación de la cama:** las tablas no incluyen estos tiempos.
- **Temporada de siembra:** se muestra como dato; no se valida contra la fecha elegida.
