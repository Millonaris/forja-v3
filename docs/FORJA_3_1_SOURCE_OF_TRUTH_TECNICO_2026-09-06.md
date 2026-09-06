# FORJA 3.1 — SOURCE OF TRUTH TÉCNICO
## Lógica, estados, reglas, cálculos y datos
### Versión: 2026-09-06

---

# 0. AUTORIDAD DEL DOCUMENTO

Este archivo es la **fuente de verdad técnica** de FORJA.

El agente de Vibe Coding debe:

- implementar estas reglas;
- no reinterpretarlas;
- no simplificarlas alterando su significado;
- no inventar decisiones fisiológicas;
- no cambiar automáticamente dieta o entrenamiento fuera de estas reglas.

Si el documento visual contradice este archivo:

> **manda este archivo.**

---

# 1. CONFIGURACIÓN GLOBAL

```js
const USER = {
  sex: "male",
  age: 41,
  heightCm: 187,
  recentWeightKg: 97.0,
  mainGoal: "hypertrophy_physique",
  runningPriority: "secondary_hobby",
  creatineGPerDay: 5
};
```

---

# 2. JERARQUÍA DE PRIORIDADES

```js
const PRIORITIES = [
  "hypertrophy_physique",
  "fat_loss_with_muscle_retention",
  "strength_performance",
  "recovery",
  "running_hobby"
];
```

Regla absoluta:

> running nunca debe obligar a sacrificar hipertrofia.

Si existe conflicto:

```text
freeze_running_progression()
```

---

# 3. FASE NUTRICIONAL ACTUAL

```js
const CUT = {
  status: "scheduled",
  officialStart: "2026-09-08",
  provisionalEnd: "2026-11-30",
  preReviewAlert: "2026-11-16",

  weeklyReferenceKcal: 16050,
  weeklyAverageReferenceKcal: 2293,

  dayTargets: {
    REST: {
      kcal: 2150,
      proteinG: 175,
      carbsG: 216,
      fatG: 65
    },
    STRENGTH: {
      kcal: 2250,
      proteinG: 175,
      carbsG: 241,
      fatG: 65
    },
    SOCIAL: {
      kcal: 2500,
      proteinGoalG: 175,
      carbsG: null,
      fatG: null
    }
  },

  autoCalorieFloor: 2150
};
```

Semana estándar de referencia:

```text
2 REST + 3 STRENGTH + 2 SOCIAL
= 16.050 kcal/semana
= ~2.293 kcal/día
≈ 2.300 kcal/día
```

El sistema de calorías variables se usa por **adherencia y distribución de combustible**, no porque tenga una ventaja metabólica propia.

Hasta 2026-09-07:

```text
phase = PRE_CUT
```

Desde 2026-09-08:

```text
phase = CUT
```

---

# 4. MACROS Y TIPOS DE DÍA

## REST

```text
2150 kcal
175 P
216 C
65 G
```

## STRENGTH

```text
2250 kcal
175 P
241 C
65 G
```

## SOCIAL

```text
2500 kcal
proteína objetivo ~175 g
C/F flexibles
```

En `SOCIAL`, la app no debe exigir macros precisos porque la estimación de restaurante es inherentemente ruidosa.

Rango práctico de proteína general:

```text
~165–180 g
```

---

# 4B. LÓGICA DEL TIPO DE DÍA

```js
const DAY_TYPE = {
  REST: "REST",
  STRENGTH: "STRENGTH",
  SOCIAL: "SOCIAL"
};

function resolveNutritionDayType({ socialPlanned, strengthPlannedOrDone }) {
  if (socialPlanned) return DAY_TYPE.SOCIAL;
  if (strengthPlannedOrDone) return DAY_TYPE.STRENGTH;
  return DAY_TYPE.REST;
}

function getNutritionTarget(dayType) {
  return CUT.dayTargets[dayType];
}
```

Precedencia:

```text
SOCIAL > STRENGTH > REST
```

Running corto actual NO cambia el tipo nutricional.

---

# 5. ENTRENAMIENTO DE FUERZA — ESTADO

La adaptación post-vacaciones:

```text
completed = true
```

Estado actual:

```js
strengthReturnFromBreak = false;
```

Rutina normal.

---

# 6. SECUENCIA DE FUERZA

```js
const strengthSequence = [
  "TORSO_A",
  "PIERNA_A",
  "TORSO_B",
  "PIERNA_B"
];
```

