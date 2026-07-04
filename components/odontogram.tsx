"use client";

import { useEffect, useRef, useState } from "react";

type EstadoPieza =
  | "sana"
  | "caries"
  | "restauracion"
  | "corona"
  | "implante"
  | "ausente"
  | "endodoncia";

type PiezaDental = {
  id: string;
  numero_pieza: number;
  estado: EstadoPieza;
  observaciones: string | null;
};

type Props = {
  piezas: PiezaDental[];
  onPiezaClick?: (pieza: PiezaDental) => void;
  readonly?: boolean;
};

/**
 * Color de relleno para cada estado de pieza según la codificación clínica estándar.
 * Se usa "transparent" para piezas sanas para que sean clickeables sin mostrarse rellenas.
 */
const estadoFill: Record<EstadoPieza, string> = {
  sana: "transparent",
  caries: "#DC2626",
  restauracion: "#283A97",
  corona: "#00C2F3",
  implante: "#283A97",
  ausente: "#6B7280",
  endodoncia: "#E45C3C",
};

/** Color del contorno para cada estado de pieza dental. */
const estadoStroke: Record<EstadoPieza, string> = {
  sana: "#000000",
  caries: "#DC2626",
  restauracion: "#283A97",
  corona: "#00C2F3",
  implante: "#283A97",
  ausente: "#6B7280",
  endodoncia: "#E45C3C",
};

const estadoLabel: Record<EstadoPieza, string> = {
  sana: "Sana",
  caries: "Caries",
  restauracion: "Restauración",
  corona: "Corona",
  implante: "Implante",
  ausente: "Ausente",
  endodoncia: "Endodoncia",
};

/** Lista de números FDI de las 32 piezas del odontograma adulto (11-48). */
const ADULT_TEETH = [
  11, 12, 13, 14, 15, 16, 17, 18,
  21, 22, 23, 24, 25, 26, 27, 28,
  31, 32, 33, 34, 35, 36, 37, 38,
  41, 42, 43, 44, 45, 46, 47, 48,
];

/**
 * Mapa de conversión de numeración FDI internacional a posición interna (1-32).
 * La base de datos almacena las piezas del 1 al 32, pero el SVG usa numeración FDI.
 */
const FDI_TO_POSITION: Record<number, number> = {
  18:1, 17:2, 16:3, 15:4, 14:5, 13:6, 12:7, 11:8,
  21:9, 22:10, 23:11, 24:12, 25:13, 26:14, 27:15, 28:16,
  31:17, 32:18, 33:19, 34:20, 35:21, 36:22, 37:23, 38:24,
  41:25, 42:26, 43:27, 44:28, 45:29, 46:30, 47:31, 48:32,
};

/**
 * Componente de odontograma interactivo basado en un SVG de arcos dentales adultos.
 * Carga el SVG desde /public/odontogram.svg y aplica estilos dinámicos según
 * el estado de cada pieza dental usando inyección de CSS con !important para
 * sobreescribir los estilos inline del SVG original.
 *
 * Usa delegación de eventos sobre el contenedor para manejar hover y click,
 * leyendo className.baseVal para compatibilidad con elementos SVG.
 *
 * @param piezas - Array de piezas dentales con su estado actual
 * @param onPiezaClick - Callback ejecutado al hacer clic en una pieza
 * @param readonly - Si es true, deshabilita la interacción con el odontograma
 */
