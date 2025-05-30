// src/components/odontogram/Odontograma.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import PaletteModal from './PaletteModal';
import OdontogramLegend from './OdontogramLegend';

// --- Interfaces (Mantener consistentes) ---
export interface OdontogramData {
  [toothId: string]: {
    estado_geral?: string; // e.g., 'ausente', 'implante', 'coroa', 'protese', 'endodontia', 'fractura'
    superficies?: {
      [surface: string]: {
        estado?: string; // e.g., 'carie', 'restauracao', 'selante'
        material?: string; // e.g., 'resina', 'amalgama', 'ceramica'
      };
    };
    mobilidade?: string; // e.g., 'grado1', 'grado2', 'grado3', 'sano'
    notas?: string;
  };
}

interface OdontogramaProps {
  initialData?: OdontogramData | null;
  onChange: (data: OdontogramData) => void;
  readOnly?: boolean;
}

// --- Colores que coinciden con tu tailwind.config.js ---
// Si bien usamos clases de Tailwind para el HTML, para los estilos SVG (fill, stroke)
// necesitamos los valores hexadecimales directos. Estos deben coincidir con tu config.
const svgColors = {
  // Colores de tu paleta 'raspberry'
  raspberry50: '#FDEEF7',
  raspberry100: '#FADDEB',
  raspberry500: '#CE3C8D',
  raspberry600: '#8C186D',
  raspberry700: '#76145C',
  raspberry900: '#3D0A2E',

  // Colores específicos del odontograma
  carie: '#FF5C5C',
  restauracaoResina: '#66D7D7',
  restauracaoAmalgama: '#708090',
  restauracaoCeramica: '#FFDAB9',
  selante: '#A0DA8C',
  ausente: '#D3D3D3',
  implante: '#9370DB',
  coroa: '#FFD700',
  endodontia: '#FF8C00',
  fratura: '#FF6347',
  mobilidadeGrado1: '#FFA07A',
  mobilidadeGrado2: '#FF7F50',
  mobilidadeGrado3: '#FF4500',
  selectedBorder: '#2980b9',
  defaultStroke: '#616161',
  defaultFill: '#FFFFFF',
  background: '#F8F5F7',
};

// --- Definiciones de Dientes y Superficies ---
const toothNumbers = [
  // Maxilar Superior Derecho (10s)
  { num: 18, pos: 'superior-derecho', type: 'molar' }, { num: 17, pos: 'superior-derecho', type: 'molar' },
  { num: 16, pos: 'superior-derecho', type: 'molar' }, { num: 15, pos: 'superior-derecho', type: 'premolar' },
  { num: 14, pos: 'superior-derecho', type: 'premolar' }, { num: 13, pos: 'superior-derecho', type: 'canino' },
  { num: 12, pos: 'superior-derecho', type: 'incisivo-lateral' }, { num: 11, pos: 'superior-derecho', type: 'incisivo-central' },
  // Maxilar Superior Izquierdo (20s)
  { num: 21, pos: 'superior-izquierdo', type: 'incisivo-central' }, { num: 22, pos: 'superior-izquierdo', type: 'incisivo-lateral' },
  { num: 23, pos: 'superior-izquierdo', type: 'canino' }, { num: 24, pos: 'superior-izquierdo', type: 'premolar' },
  { num: 25, pos: 'superior-izquierdo', type: 'premolar' }, { num: 26, pos: 'superior-izquierdo', type: 'molar' },
  { num: 27, pos: 'superior-izquierdo', type: 'molar' }, { num: 28, pos: 'superior-izquierdo', type: 'molar' },
  // Mandíbula Inferior Izquierdo (30s)
  { num: 38, pos: 'inferior-izquierdo', type: 'molar' }, { num: 37, pos: 'inferior-izquierdo', type: 'molar' },
  { num: 36, pos: 'inferior-izquierdo', type: 'molar' }, { num: 35, pos: 'inferior-izquierdo', type: 'premolar' },
  { num: 34, pos: 'inferior-izquierdo', type: 'premolar' }, { num: 33, pos: 'inferior-izquierdo', type: 'canino' },
  { num: 32, pos: 'inferior-izquierdo', type: 'incisivo-lateral' }, { num: 31, pos: 'inferior-izquierdo', type: 'incisivo-central' },
  // Mandíbula Inferior Derecho (40s)
  { num: 41, pos: 'inferior-derecho', type: 'incisivo-central' }, { num: 42, pos: 'inferior-derecho', type: 'incisivo-lateral' },
  { num: 43, pos: 'inferior-derecho', type: 'canino' }, { num: 44, pos: 'inferior-derecho', type: 'premolar' },
  { num: 45, pos: 'inferior-derecho', type: 'premolar' }, { num: 46, pos: 'inferior-derecho', type: 'molar' },
  { num: 47, pos: 'inferior-derecho', type: 'molar' }, { num: 48, pos: 'inferior-derecho', type: 'molar' },
];

