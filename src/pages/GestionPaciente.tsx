import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
} from 'chart.js';
import { Pie, Bar, Doughnut } from 'react-chartjs-2';

// Registrar componentes de ChartJS (mantener tal cual)
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
    user?: any; // Added user prop, though not directly used in this component yet
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

const GestionPaciente: React.FC<GestionPacienteProps> = ({ user }) => {
    const [pacientes, setPacientes] = useState<Paciente[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedPaciente, setSelectedPaciente] = useState<Paciente | null>(null);
    const [query, setQuery] = useState('');
    const [showAllPatients, setShowAllPatients] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [distritosOptions, setDistritosOptions] = useState<string[]>([]);
    const [ciudadesOptions, setCiudadesOptions] = useState<string[]>([]);

    const getAvatar = useCallback((s: 'M' | 'F' | 'O' | null | undefined) => {
        switch (s) {
          case 'F': return "/avatars/female.png";
          case 'M': return "/avatars/male.png";
          default: return "/avatars/neutral.png";
        }
      }, []);

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
        ciudad: '',
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

    // Utility function to calculate age
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

    // Fetch patients using useCallback for memoization
    const fetchPacientes = useCallback(async () => {
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
    }, []); // Empty dependencies as it doesn't rely on mutable props or state

    // Effect to load patients on component mount
    useEffect(() => {
        fetchPacientes();
    }, [fetchPacientes]); // Dependency on the memoized fetchPacientes

    // Fetch options for districts and cities
    const fetchDistritos = async () => {
        return [
            'Ancón', 'Ate', 'Barranco', 'Breña', 'Carabayllo', 'Chaclacayo',
            'Chorrillos', 'Cieneguilla', 'Comas', 'El Agustino', 'Independencia', 'Jesús María',
            'La Molina', 'La Victoria', 'Lima (Cercado)', 'Lince', 'Los Olivos',
            'Lurigancho-Chosica', 'Lurín', 'Magdalena del Mar', 'Miraflores', 'Pachacámac', 'Pucusana',
            'Pueblo Libre', 'Puente Piedra', 'Punta Hermosa', 'Punta Negra', 'Rímac',
            'San Bartolo', 'San Borja',
            'San Isidro', 'San Juan de Lurigancho',
            'San Juan de Miraflores', 'San Luis',
            'San Martín de Porres', 'San Miguel',
            'Santa Anita', 'Santa María del Mar',
            'Santa Rosa', 'Santiago de Surco',
            'Surquillo', 'Villa El Salvador',
            'Villa María del Triunfo', 'Surco',
            'Otros'
        ].sort((a, b) => a.localeCompare(b));
    };

    const fetchCiudades = async () => {
        return [
            'Abancay', 'Arequipa', 'Ayacucho', 'Cajamarca', 'Callao', 'Cerro de Pasco', 'Chachapoyas',
            'Chiclayo', 'Cusco', 'Huacho',
            'Huancavelica', 'Huancayo', 'Huaraz', 'Huánuco', 'Ica',
            'Iquitos', 'Lima', 'Moquegua', 'Moyobamba', 'Piura', 'Puerto Maldonado', 'Pucallpa',
            'Puno', 'Tacna', 'Trujillo', 'Tumbes', 'Otros' // Added 'Otros' for flexibility
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

    // Handle patient selection (for detail view)
    const handleSelectPaciente = (paciente: Paciente) => {
        setSelectedPaciente(paciente);
        setIsDetailModalOpen(true);
    };

    // Handle input changes in the form
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Handle form submission
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleSave();
    };

    // Save patient (create or update)
    const handleSave = async () => {
        try {
            setLoading(true);

            // Basic validation
            if (!formData.nombres || !formData.apellido_paterno || !formData.dni) {
                toast.error('Nombres, Apellido Paterno y DNI son campos obligatorios.');
                setLoading(false);
                return;
            }

            const pacienteData = {
                ...formData,
                activo: true // Ensure new patients are active by default
            };

            let result;
            if (selectedPaciente) {
                // Update existing patient
                const { data, error } = await supabase
                    .from('pacientes')
                    .update(pacienteData)
                    .eq('id', selectedPaciente.id)
                    .select();
                if (error) throw error;
                result = data;
                toast.success('Paciente actualizado correctamente');
            } else {
                // Create new patient
                const { data, error } = await supabase
                    .from('pacientes')
                    .insert([pacienteData])
                    .select();
                if (error) {
                    if (error.code === '23505') { // Unique constraint violation code
                        throw new Error('Ya existe un paciente con este DNI.');
                    }
                    throw error;
                }
                result = data;
                toast.success('Paciente guardado correctamente');
            }

            fetchPacientes(); // Reload patient list
            resetForm(); // Clear form
            setIsModalOpen(false); // Close modal
        } catch (error: any) {
            console.error('Error al guardar paciente:', error);
            toast.error(error.message || 'Error al guardar paciente');
        } finally {
            setLoading(false);
        }
    };

    // Edit patient
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

    // Delete patient
    const handleDelete = async (id: number) => {
        if (!window.confirm('¿Está seguro de eliminar este paciente? Esta acción no se puede deshacer.')) return;
        try {
            const { error } = await supabase.from('pacientes').delete().eq('id', id);
            if (error) throw error;
            toast.success('Paciente eliminado correctamente');
            fetchPacientes(); // Reload patients
            if (selectedPaciente?.id === id) { // If the deleted patient was the one selected, clear selection
                setSelectedPaciente(null);
                setIsDetailModalOpen(false);
            }
        } catch (error: any) {
            console.error('Error al eliminar paciente:', error);
            toast.error(error.message || 'Error al eliminar paciente');
        }
    };

    // Reset form fields
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

    // Filter patients based on search query
    const filteredPacientes = useMemo(() => {
        return pacientes.filter((paciente) => {
            const searchTerm = query.toLowerCase();
            const fullName = `${paciente.nombres || ''} ${paciente.apellido_paterno || ''} ${paciente.apellido_materno || ''}`.toLowerCase();
            return (
                fullName.includes(searchTerm) ||
                (paciente.dni?.toLowerCase()?.includes(searchTerm) || false) ||
                (paciente.celular?.toLowerCase()?.includes(searchTerm) || false) ||
                (paciente.correo?.toLowerCase()?.includes(searchTerm) || false)
            );
        });
    }, [pacientes, query]);

    const patientsPerPage = 15;
    const pacientesToShow = showAllPatients
        ? filteredPacientes
        : filteredPacientes.slice(0, patientsPerPage);

    const toggleShowAllPatients = () => {
        setShowAllPatients(!showAllPatients);
    };

    // --- Data analysis functions for charts (using useCallback for optimization) ---
    const getAgeGroups = useCallback(() => {
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
            // Ensure birthDate is valid before calculating age
            if (isNaN(birthDate.getTime())) return;

            const age = new Date().getFullYear() - birthDate.getFullYear();
            const group = groups.find(g => age >= g.min && age <= g.max);
            if (group) group.count++;
        });

        return groups.filter(g => g.count > 0); // Only show groups with patients
    }, [pacientes]); // Depends on `pacientes`

    const getDistrictDistribution = useCallback(() => {
        const districts: Record<string, number> = {};
        pacientes.forEach(paciente => {
            const dist = paciente.distrito || 'No especificado';
            districts[dist] = (districts[dist] || 0) + 1;
        });
        return Object.entries(districts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count) // Sort by count descending
            .slice(0, 10); // Limit to top 10 for readability on charts
    }, [pacientes]); // Depends on `pacientes`

    const getGenderDistribution = useCallback(() => {
        const genders = { 'M': 0, 'F': 0, 'O': 0 };
        pacientes.forEach(paciente => {
            // Ensure 'sexo' is one of the expected values, default to 'O' if not
            const sexKey: 'M' | 'F' | 'O' = paciente.sexo === 'M' || paciente.sexo === 'F' ? paciente.sexo : 'O';
            genders[sexKey]++;
        });
        return Object.entries(genders).map(([type, count]) => ({ type, count })).filter(g => g.count > 0); // Only show genders with patients
    }, [pacientes]); // Depends on `pacientes`

    const getCiudadDistribution = useCallback(() => {
        const ciudades: Record<string, number> = {};
        pacientes.forEach(paciente => {
            const city = paciente.ciudad || 'No especificado';
            ciudades[city] = (ciudades[city] || 0) + 1;
        });
        return Object.entries(ciudades)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count) // Sort by count descending
            .slice(0, 10); // Limit to top 10 for readability
    }, [pacientes]); // Depends on `pacientes`

    // Define color palette based on your Tailwind config
    const chartColors = [
        'rgb(118, 20, 92)',  // raspberry-700
        'rgb(140, 24, 109)', // raspberry-600
        'rgb(78, 16, 73)',   // raspberry-800
        'rgb(61, 10, 46)',   // raspberry-900
        'rgb(244, 183, 214)',// raspberry-200
        'rgb(238, 144, 193)',// raspberry-300
        'rgb(248, 245, 247)',// raspberry-50
        'rgb(250, 221, 235)',// raspberry-100
    ];

    // Helper to get translucent colors for backgrounds
    const getTranslucentColors = (colors: string[], opacity: number = 0.7) =>
        colors.map(color => color.replace('rgb(', 'rgba(').replace(')', `, ${opacity})`));


    return (
        // Main container of the page, without the global header
        <div className="bg-white rounded-lg shadow-xl overflow-hidden border border-raspberry-100 p-4 sm:p-6 mb-6">
            {/* Header specific to Patient Management */}
            <div className="bg-gradient-to-r from-raspberry-700 to-raspberry-900 p-6 text-white rounded-t-lg">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
                    <div className="flex items-center space-x-2">
                        <h2 className="text-2xl font-bold">Gestión de Pacientes</h2>
                        <span className="bg-white text-raspberry-900 px-3 py-1 rounded-full text-sm font-semibold">
                            {pacientes.filter(p => p.activo).length} activos
                        </span>
                    </div>
                    <button
                        onClick={() => {
                            resetForm();
                            setIsModalOpen(true);
                        }}
                        className="px-5 py-2.5 text-sm font-medium text-white rounded-md bg-raspberry-500 hover:bg-raspberry-700 transition-all duration-300 shadow-md flex items-center justify-center"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Nuevo Paciente
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="px-4 py-6 sm:px-6 lg:px-8">
                {/* Search and Filters */}
                <div className="mb-6 flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                        <input
                            type="text"
                            placeholder="Buscar pacientes por nombre, apellido o DNI..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-raspberry-500 focus:border-raspberry-500"
                        />
                    </div>
                    <button
                        onClick={toggleShowAllPatients}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center justify-center transition-colors duration-200"
                    >
                        {showAllPatients ? 'Mostrar Menos' : 'Mostrar Todos'}
                    </button>
                </div>

                {/* Loading / No Patients */}
                {loading ? (
                    <div className="flex flex-col justify-center items-center h-48 bg-raspberry-50 rounded-lg">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-raspberry-500"></div>
                        <p className="ml-4 text-raspberry-700 mt-3">Cargando pacientes...</p>
                    </div>
                ) : pacientes.length === 0 ? (
                    <div className="p-10 text-center text-gray-500 bg-raspberry-50 rounded-lg border border-raspberry-100">
                        <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-raspberry-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <p className="text-raspberry-900">No se encontraron pacientes</p>
                        <button
                            onClick={() => {
                                resetForm();
                                setIsModalOpen(true);
                            }}
                            className="mt-2 text-sm text-raspberry-700 hover:text-raspberry-900 font-medium underline"
                        >
                            Agregar nuevo paciente
                        </button>
                    </div>
                ) : (
                    /* Table */
                    /* Table */
<div className="overflow-x-auto bg-white rounded-b-lg shadow-md border border-gray-200">
    <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-raspberry-50">
            <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-raspberry-700 uppercase tracking-wider">
                    Paciente
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-raspberry-700 uppercase tracking-wider hidden sm:table-cell">
                    DNI
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-raspberry-700 uppercase tracking-wider hidden md:table-cell">
                    Edad
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-raspberry-700 uppercase tracking-wider hidden lg:table-cell">
                    Teléfono
                </th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-raspberry-700 uppercase tracking-wider">
                    Acciones
                </th>
            </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
            {pacientesToShow.map((paciente) => (
                <tr
                    key={paciente.id}
                    className="hover:bg-raspberry-50 transition-colors duration-150 cursor-pointer"
                    onClick={() => handleSelectPaciente(paciente)}
                >
                    <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                            <img
                                src={getAvatar(paciente.sexo)}
                                alt="Avatar del paciente"
                                className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-md flex-shrink-0 mr-3"
                            />
                            <div>
                                <p className="text-sm font-medium text-gray-900">
                                    {`${paciente.nombres} ${paciente.apellido_paterno} ${paciente.apellido_materno || ''}`}
                                </p>
                            </div>
                        </div>
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
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                        <div className="flex justify-center space-x-2">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleEdit(paciente);
                                }}
                                className="text-raspberry-700 hover:text-raspberry-900 transition-colors duration-200 p-1 rounded-md hover:bg-raspberry-100"
                                title="Editar Paciente"
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
                                className="text-red-600 hover:text-red-800 transition-colors duration-200 p-1 rounded-md hover:bg-red-50"
                                title="Eliminar Paciente"
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
            ))}
        </tbody>
    </table>
</div>
                )}
            </div>

            {/* Modal for creating/editing patient */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-gray-900 bg-opacity-60 flex items-center justify-center p-4 z-50 animate-fade-in-down">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col border border-raspberry-100">
                        {/* Sticky modal header */}
                        <div className="sticky top-0 px-6 py-4 border-b border-raspberry-100 bg-gradient-to-r from-raspberry-700 to-raspberry-900 z-10 flex justify-between items-center">
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
                                className="text-white hover:text-raspberry-100 transition-colors duration-200 p-1 rounded-full hover:bg-white hover:bg-opacity-20"
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
                                    <h3 className="text-lg font-medium text-raspberry-900 border-b border-raspberry-100 pb-2 mb-2">Información Personal</h3>
                                    <div>
                                        <label htmlFor="dni" className="block text-sm font-medium text-raspberry-900">DNI *</label>
                                        <input
                                            id="dni"
                                            type="text"
                                            name="dni"
                                            value={formData.dni}
                                            onChange={handleInputChange}
                                            className="mt-1 block w-full rounded-md border-raspberry-100 shadow-sm focus:border-raspberry-700 focus:ring-raspberry-700 p-2 text-sm"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="nombres" className="block text-sm font-medium text-raspberry-900">Nombres *</label>
                                        <input
                                            id="nombres"
                                            type="text"
                                            name="nombres"
                                            value={formData.nombres}
                                            onChange={handleInputChange}
                                            className="mt-1 block w-full rounded-md border-raspberry-100 shadow-sm focus:border-raspberry-700 focus:ring-raspberry-700 p-2 text-sm"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="apellido_paterno" className="block text-sm font-medium text-raspberry-900">Apellido Paterno *</label>
                                        <input
                                            id="apellido_paterno"
                                            type="text"
                                            name="apellido_paterno"
                                            value={formData.apellido_paterno}
                                            onChange={handleInputChange}
                                            className="mt-1 block w-full rounded-md border-raspberry-100 shadow-sm focus:border-raspberry-700 focus:ring-raspberry-700 p-2 text-sm"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="apellido_materno" className="block text-sm font-medium text-raspberry-900">Apellido Materno</label>
                                        <input
                                            id="apellido_materno"
                                            type="text"
                                            name="apellido_materno"
                                            value={formData.apellido_materno || ''}
                                            onChange={handleInputChange}
                                            className="mt-1 block w-full rounded-md border-raspberry-100 shadow-sm focus:border-raspberry-700 focus:ring-raspberry-700 p-2 text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="fecha_nacimiento" className="block text-sm font-medium text-raspberry-900">Fecha de Nacimiento</label>
                                        <input
                                            id="fecha_nacimiento"
                                            type="date"
                                            name="fecha_nacimiento"
                                            value={formData.fecha_nacimiento || ''}
                                            onChange={handleInputChange}
                                            className="mt-1 block w-full rounded-md border-raspberry-100 shadow-sm focus:border-raspberry-700 focus:ring-raspberry-700 p-2 text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="sexo" className="block text-sm font-medium text-raspberry-900">Sexo *</label>
                                        <select
                                            id="sexo"
                                            name="sexo"
                                            value={formData.sexo}
                                            onChange={handleInputChange}
                                            className="mt-1 block w-full rounded-md border-raspberry-100 shadow-sm focus:border-raspberry-700 focus:ring-raspberry-700 p-2 text-sm bg-white"
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
                                    <h3 className="text-lg font-medium text-raspberry-900 border-b border-raspberry-100 pb-2 mb-2">Información de Contacto</h3>
                                    <div>
                                        <label htmlFor="celular" className="block text-sm font-medium text-raspberry-900">Celular</label>
                                        <input
                                            id="celular"
                                            type="tel"
                                            name="celular"
                                            value={formData.celular || ''}
                                            onChange={handleInputChange}
                                            className="mt-1 block w-full rounded-md border-raspberry-100 shadow-sm focus:border-raspberry-700 focus:ring-raspberry-700 p-2 text-sm"
                                        /></div>

                                    <div>
                                        <label htmlFor="telefono_fijo" className="block text-sm font-medium text-raspberry-900">Teléfono Fijo</label>
                                        <input
                                            id="telefono_fijo"
                                            type="tel"
                                            name="telefono_fijo"
                                            value={formData.telefono_fijo || ''}
                                            onChange={handleInputChange}
                                            className="mt-1 block w-full rounded-md border-raspberry-100 shadow-sm focus:border-raspberry-700 focus:ring-raspberry-700 p-2 text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="correo" className="block text-sm font-medium text-raspberry-900">Correo Electrónico</label>
                                        <input
                                            id="correo"
                                            type="email"
                                            name="correo"
                                            value={formData.correo || ''}
                                            onChange={handleInputChange}
                                            className="mt-1 block w-full rounded-md border-raspberry-100 shadow-sm focus:border-raspberry-700 focus:ring-raspberry-700 p-2 text-sm"
                                        />
                                    </div>
                                    {/* Ciudad (primero) */}
                                    <div>
                                        <label htmlFor="ciudad" className="block text-sm font-medium text-raspberry-900">Ciudad *</label>
                                        <select
                                            id="ciudad"
                                            name="ciudad"
                                            value={formData.ciudad || ''}
                                            onChange={handleInputChange}
                                            className="mt-1 block w-full rounded-md border-raspberry-100 shadow-sm focus:border-raspberry-700 focus:ring-raspberry-700 p-2 text-sm bg-white"
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
                                            <label htmlFor="distrito" className="block text-sm font-medium text-raspberry-900">Distrito</label>
                                            <select
                                                id="distrito"
                                                name="distrito"
                                                value={formData.distrito || ''}
                                                onChange={handleInputChange}
                                                className="mt-1 block w-full rounded-md border-raspberry-100 shadow-sm focus:border-raspberry-700 focus:ring-raspberry-700 p-2 text-sm bg-white"
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
                                            <label htmlFor="distrito" className="block text-sm font-medium text-raspberry-900">
                                                {formData.ciudad ? `Distrito de ${formData.ciudad}` : 'Distrito'}
                                            </label>
                                            <input
                                                id="distrito"
                                                type="text"
                                                name="distrito"
                                                value={formData.distrito || ''}
                                                onChange={handleInputChange}
                                                className="mt-1 block w-full rounded-md border-raspberry-100 shadow-sm focus:border-raspberry-700 focus:ring-raspberry-700 p-2 text-sm"
                                                disabled={!formData.ciudad}
                                                placeholder="Ingrese el distrito"
                                            />
                                        </div>
                                    )}

                                    {/* Dirección (último) */}
                                    <div>
                                        <label htmlFor="direccion" className="block text-sm font-medium text-raspberry-900">Dirección</label>
                                        <input
                                            id="direccion"
                                            type="text"
                                            name="direccion"
                                            value={formData.direccion || ''}
                                            onChange={handleInputChange}
                                            className="mt-1 block w-full rounded-md border-raspberry-100 shadow-sm focus:border-raspberry-700 focus:ring-raspberry-700 p-2 text-sm"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Información Médica */}
                            <div className="mt-6 space-y-4">
                                <h3 className="text-lg font-medium text-raspberry-900 border-b border-raspberry-100 pb-2 mb-2">Información Médica</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label htmlFor="grupo_sanguineo" className="block text-sm font-medium text-raspberry-900">Grupo Sanguíneo</label>
                                        <input
                                            id="grupo_sanguineo"
                                            type="text"
                                            name="grupo_sanguineo"
                                            value={formData.grupo_sanguineo || ''}
                                            onChange={handleInputChange}
                                            className="mt-1 block w-full rounded-md border-raspberry-100 shadow-sm focus:border-raspberry-700 focus:ring-raspberry-700 p-2 text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="alergias" className="block text-sm font-medium text-raspberry-900">Alergias</label>
                                        <textarea
                                            id="alergias"
                                            name="alergias"
                                            value={formData.alergias || ''}
                                            onChange={handleInputChange}
                                            rows={2}
                                            className="mt-1 block w-full rounded-md border-raspberry-100 shadow-sm focus:border-raspberry-700 focus:ring-raspberry-700 p-2 text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="enfermedades_cronicas" className="block text-sm font-medium text-raspberry-900">Enfermedades Crónicas</label>
                                        <textarea
                                            id="enfermedades_cronicas"
                                            name="enfermedades_cronicas"
                                            value={formData.enfermedades_cronicas || ''}
                                            onChange={handleInputChange}
                                            rows={2}
                                            className="mt-1 block w-full rounded-md border-raspberry-100 shadow-sm focus:border-raspberry-700 focus:ring-raspberry-700 p-2 text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="medicamentos_actuales" className="block text-sm font-medium text-raspberry-900">Medicamentos Actuales</label>
                                        <textarea
                                            id="medicamentos_actuales"
                                            name="medicamentos_actuales"
                                            value={formData.medicamentos_actuales || ''}
                                            onChange={handleInputChange}
                                            rows={2}
                                            className="mt-1 block w-full rounded-md border-raspberry-100 shadow-sm focus:border-raspberry-700 focus:ring-raspberry-700 p-2 text-sm"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Información Adicional */}
                            <div className="mt-6 space-y-4">
                                <h3 className="text-lg font-medium text-raspberry-900 border-b border-raspberry-100 pb-2 mb-2">Información Adicional</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label htmlFor="seguro_medico" className="block text-sm font-medium text-raspberry-900">Seguro Médico</label>
                                        <input
                                            id="seguro_medico"
                                            type="text"
                                            name="seguro_medico"
                                            value={formData.seguro_medico || ''}
                                            onChange={handleInputChange}
                                            className="mt-1 block w-full rounded-md border-raspberry-100 shadow-sm focus:border-raspberry-700 focus:ring-raspberry-700 p-2 text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="estado_civil" className="block text-sm font-medium text-raspberry-900">Estado Civil</label>
                                        <select
                                            id="estado_civil"
                                            name="estado_civil"
                                            value={formData.estado_civil || ''}
                                            onChange={handleInputChange}
                                            className="mt-1 block w-full rounded-md border-raspberry-100 shadow-sm focus:border-raspberry-700 focus:ring-raspberry-700 p-2 text-sm bg-white"
                                        >
                                            <option value="">Seleccionar...</option>
                                            <option value="Soltero">Soltero(a)</option>
                                            <option value="Casado">Casado(a)</option>
                                            <option value="Divorciado">Divorciado(a)</option>
                                            <option value="Viudo">Viudo(a)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label htmlFor="ocupacion" className="block text-sm font-medium text-raspberry-900">Ocupación</label>
                                        <input
                                            id="ocupacion"
                                            type="text"
                                            name="ocupacion"
                                            value={formData.ocupacion || ''}
                                            onChange={handleInputChange}
                                            className="mt-1 block w-full rounded-md border-raspberry-100 shadow-sm focus:border-raspberry-700 focus:ring-raspberry-700 p-2 text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="referencia" className="block text-sm font-medium text-raspberry-900">Referencia</label>
                                        <input
                                            id="referencia"
                                            type="text"
                                            name="referencia"
                                            value={formData.referencia || ''}
                                            onChange={handleInputChange}
                                            className="mt-1 block w-full rounded-md border-raspberry-100 shadow-sm focus:border-raspberry-700 focus:ring-raspberry-700 p-2 text-sm"
                                        />
                                    </div>
                                    <div className="md:col-span-2"> {/* Make dental history span full width on medium+ screens */}
                                        <label htmlFor="historial_dental" className="block text-sm font-medium text-raspberry-900">Historial Dental</label>
                                        <textarea
                                            id="historial_dental"
                                            name="historial_dental"
                                            value={formData.historial_dental || ''}
                                            onChange={handleInputChange}
                                            rows={3}
                                            className="mt-1 block w-full rounded-md border-raspberry-100 shadow-sm focus:border-raspberry-700 focus:ring-raspberry-700 p-2 text-sm"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Modal action buttons */}
                            <div className="mt-6 flex justify-end space-x-3 border-t border-raspberry-100 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsModalOpen(false);
                                        resetForm();
                                    }}
                                    className="px-4 py-2 text-sm font-medium text-raspberry-900 bg-raspberry-50 rounded-md hover:bg-raspberry-100 transition-colors duration-200"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-4 py-2 text-sm font-medium text-white rounded-md bg-raspberry-700 hover:bg-raspberry-900 transition-all duration-300 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? 'Guardando...' : selectedPaciente ? 'Actualizar' : 'Guardar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal to view patient details */}
            {isDetailModalOpen && selectedPaciente && (
                <div className="fixed inset-0 bg-gray-900 bg-opacity-80 flex items-center justify-center p-4 z-50 animate-fade-in-down">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-raspberry-100">
                        <div className="sticky top-0 px-6 py-4 border-b border-raspberry-100 bg-gradient-to-r from-raspberry-700 to-raspberry-900 z-10">
                            <div className="flex justify-between items-center">
                                <h2 className="text-lg font-medium text-white">Detalles del Paciente</h2>
                                <button
                                    onClick={() => setIsDetailModalOpen(false)}
                                    className="text-white hover:text-raspberry-100 transition-colors duration-200 p-1 rounded-full hover:bg-white hover:bg-opacity-20"
                                >
                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Información Personal */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-medium text-raspberry-900 border-b border-raspberry-100 pb-2 mb-2">Información Personal</h3>
                                    <div className="bg-raspberry-50 rounded-lg p-4 space-y-3">
                                        <div>
                                            <label className="block text-sm font-medium text-raspberry-900">DNI</label>
                                            <p className="mt-1 text-sm text-gray-900 font-medium">{selectedPaciente.dni || '-'}</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-raspberry-900">Nombres Completos</label>
                                            <p className="mt-1 text-sm text-gray-900 font-medium">
                                                {`${selectedPaciente.nombres} ${selectedPaciente.apellido_paterno} ${selectedPaciente.apellido_materno || ''}`}
                                            </p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-raspberry-900">Fecha de Nacimiento</label>
                                            <p className="mt-1 text-sm text-gray-900">
                                                {selectedPaciente.fecha_nacimiento
                                                    ? new Date(selectedPaciente.fecha_nacimiento).toLocaleDateString()
                                                    : '-'}
                                            </p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-raspberry-900">Edad</label>
                                            <p className="mt-1 text-sm text-gray-900">
                                                {selectedPaciente.fecha_nacimiento ? calcularEdad(selectedPaciente.fecha_nacimiento) : 'N/A'}
                                            </p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-raspberry-900">Sexo</label>
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
                                    <h3 className="text-lg font-medium text-raspberry-900 border-b border-raspberry-100 pb-2 mb-2">Información de Contacto</h3>
                                    <div className="bg-raspberry-50 rounded-lg p-4 space-y-3">
                                        <div>
                                            <label className="block text-sm font-medium text-raspberry-900">Celular</label>
                                            <p className="mt-1 text-sm text-gray-900">{selectedPaciente.celular || '-'}</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-raspberry-900">Teléfono Fijo</label>
                                            <p className="mt-1 text-sm text-gray-900">{selectedPaciente.telefono_fijo || '-'}</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-raspberry-900">Correo Electrónico</label>
                                            <p className="mt-1 text-sm text-gray-900">{selectedPaciente.correo || '-'}</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-raspberry-900">Dirección</label>
                                            <p className="mt-1 text-sm text-gray-900">{selectedPaciente.direccion || '-'}</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-raspberry-900">Ciudad</label>
                                            <p className="mt-1 text-sm text-gray-900">{selectedPaciente.ciudad || '-'}</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-raspberry-900">Distrito</label>
                                            <p className="mt-1 text-sm text-gray-900">{selectedPaciente.distrito || '-'}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Información Médica */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-medium text-raspberry-900 border-b border-raspberry-100 pb-2 mb-2">Información Médica</h3>
                                    <div className="bg-raspberry-50 rounded-lg p-4 space-y-3">
                                        <div>
                                            <label className="block text-sm font-medium text-raspberry-900">Grupo Sanguíneo</label>
                                            <p className="mt-1 text-sm text-gray-900">{selectedPaciente.grupo_sanguineo || '-'}</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-raspberry-900">Alergias</label>
                                            <p className="mt-1 text-sm text-gray-900">{selectedPaciente.alergias || '-'}</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-raspberry-900">Enfermedades Crónicas</label>
                                            <p className="mt-1 text-sm text-gray-900">
                                                {selectedPaciente.enfermedades_cronicas || '-'}
                                            </p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-raspberry-900">Medicamentos Actuales</label>
                                            <p className="mt-1 text-sm text-gray-900">
                                                {selectedPaciente.medicamentos_actuales || '-'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Información Adicional */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-medium text-raspberry-900 border-b border-raspberry-100 pb-2 mb-2">Información Adicional</h3>
                                    <div className="bg-raspberry-50 rounded-lg p-4 space-y-3">
                                        <div>
                                            <label className="block text-sm font-medium text-raspberry-900">Seguro Médico</label>
                                            <p className="mt-1 text-sm text-gray-900">{selectedPaciente.seguro_medico || '-'}</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-raspberry-900">Estado Civil</label>
                                            <p className="mt-1 text-sm text-gray-900">{selectedPaciente.estado_civil || '-'}</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-raspberry-900">Ocupación</label>
                                            <p className="mt-1 text-sm text-gray-900">{selectedPaciente.ocupacion || '-'}</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-raspberry-900">Referencia</label>
                                            <p className="mt-1 text-sm text-gray-900">{selectedPaciente.referencia || '-'}</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-raspberry-900">Historial Dental</label>
                                            <p className="mt-1 text-sm text-gray-900">{selectedPaciente.historial_dental || '-'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Action buttons */}
                            <div className="mt-6 flex justify-end space-x-3 border-t border-raspberry-100 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsDetailModalOpen(false)}
                                    className="px-4 py-2 text-sm font-medium text-raspberry-900 bg-raspberry-50 rounded-md hover:bg-raspberry-100 transition-colors duration-200"
                                >
                                    Cerrar
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        handleEdit(selectedPaciente);
                                        setIsDetailModalOpen(false);
                                    }}
                                    className="px-4 py-2 text-sm font-medium text-white rounded-md bg-raspberry-700 hover:bg-raspberry-900 transition-all duration-300 shadow-md"
                                >
                                    Editar Paciente
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Data Analysis Section */}
            <div className="px-4 py-6 sm:px-6 lg:px-8">
                <h3 className="text-xl font-bold text-raspberry-900 mb-6 border-b border-raspberry-100 pb-2">Análisis de Pacientes</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {/* Graph: Age Distribution */}
                    <div className="bg-white p-4 rounded-lg shadow border border-raspberry-100 flex flex-col items-stretch">
                        <h4 className="text-md font-bold text-raspberry-700 mb-3 text-center">Distribución por Edad</h4>
                        {getAgeGroups().length > 0 ? (
                            <>
                                <div className="h-48 flex-grow flex items-center justify-center">
                                    <Bar
                                        data={{
                                            labels: getAgeGroups().map(g => g.range),
                                            datasets: [{
                                                label: 'Pacientes',
                                                data: getAgeGroups().map(g => g.count),
                                                backgroundColor: getTranslucentColors(chartColors.slice(0, getAgeGroups().length)),
                                                borderColor: chartColors.slice(0, getAgeGroups().length),
                                                borderWidth: 1,
                                                borderRadius: 8, // Modern rounded bars
                                                barPercentage: 0.8, // Make bars slightly thinner
                                                categoryPercentage: 0.8, // Ensure spacing between bars
                                            }]
                                        }}
                                        options={{
                                            responsive: true,
                                            maintainAspectRatio: false,
                                            plugins: {
                                                legend: { display: false },
                                                tooltip: {
                                                    callbacks: {
                                                        label: function (context) {
                                                            const value = context.parsed.y || 0;
                                                            const total = pacientes.length;
                                                            const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                                                            return `${value} paciente${value !== 1 ? 's' : ''} (${percentage}%)`;
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
                                                    ticks: { stepSize: 1, precision: 0, color: 'rgb(107, 114, 128)' }, // Gray-500 for tick labels
                                                    grid: { display: true, color: 'rgba(0, 0, 0, 0.05)' }
                                                },
                                                x: {
                                                    ticks: { color: 'rgb(107, 114, 128)' }, // Gray-500 for tick labels
                                                    grid: { display: false }
                                                }
                                            }
                                        }}
                                    />
                                </div>
                                <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-gray-700">
                                    {getAgeGroups().map(group => (
                                        <div key={group.range} className="flex items-center">
                                            <span className="inline-block w-3 h-3 mr-1 rounded-full"
                                                style={{
                                                    backgroundColor: chartColors[getAgeGroups().indexOf(group) % chartColors.length]
                                                }}
                                            ></span>
                                            <span>{group.range}: <span className="font-semibold">{group.count}</span></span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <p className="text-center text-sm text-gray-500 italic flex-grow flex items-center justify-center">No hay datos de edad disponibles</p>
                        )}
                    </div>

                    {/* Graph: City Distribution - Doughnut Version */}
                    <div className="bg-white p-4 rounded-lg shadow border border-raspberry-100 flex flex-col items-stretch">
                        <h4 className="text-md font-bold text-raspberry-700 mb-3 text-center">Distribución por Ciudad</h4>
                        {getCiudadDistribution().length > 0 ? (
                            <div className="h-48 flex-grow flex items-center justify-center">
                                <Doughnut
                                    data={{
                                        labels: getCiudadDistribution().map(d => d.name),
                                        datasets: [{
                                            data: getCiudadDistribution().map(d => d.count),
                                            backgroundColor: chartColors.slice(0, getCiudadDistribution().length),
                                            borderColor: '#fff',
                                            borderWidth: 2
                                        }]
                                    }}
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        cutout: '65%', // Thicker doughnut
                                        plugins: {
                                            legend: {
                                                position: 'right',
                                                labels: {
                                                    boxWidth: 14, // Larger color box
                                                    padding: 16,
                                                    color: 'rgb(55, 65, 81)' // text-gray-700
                                                }
                                            },
                                            tooltip: {
                                                callbacks: {
                                                    label: function (context) {
                                                        const label = context.label || '';
                                                        const value = context.raw || 0;
                                                        const total = getCiudadDistribution().reduce((sum, d) => sum + d.count, 0);
                                                        const percentage = total > 0 ? Math.round(Number(value) / total * 100) : 0;
                                                        return `${label}: ${value} (${percentage}%)`;
                                                    }
                                                },
                                                displayColors: true,
                                                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                                                titleFont: { size: 12 },
                                                bodyFont: { size: 12 }
                                            }
                                        }
                                    }}
                                />
                            </div>
                        ) : (
                            <p className="text-center text-sm text-gray-500 italic flex-grow flex items-center justify-center">No hay datos de ciudad disponibles</p>
                        )}
                    </div>

                    {/* Graph: District Distribution - Improved Bar version */}
                    <div className="bg-white p-4 rounded-lg shadow border border-raspberry-100 flex flex-col items-stretch">
                        <h4 className="text-md font-bold text-raspberry-700 mb-3 text-center">Distribución por Distrito</h4>
                        {getDistrictDistribution().length > 0 ? (
                            <div className="h-48 flex-grow flex items-center justify-center">
                                <Bar
                                    data={{
                                        labels: getDistrictDistribution().map(d => d.name),
                                        datasets: [{
                                            label: 'Pacientes',
                                            data: getDistrictDistribution().map(d => d.count),
                                            backgroundColor: getTranslucentColors(chartColors.slice(0, getDistrictDistribution().length)),
                                            borderColor: chartColors.slice(0, getDistrictDistribution().length),
                                            borderWidth: 1,
                                            borderRadius: 8,
                                            barPercentage: 0.8,
                                            categoryPercentage: 0.8,
                                        }]
                                    }}
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        plugins: {
                                            legend: { display: false },
                                            tooltip: {
                                                callbacks: {
                                                    label: function (context) {
                                                        const label = context.label || '';
                                                        const value = context.parsed.y || 0;
                                                        const total = getDistrictDistribution().reduce((sum, d) => sum + d.count, 0);
                                                        const percentage = total > 0 ? Math.round(Number(value) / total * 100) : 0;
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
                                                ticks: { stepSize: 1, precision: 0, color: 'rgb(107, 114, 128)' },
                                                grid: { display: true, color: 'rgba(0, 0, 0, 0.05)' }
                                            },
                                            x: {
                                                ticks: {
                                                    autoSkip: true,
                                                    maxRotation: 45,
                                                    minRotation: 45,
                                                    font: { size: 10 },
                                                    color: 'rgb(107, 114, 128)'
                                                },
                                                grid: { display: false }
                                            }
                                        }
                                    }}
                                />
                            </div>
                        ) : (
                            <p className="text-center text-sm text-gray-500 italic flex-grow flex items-center justify-center">No hay datos de distrito disponibles</p>
                        )}
                    </div>

                    {/* Graph: Gender Distribution - Doughnut Version */}
                    <div className="bg-white p-4 rounded-lg shadow border border-raspberry-100 flex flex-col items-stretch">
                        <h4 className="text-md font-bold text-raspberry-700 mb-3 text-center">Distribución por Sexo</h4>
                        {getGenderDistribution().length > 0 ? (
                            <div className="h-48 flex-grow flex items-center justify-center">
                                <Doughnut
                                    data={{
                                        labels: getGenderDistribution().map(g =>
                                            g.type === 'M' ? 'Masculino' : g.type === 'F' ? 'Femenino' : 'Otro'),
                                        datasets: [{
                                            label: 'Pacientes',
                                            data: getGenderDistribution().map(g => g.count),
                                            backgroundColor: chartColors.slice(0, getGenderDistribution().length),
                                            borderColor: '#fff',
                                            borderWidth: 2
                                        }]
                                    }}
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        cutout: '65%',
                                        plugins: {
                                            legend: {
                                                position: 'bottom',
                                                labels: {
                                                    font: { size: 12 },
                                                    color: 'rgb(55, 65, 81)'
                                                }
                                            },
                                            tooltip: {
                                                callbacks: {
                                                    label: function (context) {
                                                        const total = getGenderDistribution().reduce((sum, g) => sum + g.count, 0);
                                                        const value = context.raw;
                                                        const percentage = total > 0 ? ((Number(value) / total) * 100).toFixed(1) : '0.0';
                                                        return `${value} paciente${value !== 1 ? 's' : ''} (${percentage}%)`;
                                                    }
                                                },
                                                displayColors: true,
                                                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                                                titleFont: { size: 12 },
                                                bodyFont: { size: 12 }
                                            }
                                        }
                                    }}
                                />
                            </div>
                        ) : (
                            <p className="text-center text-sm text-gray-500 italic flex-grow flex items-center justify-center">No hay datos de sexo disponibles</p>
                        )}
                    </div>
                </div> {/* End of grid for charts */}
            </div> {/* End of Analysis de Datos section */}
        </div>
    );
};

export default GestionPaciente;