import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Controller, FormProvider, useForm, useFormContext, useWatch } from 'react-hook-form'
import type { FieldErrors } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from 'react-router-dom'
import Button from '../components/Button'
import Celebration from '../components/Celebration'
import FloatingDecor from '../components/FloatingDecor'
import SiteFooter from '../components/SiteFooter'
import CheckboxField from '../components/form/CheckboxField'
import ChipGroup from '../components/form/ChipGroup'
import OptionCards from '../components/form/OptionCards'
import ProgressBar from '../components/form/ProgressBar'
import StepWrapper from '../components/form/StepWrapper'
import TextAreaField from '../components/form/TextAreaField'
import TextField from '../components/form/TextField'
import {
  clearVolunteerDraft,
  loadVolunteerDraft,
  saveVolunteerDraft,
} from '../lib/volunteerDraft'
import {
  AVAILABILITIES,
  HELP_AREAS,
  MESSAGE_MAX,
  VOLUNTEER_STEPS,
  buildVolunteerPayload,
  isVolunteerStepValid,
  volunteerSchema,
} from '../lib/volunteerSchema'
import type { VolunteerValues } from '../lib/volunteerSchema'
import { createVolunteer } from '../services/api'

const LAST_STEP = VOLUNTEER_STEPS.length - 1

interface StepProps {
  direction: 1 | -1
}

function useStepForm() {
  const { register, control, trigger, formState } = useFormContext<VolunteerValues>()
  return { register, control, trigger, errors: formState.errors }
}

function AboutStep({ direction }: StepProps) {
  const { register, errors } = useStepForm()
  return (
    <StepWrapper direction={direction} title="Cuéntanos quién eres" hint="Solo toma un minuto.">
      <div className="grid gap-5 sm:grid-cols-2 sm:gap-4">
        <TextField
          label="Nombre"
          autoComplete="given-name"
          maxLength={60}
          error={errors.firstName?.message}
          {...register('firstName')}
        />
        <TextField
          label="Apellido"
          autoComplete="family-name"
          maxLength={60}
          error={errors.lastName?.message}
          {...register('lastName')}
        />
      </div>
      <TextField
        label="Carrera o profesión"
        autoComplete="organization-title"
        maxLength={100}
        placeholder="Por ejemplo: Psicología"
        error={errors.career?.message}
        {...register('career')}
      />
      <TextField
        label="Semestre o año (opcional)"
        maxLength={40}
        placeholder="Por ejemplo: 6.º semestre"
        error={errors.semester?.message}
        {...register('semester')}
      />
    </StepWrapper>
  )
}

function HelpStep({ direction }: StepProps) {
  const { control, trigger, errors } = useStepForm()
  return (
    <StepWrapper
      direction={direction}
      title="¿Cómo quieres ayudar?"
      hint="Elige todas las que quieras."
    >
      <Controller
        control={control}
        name="helpAreas"
        render={({ field }) => (
          <ChipGroup
            name={field.name}
            legend="Cómo quieres ayudar"
            options={HELP_AREAS}
            value={field.value}
            onChange={(next) => {
              field.onChange(next)
              void trigger('helpAreas')
            }}
            onBlur={field.onBlur}
            error={errors.helpAreas?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="availability"
        render={({ field }) => (
          <OptionCards
            name={field.name}
            legend="¿Cuánto tiempo podrías dedicar?"
            options={AVAILABILITIES}
            layout="grid"
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            error={errors.availability?.message}
          />
        )}
      />
    </StepWrapper>
  )
}

function ContactStep({ direction }: StepProps) {
  const { register, control, trigger, errors } = useStepForm()
  const message = useWatch({ control, name: 'message' })
  return (
    <StepWrapper
      direction={direction}
      title="¿Cómo te contactamos?"
      hint="Último paso: así podremos coordinar contigo."
    >
      <TextField
        label="Correo electrónico"
        type="email"
        inputMode="email"
        autoComplete="email"
        placeholder="nombre@correo.com"
        error={errors.email?.message}
        {...register('email')}
      />
      <TextField
        label="Teléfono o WhatsApp"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        placeholder="+00 000 000 0000"
        error={errors.phone?.message}
        {...register('phone')}
      />
      <TextAreaField
        label="Cuéntanos un poco más (opcional)"
        maxLength={MESSAGE_MAX}
        length={message?.length ?? 0}
        placeholder="Tu experiencia, tus ideas, lo que te motiva…"
        error={errors.message?.message}
        {...register('message')}
      />
      <Controller
        control={control}
        name="consent"
        render={({ field }) => (
          <CheckboxField
            name={field.name}
            checked={field.value}
            onChange={(event) => {
              field.onChange(event.target.checked)
              void trigger('consent')
            }}
            onBlur={field.onBlur}
            error={errors.consent?.message}
          >
            Acepto que se comuniquen conmigo y que mis datos se usen para coordinar mi voluntariado
          </CheckboxField>
        )}
      />
    </StepWrapper>
  )
}

const STEP_COMPONENTS = [AboutStep, HelpStep, ContactStep]

function VolunteerStep({ step, direction }: StepProps & { step: number }) {
  const Step = STEP_COMPONENTS[step]
  return <Step direction={direction} />
}

function ThankYou() {
  const navigate = useNavigate()
  const reduceMotion = useReducedMotion()
  const headingRef = useRef<HTMLHeadingElement>(null)

  // Anuncia el mensaje a lectores de pantalla al terminar el envío
  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true })
  }, [])

  return (
    <main className="relative flex min-h-dvh flex-col items-center overflow-hidden bg-crema bg-pastel-aurora px-4 py-12 sm:px-6 sm:py-16">
      <FloatingDecor density="light" />

      <div className="relative z-10 flex w-full max-w-2xl flex-col items-center gap-6 text-center">
        <div className="relative flex size-24 items-center justify-center">
          <Celebration />
          <motion.span
            className="text-7xl"
            aria-hidden="true"
            initial={reduceMotion ? false : { scale: 0, rotate: -15 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 220, damping: 12 }}
          >
            💚
          </motion.span>
        </div>
        <motion.h1
          ref={headingRef}
          tabIndex={-1}
          className="text-balance text-3xl font-extrabold leading-tight text-slate-800 outline-none sm:text-4xl lg:text-5xl"
          initial={{ opacity: 0, y: reduceMotion ? 0 : 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15, ease: 'easeOut' }}
        >
          ¡Gracias por querer ayudar!
        </motion.h1>
        <motion.p
          className="rounded-blob bg-white/85 px-6 py-3 text-xl font-extrabold text-lila-deep shadow-suave sm:text-2xl"
          initial={{ opacity: 0, y: reduceMotion ? 0 : 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35, ease: 'easeOut' }}
        >
          Pronto te contactaremos.
        </motion.p>
        <Button variant="secondary" size="lg" onClick={() => navigate('/')}>
          Volver al inicio
        </Button>
      </div>

      <SiteFooter showVolunteerLink={false} />
    </main>
  )
}

