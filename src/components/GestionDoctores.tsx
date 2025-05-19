import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface Medico {
  id: number;
  nombre: string;
  activo: boolean;
  especialidad?: string;
  telefono?: string;
  correo?: string;
  fecha_ingreso?: string;
  porcentaje_comision?: number;
}

interface GestionDoctoresProps {
  activeTab: string;
}

const colors = {
  primary: {
    50: '#F5E8F2',
    100: '#EBD1E5',
    200: '#D7A3CB',
    300: '#C374B1',
    400: '#AF4697',
    500: '#4E023B',
    600: '#3E0230',
    700: '#2F0125',
    800: '#1F011A',
    900: '#10000D'
  }
};

const GestionDoctores: React.FC<GestionDoctoresProps> = ({ activeTab }) => {
  const [medicos, setMedicos] = useState<Medico[]>([]);
  const [selectedMedico, setSelectedMedico] = useState<Medico | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [showAllDoctors, setShowAllDoctors] = useState(false);

  // Form states
  const [nombre, setNombre] = useState('');
  const [especialidad, setEspecialidad] = useState('');
  const [telefono, setTelefono] = useState('');
  const [correo, setCorreo] = useState('');
  const [fechaIngreso, setFechaIngreso] = useState('');
  const [porcentajeComision, setPorcentajeComision] = useState('');

  const filteredMedicos = useMemo(() => {
    return medicos.filter(medico => {
      const matchesQuery = query === '' || 
        medico.nombre.toLowerCase().includes(query.toLowerCase()) ||
        (medico.especialidad?.toLowerCase().includes(query.toLowerCase())) ||
        (medico.telefono?.includes(query)) ||
        (medico.correo?.toLowerCase().includes(query.toLowerCase()));
      
      return showAllDoctors ? matchesQuery : (medico.activo && matchesQuery);
    });
  }, [medicos, query, showAllDoctors]);

  const fetchMedicos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('medicos')
        .select('*')
        .order('nombre', { ascending: true });

      if (error) throw error;
      setMedicos(data || []);
    } catch (error) {
      console.error('Error al cargar médicos:', error);
      toast.error('Error al cargar lista de médicos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedicos();
  }, []);

  const handleSelectMedico = (medico: Medico) => {
    setSelectedMedico(medico);
    setIsDetailModalOpen(true);
  };

  const handleEdit = (medico: Medico) => {
    setSelectedMedico(medico);
    setNombre(medico.nombre);
    setEspecialidad(medico.especialidad || '');
    setTelefono(medico.telefono || '');
    setCorreo(medico.correo || '');
    setFechaIngreso(medico.fecha_ingreso || '');
    setPorcentajeComision(medico.porcentaje_comision?.toString() || '');
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    console.log('Delete attempt - ID:', id, 'Type:', typeof id);
    
    // More thorough ID validation
    if (typeof id !== 'number' || isNaN(id) || id <= 0) {
      console.error('Invalid ID detected:', id);
      toast.error('ID de médico inválido');
      return;
    }

    if (!window.confirm('¿Está seguro de eliminar este médico?')) return;

    try {
      console.log('Attempting to delete record with ID:', id);
      const { error } = await supabase
        .from('medicos')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Médico eliminado correctamente');
      fetchMedicos();
      if (selectedMedico?.id === id) {
        setSelectedMedico(null);
      }
    } catch (error: any) {
      console.error('Error al eliminar médico:', error);
      toast.error(error.message || 'Error al eliminar médico');
    }
  };

  const handleSave = async () => {
    try {
      const medicoData = {
        nombre,
        especialidad,
        telefono,
        correo,
        fecha_ingreso: fechaIngreso,
        porcentaje_comision: porcentajeComision ? parseFloat(porcentajeComision) : null,
        activo: true
      };

      if (selectedMedico) {
        const { error } = await supabase
          .from('medicos')
          .update(medicoData)
          .eq('id', selectedMedico.id);

        if (error) throw error;
        toast.success('Médico actualizado correctamente');
      } else {
        const { error } = await supabase
          .from('medicos')
          .insert([medicoData]);

        if (error) throw error;
        toast.success('Médico registrado correctamente');
      }

      setIsModalOpen(false);
      resetForm();
      fetchMedicos();
    } catch (error: any) {
      console.error('Error al guardar médico:', error);
      toast.error(error.message || 'Error al guardar médico');
    }
  };

  const resetForm = () => {
    setSelectedMedico(null);
    setNombre('');
    setEspecialidad('');
    setTelefono('');
    setCorreo('');
    setFechaIngreso('');
    setPorcentajeComision('');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="px-4 py-6 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
              <button
                onClick={() => setShowAllDoctors(!showAllDoctors)}
                className={`px-4 py-2 text-sm font-medium rounded-md ${
                  showAllDoctors
                    ? 'text-white hover:bg-[#6a1252]'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                style={showAllDoctors ? { backgroundColor: colors.primary[500] } : {}}
              >
                {showAllDoctors ? 'Mostrar Solo Activos' : 'Mostrar Todos'}
              </button>
              <button
                onClick={() => {
                  resetForm();
                  setIsModalOpen(true);
                }}
                className="px-4 py-2 text-sm font-medium text-white rounded-md"
                style={{ backgroundColor: colors.primary[500] }}
              >
                Nuevo Médico
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nombre
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Especialidad
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Teléfono
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Correo
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Comisión
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                      Cargando médicos...
                    </td>
                  </tr>
                ) : filteredMedicos.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                      No se encontraron médicos
                    </td>
                  </tr>
                ) : (
                  filteredMedicos.map((medico) => (
                    <tr
                      key={medico.id}
                      onClick={() => handleSelectMedico(medico)}
                      className="hover:bg-gray-50 cursor-pointer"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{medico.nombre}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{medico.especialidad || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{medico.telefono || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{medico.correo || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{medico.porcentaje_comision ? `${medico.porcentaje_comision}%` : '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          medico.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {medico.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(medico);
                          }}
                          style={{ color: colors.primary[500] }}
                          className="hover:text-[#6a1252] mr-4"
                        >
                          Editar
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            console.log('Delete button clicked - Medico:', medico);
                            const medicoId = Number(medico.id);
                            console.log('Converted ID:', medicoId, 'Type:', typeof medicoId);
                            if (!isNaN(medicoId) && medicoId > 0) {
                              handleDelete(medicoId);
                            } else {
                              console.error('Invalid medico ID:', medico.id);
                              toast.error('ID de médico inválido');
                            }
                          }}
                          className="text-red-600 hover:text-red-900"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal para crear/editar médico */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200" style={{ backgroundColor: colors.primary[500] }}>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-white">
                  {selectedMedico ? 'Editar Médico' : 'Nuevo Médico'}
                </h3>
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    resetForm();
                  }}
                  className="text-white hover:text-gray-200"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="px-6 py-4">
              <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-6">
                {/* Información Básica */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-4">Información Básica</h4>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label htmlFor="nombre" className="block text-sm font-medium text-gray-700">
                        Nombre Completo *
                      </label>
                      <input
                        type="text"
                        id="nombre"
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#801461] focus:ring-[#801461] sm:text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="especialidad" className="block text-sm font-medium text-gray-700">
                        Especialidad
                      </label>
                      <input
                        type="text"
                        id="especialidad"
                        value={especialidad}
                        onChange={(e) => setEspecialidad(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#801461] focus:ring-[#801461] sm:text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Información de Contacto */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-4">Información de Contacto</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="telefono" className="block text-sm font-medium text-gray-700">
                        Teléfono
                      </label>
                      <input
                        type="tel"
                        id="telefono"
                        value={telefono}
                        onChange={(e) => setTelefono(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#801461] focus:ring-[#801461] sm:text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="correo" className="block text-sm font-medium text-gray-700">
                        Correo Electrónico
                      </label>
                      <input
                        type="email"
                        id="correo"
                        value={correo}
                        onChange={(e) => setCorreo(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#801461] focus:ring-[#801461] sm:text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Información Laboral */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-4">Información Laboral</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="fechaIngreso" className="block text-sm font-medium text-gray-700">
                        Fecha de Ingreso *
                      </label>
                      <input
                        type="date"
                        id="fechaIngreso"
                        value={fechaIngreso}
                        onChange={(e) => setFechaIngreso(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#801461] focus:ring-[#801461] sm:text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="porcentajeComision" className="block text-sm font-medium text-gray-700">
                        Porcentaje de Comisión (%)
                      </label>
                      <input
                        type="number"
                        id="porcentajeComision"
                        value={porcentajeComision}
                        onChange={(e) => setPorcentajeComision(e.target.value)}
                        min="0"
                        max="100"
                        step="0.01"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#801461] focus:ring-[#801461] sm:text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Botones de acción */}
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      resetForm();
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#801461]"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    style={{ backgroundColor: colors.primary[500] }}
                    className="px-4 py-2 text-sm font-medium text-white border border-transparent rounded-md hover:bg-[#6a1252] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#801461]"
                  >
                    {selectedMedico ? 'Actualizar' : 'Guardar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestionDoctores; 