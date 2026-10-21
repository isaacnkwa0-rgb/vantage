"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/ui/Logo";

const COLORS = ["#F2542D", "#B8320F", "#FFC93C", "#FFF6EC", "#16130F", "#F87A52", "#FBBCAA", "#FDDDD4", "#FDE3D9", "#3A322B", "#7B5E4E", "#9E7B69"];

function Confetti() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    type Particle = {
      x: number; y: number;
      vx: number; vy: number;
      color: string;
      shape: "rect" | "circle" | "ribbon";
      w: number; h: number;
      rotation: number;
      rotationSpeed: number;
      opacity: number;
    };

    const particles: Particle[] = Array.from({ length: 120 }, () => {
      const angle = Math.random() * Math.PI * 2;
      const speed = 6 + Math.random() * 10;
      const shape = (["rect", "circle", "ribbon"] as const)[Math.floor(Math.random() * 3)];
      return {
        x: canvas.width / 2,
        y: canvas.height * 0.42,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 8,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        shape,
        w: 6 + Math.random() * 8,
        h: shape === "ribbon" ? 14 + Math.random() * 10 : 6 + Math.random() * 8,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.25,
        opacity: 1,
      };
    });

    let raf: number;
    function draw() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;
      for (const p of particles) {
        if (p.opacity <= 0) continue;
        alive = true;
        p.vy += 0.35;
        p.vx *= 0.99;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;
        if (p.y > canvas.height * 0.75) p.opacity -= 0.03;

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.opacity);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        if (p.shape === "circle") {
          ctx.beginPath();
          ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        }
        ctx.restore();
      }
      if (alive) raf = requestAnimationFrame(draw);
    }

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-10"
    />
  );
}

function SuccessPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [slug, setSlug] = useState(params.get("slug") ?? "");

  useEffect(() => {
    if (slug) return;
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase
        .from("businesses")
        .select("slug")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single()
        .then(({ data }) => { if (data?.slug) setSlug(data.slug); });
    });
  }, [slug]);

  async function handleExplore() {
    let destination = slug;
    if (!destination) {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("businesses")
          .select("slug")
          .eq("owner_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();
        destination = data?.slug ?? "";
      }
    }
    router.push(destination ? `/${destination}/dashboard` : "/dashboard");
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-6 relative overflow-hidden">
      <Confetti />

      <div className="w-full max-w-sm flex flex-col items-center text-center relative z-20">
        <style>{`
          @keyframes pop-in {
            0%   { transform: scale(0) rotate(-15deg); opacity: 0; }
            65%  { transform: scale(1.2) rotate(5deg); opacity: 1; }
            100% { transform: scale(1) rotate(0deg); opacity: 1; }
          }
          @keyframes float-loop {
            0%,100% { transform: translateY(0px); }
            50%      { transform: translateY(-8px); }
          }
          .popper-anim { animation: pop-in 0.6s cubic-bezier(.34,1.56,.64,1) 0.1s both; }
          .float-loop  { animation: float-loop 3s ease-in-out 0.8s infinite; }
          @keyframes fade-up {
            from { opacity: 0; transform: translateY(16px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          .fade-up-1 { animation: fade-up 0.5s ease-out 0.5s both; }
          .fade-up-2 { animation: fade-up 0.5s ease-out 0.7s both; }
          .fade-up-3 { animation: fade-up 0.5s ease-out 0.9s both; }
        `}</style>

        <div className="fade-up-1 mb-4">
          <Logo variant="full" size={36} />
        </div>

        <div className="popper-anim float-loop mb-6 text-[80px] leading-none select-none">
          🎉
        </div>

        <h1 className="fade-up-1 text-[22px] font-bold text-slate-900 leading-snug mb-3">
          You&apos;re all set!
        </h1>

        <p className="fade-up-2 text-slate-500 text-[14px] leading-relaxed mb-10">
          Your 14-day free trial has started. Start managing your business smarter with Stokka.
        </p>

        <button
          onClick={handleExplore}
          className="fade-up-3 w-full h-11 bg-primary hover:bg-ember-deep text-on-primary font-bold rounded-[4px] text-[15px] transition"
        >
          Start Exploring
        </button>
      </div>
    </div>
  );
}

export default function SuccessPageWrapper() {
  return (
    <Suspense>
      <SuccessPage />
    </Suspense>
  );
}
