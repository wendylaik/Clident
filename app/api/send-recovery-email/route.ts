import { Resend } from "resend";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sealData } from "iron-session";

/**
 * Cliente de Resend inicializado con la API key del entorno.
 * Se usa exclusivamente para el envío de correos de recuperación de contraseña.
 */
const resend = new Resend(process.env.RESEND_API_KEY);

const SESSION_PASSWORD = process.env.SESSION_SECRET!;

/**
 * Genera un código OTP (One-Time Password) numérico de 6 dígitos.
 * @returns String de 6 dígitos entre 100000 y 999999
 */
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}


/**
 * Endpoint para el paso 1 del proceso de recuperación de contraseña.
 * 
 * Genera un código OTP de 6 dígitos, lo cifra junto con el correo y
 * la fecha de expiración usando iron-session, y lo almacena en una
 * cookie httpOnly para verificación posterior. Luego envía el código
 * al correo del usuario mediante Resend.
 *
 * Nota: En el plan gratuito de Resend sin dominio verificado, los correos
 * solo se envían a la dirección autorizada (wendypt2004@gmail.com).
 * En producción con dominio verificado, se enviará al correo del usuario.
 *
 * @param request - Request con body JSON: { email: string }
 * @returns JSON con { success: true } o { error: string }
 */
export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "El correo es requerido" },
        { status: 400 }
      );
    }

    const code = generateOTP();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

// Cifrar el código, correo y expiración con iron-session y almacenar en cookie httpOnly
// La cookie expira en 600 segundos (10 minutos), igual que el código OTP
    const sealed = await sealData(
      { code, email, expiresAt },
      { password: SESSION_PASSWORD, ttl: 600 }
    );

    const cookieStore = await cookies();
    cookieStore.set("recovery_session", sealed, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600,
      path: "/",
    });

// Enviar el correo con el código OTP mediante la API de Resend
    const { error: resendError } = await resend.emails.send({
      from: "Clident <onboarding@resend.dev>",
      to: "wendypt2004@gmail.com", //cambiar a `email` en producción cuando se tenga dominio verificado
      subject: "Código de recuperación — Clínica Dental Maureen Téllez",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #ffffff;">
          <div style="margin-bottom: 24px;">
            <h1 style="font-size: 20px; color: #283A97; margin: 0;">Clident</h1>
            <p style="font-size: 11px; color: #7C86B8; margin: 2px 0 0 0; text-transform: uppercase; letter-spacing: 2px;">Clínica Dental</p>
          </div>

          <h2 style="font-size: 22px; color: #1F2937; margin: 0 0 8px 0;">Código de recuperación</h2>
          <p style="font-size: 14px; color: #6B7280; margin: 0 0 24px 0;">
            Recibimos una solicitud para restablecer la contraseña de su cuenta en Clident.
            Si usted no realizó esta solicitud, puede ignorar este correo.
          </p>

          <p style="font-size: 14px; color: #6B7280; margin: 0 0 16px 0;">
            Ingrese el siguiente código en la aplicación. Este código expira en <strong>10 minutos</strong>.
          </p>

          <div style="text-align: center; margin: 32px 0;">
            <div style="display: inline-block; background: #F1F4FA; border: 2px solid #283A97; border-radius: 12px; padding: 16px 40px;">
              <span style="font-size: 36px; font-weight: 700; color: #283A97; letter-spacing: 8px;">${code}</span>
            </div>
          </div>

          <p style="font-size: 12px; color: #9CA3AF; margin: 24px 0 0 0; border-top: 1px solid #E5E7EB; padding-top: 16px;">
            Este correo fue enviado automáticamente por Clident. Por favor no responda a este mensaje.
          </p>
        </div>
      `,
    });

    if (resendError) {
      return NextResponse.json({ error: resendError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Recovery email error:", error);
    return NextResponse.json(
      { error: "Ocurrió un error inesperado" },
      { status: 500 }
    );
  }
}