No reset semanal.

---

# 7. TORSO A

```js
TORSO_A = [
  {name:"Jalón al pecho prono", sets:3, reps:"8-12", rir:"1-2", restSec:120},
  {name:"Remo sentado máquina agarre bajo", sets:3, reps:"8-12", rir:"1-2", restSec:120},
  {name:"Elevaciones laterales", sets:4, reps:"12-20", rir:"1-2", restSec:75},
  {name:"Press inclinado máquina", sets:3, reps:"8-12", rir:"1-2", restSec:150},
  {name:"Reverse pec deck", sets:2, reps:"12-20", rir:"1-2", restSec:75},
  {name:"Press hombro máquina", sets:2, reps:"8-12", rir:"1-2", restSec:120},
  {name:"Curl bíceps", sets:2, reps:"10-15", rir:"1-2", restSec:90},
  {name:"Tríceps polea", sets:2, reps:"10-15", rir:"1-2", restSec:90}
];
```

Total: 21 series.

---

# 8. TORSO B

```js
TORSO_B = [
  {name:"Elevaciones laterales", sets:4, reps:"12-20", rir:"1-2"},
  {name:"Remo sentado máquina agarre alto", sets:3, reps:"8-12", rir:"1-2"},
  {name:"Jalón neutro/medio", sets:3, reps:"8-12", rir:"1-2"},
  {name:"Press plano máquina", sets:3, reps:"8-12", rir:"1-2"},
  {name:"Reverse pec deck", sets:2, reps:"12-20", rir:"1-2"},
  {name:"Pec deck", sets:2, reps:"10-15", rir:"1-2"},
  {name:"Curl bíceps", sets:2, reps:"10-15", rir:"1-2"},
  {name:"Tríceps overhead cable", sets:2, reps:"10-15", rir:"1-2"}
];
```

Total: 21 series.

---

# 9. PIERNA A

```js
PIERNA_A = [
  {name:"Hack squat", sets:3, reps:"8-12", rir:"1-2"},
  {name:"Hip thrust", sets:3, reps:"8-12", rir:"1-2"},
  {name:"Prensa", sets:2, reps:"10-15", rir:"1-2"},
  {name:"Curl femoral sentado", sets:3, reps:"10-15", rir:"1-2"},
  {name:"Extensión cuádriceps", sets:2, reps:"10-15", rir:"1-2"},
  {name:"Elevaciones laterales", sets:2, reps:"12-20", rir:"1-2"},
  {name:"Gemelo de pie", sets:2, reps:"10-20", rir:"1-2"},
  {name:"Pullover", sets:2, reps:"10-15", rir:"1-2"},
  {name:"Sóleo sentado", sets:2, reps:"12-20", rir:"1-2"},
  {name:"Tibial anterior", sets:2, reps:"15-20", rir:"1-2"}
];
```

Total: 23 series.

---

# 10. PIERNA B

```js
PIERNA_B = [
  {name:"Hip thrust", sets:3, reps:"8-12", rir:"1-2"},
  {name:"Prensa sesgo glúteo", sets:3, reps:"8-12", rir:"1-2"},
  {name:"Curl femoral", sets:3, reps:"10-15", rir:"1-2"},
  {name:"Extensión lumbar 45° sesgo glúteo", sets:2, reps:"10-15", rir:"1-2"},
  {name:"Abductora", sets:2, reps:"15-25", rir:"1-2"},
  {name:"Elevaciones laterales", sets:2, reps:"12-20", rir:"1-2"},
  {name:"Pullover", sets:2, reps:"10-15", rir:"1-2"},
  {name:"Sóleo sentado", sets:2, reps:"12-20", rir:"1-2"},
  {name:"Tibial anterior", sets:2, reps:"15-20", rir:"1-2"}
];
```

Total: 21 series.

---

# 11. DOBLE PROGRESIÓN

Para un rango 8–12:

1. mantener carga;
2. ganar repeticiones;
3. cuando todas las series alcanzan el extremo alto con RIR correcto;
4. subir la carga mínima práctica;
5. volver a construir reps.

No exigir progreso en todos los ejercicios cada sesión.

---

# 12. FALLO

```text
Compuestos → RIR 1–2
Aislados → RIR 1–2
Última serie aislada ocasional → RIR 0–1
```

