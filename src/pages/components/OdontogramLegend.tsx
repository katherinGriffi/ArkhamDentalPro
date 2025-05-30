// src/components/odontogram/OdontogramLegend.tsx
import React from 'react';

// Ya no necesitamos la interfaz LegendColors ni importar un objeto de colores si usamos clases de Tailwind directamente.

const OdontogramLegend: React.FC = () => (
  <div className={`mt-6 p-4 rounded-lg shadow-inner bg-raspberry-50 border border-raspberry-100`}>
    <h4 className={`text-lg font-semibold mb-3 text-raspberry-700`}>Leyenda del Odontograma</h4>
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm">
      {/* Condiciones Generales */}
      <div>
        <h5 className={`font-bold mb-1 text-raspberry-900`}>Estados Generales</h5>
        <ul className="space-y-1">
          <li className="flex items-center"><span className="w-4 h-4 rounded-sm mr-2 bg-carie"></span> Cárie</li>
          <li className="flex items-center"><span className="w-4 h-4 rounded-sm mr-2 bg-ausente"></span> Ausente</li>
          <li className="flex items-center"><span className="w-4 h-4 rounded-sm mr-2 bg-implante"></span> Implante</li>
          <li className="flex items-center"><span className="w-4 h-4 rounded-sm mr-2 bg-coroa"></span> Coroa</li>
          {/* Para endodoncia y fractura, usamos `borderColor` directamente si la clase bg no aplica un color de borde */}
          <li className="flex items-center"><span className="w-4 h-4 rounded-sm mr-2 border border-endodontia" style={{ backgroundColor: 'transparent' }}></span> Endodoncia (línea)</li>
          <li className="flex items-center"><span className="w-4 h-4 rounded-sm mr-2 border border-fratura" style={{ backgroundColor: 'transparent' }}></span> Fratura (línea)</li>
          <li className="flex items-center"><span className="w-4 h-4 rounded-sm mr-2 bg-mobilidade-grado1"></span> Movilidad Grado 1</li>
          <li className="flex items-center"><span className="w-4 h-4 rounded-sm mr-2 bg-mobilidade-grado2"></span> Movilidad Grado 2</li>
          <li className="flex items-center"><span className="w-4 h-4 rounded-sm mr-2 bg-mobilidade-grado3"></span> Movilidad Grado 3</li>
        </ul>
      </div>

      {/* Restauraciones */}
      <div>
        <h5 className={`font-bold mb-1 text-raspberry-900`}>Restauraciones</h5>
        <ul className="space-y-1">
          <li className="flex items-center"><span className="w-4 h-4 rounded-sm mr-2 bg-restauracao-resina"></span> Resina</li>
          <li className="flex items-center"><span className="w-4 h-4 rounded-sm mr-2 bg-restauracao-amalgama"></span> Amálgama</li>
          <li className="flex items-center"><span className="w-4 h-4 rounded-sm mr-2 bg-restauracao-ceramica"></span> Cerámica</li>
        </ul>
      </div>

      {/* Otros */}
      <div>
        <h5 className={`font-bold mb-1 text-raspberry-900`}>Otros</h5>
        <ul className="space-y-1">
          <li className="flex items-center"><span className="w-4 h-4 rounded-sm mr-2 bg-selante"></span> Sellante</li>
          <li className="flex items-center"><span className="w-4 h-4 rounded-sm mr-2 bg-default-fill border border-gray-300"></span> Sano / Limpiar</li>
        </ul>
      </div>
    </div>
  </div>
);

export default OdontogramLegend;