export const EMOTIONS = [
  'tristeza',
  'ansiedad',
  'estres',
  'enojo',
  'soledad',
  'desmotivacion',
  'miedo',
  'vacio',
  'otra',
] as const;

export const DURATIONS = ['unos_dias', 'algunas_semanas', 'varios_meses', 'mas_de_un_ano'] as const;
export const QUALITY = ['bien', 'regular', 'mal'] as const;
export const SELF_HARM = ['no', 'a_veces', 'con_frecuencia'] as const;
export const BEST_TIMES = ['manana', 'tarde', 'noche'] as const;
export const STATUSES = ['nuevo', 'contactado', 'cerrado'] as const;
export const PRIORITIES = ['alta', 'normal'] as const;

export type SelfHarm = (typeof SELF_HARM)[number];
export type Priority = (typeof PRIORITIES)[number];
export type SubmissionStatus = (typeof STATUSES)[number];