No fallo sistemático.

---

# 13. DELOAD

No automático por calendario.

Puede sugerirse si aparecen varias señales:

- regresión repetida;
- energía baja;
- sueño malo;
- molestias;
- rendimiento decreciente;
- fatiga acumulada.

Nunca ejecutar sin confirmación.

---

# 14. CORE

```js
CORE = [
  {name:"Dead bug", sets:2, reps:"8-10/lado"},
  {name:"Plancha lateral", sets:2, duration:"20-30s/lado"},
  {name:"Pallof press", sets:2, reps:"10-12/lado"}
];
```

Objetivo: ~2 veces/semana.

---

# 15. POSTURA

```js
POSTURE = [
  {name:"Pelvic tilt", sets:1, reps:8},
  {name:"Extensión torácica foam roller", sets:1, reps:8},
  {name:"Chin tuck", sets:2, reps:8, holdSec:5},
  {name:"Wall slide", sets:2, reps:"8-10"},
  {name:"Low cobra", sets:2, duration:"20-30s"},
  {name:"Standing stack", sets:3, duration:"20s"}
];
```

Mini-reset:

```text
3–5 veces/día
10–20 s
```

No diagnosticar postura estructural.

---

# 16. RUNNING

```js
const RUNNING = {
  priority: "secondary",
  baseSessionsPerWeek: 2,
  longTermGoalKm: 20,
  deadline: null
};
```

Sin fecha obligatoria para 20 km.

---

# 17. CONFLICTO RUNNING / HIPERTROFIA

Si hay:

- dolor;
- fatiga de piernas;
- caída clara de rendimiento;
- recuperación insuficiente;
- interferencia con Pierna A/B;

entonces:

```text
runningProgression = HOLD
```

Repetir la sesión actual o reducir temporalmente.

No reducir hipertrofia para mantener la progresión del running.

---

# 18. INTENSIDAD RUNNING

Objetivo:

```text
RPE 3–4
talk test positivo
```

FC orientativa.

No HIIT/sprints por defecto.

---

# 19. SEMÁFORO DE DOLOR

```text
GREEN:
0–2/10, transitorio, normal al día siguiente.

YELLOW:
localizado, recurrente o persiste al día siguiente.

RED:
altera marcha, hinchazón, dolor caminando o empeora.
```

Acciones:

```text
GREEN → continuar
YELLOW → no progresar
RED → parar y valorar
```

---

# 20. NUTRICIÓN RUNNING

Actual:

```text
<45 min → no cambiar calorías
```

Futuro:

```text
75–120 min → considerar 30–50 g CHO extra ese día
>90 min → 30–60 g CHO/h durante sesión según tolerancia
```

No comer automáticamente calorías del reloj.

---

# 21. PESO

```js
dailyWeight = {
  date,
  kg,
  confidence: "normal" | "doubtful"
};
```

Protocolo:

- mañana;
- tras orinar;
- antes de comer;
- misma báscula;
- mismo sitio;
- misma posición.

---

# 22. BÁSCULA

Si mediciones repetidas varían demasiado:

```text
confidence = doubtful
```

FORJA puede excluir ese dato de cálculos sensibles.

BIA no se usa para decisiones calóricas.

---

# 23. MEDIA DE PESO

```js
function avg(values){
  return values.reduce((a,b)=>a+b,0)/values.length;
}

function avg7(validWeights){
  const last = validWeights.slice(-7);
  if(last.length < 5) return null;
  return avg(last.map(x=>x.kg));
}
```

---

# 24. TENDENCIA SEMANAL

```js
trendKgWeek = avg7Current - avg7Previous;
```

No reaccionar a un día.

---

# 25. CINTURA

Una vez/semana.

Protocolo:

```text
ombligo
relajado
fin de espiración normal
2 medidas
guardar media
```

---

# 26. PASOS

Usar como contexto de actividad.

No convertir automáticamente a calorías.

Running ya está incluido.

---

# 27. RECUPERACIÓN

```js
recovery = {
  hunger1to5,
  energy1to5,
  sleepHours,
  sleepQuality1to5
};
```

---

# 28. ADHERENCIA

Día válido si:

- kcal registradas;
- comidas principales registradas;
- comida social estimada si existe.

```js
adherence = validDays / 7;
```

Umbral estándar:

```text
>=85 %
```

---

