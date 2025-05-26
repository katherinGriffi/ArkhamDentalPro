import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';

interface GestionDoctoresProps {
  activeTab?: string; // Keep prop if used elsewhere, but initial load won't depend on it
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
  const [loading, setLoading] = useState(true); // Start loading initially
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

  // Function to fetch doctors
  const fetchMedicos = async () => {
    // Avoid starting load if already loading
    // setLoading(true); // setLoading is handled in the useEffect now
    try {
      const { data, error } = await supabase
        .from('medicos')
        .select('*')
        .order('nombre', { ascending: true });

      if (error) throw error;
      setMedicos(data || []);
    } catch (error) {
      console.error('Error fetching doctors:', error);
      toast.error('Error al cargar los médicos');
      setMedicos([]); // Clear data on error
    } finally {
      setLoading(false); // Stop loading regardless of outcome
    }
  };

  // **CORRECTION:** Fetch doctors on initial component mount
  useEffect(() => {
    setLoading(true); // Set loading true when starting fetch
    fetchMedicos();
  }, []); // Empty dependency array ensures this runs only once on mount

  // Keep the effect for activeTab if needed for other logic or re-fetching when tab changes
  // useEffect(() => {
  //   if (activeTab === 'doctores') {
  //     // Maybe re-fetch or perform other actions when this specific tab becomes active
  //     // fetchMedicos(); // Re-fetching here might be redundant if data is already loaded
  //   }
  // }, [activeTab]);

  // Effect for filtering doctors based on state changes
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
    // Add loading state for save operation
    const isUpdating = !!selectedMedico;
    const toastId = toast.loading(isUpdating ? 'Actualizando médico...' : 'Agregando médico...');

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

