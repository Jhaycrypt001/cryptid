"use client";

import { motion } from "framer-motion";

// Ztocks-style hero backdrop: a fine dot grid concentrated in the top-right,
// a scatter of slowly twinkling/drifting dots for motion, and one faint accent
// glow — all under a left→right paper wash so the dark heading stays crisp.
// Pure CSS/Motion, no external assets.

// Deterministic positions (no Math.random → no hydration mismatch).
const TWINKLES = [
  { top: "10%", right: "8%", d: 4, delay: 0 },
  { top: "16%", right: "22%", d: 3, delay: 1.2 },
  { top: "24%", right: "12%", d: 5, delay: 0.6 },
  { top: "30%", right: "30%", d: 3, delay: 2.1 },
  { top: "12%", right: "34%", d: 4, delay: 1.7 },
  { top: "38%", right: "18%", d: 4, delay: 0.9 },
  { top: "20%", right: "5%", d: 3, delay: 2.6 },
  { top: "44%", right: "28%", d: 5, delay: 1.4 },
  { top: "8%", right: "16%", d: 3, delay: 3.0 },
  { top: "34%", right: "9%", d: 4, delay: 0.3 },
];

export function HeroBackground() {
  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden bg-paper">
      {/* Fine dot grid, masked to the top-right */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(25,40,55,0.16) 1px, transparent 1px)",
          backgroundSize: "20px 20px",
          WebkitMaskImage:
            "radial-gradient(110% 90% at 88% 18%, black 0%, transparent 62%)",
          maskImage: "radial-gradient(110% 90% at 88% 18%, black 0%, transparent 62%)",
        }}
      />

      {/* Faint accent glow */}
      <div
        className="absolute rounded-full blur-[120px]"
        style={{
          width: 480,
          height: 480,
          top: "-10%",
          right: "-4%",
          background: "rgba(115,66,226,0.16)",
        }}
      />

      {/* Twinkling / drifting dots */}
      {TWINKLES.map((t, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full"
          style={{
            top: t.top,
            right: t.right,
            width: t.d,
            height: t.d,
            background: i % 3 === 0 ? "rgba(115,66,226,0.7)" : "rgba(25,40,55,0.45)",
          }}
          animate={{ opacity: [0.2, 1, 0.2], y: [0, -10, 0] }}
          transition={{
            duration: 4 + (i % 4),
            repeat: Infinity,
            ease: "easeInOut",
            delay: t.delay,
          }}
        />
      ))}

      {/* Readability wash — paper on the left fading to clear on the right */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(100deg, rgba(242,242,238,0.98) 0%, rgba(242,242,238,0.9) 42%, rgba(242,242,238,0.5) 74%, rgba(242,242,238,0.18) 100%)",
        }}
      />
    </div>
  );
}