# 29. PRIMERA EVALUACIÓN DEL CUT

Inicio:

```text
2026-09-08
```

No hacer cambios rutinarios antes de:

```text
>=14 días
```

Excepción:

- síntomas claros;
- pérdida excesivamente rápida;
- problema médico.

---

# 30. RITMO OBJETIVO

```text
0,4–0,6 % del peso/semana
techo blando ~0,7 %
```

Con 97 kg:

```text
~0,39–0,58 kg/semana
```

---

# 31. AJUSTE DE CALORÍAS

## Mantener
Si:

- pérdida dentro del objetivo;
- o algo más lenta pero cintura baja y fuerza estable.

## Considerar -100 a -150 kcal
Solo si:

- ≥14 días desde último cambio;
- adherencia ≥85 %;
- actividad comparable;
- peso medio plano;
- cintura plana;
- no hay explicación clara de ruido.

## Considerar +100 a +150 kcal
Si:

- pérdida persistentemente rápida;
- hambre alta;
- energía baja;
- sueño peor;
- rendimiento cae.

Nunca automático.

Regla adicional:

```text
FORJA no puede reducir automáticamente el objetivo diario por debajo de 2.150 kcal.
```

Si el algoritmo concluye que sería necesario:

```text
MANUAL_REVIEW_REQUIRED
```

---

# 32. TDEE INICIAL

Estimación provisional conservadora actual:

```text
~2650–2800 kcal/día
```

Punto de trabajo aproximado:

```text
~2700 kcal/día
```

Este rango está deliberadamente tirado a lo bajo porque:
- se usan ~10.000 pasos como referencia;
- el trabajo en taller es mayoritariamente en un espacio pequeño;
- no se presupone actividad laboral intensa adicional.

Estado:

```text
ESTIMATED
```

---

# 33. TDEE DEDUCIDO

```js
function deductedTDEE(avgCalories, trendKgWeek){
  return avgCalories - (trendKgWeek * 7700 / 7);
}
```

Ejemplo usando una media de 2.300 kcal:

```text
2300 kcal
-0,40 kg/sem
→ ~2740 kcal/día
```

No utilizar el ejemplo como objetivo; es solo demostrativo.

---

# 34. VALIDEZ DEL TDEE DEDUCIDO

Requiere:

- ≥21 días válidos;
- ingesta relativamente estable;
- adherencia ≥85 %;
- actividad comparable;
- semana no anormal;
- peso suficientemente fiable.

Mostrar preferentemente como rango.

Ejemplo:

> **TDEE deducido: ~2.950 ±150 kcal**

---

# 35. SEMÁFORO NUTRICIONAL

## Verde
Datos claros y progreso razonable.

## Amarillo
Datos insuficientes, baja adherencia o actividad no comparable.

## Rojo
Problema claro de recuperación o ausencia persistente de progreso con datos válidos.

No cambiar kcal automáticamente.

---

# 36. FECHAS DEL CUT

```text
PRE_CUT: hasta 2026-09-07
CUT_START: 2026-09-08
PRE_REVIEW_ALERT: 2026-11-16
PROVISIONAL_REVIEW: 2026-11-30
```

---

# 37. REVISIÓN DEL 30 DE NOVIEMBRE

Inputs:

- peso inicial;
- peso actual;
- media 7 días;
- cintura;
- fotos;
- fuerza;
- hambre;
- energía;
- sueño;
- adherencia;
- pasos.

Outputs permitidos:

```text
MAINTENANCE
EXTEND_CUT
MAINTENANCE_THEN_SECOND_CUT
```

Nunca extender automáticamente.

---

# 38. MANTENIMIENTO POST-CUT

Inicio alrededor del último TDEE deducido válido.

No restar 100 automáticamente.

Duración:

```text
~2–3 semanas como mínimo práctico
```

---

# 39. CONFIRMACIÓN DE MANTENIMIENTO

Criterio práctico:

```text
tendencia aproximadamente dentro de ±0,20 kg/semana
+ cintura estable
+ actividad comparable
```

durante varias semanas.

---

# 40. GANANCIA MUSCULAR FUTURA

Solo tras mantenimiento confirmado.

Inicio:

```text
maintenance + 150–200 kcal
```

Ritmo:

```text
+0,25–0,45 kg/mes
```

---

# 41. AJUSTE DE GANANCIA

Revisión cada ~4 semanas.

