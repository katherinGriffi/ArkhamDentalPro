import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

interface GestionDoctoresProps {
    // Keeping this prop as per your original code, though not explicitly used for re-fetching
    // in this specific component's logic based on the prompt.
    // If you intend for this component to re-fetch when its tab becomes active,
    // you would uncomment and implement that logic.
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
    const [loading, setLoading] = useState(true); // Manages initial data loading
    const [query, setQuery] = useState('');
    const [showAllDoctors, setShowAllDoctors] = useState(false); // Controls active/all filter

    // Form state (centralized for clarity and consistency)
    const [formData, setFormData] = useState({
        nombre: '',
        especialidad: '',
        telefono: '',
        correo: '',
        fecha_ingreso: '',
        porcentaje_comision: '',
        activo: true,
    });

    // Helper to update form data
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    // Function to fetch doctors using useCallback for memoization
    const fetchMedicos = useCallback(async () => {
        setLoading(true); // Set loading true when starting fetch
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
    }, []); // Empty dependency array as it doesn't depend on mutable state/props

    // Effect to fetch doctors on initial component mount
    useEffect(() => {
        fetchMedicos();
    }, [fetchMedicos]); // Dependency on the memoized fetchMedicos


    // Effect for filtering doctors based on state changes (query, medicos, showAllDoctors)
    useEffect(() => {
        let result = medicos;

        if (!showAllDoctors) {
            result = result.filter(m => m.activo);
        }

        if (query) {
            result = result.filter(m =>
                m.nombre.toLowerCase().includes(query.toLowerCase()) ||
                m.especialidad?.toLowerCase().includes(query.toLowerCase()) ||
                m.telefono?.toLowerCase().includes(query.toLowerCase()) ||
                m.correo?.toLowerCase().includes(query.toLowerCase())
            );
        }
        setFilteredMedicos(result);
    }, [query, medicos, showAllDoctors]);


    const resetForm = () => {
        setSelectedMedico(null);
        setFormData({
            nombre: '',
            especialidad: '',
            telefono: '',
            correo: '',
            fecha_ingreso: '',
            porcentaje_comision: '',
            activo: true,
        });
    };

