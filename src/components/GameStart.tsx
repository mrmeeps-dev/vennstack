import { motion } from 'framer-motion';

interface GameStartProps {
  isOpen: boolean;
  onPlay: () => void;
  puzzleNumber: number;
  puzzleDate?: string; // Optional puzzle date string (YYYY-MM-DD)
}

export function GameStart({ isOpen, onPlay, puzzleNumber, puzzleDate }: GameStartProps) {
  if (!isOpen) return null;

  const formatDate = () => {
    // Use puzzle date if provided, otherwise use today's date
    let dateToFormat: Date;
    if (puzzleDate && puzzleDate.includes('-')) {
      const [year, month, day] = puzzleDate.split('-').map(Number);
      dateToFormat = new Date(year, month - 1, day);
    } else {
      dateToFormat = new Date();
    }
    
    const options: Intl.DateTimeFormatOptions = {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    };
    return dateToFormat.toLocaleDateString('en-US', options);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-50 bg-[#FAFAFA] flex flex-col items-center justify-center px-4"
    >
      {/* Logo */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="mb-6"
      >
        <img
          src="/vennstack.png"
          alt="VennStack"
          className="h-20 w-20 object-contain"
        />
      </motion.div>

      {/* Game Title */}
      <motion.h1
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
        className="text-4xl font-bold text-slate-900 mb-3"
      >
        VennStack
      </motion.h1>

      {/* Date and Puzzle Number */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3, ease: 'easeOut' }}
        className="text-sm text-slate-500 mb-6"
      >
        {formatDate()} • No. {puzzleNumber}
      </motion.div>

      {/* Instructions/Tagline */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4, ease: 'easeOut' }}
        className="text-center mb-8"
      >
        <p className="text-base text-slate-700 mb-1">
          Find the correct categories.
        </p>
        <p className="text-base text-slate-700">
          Master today&apos;s VennStack.
        </p>
      </motion.div>

      {/* Play Button */}
      <motion.button
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.5, ease: 'easeOut' }}
        whileHover={{ scale: 1.02, boxShadow: "0 12px 32px rgba(178, 235, 242, 0.4)" }}
        whileTap={{ scale: 0.95 }}
        onClick={onPlay}
        className="px-6 sm:px-8 py-3 sm:py-3.5 rounded-full bg-[#B2EBF2] hover:bg-[#80DEEA] text-slate-800 font-semibold text-sm sm:text-base transition-colors"
        style={{ boxShadow: '0 8px 24px rgba(178, 235, 242, 0.3)' }}
      >
        Play
      </motion.button>
    </motion.div>
  );
}

