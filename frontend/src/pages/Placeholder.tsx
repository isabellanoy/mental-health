import { motion } from 'framer-motion'

export default function Placeholder({ title }: { title: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <motion.h1
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="rounded-blob bg-lila-light px-8 py-4 text-3xl font-extrabold shadow-suave"
      >
        {title}
      </motion.h1>
    </main>
  )
}
