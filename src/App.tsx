import React, { useState, useEffect, useMemo } from 'react';
import { HashRouter as Router, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import './index.css'; 
import { Truck, Clock, MapPin, LogIn, LogOut, Calendar, User, MapPinned, Timer, FileText, Upload, Download, Table2Icon, Table, PanelsTopLeft, PersonStanding, PersonStandingIcon , Eye, EyeOff, DollarSignIcon, BadgeDollarSignIcon} from 'lucide-react';
import { supabase } from './lib/supabase';
import toast, { Toaster } from 'react-hot-toast';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'moment/locale/es';
import { Combobox } from '@headlessui/react'; 
import { Pie } from 'react-chartjs-2';
import {   Chart as ChartJS,   ArcElement,   Tooltip,   Legend,  CategoryScale,  LinearScale,  BarElement,  PointElement,  LineElement,  Title, Filler } from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(  ArcElement,  Tooltip,  Legend,  CategoryScale,  LinearScale,  BarElement,  PointElement,  LineElement,  Title, Filler);


// Custom Molar Tooth Icon
const MolarIcon = ({ className = "w-8 h-8", stroke = "#801461", strokeWidth = 2 }) => (
  <svg
    className={className}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    stroke={stroke}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {/* Contorno molar */}
    <path d="M20 6C14 6 8 12 8 22C8 38 12 58 20 58C24 58 24 46 32 46C40 46 40 58 44 58C52 58 56 38 56 22C56 12 50 6 44 6C38 6 36 18 32 18C28 18 26 6 20 6Z" />
    
    {/* Destaque/brilho no canto superior direito */}
    <path d="M46 14C48 16 50 18 50 20" strokeWidth="1.5" />
  </svg>
);

// Color scheme based on #801461
const colorPrimary = '#801461';
const colorPrimaryLight = '#a3418a';
const colorPrimaryDark = '#5d0e45';
const colorSecondary = '#f8f1f6';
const colorAccent = '#ff9e00';
// Paleta de colores profesional basada en #4E023B
const colors = {
  primary: {
    50: '#F5E8F2',    100: '#EBD1E5',    200: '#D7A3CB',    300: '#C374B1',    400: '#AF4697',    500: '#4E023B',     600: '#3E0230',    700: '#2F0125',    800: '#1F011A',    900: '#10000D'
  },
  secondary: {
    50: '#F8F1F6',    100: '#F1E3ED',    200: '#E3C7DB',    300: '#D5AAC9',    400: '#C78EB7',    500: '#801461',     600: '#660F4E',    700: '#4D0B3A',    800: '#330827',    900: '#1A0413'
  },
  accent: {
    50: '#FFF5E6',    100: '#FFEBCC',    200: '#FFD699',    300: '#FFC266',    400: '#FFAD33',    500: '#FF9E00',   },
  neutral: {
    50: '#FAFAFA',    100: '#F5F5F5',    200: '#EEEEEE',    300: '#E0E0E0',    400: '#BDBDBD',    500: '#9E9E9E',    600: '#757575',    700: '#616161',    800: '#424242',    900: '#212121'
  },
  success: {
    50: '#E8F5E9',    100: '#C8E6C9',    200: '#A5D6A7',    300: '#81C784',    400: '#66BB6A',    500: '#4CAF50',    600: '#43A047',    700: '#388E3C',    800: '#2E7D32',    900: '#1B5E20'
  },
  warning: {
    50: '#FFF8E1',     100: '#FFECB3',    200: '#FFE082',    300: '#FFD54F',    400: '#FFCA28',    500: '#FFC107',    600: '#FFB300',    700: '#FFA000',
    800: '#FF8F00',    900: '#FF6F00'
  },
  error: {
    50: '#FFEBEE',    100: '#FFCDD2',    200: '#EF9A9A',    300: '#E57373',    400: '#EF5350',    500: '#F44336',    600: '#E53935',    700: '#D32F2F',    800: '#C62828',    900: '#B71C1C'
  }
};


function IniciarSesion() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Clear any existing session data
      await supabase.auth.signOut();
      localStorage.removeItem('supabase.auth.token');

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      if (data.session) {
        localStorage.setItem('supabase.auth.token', JSON.stringify(data.session));
        window.location.reload();
      } else {
        throw new Error('No session data received');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      setError(error.message || 'Error al iniciar sesión');
      toast.error(error.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <MolarIcon className="mx-auto h-12 w-12" stroke={colorPrimary} />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Andrew's Dental Group
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sistema de Gestión Dental
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">Correo electrónico</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Correo electrónico"
              />
            </div>
            <div className="relative">
              <label htmlFor="password" className="sr-only">Contraseña</label>
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Contraseña"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showPassword ? (
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white"
              style={{
                backgroundColor: colorPrimary,
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-15" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Iniciando sesión...
                </>
              ) : 'Iniciar Sesión'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


type User  ={
  id: string;
  nombre: string;
  apellido: string;
  
  
  activo?: boolean;
  role?: string;
}


interface TipoMovimiento {
  id: number;
  nombre: string;
  tipo: 'Ingreso' | 'Egreso' | 'Ajuste';
}

interface Medico {
  id: string;
  nombre: string;
  activo: boolean;
  especialidad?: string;
  telefono?: string;
  correo?: string;
  fecha_ingreso?: string;
  porcentaje_comision?: number;
}

interface Paciente {
  id: string;
  nombres: string;
  apellido_paterno: string;
  apellido_materno: string;
  fecha_nacimiento?: string;
  activo: boolean;
  dni?: string;
  celular?: string;
  sexo?: 'M' | 'F' | 'O';
  telefono_fijo?: string;
  correo?: string;
  direccion?: string;
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
  fecha_registro?: string;
  ultima_visita?: string;
}

interface RegistroCaja {
  id: string;  // Changed from number to string
  fecha: string;
  tipo_movimiento_id: number;
  tipo_movimiento?: {
    id: number;
    nombre: string;
    tipo: 'Ingreso' | 'Egreso' | 'Ajuste';
  };
  descripcion: string;
  valor: number;
  numero_factura?: string;
  user_id: string;  // Changed from number to string
  created_at: string;
  usuario?: {
    nombre: string;
  };
  paciente?: Paciente;
  medico?: Medico;
  forma_pago?: 'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA' | 'YAPE' | 'PLIN' | 'OTROS';
}

interface HistorialMes {
  mes: number;
  registros: RegistroCaja[];
  balanceMes: number;
}

interface HistorialAno {
  ano: number;
  meses: HistorialMes[];
}

const GestionDoctores: React.FC = () => {
  const [medicos, setMedicos] = useState<Medico[]>([]);
  const [selectedMedico, setSelectedMedico] = useState<Medico | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [showAllDoctors, setShowAllDoctors] = useState(false);

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

  const toggleShowAllDoctors = () => {
    setShowAllDoctors(!showAllDoctors);
  };

  // Campos del formulario
  const [nombre, setNombre] = useState('');
  const [especialidad, setEspecialidad] = useState('');
  const [telefono, setTelefono] = useState('');
  const [correo, setCorreo] = useState('');
  const [fechaIngreso, setFechaIngreso] = useState('');
  const [porcentajeComision, setPorcentajeComision] = useState('');

  // Cargar médicos al iniciar
  useEffect(() => {
    fetchMedicos();
  }, []);

  const fetchMedicos = async () => {
    try {
      setLoading(true);
      const { data: medicosData, error } = await supabase
        .from('medicos')
        .select('*');
  
      if (error) throw error;
  
      console.log('Fetched doctors:', medicosData); // Debug log
      setMedicos(medicosData as Medico[]);
    } catch (err) {
      toast.error(`Error al cargar médicos: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!nombre || !fechaIngreso) {
      toast.error('Nombre y fecha de ingreso son obligatorios');
      return;
    }

    const medicoData = {
      nombre,
      especialidad: especialidad || null,
      telefono: telefono || null,
      correo: correo || null,
      fecha_ingreso: fechaIngreso,
      porcentaje_comision: porcentajeComision ? parseFloat(porcentajeComision) : null,
    };

    try {
      if (selectedMedico) {
        // Actualizar médico
        const { error } = await supabase
          .from('medicos')
          .update(medicoData)
          .eq('id', selectedMedico.id);
        if (error) throw error;
        toast.success('Médico actualizado correctamente');
      } else {
        // Crear nuevo médico
        const { error } = await supabase.from('medicos').insert([medicoData]);
        if (error) throw error;
        toast.success('Médico registrado correctamente');
      }
      resetForm();
      fetchMedicos();
    } catch (err: any) {
      toast.error(`Error al guardar médico: ${err.message}`);
    }
  };

  const handleEdit = (medico: Medico) => {
    setSelectedMedico(medico);
    setNombre(medico.nombre || '');
    setEspecialidad(medico.especialidad || '');
    setTelefono(medico.telefono || '');
    setCorreo(medico.correo || '');
    setFechaIngreso(medico.fecha_ingreso ? medico.fecha_ingreso.split('T')[0] : '');
    setPorcentajeComision(medico.porcentaje_comision?.toString() || '');
  };

  const handleDelete = async (id: string) => {
    if (!id) {
      toast.error('ID de médico inválido');
      return;
    }
  
    if (!confirm('¿Está seguro de eliminar este médico?')) return;
  
    try {
      const { error } = await supabase
        .from('medicos')
        .update({ activo: false })
        .eq('id', id);
  
      if (error) throw error;
      
      // Optimistic update
      setMedicos(prev => prev.map(m => m.id === id ? {...m, activo: false} : m));
      
      toast.success('Médico marcado como inactivo');
    } catch (error) {
      console.error('Error al eliminar médico:', error);
      toast.error(`Error: ${error.message}`);
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

  const handleSelectMedico = (medico: Medico) => {
    setSelectedMedico(medico);
    setIsDetailModalOpen(true);
  };


  

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div style={{ backgroundColor: colors.primary[500] }} className="shadow">
        <div className="px-4 py-6 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-4">
              <h1 className="text-xl md:text-2xl font-bold text-white">Gestión de Médicos</h1>
              <span className="px-3 py-1 text-sm font-medium text-[#801461] bg-white rounded-full">
                {medicos.filter(m => m.activo).length} {medicos.filter(m => m.activo).length === 1 ? 'médico' : 'médicos'}
              </span>
            </div>
            <button
              onClick={() => {
                setSelectedMedico(null);
                setIsModalOpen(true);
              }}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-[#801461] bg-white rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nuevo Médico
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 py-6 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
              <button
                onClick={toggleShowAllDoctors}
                className={`px-4 py-2 text-sm font-medium rounded-md ${
                  showAllDoctors
                    ? 'text-white hover:bg-[#6a1252]'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                style={showAllDoctors ? { backgroundColor: colors.primary[500] } : {}}
              >
                {showAllDoctors ? 'Mostrar Solo Activos' : 'Mostrar Todos'}
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
                            handleDelete(medico.id);
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
}

const GestionPaciente: React.FC = () => {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPaciente, setEditingPaciente] = useState<Paciente | null>(null);
  const [selectedPaciente, setSelectedPaciente] = useState<Paciente | null>(null);
  const [query, setQuery] = useState('');
  const [showAllPatients, setShowAllPatients] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Form states
  const [dni, setDni] = useState('');
  const [nombres, setNombres] = useState('');
  const [apellidoPaterno, setApellidoPaterno] = useState('');
  const [apellidoMaterno, setApellidoMaterno] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [sexo, setSexo] = useState<'M' | 'F' | 'O'>('M');
  const [celular, setCelular] = useState('');
  const [telefonoFijo, setTelefonoFijo] = useState('');
  const [correo, setCorreo] = useState('');
  const [direccion, setDireccion] = useState('');
  const [distrito, setDistrito] = useState('');
  const [grupoSanguineo, setGrupoSanguineo] = useState('');
  const [alergias, setAlergias] = useState('');
  const [enfermedadesCronicas, setEnfermedadesCronicas] = useState('');
  const [medicamentosActuales, setMedicamentosActuales] = useState('');
  const [seguroMedico, setSeguroMedico] = useState('');
  const [estadoCivil, setEstadoCivil] = useState('');
  const [ocupacion, setOcupacion] = useState('');
  const [referencia, setReferencia] = useState('');
  const [historialDental, setHistorialDental] = useState('');

  const toggleShowAllPatients = () => {
    setShowAllPatients(!showAllPatients);
  };

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

  useEffect(() => {
    fetchPacientes();
  }, []);

  const handleSelectPaciente = (paciente: Paciente) => {
    setSelectedPaciente(paciente);
    setIsDetailModalOpen(true);
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      
      // Prepare the patient data
      const pacienteData = {
        nombres: formData.nombres,
        apellido_paterno: formData.apellido_paterno,
        apellido_materno: formData.apellido_materno,
        fecha_nacimiento: formData.fecha_nacimiento,
        dni: formData.dni,
        celular: formData.celular,
        sexo: formData.sexo,
        telefono_fijo: formData.telefono_fijo,
        correo: formData.correo,
        direccion: formData.direccion,
        distrito: formData.distrito,
        grupo_sanguineo: formData.grupo_sanguineo,
        alergias: formData.alergias,
        enfermedades_cronicas: formData.enfermedades_cronicas,
        medicamentos_actuales: formData.medicamentos_actuales,
        seguro_medico: formData.seguro_medico,
        estado_civil: formData.estado_civil,
        ocupacion: formData.ocupacion,
        referencia: formData.referencia,
        historial_dental: formData.historial_dental,
        fecha_registro: new Date().toISOString(),
        activo: true
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
          if (error.code === '23505') { // Unique constraint violation
            throw new Error('Ya existe un paciente con este DNI');
          }
          throw error;
        }
        result = data;
        toast.success('Paciente guardado correctamente');
      }

      // Refresh the patients list
      fetchPacientes();
      
      // Reset form and selection
      resetForm();
      setSelectedPaciente(null);
      
    } catch (error: any) {
      console.error('Error al guardar paciente:', error);
      toast.error(error.message || 'Error al guardar paciente');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (paciente: Paciente) => {
    setEditingPaciente(paciente);
    setDni(paciente.dni || '');
    setNombres(paciente.nombres);
    setApellidoPaterno(paciente.apellido_paterno);
    setApellidoMaterno(paciente.apellido_materno || '');
    setFechaNacimiento(paciente.fecha_nacimiento || '');
    setSexo(paciente.sexo || 'M');
    setCelular(paciente.celular || '');
    setTelefonoFijo(paciente.telefono_fijo || '');
    setCorreo(paciente.correo || '');
    setDireccion(paciente.direccion || '');
    setDistrito(paciente.distrito || '');
    setGrupoSanguineo(paciente.grupo_sanguineo || '');
    setAlergias(paciente.alergias || '');
    setEnfermedadesCronicas(paciente.enfermedades_cronicas || '');
    setMedicamentosActuales(paciente.medicamentos_actuales || '');
    setSeguroMedico(paciente.seguro_medico || '');
    setEstadoCivil(paciente.estado_civil || '');
    setOcupacion(paciente.ocupacion || '');
    setReferencia(paciente.referencia || '');
    setHistorialDental(paciente.historial_dental || '');
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Está seguro de eliminar este paciente?')) return;

    try {
      const { error } = await supabase
        .from('pacientes')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Paciente eliminado correctamente');
      fetchPacientes();
      if (selectedPaciente?.id === Number(id)) {
        setSelectedPaciente(null);
      }
    } catch (error: any) {
      console.error('Error al eliminar paciente:', error);
      toast.error(error.message || 'Error al eliminar paciente');
    }
  };

  const resetForm = () => {
    setEditingPaciente(null);
    setDni('');
    setNombres('');
    setApellidoPaterno('');
    setApellidoMaterno('');
    setFechaNacimiento('');
    setSexo('M');
    setCelular('');
    setTelefonoFijo('');
    setCorreo('');
    setDireccion('');
    setDistrito('');
    setGrupoSanguineo('');
    setAlergias('');
    setEnfermedadesCronicas('');
    setMedicamentosActuales('');
    setSeguroMedico('');
    setEstadoCivil('');
    setOcupacion('');
    setReferencia('');
    setHistorialDental('');
  };

  const filteredPacientes = useMemo(() => {
    return pacientes.filter(paciente => {
      const searchTerm = query.toLowerCase();
      return (
        paciente.nombres.toLowerCase().includes(searchTerm) ||
        paciente.apellido_paterno.toLowerCase().includes(searchTerm) ||
        paciente.apellido_materno?.toLowerCase().includes(searchTerm) ||
        paciente.dni?.toLowerCase().includes(searchTerm) ||
        paciente.celular?.toLowerCase().includes(searchTerm) ||
        paciente.correo?.toLowerCase().includes(searchTerm)
      );
    });
  }, [pacientes, query]);

  const pacientesToShow = showAllPatients ? filteredPacientes : filteredPacientes.slice(0, 15);

  return (
    <div className="min-h-screen bg-gray-50">
    {/* Header Section */}
    <div style={{ backgroundColor: colors.primary[500] }} className="shadow">
      <div className="px-4 py-6 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-4">
              <h1 className="text-xl md:text-2xl font-bold text-white">Gestión de Pacientes</h1>
              <span className="px-3 py-1 text-sm font-medium text-gray-600 bg-gray-100 rounded-full">
                {pacientes.length} {pacientes.length === 1 ? 'paciente' : 'pacientes'}
              </span>
            </div>
            <button
              onClick={() => {
                setSelectedPaciente(null);
                setIsModalOpen(true);
              }}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-[#801461] rounded-md hover:bg-[#6a1252] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#801461]"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nuevo Paciente
            </button>
          </div>
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

        {/* Patients List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Paciente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    DNI
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Teléfono
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center">
                      <div className="flex justify-center items-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary-500 border-t-transparent"></div>
                      </div>
                    </td>
                  </tr>
                ) : filteredPacientes.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                      No se encontraron pacientes
                    </td>
                  </tr>
                ) : (
                  pacientesToShow.map((paciente) => (
                    <tr
                      key={paciente.id} 
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleSelectPaciente(paciente)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {`${paciente.nombres} ${paciente.apellido_paterno} ${paciente.apellido_materno || ''}`}
                            </div>
                            <div className="text-sm text-gray-500">
                              {paciente.correo || 'Sin correo'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {paciente.dni || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {paciente.celular || paciente.telefono_fijo || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                          paciente.activo 
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {paciente.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(paciente);
                              setIsModalOpen(true);
                            }}
                            className="text-primary-600 hover:text-primary-900"
                            style={{ color: colors.primary[500] }}
                          >
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(paciente.id.toString());
                            }}
                            className="text-red-600 hover:text-red-900"
                          >
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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
        </div>
      </div>

      {/* Patient Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-200 z-10">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingPaciente ? 'Editar Paciente' : 'Nuevo Paciente'}
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Personal Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">Información Personal</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">DNI *</label>
                    <input
                      type="text"
                      value={dni}
                      onChange={(e) => setDni(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Nombres *</label>
                    <input
                      type="text"
                      value={nombres}
                      onChange={(e) => setNombres(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Apellido Paterno *</label>
                    <input
                      type="text"
                      value={apellidoPaterno}
                      onChange={(e) => setApellidoPaterno(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Apellido Materno</label>
                    <input
                      type="text"
                      value={apellidoMaterno}
                      onChange={(e) => setApellidoMaterno(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Fecha de Nacimiento *</label>
                    <input
                      type="date"
                      value={fechaNacimiento}
                      onChange={(e) => setFechaNacimiento(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Sexo *</label>
                    <select
                      value={sexo}
                      onChange={(e) => setSexo(e.target.value as 'M' | 'F' | 'O')}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      required
                    >
                      <option value="M">Masculino</option>
                      <option value="F">Femenino</option>
                      <option value="O">Otro</option>
                    </select>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">Información de Contacto</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Celular *</label>
                    <input
                      type="tel"
                      value={celular}
                      onChange={(e) => setCelular(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Teléfono Fijo</label>
                    <input
                      type="tel"
                      value={telefonoFijo}
                      onChange={(e) => setTelefonoFijo(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Correo Electrónico</label>
                    <input
                      type="email"
                      value={correo}
                      onChange={(e) => setCorreo(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Dirección</label>
                    <input
                      type="text"
                      value={direccion}
                      onChange={(e) => setDireccion(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Distrito</label>
                    <input
                      type="text"
                      value={distrito}
                      onChange={(e) => setDistrito(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    />
                  </div>
                </div>
              </div>

              {/* Medical Information */}
              <div className="mt-6 space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Información Médica</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Grupo Sanguíneo</label>
                    <input
                      type="text"
                      value={grupoSanguineo}
                      onChange={(e) => setGrupoSanguineo(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Alergias</label>
                    <textarea
                      value={alergias}
                      onChange={(e) => setAlergias(e.target.value)}
                      rows={2}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Enfermedades Crónicas</label>
                    <textarea
                      value={enfermedadesCronicas}
                      onChange={(e) => setEnfermedadesCronicas(e.target.value)}
                      rows={2}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Medicamentos Actuales</label>
                    <textarea
                      value={medicamentosActuales}
                      onChange={(e) => setMedicamentosActuales(e.target.value)}
                      rows={2}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    />
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div className="mt-6 space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Información Adicional</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Seguro Médico</label>
                    <input
                      type="text"
                      value={seguroMedico}
                      onChange={(e) => setSeguroMedico(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Estado Civil</label>
                    <select
                      value={estadoCivil}
                      onChange={(e) => setEstadoCivil(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    >
                      <option value="">Seleccionar...</option>
                      <option value="Soltero">Soltero(a)</option>
                      <option value="Casado">Casado(a)</option>
                      <option value="Divorciado">Divorciado(a)</option>
                      <option value="Viudo">Viudo(a)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Ocupación</label>
                    <input
                      type="text"
                      value={ocupacion}
                      onChange={(e) => setOcupacion(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Referencia</label>
                    <input
                      type="text"
                      value={referencia}
                      onChange={(e) => setReferencia(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Historial Dental</label>
                    <textarea
                      value={historialDental}
                      onChange={(e) => setHistorialDental(e.target.value)}
                      rows={3}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    />
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white"
                  style={{ backgroundColor: colors.primary[500] }}
                >
                  {editingPaciente ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Patient Detail Modal */}
      {isDetailModalOpen && selectedPaciente && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-200 z-10">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">
                  Detalles del Paciente
                </h2>
                <button
                  onClick={() => setIsDetailModalOpen(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Personal Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">Información Personal</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-500">DNI</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedPaciente.dni || '-'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Nombres Completos</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {`${selectedPaciente.nombres} ${selectedPaciente.apellido_paterno} ${selectedPaciente.apellido_materno || ''}`}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Fecha de Nacimiento</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {selectedPaciente.fecha_nacimiento ? new Date(selectedPaciente.fecha_nacimiento).toLocaleDateString() : '-'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Sexo</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {selectedPaciente.sexo === 'M' ? 'Masculino' : selectedPaciente.sexo === 'F' ? 'Femenino' : 'Otro'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">Información de Contacto</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Celular</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedPaciente.celular || '-'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Teléfono Fijo</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedPaciente.telefono_fijo || '-'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Correo Electrónico</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedPaciente.correo || '-'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Dirección</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedPaciente.direccion || '-'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Distrito</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedPaciente.distrito || '-'}</p>
                    </div>
                  </div>
                </div>

                {/* Medical Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">Información Médica</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Grupo Sanguíneo</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedPaciente.grupo_sanguineo || '-'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Alergias</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedPaciente.alergias || '-'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Enfermedades Crónicas</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedPaciente.enfermedades_cronicas || '-'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Medicamentos Actuales</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedPaciente.medicamentos_actuales || '-'}</p>
                    </div>
                  </div>
                </div>

                {/* Additional Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">Información Adicional</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Seguro Médico</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedPaciente.seguro_medico || '-'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Estado Civil</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedPaciente.estado_civil || '-'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Ocupación</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedPaciente.ocupacion || '-'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Referencia</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedPaciente.referencia || '-'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Historial Dental</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedPaciente.historial_dental || '-'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsDetailModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
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
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white"
                  style={{ backgroundColor: colors.primary[500] }}
                >
                  Editar Paciente
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


function MiCaja({ userId }: { userId: string }) {
  // Estados (manteniendo los existentes)
  const [registros, setRegistros] = useState<RegistroCaja[]>([]);
  const [fecha, setFecha] = useState<string>(new Date().toISOString().split('T')[0]);
  const [descripcion, setDescripcion] = useState('');
  const [valor, setValor] = useState('');
  const [numeroFactura, setNumeroFactura] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [totalDia, setTotalDia] = useState(0);
  const [balanceMes, setBalanceMes] = useState(0);
  const [tipoMovimiento, setTipoMovimiento] = useState<'Ingreso' | 'Egreso' | 'Ajuste'>('Ingreso');
  const [tipoMovimientoId, setTipoMovimientoId] = useState<number | null>(null);
  const [tiposMovimiento, setTiposMovimiento] = useState<TipoMovimiento[]>([]);
  const [historialVisible, setHistorialVisible] = useState(false);
  const [historialFiltrado, setHistorialFiltrado] = useState<{ano: number, meses: {mes: number, registros: RegistroCaja[]}[]}>({
    ano: new Date().getFullYear(),
    meses: Array.from({ length: 12 }, (_, i) => ({
      mes: i + 1,
      registros: []
    }))
  });
  const [chartData, setChartData] = useState<{ingresos: any, egresos: any} | null>(null);
  const [medicoId, setMedicoId] = useState<string | null>(null);
  const [formaPago, setFormaPago] = useState<'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA' | 'YAPE' | 'PLIN' | 'OTROS'>('EFECTIVO');
 const [medicos, setMedicos] = useState<Medico[]>([]);
    const [isLoadingMedicos, setIsLoadingMedicos] = useState(true);
    const [errorMedicos, setErrorMedicos] = useState<string | null>(null);
  const [busquedaPaciente, setBusquedaPaciente] = useState('');
  const [pacienteId, setPacienteId] = useState<string | null>(null);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [tipoMoneda, setTipoMoneda] = useState<'SOLES' | 'USD'>('SOLES');
  const [valorEnSoles, setValorEnSoles] = useState(0);
  const [query, setQuery] = useState('');
  const [selectedPaciente, setSelectedPaciente] = useState<{id: string, nombres: string, apellido_paterno: string} | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [fechaInicioHistorial, setFechaInicioHistorial] = useState<string>(''); 


  
  const [usuarioFiltro, setUsuarioFiltro] = useState('');
const [tipoFiltro, setTipoFiltro] = useState('');
const [categoriaFiltro, setCategoriaFiltro] = useState('');
const [pacienteFiltro, setPacienteFiltro] = useState('');
const [medicoFiltro, setMedicoFiltro] = useState('');
const [fechaFinHistorial, setFechaFinHistorial] = useState<string>(() => {
  const date = new Date();
  date.setMonth(date.getMonth() + 1); // Vai para o próximo mês
  date.setDate(0); // Dia 0 do próximo mês = último dia do mês atual
  return date.toISOString().split('T')[0];
});

  const [chartDataHistorial, setChartDataHistorial] = useState({
    ingresosPorCategoria: {
      labels: [],
      datasets: [{
        data: [],
        backgroundColor: []
      }]
    },
    egresosPorCategoria: {
      labels: [],
      datasets: [{
        data: [],
        backgroundColor: []
      }]
    },
    distribucionGeneral: {
      labels: [],
      datasets: [{
        data: [],
        backgroundColor: []
      }]
    },
    balanceEvolucion: {
      labels: [],
      datasets: [{
        label: 'Balance',
        data: [],
        borderColor: '#4CAF50',
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        fill: true,
        tension: 0.4
      }]
    }
  });
const [busquedaMedico, setBusquedaMedico] = useState('');
const [showMedicoDropdown, setShowMedicoDropdown] = useState(false);
 // Función para obtener el ID de la categoría "COMISIÓN TARJETA" o similar
  const obtenerIdCategoriaImpuestos = async () => {
    const NOMBRE_CATEGORIA = 'COMISIÓN TARJETA'; // Nombre exacto a buscar/crear
    
    try {
        // 1. Intentar encontrar la categoría existente
        const { data: categoriaExistente, error: errorBusqueda } = await supabase
            .from('tipos_movimiento')
            .select('id')
            .eq('nombre', NOMBRE_CATEGORIA)
            .eq('tipo', 'Egreso')
            .single();

        // Si existe, retornar el ID
        if (categoriaExistente) return categoriaExistente.id;
        
        // 2. Si no existe, crear la categoría
        const { data: nuevaCategoria, error: errorCreacion } = await supabase
            .from('tipos_movimiento')
            .insert([{
                nombre: NOMBRE_CATEGORIA,
                tipo: 'Egreso',
                descripcion: 'Comisiones por pagos con tarjeta',
                activo: true,
                es_comision: true
            }])
            .select('id')
            .single();

        if (errorCreacion) throw errorCreacion;
        
        return nuevaCategoria.id;
        
    } catch (error) {
        console.error('Error en obtenerIdCategoriaImpuestos:', error);
        return null;
    }
};

  // Función para formatear el valor según el tipo de movimiento
  const formatValor = (valor: number, tipo: 'Ingreso' | 'Egreso' | 'Ajuste') => {
    if (tipo === 'Ingreso') {
      return { display: `+${formatMoneda(valor)}`, color: 'text-green-600' };
    } else if (tipo === 'Egreso') {
      return { display: `-${formatMoneda(Math.abs(valor))}`, color: 'text-red-600' };
    } else { // Ajuste
      if (valor < 0) {
        return { display: `${formatMoneda(valor)}`, color: 'text-red-600' };
      } else {
        return { display: `+${formatMoneda(valor)}`, color: 'text-green-600' };
      }
    }
  };

  // Formatear número en soles
  const formatMoneda = (num: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num).replace('PEN', 'S/');
  };

  // Formatear fecha y hora
const formatDateTime = (dateString: string) => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return { fecha: 'Fecha inválida', hora: 'Hora inválida' };
    }
    return {
      fecha: date.toLocaleDateString('es-ES'),
      hora: date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
    };
  } catch (e) {
    return { fecha: 'Fecha inválida', hora: 'Hora inválida' };
  }
};

  // Cargar tipos de movimiento
  useEffect(() => {
    const cargarTiposMovimiento = async () => {
      try {
        setIsLoading(true);
        let query = supabase
          .from('tipos_movimiento')
          .select('*')
          .eq('activo', true);

        if (tipoMovimiento === 'Ingreso' || tipoMovimiento === 'Egreso' || tipoMovimiento === 'Ajuste') {
          query = query.eq('tipo', tipoMovimiento);
        }

        const { data, error } = await query;

        if (error) throw error;

        setTiposMovimiento(data || []);
        setTipoMovimientoId(data?.[0]?.id || null);
      } catch (error) {
        console.error('Error:', error);
        toast.error('Error al cargar tipos de movimiento');
      } finally {
        setIsLoading(false);
      }
    };

    cargarTiposMovimiento();
  }, [tipoMovimiento]);

   // Cargar PACIENTES
useEffect(() => {
  const cargarPacientes = async () => {
    try {
      //console.log('🔍 Iniciando carga de pacientes...');
      const { data, error } = await supabase
        .from('pacientes')
        .select('*')
        .eq('activo', true);

      if (error) {
        console.error('❌ Error al cargar pacientes:', error);
        throw error;
      }

      //console.log('📦 Datos recibidos de la base de datos:', data);

      // Transform the data to match our new structure
      const pacientesTransformados = data.map(paciente => {
        const nombreCompleto = paciente.nombres ? 
          `${paciente.nombres} ${paciente.apellido_paterno || ''} ${paciente.apellido_materno || ''}`.trim() : 
          paciente.nombre;
        
       // console.log('🔄 Transformando paciente:', {          original: paciente,          nombreCompleto: nombreCompleto        });

        return {
          ...paciente,
          nombre: nombreCompleto
        };
      });

      //console.log('✅ Pacientes transformados:', pacientesTransformados);
      setPacientes(pacientesTransformados);
    } catch (error) {
      console.error('❌ Error completo al cargar pacientes:', error);
      toast.error('Error al cargar lista de pacientes');
    }
  };

  cargarPacientes();
}, []);

  // Manejar cambio de valor con conversión de moneda
  const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValor = e.target.value;
    setValor(inputValor);
    
    if (inputValor) {
      const valorNumerico = parseFloat(inputValor);
      if (!isNaN(valorNumerico)) {
        if (tipoMoneda === 'USD') {
          const valorConvertido = valorNumerico * 3.7;
          setValorEnSoles(valorConvertido);
        } else {
          setValorEnSoles(valorNumerico);
        }
      }
    } else {
      setValorEnSoles(0);
    }
  };


 // Función para obtener médicos con manejo de errores mejorado
// Función mejorada para cargar médicos
const cargarMedicos = async () => {
  try {
    console.log('🔍 Iniciando carga de médicos...');
    const { data, error } = await supabase
      .from('medicos')
      .select('*')
      .eq('activo', true);

    if (error) {
      console.error('❌ Error al cargar médicos:', error);
      throw error;
    }

    console.log('✅ Médicos cargados:', data);
    setMedicos(data || []);
  } catch (error) {
    console.error('❌ Error completo al cargar médicos:', error);
    toast.error('Error al cargar médicos');
  }
};


 // Función para obtener médicos con manejo de errores mejorado
  useEffect(() => {
    const cargarMedicos = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('medicos')
          .select('id, nombre')
          .eq('activo', true)
          .order('nombre', { ascending: true });

        if (error) throw error;

        setMedicos(data || []);
      } catch (error) {
        console.error('Error al cargar médicos:', error);
        toast.error('Error al cargar lista de médicos');
      } finally {
        setIsLoading(false);
      }
    };
    
    cargarMedicos();
  }, []);


    // Preparar datos para el gráfico


  // Cargar registros y calcular balances
const cargarRegistros = async (fechaSeleccionada: string) => {
  try {
    const { data: registrosData, error: registrosError } = await supabase
      .from('registros_caja')
      .select(`
        *,
        tipo_movimiento:tipos_movimiento(*),
        usuario:users(nombre),
        medico:medicos(*),
        paciente:pacientes(*)
      `)
      .order('fecha', { ascending: false });

    if (registrosError) throw registrosError;

    const registrosProcesados: RegistroCaja[] = registrosData.map((registro: any) => ({
      id: String(registro.id),
      fecha: String(registro.fecha),
      tipo_movimiento_id: Number(registro.tipo_movimiento_id),
      tipo_movimiento: registro.tipo_movimiento ? {
        id: Number(registro.tipo_movimiento.id),
        nombre: String(registro.tipo_movimiento.nombre),
        tipo: registro.tipo_movimiento.tipo as 'Ingreso' | 'Egreso' | 'Ajuste'
      } : undefined,
      descripcion: String(registro.descripcion),
      valor: Number(registro.valor),
      numero_factura: registro.numero_factura ? String(registro.numero_factura) : undefined,
      user_id: String(registro.user_id),
      created_at: String(registro.created_at),
      usuario: registro.usuario ? {
        nombre: String(registro.usuario.nombre)
      } : undefined,
      paciente: registro.paciente ? {
        id: String(registro.paciente.id),
        nombres: String(registro.paciente.nombres),
        apellido_paterno: String(registro.paciente.apellido_paterno),
        apellido_materno: String(registro.paciente.apellido_materno),
        activo: Boolean(registro.paciente.activo),
        fecha_nacimiento: registro.paciente.fecha_nacimiento ? String(registro.paciente.fecha_nacimiento) : undefined,
        dni: registro.paciente.dni ? String(registro.paciente.dni) : undefined,
        celular: registro.paciente.celular ? String(registro.paciente.celular) : undefined,
        sexo: registro.paciente.sexo as 'M' | 'F' | 'O' | undefined,
        telefono_fijo: registro.paciente.telefono_fijo ? String(registro.paciente.telefono_fijo) : undefined,
        correo: registro.paciente.correo ? String(registro.paciente.correo) : undefined,
        direccion: registro.paciente.direccion ? String(registro.paciente.direccion) : undefined,
        distrito: registro.paciente.distrito ? String(registro.paciente.distrito) : undefined,
        grupo_sanguineo: registro.paciente.grupo_sanguineo ? String(registro.paciente.grupo_sanguineo) : undefined,
        alergias: registro.paciente.alergias ? String(registro.paciente.alergias) : undefined,
        enfermedades_cronicas: registro.paciente.enfermedades_cronicas ? String(registro.paciente.enfermedades_cronicas) : undefined,
        medicamentos_actuales: registro.paciente.medicamentos_actuales ? String(registro.paciente.medicamentos_actuales) : undefined,
        seguro_medico: registro.paciente.seguro_medico ? String(registro.paciente.seguro_medico) : undefined,
        estado_civil: registro.paciente.estado_civil ? String(registro.paciente.estado_civil) : undefined,
        ocupacion: registro.paciente.ocupacion ? String(registro.paciente.ocupacion) : undefined,
        referencia: registro.paciente.referencia ? String(registro.paciente.referencia) : undefined,
        historial_dental: registro.paciente.historial_dental ? String(registro.paciente.historial_dental) : undefined,
        fecha_registro: registro.paciente.fecha_registro ? String(registro.paciente.fecha_registro) : undefined,
        ultima_visita: registro.paciente.ultima_visita ? String(registro.paciente.ultima_visita) : undefined
      } : undefined,
      medico: registro.medico ? {
        id: String(registro.medico.id),
        nombre: String(registro.medico.nombre),
        activo: Boolean(registro.medico.activo),
        fecha_ingreso: registro.medico.fecha_ingreso ? String(registro.medico.fecha_ingreso) : undefined,
        especialidad: registro.medico.especialidad ? String(registro.medico.especialidad) : undefined
      } : undefined,
      forma_pago: registro.forma_pago as 'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA' | 'YAPE' | 'PLIN' | 'OTROS' | undefined
    }));

    // Filtrar registros del día seleccionado
    const registrosDelDia = registrosProcesados.filter(registro => {
      const fechaRegistro = new Date(registro.fecha).toISOString().split('T')[0];
      return fechaRegistro === fechaSeleccionada;
    });

    setRegistros(registrosDelDia);
    calcularTotales(registrosDelDia);
  } catch (error: any) {
    console.error('Error cargando registros:', error);
    toast.error('Error al cargar registros');
  }
};

  const calcularTotales = (registros: RegistroCaja[]) => {
    const totalDia = registros.reduce((total, registro) => total + registro.valor, 0);
    setTotalDia(totalDia);
    const balanceMes = registros.reduce((total, registro) => total + registro.valor, 0);
    setBalanceMes(balanceMes);
  };

  // Cargar historial
  const cargarHistorial = async (filtros: {
    fechaInicio: string,
    fechaFin: string,
    usuario?: string,
    tipo?: string,
    categoria?: string,
    paciente?: string,
    medico?: string,
    formaPago?: string
  }) => {
    try {
      setIsLoading(true);
      
      // Construir la consulta base
      let query = supabase
        .from('registros_caja')
        .select(`
          id,
          fecha,
          descripcion,
          valor,
          numero_factura,
          forma_pago,
          moneda,
          created_at,
          tipo_movimiento:tipos_movimiento(id, nombre, tipo),
          usuario:users(id, nombre),
          medico:medicos(id, nombre),
          paciente:pacientes(id, nombres, apellido_paterno, apellido_materno)
        `)
        .gte('fecha', filtros.fechaInicio)
        .lte('fecha', filtros.fechaFin)
        .order('fecha', { ascending: false });
  
      // Aplicar filtros adicionales si existen
      if (filtros.usuario) query = query.eq('user_id', filtros.usuario);
      if (filtros.tipo) query = query.eq('tipo_movimiento.tipo', filtros.tipo);
      if (filtros.categoria) query = query.eq('tipo_movimiento_id', filtros.categoria);
      if (filtros.paciente) query = query.eq('paciente_id', filtros.paciente);
      if (filtros.medico) query = query.eq('medico_id', filtros.medico);
      if (filtros.formaPago) query = query.eq('forma_pago', filtros.formaPago);
  
      const { data: registrosData, error: registrosError } = await query;
  
      if (registrosError) throw registrosError;
  
      // Procesar los registros
      const registrosProcesados: RegistroCaja[] = registrosData.map((registro: any) => ({
        id: String(registro.id),
        fecha: String(registro.fecha),
        tipo_movimiento_id: registro.tipo_movimiento ? Number(registro.tipo_movimiento.id) : null,
        tipo_movimiento: registro.tipo_movimiento ? {
          id: Number(registro.tipo_movimiento.id),
          nombre: String(registro.tipo_movimiento.nombre),
          tipo: registro.tipo_movimiento.tipo as 'Ingreso' | 'Egreso' | 'Ajuste'
        } : undefined,
        descripcion: String(registro.descripcion),
        valor: Number(registro.valor),
        numero_factura: registro.numero_factura ? String(registro.numero_factura) : undefined,
        forma_pago: registro.forma_pago as 'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA' | 'YAPE' | 'PLIN' | 'OTROS',
        moneda: registro.moneda as 'SOLES' | 'USD',
        user_id: registro.usuario ? String(registro.usuario.id) : undefined,
        created_at: String(registro.created_at),
        usuario: registro.usuario ? {
          id: String(registro.usuario.id),
          nombre: String(registro.usuario.nombre)
        } : undefined,
        paciente: registro.paciente ? {
          id: String(registro.paciente.id),
          nombres: String(registro.paciente.nombres),
          apellido_paterno: String(registro.paciente.apellido_paterno),
          apellido_materno: String(registro.paciente.apellido_materno)
        } : undefined,
        medico: registro.medico ? {
          id: String(registro.medico.id),
          nombre: String(registro.medico.nombre)
        } : undefined
      }));
  
      // Organizar registros por año y mes
      const historialFormateado = organizarRegistrosPorMes(registrosProcesados);
      setHistorialFiltrado(historialFormateado);
  
      // Preparar datos para gráficos
      const chartData = prepararDatosGrafico(registrosProcesados);
      setChartDataHistorial(chartData);
  
      // Calcular balance total
      const balanceTotal = calcularBalanceTotal(registrosProcesados);
      setBalanceMes(balanceTotal);
  
    } catch (error) {
      console.error('Error cargando historial:', error);
      toast.error(error instanceof Error ? error.message : 'Error al cargar historial');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Función auxiliar para organizar registros por mes
  const organizarRegistrosPorMes = (registros: RegistroCaja[]) => {
    const resultado: {ano: number, meses: {mes: number, registros: RegistroCaja[], balanceMes: number}[]} = {
      ano: new Date().getFullYear(),
      meses: Array.from({ length: 12 }, (_, i) => ({
        mes: i + 1,
        registros: [],
        balanceMes: 0
      }))
    };
  
    registros.forEach(registro => {
      const fecha = new Date(registro.fecha);
      const mes = fecha.getMonth();
      const ano = fecha.getFullYear();
  
      if (ano === resultado.ano) {
        resultado.meses[mes].registros.push(registro);
        resultado.meses[mes].balanceMes += registro.valor;
      }
    });
  
    return resultado;
  };
  
  // Función auxiliar para calcular el balance total
  const calcularBalanceTotal = (registros: RegistroCaja[]) => {
    return registros.reduce((total, registro) => total + registro.valor, 0);
  };
  
  // Función auxiliar para preparar datos de gráficos
  const prepararDatosGrafico = (registros: RegistroCaja[]) => {
    // Filtrar y sumar ingresos (incluye ajustes positivos)
    const ingresos = registros.filter(r => 
      r.tipo_movimiento?.tipo === 'Ingreso' || 
      (r.tipo_movimiento?.tipo === 'Ajuste' && r.valor >= 0)
    );
    
    const categoriasIngresos = ingresos.reduce((acc, registro) => {
      const categoria = registro.tipo_movimiento?.nombre || 'Otros ingresos';
      acc[categoria] = (acc[categoria] || 0) + Math.abs(registro.valor);
      return acc;
    }, {} as Record<string, number>);
  
    // Filtrar y sumar egresos (incluye ajustes negativos)
    const egresos = registros.filter(r => 
      r.tipo_movimiento?.tipo === 'Egreso' || 
      (r.tipo_movimiento?.tipo === 'Ajuste' && r.valor < 0)
    );
    
    const categoriasEgresos = egresos.reduce((acc, registro) => {
      const categoria = registro.tipo_movimiento?.nombre || 'Otros egresos';
      acc[categoria] = (acc[categoria] || 0) + Math.abs(registro.valor);
      return acc;
    }, {} as Record<string, number>);
  
    // Calcular totales
    const totalIngresos = Object.values(categoriasIngresos).reduce((a, b) => a + b, 0);
    const totalEgresos = Object.values(categoriasEgresos).reduce((a, b) => a + b, 0);
  
    // Preparar datos para el gráfico de evolución del balance
    const registrosOrdenados = [...registros].sort((a, b) => 
      new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
    );
  
    let balanceAcumulado = 0;
    const balanceEvolucion = registrosOrdenados.map(registro => {
      balanceAcumulado += registro.valor;
      return {
        fecha: new Date(registro.fecha).toLocaleDateString('es-ES'),
        balance: balanceAcumulado
      };
    });
  
    return {
      ingresosPorCategoria: {
        labels: Object.keys(categoriasIngresos),
        datasets: [{
          data: Object.values(categoriasIngresos),
          backgroundColor: [
            '#4CAF50', '#81C784', '#A5D6A7', '#C8E6C9',
            '#388E3C', '#66BB6A', '#43A047', '#2E7D32'
          ],
          borderWidth: 1
        }]
      },
      egresosPorCategoria: {
        labels: Object.keys(categoriasEgresos),
        datasets: [{
          data: Object.values(categoriasEgresos),
          backgroundColor: [
            '#F44336', '#E57373', '#EF9A9A', '#FFCDD2',
            '#D32F2F', '#F44336', '#E53935', '#C62828'
          ],
          borderWidth: 1
        }]
      },
      distribucionGeneral: {
        labels: ['Ingresos', 'Egresos'],
        datasets: [{
          data: [totalIngresos, totalEgresos],
          backgroundColor: ['#81C784', '#E57373'],
          borderColor: ['#388E3C', '#D32F2F'],
          borderWidth: 1
        }]
      },
      balanceEvolucion: {
        labels: balanceEvolucion.map(item => item.fecha),
        datasets: [{
          label: 'Balance',
          data: balanceEvolucion.map(item => item.balance),
          borderColor: '#4CAF50',
          backgroundColor: 'rgba(76, 175, 80, 0.1)',
          fill: true,
          tension: 0.4
        }]
      }
    };
  };

// Componente de filtros para el historial (debes agregarlo en tu JSX)
const FiltrosHistorial = () => {
  // Add these states if not already defined
  const [usuarios, setUsuarios] = useState<Array<{id: string, nombre: string}>>([]);
  const [categorias, setCategorias] = useState<Array<{id: string, nombre: string}>>([]);

  useEffect(() => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  
    // Solo setea si están vacías
    setFechaInicioHistorial(prev => prev || firstDay.toISOString().split("T")[0]);
    setFechaFinHistorial(prev => prev || lastDay.toISOString().split("T")[0]);
  }, []);
  

  // Fetch users and categories on mount
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        // Fetch users
        const { data: users } = await supabase.from('users').select('id, nombre');
        if (users) setUsuarios(users);
        
        // Fetch categories
        const { data: cats } = await supabase.from('tipos_movimiento').select('id, nombre');
        if (cats) setCategorias(cats);
      } catch (error) {
        console.error("Error fetching filter options:", error);
      }
    };

    fetchFilterOptions();
  }, []);
  

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
      {/* Fecha Inicio */}
      <div className="md:col-span-1">
        <label className="block text-sm font-medium mb-1">Fecha Inicio:</label>
        <input
  type="date"
  value={fechaInicioHistorial}
  onChange={(e) => setFechaInicioHistorial(e.target.value)}
  min="2020-01-01" // opcional: permite selecionar desde 2020
  className="w-full rounded-lg border-gray-300 shadow-sm p-2 border text-sm"
/>
      </div>

      {/* Fecha Fin */}
      <div className="md:col-span-1">
        <label className="block text-sm font-medium mb-1">Fecha Fin:</label>
        <input
          type="date"
          value={fechaFinHistorial}
          onChange={(e) => setFechaFinHistorial(e.target.value)}
          className="w-full rounded-lg border-gray-300 shadow-sm p-2 border text-sm"
        />
      </div>

      {/* Usuario */}
      <div className="md:col-span-1">
        <label className="block text-sm font-medium mb-1">Usuario:</label>
        <select
          value={usuarioFiltro}
          onChange={(e) => setUsuarioFiltro(e.target.value)}
          className="w-full rounded-lg border-gray-300 shadow-sm p-2 border text-sm"
        >
          <option value="">Todos</option>
          {usuarios.map((u) => (
            <option key={u.id} value={u.id}>{u.nombre}</option>
          ))}
        </select>
      </div>

      {/* Tipo */}
      <div className="md:col-span-1">
        <label className="block text-sm font-medium mb-1">Tipo:</label>
        <select
          value={tipoFiltro}
          onChange={(e) => setTipoFiltro(e.target.value)}
          className="w-full rounded-lg border-gray-300 shadow-sm p-2 border text-sm"
        >
          <option value="">Todos</option>
          <option value="Ingreso">Ingreso</option>
          <option value="Egreso">Egreso</option>
          <option value="Ajuste">Ajuste</option>
        </select>
      </div>

      {/* Categoría */}
      <div className="md:col-span-1">
        <label className="block text-sm font-medium mb-1">Categoría:</label>
        <select
          value={categoriaFiltro}
          onChange={(e) => setCategoriaFiltro(e.target.value)}
          className="w-full rounded-lg border-gray-300 shadow-sm p-2 border text-sm"
        >
          <option value="">Todas</option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>{c.nombre}</option>
          ))}
        </select>
      </div>

      {/* Paciente */}
      <div className="md:col-span-1">
        <label className="block text-sm font-medium mb-1">Paciente:</label>
        <select
          value={pacienteFiltro}
          onChange={(e) => setPacienteFiltro(e.target.value)}
          className="w-full rounded-lg border-gray-300 shadow-sm p-2 border text-sm"
        >
          <option value="">Todos</option>
          {pacientes.map((p) => (
            <option key={p.id} value={p.id}>
              {`${p.nombres} ${p.apellido_paterno || ''}`.trim()}
            </option>
          ))}
        </select>
      </div>

      {/* Médico */}
      <div className="md:col-span-1">
        <label className="block text-sm font-medium mb-1">Médico:</label>
        <select
          value={medicoFiltro}
          onChange={(e) => setMedicoFiltro(e.target.value)}
          className="w-full rounded-lg border-gray-300 shadow-sm p-2 border text-sm"
        >
          <option value="">Todos</option>
          {medicos.map((m) => (
            <option key={m.id} value={m.id}>{m.nombre}</option>
          ))}
        </select>
      </div>

      {/* Botones */}
      <div className="flex items-end gap-2 md:col-span-2 lg:col-span-7">
      <button 
  onClick={() => cargarHistorial({
    fechaInicio: fechaInicioHistorial,
    fechaFin: fechaFinHistorial,
    usuario: usuarioFiltro,
    tipo: tipoFiltro,
    categoria: categoriaFiltro,
    paciente: pacienteFiltro,
    medico: medicoFiltro
  })}
  className="px-4 py-2 text-white rounded-lg hover:opacity-90 flex-1"
  style={{ backgroundColor: '#801461' }}
>
  Aplicar Filtros
</button>
        <button
          onClick={() => {
            setFechaInicioHistorial('');
            setFechaFinHistorial('');
            setUsuarioFiltro('');
            setTipoFiltro('');
            setCategoriaFiltro('');
            setPacienteFiltro('');
            setMedicoFiltro('');
          }}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 flex-1"
        >
          Limpiar
        </button>
      </div>
    </div>
  );
};


// En tu JSX, muestra los gráficos del historial así:


  useEffect(() => {
    if (userId && fecha) {
      cargarRegistros(fecha);
      if (historialVisible) cargarHistorial();
    }
  }, [userId, fecha, historialVisible]);


  useEffect(() => {
    if (userId && fecha) {
      cargarRegistros(fecha);
      if (historialVisible) {
        cargarHistorial();
      }
    }
  }, [userId, fecha, historialVisible]);

  // Agregar nuevo registro
const agregarRegistro = async () => {
    if ( !valor) {
      toast.error('Valor es requerido');
      return;
    }
    if (!tipoMovimientoId) {
      toast.error('Debe seleccionar una categoría');
      return;
    }

    let valorNumerico = valorEnSoles;
    if (isNaN(valorNumerico)) {
      toast.error('El valor debe ser un número');
      return;
    }

    // Validación de fecha - asegurarnos que es una fecha válida
     const fechaParaSupabase = new Date(fecha);
  
  // Asegurarnos que la fecha es válida
  if (isNaN(fechaParaSupabase.getTime())) {
    toast.error('Fecha no válida');
    return;
  }

  // Formatear a ISO sin tiempo (YYYY-MM-DD)
  const fechaISO = fechaParaSupabase.toISOString().split('T')[0];
    const tipoMovimientoSeleccionado = tiposMovimiento.find(t => t.id === tipoMovimientoId)?.tipo;
    if (tipoMovimientoSeleccionado === 'Ingreso' && valorNumerico < 0) {
      toast.error('Los ingresos deben ser valores positivos');
      return;
    }
    if (tipoMovimientoSeleccionado === 'Egreso') {
      valorNumerico = -Math.abs(valorNumerico);
    }

    setIsLoading(true);
    try {
      // Insertar registro principal - usando fechaiso
      const { data: registroInsertado, error: errorRegistro } = await supabase
        .from('registros_caja')
        .insert([{
          fecha: fechaISO,// Aquí usamos la fecha formateada
          tipo_movimiento_id: tipoMovimientoId,
          descripcion,
          valor: valorNumerico,
          numero_factura: numeroFactura || null,
          user_id: userId,
          medico_id: medicoId,
          forma_pago: formaPago,
          paciente_id: pacienteId
        }])
        .select()
        .single();

      if (errorRegistro) throw errorRegistro;

      // Si es un ingreso con tarjeta, agregar el egreso del 5%
 if (tipoMovimientoSeleccionado === 'Ingreso' && formaPago === 'TARJETA') {
    // Calcular comisión con 2 decimales
    const comisionTarjeta = parseFloat((Math.abs(valorNumerico) * 0.05).toFixed(2));
    
    try {
        // Validar que tenemos un ID de registro principal
        if (!registroInsertado?.id) {
            throw new Error('Falta ID del registro principal para la relación');
        }

        // Insertar directamente usando el ID conocido (116)
        const { error: errorComision } = await supabase
            .from('registros_caja')
            .insert([{
                fecha: fechaISO,
                tipo_movimiento_id: 116, // ID fijo de Impuestos
                descripcion: `Comisión tarjeta (${descripcion.substring(0, 45)})`, // Limitar a 50 chars
                valor: -comisionTarjeta, // Valor negativo (egreso)
                user_id: userId,
                medico_id: medicoId || null,
                forma_pago: 'TARJETA',
                paciente_id: pacienteId || null,
                //relacionado_con: registroInsertado.id
            }]);

        if (errorComision) {
            console.error('Error al insertar comisión:', {
                message: errorComision.message,
                details: errorComision.details,
                hint: errorComision.hint
            });
            throw errorComision;
        }

        toast.success(`✓ Ingreso + comisión de S/${comisionTarjeta} registrados`);
        
    } catch (error: any) {
        console.error('Error en comisión por tarjeta:', {
            error: error,
            stack: error.stack
        });
        toast.error(`✓ Ingreso registrado ✗ Comisión falló: ${error.message}`);
    }
}

      toast.success('Registro agregado correctamente');
      // Resetear formulario
      setDescripcion('');
      setValor('');
      setValorEnSoles(0);
      setNumeroFactura('');
      setMedicoId(null);
      setPacienteId(null);
      setSelectedPaciente(null);
      setBusquedaPaciente('');
      setTipoMoneda('SOLES');
      // Recargar registros con la fecha usada
      cargarRegistros(fechaISO);
    } catch (error: any) {
      console.error('Error agregando registro:', error);
      toast.error(`Error al agregar registro: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Eliminar registro
  const eliminarRegistro = async (id: string) => {
    console.log('Attempting to delete record with ID:', id, 'Type:', typeof id);
    
    // Validación para UUID (ejemplo: 3afdad59-fb62-4760-953d-26791f179791)
    if (!id || typeof id !== 'string' || id.length !== 36) {
      console.error('Invalid ID format:', id);
      toast.error('ID de registro inválido: Formato incorrecto');
      return;
    }

    if (!window.confirm('¿Estás seguro de eliminar este registro?')) return;

    try {
      console.log('Sending delete request for ID:', id);
      const { error } = await supabase
        .from('registros_caja')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      toast.success('Registro eliminado correctamente');
      cargarRegistros(fecha);
      if (historialVisible) {
        cargarHistorial();
      }
    } catch (error: any) {
      console.error('Error eliminando registro:', {
        message: error.message,
        code: error.code,
        details: error.details,
        id: id
      });
      toast.error(`Error al eliminar registro: ${error.message}`);
    }
};

  // Estilos actualizados con la nueva paleta de colores
  const styles = {
    header: {
      backgroundColor: colorPrimary,
      color: 'white',
    },
    buttonPrimary: {
      backgroundColor: colorPrimary,
      color: 'white',
    },
    buttonSecondary: {
      backgroundColor: colorSecondary,
      color: colorPrimaryDark,
    },
    card: {
      borderColor: colorPrimaryLight,
    },
    badgeIngreso: {
      backgroundColor: '#E6F7EE',
      color: '#1B705B',
    },
    badgeEgreso: {
      backgroundColor: '#FEE9E9',
      color: '#D14343',
    },
    badgeAjuste: {
      backgroundColor: '#FEF6E6',
      color: '#E68A00',
    }
  };


// Filtrar pacientes basado en la búsqueda
const filteredPacientes = query === ''
  ? pacientes
  : pacientes.filter((paciente) => {
      return paciente.nombre.toLowerCase().includes(query.toLowerCase());
    });
  

  return (
   


<div className="bg-white rounded-xl shadow-md overflow-hidden mb-3">
        <div 
          className="p-4 md:p-6 text-white"
          style={{ backgroundColor: colors.primary[500] }}
        >
          <h1 className="text-xl md:text-2xl font-bold">Gestión Financiera</h1>
          
        </div>
      <div className="p-3 md:p-6 space-y-4 md:space-y-6">
        {/* Filtros y resumen */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-3 sm:gap-4">
          <div className="w-full sm:w-auto">
            <label className="block text-sm font-medium mb-1" style={{ color: colorPrimaryDark }}>Fecha:</label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border text-sm"
              style={{ borderColor: colorPrimaryLight }}
            />
          </div>
          
          <button
            onClick={() => setHistorialVisible(!historialVisible)}
            className="w-full sm:w-auto px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center transition-colors"
            style={{
              backgroundColor: historialVisible ? colorPrimaryDark : colorSecondary,
              color: historialVisible ? 'white' : colorPrimaryDark
            }}
          >
            {historialVisible ? (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Ocultar Historial
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Ver Historial
              </>
            )}
          </button>
        </div>

        {/* Formulario de registro */}
        <div className="bg-gray-50 p-3 md:p-4 rounded-lg">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 md:gap-4">
            {/* Tipo */}
            <div className="lg:col-span-1">
              <label className="block text-sm font-medium mb-1" style={{ color: colorPrimaryDark }}>Tipo</label>
              <select
                value={tipoMovimiento}
                onChange={(e) => setTipoMovimiento(e.target.value as 'Ingreso' | 'Egreso' | 'Ajuste')}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 text-sm"
                style={{ borderColor: colorPrimaryLight }}
              >
                <option value="Ingreso">Ingreso</option>
                <option value="Egreso">Egreso</option>
                <option value="Ajuste">Ajuste</option>
              </select>
            </div>

            {/* Categoría */}
            <div className="lg:col-span-1">
              <label className="block text-sm font-medium mb-1" style={{ color: colorPrimaryDark }}>Categoría</label>
              <select
                value={tipoMovimientoId || ''}
                onChange={(e) => setTipoMovimientoId(Number(e.target.value) || null)}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 text-sm"
                disabled={tiposMovimiento.length === 0 || isLoading}
              >
                {isLoading ? (
                  <option value="">Cargando...</option>
                ) : tiposMovimiento.length === 0 ? (
                  <option value="">No hay categorías</option>
                ) : (
                  <>
                    <option value="">Seleccione categoría</option>
                    {tiposMovimiento.map((t) => (
                      <option key={t.id} value={t.id}>{t.nombre}</option>
                    ))}
                  </>
                )}
              </select>
            </div>

            {/* Médico */}
            <div className="lg:col-span-1">
              <label className="block text-sm font-medium mb-1" style={{ color: colorPrimaryDark }}>Médico</label>
              <select
                value={medicoId || ''}
                onChange={(e) => {
                  console.log('🔄 Médico seleccionado:', e.target.value);
                  setMedicoId(e.target.value);
                }}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 text-sm"
              >
                <option value="">Seleccionar médico</option>
                {medicos.map((medico) => {
                  //console.log('📋 Renderizando médico:', medico);
                  return (
                    <option key={medico.id} value={medico.id}>
                      {medico.nombre}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Paciente */}
            <div className="lg:col-span-1">
              <label className="block text-sm font-medium mb-1" style={{ color: colorPrimaryDark }}>Paciente</label>
              <div className="relative">
                <input
                  type="text"
                  value={busquedaPaciente}
                  onChange={(e) => {
                   // console.log('🔍 Buscando paciente:', e.target.value);
                    setBusquedaPaciente(e.target.value);
                    setShowDropdown(true);
                  }}
                  onFocus={() => setShowDropdown(true)}
                  placeholder="Buscar paciente..."
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 text-sm"
                />
                {showDropdown && busquedaPaciente && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                    {pacientes
                      .filter(p => {
                        if (!p || !p.nombre) {
                          console.log('⚠️ Paciente inválido:', p);
                          return false;
                        }
                        const matches = p.nombre.toLowerCase().includes(busquedaPaciente.toLowerCase());
                        //console.log('🔍 Filtrando paciente:', { nombre: p.nombre, matches });
                        return matches;
                      })
                      .map(p => {
                        //console.log('📋 Renderizando opción de paciente:', p);
                        return (
                          <div
                            key={p.id}
                            className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                            onClick={() => {
                              console.log('👆 Paciente seleccionado:', p);
                              setPacienteId(p.id);
                              setBusquedaPaciente(p.nombre);
                              setShowDropdown(false);
                            }}
                          >
                            {p.nombre}
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            </div>

            {/* Forma de Pago */}
            <div className="lg:col-span-1">
              <label className="block text-sm font-medium mb-1" style={{ color: colorPrimaryDark }}>Forma de Pago</label>
              <select
                value={formaPago}
                onChange={(e) => setFormaPago(e.target.value as 'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA' | 'YAPE' | 'PLIN' | 'OTROS')}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 text-sm"
              >
                <option value="EFECTIVO">Efectivo</option>
                <option value="TARJETA">Tarjeta</option>
                <option value="TRANSFERENCIA">Transferencia</option>
                <option value="YAPE">Yape</option>
                <option value="PLIN">Plin</option>
                <option value="OTROS">Otros</option>
              </select>
            </div>

            {/* Moneda */}
            <div className="lg:col-span-1">
              <label className="block text-sm font-medium mb-1" style={{ color: colorPrimaryDark }}>Moneda</label>
              <select
                value={tipoMoneda}
                onChange={(e) => setTipoMoneda(e.target.value as 'SOLES' | 'USD')}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 text-sm"
              >
                <option value="SOLES">Soles</option>
                <option value="USD">Dólares</option>
              </select>
            </div>

            {/* Descripción */}
            <div className="lg:col-span-3">
              <label className="block text-sm font-medium mb-1" style={{ color: colorPrimaryDark }}>Descripción</label>
              <input
                type="text"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Descripción del movimiento"
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 text-sm"
                style={{ borderColor: colorPrimaryLight }}
              />
            </div>

            {/* Valor */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium mb-1" style={{ color: colorPrimaryDark }}>
                Valor ({tipoMoneda === 'USD' ? 'USD' : 'S/'})
              </label>
              <input
                type="number"
                step="0.01"
                value={valor}
                onChange={handleValorChange}
                placeholder="0.00"
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 text-sm"
                style={{ borderColor: colorPrimaryLight }}
              />
              {tipoMoneda === 'USD' && valor && !isNaN(parseFloat(valor)) && (
                <p className="text-xs text-gray-500 mt-1">
                  ≈ {formatMoneda(valorEnSoles)}
                </p>
              )}
            </div>

            {/* Nº Factura */}
            <div className="lg:col-span-1">
              <label className="block text-sm font-medium mb-1" style={{ color: colorPrimaryDark }}>Nº Factura</label>
              <input
                type="text"
                value={numeroFactura}
                onChange={(e) => setNumeroFactura(e.target.value)}
                placeholder="(Opcional)"
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 text-sm"
                style={{ borderColor: colorPrimaryLight }}
              />
            </div>
          </div>

          {/* Botón Agregar */}
          <div className="mt-4 flex justify-end">
            <button
              onClick={agregarRegistro}
              disabled={isLoading || !valor || !tipoMovimientoId}
              className="w-full sm:w-auto px-6 py-2 rounded-lg text-sm font-medium flex items-center justify-center transition-colors disabled:opacity-50"
              style={{
                backgroundColor: colorPrimary,
                color: 'white',
                opacity: isLoading || !valor || !tipoMovimientoId ? 0.5 : 1
              }}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-15" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Procesando...
                </>
              ) : 'Agregar Registro'}
            </button>
          </div>
        </div>

        {/* Registros del día */}
        <div className="mt-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
            <h3 className="text-lg font-semibold" style={{ color: colorPrimaryDark }}>Movimientos del día</h3>
            <div className="px-3 py-1 rounded-lg" style={{ backgroundColor: colorSecondary }}>
              <p className="text-sm font-medium" style={{ color: colorPrimaryDark }}>
                Balance del día: 
                <span className={`ml-2 text-lg ${totalDia >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatMoneda(totalDia)}
                </span>
              </p>
            </div>
          </div>

          {/* Tabla de registros */}
          <div className="overflow-x-auto rounded-lg border" style={{ borderColor: colorPrimaryLight }}>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {[
                    'Fecha', 'Tipo', 'Categoría', 'Médico', 'Paciente',
                    'Forma Pago', 'Valor', 'Factura', 'Usuario', 'Acciones'
                  ].map((col) => (
                    <th
                      key={col}
                      className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap"
                      style={{ color: colorPrimaryDark }}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading && registros.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-3 py-4 text-center">
                      <div className="flex justify-center items-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent"></div>
                      </div>
                    </td>
                  </tr>
                ) : registros.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-3 py-4 text-center text-sm text-gray-500">
                      No hay registros para esta fecha
                    </td>
                  </tr>
                ) : (
                  registros.map((registro) => {
                    const tipo = registro.tipo_movimiento?.tipo;
                    const { display: valorDisplay, color: valorColor } = formatValor(registro.valor, tipo || 'Egreso');
                    const { fecha: fechaISO, hora } = formatDateTime(registro.fecha);
                    
                    return (
                      <tr key={registro.id} className="hover:bg-gray-50">
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                          {fechaISO}
                          <br />
                          <span className="text-xs">{hora}</span>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                            tipo === 'Ingreso' 
                              ? 'bg-green-100 text-green-800' 
                              : tipo === 'Egreso' 
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {tipo || 'DESC'}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-900">
                          {registro.tipo_movimiento?.nombre || 'Desconocido'}
                          {registro.descripcion && (
                            <p className="text-xs text-gray-500 truncate max-w-xs">{registro.descripcion}</p>
                          )}
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-900">
                          {registro.medico?.nombre || '-'}
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-900">
                          {registro.paciente ? 
                            `${registro.paciente.nombres} ${registro.paciente.apellido_paterno}${registro.paciente.apellido_materno ? ' ' + registro.paciente.apellido_materno : ''}`.trim() 
                            : '-'
                          }
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-900">
                          {registro.forma_pago || '-'}
                        </td>
                        <td className={`px-3 py-2 text-sm font-medium ${valorColor}`}>
                          {valorDisplay}
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-900">
                          {registro.numero_factura || '-'}
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-900">
                          {registro.usuario?.nombre ||  '-'}
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-900">
                          <button
                            onClick={() => eliminarRegistro(registro.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Historial */}
        {historialVisible && (
  <div className="mt-6 space-y-6">
    {/* Reemplaza los filtros de fecha con el componente completo */}
    <FiltrosHistorial />

    {/* Gráficos (se mantiene igual) */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-sm font-semibold mb-2 text-center">Evolución del Balance</h3>
        <div className="h-64">
          <Line data={chartDataHistorial.balanceEvolucion} />
        </div>
      </div>
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-sm font-semibold mb-2 text-center">Distribución General</h3>
        <div className="flex items-center justify-center">
          <div className="w-1/2 h-64">
            <Pie data={chartDataHistorial.distribucionGeneral} />
          </div>
          <div className="w-1/2 pl-4">
            <div className="space-y-2">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                <span className="text-sm">Ingresos: {formatMoneda(chartDataHistorial.distribucionGeneral.datasets[0].data[0] || 0)}</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                <span className="text-sm">Egresos: {formatMoneda(chartDataHistorial.distribucionGeneral.datasets[0].data[1] || 0)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Tabla de historial */}
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {[
                'Fecha', 'Usuario', 'Tipo', 'Categoría', 'Paciente', 'Médico',
                'Forma Pago', 'Moneda', 'Valor', 'Factura'
              ].map((col) => (
                <th
                  key={col}
                  className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap"
                  style={{ color: colorPrimaryDark }}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {historialFiltrado?.meses?.map((mesData: HistorialMes) => {
              if (mesData.registros.length === 0) return null;
              
              const nombreMes = new Date(historialFiltrado.ano, mesData.mes - 1, 1)
                .toLocaleString('es-ES', { month: 'long', year: 'numeric' });
              
              return (
                <React.Fragment key={`${historialFiltrado.ano}-${mesData.mes}`}>
                  <tr className="bg-gray-50">
                    <td colSpan={10} className="px-3 py-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-900">{nombreMes}</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600">Balance del mes:</span>
                          <span className={`text-sm font-medium ${mesData.balanceMes >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatMoneda(mesData.balanceMes)}
                          </span>
                        </div>
                      </div>
                    </td>
                  </tr>
                  {mesData.registros.map((registro) => {
                    const tipo = registro.tipo_movimiento?.tipo;
                    const { display: valorDisplay, color: valorColor } = formatValor(registro.valor, tipo || 'Egreso');
                    const { fecha: fechaISO, hora } = formatDateTime(registro.fecha);
                    
                    return (
                      <tr key={registro.id} className="hover:bg-gray-50">
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                          {fechaISO}
                          <br />
                          <span className="text-xs">{hora}</span>
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-900">
                          {registro.usuario?.nombre || '-'}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                            tipo === 'Ingreso' 
                              ? 'bg-green-100 text-green-800' 
                              : tipo === 'Egreso' 
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {tipo || 'DESC'}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-900">
                          {registro.tipo_movimiento?.nombre || 'Desconocido'}
                          {registro.descripcion && (
                            <p className="text-xs text-gray-500 truncate max-w-xs">{registro.descripcion}</p>
                          )}
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-900">
                          {registro.paciente ? 
                            `${registro.paciente.nombres} ${registro.paciente.apellido_paterno}${registro.paciente.apellido_materno ? ' ' + registro.paciente.apellido_materno : ''}`.trim() 
                            : '-'
                          }
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-900">
                          {registro.medico?.nombre || '-'}
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-900">
                          {registro.forma_pago || '-'}
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-900">
                          {registro.moneda || 'SOLES'}
                        </td>
                        <td className={`px-3 py-2 text-sm font-medium ${valorColor}`}>
                          {valorDisplay}
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-900">
                          {registro.numero_factura || '-'}
                        </td>
                      </tr>
                    );
                  })}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  </div>
)}
      </div>
    </div>
  );
}


// Add Session type at the top of the file
type Session = {
  user: {
    id: string;
    email?: string;
  };
};

function PaginaPrincipal({ session }: { session: Session }) {
  const [activeTab, setActiveTab] = useState('caja');
  const [showAllDoctors, setShowAllDoctors] = useState(false);
  const [showAllPatients, setShowAllPatients] = useState(false);
  const [selectedMedico, setSelectedMedico] = useState<Medico | null>(null);
  const [selectedPaciente, setSelectedPaciente] = useState<Paciente | null>(null);
  const [medicos, setMedicos] = useState<Medico[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    especialidad: '',
    telefono: '',
    correo: '',
    porcentaje_comision: 0,
    activo: true
  });

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      localStorage.removeItem('supabase.auth.token');
      window.location.reload();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      toast.error('Error al cerrar sesión');
    }
  };

  const toggleShowAllDoctors = () => {
    setShowAllDoctors(!showAllDoctors);
  };

  const toggleShowAllPatients = () => {
    setShowAllPatients(!showAllPatients);
  };

  const handleSave = async () => {
    // Implementation will be added
  };

  const handleEdit = (item: Medico | Paciente) => {
    // Implementation will be added
  };

  const handleDelete = async (id: string) => {
    // Implementation will be added
  };

  const resetForm = () => {
    // Implementation will be added
  };

  const handleSelectMedico = (medico: Medico) => {
    setSelectedMedico(medico);
  };

  const handleSelectPaciente = (paciente: Paciente) => {
    setSelectedPaciente(paciente);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm fixed w-full top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <MolarIcon className="h-8 w-8" stroke={colorPrimary} />
                <span className="ml-2 text-xl font-bold text-gray-900">Andrew's Dental Group</span>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <button
                  onClick={() => setActiveTab('caja')}
                  className={`${
                    activeTab === 'caja'
                      ? 'border-[#801461] text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                >
                  Caja
                </button>
                <button
                  onClick={() => setActiveTab('doctores')}
                  className={`${
                    activeTab === 'doctores'
                      ? 'border-[#801461] text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                >
                  Doctores
                </button>
                <button
                  onClick={() => setActiveTab('pacientes')}
                  className={`${
                    activeTab === 'pacientes'
                      ? 'border-[#801461] text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                >
                  Pacientes
                </button>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700 font-medium">
                {session.user.email || 'Usuario'}
              </span>
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gray-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200 shadow-md"
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-6 w-6 mr-2" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" 
                  />
                </svg>
                <span className="font-semibold">Cerrar Sesión</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 mt-16">
        {activeTab === 'caja' && <MiCaja userId={session.user.id} />}
        {activeTab === 'doctores' && (
          <GestionDoctores
            showAllDoctors={showAllDoctors}
            toggleShowAllDoctors={toggleShowAllDoctors}
            selectedMedico={selectedMedico}
            setSelectedMedico={setSelectedMedico}
            medicos={medicos}
            setMedicos={setMedicos}
            loading={loading}
            formData={formData}
            setFormData={setFormData}
            handleSave={handleSave}
            handleEdit={handleEdit}
            handleDelete={handleDelete}
            resetForm={resetForm}
            handleSelectMedico={handleSelectMedico}
          />
        )}
        {activeTab === 'pacientes' && (
          <GestionPaciente
            showAllPatients={showAllPatients}
            toggleShowAllPatients={toggleShowAllPatients}
            selectedPaciente={selectedPaciente}
            setSelectedPaciente={setSelectedPaciente}
            pacientes={pacientes}
            setPacientes={setPacientes}
            loading={loading}
            handleSave={handleSave}
            handleEdit={handleEdit}
            handleDelete={handleDelete}
            resetForm={resetForm}
            handleSelectPaciente={handleSelectPaciente}
          />
        )}
      </main>
    </div>
  );
}


function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Get initial session
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        
        if (mounted) {
          setSession(initialSession);
          setLoading(false);
        }

        // Set up auth state listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
          console.log('Auth state changed:', event);
          
          if (mounted) {
            setSession(newSession);
            setLoading(false);
          }

          if (newSession) {
            localStorage.setItem('supabase.auth.token', JSON.stringify(newSession));
          } else {
            localStorage.removeItem('supabase.auth.token');
          }
        });

        return () => {
          mounted = false;
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#801461] to-[#4a0d3a]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          <p className="mt-4 text-white">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {!session ? (
        <div className="min-h-screen bg-gradient-to-br from-[#801461] to-[#4a0d3a]">
          <IniciarSesion />
        </div>
      ) : (
        <div className="min-h-screen bg-gray-100">
          <PaginaPrincipal session={session} />
        </div>
      )}
    </div>
  );
}


export default App;