export default function Volunteer() {
  const [draft] = useState(loadVolunteerDraft)
  const [step, setStep] = useState(() => Math.min(Math.max(draft?.step ?? 0, 0), LAST_STEP))
  const [direction, setDirection] = useState<1 | -1>(1)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(false)
  const [done, setDone] = useState(false)
  const submittingRef = useRef(false)
  const finishedRef = useRef(false)

  const methods = useForm<VolunteerValues>({
    resolver: zodResolver(volunteerSchema),
    mode: 'onTouched',
    defaultValues: {
      firstName: '',
      lastName: '',
      career: '',
      semester: '',
      email: '',
      phone: '',
      helpAreas: [],
      message: '',
      consent: false,
      website: '',
      ...draft?.values,
    },
  })

  const values = useWatch({ control: methods.control }) as Partial<VolunteerValues>
  const stepValid = isVolunteerStepValid(step, values)

  // Guarda el progreso para no perderlo al recargar (el honeypot nunca se guarda)
  useEffect(() => {
    if (finishedRef.current) return
    saveVolunteerDraft({ step, values: { ...values, website: '' } })
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
    clearVolunteerDraft()
    setDone(true)
  }

  const send = async (data: VolunteerValues) => {
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
      await createVolunteer(buildVolunteerPayload(data))
      finish()
    } catch {
      setSubmitError(true)
    } finally {
      submittingRef.current = false
      setSubmitting(false)
    }
  }

  // Si alguna respuesta anterior no es válida, vuelve al primer paso con problemas
  const goToFirstInvalid = (errors: FieldErrors<VolunteerValues>) => {
    const index = VOLUNTEER_STEPS.findIndex((item) => item.fields.some((field) => errors[field]))
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

  if (done) return <ThankYou />

  const isLast = step === LAST_STEP

  return (
    <main className="relative flex min-h-dvh flex-col items-center overflow-hidden bg-crema bg-pastel-aurora px-4 py-8 sm:px-6 sm:py-12">
      <FloatingDecor density="light" />

      <div className="relative z-10 flex w-full max-w-xl flex-col gap-6">
        <div className="flex justify-start">
          <Link
            to="/"
            className="inline-flex min-h-11 items-center rounded-pill px-3 font-bold text-lila-deep underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-lila-deep"
          >
            ← Volver al inicio
          </Link>
        </div>

        <header className="text-center">
          <h1 className="mb-2 text-balance text-3xl font-extrabold text-slate-800 sm:text-4xl">
            Ayúdanos a salvar vidas
          </h1>
          {step === 0 && (
            <p className="text-lg text-slate-700">
              Buscamos voluntarios con ganas de acompañar a otras personas. No importa tu
              experiencia: cada gesto cuenta. Déjanos tus datos y te contactaremos.
            </p>
          )}
        </header>

        <div className="card-suave flex flex-col gap-6 sm:p-8">
          <ProgressBar current={step + 1} total={VOLUNTEER_STEPS.length} />

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
                <VolunteerStep key={step} step={step} direction={direction} />
              </AnimatePresence>

              {submitError && (
                <p
                  role="alert"
                  className="mt-5 rounded-2xl bg-rosa-light p-4 text-center font-semibold text-slate-700"
                >
                  Ups, no pudimos enviar tus datos en este momento. No te preocupes: siguen
                  guardados. Inténtalo de nuevo en un momento.
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
                <Button type="submit" variant="accent" disabled={!stepValid || submitting}>
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

      <SiteFooter showVolunteerLink={false} />
    </main>
  )
}