      toast.success(selectedMedico ? 'Médico actualizado exitosamente' : 'Médico agregado exitosamente', { id: toastId });
      setIsModalOpen(false);
      resetForm();
      // Re-fetch after saving
      setLoading(true);
      fetchMedicos();
    } catch (error) {
      console.error('Error saving doctor:', error);
      toast.error('Error al guardar el médico', { id: toastId });
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Está seguro de que desea eliminar este médico?')) {
      const toastId = toast.loading('Eliminando médico...');
      try {
        const { error } = await supabase.from('medicos').delete().eq('id', id);
        if (error) throw error;
        toast.success('Médico eliminado exitosamente', { id: toastId });
        // Re-fetch after deleting
        setLoading(true);
        fetchMedicos();
      } catch (error) {
        console.error('Error deleting doctor:', error);
        toast.error('Error al eliminar el médico', { id: toastId });
      }
    }
  };

  const handleSelectMedico = (medico: Medico) => {
    setSelectedMedico(medico);
    setIsDetailModalOpen(true);
  };

  // --- Render --- 
  return (
    <div className="bg-gray-50 rounded-lg shadow-md overflow-hidden transition-all duration-300">
      {/* Header with Search and Actions */}
      <div className="bg-gradient-to-r from-[#801461] to-[#5A0D45] p-6 text-white">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div className="flex items-center">
            <h2 className="text-xl font-bold">Gestión de Doctores</h2>
            {/* Search Input */}
            <div className="ml-4 relative">
              <input
                type="text"
                placeholder="Buscar médicos..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#B58AAD] focus:border-[#801461] text-sm transition-colors duration-200 text-gray-900"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="absolute right-2 top-2.5 text-gray-400 hover:text-gray-600"
                  aria-label="Clear search"
                >
                  {/* Clear Icon */}
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              )}
            </div>
          </div>
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
            {/* Toggle Active/All Button */}
            <button
              onClick={() => setShowAllDoctors(!showAllDoctors)}
              className={`px-4 py-2 text-sm font-medium rounded-md flex items-center transition-colors duration-200 ${
                showAllDoctors
                  ? 'bg-white text-[#801461] hover:bg-gray-100'
                  : 'bg-[#F0E6ED] text-[#801461] hover:bg-[#E0CDD9]'
              }`}
            >
              {/* Filter Icon */}
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" /></svg>
              {showAllDoctors ? 'Mostrar Solo Activos' : 'Mostrar Todos'}
            </button>
            {/* New Doctor Button */}
            <button
              onClick={() => {
                resetForm();
                setIsModalOpen(true);
              }}
              className="px-4 py-2 text-sm font-medium text-white rounded-md bg-[#9D1C7A] hover:bg-[#801461] transition-all duration-300 shadow-md flex items-center justify-center"
            >
              {/* Plus Icon */}
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Nuevo Médico
            </button>
          </div>
        </div>
      </div>

      {/* Doctors Table */}
      <div className="overflow-x-auto bg-white rounded-b-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-[#F8F5F7]">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#801461] uppercase tracking-wider">Nombre</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#801461] uppercase tracking-wider hidden sm:table-cell">Especialidad</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#801461] uppercase tracking-wider hidden md:table-cell">Teléfono</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#801461] uppercase tracking-wider hidden lg:table-cell">Correo</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#801461] uppercase tracking-wider hidden md:table-cell">Comisión</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#801461] uppercase tracking-wider">Estado</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#801461] uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {/* Loading State */}
            {loading ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                  <div className="flex justify-center items-center">
                    {/* Spinner Icon */}
                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-[#801461] mr-2"></div>
                    Cargando médicos...
                  </div>
                </td>
              </tr>
            /* Empty State */
            ) : filteredMedicos.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                  <div className="flex flex-col items-center justify-center py-6">
                    {/* Empty Icon */}
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-[#B58AAD] mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <p className="text-[#5A0D45]">{query ? 'No se encontraron médicos con ese criterio.' : 'No hay médicos registrados.'}</p>
                    {!query && (
                      <button
                        onClick={() => { resetForm(); setIsModalOpen(true); }}
                        className="mt-2 text-sm text-[#801461] hover:text-[#5A0D45] font-medium underline"
                      >
                        Agregar nuevo médico
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            /* Data Rows */
            ) : (
              filteredMedicos.map((medico) => (
                <tr
                  key={medico.id}
                  onClick={() => handleSelectMedico(medico)}
                  className="hover:bg-[#F8F5F7] cursor-pointer transition-colors duration-150"
                >
                  <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm font-medium text-gray-900">{medico.nombre}</div></td>
                  <td className="px-6 py-4 whitespace-nowrap hidden sm:table-cell"><div className="text-sm text-gray-900">{medico.especialidad || '-'}</div></td>
                  <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell"><div className="text-sm text-gray-900">{medico.telefono || '-'}</div></td>
                  <td className="px-6 py-4 whitespace-nowrap hidden lg:table-cell"><div className="text-sm text-gray-900">{medico.correo || '-'}</div></td>
                  <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell"><div className="text-sm text-gray-900">{medico.porcentaje_comision ? `${medico.porcentaje_comision}%` : '-'}</div></td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      medico.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {medico.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {/* Edit Button */}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleEdit(medico); }}
                      className="text-[#801461] hover:text-[#5A0D45] mr-4 transition-colors duration-200 inline-flex items-center"
                      aria-label={`Editar ${medico.nombre}`}
                    >
                      {/* Edit Icon */}
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      <span className="hidden sm:inline ml-1">Editar</span>
                    </button>
                    {/* Delete Button */}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(medico.id); }}
                      className="text-[#D94A64] hover:text-[#B53A50] transition-colors duration-200 inline-flex items-center"
                      aria-label={`Eliminar ${medico.nombre}`}
                    >
                      {/* Delete Icon */}
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      <span className="hidden sm:inline ml-1">Eliminar</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal for Create/Edit Doctor */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-[#595959] bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-100 border border-[#E0CDD9]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[#E0CDD9] bg-gradient-to-r from-[#801461] to-[#5A0D45]">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-white">
                  {selectedMedico ? 'Editar Médico' : 'Nuevo Médico'}
                </h3>
                <button
                  onClick={() => { setIsModalOpen(false); resetForm(); }}
                  className="text-white hover:text-[#E0CDD9] transition-colors duration-200"
                  aria-label="Cerrar modal"
                >
                  {/* Close Icon */}
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>

            {/* Modal Body - Form */}
            <div className="px-6 py-4">
              <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-6">
                {/* Basic Info Section */}
                <div>
                  <h4 className="text-sm font-medium text-[#801461] mb-2 border-b pb-1">Información Básica</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo <span className="text-red-500">*</span></label>
                      <input type="text" id="nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} required className="w-full text-sm rounded-md border-gray-300 shadow-sm p-2 border focus:ring-[#B58AAD] focus:border-[#801461]" />
                    </div>
                    <div>
                      <label htmlFor="especialidad" className="block text-sm font-medium text-gray-700 mb-1">Especialidad</label>
                      <input type="text" id="especialidad" value={especialidad} onChange={(e) => setEspecialidad(e.target.value)} className="w-full text-sm rounded-md border-gray-300 shadow-sm p-2 border focus:ring-[#B58AAD] focus:border-[#801461]" />
                    </div>
                  </div>
                </div>

                {/* Contact Info Section */}
                <div>
                  <h4 className="text-sm font-medium text-[#801461] mb-2 border-b pb-1">Contacto</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="telefono" className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                      <input type="tel" id="telefono" value={telefono} onChange={(e) => setTelefono(e.target.value)} className="w-full text-sm rounded-md border-gray-300 shadow-sm p-2 border focus:ring-[#B58AAD] focus:border-[#801461]" />
                    </div>
                    <div>
                      <label htmlFor="correo" className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
                      <input type="email" id="correo" value={correo} onChange={(e) => setCorreo(e.target.value)} className="w-full text-sm rounded-md border-gray-300 shadow-sm p-2 border focus:ring-[#B58AAD] focus:border-[#801461]" />
                    </div>
                  </div>
                </div>

                {/* Clinic Info Section */}
                <div>
                  <h4 className="text-sm font-medium text-[#801461] mb-2 border-b pb-1">Información Clínica</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="fechaIngreso" className="block text-sm font-medium text-gray-700 mb-1">Fecha de Ingreso</label>
                      <input type="date" id="fechaIngreso" value={fechaIngreso} onChange={(e) => setFechaIngreso(e.target.value)} className="w-full text-sm rounded-md border-gray-300 shadow-sm p-2 border focus:ring-[#B58AAD] focus:border-[#801461]" />
                    </div>
                    <div>
                      <label htmlFor="porcentajeComision" className="block text-sm font-medium text-gray-700 mb-1">% Comisión</label>
                      <input type="number" step="0.01" id="porcentajeComision" value={porcentajeComision} onChange={(e) => setPorcentajeComision(e.target.value)} className="w-full text-sm rounded-md border-gray-300 shadow-sm p-2 border focus:ring-[#B58AAD] focus:border-[#801461]" />
                    </div>
                  </div>
                </div>

                {/* Status Section */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Estado</label>
                  <div className="mt-1 flex items-center">
                    <input id="activo" name="activo" type="checkbox" checked={activo} onChange={(e) => setActivo(e.target.checked)} className="h-4 w-4 text-[#801461] focus:ring-[#B58AAD] border-gray-300 rounded" />
                    <label htmlFor="activo" className="ml-2 block text-sm text-gray-900">Activo</label>
                  </div>
                </div>

                {/* Modal Footer - Actions */}
                <div className="pt-4 border-t border-[#E0CDD9] flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => { setIsModalOpen(false); resetForm(); }}
                    className="px-4 py-2 text-sm font-medium rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white rounded-md bg-[#9D1C7A] hover:bg-[#801461] transition-all duration-300 shadow-md"
                  >
                    {selectedMedico ? 'Guardar Cambios' : 'Agregar Médico'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal for Doctor Details */}
      {isDetailModalOpen && selectedMedico && (
        <div className="fixed inset-0 bg-[#595959] bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-100 border border-[#E0CDD9]">
            {/* Detail Modal Header */}
            <div className="px-6 py-4 border-b border-[#E0CDD9] bg-gradient-to-r from-[#801461] to-[#5A0D45]">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-white">Detalles del Médico</h3>
                <button
                  onClick={() => setIsDetailModalOpen(false)}
                  className="text-white hover:text-[#E0CDD9] transition-colors duration-200"
                  aria-label="Cerrar detalles"
                >
                  {/* Close Icon */}
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>
            {/* Detail Modal Body */}
            <div className="px-6 py-4 space-y-4">
              <p><strong>Nombre:</strong> {selectedMedico.nombre}</p>
              <p><strong>Especialidad:</strong> {selectedMedico.especialidad || 'No especificada'}</p>
              <p><strong>Teléfono:</strong> {selectedMedico.telefono || 'No especificado'}</p>
              <p><strong>Correo:</strong> {selectedMedico.correo || 'No especificado'}</p>
              <p><strong>Fecha de Ingreso:</strong> {selectedMedico.fecha_ingreso ? new Date(selectedMedico.fecha_ingreso).toLocaleDateString() : 'No especificada'}</p>
              <p><strong>Comisión:</strong> {selectedMedico.porcentaje_comision ? `${selectedMedico.porcentaje_comision}%` : 'No especificada'}</p>
              <p><strong>Estado:</strong> <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${selectedMedico.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{selectedMedico.activo ? 'Activo' : 'Inactivo'}</span></p>
              <p><strong>Registrado el:</strong> {new Date(selectedMedico.created_at).toLocaleString()}</p>
            </div>
            {/* Detail Modal Footer */}
            <div className="px-6 py-3 bg-gray-50 border-t border-[#E0CDD9] flex justify-end space-x-3">
               <button
                  type="button"
                  onClick={() => {
                    setIsDetailModalOpen(false);
                    handleEdit(selectedMedico); // Open edit modal directly
                  }}
                  className="px-4 py-2 text-sm font-medium text-white rounded-md bg-[#9D1C7A] hover:bg-[#801461] transition-all duration-300 shadow-md"
                >
                  Editar Médico
                </button>
              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="px-4 py-2 text-sm font-medium rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors duration-200"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestionDoctores;

