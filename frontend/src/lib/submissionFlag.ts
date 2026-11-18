const SUBMITTED_KEY = 'mh-form-submitted-v1'

// Marca que permite ver /gracias: solo se activa tras un envío exitoso del formulario
export function markSubmitted() {
  try {
    sessionStorage.setItem(SUBMITTED_KEY, '1')
  } catch {
    // sin sessionStorage no se puede recordar el envío
  }
}

export function hasSubmitted(): boolean {
  try {
    return sessionStorage.getItem(SUBMITTED_KEY) === '1'
  } catch {
    return false
  }
}
