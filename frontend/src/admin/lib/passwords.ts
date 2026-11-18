const LOWER = 'abcdefghijkmnopqrstuvwxyz'
const UPPER = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
const DIGITS = '23456789'
const SYMBOLS = '!@#$%&*?-_'

function randomInt(max: number): number {
  const limit = Math.floor(0x100000000 / max) * max
  const buffer = new Uint32Array(1)
  do {
    crypto.getRandomValues(buffer)
  } while (buffer[0] >= limit)
  return buffer[0] % max
}

// Contraseña aleatoria con minúsculas, mayúsculas, números y símbolos (sin caracteres ambiguos)
export function generatePassword(length = 16): string {
  const groups = [LOWER, UPPER, DIGITS, SYMBOLS]
  const all = groups.join('')
  const chars = groups.map((group) => group[randomInt(group.length)])
  while (chars.length < length) chars.push(all[randomInt(all.length)])
  for (let index = chars.length - 1; index > 0; index -= 1) {
    const swap = randomInt(index + 1)
    ;[chars[index], chars[swap]] = [chars[swap], chars[index]]
  }
  return chars.join('')
}

export const MIN_PASSWORD_LENGTH = 10
