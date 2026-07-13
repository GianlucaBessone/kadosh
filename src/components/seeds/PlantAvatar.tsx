'use client'

import { motion } from 'framer-motion'

interface PlantAvatarProps {
  progress: number // 0 to 100
  className?: string
}

export function PlantAvatar({ progress, className = '' }: PlantAvatarProps) {
  // We determine the stage based on progress
  const stage = progress === 0 ? 0 : progress < 30 ? 1 : progress < 70 ? 2 : progress < 100 ? 3 : 4

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="relative w-32 h-32 flex items-center justify-center">
        {/* Tierra / Base */}
      <motion.div 
        className="absolute bottom-2 w-12 h-3 bg-[#e8c5a3]/50 rounded-full"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5 }}
      />

      {/* Stage 0: Semilla y Brotes iniciales */}
      <motion.div
        className="absolute bottom-4 flex flex-col items-center"
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: stage >= 0 ? 1 : 0 }}
        transition={{ duration: 0.6, type: "spring" }}
      >
        <div className="w-6 h-4 bg-[#b58b66] rounded-full shadow-inner relative z-10" />
        
        {/* Brote saliendo de la semilla (Stage 0, visible al crear) */}
        <motion.div
          className="absolute -top-3 w-1 h-4 bg-[#8fbf9f] rounded-full origin-bottom"
          initial={{ scaleY: 0 }}
          animate={{ scaleY: stage >= 0 ? 1 : 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        />
        <motion.div
          className="absolute -top-3 -right-2 w-2 h-2 bg-[#8fbf9f] rounded-full origin-bottom rotate-45"
          initial={{ scale: 0 }}
          animate={{ scale: stage >= 0 ? 1 : 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        />
      </motion.div>

      {/* Stage 1: Tallo creciendo */}
      <motion.div
        className="absolute bottom-4 flex flex-col items-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: stage >= 1 ? 1 : 0 }}
      >
        <motion.div
          className="w-1.5 h-10 bg-[#7fa58a] rounded-full origin-bottom"
          initial={{ scaleY: 0 }}
          animate={{ scaleY: stage >= 1 ? 1 : 0 }}
          transition={{ duration: 1 }}
        />
        <motion.div
          className="absolute top-2 -left-3 w-4 h-3 bg-[#8fbf9f] rounded-full origin-right -rotate-12"
          initial={{ scale: 0 }}
          animate={{ scale: stage >= 1 ? 1 : 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        />
        <motion.div
          className="absolute top-4 -right-3 w-4 h-3 bg-[#8fbf9f] rounded-full origin-left rotate-12"
          initial={{ scale: 0 }}
          animate={{ scale: stage >= 1 ? 1 : 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
        />
      </motion.div>

      {/* Stage 2: Arbusto */}
      <motion.div
        className="absolute bottom-4 flex flex-col items-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: stage >= 2 ? 1 : 0 }}
      >
        <motion.div
          className="w-2 h-14 bg-[#7fa58a] rounded-full origin-bottom"
          initial={{ scaleY: 0 }}
          animate={{ scaleY: stage >= 2 ? 1 : 0 }}
          transition={{ duration: 1 }}
        />
        <motion.div
          className="absolute top-0 w-8 h-8 bg-[#8fbf9f] rounded-full"
          initial={{ scale: 0 }}
          animate={{ scale: stage >= 2 ? 1 : 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        />
        <motion.div
          className="absolute top-2 -left-4 w-7 h-7 bg-[#8fbf9f] rounded-full"
          initial={{ scale: 0 }}
          animate={{ scale: stage >= 2 ? 1 : 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        />
        <motion.div
          className="absolute top-3 -right-4 w-7 h-7 bg-[#8fbf9f] rounded-full"
          initial={{ scale: 0 }}
          animate={{ scale: stage >= 2 ? 1 : 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
        />
      </motion.div>

      {/* Stage 3/4: Árbol maduro / Cosecha */}
      <motion.div
        className="absolute bottom-4 flex flex-col items-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: stage >= 3 ? 1 : 0 }}
      >
        <motion.div
          className="w-3 h-16 bg-[#b58b66] rounded-full origin-bottom"
          initial={{ scaleY: 0 }}
          animate={{ scaleY: stage >= 3 ? 1 : 0 }}
          transition={{ duration: 1 }}
        />
        <motion.div
          className="absolute -top-4 w-12 h-12 bg-[#7fa58a] rounded-full"
          initial={{ scale: 0 }}
          animate={{ scale: stage >= 3 ? 1 : 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        />
        <motion.div
          className="absolute -top-2 -left-6 w-10 h-10 bg-[#7fa58a] rounded-full"
          initial={{ scale: 0 }}
          animate={{ scale: stage >= 3 ? 1 : 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        />
        <motion.div
          className="absolute -top-1 -right-6 w-10 h-10 bg-[#7fa58a] rounded-full"
          initial={{ scale: 0 }}
          animate={{ scale: stage >= 3 ? 1 : 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
        />

        {/* Frutos (Stage 4 - Cosecha) */}
        {stage >= 4 && (
          <>
            <motion.div
              className="absolute top-0 -left-2 w-3 h-3 bg-[#d6b86a] rounded-full shadow-sm"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 1.2, type: 'spring', bounce: 0.6 }}
            />
            <motion.div
              className="absolute top-2 right-0 w-3 h-3 bg-[#d6b86a] rounded-full shadow-sm"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 1.4, type: 'spring', bounce: 0.6 }}
            />
            <motion.div
              className="absolute -top-1 right-4 w-3 h-3 bg-[#d6b86a] rounded-full shadow-sm"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 1.6, type: 'spring', bounce: 0.6 }}
            />
          </>
        )}
      </motion.div>
      </div>
    </div>
  )
}
