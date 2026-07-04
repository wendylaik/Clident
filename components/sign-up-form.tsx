"use client";

import { registerPatient } from "@/lib/functions/register-patient";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useState, useEffect } from "react";
const today = new Date();
const MAX_BIRTH_DATE = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}-${String(today.getDate()).padStart(2,"0")}`;

export function SignUpForm() {
  const [fullName, setFullName] = useState("");
  const [documentType, setDocumentType] = useState<"nacional" | "extranjero">("nacional");
  const [cedula, setCedula] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  
 
  const router = useRouter();

  useEffect(() => {
    setFullName("");
    setDocumentType("nacional");
    setCedula("");
    setBirthDate("");
    setPhone("");
    setEmail("");
    setPassword("");
    setRepeatPassword("");
    setError(null);
    setFieldErrors({});
  }, []);

  const validate = () => {
    const errors: Record<string, string> = {};

    if (!fullName.trim()) {
      errors.fullName = "El nombre es requerido";
    }

    if (documentType === "nacional") {
      if (!/^\d{9}$/.test(cedula)) {
        errors.cedula = "La cédula nacional debe tener exactamente 9 dígitos";
      }
    } else {
      if (!cedula.trim()) {
        errors.cedula = "El número de identificación es requerido";
      }
    }

    if (documentType === "nacional") {
      if (!/^\d{8}$/.test(phone.replace(/[\s\-]/g, ""))) {
        errors.phone = "El teléfono debe tener exactamente 8 dígitos";
      }
    } else {
      if (!/^\+\d{7,15}$/.test(phone.replace(/[\s\-]/g, ""))) {
        errors.phone = "Ingrese el número con código de país (Ej: +506 88888888)";
      }
    }

    const birth = new Date(birthDate);
    const today = new Date(MAX_BIRTH_DATE);
    const age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    const realAge =
      monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())
        ? age - 1
        : age;

    if (!birthDate) {
      errors.birthDate = "La fecha de nacimiento es requerida";
    } else if (realAge < 18) {
      errors.birthDate = "Debe ser mayor de 18 años para registrarse";
    }

    if (!/^\+?\d{7,15}$/.test(phone.replace(/[\s\-]/g, ""))) {
      errors.phone = "Ingrese un número de teléfono válido (7-15 dígitos)";
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Ingrese un correo electrónico válido";
    }

    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password)) {
      errors.password =
        "Mínimo 8 caracteres, una mayúscula, una minúscula y un número";
    }

    if (password !== repeatPassword) {
      errors.repeatPassword = "Las contraseñas no coinciden";
    }

    return errors;
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setIsLoading(false);
      return;
    }
    setFieldErrors({});

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

  const inputClass =
    "rounded-lg border border-[#D7DEF2] bg-white px-4 py-2.5 text-sm text-[#1F2937] placeholder:text-[#9CA3AF] focus:border-[#00C2F3] focus:outline-none focus:ring-2 focus:ring-[#00C2F3]/30";
  const inputErrorClass =
    "rounded-lg border border-[#E45C3C] bg-white px-4 py-2.5 text-sm text-[#1F2937] placeholder:text-[#9CA3AF] focus:border-[#E45C3C] focus:outline-none focus:ring-2 focus:ring-[#E45C3C]/30";
  const labelClass = "text-sm font-medium text-[#283A97]";
  const errorTextClass = "text-xs text-[#E45C3C] mt-0.5";

  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-[#F1F4FA] p-6">
      <div className="flex w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-sm">
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
              <Image
                src="/images/logo-clinica.png"
                alt="Clident - Clínica Dental"
                width={60}
                height={30}
                className="object-contain"
              />
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
              Únase a los pacientes que confían en la Dra. Maureen Téllez Durán
              para su salud bucal.
            </p>
          </div>

          <p className="relative z-10 text-sm italic text-[#9FB3E8]">
            &ldquo;Sonríale a la vida&rdquo;
          </p>
        </div>

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
                <label htmlFor="full-name" className={labelClass}>
                  Nombre completo
                </label>
                <input
                  id="full-name"
                  type="text"
                  required
                  placeholder="Ej: Juan Pérez"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className={fieldErrors.fullName ? inputErrorClass : inputClass}
                />
                {fieldErrors.fullName && (
                  <p className={errorTextClass}>{fieldErrors.fullName}</p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Identificación</label>
                <div className="flex overflow-hidden rounded-lg border border-[#D7DEF2] mb-1">
                  <button
                    type="button"
                    onClick={() => { setDocumentType("nacional"); setCedula(""); }}
                    className={`flex-1 py-1.5 text-xs font-medium transition-colors ${
                      documentType === "nacional"
                        ? "bg-[#283A97] text-white"
                        : "bg-white text-[#6B7280] hover:bg-[#F4F5F8]"
                    }`}
                  >
                    Nacional
                  </button>
                  <button
                    type="button"
                    onClick={() => { setDocumentType("extranjero"); setCedula(""); }}
                    className={`flex-1 py-1.5 text-xs font-medium transition-colors ${
                      documentType === "extranjero"
                        ? "bg-[#283A97] text-white"
                        : "bg-white text-[#6B7280] hover:bg-[#F4F5F8]"
                    }`}
                  >
                    Extranjero
                  </button>
                </div>
                <input
                  id="cedula"
                  type="text"
                  required
                  placeholder={documentType === "nacional" ? "000000000" : "DIMEX o pasaporte"}
                  value={cedula}
                  onChange={(e) => setCedula(e.target.value)}
                  className={fieldErrors.cedula ? inputErrorClass : inputClass}
                />
                {fieldErrors.cedula && (
                  <p className={errorTextClass}>{fieldErrors.cedula}</p>
                )}
              </div>

              {/* Fecha de nacimiento */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="birth-date" className={labelClass}>
                  Fecha de nacimiento
                </label>
                <input
                  id="birth-date"
                  type="date"
                  required
                  max={MAX_BIRTH_DATE}
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className={fieldErrors.birthDate ? inputErrorClass : inputClass}
                />
                {fieldErrors.birthDate && (
                  <p className={errorTextClass}>{fieldErrors.birthDate}</p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="phone" className={labelClass}>
                  Teléfono
                </label>
                <input
                  id="phone"
                  type="tel"
                  required
                  placeholder={documentType === "nacional" ? "88888888" : "+506 88888888"}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={fieldErrors.phone ? inputErrorClass : inputClass}
                />
                {fieldErrors.phone && (
                  <p className={errorTextClass}>{fieldErrors.phone}</p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="email" className={labelClass}>
                  Correo electrónico
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  placeholder="nombre@correo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={fieldErrors.email ? inputErrorClass : inputClass}
                />
                {fieldErrors.email && (
                  <p className={errorTextClass}>{fieldErrors.email}</p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="password" className={labelClass}>
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`w-full ${fieldErrors.password ? inputErrorClass : inputClass}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#9CA3AF] hover:text-[#283A97]"
                  >
                    {showPassword ? "Ocultar" : "Mostrar"}
                  </button>
                </div>
                {fieldErrors.password && (
                  <p className={errorTextClass}>{fieldErrors.password}</p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="repeat-password" className={labelClass}>
                  Confirmar contraseña
                </label>
                <input
                  id="repeat-password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={repeatPassword}
                  onChange={(e) => setRepeatPassword(e.target.value)}
                  className={fieldErrors.repeatPassword ? inputErrorClass : inputClass}
                />
                {fieldErrors.repeatPassword && (
                  <p className={errorTextClass}>{fieldErrors.repeatPassword}</p>
                )}
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