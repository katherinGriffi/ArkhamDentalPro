import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';
import {Chart as ChartJS,  ArcElement,  Tooltip,  Legend,  CategoryScale,  LinearScale,  BarElement,  Title} from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
);
interface GestionPacienteProps {
  activeTab?: string;
}

interface Paciente {
  id: number;
  dni?: string;
  nombres: string;
  apellido_paterno: string;
  apellido_materno?: string;
  fecha_nacimiento?: string;
  sexo: 'M' | 'F' | 'O';
  celular?: string;
  telefono_fijo?: string;
  correo?: string;
  direccion?: string;
  ciudad?: string;
  distrito?: string;
  grupo_sanguineo?: string;
  alergias?: string;
  enfermedades_cronicas?: string;
  medicamentos_actuales?: string;
  seguro_medico?: string;
  estado_civil?: string;
  ocupacion?: string;
  referencia?: string;
  historial_dental?: string;
  activo: boolean;
}

const GestionPaciente: React.FC<GestionPacienteProps> = ({ activeTab }) => {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPaciente, setSelectedPaciente] = useState<Paciente | null>(null);
  const [query, setQuery] = useState('');
  const [showAllPatients, setShowAllPatients] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [distritosOptions, setDistritosOptions] = useState<string[]>([]);
  const [ciudadesOptions, setCiudadesOptions] = useState<string[]>([]);
  // Formulario centralizado
  const [formData, setFormData] = useState<Omit<Paciente, 'id' | 'activo'>>({
    dni: '',
    nombres: '',
    apellido_paterno: '',
    apellido_materno: '',
    fecha_nacimiento: '',
    sexo: 'M',
    celular: '',
    telefono_fijo: '',
    correo: '',
    direccion: '',
    distrito: '',
    grupo_sanguineo: '',
    alergias: '',
    enfermedades_cronicas: '',
    medicamentos_actuales: '',
    seguro_medico: '',
    estado_civil: '',
    ocupacion: '',
    referencia: '',
    historial_dental: ''
  });

  // Función para calcular edad
  const calcularEdad = (fechaNacimiento: string) => {
    if (!fechaNacimiento) return 'N/A';
    
    const fechaNac = new Date(fechaNacimiento);
    const hoy = new Date();
    
    let edad = hoy.getFullYear() - fechaNac.getFullYear();
    const mes = hoy.getMonth() - fechaNac.getMonth();
    
    if (mes < 0 || (mes === 0 && hoy.getDate() < fechaNac.getDate())) {
      edad--;
    }
    
    return `${edad} años`;
  };

  // Funciones de análisis de datos
  const getAgeGroups = () => {
    const groups = [
      { range: '0-18 años', min: 0, max: 18, count: 0 },
      { range: '19-30 años', min: 19, max: 30, count: 0 },
      { range: '31-45 años', min: 31, max: 45, count: 0 },
      { range: '46-60 años', min: 46, max: 60, count: 0 },
      { range: '60+ años', min: 61, max: 200, count: 0 }
    ];

    pacientes.forEach(paciente => {
      if (!paciente.fecha_nacimiento) return;
      
      const birthDate = new Date(paciente.fecha_nacimiento);
      const age = new Date().getFullYear() - birthDate.getFullYear();
      
      const group = groups.find(g => age >= g.min && age <= g.max);
      if (group) group.count++;
    });

    return groups;
  };

  const getDistrictDistribution = () => {
    const districts: Record<string, number> = {};
    
    pacientes.forEach(paciente => {
      const dist = paciente.distrito || 'No especificado';
      districts[dist] = (districts[dist] || 0) + 1;
    });

    return Object.entries(districts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  };

  const getGenderDistribution = () => {
    const genders = {
      'M': 0,
      'F': 0,
      'O': 0
    };

    pacientes.forEach(paciente => {
      genders[paciente.sexo]++;
    });

    return Object.entries(genders)
      .map(([type, count]) => ({ type, count }));
  };

  const getCiudadDistribution = () => {
    const ciudades: Record<string, number> = {};
    
    pacientes.forEach(paciente => {
      const dist = paciente.ciudad|| 'No especificado';
      ciudades[dist] = (ciudades[dist] || 0) + 1;
    });

    return Object.entries(ciudades)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  };

  useEffect(() => {
    if (activeTab === 'pacientes') {
      fetchPacientes();
    }
  }, [activeTab]);

  const fetchPacientes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('pacientes')
        .select('*')
        .order('nombres', { ascending: true });
      if (error) throw error;
      setPacientes(data || []);
    } catch (error) {
      console.error('Error al cargar pacientes:', error);
      toast.error('Error al cargar lista de pacientes');
    } finally {
      setLoading(false);
    }
  };

  const fetchDistritos = async () => {
    return [
      'Ancón',       'Ate',       'Barranco',       'Breña',       'Carabayllo',       'Chaclacayo', 
      'Chorrillos',       'Cieneguilla',       'Comas',       'El Agustino',       'Independencia',       'Jesús María', 
      'La Molina',       'La Victoria',       'Lima (Cercado)',       'Lince',       'Los Olivos', 
      'Lurigancho-Chosica',       'Lurín',       'Magdalena del Mar',       'Miraflores',       'Pachacámac',       'Pucusana', 
      'Pueblo Libre',       'Puente Piedra',       'Punta Hermosa',       'Punta Negra',       'Rímac', 
      'San Bartolo',       'San Borja', 
      'San Isidro',       'San Juan de Lurigancho', 
      'San Juan de Miraflores',       'San Luis', 
      'San Martín de Porres',       'San Miguel', 
      'Santa Anita',       'Santa María del Mar', 
      'Santa Rosa',       'Santiago de Surco', 
      'Surquillo',       'Villa El Salvador', 
      'Villa María del Triunfo',       'Surco', 
      'Otros'
    ].sort((a, b) => a.localeCompare(b));
  };
 
  const fetchCiudades = async () => {
    return [
      'Abancay',      'Arequipa',      'Ayacucho',      'Cajamarca',      'Callao',      'Cerro de Pasco',      'Chachapoyas',
      'Chiclayo',      'Cusco',      'Huacho',
      'Huancavelica',      'Huancayo',      'Huaraz',      'Huánuco',      'Ica',
      'Iquitos',      'Lima',      'Moquegua',      'Moyobamba',      'Piura',      'Puerto Maldonado',      'Pucallpa',
      'Puno',      'Tacna',      'Trujillo',      'Tumbes'
    ].sort((a, b) => a.localeCompare(b));
  };
  
  useEffect(() => {
    const loadOptions = async () => {
      const [distritos, ciudades] = await Promise.all([
        fetchDistritos(),
        fetchCiudades()
      ]);
      setDistritosOptions(distritos);
      setCiudadesOptions(ciudades);
    };
    loadOptions();
  }, []);

  useEffect(() => {
    fetchPacientes();
  }, []);
  

  // Manejar selección de paciente
  const handleSelectPaciente = (paciente: Paciente) => {
    setSelectedPaciente(paciente);
    setIsDetailModalOpen(true);
  };

  // Manejar cambios en los inputs
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Manejar submit del formulario
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSave();
  };

  // Guardar paciente
  const handleSave = async () => {
    try {
      setLoading(true);

      const pacienteData = {
        ...formData,
        activo: true
      };

      let result;
      if (selectedPaciente) {
        // Actualizar
        const { data, error } = await supabase
          .from('pacientes')
          .update(pacienteData)
          .eq('id', selectedPaciente.id)
          .select();
        if (error) throw error;
        result = data;
        toast.success('Paciente actualizado correctamente');
      } else {
        // Crear nuevo
        const { data, error } = await supabase
          .from('pacientes')
          .insert([pacienteData])
          .select();
        if (error) {
          if (error.code === '23505') {
            throw new Error('Ya existe un paciente con este DNI');
          }
          throw error;
        }
        result = data;
        toast.success('Paciente guardado correctamente');
      }

      fetchPacientes();
      resetForm();
      setIsModalOpen(false);
    } catch (error: any) {
      console.error('Error al guardar paciente:', error);
      toast.error(error.message || 'Error al guardar paciente');
    } finally {
      setLoading(false);
    }
  };

  // Editar paciente
  const handleEdit = (paciente: Paciente) => {
    setFormData({
      dni: paciente.dni || '',
      nombres: paciente.nombres,
      apellido_paterno: paciente.apellido_paterno,
      apellido_materno: paciente.apellido_materno || '',
      fecha_nacimiento: paciente.fecha_nacimiento || '',
      sexo: paciente.sexo || 'M',
      celular: paciente.celular || '',
      telefono_fijo: paciente.telefono_fijo || '',
      correo: paciente.correo || '',
      direccion: paciente.direccion || '',
      ciudad: paciente.ciudad || '',
      distrito: paciente.distrito || '',
      grupo_sanguineo: paciente.grupo_sanguineo || '',
      alergias: paciente.alergias || '',
      enfermedades_cronicas: paciente.enfermedades_cronicas || '',
      medicamentos_actuales: paciente.medicamentos_actuales || '',
      seguro_medico: paciente.seguro_medico || '',
      estado_civil: paciente.estado_civil || '',
      ocupacion: paciente.ocupacion || '',
      referencia: paciente.referencia || '',
      historial_dental: paciente.historial_dental || ''
    });
    setSelectedPaciente(paciente);
    setIsModalOpen(true);
  };

  // Eliminar paciente
  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Está seguro de eliminar este paciente?')) return;
    try {
      const { error } = await supabase.from('pacientes').delete().eq('id', id);
      if (error) throw error;
      toast.success('Paciente eliminado correctamente');
      fetchPacientes();
      if (selectedPaciente?.id === id) {
        setSelectedPaciente(null);
      }
    } catch (error: any) {
      console.error('Error al eliminar paciente:', error);
      toast.error(error.message || 'Error al eliminar paciente');
    }
  };

  // Limpiar formulario
  const resetForm = () => {
    setFormData({
      dni: '',
      nombres: '',
      apellido_paterno: '',
      apellido_materno: '',
      fecha_nacimiento: '',
      sexo: 'M',
      celular: '',
      telefono_fijo: '',
      correo: '',
      direccion: '',
      ciudad: '',
      distrito: '',
      grupo_sanguineo: '',
      alergias: '',
      enfermedades_cronicas: '',
      medicamentos_actuales: '',
      seguro_medico: '',
      estado_civil: '',
      ocupacion: '',
      referencia: '',
      historial_dental: ''
    });
    setSelectedPaciente(null);
  };

  // Filtrar pacientes
  const filteredPacientes = useMemo(() => {
    return pacientes.filter((paciente) => {
      const searchTerm = query.toLowerCase();
      return (
        paciente.nombres.toLowerCase().includes(searchTerm) ||
        paciente.apellido_paterno.toLowerCase().includes(searchTerm) ||
        (paciente.apellido_materno?.toLowerCase()?.includes(searchTerm) || false) ||
        (paciente.dni?.toLowerCase()?.includes(searchTerm) || false) ||
        (paciente.celular?.toLowerCase()?.includes(searchTerm) || false) ||
        (paciente.correo?.toLowerCase()?.includes(searchTerm) || false)
      );
    });
  }, [pacientes, query]);

  const pacientesToShow = showAllPatients
    ? filteredPacientes
    : filteredPacientes.slice(0, 15);

  const toggleShowAllPatients = () => {
    setShowAllPatients(!showAllPatients);
  };

  return (
    <div className="bg-gray-50 rounded-lg shadow-md overflow-hidden transition-all duration-300">
      <div className="bg-gradient-to-r from-[#801461] to-[#5A0D45] p-6 text-white">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold">Gestión de Pacientes</h2>
            <span className="bg-white text-[#5A0D45] px-2 py-1 rounded-full text-xs font-semibold">
              {pacientes.filter(p => p.activo).length} activos
            </span>
          </div>
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
            Nuevo Paciente
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 py-6 mx-auto max-w-7xl sm:px-6 lg:px-8">
        {/* Search and Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Buscar pacientes..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <button
            onClick={toggleShowAllPatients}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center justify-center"
          >
            {showAllPatients ? 'Mostrar Menos' : 'Mostrar Todos'}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-white rounded-b-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-[#F8F5F7]">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#801461] uppercase tracking-wider">
                Paciente
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#801461] uppercase tracking-wider hidden sm:table-cell">
                DNI
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#801461] uppercase tracking-wider hidden md:table-cell">
                Edad
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#801461] uppercase tracking-wider hidden lg:table-cell">
                Teléfono
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#801461] uppercase tracking-wider hidden xl:table-cell">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {pacientes.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                  <div className="flex flex-col items-center justify-center py-6">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-[#B58AAD] mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <p className="text-[#5A0D45]">No se encontraron pacientes</p>
                    <button 
                      onClick={() => {
                        resetForm();
                        setIsModalOpen(true);
                      }}
                      className="mt-2 text-sm text-[#801461] hover:text-[#5A0D45] font-medium underline"
                    >
                      Agregar nuevo paciente
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              pacientesToShow.map((paciente) => (
                <tr 
                  key={paciente.id} 
                  className="hover:bg-[#F8F5F7] transition-colors duration-150 cursor-pointer"
                  onClick={() => handleSelectPaciente(paciente)}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {`${paciente.nombres} ${paciente.apellido_paterno} ${paciente.apellido_materno || ''}`}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden sm:table-cell">
                    {paciente.dni || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">
                    {paciente.fecha_nacimiento ? calcularEdad(paciente.fecha_nacimiento) : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden lg:table-cell">
                    {paciente.celular || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium hidden xl:table-cell">
                    <div className="flex justify-center space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(paciente);
                        }}
                        className="text-primary-600 hover:text-primary-900"
                        style={{ color: '#801461' }}
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(paciente.id);
                        }}
                        className="text-red-600 hover:text-red-900"
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal para crear/editar paciente */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-[#595959] bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col border border-[#E0CDD9]">
            {/* Encabezado sticky */}
            <div className="sticky top-0 px-6 py-4 border-b border-[#E0CDD9] bg-gradient-to-r from-[#801461] to-[#5A0D45] z-10 flex justify-between items-center">
              <h2 className="text-lg font-medium text-white flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                {selectedPaciente ? 'Editar Paciente' : 'Nuevo Paciente'}
              </h2>
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

            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Información Personal */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-[#5A0D45]">Información Personal</h3>
                  <div>
                    <label className="block text-sm font-medium text-[#5A0D45]">DNI *</label>
                    <input
                      type="text"
                      name="dni"
                      value={formData.dni}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-[#E0CDD9] shadow-sm focus:border-[#801461] focus:ring-[#801461]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#5A0D45]">Nombres *</label>
                    <input
                      type="text"
                      name="nombres"
                      value={formData.nombres}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-[#E0CDD9] shadow-sm focus:border-[#801461] focus:ring-[#801461]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#5A0D45]">Apellido Paterno *</label>
                    <input
                      type="text"
                      name="apellido_paterno"
                      value={formData.apellido_paterno}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-[#E0CDD9] shadow-sm focus:border-[#801461] focus:ring-[#801461]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#5A0D45]">Apellido Materno</label>
                    <input
                      type="text"
                      name="apellido_materno"
                      value={formData.apellido_materno || ''}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-[#E0CDD9] shadow-sm focus:border-[#801461] focus:ring-[#801461]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#5A0D45]">Fecha de Nacimiento </label>
                    <input
                      type="date"
                      name="fecha_nacimiento"
                      value={formData.fecha_nacimiento || ''}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-[#E0CDD9] shadow-sm focus:border-[#801461] focus:ring-[#801461]"
                      
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#5A0D45]">Sexo *</label>
                    <select
                      name="sexo"
                      value={formData.sexo}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-[#E0CDD9] shadow-sm focus:border-[#801461] focus:ring-[#801461]"
                      required
                    >
                      <option value="M">Masculino</option>
                      <option value="F">Femenino</option>
                      <option value="O">Otro</option>
                    </select>
                  </div>
                </div>

                {/* Información de Contacto */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-[#5A0D45]">Información de Contacto</h3>
                  <div>
                    <label className="block text-sm font-medium text-[#5A0D45]">Celular</label>
                    <input
                      type="tel"
                      name="celular"
                      value={formData.celular || ''}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-[#E0CDD9] shadow-sm focus:border-[#801461] focus:ring-[#801461]"
                      
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#5A0D45]">Teléfono Fijo</label>
                    <input
                      type="tel"
                      name="telefono_fijo"
                      value={formData.telefono_fijo || ''}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-[#E0CDD9] shadow-sm focus:border-[#801461] focus:ring-[#801461]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#5A0D45]">Correo Electrónico</label>
                    <input
                      type="email"
                      name="correo"
                      value={formData.correo || ''}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-[#E0CDD9] shadow-sm focus:border-[#801461] focus:ring-[#801461]"
                    />
                  </div>
                     {/* Ciudad (primero) */}
                     <div>
                    <label className="block text-sm font-medium text-[#5A0D45]">Ciudad *</label>
                    <select
                      name="ciudad"
                      value={formData.ciudad || ''}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-[#E0CDD9] shadow-sm focus:border-[#801461] focus:ring-[#801461]"
                      required
                    >
                      <option value="">Seleccione una ciudad</option>
                      {ciudadesOptions.map((ciudad) => (
                        <option key={ciudad} value={ciudad}>
                          {ciudad}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Distrito (condicional) */}
                  {formData.ciudad === 'Lima' ? (
                    <div>
                      <label className="block text-sm font-medium text-[#5A0D45]">Distrito</label>
                      <select
                        name="distrito"
                        value={formData.distrito || ''}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-[#E0CDD9] shadow-sm focus:border-[#801461] focus:ring-[#801461]"
                        
                      >
                        <option value="">Seleccione un distrito</option>
                        {distritosOptions.map((distrito) => (
                          <option key={distrito} value={distrito}>
                            {distrito}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-[#5A0D45]">
                        {formData.ciudad ? `Distrito de ${formData.ciudad}` : 'Distrito'}
                      </label>
                      <input
                        type="text"
                        name="distrito"
                        value={formData.distrito || ''}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-[#E0CDD9] shadow-sm focus:border-[#801461] focus:ring-[#801461]"
                        //required={!!formData.ciudad}
                        disabled={!formData.ciudad}
                      />
                    </div>
                  )}

                  {/* Dirección (último) */}
                  <div>
                    <label className="block text-sm font-medium text-[#5A0D45]">Dirección</label>
                    <input
                      type="text"
                      name="direccion"
                      value={formData.direccion || ''}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-[#E0CDD9] shadow-sm focus:border-[#801461] focus:ring-[#801461]"
                      
                    />  
                  </div>
                </div>
              </div>                     

              {/* Información Médica */}
              <div className="mt-6 space-y-4">
                <h3 className="text-lg font-medium text-[#5A0D45]">Información Médica</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-[#5A0D45]">Grupo Sanguíneo</label>
                    <input
                      type="text"
                      name="grupo_sanguineo"
                      value={formData.grupo_sanguineo || ''}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-[#E0CDD9] shadow-sm focus:border-[#801461] focus:ring-[#801461]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#5A0D45]">Alergias</label>
                    <textarea
                      name="alergias"
                      value={formData.alergias || ''}
                      onChange={handleInputChange}
                      rows={2}
                      className="mt-1 block w-full rounded-md border-[#E0CDD9] shadow-sm focus:border-[#801461] focus:ring-[#801461]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#5A0D45]">Enfermedades Crónicas</label>
                    <textarea
                      name="enfermedades_cronicas"
                      value={formData.enfermedades_cronicas || ''}
                      onChange={handleInputChange}
                      rows={2}
                      className="mt-1 block w-full rounded-md border-[#E0CDD9] shadow-sm focus:border-[#801461] focus:ring-[#801461]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#5A0D45]">Medicamentos Actuales</label>
                    <textarea
                      name="medicamentos_actuales"
                      value={formData.medicamentos_actuales || ''}
                      onChange={handleInputChange}
                      rows={2}
                      className="mt-1 block w-full rounded-md border-[#E0CDD9] shadow-sm focus:border-[#801461] focus:ring-[#801461]"
                    />
                  </div>
                </div>
              </div>

              {/* Información Adicional */}
              <div className="mt-6 space-y-4">
                <h3 className="text-lg font-medium text-[#5A0D45]">Información Adicional</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-[#5A0D45]">Seguro Médico</label>
                    <input
                      type="text"
                      name="seguro_medico"
                      value={formData.seguro_medico || ''}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-[#E0CDD9] shadow-sm focus:border-[#801461] focus:ring-[#801461]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#5A0D45]">Estado Civil</label>
                    <select
                      name="estado_civil"
                      value={formData.estado_civil || ''}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-[#E0CDD9] shadow-sm focus:border-[#801461] focus:ring-[#801461]"
                    >
                      <option value="">Seleccionar...</option>
                      <option value="Soltero">Soltero(a)</option>
                      <option value="Casado">Casado(a)</option>
                      <option value="Divorciado">Divorciado(a)</option>
                      <option value="Viudo">Viudo(a)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#5A0D45]">Ocupación</label>
                    <input
                      type="text"
                      name="ocupacion"
                      value={formData.ocupacion || ''}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-[#E0CDD9] shadow-sm focus:border-[#801461] focus:ring-[#801461]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#5A0D45]">Referencia</label>
                    <input
                      type="text"
                      name="referencia"
                      value={formData.referencia || ''}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-[#E0CDD9] shadow-sm focus:border-[#801461] focus:ring-[#801461]"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-[#5A0D45]">Historial Dental</label>
                    <textarea
                      name="historial_dental"
                      value={formData.historial_dental || ''}
                      onChange={handleInputChange}
                      rows={3}
                      className="mt-1 block w-full rounded-md border-[#E0CDD9] shadow-sm focus:border-[#801461] focus:ring-[#801461]"
                    />
                  </div>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="mt-6 flex justify-end space-x-3 border-t border-[#E0CDD9] pt-4">
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
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white rounded-md bg-[#801461] hover:bg-[#5A0D45] transition-all duration-300 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Guardando...' : selectedPaciente ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detalles del Paciente */}
      {isDetailModalOpen && selectedPaciente && (
        <div className="fixed inset-0 bg-[#801461] bg-opacity-80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-[#E0CDD9]">
            <div className="sticky top-0 px-6 py-4 border-b border-[#E0CDD9] bg-gradient-to-r from-[#801461] to-[#5A0D45] z-10">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-medium text-white">Detalles del Paciente</h2>
                <button
                  onClick={() => setIsDetailModalOpen(false)}
                  className="text-white hover:text-[#E0CDD9] transition-colors duration-200"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Información Personal */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-[#5A0D45]">Información Personal</h3>
                  <div className="bg-[#F8F5F7] rounded-lg p-4 space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-[#5A0D45]">DNI</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedPaciente.dni || '-'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#5A0D45]">Nombres Completos</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {`${selectedPaciente.nombres} ${selectedPaciente.apellido_paterno} ${selectedPaciente.apellido_materno || ''}`}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#5A0D45]">Fecha de Nacimiento</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {selectedPaciente.fecha_nacimiento
                          ? new Date(selectedPaciente.fecha_nacimiento).toLocaleDateString()
                          : '-'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#5A0D45]">Edad</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {selectedPaciente.fecha_nacimiento ? calcularEdad(selectedPaciente.fecha_nacimiento) : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#5A0D45]">Sexo</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {selectedPaciente.sexo === 'M'
                          ? 'Masculino'
                          : selectedPaciente.sexo === 'F'
                          ? 'Femenino'
                          : 'Otro'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Información de Contacto */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-[#5A0D45]">Información de Contacto</h3>
                  <div className="bg-[#F8F5F7] rounded-lg p-4 space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-[#5A0D45]">Celular</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedPaciente.celular || '-'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#5A0D45]">Teléfono Fijo</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedPaciente.telefono_fijo || '-'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#5A0D45]">Correo Electrónico</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedPaciente.correo || '-'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#5A0D45]">Dirección</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedPaciente.direccion || '-'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#5A0D45]">Ciudad</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedPaciente.ciudad || '-'}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#5A0D45]">Distrito</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedPaciente.distrito || '-'}</p>
                    </div>
                  </div>
                </div>

                {/* Información Médica */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-[#5A0D45]">Información Médica</h3>
                  <div className="bg-[#F8F5F7] rounded-lg p-4 space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-[#5A0D45]">Grupo Sanguíneo</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedPaciente.grupo_sanguineo || '-'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#5A0D45]">Alergias</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedPaciente.alergias || '-'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#5A0D45]">Enfermedades Crónicas</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {selectedPaciente.enfermedades_cronicas || '-'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#5A0D45]">Medicamentos Actuales</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {selectedPaciente.medicamentos_actuales || '-'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Información Adicional */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-[#5A0D45]">Información Adicional</h3>
                  <div className="bg-[#F8F5F7] rounded-lg p-4 space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-[#5A0D45]">Seguro Médico</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedPaciente.seguro_medico || '-'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#5A0D45]">Estado Civil</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedPaciente.estado_civil || '-'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#5A0D45]">Ocupación</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedPaciente.ocupacion || '-'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#5A0D45]">Referencia</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedPaciente.referencia || '-'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#5A0D45]">Historial Dental</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedPaciente.historial_dental || '-'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="mt-6 flex justify-end space-x-3 border-t border-[#E0CDD9] pt-4">
                <button
                  type="button"
                  onClick={() => setIsDetailModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-[#5A0D45] bg-[#F8F5F7] rounded-md hover:bg-[#E0CDD9] transition-colors duration-200"
                >
                  Cerrar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleEdit(selectedPaciente);
                    setIsDetailModalOpen(false);
                    setIsModalOpen(true);
                  }}
                  className="px-4 py-2 text-sm font-medium text-white rounded-md bg-[#801461] hover:bg-[#5A0D45] transition-all duration-300 shadow-md"
                >
                  Editar Paciente
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Análisis de Datos */}
      <div className="px-4 py-6 mx-auto max-w-7xl sm:px-6 lg:px-8">
  <h3 className="text-lg font-medium text-[#5A0D45] mb-6">Análisis de Pacientes</h3>

  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
    {/* Gráfico de distribución por edad */}
    <div className="bg-white p-4 rounded-lg shadow">
      <h4 className="text-md font-medium text-[#801461] mb-3">Distribución por Edad</h4>
      <div className="h-48">
        <Bar 
          data={{
            labels: getAgeGroups().map(g => g.range),
            datasets: [{
              label: 'Pacientes',
              data: getAgeGroups().map(g => g.count),
              backgroundColor: [
                'rgba(128, 20, 97, 0.7)',
                'rgba(90, 13, 69, 0.7)',
                'rgba(181, 138, 173, 0.7)',
                'rgba(224, 205, 217, 0.7)',
                'rgba(248, 245, 247, 0.7)'
              ],
              borderColor: [
                'rgba(128, 20, 97, 1)',
                'rgba(90, 13, 69, 1)',
                'rgba(181, 138, 173, 1)',
                'rgba(224, 205, 217, 1)',
                'rgba(248, 245, 247, 1)'
              ],
              borderWidth: 1
            }]
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: false
              },
              tooltip: {
                callbacks: {
                  label: function(context) {
                    return `${context.parsed.y} pacientes (${Math.round(context.parsed.y / pacientes.length * 100)}%)`;
                  }
                }
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  stepSize: 1
                }
              }
            }
          }}
        />
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
        {getAgeGroups().map(group => (
          <div key={group.range} className="flex items-center">
            <span   className="inline-block w-3 h-3 mr-1" 
  style={{
    backgroundColor: "rgba(128, 20, 97, ${0.3 + 0.7 * (group.count / Math.max(...getAgeGroups().map(g => g.count))})"
  }}
></span>
            <span>{group.range}:</span>
            <span className="font-medium">{group.count}</span>
          </div>
        ))}
      </div>
    </div>

    {/* Gráfico de distribución por ciudad - Versión Donut */}
    <div className="bg-white p-4 rounded-lg shadow">
      <h4 className="text-md font-medium text-[#801461] mb-3">Distribución por Ciudad</h4>
      <div className="h-48">
        <Doughnut
          data={{
            labels: getCiudadDistribution().map(d => d.name),
            datasets: [{
              data: getCiudadDistribution().map(d => d.count),
              backgroundColor: [
                'rgba(128, 20, 97, 0.7)',
                'rgba(90, 13, 69, 0.7)',
                'rgba(181, 138, 173, 0.7)',
                'rgba(224, 205, 217, 0.7)',
                'rgba(248, 245, 247, 0.7)',
                'rgba(157, 28, 122, 0.7)',
                'rgba(104, 16, 79, 0.7)'
              ],
              borderColor: '#fff',
              borderWidth: 1
            }]
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            cutout: '60%',  // Esto crea el efecto donut (hueco central)
            plugins: {
              legend: {
                position: 'right',
                labels: {
                  boxWidth: 12,
                  padding: 16
                }
              },
              tooltip: {
                callbacks: {
                  label: function(context) {
                    const label = context.label || '';
                    const value = context.raw || 0;
                    const percentage = Math.round(value / pacientes.length * 100);
                    return `${label}: ${value} (${percentage}%)`;
                  }
                }
              }
            }
          }}
        />
      </div>
    </div>
      

    {/* Gráfico de distribución por distrito - Versión columnas mejorada */}
    <div className="bg-white p-4 rounded-lg shadow">
      <h4 className="text-md font-medium text-[#801461] mb-3">Distribución por Distrito</h4>
      <div className="h-48">
        <Bar
          data={{
            labels: getDistrictDistribution().map(d => d.name),
            datasets: [{
              label: 'Pacientes',
              data: getDistrictDistribution().map(d => d.count),
              backgroundColor: [
                'rgba(128, 20, 97, 0.7)',
                'rgba(90, 13, 69, 0.7)',
                'rgba(181, 138, 173, 0.7)',
                'rgba(224, 205, 217, 0.7)',
                'rgba(248, 245, 247, 0.7)',
                'rgba(157, 28, 122, 0.7)',
                'rgba(104, 16, 79, 0.7)'
              ],
              borderColor: [
                'rgba(128, 20, 97, 1)',
                'rgba(90, 13, 69, 1)',
                'rgba(181, 138, 173, 1)',
                'rgba(224, 205, 217, 1)',
                'rgba(248, 245, 247, 1)',
                'rgba(157, 28, 122, 1)',
                'rgba(104, 16, 79, 1)'
              ],
              borderWidth: 1,
              borderRadius: 4, // Bordes redondeados en las barras
              borderSkipped: false // Bordes en todos los lados de las barras
            }]
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: false
              },
              tooltip: {
                callbacks: {
                  label: function(context) {
                    const label = context.label || '';
                    const value = context.parsed.y || 0;
                    const percentage = Math.round(value / pacientes.length * 100);
                    return `${label}: ${value} paciente${value !== 1 ? 's' : ''} (${percentage}%)`;
                  }
                },
                displayColors: true,
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                titleFont: { size: 12 },
                bodyFont: { size: 12 }
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  stepSize: 1,
                  precision: 0
                },
                grid: {
                  display: true,
                  color: 'rgba(0, 0, 0, 0.05)'
                }
              },
              x: {
                ticks: {
                  autoSkip: true,
                  maxRotation: 45,
                  minRotation: 45,
                  font: {
                    size: 10
                  }
                },
                grid: {
                  display: false
                }
              }
            }
          }}
        />
      </div>
    </div>

    {/* Gráfico de distribución por sexo */}
<div className="bg-white p-4 rounded-lg shadow">
  <h4 className="text-md font-medium text-[#801461] mb-2">Distribución por Sexo</h4>
  <div className="h-48">
    <Doughnut
      data={{
        labels: getGenderDistribution().map(g => 
          g.type === 'M' ? 'Masculino' : g.type === 'F' ? 'Femenino' : 'Otro'),
        datasets: [{
          label: 'Pacientes',
          data: getGenderDistribution().map(g => g.count),
          backgroundColor: [
            'rgba(128, 20, 97, 0.7)',
            'rgba(90, 13, 69, 0.7)',
            'rgba(181, 138, 173, 0.7)'
          ],
          borderColor: [
            'rgba(255, 255, 255, 1)'
          ],
          borderWidth: 2
        }]
      }}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              font: {
                size: 12 // 👈 tamaño de la fuente reducido aquí
              }
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const total = getGenderDistribution().reduce((sum, g) => sum + g.count, 0);
                const value = context.raw;
                const percentage = ((value / total) * 100).toFixed(1);
                return `${value} pacientes (${percentage}%)`;
              }
            }
          }
        }
      }}
    />
  </div>

  <div className="mt-4 flex justify-center space-x-2 text-xs">
  {getGenderDistribution().map(gender => (
    <div key={gender.type} className="flex items-center">
      <span 
        className="inline-block w-3 h-3 mr-1 rounded-full" 
        style={{
          backgroundColor: 
            gender.type === 'M' ? 'rgba(128, 20, 97, 0.7)' :
            gender.type === 'F' ? 'rgba(90, 13, 69, 0.7)' :
            'rgba(181, 138, 173, 0.7)'
        }}
      ></span>
      <span>
        {gender.type === 'M' ? 'Masculino' : 
        gender.type === 'F' ? 'Femenino' : 'Otro'}:
      </span>
      <span className="ml-1 font-medium">{gender.count}</span>
    </div>
  ))}
</div>
</div>

  </div>

</div>


      
    </div>
  );
};

export default GestionPaciente;