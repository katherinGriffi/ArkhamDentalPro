// src/features/clinic_history/ClinicalHistoryOverviewPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase'; // Ajusta la ruta a tu configuración de Supabase
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';

// Define la interfaz para Paciente
interface Paciente {
  id: string;
  nombres: string;
  apellido_paterno: string;
  fecha_nacimiento?: string;
  celular?: string;
  correo?: string;
  sexo?: 'M' | 'F' | 'O' | null; // Añadido el campo sexo
}

const ClinicalHistoryOverviewPage: React.FC = () => {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [filteredPacientes, setFilteredPacientes] = useState<Paciente[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showAllPatients, setShowAllPatients] = useState(true); // Opcional: para filtrar pacientes activos/inactivos si tu tabla pacientes tiene `activo`

  // Colores de tu tema de Tailwind (se recomienda usar las clases de Tailwind directamente)
  const colors = {
    raspberry50: 'bg-raspberry-50', // #ffe7f3
    raspberry100: 'bg-raspberry-100', // #ffc4e0
    raspberry500: 'bg-raspberry-500', // #b0005a
    raspberry700: 'bg-raspberry-700', // #8b0046
    raspberry900: 'bg-raspberry-900', // #4c0026
    textRaspberry700: 'text-raspberry-700', // #8b0046
    textRaspberry500: 'text-raspberry-500', // #b0005a
    borderRaspberry100: 'border-raspberry-100', // #ffc4e0
    focusRaspberry500: 'focus:border-raspberry-500 focus:ring-raspberry-500', // #b0005a
    bgRaspberryLight: 'bg-[#F0E6ED]', // Similar a raspberry-50/100 para hover
    textRed800: 'text-red-800',
    bgRed100: 'bg-red-100',
    textGreen800: 'text-green-800',
    bgGreen100: 'bg-green-100',
    textGray700: 'text-gray-700',
    textGray900: 'text-gray-900',
    borderGray300: 'border-gray-300',
  };
  // Función auxiliar para calcular la edad
const calculateAge = (dob: string): number | null => {
  if (!dob) return null;
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

const getAvatar = useCallback((s: 'M' | 'F' | 'O' | null | undefined) => {
  switch (s) {
    case 'F': return "/avatars/female.png";
    case 'M': return "/avatars/male.png";
    default: return "/avatars/neutral.png";
  }
}, []);
  // Cargar la lista de pacientes
  const fetchPacientes = useCallback(async () => {
    setLoadingPatients(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('pacientes') // Asegúrate de que esta tabla exista
        .select('id, nombres, apellido_paterno, fecha_nacimiento, celular, correo, sexo') // Incluye 'sexo'
        .order('nombres', { ascending: true });

      if (error) throw error;
      setPacientes(data || []);
    } catch (err: any) {
      console.error('Error fetching patients:', err.message);
      setError('Erro ao carregar lista de pacientes.');
      toast.error('Erro ao carregar lista de pacientes.');
    } finally {
      setLoadingPatients(false);
    }
  }, []); // fetchPacientes no tiene dependencias externas aquí que requieran re-crearla

  useEffect(() => {
    fetchPacientes();
  }, [fetchPacientes]); // Se ejecuta al montar y cada vez que fetchPacientes cambia (que no debería si es useCallback sin deps)

  // Filtrar pacientes basado en el término de búsqueda y estado (activo/inactivo si aplica)
  useEffect(() => {
    let result = pacientes;
    // Si tu tabla pacientes tiene un campo `activo` para filtrar, descomenta esto:
    // if (!showAllPatients) {
    //   result = result.filter(p => p.activo);
    // }
    if (searchTerm) {
      result = result.filter(p =>
        p.nombres.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.celular?.includes(searchTerm) ||
        p.correo?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredPacientes(result);
  }, [searchTerm, pacientes /* , showAllPatients */]);


  return (
    // No necesitas el header de navegación de HomePage aquí, ya que HomePage lo provee.
    // Este componente es el contenido de una pestaña, y HomePage ya maneja ese header.
    // Solo se necesita el contenido de la pestaña, con su propio header interno para gestión de doctores.
    <div className={`bg-white rounded-lg shadow-xl overflow-hidden border ${colors.borderRaspberry100}`}>
      {/* Header with Search and Actions - Similar to GestionDoctores */}
      <div className={`bg-gradient-to-r from-${colors.raspberry700.replace('bg-', '')} to-${colors.raspberry900.replace('bg-', '')} p-6 text-white`}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div className="flex items-center">
            <h2 className="text-xl font-bold">Historial Clínico de Pacientes</h2>
            {/* Search Input */}
            <div className="ml-4 relative">
              <input
                type="text"
                placeholder="Buscar pacientes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`px-3 py-2 border ${colors.borderGray300} rounded-md shadow-sm focus:outline-none ${colors.focusRaspberry500} text-sm transition-colors duration-200 ${colors.textGray900}`}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-2.5 text-gray-400 hover:text-gray-600"
                  aria-label="Limpar pesquisa"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              )}
            </div>
          </div>
          {/* Action Buttons (e.g., Toggle Active/All if `activo` exists in patients table) */}
          {/* Si tu tabla pacientes tiene un campo `activo` para filtrar, descomenta esto */}
          {/* <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
            <button
              onClick={() => setShowAllPatients(!showAllPatients)}
              className={`px-4 py-2 text-sm font-medium rounded-md flex items-center transition-colors duration-200 ${
                showAllPatients
                  ? `bg-white ${colors.textRaspberry700} hover:${colors.bgRaspberryLight}`
                  : `${colors.bgRaspberryLight} ${colors.textRaspberry700} hover:${colors.raspberry100}`
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" /></svg>
              {showAllPatients ? 'Mostrar Solo Activos' : 'Mostrar Todos'}
            </button>
          </div> */}
        </div>
      </div>

      {/* Lista de Pacientes */}
      <div className="p-6">
        {loadingPatients ? (
          <div className="flex justify-center items-center p-10">
            <div className={`animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 ${colors.raspberry500}`}></div>
            <p className={`ml-4 ${colors.textRaspberry700}`}>Cargando pacientes...</p>
          </div>
        ) : error ? (
          <div className={`p-6 text-center text-red-600 ${colors.raspberry50} rounded-lg shadow`}>
            <p>{error}</p>
          </div>
        ) : pacientes.length === 0 ? (
          <div className={`p-10 text-center text-gray-500 ${colors.raspberry50} rounded-lg border ${colors.borderRaspberry100}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className={`mx-auto h-12 w-12 ${colors.textRaspberry500} mb-2`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354V4a1 1 0 00-1-1H3a1 1 0 00-1 1v16a1 1 0 001 1h16a1 1 0 001-1V8.646a1 1 0 00-.354-.707l-4.293-4.293a1 1 0 00-.707-.354z" />
            </svg>
            <p>No se encontraron pacientes en el sistema.</p>
          </div>
        ) : filteredPacientes.length === 0 ? (
          <div className={`p-10 text-center text-gray-500 ${colors.raspberry50} rounded-lg border ${colors.borderRaspberry100}`}>
            <p>No hay pacientes que coincidan con su búsqueda.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPacientes.map((patient) => (
              <div key={patient.id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-150">
                <div className="p-4 flex items-center space-x-4"> {/* Flexbox para avatar y texto */}
                  <img src={getAvatar(patient.sexo)} alt="Avatar del paciente" className="h-10 w-10 rounded-full object-cover border border-gray-200" />
                  <div>
                    <h3 className={`text-lg font-semibold ${colors.textRaspberry700}`}>{patient.nombres} {patient.apellido_paterno}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {patient.fecha_nacimiento && (
                        <>
                          Nacimiento: {new Date(patient.fecha_nacimiento).toLocaleDateString()}
                          {" "} {/* Espacio entre la fecha y la edad */}
                          (Edad: {calculateAge(patient.fecha_nacimiento)} años)
                        </>
                      )}
                    </p>
                    {patient.celular && <p className="text-sm text-gray-600">Teléfono: {patient.celular}</p>}
                    {patient.correo && <p className="text-sm text-gray-600">Email: {patient.correo}</p>}
                    <Link
                      to={`/historial-clinico/${patient.id}`}
                      className={`mt-3 inline-flex items-center px-4 py-2 text-sm font-medium text-white ${colors.raspberry500} rounded-md hover:${colors.raspberry700} transition-colors shadow`}
                    >
                      Ver Historial
                      <svg xmlns="http://www.w3.org/2000/svg" className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClinicalHistoryOverviewPage;