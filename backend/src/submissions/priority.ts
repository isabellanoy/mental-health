import type { Priority, SelfHarm } from './submission.constants.js';

// La prioridad la decide siempre el servidor, sin confiar en lo que envía el cliente
export function calculatePriority(selfHarm: SelfHarm): Priority {
  return selfHarm === 'no' ? 'normal' : 'alta';
}
