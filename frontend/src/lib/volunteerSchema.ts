import { z } from 'zod'

export const HELP_AREAS = [
  { value: 'atencion_psicologica', label: 'Atención psicológica' },
  { value: 'escucha_acompanamiento', label: 'Escucha y acompañamiento' },
  { value: 'difusion_redes', label: 'Difusión en redes' },
  { value: 'eventos', label: 'Organización de eventos' },
  { value: 'logistica_admin', label: 'Logística y apoyo administrativo' },
  { value: 'diseno_comunicacion', label: 'Diseño y comunicación' },
  { value: 'tecnologia', label: 'Tecnología' },
  { value: 'donaciones', label: 'Donaciones' },
  { value: 'otra', label: 'Otra' },
] as const

export const AVAILABILITIES = [
  { value: 'pocas_horas', label: 'Pocas horas al mes', emoji: '🌱' },
  { value: 'semanal', label: 'Unas horas a la semana', emoji: '🌿' },
  { value: 'medio_tiempo', label: 'Medio tiempo', emoji: '🌳' },
  { value: 'tiempo_completo', label: 'Tiempo completo', emoji: '🌟' },
] as const

export const MESSAGE_MAX = 500

const values = <T extends readonly { value: string }[]>(items: T) =>
  items.map((item) => item.value) as [T[number]['value'], ...T[number]['value'][]]

export const volunteerSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, 'Cuéntanos tu nombre, nos encantará conocerte.')
    .max(60, 'Intenta con un nombre un poquito más corto.'),
  lastName: z
    .string()
    .trim()
    .min(1, 'Cuéntanos también tu apellido.')
    .max(60, 'Intenta con un apellido un poquito más corto.'),
  career: z
    .string()
    .trim()
    .min(1, 'Cuéntanos qué estudias o a qué te dedicas.')
    .max(100, 'Intenta con un texto un poquito más corto.'),
  semester: z.string().trim().max(40, 'Intenta con un texto un poquito más corto.'),
  email: z
    .string()
    .trim()
    .min(1, 'Necesitamos tu correo para poder escribirte.')
    .pipe(z.email('Revisa tu correo, parece que le falta algo (por ejemplo: nombre@correo.com).')),
  phone: z
    .string()
    .trim()
    .min(1, 'Necesitamos un teléfono o WhatsApp para coordinar contigo.')
    .regex(/^\+?[\d\s()-]{7,20}$/, 'Revisa tu teléfono: usa solo números, espacios, guiones o el signo +.'),
  helpAreas: z
    .array(z.enum(values(HELP_AREAS)))
    .min(1, 'Elige al menos una forma de ayudar, la que más te llame.'),
  availability: z.enum(values(AVAILABILITIES), { error: 'Elige el tiempo que podrías dedicar.' }),
  message: z.string().trim().max(MESSAGE_MAX, `Puedes escribir hasta ${MESSAGE_MAX} caracteres.`),
  consent: z.boolean().refine((value) => value, {
    message: 'Para poder contactarte necesitamos que aceptes este permiso.',
  }),
  // Campo trampa para bots: las personas nunca lo ven ni lo llenan
  website: z.string().optional(),
})

export type VolunteerValues = z.infer<typeof volunteerSchema>
export type VolunteerPayload = Omit<VolunteerValues, 'website'>

export interface VolunteerStepDefinition {
  id: string
  fields: (keyof VolunteerValues)[]
}

export const VOLUNTEER_STEPS: VolunteerStepDefinition[] = [
  { id: 'about', fields: ['firstName', 'lastName', 'career', 'semester'] },
  { id: 'help', fields: ['helpAreas', 'availability'] },
  { id: 'contact', fields: ['email', 'phone', 'message', 'consent'] },
]

export function isVolunteerStepValid(step: number, current: Partial<VolunteerValues>): boolean {
  const mask = Object.fromEntries(
    VOLUNTEER_STEPS[step].fields.map((field) => [field, true]),
  ) as Partial<Record<keyof VolunteerValues, true>>
  return volunteerSchema.pick(mask).safeParse(current).success
}

export function buildVolunteerPayload(data: VolunteerValues): VolunteerPayload {
  return {
    firstName: data.firstName,
    lastName: data.lastName,
    career: data.career,
    semester: data.semester,
    email: data.email,
    phone: data.phone,
    helpAreas: data.helpAreas,
    availability: data.availability,
    message: data.message,
    consent: data.consent,
  }
}