const surfacesMap: { [key: string]: string[] } = {
  molar: ['oclusal', 'mesial', 'distal', 'vestibular', 'lingual'],
  premolar: ['oclusal', 'mesial', 'distal', 'vestibular', 'lingual'],
  canino: ['incisal', 'mesial', 'distal', 'vestibular', 'lingual'],
  'incisivo-lateral': ['incisal', 'mesial', 'distal', 'labial', 'palatina'],
  'incisivo-central': ['incisal', 'mesial', 'distal', 'labial', 'palatina'],
};

// --- Función para generar los trazados SVG (Placeholder - Requiere SVGs anatómicamente correctos) ---
const getToothSvgPaths = (toothNumber: number, type: string) => {
  const size = 30; // Tamaño base para nuestro placeholder de diente
  const surfaceSize = size / 3; // Tamaño de la superficie
  const spacingX = size * 1.5; // Espaciado horizontal entre dientes
  const spacingY = size * 1.5; // Espaciado vertical entre filas de dientes

  let xOffset = 0;
  let yOffset = 0;

  // Lógica de posicionamiento para un diseño de odontograma lineal
  // Ajuste de los offsets para que los cuadrantes queden ordenados de izquierda a derecha en cada fila
  if (toothNumber >= 11 && toothNumber <= 18) { // Superior derecho
    xOffset = (18 - toothNumber) * spacingX + (8 * spacingX); // Invertir orden y desplazar
    yOffset = 0;
  } else if (toothNumber >= 21 && toothNumber <= 28) { // Superior izquierdo
    xOffset = (toothNumber - 21) * spacingX;
    yOffset = 0;
  } else if (toothNumber >= 31 && toothNumber <= 38) { // Inferior izquierdo
    xOffset = (toothNumber - 31) * spacingX;
    yOffset = spacingY * 2;
  } else if (toothNumber >= 41 && toothNumber <= 48) { // Inferior derecho
    xOffset = (48 - toothNumber) * spacingX + (8 * spacingX); // Invertir orden y desplazar
    yOffset = spacingY * 2;
  }

  const toothPathsData: { [key: string]: { path: string; surfaces?: { [key: string]: string } } } = {};

  // Path del diente completo (rectángulo simple como placeholder)
  toothPathsData[`tooth-${toothNumber}`] = {
    path: `M${xOffset},${yOffset} h${size} v${size} h-${size} Z`, // Rectángulo base para el diente
    surfaces: {},
  };

  // Paths para las 5 superficies (cuadrados dentro del rectángulo del diente)
  const surfaces = surfacesMap[type];
  if (surfaces) {
    // Centro (oclusal/incisal)
    const centerSurfaceKey = surfaces.includes('oclusal') ? 'oclusal' : 'incisal';
    toothPathsData[`tooth-${toothNumber}`].surfaces![centerSurfaceKey] =
      `M${xOffset + surfaceSize},${yOffset + surfaceSize} h${surfaceSize} v${surfaceSize} h-${surfaceSize} Z`;

    // Mesial (izquierda del diente)
    toothPathsData[`tooth-${toothNumber}`].surfaces!['mesial'] =
      `M${xOffset},${yOffset + surfaceSize} h${surfaceSize} v${surfaceSize} h-${surfaceSize} Z`;

    // Distal (derecha del diente)
    toothPathsData[`tooth-${toothNumber}`].surfaces!['distal'] =
      `M${xOffset + size - surfaceSize},${yOffset + surfaceSize} h${surfaceSize} v${surfaceSize} h-${surfaceSize} Z`;

    // Vestibular/Labial (arriba del diente)
    const topSurfaceKey = surfaces.includes('labial') ? 'labial' : 'vestibular';
    toothPathsData[`tooth-${toothNumber}`].surfaces![topSurfaceKey] =
      `M${xOffset + surfaceSize},${yOffset} h${surfaceSize} v${surfaceSize} h-${surfaceSize} Z`;

    // Lingual/Palatina (abajo del diente)
    const bottomSurfaceKey = surfaces.includes('palatina') ? 'palatina' : 'lingual';
    toothPathsData[`tooth-${toothNumber}`].surfaces![bottomSurfaceKey] =
      `M${xOffset + surfaceSize},${yOffset + size - surfaceSize} h${surfaceSize} v${surfaceSize} h-${surfaceSize} Z`;
  }
  return toothPathsData;
};


