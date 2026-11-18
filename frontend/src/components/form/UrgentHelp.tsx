import { motion, useReducedMotion } from 'framer-motion'
import { URGENT_HELP } from '../../constants/urgentHelp'

export default function UrgentHelp() {
  const reduceMotion = useReducedMotion()

  return (
    <motion.section
      role="status"
      aria-live="polite"
      className="rounded-blob bg-durazno-light p-5 text-left shadow-suave ring-2 ring-durazno"
      initial={{ opacity: 0, y: reduceMotion ? 0 : 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <h3 className="mb-2 text-lg font-extrabold text-slate-800">{URGENT_HELP.title}</h3>
      <p className="mb-4 text-base leading-relaxed text-slate-700">{URGENT_HELP.message}</p>
      <ul className="mb-4 flex flex-col gap-3">
        {URGENT_HELP.resources.map((resource) => (
          <li key={resource.label} className="rounded-2xl bg-white p-3">
            <p className="font-extrabold text-slate-800">{resource.label}</p>
            <p className="text-sm text-slate-600">{resource.description}</p>
            <p className="mt-1 font-bold text-lila-deep">{resource.contact}</p>
          </li>
        ))}
      </ul>
      <a
        href={URGENT_HELP.directory.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex min-h-11 items-center font-bold text-lila-deep underline underline-offset-4 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-lila-deep"
      >
        {URGENT_HELP.directory.label}
      </a>
      <p className="mt-2 text-sm text-slate-600">{URGENT_HELP.footer}</p>
    </motion.section>
  )
}
