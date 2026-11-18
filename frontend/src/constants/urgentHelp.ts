export interface HelpResource {
  label: string
  description: string
  // Reemplaza estos placeholders por las líneas de ayuda reales de tu país o ciudad
  contact: string
}

export const URGENT_HELP = {
  title: 'Gracias por contarnos esto, no estás solo/a',
  message:
    'Lo que sientes importa y mereces apoyo ahora mismo. Si estás en peligro o sientes que podrías hacerte daño, por favor busca ayuda de inmediato. Hablarlo con alguien de confianza o con una línea de ayuda puede hacer una gran diferencia.',
  resources: [
    {
      label: 'Emergencias',
      description: 'Si hay un riesgo inmediato para tu vida o tu seguridad.',
      contact: '[Número de emergencias]',
    },
    {
      label: 'Línea de apoyo emocional y prevención',
      description: 'Atención gratuita y confidencial, con personas preparadas para escucharte.',
      contact: '[Línea de ayuda local: teléfono / WhatsApp]',
    },
  ] satisfies HelpResource[],
  directory: {
    label: 'Directorio internacional de líneas de ayuda',
    url: 'https://findahelpline.com',
  },
  footer: 'Seguiremos tu caso con prioridad y te contactaremos lo antes posible.',
}
