"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import {
  ArrowRightCircle,
  Fingerprint,
  LockKeyhole,
  ShieldCheck,
  Menu,
  X,
} from "lucide-react";
import { Logo } from "./Logo";
import { HeroBackground } from "./HeroBackground";

const NAV_LINKS = [
  { label: "How it works", href: "/#how" },
  { label: "Features", href: "/#features" },
  { label: "Verify", href: "/verify" },
  {
    label: "Docs",
    href: "https://docs.story.foundation/developers/cdr-sdk/overview",
  },
];

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15, duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  }),
};

const iconStyle = "inline-block align-middle relative -top-0.5 mx-1";

export function LandingHero() {
  const [open, setOpen] = useState(false);

  return (
    <section className="relative w-full overflow-hidden md:min-h-[88vh]">
      {/* Animated CSS/Motion backdrop (no video) */}
      <HeroBackground />

      {/* Navbar */}
      <div className="relative z-10 mx-auto flex max-w-[1280px] items-center justify-between px-5 py-4 sm:px-8 sm:py-5">
        <Logo />

        <nav className="hidden items-center gap-7 md:flex">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.label}
              href={l.href}
              className="text-sm font-medium text-ink/80 transition hover:text-ink"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Link
            href="/app"
            className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-ink/90"
          >
            Launch App
          </Link>
          <a
            href="https://github.com/Jhaycrypt001/cryptid"
            className="rounded-full border border-edge bg-surface px-5 py-2.5 text-sm font-semibold text-ink transition hover:border-ink/40"
          >
            GitHub
          </a>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setOpen(true)}
          className="md:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-6 w-6 text-ink" />
        </button>
      </div>

      {/* Mobile sheet */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 z-40"
              style={{ background: "rgba(25,40,55,0.35)", backdropFilter: "blur(4px)" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.aside
              className="fixed right-0 top-0 z-50 flex h-[100dvh] flex-col p-6"
              style={{
                width: "min(88vw, 360px)",
                background: "#CFC8C5",
                boxShadow: "-12px 0 48px rgba(25,40,55,0.18)",
              }}
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="flex items-center justify-between">
                <Logo />
                <button onClick={() => setOpen(false)} aria-label="Close menu">
                  <X className="h-6 w-6 text-ink" />
                </button>
              </div>
              <div className="my-5 h-px bg-ink/15" />
              <nav className="flex flex-col gap-1">
                {NAV_LINKS.map((l, i) => (
                  <motion.div
                    key={l.label}
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.18 + i * 0.07 }}
                  >
                    <Link
                      href={l.href}
                      onClick={() => setOpen(false)}
                      className="block py-2 text-lg font-medium text-ink"
                    >
                      {l.label}
                    </Link>
                  </motion.div>
                ))}
              </nav>
              <div className="mt-auto flex flex-col gap-2">
                <Link
                  href="/app"
                  className="rounded-full bg-ink px-5 py-3 text-center text-sm font-semibold text-white"
                >
                  Launch App
                </Link>
                <a
                  href="https://github.com/Jhaycrypt001/cryptid"
                  className="rounded-full border border-ink/20 px-5 py-3 text-center text-sm font-semibold text-ink"
                >
                  GitHub
                </a>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Hero content */}
      <div
        className="relative z-10 mx-auto max-w-[1280px] px-5 pb-16 sm:px-8 sm:pb-20 md:pb-28"
        style={{ paddingTop: "clamp(40px, 8vw, 72px)" }}
      >
        <div className="w-full max-w-[560px]">
          <motion.h1
            custom={0}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="font-heading text-ink [overflow-wrap:anywhere]"
            style={{
              fontSize: "clamp(1.65rem, 5vw, 3rem)",
              lineHeight: 1.05,
              letterSpacing: "-0.01em",
              marginBottom: 24,
            }}
          >
            <Fingerprint size={24} color="#192837" className={iconStyle} /> Lock Down Your
            Identity
            <LockKeyhole size={24} color="#192837" className={iconStyle} /> with Onchain
            Privacy
            <ShieldCheck size={24} color="#192837" className={iconStyle} />
          </motion.h1>

          <motion.p
            custom={1}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="text-ink [overflow-wrap:anywhere]"
            style={{
              fontSize: "clamp(0.9rem, 2.5vw, 1.1rem)",
              lineHeight: 1.65,
              opacity: 0.8,
            }}
          >
            Every claim about you (age, KYC, nationality, credentials) becomes an encrypted
            object you own. Grant a verifier access to a single fact, revoke it anytime, and
            never expose the rest. Threshold-encrypted on Story&apos;s Confidential Data Rails.
          </motion.p>

          <motion.div
            custom={2}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="mt-8 flex flex-wrap items-center gap-5"
          >
            <Link
              href="/app"
              className="inline-flex items-center justify-between font-semibold text-white"
              style={{
                background: "#192837",
                borderRadius: 50,
                padding: "17px 24px",
                fontSize: "clamp(0.9rem, 2vw, 1rem)",
                minWidth: 210,
                gap: 32,
              }}
            >
              Launch App
              <ArrowRightCircle size={20} />
            </Link>
            <a
              href="https://github.com/Jhaycrypt001/cryptid"
              className="inline-flex items-center gap-2 text-sm font-medium text-ink/80 transition hover:text-ink"
            >
              View on GitHub
              <ArrowRightCircle size={16} />
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
