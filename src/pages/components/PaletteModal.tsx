// src/components/odontogram/PaletteModal.tsx
import React, { useEffect, useRef } from 'react';

// Interfaces (Mantener consistentes con Odontograma.tsx)
interface OdontogramData {
  [toothId: string]: {
    estado_geral?: string;
    superficies?: {
      [surface: string]: {
        estado?: string;
        material?: string;
      };
    };
    mobilidade?: string;
    notas?: string;
  };
}

interface PaletteModalProps {
  isOpen: boolean;
  position: { x: number; y: number };
  targetElementId: string | null;
  onMarking: (markingType: string, details?: any) => void;
  onClose: () => void;
  odontogramState: OdontogramData; // Para mostrar información actual del diente
}

const PaletteModal: React.FC<PaletteModalProps> = ({ isOpen, position, targetElementId, onMarking, onClose, odontogramState }) => {
  if (!isOpen || !targetElementId) return null;

  const modalRef = useRef<HTMLDivElement>(null);
  const isSurface = targetElementId.includes('-surface-');
  const toothIdRaw = targetElementId.split('-')[1]; // tooth-11 -> 11
  const toothId = toothIdRaw; // Ya es el ID numérico
  const surfaceName = isSurface ? targetElementId.split('-surface-')[1] : null;

  // Acceder a los datos actuales del diente/superficie para mostrar en el modal
  // const currentToothData = odontogramState[toothId]; // No se usa directamente en el render, solo para lógica.
  // const currentSurfaceData = surfaceName ? currentToothData?.superficies?.[surfaceName] : null; // No se usa.

  useEffect(() => {
    if (modalRef.current) {
      const { innerWidth, innerHeight } = window;
      const { offsetWidth, offsetHeight } = modalRef.current;
      let newX = position.x;
      let newY = position.y;

      // Adjust position to stay within viewport
      if (newX + offsetWidth > innerWidth - 20) {
        newX = innerWidth - offsetWidth - 20;
      }
      if (newY + offsetHeight > innerHeight - 20) {
        newY = innerHeight - offsetHeight - 20;
      }
      modalRef.current.style.left = `${Math.max(10, newX)}px`;
      modalRef.current.style.top = `${Math.max(10, newY)}px`;
    }
  }, [position, isOpen]);

  // Clase CSS para botones uniformes
  // Usamos clases de Tailwind directamente para los colores
  const buttonClass = `px-3 py-2 text-xs font-medium rounded-md shadow-sm transition-all duration-200 hover:opacity-80 w-full text-center text-white`;

  return (
    <div
      ref={modalRef}
      className={`fixed z-50 p-4 rounded-lg shadow-2xl transition-all duration-150 bg-background border border-raspberry-100`}
      style={{
        left: position.x,
        top: position.y,
        minWidth: '220px', // Aumentado ligeramente para más espacio
        maxWidth: '300px',
      }}
    >
      <div className="flex justify-between items-center pb-2 mb-3 border-b border-gray-200">
        <h4 className={`text-md font-semibold text-raspberry-700`}>
          Diente {toothId} {surfaceName ? `(${surfaceName})` : ''}
        </h4>
        <button onClick={onClose} className={`text-gray-500 hover:text-raspberry-500`}>
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      <div className="space-y-3">
        {/* Sección de Estado General del Diente (solo si no es superficie) */}
        {!isSurface && (
          <div>
            <h5 className={`text-sm font-bold text-raspberry-900 mb-2`}>Estado General</h5>
            <div className="grid grid-cols-2 gap-2"> {/* Columnas ajustadas para mejor spacing */}
              <button onClick={() => onMarking('ausente')} className={`${buttonClass} bg-ausente`}>Ausente</button>
              <button onClick={() => onMarking('implante')} className={`${buttonClass} bg-implante`}>Implante</button>
              <button onClick={() => onMarking('coroa')} className={`${buttonClass} bg-coroa`}>Coroa</button>
              <button onClick={() => onMarking('protese')} className={`${buttonClass} bg-default-stroke`}>Prótesis</button>
              <button onClick={() => onMarking('endodontia')} className={`${buttonClass} bg-endodontia`}>Endodoncia</button>
              <button onClick={() => onMarking('fractura')} className={`${buttonClass} bg-fratura`}>Fractura</button>
            </div>
          </div>
        )}

        {/* Sección de Condiciones de Superficie */}
        <div>
          <h5 className={`text-sm font-bold text-raspberry-900 mb-2`}>Condición{isSurface ? '' : ' de Superficie'}</h5>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => onMarking('carie')} className={`${buttonClass} bg-carie`}>Cárie</button>
            <button onClick={() => onMarking('restauracao', { material: 'resina' })} className={`${buttonClass} bg-restauracao-resina`}>Resina</button>
            <button onClick={() => onMarking('restauracao', { material: 'amalgama' })} className={`${buttonClass} bg-restauracao-amalgama`}>Amálgama</button>
            <button onClick={() => onMarking('restauracao', { material: 'ceramica' })} className={`${buttonClass} bg-restauracao-ceramica`}>Cerámica</button>
            <button onClick={() => onMarking('selante')} className={`${buttonClass} bg-selante`}>Sellante</button>
          </div>
        </div>

        {/* Sección de Movilidad (solo para diente completo) */}
        {!isSurface && (
          <div>
            <h5 className={`text-sm font-bold text-raspberry-900 mb-2`}>Movilidad</h5>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => onMarking('mobilidade', { grado: 'grado1' })} className={`${buttonClass} bg-mobilidade-grado1`}>Grado 1</button>
              <button onClick={() => onMarking('mobilidade', { grado: 'grado2' })} className={`${buttonClass} bg-mobilidade-grado2`}>Grado 2</button>
              <button onClick={() => onMarking('mobilidade', { grado: 'grado3' })} className={`${buttonClass} bg-mobilidade-grado3`}>Grado 3</button>
              <button onClick={() => onMarking('mobilidade', { grado: 'sano' })} className={`${buttonClass} bg-gray-200 text-gray-700`}>Sin Mov.</button>
            </div>
          </div>
        )}

        {/* Opciones de Limpieza/Remoción */}
        <div className="pt-3 border-t border-gray-200">
          <button onClick={() => onMarking('sano')} className={`${buttonClass} bg-default-fill border border-gray-300 text-raspberry-700`}>
            Marcar Sano / Limpiar
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaletteModal;