"use client";

import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import Image from "next/image";

/**
 * Formulario de inicio de sesión del sistema Clident.
 * Autentica al usuario con Supabase Auth, verifica que su cuenta esté activa
 * y redirige al dashboard correspondiente según su rol.
 * Muestra mensajes informativos si el usuario llegó desde el registro
 * o desde la recuperación de contraseña.
 */
export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const justRegistered = searchParams.get("registrado") === "true";
  const passwordUpdated = searchParams.get("contrasena") === "actualizada";

/**
 * Maneja el inicio de sesión del usuario.
 * Verifica credenciales, valida que la cuenta esté activa y redirige
 * al dashboard del rol correspondiente: /admin, /dentist o /patient.
 * Si la cuenta está desactivada o el rol no es reconocido, cierra la sesión
 * y muestra un mensaje de error.
 */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({ email, password });

      if (authError) throw authError;

      const { data: usuario, error: usuarioError } = await supabase
        .from("usuario")
        .select("rol, es_activo")
        .eq("id", authData.user.id)
        .single();

      if (usuarioError || !usuario) {
        await supabase.auth.signOut();
        throw new Error("No se encontró un perfil asociado a este usuario. Contacte al administrador.");
      }

      if (!usuario.es_activo) {
        await supabase.auth.signOut();
        throw new Error("Su cuenta está desactivada. Contacte al administrador.");
      }

      if (usuario.rol === "administrador") router.push("/admin");
      else if (usuario.rol === "odontologo") router.push("/dentist");
      else if (usuario.rol === "paciente") router.push("/patient");
      else {
        await supabase.auth.signOut();
        throw new Error("Rol no reconocido. Contacte al administrador.");
      }

    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Correo o contraseña incorrectos");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-[#F1F4FA] p-6">
      <div className="flex w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-sm">
        <div className="hidden w-1/2 flex-col justify-between bg-[#F4F5F8] p-10 md:flex">
          <div>
            <div className="flex items-center gap-2">
              <Image
                src="/images/logo-clinica.png"
                alt="Clident - Clínica Dental"
                width={60}
                height={30}
                className="object-contain"
              />
              <div>
                <p className="font-[var(--font-display)] text-lg leading-none text-[#283A97]">
                  Clident
                </p>
                <p className="text-[10px] uppercase tracking-[0.18em] text-[#7C86B8]">
                  Sonríale a la vida
                </p>
              </div>
            </div>

            <h1 className="mt-12 font-[var(--font-display)] text-2xl leading-snug text-[#283A97]">
              Bienvenido a su clínica dental de confianza
            </h1>
            <p className="mt-3 max-w-sm text-sm text-[#6B7280] mb-8">
              Gestione sus citas, acceda a su historial médico y descubra una
              nueva forma de cuidar su sonrisa.
            </p>
          </div>

          <div className="overflow-hidden rounded-xl">
            <img
              src="/images/consultorio.jpg"
              alt="Interior de la clínica dental"
              className="aspect-[16/9] w-full object-cover"
            />
          </div>
        </div>

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

          {passwordUpdated && (
            <div className="mt-4 rounded-lg border border-[#A8E6C1] bg-[#EFFBF3] px-4 py-2.5 text-sm text-[#1B7A41]">
              Su contraseña fue actualizada exitosamente. Ya puede iniciar sesión.
            </div>
          )}

          <form onSubmit={handleLogin} className="mt-8 flex flex-col gap-5">
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
                className="rounded-lg border border-[#D7DEF2] bg-white px-4 py-2.5 text-sm text-[#1F2937] placeholder:text-[#9CA3AF] focus:border-[#00C2F3] focus:outline-none focus:ring-2 focus:ring-[#00C2F3]/30"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-medium text-[#283A97]">
                  Contraseña
                </label>
                <Link href="/auth/forgot-password" className="text-xs text-[#00A8D8] hover:underline">
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
            <Link href="/auth/sign-up" className="font-medium text-[#283A97] hover:underline">
              Registrarse como paciente
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}