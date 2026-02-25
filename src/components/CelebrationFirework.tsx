import { useEffect, useRef, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

type Side = "left" | "right";

interface ParticleData {
  id: string;
  emoji: string;
  side: Side;
  delayMs: number;
  durationMs: number;
  pathD: string;
  totalLen: number;
  el: HTMLSpanElement | null;
  started: boolean;
  startTimeMs: number;
  finished: boolean;
  rotationSeed: number;
  fontClass: string;
}

const DEFAULT_EMOJIS = ["❤️","🩷","🧡","💛","🍷","🥂","🍾"];
const SVG_NS = "http://www.w3.org/2000/svg";

function makeSvgPath(d: string): SVGPathElement {
  const p = document.createElementNS(SVG_NS, "path");
  p.setAttribute("d", d);
  return p;
}

function quadPathD(x0: number, y0: number, cx: number, cy: number, x1: number, y1: number) {
  return `M ${x0},${y0} Q ${cx},${cy} ${x1},${y1}`;
}

export const CelebrationFirework = ({ onComplete, emojis }: { onComplete?: () => void; emojis?: string[] }) => {
  const isMobile = useIsMobile();
  const [particles, setParticles] = useState<ParticleData[]>([]);
  const rafRef = useRef<number | null>(null);
  const pathsPoolRef = useRef<SVGPathElement[]>([]);
  const rootRef = useRef<HTMLDivElement>(null);
  const emojisRef = useRef(emojis && emojis.length > 0 ? emojis : DEFAULT_EMOJIS);

  useEffect(() => {
    emojisRef.current = emojis && emojis.length > 0 ? emojis : DEFAULT_EMOJIS;
  }, [emojis]);

  useEffect(() => {
    const W = window.innerWidth;
    const H = window.innerHeight;

    const LEFT_COUNT = isMobile ? 27 : 60;
    const RIGHT_COUNT = isMobile ? 27 : 60;

    const rand = (min:number, max:number) => Math.random() * (max - min) + min;
    const launchY = () => H * rand(0.4, 0.6);

    const mkLeftPath = () => {
      const y0 = launchY();
      const x0 = -rand(24, 96);
      const angle = (Math.random() * 150 - 30) * (Math.PI / 180);
      const d = isMobile ? 200 + Math.random() * 400 : 500 + Math.random() * 1200;
      const x1 = x0 + d * Math.cos(angle);
      const y1 = y0 + d * Math.sin(angle);
      const cx = x0 + (x1 - x0) * 0.6 + rand(-20, 20);
      const cy = y0 + (y1 - y0) * 0.6 - Math.abs(d) * 0.1 + rand(-12, 12);
      return quadPathD(x0, y0, cx, cy, x1, y1);
    };

    const mkRightPath = () => {
      const y0 = launchY();
      const x0 = W + rand(24, 96);
      const angle = (Math.random() * 150 + 60) * (Math.PI / 180);
      const d = isMobile ? 200 + Math.random() * 400 : 500 + Math.random() * 1200;
      const x1 = x0 + d * Math.cos(angle);
      const y1 = y0 + d * Math.sin(angle);
      const cx = x0 + (x1 - x0) * 0.6 + Math.random() * 40 - 20;
      const cy = y0 + (y1 - y0) * 0.6 - Math.abs(d) * 0.1 + Math.random() * 24 - 12;
      return quadPathD(x0, y0, cx, cy, x1, y1);
    };

    const fontClass = isMobile ? "text-[36px]" : "text-[54px]";

    const build = (side: Side, idx: number): ParticleData => {
      const pathD = side === "left" ? mkLeftPath() : mkRightPath();
      const path = makeSvgPath(pathD);
      const totalLen = path.getTotalLength();

      return {
        id: `${side}-${idx}`,
        emoji: emojisRef.current[(Math.random() * emojisRef.current.length) | 0],
        side,
        delayMs: Math.random() * 600,               // vẫn có độ trễ nhẹ
        durationMs: 1100 + Math.random() * 900,     // ⚡ rút ngắn còn ~1.1–2.0s (tăng tốc 30–40%)
        pathD,
        totalLen,
        el: null,
        started: false,
        startTimeMs: 0,
        finished: false,
        rotationSeed: Math.random() * 720 - 360,
        fontClass,
      };
    };

    const list: ParticleData[] = [];
    for (let i = 0; i < LEFT_COUNT; i++) list.push(build("left", i));
    for (let i = 0; i < RIGHT_COUNT; i++) list.push(build("right", i));

    pathsPoolRef.current = list.map(p => makeSvgPath(p.pathD));
    setParticles(list);

    return () => { pathsPoolRef.current = []; };
  }, [isMobile]);

  useEffect(() => {
    if (!particles.length) return;
    const root = rootRef.current;
    if (!root) return;

    let running = true;
    const startWallTime = performance.now();

    const tick = (now: number) => {
      if (!running) return;

      let allFinished = true;
      const elapsedSinceStart = now - startWallTime;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        if (p.finished) continue;

        if (!p.started) {
          if (elapsedSinceStart >= p.delayMs) {
            p.started = true;
            p.startTimeMs = now;
            if (p.el) p.el.style.opacity = "1";
          } else {
            if (p.el) p.el.style.opacity = "0";
            allFinished = false;
            continue;
          }
        }

        const t = (now - p.startTimeMs) / p.durationMs; // 0..1
        if (t >= 1) {
          if (p.el) p.el.style.opacity = "0";
          p.finished = true;
          continue;
        } else allFinished = false;

        const path = pathsPoolRef.current[i];
        if (!path || !p.el) continue;
        const L = p.totalLen;
        const s = t * L;
        const pt = path.getPointAtLength(s);
        const eps = 0.5;
        const ptAhead = path.getPointAtLength(Math.min(L, s + eps));
        const angleRad = Math.atan2(ptAhead.y - pt.y, ptAhead.x - pt.x);
        const angleDeg = (angleRad * 180) / Math.PI;

        const spin = p.rotationSeed * 0.1 * t;

        p.el.style.transform = `translate3d(${pt.x}px, ${pt.y}px, 0) rotate(${angleDeg + spin}deg)`;
        p.el.style.opacity = (t < 0.85) ? "1" : `${Math.max(0, 1 - (t - 0.85) / 0.15)}`;
      }

      if (allFinished) {
        running = false;
        onComplete?.();
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      running = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [particles, onComplete]);

  return (
    <div ref={rootRef} className="fixed inset-0 pointer-events-none z-[9999]">
      {particles.map((p, idx) => (
        <span
          key={p.id}
          ref={(el) => { particles[idx].el = el; }}
          className={`absolute leading-none ${p.fontClass}`}
          style={{
            opacity: 0,
            willChange: "transform, opacity",
            backfaceVisibility: "hidden",
            transform: "translate3d(0,0,0)",
            userSelect: "none",
          } as React.CSSProperties}
        >
          {p.emoji}
        </span>
      ))}
    </div>
  );
};

export const useCelebrationFirework = (emojis?: string[]) => {
  const [showFirework, setShowFirework] = useState(false);
  const trigger = () => setShowFirework(true);
  const handleComplete = () => setShowFirework(false);

  const FireworkContainer = showFirework ? (
    <CelebrationFirework onComplete={handleComplete} emojis={emojis} />
  ) : null;

  return { trigger, FireworkContainer };
};