Mantener si:

- peso sube en objetivo;
- cintura controlada;
- fuerza progresa.

Reducir ~100 kcal si:

- >~0,6 kg/mes;
- cintura sube demasiado rápido.

Subir ~100 kcal si:

- ~8 semanas plano;
- fuerza estancada;
- adherencia buena.

---

# 42. MINI-CUT

No por calendario.

Activar solo si:

- acumulación clara de grasa;
- usuario quiere reducirla;
- mantenimiento actual conocido.

Duración típica:

```text
4–6 semanas
```

---

# 43. HIDRATACIÓN

```text
~2,5–3 L líquidos/día
```

Ajustar por calor/sudor/ejercicio.

---

# 44. SUPLEMENTOS

```text
Creatina: 5 g/día
Whey: opcional
Cafeína: opcional
```

---

# 45. COMIDAS SOCIALES / RESTAURANTE

No existe “comida gratis”.

La app debe permitir registro rápido aunque sea aproximado.

```js
const RESTAURANT_PRESETS = {
  SMALL: 800,
  MEDIUM: 1200,
  LARGE: 1600
};

const DRINK_ESTIMATES = {
  CANA: 90,
  BEER_33CL: 150,
  WINE_GLASS: 120,
  MIXED_DRINK_OR_LIQUOR: 200
};
```

Regla:

```text
si duda entre dos presets → usar el superior
```

La app puede permitir ajuste manual del valor.

Referencias opcionales por unidad:

```js
const SOCIAL_FOOD_HELPERS = {
  CROQUETA: 80,
  BRAVAS_HANDFUL: 150,
  CALAMARI_5_6: 200,
  SHARED_HAM_USER_PORTION: 150,
  BREAD_SLICE: 80,
  OLIVES_10: 50,
  TORTILLA_PINCHO: 250,
  PIZZA_SLICE: 275
};
```

Todo valor de restaurante puede registrar:

```js
estimateConfidence = "LOW" | "MEDIUM" | "HIGH";
```

No fingir exactitud.

Después de un día social:

```text
next_day = normal_plan
```

Prohibido:

- ayuno punitivo;
- cardio compensatorio;
- recorte automático al día siguiente.

---


# 45B. PLANTILLAS DE COMIDAS

Las plantillas son sugerencias de reparto, no reglas duras.

## STRENGTH

```js
const STRENGTH_MEALS = {
  BREAKFAST: { protein:45, carbs:60, fat:10, kcal:510 },
  LUNCH:     { protein:50, carbs:80, fat:15, kcal:655 },
  SNACK:     { protein:35, carbs:35, fat:10, kcal:370 },
  DINNER:    { protein:45, carbs:66, fat:30, kcal:714 }
};
```

## REST

```js
const REST_MEALS = {
  BREAKFAST: { protein:45, carbs:50, fat:10, kcal:470 },
  LUNCH:     { protein:50, carbs:70, fat:15, kcal:615 },
  SNACK:     { protein:35, carbs:30, fat:10, kcal:350 },
  DINNER:    { protein:45, carbs:66, fat:30, kcal:714 }
};
```

## SOCIAL DINNER

Antes de la cena:

```text
~1.150–1.250 kcal
~110–125 g proteína
```

Presupuesto orientativo de cena:

```text
~1.250–1.350 kcal
```

No exigir macros exactos al restaurante.

---

# 46. DATOS DIARIOS

```js
dailyLog = {
  date,
  nutritionDayType,
  socialPlanned,
  restaurantPreset,
  restaurantEstimateConfidence,
  weightKg,
  weightConfidence,
  calories,
  proteinG,
  carbsG,
  fatG,
  steps,
  hunger1to5,
  energy1to5,
  sleepHours,
  sleepQuality1to5,
  strengthSessionId,
  runningSessionId,
  notes
};
```

---

# 47. DATOS SEMANALES

```js
weeklySummary = {
  avgWeight7d,
  weeklyWeightDelta,
  weeklyCalories,
  weeklyReferenceCalories,
  avgCalories,
  avgProtein,
  avgSteps,
  adherence,
  waistCm,
  hungerAvg,
  energyAvg,
  sleepAvg
};
```

---

# 48. DATOS DE FUERZA

```js
strengthSet = {
  exerciseId,
  load,
  reps,
  rir,
  completed
};
```

---

