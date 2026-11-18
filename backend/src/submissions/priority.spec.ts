import { calculatePriority } from './priority.js';

describe('calculatePriority', () => {
  it('es "normal" cuando no hay pensamientos de hacerse daño', () => {
    expect(calculatePriority('no')).toBe('normal');
  });

  it.each(['a_veces', 'con_frecuencia'] as const)('es "alta" con la respuesta "%s"', (answer) => {
    expect(calculatePriority(answer)).toBe('alta');
  });
});
