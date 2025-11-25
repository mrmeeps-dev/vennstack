import { motion } from 'framer-motion';
import { Item } from '../types/game';

// Shared card styling constants for consistency across all card variants
export const CARD_BASE_CLASSES = 'min-w-[40px] min-h-[40px] px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl';
export const CARD_TEXT_SIZE = 'text-xs sm:text-sm';
export const CARD_SPAN_TEXT_SIZE = 'text-sm';
export const CARD_UTILITY_CLASSES = 'transition-all duration-200 select-none touch-none relative';
export const CARD_BOX_SHADOW = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';

interface WordCardProps {
  item: Item;
  isLocked: boolean;
  shouldShake: boolean;
  justLocked?: boolean;
  densityScale?: number;
}

export function WordCard({ item, isLocked, shouldShake, justLocked, densityScale = 1.0 }: WordCardProps) {
  return (
    <motion.div
      animate={
        shouldShake
          ? {
              x: [-10, 10, -10, 10, 0],
              scale: densityScale,
              transition: { duration: 0.5, ease: 'easeInOut' },
            }
          : justLocked
          ? {
              scale: [densityScale, densityScale * 1.1, densityScale],
              backgroundColor: ['#ffffff', '#60A5FA', '#60A5FA'],
              transition: { duration: 0.4, ease: 'easeOut' },
            }
          : isLocked
          ? {
              scale: densityScale,
              backgroundColor: '#60A5FA',
            }
          : { scale: densityScale }
      }
      initial={false}
      className={`
        ${CARD_BASE_CLASSES} ${CARD_UTILITY_CLASSES} 
        ${isLocked ? 'bg-[#60A5FA] text-white cursor-not-allowed' : 'bg-white text-[#333333]'}
        opacity-100
        flex items-center justify-center
        ${CARD_TEXT_SIZE}
      `}
      style={{
        boxShadow: CARD_BOX_SHADOW,
        transformOrigin: 'center',
        pointerEvents: 'none',
      }}
    >
      <span className={`font-medium ${CARD_SPAN_TEXT_SIZE} whitespace-nowrap overflow-hidden text-ellipsis max-w-full`}>{item.text}</span>
    </motion.div>
  );
}