export default function Odontogram({ piezas, onPiezaClick, readonly = false }: Props) {
  const [svgContent, setSvgContent] = useState<string>("");
  const [hoveredTooth, setHoveredTooth] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  

/**
 * Ref que mantiene siempre el valor actualizado de piezas dentro de los event listeners.
 * Necesario porque los listeners del SVG capturan el valor inicial de piezas en el closure.
 */
  const piezasRef = useRef(piezas);
    
/** Carga el contenido del SVG del odontograma desde la carpeta public. */
  useEffect(() => { piezasRef.current = piezas; }, [piezas]);

  useEffect(() => {
    fetch("/odontogram.svg")
      .then((res) => res.text())
      .then((text) => {
        setSvgContent(text);
        setIsLoading(false);
      });
  }, []);

/**
 * Obtiene la pieza dental correspondiente a un número FDI del SVG.
 * Convierte el número FDI a posición interna antes de buscar en el array.
 * @param numero - Número FDI de la pieza (11-48)
 * @returns PiezaDental o undefined si no se encuentra
 */
const getPieza = (numero: number): PiezaDental | undefined =>
  piezas.find((p) => p.numero_pieza === FDI_TO_POSITION[numero]);

/**
 * Genera los estilos CSS dinámicos para colorear cada pieza según su estado.
 * Usa !important para sobreescribir los estilos inline del SVG original.
 * Al hacer hover, el contorno de la pieza cambia a celeste (#00C2F3).
 */
  const dynamicStyles = ADULT_TEETH.map((num) => {
    const pieza = getPieza(num);
    const estado = pieza?.estado ?? "sana";
    const fill = estadoFill[estado];
    const stroke = estadoStroke[estado];
    const isHovered = hoveredTooth === num;

    return `
      .tooth-${num}-parent {
        fill: ${fill} !important;
        stroke: ${isHovered ? "#00C2F3" : stroke} !important;
        stroke-width: ${isHovered ? "2.5" : "1"} !important;
        cursor: ${readonly ? "default" : "pointer"};
      }
      .tooth-${num}:not(.tooth-${num}-parent) {
        stroke: ${isHovered ? "#00C2F3" : stroke} !important;
        stroke-width: ${isHovered ? "1.5" : "1"} !important;
      }
    `;
  }).join("\n");

const [svgLoaded, setSvgLoaded] = useState(false);

useEffect(() => {
  fetch("/odontogram.svg")
    .then((res) => res.text())
    .then((text) => {
      setSvgContent(text);
      setSvgLoaded(true);
      setIsLoading(false);
    });
}, []);

useEffect(() => {
  if (!svgLoaded) return;

  const container = document.querySelector('.odontogram-container');
  if (!container) return;

const handleClick = (e: Event) => {
  const target = e.target as SVGElement;
  const baseVal = (target.className as any)?.baseVal ?? "";
  const classes = baseVal.split(" ");
  
  for (const num of ADULT_TEETH) {
    if (classes.includes(`tooth-${num}`)) {
      if (readonly) return;
      const pieza = piezasRef.current.find((p) => p.numero_pieza === FDI_TO_POSITION[num]);
      if (pieza && onPiezaClick) onPiezaClick(pieza);
      break;
    }
  }
};

const handleMouseEnter = (e: Event) => {
  const target = e.target as SVGElement;
  const baseVal = (target.className as any)?.baseVal ?? "";
  const classes = baseVal.split(" ");
  
  for (const num of ADULT_TEETH) {
    if (classes.includes(`tooth-${num}`)) {
      setHoveredTooth(num);
      break;
    }
  }
};

  const handleMouseLeave = () => setHoveredTooth(null);

  container.addEventListener('click', handleClick);
  container.addEventListener('mouseover', handleMouseEnter);
  container.addEventListener('mouseout', handleMouseLeave);

  return () => {
    container.removeEventListener('click', handleClick);
    container.removeEventListener('mouseover', handleMouseEnter);
    container.removeEventListener('mouseout', handleMouseLeave);
  };
}, [svgLoaded]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-[#6B7280]">Cargando odontograma...</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <style>{dynamicStyles}</style>

      {/* Upper tooth numbers */}
      <div className="flex justify-center mb-1 px-2">
        <div className="flex w-full max-w-xs justify-between">
          {[18,17,16,15,14,13,12,11,21,22,23,24,25,26,27,28].map((n) => (
            <span key={n} className="text-[9px] text-[#6B7280] font-medium w-4 text-center">{n}</span>
          ))}
        </div>
      </div>

      {/* SVG inline */}
      <div
        className="w-full odontogram-container"
        dangerouslySetInnerHTML={{ __html: svgContent }}
      />

      {/* Lower tooth numbers */}
      <div className="flex justify-center mt-1 px-2">
        <div className="flex w-full max-w-xs justify-between">
          {[48,47,46,45,44,43,42,41,31,32,33,34,35,36,37,38].map((n) => (
            <span key={n} className="text-[9px] text-[#6B7280] font-medium w-4 text-center">{n}</span>
          ))}
        </div>
      </div>

      {/* Hovered tooth tooltip */}
      {hoveredTooth && !readonly && (
        <div className="absolute top-2 right-2 bg-white border border-[#E2E6F0] rounded-lg px-3 py-2 shadow-sm pointer-events-none">
          <p className="text-xs font-medium text-[#283A97]">Pieza {hoveredTooth}</p>
          <p className="text-xs text-[#6B7280]">
            {estadoLabel[getPieza(hoveredTooth)?.estado ?? "sana"]}
          </p>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-4 justify-center">
        {(Object.entries(estadoLabel) as [EstadoPieza, string][]).map(([estado, label]) => (
          <div key={estado} className="flex items-center gap-1.5">
            <div
              className="w-3 h-3 rounded-sm border border-[#00000020]"
              style={{
                backgroundColor: estadoFill[estado] === "none" ? "white" : estadoFill[estado],
              }}
            />
            <span className="text-xs text-[#6B7280]">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}