// --- Main Odontogram Component ---
const Odontograma: React.FC<OdontogramaProps> = ({ initialData, onChange, readOnly = false }) => {
  const [odontogramState, setOdontogramState] = useState<OdontogramData>(initialData || {});
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [palettePosition, setPalettePosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setOdontogramState(initialData || {});
  }, [initialData]);

  const updateOdontogram = useCallback((newState: OdontogramData) => {
    // Asegura que las superficies vacías y dientes vacíos se eliminen para mantener el estado limpio
    const cleanedState: OdontogramData = {};
    for (const toothId in newState) {
      if (newState.hasOwnProperty(toothId)) {
        const toothData = { ...newState[toothId] };
        if (toothData.superficies && Object.keys(toothData.superficies).length === 0) {
          delete toothData.superficies;
        }
        // Solo agregar el diente si tiene alguna propiedad definida (estado_geral, superficies, mobilidade, notas)
        if (Object.keys(toothData).length > 0) {
          cleanedState[toothId] = toothData;
        }
      }
    }
    setOdontogramState(cleanedState);
    onChange(cleanedState);
  }, [onChange]);

  const handleElementClick = (event: React.MouseEvent<SVGPathElement>, elementId: string) => {
    if (readOnly) return;
    event.stopPropagation();
    setSelectedElement(elementId);
    setIsPaletteOpen(true);

    // Posicionar el modal cerca del elemento clicado
    const rect = event.currentTarget.getBoundingClientRect();
    setPalettePosition({
      x: rect.left + window.scrollX,
      y: rect.top + window.scrollY + rect.height, // Debajo del elemento
    });
  };

  const handleMarking = (markingType: string, details?: any) => {
    if (!selectedElement) return;

    const parts = selectedElement.split('-surface-');
    const toothIdRaw = parts[0].replace('tooth-', '');
    const surface = parts.length > 1 ? parts[1] : null;

    const newState = { ...odontogramState };
    if (!newState[toothIdRaw]) {
      newState[toothIdRaw] = { superficies: {} };
    }
    if (!newState[toothIdRaw].superficies) {
      newState[toothIdRaw].superficies = {};
    }

    if (markingType === 'sano') { // Limpiar todo el diente o superficie
      if (surface) {
        delete newState[toothIdRaw].superficies![surface];
      } else {
        // Al marcar un diente "sano", se eliminan todos sus estados
        delete newState[toothIdRaw];
      }
    } else if (markingType === 'mobilidade') {
      if (!isSurface) { // Solo para el diente completo
        newState[toothIdRaw].mobilidade = details.grado;
      }
    } else if (isSurface) {
      // Marcar una superficie específica
      newState[toothIdRaw].superficies![surface!] = { estado: markingType, material: details?.material };
      // Si una superficie es marcada, asegura que el estado general no sea ausente/implante/corona/protesis
      if (['ausente', 'implante', 'coroa', 'protese'].includes(newState[toothIdRaw]?.estado_geral || '')) {
        delete newState[toothIdRaw].estado_geral;
      }
    } else {
      // Marcar el diente completo (estado_geral)
      newState[toothIdRaw].estado_geral = markingType;
      // Si se marca un estado general como ausente, implante, etc., limpiar superficies y movilidad
      if (['ausente', 'implante', 'coroa', 'protese'].includes(markingType)) {
        newState[toothIdRaw].superficies = {};
        newState[toothIdRaw].mobilidade = undefined;
      }
    }

    updateOdontogram(newState);
    setIsPaletteOpen(false);
    setSelectedElement(null);
  };

  // Función para obtener los estilos SVG directamente desde `svgColors`
  const getElementStyle = (toothNumber: number, surface?: string): React.CSSProperties => {
    const toothData = odontogramState[toothNumber];
    let state: string | undefined;
    let material: string | undefined;
    let strokeColor = svgColors.defaultStroke;
    let strokeWidth = 0.5;
    let fill = svgColors.defaultFill;
    let display = 'block';

    if (surface && toothData?.superficies?.[surface]) {
      state = toothData.superficies[surface].estado;
      material = toothData.superficies[surface].material;
    } else if (!surface && toothData?.estado_geral) {
      state = toothData.estado_geral;
    }

    // Lógica para dientes ausentes (ocultar superficies si el diente está ausente)
    if (!surface && toothData?.estado_geral === 'ausente') {
      fill = svgColors.ausente;
    } else if (surface && toothData?.estado_geral === 'ausente') {
      display = 'none'; // Ocultar superficies si el diente está ausente
    }

    // Estilos basados en el estado del diente o superficie
    switch (state) {
      case 'carie': fill = svgColors.carie; break;
      case 'restauracao':
        if (material === 'resina') fill = svgColors.restauracaoResina;
        else if (material === 'amalgama') fill = svgColors.restauracaoAmalgama;
        else if (material === 'ceramica') fill = svgColors.restauracaoCeramica;
        break;
      case 'selante': fill = svgColors.selante; break;
      case 'implante': fill = svgColors.implante; break;
      case 'coroa': fill = svgColors.coroa; break;
      case 'protese': fill = svgColors.defaultStroke; break;
    }

    // Estilos para movilidad (solo para el diente completo)
    if (!surface && toothData?.mobilidade) {
      switch (toothData.mobilidade) {
        case 'grado1': strokeColor = svgColors.mobilidadeGrado1; strokeWidth = 1.5; break;
        case 'grado2': strokeColor = svgColors.mobilidadeGrado2; strokeWidth = 2; break;
        case 'grado3': strokeColor = svgColors.mobilidadeGrado3; strokeWidth = 2.5; break;
      }
    }

    // Resaltar elemento seleccionado
    const currentElementId = surface ? `tooth-${toothNumber}-surface-${surface}` : `tooth-${toothNumber}`;
    if (selectedElement === currentElementId && !readOnly) {
      strokeColor = svgColors.selectedBorder;
      strokeWidth = 2;
    }

    return { fill, stroke: strokeColor, strokeWidth, display };
  };

  // Close palette if clicking outside the odontogram container
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsPaletteOpen(false);
        setSelectedElement(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Generar todos los paths de los dientes y superficies
  const allToothPaths = toothNumbers.reduce((acc: any, tooth) => {
    const toothPathsData = getToothSvgPaths(tooth.num, tooth.type);
    return { ...acc, ...toothPathsData };
  }, {});

  // Calcular el tamaño máximo del viewBox dinámicamente
  const maxToothX = toothNumbers.reduce((max, tooth) => {
    const toothPathData = allToothPaths[`tooth-${tooth.num}`];
    if (!toothPathData) return max;
    const pathParts = toothPathData.path.split(' ');
    // Extraemos las coordenadas X de 'M' y el ancho 'h' para el cálculo
    const xStart = parseFloat(pathParts[0].replace('M', ''));
    const width = parseFloat(pathParts[1].replace('h', ''));
    return Math.max(max, xStart + width);
  }, 0);

  const maxToothY = toothNumbers.reduce((max, tooth) => {
    const toothPathData = allToothPaths[`tooth-${tooth.num}`];
    if (!toothPathData) return max;
    const pathParts = toothPathData.path.split(' ');
    // Extraemos las coordenadas Y de 'M' y la altura 'v' para el cálculo
    const yStart = parseFloat(pathParts[0].split(',')[1]);
    const height = parseFloat(pathParts[2].replace('v', ''));
    return Math.max(max, yStart + height);
  }, 0);

  // Añade un poco de margen al viewBox final
  const viewBoxWidth = maxToothX + 50;
  const viewBoxHeight = maxToothY + 50;


  return (
    <div ref={containerRef} className={`odontograma-container relative border border-raspberry-100 p-4 rounded-md bg-background shadow-sm`}>
      <h4 className={`text-xl font-semibold mb-4 text-raspberry-700`}>Odontograma Dental</h4>

      {/* Botón para resetear todo el odontograma (solo si no es readOnly) */}
      {!readOnly && Object.keys(odontogramState).length > 0 && (
        <button
          onClick={() => updateOdontogram({})}
          className={`absolute top-4 right-4 px-3 py-1 text-sm rounded-md bg-raspberry-100 text-raspberry-700 hover:bg-raspberry-50 transition-colors duration-200`}
        >
          Limpar Odontograma
        </button>
      )}

      <div className="svg-container overflow-auto w-full" style={{ maxHeight: '600px' }}>
        <svg viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`} className="w-full h-auto">
          {toothNumbers.map((tooth) => {
            const toothPathData = allToothPaths[`tooth-${tooth.num}`];
            if (!toothPathData) return null;

            const currentToothState = odontogramState[tooth.num];
            const isToothAbsent = currentToothState?.estado_geral === 'ausente';
            const toothMainStyle = getElementStyle(tooth.num);
            const toothX = parseFloat(toothPathData.path.split(' ')[0].replace('M', ''));
            const toothY = parseFloat(toothPathData.path.split(' ')[0].split(',')[1]); // Corrected Y coordinate extraction
            const toothSize = 30; // Hardcoded from getToothSvgPaths for text positioning

            return (
              <g key={`tooth-group-${tooth.num}`} className="tooth-group">
                {/* Superficies */}
                {!isToothAbsent && toothPathData.surfaces && Object.entries(toothPathData.surfaces).map(([surfaceName, surfacePath]) => {
                  const style = getElementStyle(tooth.num, surfaceName);
                  if (style.display === 'none') return null; // No renderizar si está oculto

                  return (
                    <path
                      key={`tooth-${tooth.num}-surface-${surfaceName}`}
                      id={`tooth-${tooth.num}-surface-${surfaceName}`}
                      d={surfacePath}
                      onClick={(e) => handleElementClick(e as React.MouseEvent<SVGPathElement>, `tooth-${tooth.num}-surface-${surfaceName}`)}
                      fill={style.fill} // Usar fill directamente del estilo
                      stroke={style.stroke}
                      strokeWidth={style.strokeWidth}
                      className={`${!readOnly ? 'cursor-pointer hover:opacity-80' : ''} transition-opacity duration-100`}
                    />
                  );
                })}

                {/* Diente completo (contorno o relleno si está ausente/implante/corona) */}
                <path
                  id={`tooth-${tooth.num}`}
                  d={toothPathData.path}
                  onClick={(e) => handleElementClick(e as React.MouseEvent<SVGPathElement>, `tooth-${tooth.num}`)}
                  fill={toothMainStyle.fill} // Usar el fill del diente principal (especialmente para ausente/implante)
                  stroke={toothMainStyle.stroke}
                  strokeWidth={toothMainStyle.strokeWidth}
                  className={`${!readOnly ? 'cursor-pointer hover:opacity-80' : ''} transition-opacity duration-100`}
                />

                {/* Indicadores visuales adicionales para estados generales que se dibujan SOBRE el diente */}
                {currentToothState?.estado_geral === 'ausente' && (
                  <>
                    {/* Dibujar una X grande sobre el diente ausente */}
                    <line x1={toothX} y1={toothY} x2={toothX + toothSize} y2={toothY + toothSize} stroke={svgColors.carie} strokeWidth="2" />
                    <line x1={toothX + toothSize} y1={toothY} x2={toothX} y2={toothY + toothSize} stroke={svgColors.carie} strokeWidth="2" />
                  </>
                )}
                {currentToothState?.estado_geral === 'implante' && (
                  <circle cx={toothX + toothSize / 2} cy={toothY + toothSize / 2} r="8" fill={svgColors.implante} />
                )}
                {currentToothState?.estado_geral === 'endodontia' && (
                  <circle cx={toothX + toothSize / 2} cy={toothY + toothSize / 2} r="6" fill="none" stroke={svgColors.endodontia} strokeWidth="2" />
                )}
                {currentToothState?.estado_geral === 'fractura' && (
                    <>
                        <line x1={toothX + toothSize / 4} y1={toothY + toothSize / 4} x2={toothX + toothSize * 3 / 4} y2={toothY + toothSize * 3 / 4} stroke={svgColors.fratura} strokeWidth="1.5" />
                        <line x1={toothX + toothSize * 3 / 4} y1={toothY + toothSize / 4} x2={toothX + toothSize / 4} y2={toothY + toothSize * 3 / 4} stroke={svgColors.fratura} strokeWidth="1.5" />
                    </>
                )}

                {/* Número del diente */}
                <text
                  x={toothX + toothSize / 2} // Centrado horizontalmente
                  y={toothY + toothSize + 15} // Debajo del diente
                  fontSize="12"
                  textAnchor="middle"
                  fill={svgColors.raspberry900} // Usar fill directo para texto en SVG
                >
                  {tooth.num}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Modal de Paleta */}
      <PaletteModal
        isOpen={isPaletteOpen}
        position={palettePosition}
        targetElementId={selectedElement}
        onMarking={handleMarking}
        onClose={() => {
          setIsPaletteOpen(false);
          setSelectedElement(null);
        }}
        odontogramState={odontogramState}
      />

      {/* Leyenda del Odontograma */}
      <OdontogramLegend />

      {/* Indicador de Solo Lectura */}
      {readOnly && (
        <div className={`absolute top-4 right-4 text-xs text-raspberry-900 bg-raspberry-50 px-2 py-1 rounded`}>
          Modo Visualização
        </div>
      )}
    </div>
  );
};

export default Odontograma;