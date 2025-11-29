import { motion } from 'framer-motion';

interface AttemptProgressBarProps {
  attemptsUsed: number;
  maxAttempts: number;
  buttonWidth?: number | null;
  isGameOver?: boolean;
  isSuccess?: boolean;
}

import { useEffect, useState } from 'react';

export function AttemptProgressBar({ attemptsUsed, maxAttempts, buttonWidth: _buttonWidth, isGameOver, isSuccess }: AttemptProgressBarProps) {
  const segments = Array.from({ length: maxAttempts }, (_, i) => i);

  // When game is over on the final attempt, sweep red from right to left
  const [redFromRight, setRedFromRight] = useState(0);
  // When puzzle is successfully completed, sweep bright green from left to right
  const [greenToLeft, setGreenToLeft] = useState(0);

  useEffect(() => {
    // Reset when attempts are reset or game not over
    if (!isGameOver || attemptsUsed < maxAttempts) {
      setRedFromRight(0);
      return;
    }

    // Start with the last bar red, then fill leftwards
    setRedFromRight(1);
    const interval = setInterval(() => {
      setRedFromRight(prev => {
        if (prev >= maxAttempts) {
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, 200); // ~1 second total for 5 segments

    return () => clearInterval(interval);
  }, [isGameOver, attemptsUsed, maxAttempts]);

  // Success animation: sweep green from left to right up to the number of attempts used
  useEffect(() => {
    if (!isSuccess || attemptsUsed <= 0) {
      setGreenToLeft(0);
      return;
    }

    setGreenToLeft(1);
    const interval = setInterval(() => {
      setGreenToLeft(prev => {
        if (prev >= attemptsUsed) {
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, 180);

    return () => clearInterval(interval);
  }, [isSuccess, attemptsUsed]);

  const getUsedColor = (index: number) => {
    // During the red sweep, override with red from right to left
    if (redFromRight > 0 && index >= maxAttempts - redFromRight) {
      return 'bg-[#EF4444]';
    }

    // During success sweep, override with bright green from left to right
    if (isSuccess && greenToLeft > 0 && index < greenToLeft) {
      return 'bg-[#22C55E]';
    }

    // Normal used attempts: a single calm teal color
    return 'bg-[#B2EBF2]';
  };

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
                    ? getUsedColor(index)
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

