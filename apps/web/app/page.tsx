"use client";

import React, { useRef, useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  Sparkles,
  ArrowRight,
  Users,
  Zap,
  Calendar,
  Shield,
  Star,
  BookOpen,
  Globe,
  ChevronDown,
  Activity,
  Terminal,
} from "lucide-react";

// Dynamically import WebGL scenes to avoid SSR issues
const ParticleField = dynamic(() => import("../components/ParticleField"), {
  ssr: false,
});
const Dynamic3DScene = dynamic(() => import("../components/Dynamic3DScene"), {
  ssr: false,
});

/* ------------------------------------------------------------------ */
/*  Tilt Card — CSS 3D transform on mouse move                        */
/* ------------------------------------------------------------------ */
function TiltCard({
  children,
  className = "",
  borderColor = "rgba(255, 255, 255, 0.05)",
}: {
  children: React.ReactNode;
  className?: string;
  borderColor?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    const card = ref.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -6;
    const rotateY = ((x - centerX) / centerX) * 6;
    card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.01, 1.01, 1.01)`;
    card.style.borderColor = "rgba(255, 255, 255, 0.15)";
    card.style.boxShadow = "0 15px 35px rgba(0, 0, 0, 0.5)";
  };

  const handleMouseLeave = () => {
    const card = ref.current;
    if (!card) return;
    card.style.transform =
      "perspective(800px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)";
    card.style.borderColor = borderColor;
    card.style.boxShadow = "none";
  };

  return (
    <div
      ref={ref}
      className={className}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transformStyle: "preserve-3d",
        transition: "transform 0.2s cubic-bezier(0.25, 1, 0.5, 1), border-color 0.3s ease, box-shadow 0.3s ease",
        willChange: "transform",
        borderColor: borderColor,
      }}
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Scroll Fade In — appears on scroll                                */
/* ------------------------------------------------------------------ */
function FadeInSection({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0px)" : "translateY(30px)",
        transition: `opacity 0.8s cubic-bezier(0.25, 1, 0.5, 1) ${delay}ms, transform 0.8s cubic-bezier(0.25, 1, 0.5, 1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

/* ================================================================== */
/*  MAIN LANDING PAGE                                                 */
/* ================================================================== */
export default function LandingPage() {
  const [scrollY, setScrollY] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [featuresSectionProgress, setFeaturesSectionProgress] = useState(0);
  const [activeFeatureIndex, setActiveFeatureIndex] = useState(-1);
  const [activeSection, setActiveSection] = useState("hero");
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [uptime, setUptime] = useState(0);

  // Uptime ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setUptime((prev) => prev + 0.1);
    }, 100);
    return () => clearInterval(timer);
  }, []);

  // Global mouse position tracking
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Scroll tracking and active states
  useEffect(() => {
    const onScroll = () => {
      const currentScroll = window.scrollY;
      setScrollY(currentScroll);

      // Page progress
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? currentScroll / docHeight : 0;
      setScrollProgress(progress);

      // Section tracker
      const sectionIds = ["hero", "features", "stats", "how-it-works", "cta"];
      for (const id of sectionIds) {
        const el = document.getElementById(id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= window.innerHeight * 0.4 && rect.bottom >= window.innerHeight * 0.4) {
            setActiveSection(id);
            break;
          }
        }
      }

      // Features section scroll progress (sticky scroll timeline)
      const featuresEl = document.getElementById("features");
      if (featuresEl) {
        const rect = featuresEl.getBoundingClientRect();
        const sectionHeight = rect.height;
        const scrolledInSection = -rect.top;
        const featProgress = Math.min(Math.max(scrolledInSection / (sectionHeight - window.innerHeight), 0), 1);
        setFeaturesSectionProgress(featProgress);

        // Map scroll range to 6 features (index 0 to 5) or -1 if before/after
        if (rect.top <= 0 && rect.bottom > 0) {
          const index = Math.min(Math.floor(featProgress * 6), 5);
          setActiveFeatureIndex(index);
        } else {
          setActiveFeatureIndex(-1);
        }
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    // Trigger initially
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const heroParallax = scrollY * 0.25;
  const heroOpacity = Math.max(0, 1 - scrollY / 600);

  const features = [
    {
      icon: Zap,
      title: "AI-Powered Matching",
      desc: "Gemini AI indexes skill lists and student learning goals to surface highly compatible study partners automatically.",
      ref: "GEMINI_MATCH_V1",
    },
    {
      icon: Users,
      title: "Smart Directory",
      desc: "Browse study partners by technical skills, creative talents, or academic courses. Instantly filter by campus roles.",
      ref: "DIR_RESOLVER",
    },
    {
      icon: Calendar,
      title: "Session Scheduling",
      desc: "Coordinate and book study sessions with custom durations, automatic Google Meet generation, and calendar alerts.",
      ref: "TIME_DISPATCHER",
    },
    {
      icon: Star,
      title: "Reputation System",
      desc: "Build campus credentials with verified peer feedback, session ratings, and climb the public leaderboards.",
      ref: "REP_AGGREGATOR",
    },
    {
      icon: Shield,
      title: "Real-Time Alerts",
      desc: "Instant Socket.io web notifications coordinate request acceptances, chat replies, and session reminders.",
      ref: "ALERT_SOCKET_SRV",
    },
    {
      icon: BookOpen,
      title: "AI Study Guides",
      desc: "Automatically compile comprehensive, session-tailored markdown notes and reference material powered by Gemini AI.",
      ref: "GUIDE_COMPILER",
    },
  ];

  return (
    <div
      className="relative min-h-screen text-white select-none overflow-x-hidden font-sans"
      style={{
        backgroundColor: "#050508",
        backgroundImage: `
          linear-gradient(rgba(255, 255, 255, 0.01) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255, 255, 255, 0.01) 1px, transparent 1px)
        `,
        backgroundSize: "80px 80px",
        backgroundPosition: "center",
      }}
    >
      {/* ===== GLOBAL BACKGROUND PARTICLES ===== */}
      <ParticleField />

      {/* ===== CORNER TELEMETRY HUD (matveyan.com style) ===== */}
      <div className="fixed inset-0 z-40 pointer-events-none hidden lg:block">
        {/* Left vertical border guideline */}
        <div className="absolute left-16 top-0 bottom-0 w-[1px] bg-white/[0.03]" />
        {/* Right vertical border guideline */}
        <div className="absolute right-16 top-0 bottom-0 w-[1px] bg-white/[0.03]" />

        {/* Top Left */}
        <div className="absolute left-20 top-6 font-mono text-[9px] text-white/30 space-y-1">
          <div className="flex items-center gap-1.5">
            <Terminal className="w-3 h-3 text-white/50" />
            <span>SYS_NODE // SKILLSWAP_NET</span>
          </div>
          <div>VIEWPORT // {activeSection.toUpperCase()}</div>
        </div>

        {/* Top Right */}
        <div className="absolute right-20 top-6 font-mono text-[9px] text-white/30 text-right space-y-1">
          <div className="flex items-center justify-end gap-1.5">
            <Activity className="w-3 h-3 text-white/50 animate-pulse" />
            <span>STATUS // OPERATIONAL</span>
          </div>
          <div>UPTIME // {uptime.toFixed(1)}S</div>
        </div>

        {/* Bottom Left */}
        <div className="absolute left-20 bottom-6 font-mono text-[9px] text-white/30 space-y-1">
          <div>SCROLL_PCT // {(scrollProgress * 100).toFixed(2)}%</div>
          <div>INDEX_STATE // {activeFeatureIndex === -1 ? "NULL" : `0${activeFeatureIndex + 1}`}</div>
        </div>

        {/* Bottom Right */}
        <div className="absolute right-20 bottom-6 font-mono text-[9px] text-white/30 text-right space-y-1">
          <div>MOUSE_X // {mousePos.x}PX</div>
          <div>MOUSE_Y // {mousePos.y}PX</div>
        </div>
      </div>

      {/* ===== NAVBAR ===== */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b border-transparent"
        style={{
          backdropFilter: scrollY > 40 ? "blur(16px)" : "none",
          backgroundColor: scrollY > 40 ? "rgba(5, 5, 8, 0.85)" : "transparent",
          borderBottomColor: scrollY > 40 ? "rgba(255, 255, 255, 0.05)" : "transparent",
        }}
      >
        <div className="mx-auto max-w-[90rem] px-6 md:px-12 lg:px-20">
          <div className="flex items-center justify-between h-20">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-8 h-8 rounded border border-white/20 flex items-center justify-center bg-white/[0.02]">
                <Sparkles className="w-3.5 h-3.5 text-white/80" />
              </div>
              <span className="text-md font-bold tracking-tight text-white font-mono">
                SKILLSWAP // PROT
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-10">
              {["Features", "How It Works", "Stats"].map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase().replace(/\s+/g, "-")}`}
                  className="text-[11px] font-mono tracking-wider uppercase text-white/50 hover:text-white transition-colors duration-300 relative group"
                >
                  {item}
                  <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-white/40 group-hover:w-full transition-all duration-300" />
                </a>
              ))}
              <Link
                href="/sign-in"
                className="px-4 py-2 rounded text-[11px] font-mono tracking-wider uppercase text-white/70 border border-white/15 bg-white/[0.02] hover:bg-white/[0.07] hover:text-white transition-all duration-300"
              >
                Sign In
              </Link>
              <Link
                href="/dashboard"
                className="px-4 py-2 rounded text-[11px] font-mono tracking-wider uppercase text-black bg-white hover:bg-white/90 transition-all duration-300"
              >
                Open Dashboard
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ===== HERO SECTION ===== */}
      <section
        id="hero"
        className="relative min-h-screen flex flex-col items-center justify-center pt-20"
      >
        <div
          className="relative z-10 text-center px-6 max-w-5xl mx-auto"
          style={{
            transform: `translateY(${heroParallax}px)`,
            opacity: heroOpacity,
          }}
        >
          {/* Tag badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded border border-white/10 bg-white/[0.02] mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-white/60 animate-pulse" />
            <span className="text-[10px] font-mono text-white/50 uppercase tracking-widest">
              PEER-TO-PEER KNOWLEDGE NETWORK
            </span>
          </div>

          {/* Huge Professional Title */}
          <h1 className="text-[clamp(2.5rem,7vw,6.5rem)] font-extrabold tracking-tight text-white mb-6 uppercase leading-[0.95]">
            Exchange Knowledge.
            <br />
            <span className="text-white/40">Grow Together.</span>
          </h1>

          {/* Subtitle */}
          <p className="text-sm md:text-md text-white/40 max-w-xl mx-auto leading-relaxed mb-12">
            A minimal, decentralized skill exchange platform built for college campus
            collaboration. List expertise, schedule sessions, and trade knowledge directly with peers.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/sign-in"
              className="group px-7 py-3.5 rounded text-[11px] font-mono tracking-widest uppercase text-black bg-white flex items-center gap-2 hover:bg-white/90 transition-all duration-300"
            >
              Start Swapping
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-300" />
            </Link>
            <Link
              href="/browse"
              className="px-7 py-3.5 rounded text-[11px] font-mono tracking-widest uppercase text-white/60 border border-white/10 bg-white/[0.01] hover:bg-white/[0.05] hover:text-white transition-all duration-300"
            >
              Explore Peers
            </Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1.5 opacity-40">
          <span className="text-[9px] font-mono text-white tracking-widest uppercase">
            Scroll
          </span>
          <ChevronDown className="w-4 h-4 text-white animate-bounce" />
        </div>
      </section>

      {/* ===== FEATURES SHOWCASE (STICKY TIMELINE) ===== */}
      <section
        id="features"
        className="relative"
        style={{ height: "450vh" }}
      >
        <div className="sticky top-0 h-screen w-full flex items-center overflow-hidden">
          <div className="mx-auto max-w-[90rem] w-full px-6 md:px-12 lg:px-20 grid grid-cols-1 lg:grid-cols-12 gap-12 relative z-10">
            
            {/* Left Column: Text Panel (sticky viewport) */}
            <div className="lg:col-span-5 flex flex-col justify-center min-h-[40vh] lg:min-h-0 relative pr-4">
              <span className="text-[10px] font-mono tracking-[0.2em] mb-4 text-white/30 uppercase">
                WHY SKILLSWAP // CAPABILITIES
              </span>
              <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight leading-[1.08] mb-12 uppercase">
                A Unified Campus Ecosystem
              </h2>

              <div className="relative h-60 w-full">
                {features.map((f, idx) => {
                  const isActive = idx === activeFeatureIndex;
                  return (
                    <div
                      key={idx}
                      className="absolute inset-x-0 top-0 flex flex-col justify-start transition-all duration-500 ease-out"
                      style={{
                        opacity: isActive ? 1 : 0,
                        transform: isActive ? "translateY(0)" : "translateY(25px)",
                        pointerEvents: isActive ? "auto" : "none",
                      }}
                    >
                      <div className="flex items-center gap-4 mb-4">
                        <span className="font-mono text-xs text-white/30">0{idx + 1} //</span>
                        <div className="p-2.5 rounded border border-white/10 bg-white/[0.02]">
                          <f.icon className="w-4 h-4 text-white/80" />
                        </div>
                        <h3 className="text-lg font-bold text-white uppercase tracking-tight">
                          {f.title}
                        </h3>
                      </div>
                      <p className="text-[13px] text-white/40 leading-relaxed">
                        {f.desc}
                      </p>
                      <div className="mt-6 flex gap-3">
                        <span className="text-[9px] font-mono text-white/30 uppercase border border-white/5 px-2.5 py-1 rounded bg-white/[0.01]">
                          MODULE: {f.ref}
                        </span>
                        <span className="text-[9px] font-mono text-white/30 uppercase border border-white/5 px-2.5 py-1 rounded bg-white/[0.01]">
                          STATUS // READY
                        </span>
                      </div>
                    </div>
                  );
                })}
                {/* Fallback default state */}
                {activeFeatureIndex === -1 && (
                  <div className="absolute inset-x-0 top-0 flex flex-col justify-start opacity-100">
                    <div className="flex items-center gap-4 mb-4">
                      <span className="font-mono text-xs text-white/30">00 //</span>
                      <div className="p-2.5 rounded border border-white/10 bg-white/[0.02]">
                        <Globe className="w-4 h-4 text-white/40" />
                      </div>
                      <h3 className="text-lg font-bold text-white/40 uppercase tracking-tight">
                        Scroll to inspect
                      </h3>
                    </div>
                    <p className="text-[13px] text-white/30 leading-relaxed italic">
                      Scroll slowly to rotate and morph the WebGL interactive core, exploring our key engineering features in real time.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: WebGL Interactive Showcase */}
            <div className="lg:col-span-7 h-[45vh] lg:h-[65vh] flex items-center justify-center relative">
              <div className="w-full h-full rounded border border-white/[0.03] bg-gradient-to-b from-white/[0.01] to-transparent relative overflow-hidden flex items-center justify-center">
                {/* HUD borders inside showcase viewport */}
                <div className="absolute top-4 left-4 font-mono text-[8px] text-white/20">
                  SHAPE_RENDER // FEAT_{activeFeatureIndex === -1 ? "IDLE" : activeFeatureIndex}
                </div>
                <div className="absolute bottom-4 right-4 font-mono text-[8px] text-white/20">
                  REF_SCALE // 1.00
                </div>
                
                {/* Core WebGL interactive rendering */}
                <Dynamic3DScene
                  activeFeatureIndex={activeFeatureIndex}
                  scrollProgress={featuresSectionProgress}
                />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ===== STATS BAND ===== */}
      <section
        id="stats"
        className="relative py-28 border-t border-b border-white/[0.03]"
      >
        <div className="max-w-[90rem] mx-auto px-6 md:px-12 lg:px-20">
          <FadeInSection>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-12 md:gap-6">
              {[
                { value: "8+", label: "Skill Categories" },
                { value: "100%", label: "Zero Session Cost" },
                { value: "AI", label: "Powered Discovery" },
                { value: "24/7", label: "Real-Time Updates" },
              ].map((s, i) => (
                <div key={i} className="text-center">
                  <div className="text-4xl md:text-5xl font-extrabold tracking-tight text-white">
                    {s.value}
                  </div>
                  <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest mt-3">
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
          </FadeInSection>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section
        id="how-it-works"
        className="relative py-32 px-6 md:px-12 lg:px-20"
      >
        <div className="max-w-[90rem] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            
            {/* Left: Progression Timeline */}
            <div className="space-y-10">
              <FadeInSection>
                <span className="text-[10px] font-mono uppercase tracking-[0.2em] block mb-4 text-white/30">
                  PROTOCOL // TIMELINE
                </span>
                <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight uppercase leading-[1.08]">
                  Three simple steps
                  <br />
                  <span className="text-white/40">to your first swap</span>
                </h2>
              </FadeInSection>

              {[
                {
                  step: "01",
                  title: "List Your Skills",
                  desc: "Declare the fields you want to teach and what you aim to learn. Our indexing scanner maps your profile parameters.",
                },
                {
                  step: "02",
                  title: "Pair With Campus Peers",
                  desc: "Navigate our smart listing directory or trust Gemini AI to recommend high-compatibility matches matching your parameters.",
                },
                {
                  step: "03",
                  title: "Coordinate & Meet",
                  desc: "Send swap requests, schedule automatic Google Meet coordinates, and begin mutual knowledge exchange.",
                },
              ].map((item, i) => (
                <FadeInSection key={i} delay={i * 100}>
                  <div className="group flex gap-6 items-start p-5 rounded border border-transparent hover:border-white/[0.04] hover:bg-white/[0.01] transition-all duration-300">
                    <div className="text-2xl font-mono text-white/20 group-hover:text-white/50 transition-colors duration-300 shrink-0 w-12 tabular-nums">
                      {item.step} //
                    </div>
                    <div>
                      <h3 className="text-md font-bold text-white mb-2 uppercase tracking-tight">
                        {item.title}
                      </h3>
                      <p className="text-[13px] text-white/40 leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                </FadeInSection>
              ))}
            </div>

            {/* Right: Modern 3D Interactive Card Stack (No gradients) */}
            <FadeInSection delay={150}>
              <div className="relative flex items-center justify-center">
                <div className="absolute w-[300px] h-[300px] rounded-full blur-[120px] pointer-events-none bg-white/[0.02]" />

                <div className="relative space-y-4 w-full max-w-sm">
                  {[
                    {
                      name: "Alex Chen",
                      school: "Stanford",
                      match: 95,
                      skills: ["React", "TypeScript", "Next.js"],
                    },
                    {
                      name: "Sofia Martinez",
                      school: "MIT",
                      match: 87,
                      skills: ["Figma", "UI/UX", "Tailwind"],
                      offset: "ml-6",
                    },
                    {
                      name: "Carlos Rivera",
                      school: "UCLA",
                      match: 80,
                      skills: ["Guitar", "Spanish", "Acoustics"],
                    },
                  ].map((card, i) => (
                    <TiltCard
                      key={i}
                      className={`rounded border border-white/5 bg-white/[0.02] p-6 backdrop-blur-md ${card.offset || ""}`}
                    >
                      <div className="flex items-center gap-3.5 mb-4">
                        <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-xs font-mono font-bold border border-white/10">
                          {card.name[0]}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white uppercase font-mono tracking-tight">
                            {card.name}
                          </div>
                          <div className="text-[9px] text-white/35 font-mono">
                            {card.school.toUpperCase()} // MATCH: {card.match}%
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {card.skills.map((skill) => (
                          <span
                            key={skill}
                            className="text-[9px] font-mono px-2 py-0.5 rounded border border-white/5 bg-white/[0.01] text-white/50"
                          >
                            {skill.toUpperCase()}
                          </span>
                        ))}
                      </div>
                    </TiltCard>
                  ))}
                </div>
              </div>
            </FadeInSection>
          </div>
        </div>
      </section>

      {/* ===== CTA SECTION ===== */}
      <section
        id="cta"
        className="relative py-36 px-6 overflow-hidden border-t border-white/[0.03]"
      >
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[450px] h-[450px] rounded-full blur-[140px] bg-white/[0.015]" />
        </div>

        <FadeInSection>
          <div className="relative z-10 max-w-3xl mx-auto text-center space-y-6">
            <Globe className="w-10 h-10 mx-auto text-white/30" />
            <h2 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight uppercase leading-[1.05]">
              Ready to swap
              <br />
              <span className="text-white/40">your first skill?</span>
            </h2>
            <p className="text-[13px] text-white/40 max-w-sm mx-auto leading-relaxed pb-4">
              Join a high-performance network reshaping collaboration across campuses. Zero financial overhead. Just pure knowledge transfer.
            </p>
            <Link
              href="/sign-in"
              className="group inline-flex px-8 py-3.5 rounded text-[11px] font-mono tracking-widest uppercase text-black bg-white items-center gap-2 hover:bg-white/90 transition-all duration-300"
            >
              Get Started Free
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-300" />
            </Link>
          </div>
        </FadeInSection>
      </section>

      {/* ===== FOOTER ===== */}
      <footer
        className="py-16 px-6 md:px-12 lg:px-20 border-t border-white/[0.03]"
        style={{ backgroundColor: "#030305" }}
      >
        <div className="max-w-[90rem] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="md:col-span-2 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded border border-white/20 flex items-center justify-center bg-white/[0.02]">
                  <Sparkles className="w-3.5 h-3.5 text-white/80" />
                </div>
                <span className="text-sm font-bold text-white font-mono uppercase tracking-tight">
                  SKILLSWAP // TECH
                </span>
              </div>
              <p className="text-[12px] text-white/30 leading-relaxed max-w-xs">
                A secure, decentralized peer-to-peer index network built to facilitate zero-cost collaborative student instruction.
              </p>
            </div>

            <div>
              <h4 className="text-[10px] font-mono text-white/40 uppercase tracking-widest mb-4">
                Platform
              </h4>
              <ul className="space-y-2.5">
                {["Dashboard", "Browse Peers", "Sessions", "Leaderboard"].map(
                  (link) => (
                    <li key={link}>
                      <Link
                        href={`/${link.toLowerCase().replace(/\s+/g, "-")}`}
                        className="text-[12px] text-white/45 hover:text-white transition-colors duration-300 font-mono text-xs uppercase"
                      >
                        {link}
                      </Link>
                    </li>
                  )
                )}
              </ul>
            </div>

            <div>
              <h4 className="text-[10px] font-mono text-white/40 uppercase tracking-widest mb-4">
                Technology
              </h4>
              <ul className="space-y-2.5">
                {["Next.js 16", "Gemini 3.5 AI", "MongoDB Atlas", "Socket.io Core"].map(
                  (item) => (
                    <li key={item}>
                      <span className="text-[12px] text-white/35 font-mono text-xs">{item.toUpperCase()}</span>
                    </li>
                  )
                )}
              </ul>
            </div>
          </div>

          <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 border-t border-white/[0.03]">
            <span className="text-[10px] font-mono text-white/20">
              © 2026 SKILLSWAP. SYSTEM INDEX ONLINE.
            </span>
            <div className="flex items-center gap-6">
              <span className="text-[10px] font-mono text-white/20 hover:text-white/40 cursor-pointer">PRIVACY_PROT</span>
              <span className="text-[10px] font-mono text-white/20 hover:text-white/40 cursor-pointer">TERMS_COND</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