# 49. DATOS DE RUNNING

```js
runningSession = {
  sessionCode,
  durationMin,
  runMin,
  walkMin,
  distanceKm,
  avgHR,
  maxHR,
  rpe,
  painLight,
  notes
};
```

---

# 50. FOTOS

Guardar:

```text
front
side
back
date
```

No calcular % grasa visual automáticamente.

---

# 51. BIA

```js
bodyFatBIA = {
  value,
  source: "estimated",
  decisionWeight: 0
};
```

---

# 52. ESTADOS PRINCIPALES

```js
nutritionPhase = [
  "PRE_CUT",
  "CUT",
  "MAINTENANCE",
  "GAIN",
  "MINI_CUT"
];
```

---

# 53. SUBESTADOS

```js
subState = [
  "ACTIVE",
  "INSUFFICIENT_DATA",
  "REVIEW_DUE",
  "RECOVERY_WARNING",
  "TRANSITION"
];
```

---

# 54. ESTADOS RUNNING

```js
runningState = [
  "PROGRESS",
  "HOLD",
  "YELLOW_PAIN",
  "RED_PAIN"
];
```

---

# 55. PROHIBICIONES

FORJA nunca debe:

1. cambiar kcal por un peso aislado;
2. reducir kcal por 2–3 días planos;
3. aumentar running porque “toca calendario”;
4. sacrificar fuerza por el objetivo 20K;
5. comer automáticamente kcal de Garmin;
6. duplicar running + pasos;
7. usar BIA como dato real de grasa;
8. obligar deload cada X semanas;
9. diagnosticar postura;
10. diagnosticar ginecomastia;
11. castigar una comida social;
12. exigir macros perfectos;
13. asumir que TDEE estimado es real;
14. continuar cut indefinidamente sin revisión.

---

# 56. MENSAJES AUTOMÁTICOS

## Peso sube un día
> “Un día no cambia el plan. Mira la media de 7 días.”

## Menos de 14 días
> “Todavía no hay suficiente tiempo para ajustar.”

## Adherencia <85 %
> “Necesitamos una semana más limpia antes de tocar calorías.”

## Cintura baja pero peso lento
> “Hay progreso. Mantén el plan.”

## Running interfiere
> “Mantén esta sesión de running. La hipertrofia tiene prioridad.”

## Recuperación empeora
> “Revisa sueño, energía, hambre y rendimiento antes de modificar el plan.”

---

# 57. PANTALLA HOY

Debe reunir:

```js
todayView = {
  phase,
  dayNumber,
  nutritionDayType,
  weeklyCaloriesSoFar,
  weeklyReferenceCalories,
  nextStrengthSession,
  runningRecommendation,
  calorieTarget,
  macros,
  todayWeight,
  avg7Weight,
  weeklyTrend,
  recoveryStatus,
  alerts
};
```

---

# 58. PANTALLA PROGRESO

Debe derivar:

```text
peso
cintura
fuerza
running
recuperación
adherencia
```

---

# 59. PANTALLA PLAN

Mostrar:

```text
fase actual
inicio
fin provisional
presupuesto semanal
tipo de día
kcal del día
macros del día
prioridades
reglas de revisión
siguiente revisión
```

---

# 60. FUENTES DE VERDAD RESUMIDAS

## Fechas

```text
Inicio cut: 2026-09-08
Aviso: 2026-11-16
Revisión provisional: 2026-11-30
```

## Nutrición

```text
REST: 2150 kcal · 175 P · 216 C · 65 G
STRENGTH: 2250 kcal · 175 P · 241 C · 65 G
SOCIAL: 2500 kcal · proteína objetivo ~175 g · C/F flexibles

Semana estándar:
~16.050 kcal
~2.300 kcal/día de media
```

## Running

```text
2 sesiones/semana base
20 km sin fecha límite
subordinado a hipertrofia
```

## Fuerza

```text
Torso A → Pierna A → Torso B → Pierna B
adaptación terminada
RIR 1–2
doble progresión
```

## Recuperación

```text
hambre
energía
sueño
```

---

# 61. PRINCIPIO FINAL

FORJA debe comportarse como un sistema conservador con los cambios:

> **medir → observar → comparar → decidir**

Nunca:

> **reaccionar → cambiar → volver a reaccionar**

Y siempre:

> **el físico de hipertrofia tiene prioridad sobre el running.**
