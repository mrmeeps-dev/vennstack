import { Transition } from 'framer-motion';

export interface DndAnimationConfig {
  drag: Transition;
  drop: Transition;
  layout: Transition;
  error: Transition;
  lock: Transition;
}

/**
 * Central hook for drag-and-drop animation configurations
 * Returns consistent animation configs for use with framer-motion
 */
export function useDndAnimations(): DndAnimationConfig {
  return {
    // Smooth drag animation
    drag: {
      type: 'spring',
      damping: 25,
      stiffness: 200,
    },
    
    // Drop animation - smooth settle
    drop: {
      type: 'spring',
      damping: 30,
      stiffness: 300,
      mass: 0.8,
    },
    
    // Layout shift animation - when items reorder
    layout: {
      type: 'spring',
      damping: 35,
      stiffness: 400,
      mass: 0.5,
    },
    
    // Error state animation (shake)
    error: {
      duration: 0.5,
      ease: 'easeInOut',
    },
    
    // Lock animation (success)
    lock: {
      duration: 0.4,
      ease: 'easeOut',
    },
  };
}

/**
 * Get animation config adjusted for density
 * Higher density = faster, subtler animations
 */
export function useDensityAdjustedAnimations(itemCount: number): DndAnimationConfig {
  const base = useDndAnimations();
  
  // For very dense zones (>12 items), speed up animations slightly
  if (itemCount > 12) {
    return {
      ...base,
      layout: {
        type: 'spring',
        damping: 40,
        stiffness: 500,
        mass: 0.3,
      },
      drop: {
        type: 'spring',
        damping: 35,
        stiffness: 400,
        mass: 0.5,
      },
    };
  }
  
  return base;
}

