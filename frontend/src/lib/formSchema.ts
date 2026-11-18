import { z } from 'zod'

export const EMOTIONS = [
  { value: 'tristeza', label: 'Tristeza' },
  { value: 'ansiedad', label: 'Ansiedad' },
  { value: 'estres', label: 'Estrés' },
  { value: 'enojo', label: 'Enojo' },
  { value: 'soledad', label: 'Soledad' },
  { value: 'desmotivacion', label: 'Desmotivación' },
  { value: 'miedo', label: 'Miedo' },
  { value: 'vacio', label: 'Vacío' },
  { value: 'otra', label: 'Otra' },
] as const

export const MOODS = [
  { value: 1, emoji: '😢', label: 'Muy mal' },
  { value: 2, emoji: '😟', label: 'Mal' },
  { value: 3, emoji: '😐', label: 'Regular' },
  { value: 4, emoji: '🙂', label: 'Bien' },
  { value: 5, emoji: '😄', label: 'Muy bien' },
] as const

export const DURATIONS = [
  { value: 'unos_dias', label: 'Unos días', emoji: '🌱' },
  { value: 'algunas_semanas', label: 'Algunas semanas', emoji: '🌿' },
  { value: 'varios_meses', label: 'Varios meses', emoji: '🌳' },
  { value: 'mas_de_un_ano', label: 'Más de un año', emoji: '🏔️' },
] as const

export const QUALITY = [
  { value: 'bien', label: 'Bien' },
  { value: 'regular', label: 'Regular' },
  { value: 'mal', label: 'Mal' },
] as const

export const SELF_HARM = [
  { value: 'no', label: 'No' },
  { value: 'a_veces', label: 'A veces' },
  { value: 'con_frecuencia', label: 'Con frecuencia' },
] as const

export const BEST_TIMES = [
  { value: 'manana', label: 'Mañana', emoji: '🌅' },
  { value: 'tarde', label: 'Tarde', emoji: '☀️' },
  { value: 'noche', label: 'Noche', emoji: '🌙' },
] as const

const values = <T extends readonly { value: string }[]>(items: T) =>
  items.map((item) => item.value) as [T[number]['value'], ...T[number]['value'][]]

export const formSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Cuéntanos cómo te gustaría que te llamemos.')
    .max(60, 'Intenta con un nombre un poquito más corto.'),
  age: z
    .number({ error: 'Escribe tu edad usando solo números.' })
    .int('Escribe tu edad usando solo números enteros.')
    .min(10, 'Este espacio es para personas de 10 años en adelante.')
    .max(100, 'Revisa tu edad, parece que hay un pequeño error.'),
  mood: z.number({ error: 'Elige la carita que mejor te represente.' }).int().min(1).max(5),
  emotions: z
    .array(z.enum(values(EMOTIONS)))
    .min(1, 'Elige al menos una emoción, puede ser la que más se acerque.'),
  duration: z.enum(values(DURATIONS), { error: 'Elige la opción que más se parezca.' }),
  impact: z
    .number({ error: 'Mueve el deslizador para contarnos cuánto te afecta.' })
    .int()
    .min(0)
    .max(10),
  sleep: z.enum(values(QUALITY), { error: 'Cuéntanos cómo has dormido.' }),
  appetite: z.enum(values(QUALITY), { error: 'Cuéntanos cómo ha estado tu apetito.' }),
  selfHarm: z.enum(values(SELF_HARM), {
    error: 'Elige la opción que más se parezca. Puedes responder con confianza.',
  }),
  email: z
    .string()
    .trim()
    .min(1, 'Necesitamos tu correo para poder escribirte.')
    .pipe(z.email('Revisa tu correo, parece que le falta algo (por ejemplo: nombre@correo.com).')),
  phone: z
    .string()
    .trim()
    .refine((value) => value === '' || /^\+?[\d\s()-]{7,20}$/.test(value), {
      message: 'Revisa tu teléfono: usa solo números, espacios, guiones o el signo +.',
    }),
  bestTime: z.enum(values(BEST_TIMES), { error: 'Elige el horario que mejor te quede.' }),
  consent: z.boolean().refine((value) => value, {
    message: 'Para poder contactarte necesitamos que aceptes este permiso.',
  }),
  // Campo trampa para bots: las personas nunca lo ven ni lo llenan
  website: z.string().optional(),
})

export type FormValues = z.infer<typeof formSchema>
export type Priority = 'alta' | 'normal'

export interface SubmissionPayload extends Omit<FormValues, 'website'> {
  priority: Priority
}

export function getPriority(selfHarm: FormValues['selfHarm'] | undefined): Priority {
  return selfHarm && selfHarm !== 'no' ? 'alta' : 'normal'
}

export interface StepDefinition {
  id: string
  fields: (keyof FormValues)[]
}

export const STEPS: StepDefinition[] = [
  { id: 'name', fields: ['name'] },
  { id: 'age', fields: ['age'] },
  { id: 'mood', fields: ['mood'] },
  { id: 'emotions', fields: ['emotions'] },
  { id: 'duration', fields: ['duration'] },
  { id: 'impact', fields: ['impact'] },
  { id: 'habits', fields: ['sleep', 'appetite'] },
  { id: 'selfHarm', fields: ['selfHarm'] },
  { id: 'contact', fields: ['email', 'phone', 'bestTime', 'consent'] },
]

export function isStepValid(step: number, current: Partial<FormValues>): boolean {
  const mask = Object.fromEntries(
    STEPS[step].fields.map((field) => [field, true]),
  ) as Partial<Record<keyof FormValues, true>>
  return formSchema.pick(mask).safeParse(current).success
}

export function buildPayload(data: FormValues): SubmissionPayload {
  return {
    name: data.name,
    age: data.age,
    mood: data.mood,
    emotions: data.emotions,
    duration: data.duration,
    impact: data.impact,
    sleep: data.sleep,
    appetite: data.appetite,
    selfHarm: data.selfHarm,
    email: data.email,
    phone: data.phone,
    bestTime: data.bestTime,
    consent: data.consent,
    priority: getPriority(data.selfHarm),
  }
}
