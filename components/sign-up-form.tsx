"use client";

import { registerPatient } from "@/lib/functions/register-patient";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function SignUpForm() {
  const [fullName, setFullName] = useState("");
  const [cedula, setCedula] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (password !== repeatPassword) {
      setError("Las contraseñas no coinciden");
      setIsLoading(false);
      return;
    }

    const result = await registerPatient({
      email,
      password,
      fullName,
      cedula,
      birthDate,
      phone,
    });

    if (!result.success) {
      setError(result.error ?? "Ocurrió un error al registrarse");
      setIsLoading(false);
      return;
    }

    router.push("/auth/login?registrado=true");
  };

  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-[#F1F4FA] p-6">
      <div className="flex w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-sm">
        {/* Left panel — brand presence */}
        <div
          className="relative hidden w-1/2 flex-col justify-between overflow-hidden p-10 text-white md:flex"
          style={{
            backgroundImage: "url('/images/Dental-Cavities.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-[#0E1A4D]/90 via-[#0E1A4D]/70 to-[#0E1A4D]/95" />

          <div className="relative z-10">
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
                  Clínica dental
                </p>
              </div>
            </div>

            <h1 className="mt-12 font-[var(--font-display)] text-2xl leading-snug">
              Bienvenido a su nueva experiencia dental
            </h1>
            <div className="mt-3 h-px w-12 bg-[#00C2F3]" />
            <p className="mt-4 max-w-sm text-sm text-[#C7D3F0]">
              Únase a los pacientes de Golfito que confían en la Dra. Maureen
              Téllez Durán para su salud bucal.
            </p>
          </div>

          <p className="relative z-10 text-sm italic text-[#9FB3E8]">
            &ldquo;Sonríale a la vida&rdquo;
          </p>
        </div>

        {/* Right panel — form */}
        <div className="flex w-full flex-col justify-center p-8 md:w-1/2 md:p-12">
          <h2 className="font-[var(--font-display)] text-2xl text-[#283A97]">
            Crear cuenta nueva
          </h2>
          <p className="mt-1 text-sm text-[#6B7280]">
            Complete los datos para registrar su perfil de paciente.
          </p>

          <form onSubmit={handleSignUp} className="mt-6 flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 flex flex-col gap-1.5">
                <label
                  htmlFor="full-name"
                  className="text-sm font-medium text-[#283A97]"
                >
                  Nombre completo
                </label>
                <input
                  id="full-name"
                  type="text"
                  required
                  placeholder="Ej: Juan Pérez"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="rounded-lg border border-[#D7DEF2] bg-white px-4 py-2.5 text-sm text-[#1F2937] placeholder:text-[#9CA3AF] focus:border-[#00C2F3] focus:outline-none focus:ring-2 focus:ring-[#00C2F3]/30"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="cedula"
                  className="text-sm font-medium text-[#283A97]"
                >
                  Cédula de identidad
                </label>
                <input
                  id="cedula"
                  type="text"
                  required
                  placeholder="0-0000-0000"
                  value={cedula}
                  onChange={(e) => setCedula(e.target.value)}
                  className="rounded-lg border border-[#D7DEF2] bg-white px-4 py-2.5 text-sm text-[#1F2937] placeholder:text-[#9CA3AF] focus:border-[#00C2F3] focus:outline-none focus:ring-2 focus:ring-[#00C2F3]/30"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="birth-date"
                  className="text-sm font-medium text-[#283A97]"
                >
                  Fecha de nacimiento
                </label>
                <input
                  id="birth-date"
                  type="date"
                  required
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="rounded-lg border border-[#D7DEF2] bg-white px-4 py-2.5 text-sm text-[#1F2937] focus:border-[#00C2F3] focus:outline-none focus:ring-2 focus:ring-[#00C2F3]/30"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="phone"
                  className="text-sm font-medium text-[#283A97]"
                >
                  Teléfono
                </label>
                <input
                  id="phone"
                  type="tel"
                  required
                  placeholder="+506 8888-8888"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="rounded-lg border border-[#D7DEF2] bg-white px-4 py-2.5 text-sm text-[#1F2937] placeholder:text-[#9CA3AF] focus:border-[#00C2F3] focus:outline-none focus:ring-2 focus:ring-[#00C2F3]/30"
                />
              </div>

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
                  placeholder="nombre@correo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-lg border border-[#D7DEF2] bg-white px-4 py-2.5 text-sm text-[#1F2937] placeholder:text-[#9CA3AF] focus:border-[#00C2F3] focus:outline-none focus:ring-2 focus:ring-[#00C2F3]/30"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="password"
                  className="text-sm font-medium text-[#283A97]"
                >
                  Contraseña
                </label>
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

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="repeat-password"
                  className="text-sm font-medium text-[#283A97]"
                >
                  Confirmar contraseña
                </label>
                <input
                  id="repeat-password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={repeatPassword}
                  onChange={(e) => setRepeatPassword(e.target.value)}
                  className="rounded-lg border border-[#D7DEF2] bg-white px-4 py-2.5 text-sm text-[#1F2937] focus:border-[#00C2F3] focus:outline-none focus:ring-2 focus:ring-[#00C2F3]/30"
                />
              </div>
            </div>

            {error && <p className="text-sm text-[#E45C3C]">{error}</p>}

            <button
              type="submit"
              disabled={isLoading}
              className="mt-1 rounded-lg bg-[#283A97] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#1F2D75] disabled:opacity-60"
            >
              {isLoading ? "Registrando..." : "Registrarme"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-[#6B7280]">
            ¿Ya es paciente de Clident?{" "}
            <Link
              href="/auth/login"
              className="font-medium text-[#283A97] hover:underline"
            >
              Iniciar sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}