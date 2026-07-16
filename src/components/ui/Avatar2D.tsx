import React from 'react';
import { motion } from 'framer-motion';

interface Avatar2DProps {
  isSpeaking: boolean;
  size?: number;
  gender?: 'male' | 'female';
}

export function Avatar2D({ isSpeaking, size = 160, gender = 'male' }: Avatar2DProps) {
  const imgSrc = gender === 'female' ? '/avatar_female.png' : '/avatar_male.png';
  return (
    <div 
      className="relative flex items-center justify-center rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl"
      style={{ width: size, height: size }}
    >
      {/* Glow rings when speaking */}
      {isSpeaking && (
        <>
          <motion.div
            className="absolute inset-0 rounded-2xl bg-purple-500/20"
            initial={{ scale: 1, opacity: 0.5 }}
            animate={{ scale: 1.2, opacity: 0 }}
            transition={{ repeat: Infinity, duration: 1.5, ease: 'easeOut' }}
          />
          <motion.div
            className="absolute inset-0 rounded-2xl bg-cyan-500/20"
            initial={{ scale: 1, opacity: 0.5 }}
            animate={{ scale: 1.4, opacity: 0 }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeOut', delay: 0.2 }}
          />
        </>
      )}

      {/* The Avatar itself */}
      <motion.div 
        className="relative z-10 w-3/4 h-3/4 bg-zinc-800 rounded-full flex items-center justify-center overflow-hidden border border-zinc-700 shadow-inner"
        animate={{ scale: isSpeaking ? [1, 1.05, 1] : 1 }}
        transition={{ repeat: isSpeaking ? Infinity : 0, duration: 0.5, ease: 'easeInOut' }}
      >
        <img src={imgSrc} alt="AI Interviewer" className="w-full h-full object-cover" />

        {/* Audio waveform overlay when speaking */}
        {isSpeaking && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-end gap-1 h-4">
            <motion.div className="w-1 bg-purple-400 rounded-full" animate={{ height: ['20%', '80%', '20%'] }} transition={{ repeat: Infinity, duration: 0.6, ease: 'easeInOut' }} />
            <motion.div className="w-1 bg-cyan-400 rounded-full" animate={{ height: ['40%', '100%', '40%'] }} transition={{ repeat: Infinity, duration: 0.4, ease: 'easeInOut', delay: 0.1 }} />
            <motion.div className="w-1 bg-purple-400 rounded-full" animate={{ height: ['30%', '90%', '30%'] }} transition={{ repeat: Infinity, duration: 0.5, ease: 'easeInOut', delay: 0.2 }} />
          </div>
        )}
      </motion.div>
    </div>
  );
}
