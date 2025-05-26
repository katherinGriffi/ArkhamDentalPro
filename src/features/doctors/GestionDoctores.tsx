import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';

interface GestionDoctoresProps {
  activeTab?: string;
}

interface Medico {
  id: string;
  nombre: string;
  especialidad?: string;
  telefono?: string;
  correo?: string;
  fecha_ingreso?: string;
  porcentaje_comision?: number;
  activo: boolean;
  created_at: string;
}

const GestionDoctores: React.FC<GestionDoctoresProps> = ({ activeTab }) => {
  const [medicos, setMedicos] = useState<Medico[]>([]);
  const [filteredMedicos, setFilteredMedicos] = useState<Medico[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedMedico, setSelectedMedico] = useState<Medico | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [showAllDoctors, setShowAllDoctors] = useState(false);

  // Form state
  const [nombre, setNombre] = useState('');
  const [especialidad, setEspecialidad] = useState('');
  const [telefono, setTelefono] = useState('');
  const [correo, setCorreo] = useState('');
  const [fechaIngreso, setFechaIngreso] = useState('');
  const [porcentajeComision, setPorcentajeComision] = useState('');
  const [activo, setActivo] = useState(true);

  useEffect(() => {
    if (activeTab === 'doctores') {
      fetchMedicos();
    }
  }, [activeTab]);

  useEffect(() => {
    let result = medicos;
    if (!showAllDoctors) {
      result = result.filter(m => m.activo);
    }
    if (query) {
      result = result.filter(m => 
        m.nombre.toLowerCase().includes(query.toLowerCase()) ||
        m.especialidad?.toLowerCase().includes(query.toLowerCase())
      );
    }
    setFilteredMedicos(result);
  }, [query, medicos, showAllDoctors]);

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
      console.error('Error fetching doctors:', error);
      toast.error('Error al cargar los médicos');
    } finally {
      setLoading(false);
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
    setActivo(true);
  };

  const handleEdit = (medico: Medico) => {
    setSelectedMedico(medico);
    setNombre(medico.nombre);
    setEspecialidad(medico.especialidad || '');
    setTelefono(medico.telefono || '');
    setCorreo(medico.correo || '');
    setFechaIngreso(medico.fecha_ingreso || '');
    setPorcentajeComision(medico.porcentaje_comision?.toString() || '');
    setActivo(medico.activo);
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const medicoData = {
        nombre,
        especialidad: especialidad || null,
        telefono: telefono || null,
        correo: correo || null,
        fecha_ingreso: fechaIngreso || null,
        porcentaje_comision: porcentajeComision ? parseFloat(porcentajeComision) : null,
        activo,
      };

      let error;
      if (selectedMedico) {
        // Update
        const { error: updateError } = await supabase
          .from('medicos')
          .update(medicoData)
          .eq('id', selectedMedico.id);
        error = updateError;
      } else {
        // Create
        const { error: insertError } = await supabase
          .from('medicos')
          .insert([medicoData]);
        error = insertError;
      }

      if (error) throw error;

      toast.success(selectedMedico ? 'Médico actualizado exitosamente' : 'Médico agregado exitosamente');
      setIsModalOpen(false);
      resetForm();
      fetchMedicos();
    } catch (error) {
      console.error('Error saving doctor:', error);
      toast.error('Error al guardar el médico');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Está seguro de que desea eliminar este médico?')) {
      try {
        const { error } = await supabase.from('medicos').delete().eq('id', id);
        if (error) throw error;
        toast.success('Médico eliminado exitosamente');
        fetchMedicos();
      } catch (error) {
        console.error('Error deleting doctor:', error);
        toast.error('Error al eliminar el médico');
      }
    }
  };

  const handleSelectMedico = (medico: Medico) => {
    setSelectedMedico(medico);
    setIsDetailModalOpen(true);
  };

  return (
    <div className="bg-gray-50 rounded-lg shadow-md overflow-hidden transition-all duration-300">
      <div className="bg-gradient-to-r from-[#801461] to-[#5A0D45] p-6 text-white">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div className="flex items-center">
            <h2 className="text-xl font-bold">Gestión de Doctores</h2>
            <div className="ml-4 relative">
              <input
                type="text"
                placeholder="Buscar médicos..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#B58AAD] focus:border-[#801461] text-sm transition-colors duration-200 text-gray-900" // Added text-gray-900 for input text color
              />
              {query && (
                <button
                  onClick={() => setQuery('')} // Corrected onClick for clear button
                  className="absolute right-2 top-2.5 text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
            <button
              onClick={() => setShowAllDoctors(!showAllDoctors)}
              className={`px-4 py-2 text-sm font-medium rounded-md flex items-center transition-colors duration-200 ${
                showAllDoctors
                  ? 'bg-white text-[#801461] hover:bg-gray-100'
                  : 'bg-[#F0E6ED] text-[#801461] hover:bg-[#E0CDD9]'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
              </svg>
              {showAllDoctors ? 'Mostrar Solo Activos' : 'Mostrar Todos'}
            </button>
            <button
              onClick={() => {
                resetForm();
                setIsModalOpen(true);
              }}
              className="px-4 py-2 text-sm font-medium text-white rounded-md bg-[#9D1C7A] hover:bg-[#801461] transition-all duration-300 shadow-md flex items-center justify-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nuevo Médico
            </button>
          </div>
        </div>
      </div>
  
      <div className="overflow-x-auto bg-white rounded-b-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-[#F8F5F7]">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#801461] uppercase tracking-wider">
                Nombre
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#801461] uppercase tracking-wider hidden sm:table-cell">
                Especialidad
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#801461] uppercase tracking-wider hidden md:table-cell">
                Teléfono
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#801461] uppercase tracking-wider hidden lg:table-cell">
                Correo
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#801461] uppercase tracking-wider hidden md:table-cell">
                Comisión
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#801461] uppercase tracking-wider">
                Estado
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#801461] uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                  <div className="flex justify-center items-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-[#801461] mr-2"></div>
                    Cargando médicos...
                  </div>
                </td>
              </tr>
            ) : filteredMedicos.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                  <div className="flex flex-col items-center justify-center py-6">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-[#B58AAD] mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-[#5A0D45]">No se encontraron médicos</p>
                    <button 
                      onClick={() => {
                        resetForm();
                        setIsModalOpen(true);
                      }}
                      className="mt-2 text-sm text-[#801461] hover:text-[#5A0D45] font-medium underline"
                    >
                      Agregar nuevo médico
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              filteredMedicos.map((medico) => (
                <tr
                  key={medico.id}
                  onClick={() => handleSelectMedico(medico)}
                  className="hover:bg-[#F8F5F7] cursor-pointer transition-colors duration-150"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{medico.nombre}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                    <div className="text-sm text-gray-900">{medico.especialidad || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                    <div className="text-sm text-gray-900">{medico.telefono || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                    <div className="text-sm text-gray-900">{medico.correo || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
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
                      className="text-[#801461] hover:text-[#5A0D45] mr-4 transition-colors duration-200 inline-flex items-center" // Changed to inline-flex
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      <span className="hidden sm:inline ml-1">Editar</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(medico.id);
                      }}
                      className="text-[#D94A64] hover:text-[#B53A50] inline-flex items-center" // Changed to inline-flex
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      <span className="hidden sm:inline ml-1">Eliminar</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
  
      {/* Modal para crear/editar médico */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-[#595959] bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-100 border border-[#E0CDD9]">
            <div className="px-6 py-4 border-b border-[#E0CDD9] bg-gradient-to-r from-[#801461] to-[#5A0D45]">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-white">
                  {selectedMedico ? 'Editar Médico' : 'Nuevo Médico'}
                </h3>
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    resetForm();
                  }}
                  className="text-white hover:text-[#E0CDD9] transition-colors duration-200"
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
                  <h4 className="text-sm font-medium text-[#5A0D45] mb-4 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 text-[#801461]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Información Básica
                  </h4>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label htmlFor="nombre" className="block text-sm font-medium text-[#5A0D45]">
                        Nombre Completo *
                      </label>
                      <input
                        type="text"
                        id="nombre"
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        className="mt-1 block w-full rounded-md border-[#E0CDD9] shadow-sm focus:border-[#801461] focus:ring-[#801461] sm:text-sm transition-colors duration-200"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="especialidad" className="block text-sm font-medium text-[#5A0D45]">
                        Especialidad
                      </label>
                      <input
                        type="text"
                        id="especialidad"
                        value={especialidad}
                        onChange={(e) => setEspecialidad(e.target.value)}
                        className="mt-1 block w-full rounded-md border-[#E0CDD9] shadow-sm focus:border-[#801461] focus:ring-[#801461] sm:text-sm transition-colors duration-200"
                      />
                    </div>
                  </div>
                </div>
  
                {/* Información de Contacto */}
                <div>
                  <h4 className="text-sm font-medium text-[#5A0D45] mb-4 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 text-[#801461]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Información de Contacto
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="telefono" className="block text-sm font-medium text-[#5A0D45]">
                        Teléfono
                      </label>
                      <input
                        type="tel"
                        id="telefono"
                        value={telefono}
                        onChange={(e) => setTelefono(e.target.value)}
                        className="mt-1 block w-full rounded-md border-[#E0CDD9] shadow-sm focus:border-[#801461] focus:ring-[#801461] sm:text-sm transition-colors duration-200"
                      />
                    </div>
                    <div>
                      <label htmlFor="correo" className="block text-sm font-medium text-[#5A0D45]">
                        Correo Electrónico
                      </label>
                      <input
                        type="email"
                        id="correo"
                        value={correo}
                        onChange={(e) => setCorreo(e.target.value)}
                        className="mt-1 block w-full rounded-md border-[#E0CDD9] shadow-sm focus:border-[#801461] focus:ring-[#801461] sm:text-sm transition-colors duration-200"
                      />
                    </div>
                  </div>
                </div>
  
                {/* Información Adicional */}
                <div>
                  <h4 className="text-sm font-medium text-[#5A0D45] mb-4 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 text-[#801461]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Información Adicional
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="fecha_ingreso" className="block text-sm font-medium text-[#5A0D45]">
                        Fecha de Ingreso
                      </label>
                      <input
                        type="date"
                        id="fecha_ingreso"
                        value={fechaIngreso}
                        onChange={(e) => setFechaIngreso(e.target.value)}
                        className="mt-1 block w-full rounded-md border-[#E0CDD9] shadow-sm focus:border-[#801461] focus:ring-[#801461] sm:text-sm transition-colors duration-200"
                      />
                    </div>
                    <div>
                      <label htmlFor="porcentaje_comision" className="block text-sm font-medium text-[#5A0D45]">
                        Porcentaje de Comisión (%)
                      </label>
                      <input
                        type="number"
                        id="porcentaje_comision"
                        value={porcentajeComision}
                        onChange={(e) => setPorcentajeComision(e.target.value)}
                        min="0"
                        max="100"
                        step="0.01"
                        className="mt-1 block w-full rounded-md border-[#E0CDD9] shadow-sm focus:border-[#801461] focus:ring-[#801461] sm:text-sm transition-colors duration-200"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Estado Activo/Inactivo */}
                <div className="flex items-center">
                  <input
                    id="activo"
                    name="activo"
                    type="checkbox"
                    checked={activo}
                    onChange={(e) => setActivo(e.target.checked)}
                    className="h-4 w-4 text-[#801461] focus:ring-[#5A0D45] border-gray-300 rounded"
                  />
                  <label htmlFor="activo" className="ml-2 block text-sm text-[#5A0D45]">
                    Activo
                  </label>
                </div>
  
                <div className="flex justify-end space-x-3 pt-4 border-t border-[#E0CDD9]">
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      resetForm();
                    }}
                    className="px-4 py-2 text-sm font-medium text-[#5A0D45] bg-[#F8F5F7] rounded-md hover:bg-[#E0CDD9] transition-colors duration-200"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white rounded-md bg-[#801461] hover:bg-[#5A0D45] transition-all duration-300 transform hover:scale-105 shadow-md"
                  >
                    Guardar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
  
      {/* Modal para ver detalles del médico */}
      {isDetailModalOpen && selectedMedico && (
        <div className="fixed inset-0 bg-[#595959] bg-opacity-80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full transform transition-all duration-300 scale-100 border border-[#E0CDD9]">
            <div className="px-6 py-4 border-b border-[#E0CDD9] bg-gradient-to-r from-[#801461] to-[#5A0D45]">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-white">
                  Detalles del Médico
                </h3>
                <button
                  onClick={() => setIsDetailModalOpen(false)}
                  className="text-white hover:text-[#E0CDD9] transition-colors duration-200"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
  
            <div className="px-6 py-4">
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-medium text-[#5A0D45] mb-4 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 text-[#801461]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Información Básica
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#F8F5F7] p-4 rounded-lg border border-[#E0CDD9]">
                    <div>
                      <p className="text-sm font-medium text-[#801461]">Nombre</p>
                      <p className="mt-1 text-sm text-gray-900">{selectedMedico.nombre}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#801461]">Especialidad</p>
                      <p className="mt-1 text-sm text-gray-900">{selectedMedico.especialidad || '-'}</p>
                    </div>
                  </div>
                </div>
  
                <div>
                  <h4 className="text-sm font-medium text-[#5A0D45] mb-4 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 text-[#801461]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Información de Contacto
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#F8F5F7] p-4 rounded-lg border border-[#E0CDD9]">
                    <div>
                      <p className="text-sm font-medium text-[#801461]">Teléfono</p>
                      <p className="mt-1 text-sm text-gray-900">{selectedMedico.telefono || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#801461]">Correo Electrónico</p>
                      <p className="mt-1 text-sm text-gray-900">{selectedMedico.correo || '-'}</p>
                    </div>
                  </div>
                </div>
  
                <div>
                  <h4 className="text-sm font-medium text-[#5A0D45] mb-4 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 text-[#801461]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Información Adicional
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#F8F5F7] p-4 rounded-lg border border-[#E0CDD9]">
                    <div>
                      <p className="text-sm font-medium text-[#801461]">Fecha de Ingreso</p>
                      <p className="mt-1 text-sm text-gray-900">{selectedMedico.fecha_ingreso || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#801461]">Porcentaje de Comisión</p>
                      <p className="mt-1 text-sm text-gray-900">
                        {selectedMedico.porcentaje_comision ? `${selectedMedico.porcentaje_comision}%` : '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#801461]">Estado</p>
                      <p className="mt-1 text-sm">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          selectedMedico.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {selectedMedico.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
  
              <div className="mt-6 flex justify-end space-x-3 pt-4 border-t border-[#E0CDD9]">
                <button
                  onClick={() => setIsDetailModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-[#5A0D45] bg-[#F8F5F7] rounded-md hover:bg-[#E0CDD9] transition-colors duration-200"
                >
                  Cerrar
                </button>
                <button
                  onClick={() => {
                    setIsDetailModalOpen(false);
                    handleEdit(selectedMedico);
                  }}
                  className="px-4 py-2 text-sm font-medium text-white rounded-md bg-[#801461] hover:bg-[#5A0D45] transition-all duration-300 transform hover:scale-105 shadow-md"
                >
                  Editar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestionDoctores;

