import { motion } from 'framer-motion';

interface AttemptProgressBarProps {
  attemptsUsed: number;
  maxAttempts: number;
  buttonWidth?: number | null;
}

export function AttemptProgressBar({ attemptsUsed, maxAttempts, buttonWidth }: AttemptProgressBarProps) {
  const segments = Array.from({ length: maxAttempts }, (_, i) => i);

  return (
    <div className="w-full bg-[#FAFAFA] px-3 pb-1 sm:pb-1.5">
      <div className="max-w-[428px] mx-auto relative w-full">
        <div className="flex items-center justify-center gap-1 sm:gap-1.5 w-full px-4 sm:px-6">
          {segments.map((index) => {
            const isUsed = index < attemptsUsed;
            const isActive = index === attemptsUsed - 1 && attemptsUsed > 0;
            
            return (
              <motion.div
                key={index}
                initial={false}
                animate={{
                  scale: isActive ? [1, 1.15, 1] : 1,
                }}
                transition={{
                  scale: {
                    duration: 0.4,
                    ease: [0.34, 1.56, 0.64, 1],
                  },
                }}
                className={`
                  flex-1 h-1.5 sm:h-2 rounded-full transition-all duration-300 shrink-0
                  ${isUsed 
                    ? 'bg-[#06B6D4]' 
                    : 'bg-slate-300'
                  }
                `}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

