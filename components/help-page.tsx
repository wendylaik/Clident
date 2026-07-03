"use client";

import { useState } from "react";

type FAQItem = {
  question: string;
  answer: string;
};

type HelpSection = {
  id: string;
  title: string;
  items: FAQItem[];
};

const commonSection: HelpSection = {
  id: "general",
  title: "General",
  items: [
    {
      question: "¿Qué hago si olvidé mi contraseña?",
      answer: "En la pantalla de inicio de sesión, haz clic en '¿Olvidaste tu contraseña?'. Ingresa tu correo electrónico y recibirás un código de verificación de 6 dígitos válido por 10 minutos. Ingresa el código, define tu nueva contraseña y ya podrás iniciar sesión normalmente.",
    },
    {
      question: "¿Qué hago si no puedo iniciar sesión?",
      answer: "Verifica que el correo y la contraseña sean correctos. Si el problema persiste, es posible que tu cuenta esté desactivada. En ese caso, comunícate con el administrador de la clínica para que reactive tu acceso.",
    },
    {
      question: "¿Qué hago si el sistema no carga o responde lento?",
      answer: "Intenta recargar la página con F5 o Ctrl+R. Si el problema continúa, verifica tu conexión a internet. Si el sistema sigue sin responder, comunícate con el soporte técnico de la clínica.",
    },
    {
      question: "¿Qué hago si registré una cita en el horario equivocado?",
      answer: "Si eres paciente, cancela la cita desde 'Mis citas' y agenda una nueva en el horario correcto. Si eres odontólogo o administrador, abre la cita desde el calendario y selecciona 'Reprogramar' para cambiar la fecha y hora.",
    },
  ],
};

const patientOnlySections: HelpSection[] = [
  {
    id: "appointments",
    title: "Gestión de citas",
    items: [
      {
        question: "¿Cómo agendo una cita?",
        answer: "Dirígete a la sección 'Mis citas' en el menú lateral. Haz clic en cualquier espacio disponible dentro del horario de la clínica. Se abrirá un formulario donde debes seleccionar el servicio que necesitas y confirmar la fecha y hora. Una vez registrada, la cita aparecerá en tu calendario con estado 'Programada'.",
      },
      {
        question: "¿Cómo confirmo mi asistencia a una cita?",
        answer: "En la sección 'Mis citas', haz clic sobre la cita que deseas confirmar. En el modal de detalle que se abre, selecciona la opción 'Confirmar asistencia'. Esto le indica al personal de la clínica que planeas asistir.",
      },
      {
        question: "¿Cómo cancelo una cita?",
        answer: "En la sección 'Mis citas', haz clic sobre la cita que deseas cancelar y selecciona 'Cancelar cita'. Solo puedes cancelar citas con estado 'Programada' o 'Confirmada'. Una vez cancelada, el horario queda disponible para otros pacientes.",
      },
      {
        question: "¿Por qué no puedo ver citas más allá de dos semanas?",
        answer: "Por política de la clínica, el sistema permite agendar citas con un máximo de dos semanas de anticipación. Si necesitas una cita más adelante, puedes contactar directamente a la clínica.",
      },
    ],
  },
  {
    id: "profile",
    title: "Mi perfil",
    items: [
      {
        question: "¿Cómo actualizo mis datos personales?",
        answer: "Dirígete a 'Mi perfil' en el menú lateral y haz clic en 'Editar'. Podrás modificar tu nombre, teléfono, correo electrónico y dirección. Una vez realizados los cambios, haz clic en 'Guardar cambios'.",
      },
      {
        question: "¿Puedo modificar mi cédula o fecha de nacimiento?",
        answer: "No, estos datos son de identificación y no pueden ser modificados desde el sistema. Si hay un error, comunícate directamente con la clínica para que el personal lo corrija.",
      },
      {
        question: "¿Por qué no puedo editar mis alergias o enfermedades sistémicas?",
        answer: "Los antecedentes médicos son gestionados exclusivamente por el personal clínico para garantizar la precisión de tu historial. Si necesitas actualizar esta información, infórmale a la odontóloga en tu próxima cita.",
      },
    ],
  },
];

const dentistOnlySections: HelpSection[] = [
  {
    id: "appointments",
    title: "Gestión de citas",
    items: [
      {
        question: "¿Cómo registro que un paciente asistió a su cita?",
        answer: "En la sección 'Citas', haz clic sobre la cita correspondiente. Selecciona 'Iniciar consulta' si el paciente asistió, lo que abrirá el formulario de consulta clínica. Si no se presentó, selecciona 'No asistió'.",
      },
      {
        question: "¿Cómo reprogramo una cita?",
        answer: "En 'Citas', haz clic sobre la cita y selecciona 'Reprogramar'. Ingresa la nueva fecha y hora, y el sistema verificará automáticamente la disponibilidad antes de confirmar el cambio.",
      },
      {
        question: "¿Cómo agendo una cita para un paciente?",
        answer: "En 'Citas', haz clic en cualquier espacio disponible del calendario. Selecciona el paciente, el servicio y confirma el horario. El sistema validará que no haya conflictos con otras citas.",
      },
    ],
  },
  {
    id: "patients",
    title: "Gestión de pacientes",
    items: [
      {
        question: "¿Cómo busco un paciente?",
        answer: "En la sección 'Pacientes', usa el buscador con el selector de criterio: nombre, cédula, correo electrónico o número de expediente. Los resultados se filtran en tiempo real.",
      },
      {
        question: "¿Cómo edito los datos de un paciente?",
        answer: "En 'Pacientes', haz clic en el ícono de editar en la fila del paciente, o entra al perfil completo y selecciona 'Editar'. Podrás modificar nombre, teléfono, correo, dirección, peso, alergias y enfermedades sistémicas.",
      },
      {
        question: "¿Cómo desactivo un paciente?",
        answer: "En 'Pacientes', haz clic en el ícono de desactivar. Si el paciente tiene citas pendientes, el sistema te pedirá cancelarlas primero antes de proceder.",
      },
    ],
  },
];

