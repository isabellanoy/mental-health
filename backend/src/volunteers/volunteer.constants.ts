export const HELP_AREAS = [
  'atencion_psicologica',
  'escucha_acompanamiento',
  'difusion_redes',
  'eventos',
  'logistica_admin',
  'diseno_comunicacion',
  'tecnologia',
  'donaciones',
  'otra',
] as const;

export const AVAILABILITIES = ['pocas_horas', 'semanal', 'medio_tiempo', 'tiempo_completo'] as const;
export const VOLUNTEER_STATUSES = ['nuevo', 'contactado', 'activo', 'descartado'] as const;

export type VolunteerStatus = (typeof VOLUNTEER_STATUSES)[number];
