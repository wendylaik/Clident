"use client";

import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const justRegistered = searchParams.get("registrado") === "true";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      router.push("/protected");
    } catch {
      setError("Correo o contraseña incorrectos");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-[#F1F4FA] p-6">
      <div className="flex w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-sm">
        {/* Left panel — brand presence */}
        <div className="hidden w-1/2 flex-col justify-between bg-[#283A97] p-10 text-white md:flex">
          <div>
            <div className="flex items-center gap-2">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                className="shrink-0"
              >
                <path
                  d="M12 3C9 3 6.5 4.5 6 7c-.4 2 .3 4 .8 6 .4 1.7.7 4.3 1.7 6.2.4.8 1.6.8 2-.1.5-1.2.8-3 1.5-3 .7 0 1 1.8 1.5 3 .4.9 1.6.9 2 .1 1-1.9 1.3-4.5 1.7-6.2.5-2 1.2-4 .8-6-.5-2.5-3-4-6-4Z"
                  fill="#FFFFFF"
                />
                <path
                  d="M9 8c.8-.8 2-1 3-.2.8-.8 2.2-.6 3 .2.8.9.6 2.3-.4 3.2L12 13.5l-2.6-2.3c-1-.9-1.2-2.3-.4-3.2Z"
                  fill="#00C2F3"
                />
              </svg>
              <div>
                <p className="font-[var(--font-display)] text-lg leading-none">
                  Clident
                </p>
                <p className="text-[10px] uppercase tracking-[0.18em] text-[#9FB3E8]">
                  Sonríale a la vida
                </p>
              </div>
            </div>

            <h1 className="mt-12 font-[var(--font-display)] text-2xl leading-snug">
              Bienvenido a su clínica dental de confianza
            </h1>
            <p className="mt-3 max-w-sm text-sm text-[#C7D3F0]">
              Gestione sus citas, acceda a su historial médico y descubra una
              nueva forma de cuidar su sonrisa con la precisión de Golfito.
            </p>
          </div>

          <div className="rounded-xl border border-white/15 bg-white/5 p-5">
            <p className="text-sm text-[#C7D3F0]">
              &ldquo;Sonríale a la vida&rdquo; — Dra. Maureen Téllez Durán
            </p>
          </div>
        </div>

        {/* Right panel — form */}
        <div className="flex w-full flex-col justify-center p-8 md:w-1/2 md:p-12">
          <h2 className="font-[var(--font-display)] text-2xl text-[#283A97]">
            Iniciar sesión
          </h2>
          <p className="mt-1 text-sm text-[#6B7280]">
            Ingrese sus credenciales para acceder a su portal privado.
          </p>

          {justRegistered && (
            <div className="mt-4 rounded-lg border border-[#A8E6C1] bg-[#EFFBF3] px-4 py-2.5 text-sm text-[#1B7A41]">
              Su cuenta fue creada exitosamente. Ya puede iniciar sesión.
            </div>
          )}

          <form onSubmit={handleLogin} className="mt-8 flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="email"
                className="text-sm font-medium text-[#283A97]"
              >
                Correo electrónico
              </label>
              <input
                id="email"
                type="email"
                required
                placeholder="ejemplo@clident.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-lg border border-[#D7DEF2] bg-white px-4 py-2.5 text-sm text-[#1F2937] placeholder:text-[#9CA3AF] focus:border-[#00C2F3] focus:outline-none focus:ring-2 focus:ring-[#00C2F3]/30"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="text-sm font-medium text-[#283A97]"
                >
                  Contraseña
                </label>
                <Link
                  href="/auth/forgot-password"
                  className="text-xs text-[#00A8D8] hover:underline"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-[#D7DEF2] bg-white px-4 py-2.5 text-sm text-[#1F2937] focus:border-[#00C2F3] focus:outline-none focus:ring-2 focus:ring-[#00C2F3]/30"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#9CA3AF] hover:text-[#283A97]"
                >
                  {showPassword ? "Ocultar" : "Mostrar"}
                </button>
              </div>
            </div>

            {error && <p className="text-sm text-[#E45C3C]">{error}</p>}

            <button
              type="submit"
              disabled={isLoading}
              className="mt-1 rounded-lg bg-[#283A97] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#1F2D75] disabled:opacity-60"
            >
              {isLoading ? "Ingresando..." : "Ingresar"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-[#6B7280]">
            ¿Es su primera visita?{" "}
            <Link
              href="/auth/sign-up"
              className="font-medium text-[#283A97] hover:underline"
            >
              Registrarse como paciente
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