    const handleEdit = (medico: Medico) => {
        setSelectedMedico(medico);
        setFormData({
            nombre: medico.nombre,
            especialidad: medico.especialidad || '',
            telefono: medico.telefono || '',
            correo: medico.correo || '',
            fecha_ingreso: medico.fecha_ingreso || '',
            porcentaje_comision: medico.porcentaje_comision?.toString() || '',
            activo: medico.activo,
        });
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        const isUpdating = !!selectedMedico;
        const toastId = toast.loading(isUpdating ? 'Actualizando médico...' : 'Agregando médico...');

        try {
            const medicoData = {
                nombre: formData.nombre,
                especialidad: formData.especialidad || null,
                telefono: formData.telefono || null,
                correo: formData.correo || null,
                fecha_ingreso: formData.fecha_ingreso || null,
                porcentaje_comision: formData.porcentaje_comision ? parseFloat(formData.porcentaje_comision) : null,
                activo: formData.activo,
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
            fetchMedicos(); // Re-fetch after saving
        } catch (error: any) {
            console.error('Error saving doctor:', error);
            toast.error(error.message || 'Error al guardar el médico', { id: toastId });
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('¿Está seguro de que desea eliminar este médico? Esta acción no se puede deshacer.')) return;

        const toastId = toast.loading('Eliminando médico...');
        try {
            const { error } = await supabase.from('medicos').delete().eq('id', id);
            if (error) throw error;
            toast.success('Médico eliminado exitosamente', { id: toastId });
            fetchMedicos(); // Re-fetch after deleting
            if (selectedMedico?.id === id) { // If the deleted doctor was the one selected for detail view
                setSelectedMedico(null);
                setIsDetailModalOpen(false);
            }
        } catch (error: any) {
            console.error('Error deleting doctor:', error);
            toast.error(error.message || 'Error al eliminar el médico', { id: toastId });
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
            <div className="bg-gradient-to-r from-raspberry-700 to-raspberry-900 p-6 text-white flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
                <div className="flex items-center flex-wrap gap-x-4 gap-y-2">
                    <h2 className="text-xl md:text-2xl font-bold">Gestión de Doctores</h2>
                    {/* Search Input */}
                    <div className="relative flex-grow min-w-[200px] sm:min-w-0"> {/* flex-grow allows it to expand */}
                        <input
                            type="text"
                            placeholder="Buscar médicos..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="w-full px-3 py-2 border border-white border-opacity-30 bg-white bg-opacity-10 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-raspberry-200 focus:border-raspberry-200 text-sm transition-colors duration-200 text-white placeholder-raspberry-100"
                        />
                        {query && (
                            <button
                                onClick={() => setQuery('')}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-white text-opacity-70 hover:text-white"
                                aria-label="Limpiar búsqueda"
                            >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        )}
                    </div>
                </div>
                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto mt-4 sm:mt-0">
                    {/* Toggle Active/All Button */}
                    <button
                        onClick={() => setShowAllDoctors(!showAllDoctors)}
                        className={`px-4 py-2 text-sm font-medium rounded-md flex items-center justify-center transition-colors duration-200 shadow-sm
                            ${showAllDoctors
                                ? 'bg-white text-raspberry-700 hover:bg-gray-100'
                                : 'bg-raspberry-100 text-raspberry-700 hover:bg-raspberry-200'
                            }`}
                        aria-pressed={showAllDoctors}
                    >
                        {/* Filter Icon */}
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" /></svg>
                        {showAllDoctors ? 'Activos' : 'Todos'}
                    </button>
                    {/* New Doctor Button */}
                    <button
                        onClick={() => {
                            resetForm();
                            setIsModalOpen(true);
                        }}
                        className="px-4 py-2 text-sm font-medium text-white rounded-md bg-raspberry-500 hover:bg-raspberry-700 transition-all duration-300 shadow-md flex items-center justify-center"
                    >
                        {/* Plus Icon */}
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                        Nuevo Médico
                    </button>
                </div>
            </div>

            {/* Doctors Table */}
            <div className="p-4 sm:p-6">
                <div className="overflow-x-auto bg-white rounded-lg shadow-md border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-raspberry-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-raspberry-700 uppercase tracking-wider">Nombre</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-raspberry-700 uppercase tracking-wider hidden sm:table-cell">Especialidad</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-raspberry-700 uppercase tracking-wider hidden md:table-cell">Teléfono</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-raspberry-700 uppercase tracking-wider hidden lg:table-cell">Correo</th>
                                <th scope="col" className="px-6 py-3 text-center text-xs font-semibold text-raspberry-700 uppercase tracking-wider hidden md:table-cell">Comisión</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-raspberry-700 uppercase tracking-wider">Estado</th>
                                <th scope="col" className="px-6 py-3 text-center text-xs font-semibold text-raspberry-700 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {/* Loading State */}
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-8 text-center text-sm text-gray-500">
                                        <div className="flex justify-center items-center">
                                            {/* Spinner Icon */}
                                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-raspberry-700 mr-3"></div>
                                            Cargando médicos...
                                        </div>
                                    </td>
                                </tr>
                                /* Empty State */
                            ) : filteredMedicos.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-8 text-center text-sm text-gray-500">
                                        <div className="flex flex-col items-center justify-center py-6">
                                            {/* Empty Icon */}
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-raspberry-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                            <p className="text-raspberry-900 font-semibold">{query ? 'No se encontraron médicos con ese criterio.' : 'No hay médicos registrados.'}</p>
                                            {!query && (
                                                <button
                                                    onClick={() => { resetForm(); setIsModalOpen(true); }}
                                                    className="mt-3 text-sm text-raspberry-700 hover:text-raspberry-900 font-medium underline"
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
                                        className="hover:bg-raspberry-50 cursor-pointer transition-colors duration-150"
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm font-medium text-gray-900">{medico.nombre}</div></td>
                                        <td className="px-6 py-4 whitespace-nowrap hidden sm:table-cell"><div className="text-sm text-gray-700">{medico.especialidad || '-'}</div></td>
                                        <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell"><div className="text-sm text-gray-700">{medico.telefono || '-'}</div></td>
                                        <td className="px-6 py-4 whitespace-nowrap hidden lg:table-cell"><div className="text-sm text-gray-700">{medico.correo || '-'}</div></td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center hidden md:table-cell"><div className="text-sm text-gray-700">{medico.porcentaje_comision ? `${medico.porcentaje_comision}%` : '-'}</div></td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                medico.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                            }`}>
                                                {medico.activo ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                            <div className="flex justify-center space-x-2">
                                                {/* Edit Button */}
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleEdit(medico); }}
                                                    className="text-raspberry-700 hover:text-raspberry-900 transition-colors duration-200 p-1 rounded-md hover:bg-raspberry-100"
                                                    aria-label={`Editar ${medico.nombre}`}
                                                >
                                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                                    <span className="hidden sm:inline ml-1">Editar</span>
                                                </button>
                                                {/* Delete Button */}
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDelete(medico.id); }}
                                                    className="text-red-600 hover:text-red-800 transition-colors duration-200 p-1 rounded-md hover:bg-red-50"
                                                    aria-label={`Eliminar ${medico.nombre}`}
                                                >
                                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                    <span className="hidden sm:inline ml-1">Eliminar</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal for Create/Edit Doctor */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-gray-900 bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-fade-in-down">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-raspberry-100">
                        {/* Modal Header */}
                        <div className="sticky top-0 px-6 py-4 border-b border-raspberry-100 bg-gradient-to-r from-raspberry-700 to-raspberry-900 z-10">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-bold text-white">
                                    {selectedMedico ? 'Editar Médico' : 'Nuevo Médico'}
                                </h3>
                                <button
                                    onClick={() => { setIsModalOpen(false); resetForm(); }}
                                    className="text-white hover:text-raspberry-100 transition-colors duration-200 p-1 rounded-full hover:bg-white hover:bg-opacity-20"
                                    aria-label="Cerrar modal"
                                >
                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                        </div>

                        {/* Modal Body - Form */}
                        <div className="px-6 py-6">
                            <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-6">
                                {/* Basic Info Section */}
                                <div className="space-y-4">
                                    <h4 className="text-md font-semibold text-raspberry-800 mb-2 border-b border-raspberry-100 pb-1">Información Básica</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo <span className="text-red-500">*</span></label>
                                            <input type="text" id="nombre" name="nombre" value={formData.nombre} onChange={handleInputChange} required className="w-full text-sm rounded-md border-gray-300 shadow-sm p-2 border focus:ring-raspberry-500 focus:border-raspberry-500" />
                                        </div>
                                        <div>
                                            <label htmlFor="especialidad" className="block text-sm font-medium text-gray-700 mb-1">Especialidad</label>
                                            <input type="text" id="especialidad" name="especialidad" value={formData.especialidad} onChange={handleInputChange} className="w-full text-sm rounded-md border-gray-300 shadow-sm p-2 border focus:ring-raspberry-500 focus:border-raspberry-500" />
                                        </div>
                                    </div>
                                </div>

                                {/* Contact Info Section */}
                                <div className="space-y-4">
                                    <h4 className="text-md font-semibold text-raspberry-800 mb-2 border-b border-raspberry-100 pb-1">Contacto</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label htmlFor="telefono" className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                                            <input type="tel" id="telefono" name="telefono" value={formData.telefono} onChange={handleInputChange} className="w-full text-sm rounded-md border-gray-300 shadow-sm p-2 border focus:ring-raspberry-500 focus:border-raspberry-500" />
                                        </div>
                                        <div>
                                            <label htmlFor="correo" className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
                                            <input type="email" id="correo" name="correo" value={formData.correo} onChange={handleInputChange} className="w-full text-sm rounded-md border-gray-300 shadow-sm p-2 border focus:ring-raspberry-500 focus:border-raspberry-500" />
                                        </div>
                                    </div>
                                </div>

                                {/* Clinic Info Section */}
                                <div className="space-y-4">
                                    <h4 className="text-md font-semibold text-raspberry-800 mb-2 border-b border-raspberry-100 pb-1">Información Clínica</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label htmlFor="fecha_ingreso" className="block text-sm font-medium text-gray-700 mb-1">Fecha de Ingreso</label>
                                            <input type="date" id="fecha_ingreso" name="fecha_ingreso" value={formData.fecha_ingreso} onChange={handleInputChange} className="w-full text-sm rounded-md border-gray-300 shadow-sm p-2 border focus:ring-raspberry-500 focus:border-raspberry-500" />
                                        </div>
                                        <div>
                                            <label htmlFor="porcentaje_comision" className="block text-sm font-medium text-gray-700 mb-1">% Comisión</label>
                                            <input type="number" step="0.01" id="porcentaje_comision" name="porcentaje_comision" value={formData.porcentaje_comision} onChange={handleInputChange} className="w-full text-sm rounded-md border-gray-300 shadow-sm p-2 border focus:ring-raspberry-500 focus:border-raspberry-500" />
                                        </div>
                                    </div>
                                </div>

                                {/* Status Section */}
                                <div>
                                    <label htmlFor="activo" className="block text-sm font-medium text-gray-700">Estado</label>
                                    <div className="mt-1 flex items-center">
                                        <input id="activo" name="activo" type="checkbox" checked={formData.activo} onChange={handleInputChange} className="h-4 w-4 text-raspberry-700 focus:ring-raspberry-500 border-gray-300 rounded" />
                                        <label htmlFor="activo" className="ml-2 block text-sm text-gray-900">Activo</label>
                                    </div>
                                </div>

                                {/* Modal Footer - Actions */}
                                <div className="pt-4 border-t border-raspberry-100 flex justify-end space-x-3">
                                    <button
                                        type="button"
                                        onClick={() => { setIsModalOpen(false); resetForm(); }}
                                        className="px-4 py-2 text-sm font-medium rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 text-sm font-medium text-white rounded-md bg-raspberry-700 hover:bg-raspberry-900 transition-all duration-300 shadow-md"
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
                <div className="fixed inset-0 bg-gray-900 bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-fade-in-down">
                    <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-raspberry-100">
                        {/* Detail Modal Header */}
                        <div className="sticky top-0 px-6 py-4 border-b border-raspberry-100 bg-gradient-to-r from-raspberry-700 to-raspberry-900 z-10">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-bold text-white">Detalles del Médico</h3>
                                <button
                                    onClick={() => setIsDetailModalOpen(false)}
                                    className="text-white hover:text-raspberry-100 transition-colors duration-200 p-1 rounded-full hover:bg-white hover:bg-opacity-20"
                                    aria-label="Cerrar detalles"
                                >
                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                        </div>
                        {/* Detail Modal Body */}
                        <div className="px-6 py-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <p className="text-sm font-medium text-gray-700"><strong>Nombre:</strong> <span className="text-gray-900">{selectedMedico.nombre}</span></p>
                                    <p className="text-sm font-medium text-gray-700"><strong>Especialidad:</strong> <span className="text-gray-900">{selectedMedico.especialidad || 'N/A'}</span></p>
                                    <p className="text-sm font-medium text-gray-700"><strong>Teléfono:</strong> <span className="text-gray-900">{selectedMedico.telefono || 'N/A'}</span></p>
                                    <p className="text-sm font-medium text-gray-700"><strong>Correo:</strong> <span className="text-gray-900">{selectedMedico.correo || 'N/A'}</span></p>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-sm font-medium text-gray-700"><strong>Fecha de Ingreso:</strong> <span className="text-gray-900">{selectedMedico.fecha_ingreso ? new Date(selectedMedico.fecha_ingreso).toLocaleDateString() : 'N/A'}</span></p>
                                    <p className="text-sm font-medium text-gray-700"><strong>Comisión:</strong> <span className="text-gray-900">{selectedMedico.porcentaje_comision ? `${selectedMedico.porcentaje_comision}%` : 'N/A'}</span></p>
                                    <p className="text-sm font-medium text-gray-700"><strong>Estado:</strong> <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${selectedMedico.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{selectedMedico.activo ? 'Activo' : 'Inactivo'}</span></p>
                                    <p className="text-sm font-medium text-gray-700"><strong>Registrado el:</strong> <span className="text-gray-900">{new Date(selectedMedico.created_at).toLocaleString()}</span></p>
                                </div>
                            </div>
                        </div>
                        {/* Detail Modal Footer */}
                        <div className="px-6 py-4 bg-gray-50 border-t border-raspberry-100 flex justify-end space-x-3">
                            <button
                                type="button"
                                onClick={() => {
                                    setIsDetailModalOpen(false);
                                    handleEdit(selectedMedico); // Open edit modal directly
                                }}
                                className="px-4 py-2 text-sm font-medium text-white rounded-md bg-raspberry-700 hover:bg-raspberry-900 transition-all duration-300 shadow-md"
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