const adminOnlySections: HelpSection[] = [
  {
    id: "users",
    title: "Gestión de usuarios",
    items: [
      {
        question: "¿Cómo registro un nuevo usuario interno?",
        answer: "En 'Usuarios', haz clic en 'Registrar usuario'. Completa el nombre, correo, contraseña temporal y selecciona el rol (Odontólogo o Administrador). El usuario podrá iniciar sesión con esas credenciales.",
      },
      {
        question: "¿Cómo edito el correo de un usuario?",
        answer: "En 'Usuarios', haz clic en el ícono de editar en la fila del usuario. Solo es posible modificar el correo electrónico. Para otros cambios, comunícate con el soporte técnico.",
      },
      {
        question: "¿Cómo desactivo un usuario?",
        answer: "En 'Usuarios', haz clic en el ícono de desactivar. Ten en cuenta que no es posible desactivar al último administrador activo del sistema.",
      },
      {
        question: "¿Puedo eliminar un usuario del sistema?",
        answer: "No, el sistema no permite eliminar usuarios para preservar la integridad del historial clínico. En su lugar, puedes desactivarlo para impedir su acceso sin borrar su información.",
      },
    ],
  },
  {
    id: "register-patients",
    title: "Registro de pacientes",
    items: [
      {
        question: "¿Cómo registro un nuevo paciente manualmente?",
        answer: "En 'Pacientes', haz clic en 'Registrar paciente'. Completa los datos personales y los antecedentes médicos disponibles. Al registrar al paciente, el sistema generará automáticamente su expediente clínico y odontograma.",
      },
      {
        question: "¿Qué pasa si el paciente ya tiene cuenta en el sistema?",
        answer: "Si el paciente se registró previamente, ya existe en el sistema. Puedes buscarlo en 'Pacientes' y actualizar su información si es necesario.",
      },
    ],
  },
];

const patientSections = [commonSection, ...patientOnlySections];
const dentistSections = [commonSection, ...dentistOnlySections];
const adminSections = [commonSection, ...dentistOnlySections, ...adminOnlySections];

function AccordionItem({ item }: { item: FAQItem }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="py-5 border-b border-[#F1F4FA] last:border-b-0">
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="flex w-full items-start justify-between gap-4 text-left"
      >
        <span className="text-sm font-medium text-[#1F2937]">{item.question}</span>
        <span className="shrink-0 mt-0.5 text-[#283A97]">
          {isOpen ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          )}
        </span>
      </button>
      {isOpen && (
        <p className="mt-3 text-sm text-[#6B7280] leading-relaxed pr-8">
          {item.answer}
        </p>
      )}
    </div>
  );
}

export default function HelpPage({ role }: { role: "admin" | "dentist" | "patient" }) {
  const sections =
    role === "admin" ? adminSections :
    role === "dentist" ? dentistSections :
    patientSections;

  const [activeSection, setActiveSection] = useState(sections[0].id);
  const currentSection = sections.find((s) => s.id === activeSection) ?? sections[0];

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <p className="text-xs font-medium text-[#00C2F3] uppercase tracking-widest mb-2">Centro de ayuda</p>
        <h1 className="text-3xl font-semibold text-[#1F2937]">Preguntas frecuentes</h1>
        <p className="mt-2 text-sm text-[#6B7280] max-w-lg">
          Todo lo que necesitas saber para gestionar tu cuenta y resolver los problemas más frecuentes.
        </p>
      </div>

      <div className="flex gap-10">
        {/* Sidebar nav */}
        <div className="w-48 shrink-0 flex flex-col gap-1">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                activeSection === section.id
                  ? "bg-[#E8EBF7] text-[#283A97] font-medium"
                  : "text-[#6B7280] hover:text-[#283A97]"
              }`}
            >
              {section.title}
            </button>
          ))}

          <div className="mt-6 border-t border-[#E2E6F0] pt-6">
            <p className="text-xs font-medium text-[#283A97] uppercase tracking-wide mb-2">Contacto</p>
            <p className="text-xs text-[#6B7280]">+506 8696-8888</p>
            <p className="text-xs text-[#6B7280] mt-1">Lun–Vie 8am–6pm</p>
            <p className="text-xs text-[#6B7280]">Sáb 10am–2pm</p>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 bg-white rounded-xl border border-[#E2E6F0] px-8 py-6">
          <h2 className="text-base font-semibold text-[#1F2937] mb-1">{currentSection.title}</h2>
          <div className="mt-4">
            {currentSection.items.map((item) => (
              <AccordionItem key={item.question} item={item} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}