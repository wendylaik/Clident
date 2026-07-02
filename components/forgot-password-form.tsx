"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";

type Step = "email" | "code" | "password";

const Logo = () => (
  <div className="flex items-center gap-2 mb-8">
    <Image
      src="/images/logo-clinica.png"
      alt="Clident - Clínica Dental"
      width={50}
      height={30}
      className="object-contain"
    />
    <div>
      <p className="text-sm font-semibold leading-none text-[#283A97]">Clident</p>
      <p className="text-[10px] uppercase tracking-widest text-[#7C86B8]">Clínica Dental</p>
    </div>
  </div>
);

const inputClass = "rounded-lg border border-[#D7DEF2] bg-white px-4 py-2.5 text-sm text-[#1F2937] placeholder:text-[#9CA3AF] focus:border-[#00C2F3] focus:outline-none focus:ring-2 focus:ring-[#00C2F3]/30 w-full";
const buttonClass = "rounded-lg bg-[#283A97] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#1F2D75] disabled:opacity-60 w-full";

export function ForgotPasswordForm() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/send-recovery-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Ocurrió un error inesperado");

      setStep("code");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Ocurrió un error inesperado");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/verify-recovery-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Ocurrió un error inesperado");

      setStep("password");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Ocurrió un error inesperado");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (password !== repeatPassword) {
      setError("Las contraseñas no coinciden");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/update-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Ocurrió un error inesperado");

      router.push("/auth/login?contrasena=actualizada");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Ocurrió un error inesperado");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-[#F1F4FA] p-6">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-sm">
        <div className="p-8 md:p-10">
          <Logo />

          {/* Step indicators */}
          <div className="flex items-center gap-2 mb-8">
            {(["email", "code", "password"] as Step[]).map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                  step === s
                    ? "bg-[#283A97] text-white"
                    : ["email", "code", "password"].indexOf(step) > i
                    ? "bg-[#00C2F3] text-white"
                    : "bg-[#E5E7EB] text-[#9CA3AF]"
                }`}>
                  {["email", "code", "password"].indexOf(step) > i ? "✓" : i + 1}
                </div>
                {i < 2 && <div className={`h-px flex-1 w-8 transition-colors ${
                  ["email", "code", "password"].indexOf(step) > i ? "bg-[#00C2F3]" : "bg-[#E5E7EB]"
                }`} />}
              </div>
            ))}
          </div>

          {/* Step 1 — Email */}
          {step === "email" && (
            <div>
              <h2 className="text-2xl font-semibold text-[#283A97]">Recuperar contraseña</h2>
              <p className="mt-1 text-sm text-[#6B7280]">
                Ingrese su correo y le enviaremos un código de verificación.
              </p>
              <form onSubmit={handleSendCode} className="mt-8 flex flex-col gap-5">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="email" className="text-sm font-medium text-[#283A97]">
                    Correo electrónico
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    placeholder="ejemplo@clident.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputClass}
                  />
                </div>
                {error && <p className="text-sm text-[#E45C3C]">{error}</p>}
                <button type="submit" disabled={isLoading} className={buttonClass}>
                  {isLoading ? "Enviando código..." : "Enviar código de verificación"}
                </button>
              </form>
              <p className="mt-6 text-center text-sm text-[#6B7280]">
                ¿Recordó su contraseña?{" "}
                <Link href="/auth/login" className="font-medium text-[#283A97] hover:underline">
                  Iniciar sesión
                </Link>
              </p>
            </div>
          )}

          {/* Step 2 — Code */}
          {step === "code" && (
            <div>
              <h2 className="text-2xl font-semibold text-[#283A97]">Verificar código</h2>
              <p className="mt-1 text-sm text-[#6B7280]">
                Ingrese el código de 6 dígitos que enviamos a su correo. Expira en 10 minutos.
              </p>
              <form onSubmit={handleVerifyCode} className="mt-8 flex flex-col gap-5">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="code" className="text-sm font-medium text-[#283A97]">
                    Código de verificación
                  </label>
                  <input
                    id="code"
                    type="text"
                    required
                    maxLength={6}
                    placeholder="000000"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                    className={`${inputClass} text-center text-2xl tracking-widest font-semibold`}
                  />
                </div>
                {error && <p className="text-sm text-[#E45C3C]">{error}</p>}
                <button type="submit" disabled={isLoading} className={buttonClass}>
                  {isLoading ? "Verificando..." : "Verificar código"}
                </button>
                <button
                  type="button"
                  onClick={() => { setStep("email"); setError(null); setCode(""); }}
                  className="text-sm text-[#6B7280] hover:text-[#283A97] transition-colors"
                >
                  ¿No recibió el código? Solicitar uno nuevo
                </button>
              </form>
            </div>
          )}

          {/* Step 3 — New password */}
          {step === "password" && (
            <div>
              <h2 className="text-2xl font-semibold text-[#283A97]">Nueva contraseña</h2>
              <p className="mt-1 text-sm text-[#6B7280]">
                Ingrese su nueva contraseña. Debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número.
              </p>
              <form onSubmit={handleUpdatePassword} className="mt-8 flex flex-col gap-5">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="password" className="text-sm font-medium text-[#283A97]">
                    Nueva contraseña
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={inputClass}
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
                  <label htmlFor="repeat-password" className="text-sm font-medium text-[#283A97]">
                    Confirmar contraseña
                  </label>
                  <input
                    id="repeat-password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={repeatPassword}
                    onChange={(e) => setRepeatPassword(e.target.value)}
                    className={inputClass}
                  />
                </div>
                {error && <p className="text-sm text-[#E45C3C]">{error}</p>}
                <button type="submit" disabled={isLoading} className={buttonClass}>
                  {isLoading ? "Actualizando..." : "Actualizar contraseña"}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}