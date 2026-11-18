import { motion, useReducedMotion } from 'framer-motion'
import type { HTMLMotionProps } from 'framer-motion'
import { buttonClasses } from './buttonStyles'
import type { Size, Variant } from './buttonStyles'

interface ButtonProps extends HTMLMotionProps<'button'> {
  variant?: Variant
  size?: Size
  // Efecto de "latido" para invitar al clic
  pulse?: boolean
}

export default function Button({
  variant = 'primary',
  size = 'md',
  pulse = false,
  className = '',
  type = 'button',
  disabled,
  ...props
}: ButtonProps) {
  const reduceMotion = useReducedMotion()
  const interactive = !disabled && !reduceMotion

  const button = (
    <motion.button
      type={type}
      disabled={disabled}
      whileHover={interactive ? { scale: 1.05 } : undefined}
      whileTap={interactive ? { scale: 0.95 } : undefined}
      className={`${buttonClasses(variant, size)} ${className}`}
      {...props}
    />
  )

  if (!pulse || reduceMotion || disabled) return button

  return (
    <motion.span
      className="inline-flex"
      animate={{ scale: [1, 1.07, 1, 1.05, 1] }}
      transition={{
        duration: 1.6,
        times: [0, 0.14, 0.28, 0.42, 1],
        ease: 'easeInOut',
        repeat: Infinity,
      }}
    >
      {button}
    </motion.span>
  )
}
