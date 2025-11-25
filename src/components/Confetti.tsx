import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface ConfettiParticle {
  id: number;
  x: number;
  y: number;
  color: string;
  rotation: number;
  size: number;
}

const colors = ['#06B6D4', '#14B8A6', '#A855F7', '#60A5FA', '#86EFAC', '#FCD34D', '#FB7185'];

interface ConfettiProps {
  isActive: boolean;
}

export function Confetti({ isActive }: ConfettiProps) {
  const [particles, setParticles] = useState<ConfettiParticle[]>([]);

  useEffect(() => {
    if (!isActive) {
      setParticles([]);
      return;
    }

    // Create 50 confetti particles
    const newParticles: ConfettiParticle[] = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100, // Random horizontal position (percentage)
      y: -10 - Math.random() * 20, // Start above viewport
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      size: 8 + Math.random() * 12, // Size between 8-20px
    }));

    setParticles(newParticles);
  }, [isActive]);

  if (!isActive || particles.length === 0) {
    return null;
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-sm"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            backgroundColor: particle.color,
          }}
          initial={{
            y: particle.y,
            x: particle.x,
            rotate: particle.rotation,
            opacity: 1,
          }}
          animate={{
            y: window.innerHeight + 100,
            x: particle.x + (Math.random() - 0.5) * 200,
            rotate: particle.rotation + 360 * (Math.random() > 0.5 ? 1 : -1),
            opacity: [1, 1, 0],
          }}
          transition={{
            duration: 3 + Math.random() * 2, // 3-5 seconds
            ease: 'easeIn',
            opacity: {
              times: [0, 0.8, 1],
              duration: 3 + Math.random() * 2,
            },
          }}
        />
      ))}
    </div>
  );
}




