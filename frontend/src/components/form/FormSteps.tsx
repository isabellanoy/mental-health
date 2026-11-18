import { Controller, useFormContext, useWatch } from 'react-hook-form'
import {
  BEST_TIMES,
  DURATIONS,
  EMOTIONS,
  MOODS,
  QUALITY,
  SELF_HARM,
} from '../../lib/formSchema'
import type { FormValues } from '../../lib/formSchema'
import ChipGroup from './ChipGroup'
import CheckboxField from './CheckboxField'
import EmojiScale from './EmojiScale'
import OptionCards from './OptionCards'
import RangeSlider from './RangeSlider'
import StepWrapper from './StepWrapper'
import TextField from './TextField'
import UrgentHelp from './UrgentHelp'

interface StepProps {
  direction: 1 | -1
}

function describeImpact(value: number) {
  if (value === 0) return { emoji: '😊', label: 'Nada' }
  if (value <= 2) return { emoji: '🙂', label: 'Muy poco' }
  if (value <= 4) return { emoji: '😐', label: 'Un poco' }
  if (value <= 6) return { emoji: '😟', label: 'Bastante' }
  if (value <= 8) return { emoji: '😣', label: 'Mucho' }
  return { emoji: '😭', label: 'Muchísimo' }
}

function useStepForm() {
  const { register, control, trigger, formState } = useFormContext<FormValues>()
  return { register, control, trigger, errors: formState.errors }
}

function NameStep({ direction }: StepProps) {
  const { register, errors } = useStepForm()
  return (
    <StepWrapper
      direction={direction}
      title="¿Cómo te gustaría que te llamemos?"
      hint="Puede ser tu nombre o un apodo."
    >
      <TextField
        label="Tu nombre o apodo"
        hideLabel
        autoComplete="given-name"
        maxLength={60}
        placeholder="Escribe aquí…"
        error={errors.name?.message}
        {...register('name')}
      />
    </StepWrapper>
  )
}

function AgeStep({ direction }: StepProps) {
  const { register, errors } = useStepForm()
  return (
    <StepWrapper direction={direction} title="¿Cuántos años tienes?">
      <TextField
        label="Tu edad"
        hideLabel
        type="number"
        inputMode="numeric"
        min={10}
        max={100}
        placeholder="Por ejemplo: 25"
        error={errors.age?.message}
        {...register('age', {
          setValueAs: (value: string) => (value === '' || value == null ? undefined : Number(value)),
        })}
      />
    </StepWrapper>
  )
}

function MoodStep({ direction }: StepProps) {
  const { control, errors } = useStepForm()
  return (
    <StepWrapper direction={direction} title="¿Cómo te sientes hoy?">
      <Controller
        control={control}
        name="mood"
        render={({ field }) => (
          <EmojiScale
            name={field.name}
            legend="¿Cómo te sientes hoy?"
            options={MOODS}
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            error={errors.mood?.message}
          />
        )}
      />
    </StepWrapper>
  )
}

function EmotionsStep({ direction }: StepProps) {
  const { control, trigger, errors } = useStepForm()
  return (
    <StepWrapper
      direction={direction}
      title="¿Qué emociones has sentido con más frecuencia?"
      hint="Puedes elegir varias."
    >
      <Controller
        control={control}
        name="emotions"
        render={({ field }) => (
          <ChipGroup
            name={field.name}
            legend="Emociones que has sentido con más frecuencia"
            options={EMOTIONS}
            value={field.value}
            onChange={(next) => {
              field.onChange(next)
              void trigger('emotions')
            }}
            onBlur={field.onBlur}
            error={errors.emotions?.message}
          />
        )}
      />
    </StepWrapper>
  )
}

function DurationStep({ direction }: StepProps) {
  const { control, errors } = useStepForm()
  return (
    <StepWrapper direction={direction} title="¿Hace cuánto te sientes así?">
      <Controller
        control={control}
        name="duration"
        render={({ field }) => (
          <OptionCards
            name={field.name}
            legend="¿Hace cuánto te sientes así?"
            hideLegend
            options={DURATIONS}
            layout="grid"
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            error={errors.duration?.message}
          />
        )}
      />
    </StepWrapper>
  )
}

function ImpactStep({ direction }: StepProps) {
  const { control, errors } = useStepForm()
  return (
    <StepWrapper
      direction={direction}
      title="¿Cuánto está afectando tu día a día?"
      hint="0 es nada y 10 es muchísimo."
    >
      <Controller
        control={control}
        name="impact"
        render={({ field }) => (
          <RangeSlider
            name={field.name}
            legend="¿Cuánto está afectando tu día a día? De 0 a 10"
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            describe={describeImpact}
            minLabel="Nada"
            maxLabel="Muchísimo"
            error={errors.impact?.message}
          />
        )}
      />
    </StepWrapper>
  )
}

function HabitsStep({ direction }: StepProps) {
  const { control, errors } = useStepForm()
  return (
    <StepWrapper direction={direction} title="¿Cómo has estado durmiendo y comiendo?">
      <Controller
        control={control}
        name="sleep"
        render={({ field }) => (
          <OptionCards
            name={field.name}
            legend="😴 Sueño"
            options={QUALITY}
            layout="row"
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            error={errors.sleep?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="appetite"
        render={({ field }) => (
          <OptionCards
            name={field.name}
            legend="🍽️ Apetito"
            options={QUALITY}
            layout="row"
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            error={errors.appetite?.message}
          />
        )}
      />
    </StepWrapper>
  )
}

function SelfHarmStep({ direction }: StepProps) {
  const { control, errors } = useStepForm()
  const selfHarm = useWatch({ control, name: 'selfHarm' })
  return (
    <StepWrapper
      direction={direction}
      title="¿Has tenido pensamientos de hacerte daño o de que sería mejor no estar aquí?"
      hint="Puedes responder con confianza. Esto solo nos ayuda a cuidarte mejor."
    >
      <Controller
        control={control}
        name="selfHarm"
        render={({ field }) => (
          <OptionCards
            name={field.name}
            legend="Pensamientos de hacerte daño"
            hideLegend
            options={SELF_HARM}
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            error={errors.selfHarm?.message}
          />
        )}
      />
      {selfHarm && selfHarm !== 'no' && <UrgentHelp />}
    </StepWrapper>
  )
}

function ContactStep({ direction }: StepProps) {
  const { register, control, trigger, errors } = useStepForm()
  return (
    <StepWrapper
      direction={direction}
      title="¿Cómo podemos contactarte?"
      hint="Un último paso: así podremos acompañarte."
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
        label="Teléfono o WhatsApp (opcional)"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        placeholder="+00 000 000 0000"
        error={errors.phone?.message}
        {...register('phone')}
      />
      <Controller
        control={control}
        name="bestTime"
        render={({ field }) => (
          <OptionCards
            name={field.name}
            legend="Mejor horario para contactarte"
            options={BEST_TIMES}
            layout="row"
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            error={errors.bestTime?.message}
          />
        )}
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
            Acepto que se comuniquen conmigo y que mis datos se usen para recibir apoyo
            psicológico
          </CheckboxField>
        )}
      />
    </StepWrapper>
  )
}

const STEP_COMPONENTS = [
  NameStep,
  AgeStep,
  MoodStep,
  EmotionsStep,
  DurationStep,
  ImpactStep,
  HabitsStep,
  SelfHarmStep,
  ContactStep,
]

export default function FormStep({ step, direction }: StepProps & { step: number }) {
  const Step = STEP_COMPONENTS[step]
  return <Step direction={direction} />
}
