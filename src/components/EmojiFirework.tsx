import { useEffect, useState } from "react";

interface Particle {
  id: string;
  emoji: string;
  finalX: number;
  finalY: number;
  delay: number;
}

const EMOJIS = ["❤️", "💗", "💖", "💕", "🌸", "🌺", "💐"];
const PARTICLE_COUNT = 25;

interface EmojiFireworkProps {
  x: number;
  y: number;
  onComplete?: () => void;
}

export const EmojiFirework = ({ x, y, onComplete }: EmojiFireworkProps) => {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    // Generate particles
    const newParticles: Particle[] = Array.from({ length: PARTICLE_COUNT }, (_, i) => {
      const angle = (Math.PI * 2 * i) / PARTICLE_COUNT + (Math.random() - 0.5) * 0.3;
      const velocity = 80 + Math.random() * 100; // 80-180px
      
      return {
        id: `particle-${Date.now()}-${i}`,
        emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
        finalX: Math.cos(angle) * velocity,
        finalY: Math.sin(angle) * velocity,
        delay: Math.random() * 0.1,
      };
    });

    setParticles(newParticles);

    // Cleanup after animation
    const timer = setTimeout(() => {
      setParticles([]);
      onComplete?.();
    }, 1500);

    return () => clearTimeout(timer);
  }, [x, y, onComplete]);

  return (
    <div
      className="fixed pointer-events-none z-[9999]"
      style={{
        left: x,
        top: y,
      }}
    >
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute text-sm animate-float-up"
          style={{
            left: 0,
            top: 0,
            animationDelay: `${particle.delay}s`,
            // @ts-ignore - CSS custom properties
            "--final-x": `${particle.finalX}px`,
            "--final-y": `${particle.finalY}px`,
          }}
        >
          {particle.emoji}
        </div>
      ))}
    </div>
  );
};

export const useEmojiFirework = () => {
  const [fireworks, setFireworks] = useState<Array<{ id: string; x: number; y: number }>>([]);

  const trigger = (event: React.MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    const id = `firework-${Date.now()}`;
    setFireworks((prev) => [...prev, { id, x, y }]);
  };

  const removeFirework = (id: string) => {
    setFireworks((prev) => prev.filter((f) => f.id !== id));
  };

  const FireworkContainer = (
    <>
      {fireworks.map((firework) => (
        <EmojiFirework
          key={firework.id}
          x={firework.x}
          y={firework.y}
          onComplete={() => removeFirework(firework.id)}
        />
      ))}
    </>
  );

  return { trigger, FireworkContainer };
};
