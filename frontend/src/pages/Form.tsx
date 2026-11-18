import { AnimatePresence } from 'framer-motion'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { FormProvider, useForm, useWatch } from 'react-hook-form'
import type { FieldErrors } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import Button from '../components/Button'
import FloatingDecor from '../components/FloatingDecor'
import SiteFooter from '../components/SiteFooter'
import FormStep from '../components/form/FormSteps'
import ProgressBar from '../components/form/ProgressBar'
import { clearDraft, loadDraft, saveDraft } from '../lib/formDraft'
import { markSubmitted } from '../lib/submissionFlag'
import { STEPS, buildPayload, formSchema, isStepValid } from '../lib/formSchema'
import type { FormValues } from '../lib/formSchema'
import { submitForm } from '../services/api'

const LAST_STEP = STEPS.length - 1

export default function Form() {
  const navigate = useNavigate()
  const [draft] = useState(loadDraft)
  const [step, setStep] = useState(() => Math.min(Math.max(draft?.step ?? 0, 0), LAST_STEP))
  const [direction, setDirection] = useState<1 | -1>(1)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(false)
  const submittingRef = useRef(false)
  const finishedRef = useRef(false)

  const methods = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: 'onTouched',
    defaultValues: { emotions: [], phone: '', consent: false, website: '', ...draft?.values },
  })

  const values = useWatch({ control: methods.control }) as Partial<FormValues>
  const stepValid = isStepValid(step, values)

  // Guarda el progreso para no perderlo al recargar (el honeypot nunca se guarda)
  useEffect(() => {
    if (finishedRef.current) return
    saveDraft({ step, values: { ...values, website: '' } })
  }, [step, values])

  const goNext = useCallback(() => {
    setDirection(1)
    setStep((current) => Math.min(current + 1, LAST_STEP))
  }, [])

  const goBack = () => {
    setDirection(-1)
    setSubmitError(false)
    setStep((current) => Math.max(current - 1, 0))
  }

  const finish = () => {
    finishedRef.current = true
    clearDraft()
    markSubmitted()
    navigate('/gracias')
  }

  const send = async (data: FormValues) => {
    if (submittingRef.current) return
    // Un bot llenó el campo oculto: fingimos éxito sin enviar nada
    if (data.website) {
      finish()
      return
    }

    submittingRef.current = true
    setSubmitting(true)
    setSubmitError(false)
    try {
      await submitForm(buildPayload(data))
      finish()
    } catch {
      setSubmitError(true)
    } finally {
      submittingRef.current = false
      setSubmitting(false)
    }
  }

  // Si alguna respuesta anterior no es válida, vuelve al primer paso con problemas
  const goToFirstInvalid = (errors: FieldErrors<FormValues>) => {
    const index = STEPS.findIndex((item) => item.fields.some((field) => errors[field]))
    if (index >= 0) {
      setDirection(-1)
      setStep(index)
    }
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (step < LAST_STEP) {
      if (stepValid) goNext()
      return
    }
    if (stepValid && !submittingRef.current) {
      void methods.handleSubmit(send, goToFirstInvalid)()
    }
  }

  const isLast = step === LAST_STEP

  return (
    <main className="relative flex min-h-dvh flex-col items-center overflow-hidden bg-crema bg-pastel-aurora px-4 py-8 sm:px-6 sm:py-12">
      <FloatingDecor density="light" />

      <div className="relative z-10 flex w-full max-w-xl flex-col gap-6">
        <header className={`text-center ${step === 0 ? '' : 'sr-only'}`}>
          <h1 className="mb-2 text-3xl font-extrabold text-slate-800 sm:text-4xl">
            Un espacio para ti
          </h1>
          <p className="text-lg text-slate-700">
            Cuéntanos cómo estás. Tus respuestas son confidenciales y nos ayudan a acompañarte
            mejor.
          </p>
        </header>

        <div className="card-suave flex flex-col gap-6 sm:p-8">
          <ProgressBar current={step + 1} total={STEPS.length} />

          <FormProvider {...methods}>
            <form onSubmit={handleSubmit} noValidate aria-busy={submitting} className="relative">
              <div
                aria-hidden="true"
                className="absolute -left-[9999px] top-0 h-0 w-0 overflow-hidden"
              >
                <label>
                  No llenes este campo
                  <input type="text" tabIndex={-1} autoComplete="off" {...methods.register('website')} />
                </label>
              </div>

              <AnimatePresence mode="wait" custom={direction} initial={false}>
                <FormStep key={step} step={step} direction={direction} />
              </AnimatePresence>

              {submitError && (
                <p
                  role="alert"
                  className="mt-5 rounded-2xl bg-rosa-light p-4 text-center font-semibold text-slate-700"
                >
                  Ups, no pudimos enviar tus respuestas en este momento. No te preocupes: siguen
                  guardadas. Inténtalo de nuevo en un momento.
                </p>
              )}

              <div className="mt-6 flex items-center justify-between gap-3">
                <Button
                  variant="secondary"
                  onClick={goBack}
                  disabled={submitting}
                  className={step === 0 ? 'invisible' : ''}
                  aria-hidden={step === 0 ? true : undefined}
                  tabIndex={step === 0 ? -1 : undefined}
                >
                  Atrás
                </Button>
                <Button type="submit" disabled={!stepValid || submitting}>
                  {submitting ? (
                    <>
                      <span
                        className="size-4 rounded-full border-2 border-slate-800/30 border-t-slate-800 motion-safe:animate-spin"
                        aria-hidden="true"
                      />
                      Enviando…
                    </>
                  ) : isLast ? (
                    submitError ? 'Reintentar' : 'Enviar'
                  ) : (
                    'Siguiente'
                  )}
                </Button>
              </div>
            </form>
          </FormProvider>
        </div>
      </div>

      <SiteFooter />
    </main>
  )
}
