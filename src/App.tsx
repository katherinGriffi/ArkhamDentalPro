import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import './index.css'; 
import { Truck, Clock, MapPin, LogIn, LogOut, Calendar, User, MapPinned, Timer, FileText, Upload, Download, Table2Icon, Table, PanelsTopLeft, PersonStanding, PersonStandingIcon , Eye, EyeOff, DollarSignIcon, BadgeDollarSignIcon} from 'lucide-react';
import { supabase } from './lib/supabase';
import toast, { Toaster } from 'react-hot-toast';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'moment/locale/es';
import { Combobox } from '@headlessui/react'; 
import { Pie } from 'react-chartjs-2';
import {   Chart as ChartJS,   ArcElement,   Tooltip,   Legend,  CategoryScale,  LinearScale,  BarElement,  PointElement,  LineElement,  Title } from 'chart.js';

ChartJS.register(  ArcElement,  Tooltip,  Legend,  CategoryScale,  LinearScale,  BarElement,  PointElement,  LineElement,  Title);


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
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  setIsLoading(true);

  try {
    toast.dismiss();
    console.log(`Autenticando: ${email}`);

    // Tenta autenticação com o Supabase
    const { data: { user, session }, error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError || !user || !session) {
      throw authError || new Error('Falha na autenticação');
    }

    console.log('✅ Usuario autenticado:', {
      id: user.id,
      email: user.email,
      provider: user.app_metadata?.provider || 'email'
    });

    let userData = null;

    // Método 1: Consulta direta
  const { data: directData, error: directError } = await supabase
  
    .from('users')  // Nome da tabela
  .select('id, email, nombre, apellido, role')
  .eq('id', user.id)
  .maybeSingle();

    console.log('🔍 Método 1 - Dados diretos:', directData);
    console.log('❌ Método 1 - Erro:', directError);

    // Verifica se a consulta direta foi bem-sucedida
    if (!directError && directData) {
      userData = directData;
    } else {
      console.warn('🔁 Falha no método direto, tentando RPC...');

      // Método 2: Consultar via RPC
      const { data: rpcData, error: rpcError } = await supabase
        
        .rpc('get_user_by_id', { user_id: user.id });

      console.log('🔍 Método 2 - Dados RPC:', rpcData);
      console.log('❌ Método 2 - Erro RPC:', rpcError);

      if (!rpcError && Array.isArray(rpcData) && rpcData.length > 0) {
        userData = rpcData[0];  // Primeiro item do array, se houver
      } else if (!rpcError && typeof rpcData === 'object') {
        userData = rpcData;  // Se for um único objeto
      } else {
        console.warn('🔁 Falha no RPC, tentando SQL raw...');
        // Método 3: Consulta SQL raw
        const { data: sqlData, error: sqlError } = await supabase
          .from('users')
          .select('id, email, nombre, apellido, role, activo')
          .eq('id', user.id)
          .maybeSingle();

        console.log('🔍 Método 3 - Dados SQL raw:', sqlData);
        console.log('❌ Método 3 - Erro SQL:', sqlError);

        if (sqlData) {
          userData = sqlData;
        }
      }
    }

    // Se não encontrou os dados do usuário em nenhum método
    if (!userData) {
      console.error('🛑 Usuário não encontrado em nenhum método', {
        id: user.id,
        email: user.email,
        attempts: ['direct', 'rpc', 'raw']
      });
      throw new Error('Registro do usuário não localizado');
    }

   
    // Armazenando dados no localStorage
    localStorage.setItem('sb-access-token', session.access_token);
    localStorage.setItem('sb-refresh-token', session.refresh_token);
    localStorage.setItem('user', JSON.stringify({
      id: user.id,
      email: user.email,
      nombre: userData.nombre,
      apellido: userData.apellido,
      role: userData.role
    }));

    console.log('🎉 Login bem-sucedido para:', user.email);
    navigate('/caja');  // Navegação após login bem-sucedido
  } catch (error: any) {
    console.error('💥 Erro completo:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    toast.error(error.message || 'Erro no login');
    localStorage.removeItem('sb-access-token');
    localStorage.removeItem('sb-refresh-token');
    localStorage.removeItem('user');
  } finally {
    setIsLoading(false);
  }
};

const clearAuthStorage = () => {
  localStorage.removeItem('sb-access-token');
  localStorage.removeItem('sb-refresh-token');
  localStorage.removeItem('user');
};

// FORMULARIO LOGIN

  return (
    
    <div
    className="min-h-screen flex items-center justify-center p-4"
    style={{
      background: `linear-gradient(to bottom, ${colors.primary[700]}, ${colors.primary[500]})`,
    }}
  >
      <Toaster position="top-right" />
      <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full" style={{ border: `1px solid ${colors.primary[100]}` }}>
        <div className="flex items-center justify-center mb-8">
          <MolarIcon className="w-12 h-12" style={{ color: colorPrimary }} />
        </div>
        <h1 className="text-2xl font-bold text-center mb-6" style={{ color: colors.primary[500] }}>
          Andrew's Dental Group
        </h1>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              placeholder="Email"
              required
              autoComplete="username"
              className="w-full flex justify-center py-2 px-4 rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ backgroundColor: 'rgb(78, 2, 59)' }}
            /> 
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña
            </label>
            <div className="relative">
              <input
                id="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password" 
            value={password}
            style={{ backgroundColor: 'rgb(78, 2, 59)' }}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Ingresa tu contraseña"
                title="Contraseña de acceso"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 px-3 flex items-center text-sm text-gray-600"
                
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={25} /> : <Eye size={25} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50"
            style={{ backgroundColor: colors.primary[500] }}
            disabled={isLoading}
          >
            <LogIn className="w-5 h-5 mr-2" />
            {isLoading ? 'Iniciando sesión...' : 'Iniciar sesión'}
          </button>
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
  activo: boolean;
  tipo: 'Ingreso' | 'Egreso' | 'Ajuste';
}

interface RegistroCaja {
  id: string;
  fecha: string;
  tipo_movimiento_id: number;
  tipo_movimiento?: TipoMovimiento;
  descripcion: string;
  valor: number;
  numero_factura: string | null;
  user_id: string;
  created_at: string;
  usuario?: {
    nombre: string;
  };
  paciente?: {
    id: string;
    nombre: string;
  };
  medico?: {
    id: number;
    nombre: string;
  };
  forma_pago?: 'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA' | 'YAPE' | 'PLIN' | 'OTROS';
}
interface Paciente {
  id: string;
  dni: string;
  nombres: string;
  apellido_paterno: string;
  apellido_materno: string | null;
  fecha_nacimiento: string;
  sexo: 'M' | 'F' | 'O';
  celular: string;
  telefono_fijo: string | null;
  correo: string | null;
  direccion: string | null;
  distrito: string | null;
  grupo_sanguineo: string | null;
  alergias: string | null;
  enfermedades_cronicas: string | null;
  medicamentos_actuales: string | null;
  seguro_medico: string | null;
  estado_civil: string | null;
  ocupacion: string | null;
  referencia: string | null;
  historial_dental: string | null;
  fecha_registro: string;
  ultima_visita: string | null;
  activo: boolean;
}
interface TipoMovimiento {
  id: number;
  nombre: string;
  activo: boolean;
  tipo: 'Ingreso' | 'Egreso' | 'Ajuste';
}

interface RegistroCaja {
  id: string;
  fecha: string;
  tipo_movimiento_id: number;
  tipo_movimiento?: TipoMovimiento;
  descripcion: string;
  valor: number;
  numero_factura: string | null;
  user_id: string;
  created_at: string;
  usuario?: {
    nombre: string;
  };
}

const GestionDoctores: React.FC = () => {
  // Estados
  const [medicos, setMedicos] = useState<Medico[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [editingMedico, setEditingMedico] = useState<Medico | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

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
      const { data, error } = await supabase.from('medicos').select('*');
      if (error) throw error;
      setMedicos(data || []);
    } catch (err: any) {
      toast.error(`Error al cargar médicos: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Función de filtrado
  const filteredMedicos = medicos.filter(medico => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    
    return (
      (medico.nombre && medico.nombre.toLowerCase().includes(searchLower)) ||
      (medico.especialidad && medico.especialidad.toLowerCase().includes(searchLower)) ||
      (medico.telefono && medico.telefono.toLowerCase().includes(searchLower)) ||
      (medico.correo && medico.correo.toLowerCase().includes(searchLower))
    );
  });

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
      if (editingMedico) {
        // Actualizar médico
        const { error } = await supabase
          .from('medicos')
          .update(medicoData)
          .eq('id', editingMedico.id);
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
    setEditingMedico(medico);
    setNombre(medico.nombre);
    setEspecialidad(medico.especialidad || '');
    setTelefono(medico.telefono || '');
    setCorreo(medico.correo || '');
    setFechaIngreso(medico.fecha_ingreso.split('T')[0]);
    setPorcentajeComision(medico.porcentaje_comision?.toString() || '');
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Estás seguro de eliminar este médico?')) return;
    try {
      const { error } = await supabase.from('medicos').delete().eq('id', id);
      if (error) throw error;
      toast.success('Médico eliminado correctamente');
      fetchMedicos();
    } catch (error: any) {
      toast.error(`Error al eliminar médico: ${error.message}`);
    }
  };

  const resetForm = () => {
    setEditingMedico(null);
    setNombre('');
    setEspecialidad('');
    setTelefono('');
    setCorreo('');
    setFechaIngreso('');
    setPorcentajeComision('');
  };

  return (
    <div className="min-h-screen p-4 md:p-6" style={{ backgroundColor: colors.secondary[50] }}>
      {/* Header */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
        <div 
          className="p-6 text-white"
          style={{ backgroundColor: colors.primary[500] }}
        >
          <h1 className="text-2xl md:text-3xl font-bold">Gestión de Médicos</h1>
          <p className="opacity-90 mt-1">Administra los registros de médicos de tu clínica</p>
        </div>
      </div>

      {/* Formulario */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
        <div 
          className="px-6 py-4 text-white flex justify-between items-center"
          style={{ backgroundColor: colors.primary[500] }}
        >
          <h2 className="text-xl font-semibold">
            {editingMedico ? `Editando a ${nombre}` : 'Nuevo Médico'}
          </h2>
          {editingMedico && (
            <button 
              onClick={resetForm}
              className="text-xs bg-white bg-opacity-20 hover:bg-opacity-30 px-3 py-1 rounded-full transition-colors"
            >
              Nuevo
            </button>
          )}
        </div>
        
        <div className="p-6">
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
            {/* Información Básica */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium mb-2" style={{ color: colors.primary[600] }}>Información Básica</h3>
              
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: colors.primary[600] }}>Nombre Completo *</label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full rounded-lg border-gray-300 focus:border-primary-500 focus:ring-primary-500 p-3 border text-sm"
                  placeholder="Ej: Dr. Juan Pérez"
                  style={{ borderColor: colors.neutral[300] }}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: colors.primary[600] }}>Especialidad</label>
                <input
                  type="text"
                  value={especialidad}
                  onChange={(e) => setEspecialidad(e.target.value)}
                  className="w-full rounded-lg border-gray-300 focus:border-primary-500 focus:ring-primary-500 p-3 border text-sm"
                  placeholder="Ej: Cardiología"
                  style={{ borderColor: colors.neutral[300] }}
                />
              </div>
            </div>

            {/* Información de Contacto */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium mb-2" style={{ color: colors.primary[600] }}>Información de Contacto</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: colors.primary[600] }}>Teléfono</label>
                  <input
                    type="text"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    className="w-full rounded-lg border-gray-300 focus:border-primary-500 focus:ring-primary-500 p-3 border text-sm"
                    placeholder="Ej: +51 987654321"
                    style={{ borderColor: colors.neutral[300] }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: colors.primary[600] }}>Correo Electrónico</label>
                  <input
                    type="email"
                    value={correo}
                    onChange={(e) => setCorreo(e.target.value)}
                    className="w-full rounded-lg border-gray-300 focus:border-primary-500 focus:ring-primary-500 p-3 border text-sm"
                    placeholder="Ej: medico@clinica.com"
                    style={{ borderColor: colors.neutral[300] }}
                  />
                </div>
              </div>
            </div>

            {/* Información Laboral */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium mb-2" style={{ color: colors.primary[600] }}>Información Laboral</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: colors.primary[600] }}>Fecha de Ingreso *</label>
                  <input
                    type="date"
                    value={fechaIngreso}
                    onChange={(e) => setFechaIngreso(e.target.value)}
                    className="w-full rounded-lg border-gray-300 focus:border-primary-500 focus:ring-primary-500 p-3 border text-sm"
                    style={{ borderColor: colors.neutral[300] }}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: colors.primary[600] }}>Porcentaje de Comisión (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={porcentajeComision}
                    onChange={(e) => setPorcentajeComision(e.target.value)}
                    className="w-full rounded-lg border-gray-300 focus:border-primary-500 focus:ring-primary-500 p-3 border text-sm"
                    placeholder="Ej: 30.5"
                    style={{ borderColor: colors.neutral[300] }}
                  />
                </div>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="pt-4 flex flex-col sm:flex-row gap-3">
              <button
                type="submit"
                className="flex-1 px-6 py-3 rounded-lg font-medium text-white transition-colors flex items-center justify-center"
                style={{ backgroundColor: colors.primary[500] }}
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                {editingMedico ? 'Actualizar Médico' : 'Registrar Médico'}
              </button>
              
              {editingMedico && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center"
                  style={{ 
                    color: colors.primary[600],
                    border: `1px solid ${colors.primary[600]}`,
                    backgroundColor: 'white'
                  }}
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* Lista de médicos */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div 
          className="px-6 py-4 text-white flex flex-col md:flex-row md:items-center md:justify-between gap-3"
          style={{ backgroundColor: colors.primary[500] }}
        >
          <h2 className="text-xl font-semibold">Listado de Médicos</h2>
          
          <div className="relative w-full md:w-auto">
            <input
              type="text"
              placeholder="Buscar por nombre, especialidad o teléfono..."
              className="w-full py-2 px-4 rounded-full text-sm text-gray-800 focus:outline-none focus:ring-2"
              style={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                minWidth: '250px'
              }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <svg 
              className="absolute right-3 top-2.5 h-4 w-4 text-white" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div 
                className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2"
                style={{ borderColor: colors.primary[500] }}
              ></div>
            </div>
          ) : filteredMedicos.length === 0 ? (
            <div className="text-center py-12">
              <svg 
                className="mx-auto h-16 w-16 text-gray-400" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                {searchTerm ? 'No se encontraron resultados' : 'No hay médicos registrados'}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm ? 'Intenta con otro término de búsqueda' : 'Comienza agregando un nuevo médico'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Médico
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Especialidad
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                      Contacto
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ingreso
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Comisión
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredMedicos.map((medico) => (
                    <tr key={medico.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center text-white font-medium"
                            style={{ backgroundColor: colors.primary[400] }}
                          >
                            {medico.nombre.split(' ').map(n => n[0]).join('').substring(0, 2)}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {medico.nombre}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{medico.especialidad || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                        <div className="text-sm text-gray-900">{medico.telefono || '-'}</div>
                        <div className="text-sm text-gray-500">{medico.correo || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(medico.fecha_ingreso).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
                          style={{ 
                            backgroundColor: colors.primary[50],
                            color: colors.primary[700]
                          }}
                        >
                          {medico.porcentaje_comision !== null ? `${medico.porcentaje_comision}%` : '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => handleEdit(medico)}
                            className="text-primary-600 hover:text-primary-900"
                            style={{ color: colors.primary[500] }}
                          >
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(medico.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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
      </div>
    </div>
  );
};

const GestionPaciente: React.FC = () => {
  // Estados
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [editingPaciente, setEditingPaciente] = useState<Paciente | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPaciente, setSelectedPaciente] = useState<Paciente | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
   
  // Campos del formulario
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
  const [showAllPatients, setShowAllPatients] = useState(false);

  // Función para manejar la visualización de todos los pacientes
  const toggleShowAllPatients = () => {
    setShowAllPatients(!showAllPatients);
  };

  // Cargar pacientes al iniciar
  useEffect(() => {
    fetchPacientes();
  }, []);

  const fetchPacientes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('pacientes').select('*');
      if (error) throw error;
      setPacientes(data || []);
    } catch (err: any) {
      toast.error(`Error al cargar pacientes: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Función de filtrado

const filteredPacientes = pacientes.filter(paciente => {
  if (!searchTerm) return true; // Si no hay término de búsqueda, mostrar todos
  
  const searchLower = searchTerm.toLowerCase();
  
  // Verificar cada campo con manejo de valores nulos
  return (
    (paciente.dni && paciente.dni.toLowerCase().includes(searchLower)) ||
    (paciente.nombres && paciente.nombres.toLowerCase().includes(searchLower)) ||
    (paciente.apellido_paterno && paciente.apellido_paterno.toLowerCase().includes(searchLower)) ||
    (paciente.apellido_materno && paciente.apellido_materno.toLowerCase().includes(searchLower)) ||
    (paciente.celular && paciente.celular.toLowerCase().includes(searchLower))
  );
});

  // Función para seleccionar paciente
  const handleSelectPaciente = (paciente: Paciente) => {
    setSelectedPaciente(paciente === selectedPaciente ? null : paciente);
  };

  const handleSave = async () => {
    if (!dni || !nombres || !apellidoPaterno || !fechaNacimiento || !celular) {
      toast.error('DNI, nombres, apellido paterno, fecha de nacimiento y celular son obligatorios');
      return;
    }

    const pacienteData = {
      dni,
      nombres,
      apellido_paterno: apellidoPaterno,
      apellido_materno: apellidoMaterno || null,
      fecha_nacimiento: fechaNacimiento,
      sexo,
      celular,
      telefono_fijo: telefonoFijo || null,
      correo: correo || null,
      direccion: direccion || null,
      distrito: distrito || null,
      grupo_sanguineo: grupoSanguineo || null,
      alergias: alergias || null,
      enfermedades_cronicas: enfermedadesCronicas || null,
      medicamentos_actuales: medicamentosActuales || null,
      seguro_medico: seguroMedico || null,
      estado_civil: estadoCivil || null,
      ocupacion: ocupacion || null,
      referencia: referencia || null,
      historial_dental: historialDental || null,
    };

    try {
      if (editingPaciente) {
        // Actualizar paciente
        const { error } = await supabase
          .from('pacientes')
          .update(pacienteData)
          .eq('id', editingPaciente.id);
        if (error) throw error;
        toast.success('Paciente actualizado correctamente');
      } else {
        // Crear nuevo paciente
        const { error } = await supabase.from('pacientes').insert([pacienteData]);
        if (error) throw error;
        toast.success('Paciente registrado correctamente');
      }
      resetForm();
      fetchPacientes();
      setSelectedPaciente(null);
    } catch (err: any) {
      toast.error(`Error al guardar paciente: ${err.message}`);
    }
  };

  const handleEdit = (paciente: Paciente) => {
    setEditingPaciente(paciente);
    setSelectedPaciente(paciente);
    setDni(paciente.dni);
    setNombres(paciente.nombres);
    setApellidoPaterno(paciente.apellido_paterno);
    setApellidoMaterno(paciente.apellido_materno || '');
    setFechaNacimiento(paciente.fecha_nacimiento);
    setSexo(paciente.sexo);
    setCelular(paciente.celular);
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
    if (!window.confirm('¿Estás seguro de eliminar este paciente?')) return;
    try {
      const { error } = await supabase.from('pacientes').delete().eq('id', id);
      if (error) throw error;
      toast.success('Paciente eliminado correctamente');
      fetchPacientes();
      if (selectedPaciente?.id === id) {
        setSelectedPaciente(null);
      }
    } catch (error: any) {
      toast.error(`Error al eliminar paciente: ${error.message}`);
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
const pacientesToShow = showAllPatients ? filteredPacientes : filteredPacientes.slice(0, 15);
  return (
  <div className="min-h-screen p-4 md:p-6" style={{ backgroundColor: colors.secondary[50] }}>
    {/* Header */}
    <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
      <div
        className="p-6 text-white"
        style={{ backgroundColor: colors.primary[500] }}
      >
        <h1 className="text-2xl md:text-3xl font-bold">Gestión de Pacientes</h1>
        <p className="opacity-90 mt-1">Administra los registros de pacientes de tu clínica</p>
      </div>
    </div>

    {/* Botón para abrir el modal de nuevo paciente */}
    <div className="mb-6">
      <button
        onClick={() => {
          resetForm();
          setIsModalOpen(true);
        }}
        className="px-6 py-3 rounded-lg font-medium text-white transition-colors flex items-center"
        style={{ backgroundColor: colors.primary[500] }}
      >
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
        </svg>
        Nuevo Paciente
      </button>
    </div>

    {/* Modal para el formulario de paciente */}
    {isModalOpen && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div 
            className="px-6 py-4 text-white flex justify-between items-center sticky top-0"
            style={{ backgroundColor: colors.primary[500] }}
          >
            <h2 className="text-xl font-semibold">
              {editingPaciente ? `Editando a ${nombres} ${apellidoPaterno}` : 'Nuevo Paciente'}
            </h2>
            <button 
              onClick={() => setIsModalOpen(false)}
              className="text-white hover:text-gray-200"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="p-6">
            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
              {/* Información Personal */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium mb-2" style={{ color: colors.primary[600] }}>Información Personal</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: colors.primary[600] }}>DNI *</label>
                    <input
                      type="text"
                      value={dni}
                      onChange={(e) => setDni(e.target.value)}
                      className="w-full rounded-lg border-gray-300 focus:border-primary-500 focus:ring-primary-500 p-3 border text-sm"
                      placeholder="Ej: 12345678"
                      style={{ borderColor: colors.neutral[300] }}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: colors.primary[600] }}>Sexo *</label>
                    <select
                      value={sexo}
                      onChange={(e) => setSexo(e.target.value as 'M' | 'F' | 'O')}
                      className="w-full rounded-lg border-gray-300 focus:border-primary-500 focus:ring-primary-500 p-3 border text-sm"
                      style={{ borderColor: colors.neutral[300] }}
                      required
                    >
                      <option value="M">Masculino</option>
                      <option value="F">Femenino</option>
                      <option value="O">Otro</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: colors.primary[600] }}>Nombres *</label>
                  <input
                    type="text"
                    value={nombres}
                    onChange={(e) => setNombres(e.target.value)}
                    className="w-full rounded-lg border-gray-300 focus:border-primary-500 focus:ring-primary-500 p-3 border text-sm"
                    placeholder="Ej: Juan Carlos"
                    style={{ borderColor: colors.neutral[300] }}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: colors.primary[600] }}>Apellido Paterno *</label>
                    <input
                      type="text"
                      value={apellidoPaterno}
                      onChange={(e) => setApellidoPaterno(e.target.value)}
                      className="w-full rounded-lg border-gray-300 focus:border-primary-500 focus:ring-primary-500 p-3 border text-sm"
                      placeholder="Ej: Pérez"
                      style={{ borderColor: colors.neutral[300] }}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: colors.primary[600] }}>Apellido Materno</label>
                    <input
                      type="text"
                      value={apellidoMaterno}
                      onChange={(e) => setApellidoMaterno(e.target.value)}
                      className="w-full rounded-lg border-gray-300 focus:border-primary-500 focus:ring-primary-500 p-3 border text-sm"
                      placeholder="Ej: Gómez"
                      style={{ borderColor: colors.neutral[300] }}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: colors.primary[600] }}>Fecha de Nacimiento *</label>
                  <input
                    type="date"
                    value={fechaNacimiento}
                    onChange={(e) => setFechaNacimiento(e.target.value)}
                    className="w-full rounded-lg border-gray-300 focus:border-primary-500 focus:ring-primary-500 p-3 border text-sm"
                    style={{ borderColor: colors.neutral[300] }}
                    required
                  />
                </div>
              </div>

              {/* Información de Contacto */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium mb-2" style={{ color: colors.primary[600] }}>Información de Contacto</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: colors.primary[600] }}>Celular *</label>
                    <input
                      type="text"
                      value={celular}
                      onChange={(e) => setCelular(e.target.value)}
                      className="w-full rounded-lg border-gray-300 focus:border-primary-500 focus:ring-primary-500 p-3 border text-sm"
                      placeholder="Ej: 987654321"
                      style={{ borderColor: colors.neutral[300] }}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: colors.primary[600] }}>Teléfono Fijo</label>
                    <input
                      type="text"
                      value={telefonoFijo}
                      onChange={(e) => setTelefonoFijo(e.target.value)}
                      className="w-full rounded-lg border-gray-300 focus:border-primary-500 focus:ring-primary-500 p-3 border text-sm"
                      placeholder="Ej: 012345678"
                      style={{ borderColor: colors.neutral[300] }}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: colors.primary[600] }}>Correo Electrónico</label>
                  <input
                    type="email"
                    value={correo}
                    onChange={(e) => setCorreo(e.target.value)}
                    className="w-full rounded-lg border-gray-300 focus:border-primary-500 focus:ring-primary-500 p-3 border text-sm"
                    placeholder="Ej: paciente@example.com"
                    style={{ borderColor: colors.neutral[300] }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: colors.primary[600] }}>Dirección</label>
                  <input
                    type="text"
                    value={direccion}
                    onChange={(e) => setDireccion(e.target.value)}
                    className="w-full rounded-lg border-gray-300 focus:border-primary-500 focus:ring-primary-500 p-3 border text-sm"
                    placeholder="Ej: Av. Principal 123"
                    style={{ borderColor: colors.neutral[300] }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: colors.primary[600] }}>Distrito</label>
                  <input
                    type="text"
                    value={distrito}
                    onChange={(e) => setDistrito(e.target.value)}
                    className="w-full rounded-lg border-gray-300 focus:border-primary-500 focus:ring-primary-500 p-3 border text-sm"
                    placeholder="Ej: Miraflores"
                    style={{ borderColor: colors.neutral[300] }}
                  />
                </div>
              </div>

              {/* Información Médica */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium mb-2" style={{ color: colors.primary[600] }}>Información Médica</h3>
                
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: colors.primary[600] }}>Grupo Sanguíneo</label>
                  <input
                    type="text"
                    value={grupoSanguineo}
                    onChange={(e) => setGrupoSanguineo(e.target.value)}
                    className="w-full rounded-lg border-gray-300 focus:border-primary-500 focus:ring-primary-500 p-3 border text-sm"
                    placeholder="Ej: O+"
                    style={{ borderColor: colors.neutral[300] }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: colors.primary[600] }}>Alergias</label>
                  <input
                    type="text"
                    value={alergias}
                    onChange={(e) => setAlergias(e.target.value)}
                    className="w-full rounded-lg border-gray-300 focus:border-primary-500 focus:ring-primary-500 p-3 border text-sm"
                    placeholder="Ej: Penicilina, polen"
                    style={{ borderColor: colors.neutral[300] }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: colors.primary[600] }}>Enfermedades Crónicas</label>
                  <input
                    type="text"
                    value={enfermedadesCronicas}
                    onChange={(e) => setEnfermedadesCronicas(e.target.value)}
                    className="w-full rounded-lg border-gray-300 focus:border-primary-500 focus:ring-primary-500 p-3 border text-sm"
                    placeholder="Ej: Diabetes, hipertensión"
                    style={{ borderColor: colors.neutral[300] }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: colors.primary[600] }}>Medicamentos Actuales</label>
                  <input
                    type="text"
                    value={medicamentosActuales}
                    onChange={(e) => setMedicamentosActuales(e.target.value)}
                    className="w-full rounded-lg border-gray-300 focus:border-primary-500 focus:ring-primary-500 p-3 border text-sm"
                    placeholder="Ej: Metformina 500mg"
                    style={{ borderColor: colors.neutral[300] }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: colors.primary[600] }}>Seguro Médico</label>
                  <input
                    type="text"
                    value={seguroMedico}
                    onChange={(e) => setSeguroMedico(e.target.value)}
                    className="w-full rounded-lg border-gray-300 focus:border-primary-500 focus:ring-primary-500 p-3 border text-sm"
                    placeholder="Ej: Essalud"
                    style={{ borderColor: colors.neutral[300] }}
                  />
                </div>
              </div>

              {/* Información Adicional */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium mb-2" style={{ color: colors.primary[600] }}>Información Adicional</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: colors.primary[600] }}>Estado Civil</label>
                    <input
                      type="text"
                      value={estadoCivil}
                      onChange={(e) => setEstadoCivil(e.target.value)}
                      className="w-full rounded-lg border-gray-300 focus:border-primary-500 focus:ring-primary-500 p-3 border text-sm"
                      placeholder="Ej: Casado"
                      style={{ borderColor: colors.neutral[300] }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: colors.primary[600] }}>Ocupación</label>
                    <input
                      type="text"
                      value={ocupacion}
                      onChange={(e) => setOcupacion(e.target.value)}
                      className="w-full rounded-lg border-gray-300 focus:border-primary-500 focus:ring-primary-500 p-3 border text-sm"
                      placeholder="Ej: Ingeniero"
                      style={{ borderColor: colors.neutral[300] }}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: colors.primary[600] }}>Referencia</label>
                  <input
                    type="text"
                    value={referencia}
                    onChange={(e) => setReferencia(e.target.value)}
                    className="w-full rounded-lg border-gray-300 focus:border-primary-500 focus:ring-primary-500 p-3 border text-sm"
                    placeholder="Ej: Amigo, familiar"
                    style={{ borderColor: colors.neutral[300] }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: colors.primary[600] }}>Historial Dental</label>
                  <textarea
                    value={historialDental}
                    onChange={(e) => setHistorialDental(e.target.value)}
                    className="w-full rounded-lg border-gray-300 focus:border-primary-500 focus:ring-primary-500 p-3 border text-sm"
                    rows={3}
                    placeholder="Notas sobre el historial dental del paciente"
                    style={{ borderColor: colors.neutral[300] }}
                  />
                </div>
              </div>

              {/* Botones de acción */}
              <div className="pt-4 flex flex-col sm:flex-row gap-3">
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 rounded-lg font-medium text-white transition-colors flex items-center justify-center"
                  style={{ backgroundColor: colors.primary[500] }}
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                  {editingPaciente ? 'Actualizar Paciente' : 'Registrar Paciente'}
                </button>
                
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center"
                  style={{ 
                    color: colors.primary[600],
                    border: `1px solid ${colors.primary[600]}`,
                    backgroundColor: 'white'
                  }}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    )}
  

    {/* Lista de pacientes */}
     <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div 
          className="px-6 py-4 text-white flex flex-col md:flex-row md:items-center md:justify-between gap-3"
          style={{ backgroundColor: colors.primary[500] }}
        >
          <h2 className="text-xl font-semibold">Listado de Pacientes</h2>
          <p className="text-sm text-white">
            Total: {filteredPacientes.length} {!showAllPatients && filteredPacientes.length > 15 && `(mostrando 15 de ${filteredPacientes.length})`}
          </p>
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative w-full md:w-auto">
              <input
                type="text"
                placeholder="Buscar por DNI, nombre o teléfono..."
                className="w-full py-2 px-4 rounded-full text-sm text-gray-800 focus:outline-none focus:ring-2"
                style={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  minWidth: '250px'
                }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <svg 
                className="absolute right-3 top-2.5 h-4 w-4 text-white" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            {filteredPacientes.length > 15 && (
              <button
                onClick={toggleShowAllPatients}
                className="px-4 py-2 rounded-lg font-medium text-white transition-colors flex items-center justify-center text-sm"
                style={{ 
                  backgroundColor: colors.primary[700],
                  border: `1px solid ${colors.primary[300]}`,
                }}
              >
                {showAllPatients ? (
                  <>
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
                    </svg>
                    Mostrar menos
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                    Ver todos
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div 
                className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2"
                style={{ borderColor: colors.primary[500] }}
              ></div>
            </div>
          ) : filteredPacientes.length === 0 ? (
            <div className="text-center py-12">
              <svg 
                className="mx-auto h-16 w-16 text-gray-400" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                {searchTerm ? 'No se encontraron resultados' : 'No hay pacientes registrados'}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm ? 'Intenta con otro término de búsqueda' : 'Comienza agregando un nuevo paciente'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Paciente
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      DNI
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                      Contacto
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Edad
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pacientesToShow.map((paciente) => {
                    const edad = paciente.fecha_nacimiento 
                      ? new Date().getFullYear() - new Date(paciente.fecha_nacimiento).getFullYear() 
                      : 'N/A';
                    
                    return (
                      <tr 
                        key={paciente.id} 
                        className={`hover:bg-gray-50 ${selectedPaciente?.id === paciente.id ? 'bg-blue-50' : ''}`}
                        onClick={() => handleSelectPaciente(paciente)}
                        style={{ cursor: 'pointer' }}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center text-white font-medium"
                              style={{ backgroundColor: colors.primary[400] }}
                            >
                              {paciente.nombres.charAt(0)}{paciente.apellido_paterno.charAt(0)}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {`${paciente.nombres} ${paciente.apellido_paterno} ${paciente.apellido_materno || ''}`}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{paciente.dni}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                          <div className="text-sm text-gray-900">{paciente.celular}</div>
                          <div className="text-sm text-gray-500">{paciente.correo || '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
                            style={{ 
                              backgroundColor: colors.primary[50],
                              color: colors.primary[700]
                            }}
                          >
                            {edad} años
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
                                handleDelete(paciente.id);
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
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

    {/* Detalles del paciente seleccionado */}
    {selectedPaciente && (
      <div className="mt-6 bg-white rounded-xl shadow-md overflow-hidden">
        <div 
          className="px-6 py-4 text-white flex justify-between items-center"
          style={{ backgroundColor: colors.primary[500] }}
        >
          <h2 className="text-xl font-semibold">Detalles del Paciente</h2>
          <button 
            onClick={() => setSelectedPaciente(null)}
            className="text-xs bg-white bg-opacity-20 hover:bg-opacity-30 px-3 py-1 rounded-full transition-colors"
          >
            Cerrar
          </button>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium mb-4" style={{ color: colors.primary[600] }}>Información Personal</h3>
            <div className="space-y-3">
              <p><span className="font-medium">Nombre completo:</span> {`${selectedPaciente.nombres} ${selectedPaciente.apellido_paterno} ${selectedPaciente.apellido_materno || ''}`}</p>
              <p><span className="font-medium">DNI:</span> {selectedPaciente.dni}</p>
              <p><span className="font-medium">Fecha de Nacimiento:</span> {new Date(selectedPaciente.fecha_nacimiento).toLocaleDateString()}</p>
              <p><span className="font-medium">Edad:</span> {new Date().getFullYear() - new Date(selectedPaciente.fecha_nacimiento).getFullYear()} años</p>
              <p><span className="font-medium">Sexo:</span> {selectedPaciente.sexo === 'M' ? 'Masculino' : selectedPaciente.sexo === 'F' ? 'Femenino' : 'Otro'}</p>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-4" style={{ color: colors.primary[600] }}>Información de Contacto</h3>
            <div className="space-y-3">
              <p><span className="font-medium">Celular:</span> {selectedPaciente.celular}</p>
              <p><span className="font-medium">Teléfono Fijo:</span> {selectedPaciente.telefono_fijo || '-'}</p>
              <p><span className="font-medium">Correo:</span> {selectedPaciente.correo || '-'}</p>
              <p><span className="font-medium">Dirección:</span> {selectedPaciente.direccion || '-'}</p>
              <p><span className="font-medium">Distrito:</span> {selectedPaciente.distrito || '-'}</p>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-4" style={{ color: colors.primary[600] }}>Información Médica</h3>
            <div className="space-y-3">
              <p><span className="font-medium">Grupo Sanguíneo:</span> {selectedPaciente.grupo_sanguineo || '-'}</p>
              <p><span className="font-medium">Alergias:</span> {selectedPaciente.alergias || 'Ninguna'}</p>
              <p><span className="font-medium">Enfermedades Crónicas:</span> {selectedPaciente.enfermedades_cronicas || 'Ninguna'}</p>
              <p><span className="font-medium">Medicamentos Actuales:</span> {selectedPaciente.medicamentos_actuales || 'Ninguno'}</p>
              <p><span className="font-medium">Seguro Médico:</span> {selectedPaciente.seguro_medico || '-'}</p>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-4" style={{ color: colors.primary[600] }}>Información Adicional</h3>
            <div className="space-y-3">
              <p><span className="font-medium">Estado Civil:</span> {selectedPaciente.estado_civil || '-'}</p>
              <p><span className="font-medium">Ocupación:</span> {selectedPaciente.ocupacion || '-'}</p>
              <p><span className="font-medium">Referencia:</span> {selectedPaciente.referencia || '-'}</p>
              <p><span className="font-medium">Historial Dental:</span></p>
              <div className="bg-gray-50 p-3 rounded-lg">
                {selectedPaciente.historial_dental || 'No hay registros'}
              </div>
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
  const [historialFiltrado, setHistorialFiltrado] = useState<{ano: number, meses: {mes: number, registros: RegistroCaja[]}[]}>([]);
  const [chartData, setChartData] = useState<{ingresos: any, egresos: any} | null>(null);
  const [medicoId, setMedicoId] = useState<number | null>(null);
  const [formaPago, setFormaPago] = useState<'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA' | 'YAPE' | 'PLIN' | 'OTROS'>('EFECTIVO');
  const [medicos, setMedicos] = useState<{id: number, nombre: string}[]>([]);
  const [busquedaPaciente, setBusquedaPaciente] = useState('');
  const [pacienteId, setPacienteId] = useState<string | null>(null);
  const [pacientes, setPacientes] = useState<{id: string, nombre: string}[]>([]);
  const [tipoMoneda, setTipoMoneda] = useState<'SOLES' | 'USD'>('SOLES');
  const [valorEnSoles, setValorEnSoles] = useState(0);
  const [query, setQuery] = useState('');
  const [selectedPaciente, setSelectedPaciente] = useState<{id: string, nombres: string, apellido_paterno: string} | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [fechaInicioHistorial, setFechaInicioHistorial] = useState<string>(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().split('T')[0];
  });
  const [fechaFinHistorial, setFechaFinHistorial] = useState<string>(new Date().toISOString().split('T')[0]);
  const [chartDataHistorial, setChartDataHistorial] = useState<{
    ingresosPorCategoria: any;
    egresosPorCategoria: any;
    distribucionGeneral: any;
  } | null>(null);

 // Función para obtener el ID de la categoría "COMISIÓN TARJETA" o similar
   const obtenerIdCategoriaImpuestos = async () => {
    try {
      const { data, error } = await supabase
        .from('tipos_movimiento')
        .select('id')
        .ilike('nombre', '%Impuestos y Tributos%')
        .eq('tipo', 'Egreso')
        .single();

      if (error) throw error;
      
      // Si no existe la categoría, la creamos
      if (!data) {
        const { data: newCategory } = await supabase
          .from('tipos_movimiento')
          .insert([{
            nombre: 'Impuestos y Tributos',
            tipo: 'Egreso',
            activo: true
          }])
          .select()
          .single();
        
        return newCategory?.id || null;
      }
      
      return data.id;
    } catch (error) {
      console.error('Error al buscar categoría de impuestos:', error);
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

useEffect(() => {
  const cargarPacientes = async () => {
    try {
      const { data, error } = await supabase
        .from('pacientes')
        .select('id, nombres, apellido_paterno');

      if (error) throw error;

      setPacientes(data || []);
    } catch (error) {
      console.error('Error al cargar pacientes:', error);
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
  useEffect(() => {
    const cargarMedicos = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('medicos')
          .select('id, nombre')
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
    }
  };
};

  // Cargar registros y calcular balances
const cargarRegistros = async (fechaSeleccionada: string) => {
  setIsLoading(true);

  try {
    // 1. Primero verifica que userId y fechaSeleccionada tengan valor
    if (!userId || !fechaSeleccionada) {
      throw new Error('Falta userId o fecha');
    }

    // 2. Consulta mejorada con todas las relaciones necesarias
    const { data, error } = await supabase
      .from('registros_caja')
      .select(`
        id,
        fecha,
        tipo_movimiento_id,
        descripcion,
        valor,
        numero_factura,
        user_id,
        created_at,
        medico_id,
        forma_pago,
        paciente_id,
        tipos_movimiento (id, nombre, tipo),
        users:user_id(nombre),
        medico:medico_id(id, nombre),
        paciente:paciente_id(id, nombres, apellido_paterno)
      `)
      .eq('user_id', userId)
      .eq('fecha', fechaSeleccionada)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error de Supabase:', error);
      throw error;
    }

    console.log('Datos recibidos con relaciones:', data); // Para depuración

    // 3. Procesar los datos para incluir las relaciones
    const registros = (data || []).map((registro) => ({
      ...registro,
      tipo_movimiento: registro.tipos_movimiento,
      usuario: registro.users,
      medico: registro.medico,
      paciente: registro.paciente ? {
        id: registro.paciente.id,
        nombreCompleto: `${registro.paciente.nombres} ${registro.paciente.apellido_paterno}`
      } : null
    }));

    // 4. Actualizar los estados
    setRegistros(registros);
    
    if (registros.length > 0) {
      setChartData(prepararDatosGrafico(registros));
      setTotalDia(registros.reduce((total, reg) => total + reg.valor, 0));
    } else {
      setChartData(null);
      setTotalDia(0);
    }

  } catch (error) {
    console.error('Error completo al cargar registros:', error);
    toast.error(`Error al cargar registros: ${error.message}`);
  } finally {
    setIsLoading(false);
  }
};


  // Cargar historial
const cargarHistorial = async () => {
  try {
    setIsLoading(true);
    
    // Consulta con todas las relaciones necesarias
    const { data: registrosData, error: registrosError } = await supabase
      .from('registros_caja')
      .select(`
        id,
        fecha,
        tipo_movimiento_id,
        descripcion,
        valor,
        numero_factura,
        created_at,
        medico_id,
        forma_pago,
        moneda,
        paciente_id,
        tipos_movimiento (id, nombre, tipo),
        users:user_id(nombre),
        medico:medico_id(id, nombre),
        paciente:paciente_id(id, nombres, apellido_paterno)
      `)
      .eq('user_id', userId)
      .gte('fecha', fechaInicioHistorial)
      .lte('fecha', fechaFinHistorial)
      .order('fecha', { ascending: false });

    if (registrosError) throw registrosError;

    // Procesar los registros
    const registrosProcesados = (registrosData || []).map(registro => ({
      ...registro,
      tipo_movimiento: registro.tipos_movimiento,
      usuario: registro.users,
      medico: registro.medico,
      paciente: registro.paciente ? {
        id: registro.paciente.id,
        nombreCompleto: `${registro.paciente.nombres} ${registro.paciente.apellido_paterno}`
      } : null,
      moneda: registro.moneda || 'SOLES'
    }));

    // Organizar por año y mes
    const historialPorAno: Record<number, Record<number, any[]>> = {};
    registrosProcesados.forEach(registro => {
      const fecha = new Date(registro.fecha);
      const ano = fecha.getFullYear();
      const mes = fecha.getMonth() + 1;
      
      if (!historialPorAno[ano]) historialPorAno[ano] = {};
      if (!historialPorAno[ano][mes]) historialPorAno[ano][mes] = [];
      
      historialPorAno[ano][mes].push(registro);
    });

    // Formatear para el estado
    const historialFormateado = Object.entries(historialPorAno).map(([anoStr, meses]) => ({
      ano: parseInt(anoStr),
      meses: Object.entries(meses).map(([mesStr, registros]) => ({
        mes: parseInt(mesStr),
        registros
      }))
    }));

    // Calcular balance total
    const balance = registrosProcesados.reduce((sum, reg) => {
      const tipo = reg.tipo_movimiento?.tipo;
      return tipo === 'Ingreso' ? sum + reg.valor : sum - Math.abs(reg.valor);
    }, 0);

    // Preparar datos para los gráficos
    const chartData = prepararDatosGrafico(registrosProcesados);

    // Actualizar estados
    setHistorialFiltrado(historialFormateado);
    setBalanceMes(balance);
    setChartDataHistorial(chartData);

  } catch (error) {
    console.error('Error cargando historial:', error);
    toast.error(`Error al cargar historial: ${error.message}`);
  } finally {
    setIsLoading(false);
  }
};

// Componente de filtros para el historial (debes agregarlo en tu JSX)
const FiltrosHistorial = () => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
    <div>
      <label className="block text-sm font-medium mb-1">Fecha Inicio:</label>
      <input
        type="date"
        value={fechaInicioHistorial}
        onChange={(e) => setFechaInicioHistorial(e.target.value)}
        className="w-full rounded-lg border-gray-300 shadow-sm p-2 border text-sm"
      />
    </div>
    <div>
      <label className="block text-sm font-medium mb-1">Fecha Fin:</label>
      <input
        type="date"
        value={fechaFinHistorial}
        onChange={(e) => setFechaFinHistorial(e.target.value)}
        className="w-full rounded-lg border-gray-300 shadow-sm p-2 border text-sm"
      />
    </div>
    <div className="flex items-end">
      <button
        onClick={cargarHistorial}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        Aplicar Filtros
      </button>
    </div>
  </div>
);

// En tu JSX, muestra los gráficos del historial así:
{chartDataHistorial && (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="text-sm font-semibold mb-2 text-center">Ingresos Históricos</h3>
      <div className="h-64">
        <Pie data={chartDataHistorial.ingresosPorCategoria} />
      </div>
    </div>
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="text-sm font-semibold mb-2 text-center">Egresos Históricos</h3>
      <div className="h-64">
        <Pie data={chartDataHistorial.egresosPorCategoria} />
      </div>
    </div>
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="text-sm font-semibold mb-2 text-center">Balance Histórico</h3>
      <div className="h-64">
        <Pie data={chartDataHistorial.distribucionGeneral} />
      </div>
    </div>
  </div>
)}

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
    if (!descripcion || !valor) {
      toast.error('Descripción y valor son requeridos');
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
        const comisionTarjeta = Math.abs(valorNumerico) * 0.05;
        const idCategoriaImpuestos = await obtenerIdCategoriaImpuestos();

        if (!idCategoriaImpuestos) {
          toast('No se pudo crear/obtener la categoría de impuestos', { 
            type: 'error',
            autoClose: 5000
          });
        } else {
          await supabase
            .from('registros_caja')
            .insert([{
              fecha: fechaISO, // Misma fecha formateada
              tipo_movimiento_id: idCategoriaImpuestos,
              descripcion: `Encargos por tarjeta (${descripcion})`,
              valor: -comisionTarjeta,
              user_id: userId,
              medico_id: medicoId,
              forma_pago: 'TARJETA',
              paciente_id: pacienteId,
              relacionado_con: registroInsertado.id
            }]);
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
    if (!window.confirm('¿Estás seguro de eliminar este registro?')) return;

    try {
      const { error } = await supabase
        .from('registros_caja')
        .delete()
        .eq('id', id)
        .select();

      if (error) throw error;

      toast.success('Registro eliminado correctamente');
      cargarRegistros(fecha);
    } catch (error: any) {
      console.error('Error eliminando registro:', {
        message: error.message,
        code: error.code,
        details: error.details,
      });
      toast.error('Error al eliminar registro');
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
const filteredPacientes = query.trim() === ''
  ? pacientes
  : pacientes.filter((paciente) => {
      const fullName = `${paciente.nombres} ${paciente.apellido_paterno}`.toLowerCase();
      return fullName.includes(query.toLowerCase());
    });
  

  return (
   


<div className="bg-white rounded-xl shadow-md overflow-hidden mb-3">
        <div 
          className="p-6 text-white"
          style={{ backgroundColor: colors.primary[500] }}
        >
          <h1 className="text-2xl md:text-2xl font-bold">Gestion Financiera</h1>
          
        </div>
      <div className="grid gap-4 sm:gap-6">
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
            className="w-full sm:w-auto px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-center"
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

        {/* Formulario de registro*/}


 <div className="p-3 sm:p-4 rounded-lg" style={{ backgroundColor: colorSecondary }}>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-2 sm:gap-3 items-end">


    {/* Tipo */}
    <div className="md:col-span-1">
      <label className="block text-sm font-medium mb-1" style={{ color: colorPrimaryDark }}>Tipo</label>
      <select
        value={tipoMovimiento}
        onChange={(e) => setTipoMovimiento(e.target.value as 'Ingreso' | 'Egreso' | 'Ajuste')}
        className="block w-full rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border text-sm"
        style={{ borderColor: colorPrimaryLight }}
      >
        <option value="Ingreso">Ingreso</option>
        <option value="Egreso">Egreso</option>
        <option value="Ajuste">Ajuste</option>
      </select>
    </div>

 {/* Categoría */}
<div className="md:col-span-1">
  <label className="block text-sm font-medium mb-1" style={{ color: colorPrimaryDark }}>
    Categoría
  </label>
  <select
    value={tipoMovimientoId || ''}
    onChange={(e) => setTipoMovimientoId(Number(e.target.value|| null))}
    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border text-sm"
    disabled={tiposMovimiento.length === 0 || isLoading}
  >
    {isLoading ? (
      <option value="">Cargando categorías...</option>
    ) : tiposMovimiento.length === 0 ? (
      <option value="">No hay categorías disponibles</option>
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
<div className="md:col-span-1">
  <label className="block text-sm font-medium mb-1" style={{ color: colorPrimaryDark }}>
    Médico
  </label>
  <select
  value={medicoId || ''}
  onChange={(e) => setMedicoId(e.target.value ? Number(e.target.value) : null)}
  className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border text-sm"
  disabled={medicos.length === 0 || isLoading}
  >
    {isLoading ? (
      <option value="">Cargando médicos...</option>
    ) : medicos.length === 0 ? (
      <option value="">No hay médicos disponibles</option>
    ) : (
      <>
        <option value="">Seleccione médico</option>
        {medicos.map((medico) => (
          <option key={medico.id} value={medico.id}>
            {medico.nombre}
          </option>
        ))}
      </>
    )}
  </select>
</div>

{/* Paciente con búsqueda */}
<div className="md:col-span-2">
  <label className="block text-sm font-medium mb-1" style={{ color: colorPrimaryDark }}>
    Paciente
  </label>
  <div className="relative">
    <input
      type="text"
      value={busquedaPaciente}
      onChange={(e) => {
        setBusquedaPaciente(e.target.value);
        setShowDropdown(true);
      }}
      onFocus={() => setShowDropdown(true)}
      onBlur={() => setTimeout(() => setShowDropdown(false), 200)} // Cierra el dropdown con un pequeño retraso
      placeholder="Buscar por nombre o apellido..."
      className="block w-full rounded-lg border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 text-sm"
    />
    
    {busquedaPaciente && (
      <div className="absolute right-2 top-2">
        <button 
          onClick={() => {
            setBusquedaPaciente('');
            setPacienteId(null);
          }}
          className="text-gray-500 hover:text-gray-700"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    )}
    
    {showDropdown && (
      <div className="absolute z-10 mt-1 w-full bg-white rounded-lg shadow-lg border border-gray-300 max-h-60 overflow-y-auto">
        {pacientes
          .filter(p => 
            `${p.nombres} ${p.apellido_paterno}`
              .toLowerCase()
              .includes(busquedaPaciente.toLowerCase())
          )
          .map((paciente) => (
            <div
              key={paciente.id}
              className={`p-2 hover:bg-blue-50 cursor-pointer ${pacienteId === paciente.id ? 'bg-blue-100' : ''}`}
              onClick={() => {
                setPacienteId(paciente.id);
                setBusquedaPaciente(`${paciente.nombres} ${paciente.apellido_paterno}`);
                setShowDropdown(false);
              }}
            >
              {paciente.nombres} {paciente.apellido_paterno}
            </div>
          ))}
        {pacientes.filter(p => 
          `${p.nombres} ${p.apellido_paterno}`
            .toLowerCase()
            .includes(busquedaPaciente.toLowerCase())
        ).length === 0 && (
          <div className="p-2 text-gray-500">No se encontraron pacientes</div>
        )}
      </div>
    )}
  </div>
</div>

    {/* Forma de Pago */}
    <div className="md:col-span-2">
      <label className="block text-sm font-medium mb-1" style={{ color: colorPrimaryDark }}>Forma de Pago</label>
      <select
        value={formaPago}
        onChange={(e) =>
          setFormaPago(e.target.value as 'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA' | 'YAPE' | 'PLIN' | 'OTROS')
        }
        className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border text-sm"
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
            <div className="md:col-span-1">
              <label className="block text-sm font-medium mb-1" style={{ color: colorPrimaryDark }}>Moneda</label>
              <select
                value={tipoMoneda}
                onChange={(e) => setTipoMoneda(e.target.value as 'SOLES' | 'USD')}
                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border text-sm"
              >
                <option value="SOLES">Soles</option>
                <option value="USD">Dólares</option>
              </select>
            </div>


    {/* Descripción */}
    <div className="md:col-span-3">
      <label className="block text-sm font-medium mb-1" style={{ color: colorPrimaryDark }}>Descripción</label>
      <input
        type="text"
        value={descripcion}
        onChange={(e) => setDescripcion(e.target.value)}
        placeholder="Descripción"
        className="block w-full rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border text-sm"
        style={{ borderColor: colorPrimaryLight }}
      />
    </div>

            {/* Valor */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1" style={{ color: colorPrimaryDark }}>
                Valor ({tipoMoneda === 'USD' ? 'USD' : 'S/'})
              </label>
              <input
                type="number"
                step="0.01"
                value={valor}
                onChange={handleValorChange}
                placeholder="0.00"
                className="block w-full rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border text-sm"
                style={{ borderColor: colorPrimaryLight }}
              />
              {tipoMoneda === 'USD' && valor && !isNaN(parseFloat(valor)) && (
                <p className="text-xs text-gray-500 mt-1">
                  ≈ {formatMoneda(valorEnSoles)}
                </p>
              )}
            </div>
    
  
    {/* Nº Factura */}
    <div className="md:col-span-1">
      <label className="block text-sm font-medium mb-1" style={{ color: colorPrimaryDark }}>Nº Factura</label>
      <input
        type="text"
        value={numeroFactura}
        onChange={(e) => setNumeroFactura(e.target.value)}
        placeholder="(Opcional)"
        className="block w-full rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border text-sm"
        style={{ borderColor: colorPrimaryLight }}
      />
    </div>
  </div>

  <div className="mt-4 flex justify-end">
    <button
      onClick={agregarRegistro}
      disabled={isLoading || !descripcion || !valor || !tipoMovimientoId}
      className="px-4 py-2 rounded-lg disabled:opacity-50 flex items-center justify-center"
      style={{
        backgroundColor: colorPrimary,
        color: 'white',
        opacity: isLoading || !descripcion || !valor || !tipoMovimientoId ? 0.5 : 1
      }}
    >
      {isLoading ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-15" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="9"></circle>
            <path className="opacity-15" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Procesando...
        </>
      ) : 'Agregar Registro'}
    </button>
  </div>
        </div>



        {/* Registros del día */}
<div>
  {/* Encabezado de sección */}
  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
    <h3 className="text-lg font-semibold text-primary-dark">Movimientos del día</h3>
    <div className="px-3 py-1 rounded-lg bg-secondary">
      <p className="text-sm font-medium text-primary-dark">
        Balance del día: 
        <span className={`ml-2 text-lg ${totalDia >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {formatMoneda(totalDia)}
        </span>
      </p>
    </div>
  </div>

  {/* Contenido */}
  {isLoading && registros.length === 0 ? (
    <div className="flex justify-center items-center py-8">
      <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-400 border-t-transparent"></div>
    </div>
  ) : registros.length === 0 ? (
    <p className="text-sm text-center text-gray-500 py-6">No hay registros para esta fecha.</p>
  ) : (
    <div className="overflow-x-auto border rounded-lg shadow-sm">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {[
              'Fecha',  'Tipo', 'Categoría',
              'Médico','Paciente' ,'Tipo Pago', 'Valor',
              'Factura', 'Usuario', 'Acciones'
            ].map((col) => (
              <th
                key={col}
                className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-primary-dark whitespace-nowrap"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {registros.map((registro) => {
            const tipo = registro.tipo_movimiento?.tipo || 'DESC';
            const { display: valorDisplay, color: valorColor } = formatValor(registro.valor, tipo);
            const { fecha: fechaISO } = formatDateTime(registro.fecha);

            return (
              <tr key={registro.id} className="hover:bg-gray-50">
                <td className="px-3 py-2 text-sm text-gray-700">{fechaISO}</td>
                
                <td className="px-3 py-2">
                  <span className={`px-2 py-1 text-xs rounded-full font-medium
                    ${tipo === 'Ingreso'
                      ? 'bg-green-100 text-green-800'
                      : tipo === 'Egreso'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'}
                  `}>
                    {tipo}
                  </span>
                </td>
                <td className="px-3 py-2 text-sm text-gray-900">
                  {registro.tipo_movimiento?.nombre || 'Desconocido'}
                  {registro.descripcion && (
                    <p className="text-xs text-gray-500 truncate max-w-xs" title={registro.descripcion}>
                      {registro.descripcion}
                    </p>
                  )}
                </td>
                <td className="px-3 py-2 text-sm text-gray-900">{registro.medico?.nombre || '-'}</td>
                <td className="px-3 py-2 text-sm text-gray-900">  {registro.paciente?.nombreCompleto || '-'}</td>
                <td className="px-3 py-2 text-sm text-gray-900">{registro.forma_pago || '-'}</td>
                <td className={`px-3 py-2 text-sm font-semibold ${valorColor}`}>
                  {valorDisplay}
                </td>
                <td className="px-3 py-2 text-sm text-gray-600">{registro.numero_factura || '-'}</td>
                <td className="px-3 py-2 text-sm text-gray-700">{registro.usuario?.nombre || 'Desconocido'}</td>
                <td className="px-3 py-2 text-sm">
                  <button
                    onClick={() => eliminarRegistro(registro.id)}
                    className="text-red-600 hover:text-red-800 flex items-center"
                    title="Eliminar registro"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <span className="sr-only sm:not-sr-only">Eliminar</span>
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  )}
</div>


        {/* Gráfico de distribución */}
{chartData && (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    {/* Gráfico de Ingresos por categoría - Más pequeño */}
    <div className="bg-white p-3 rounded-lg shadow">
      <h3 className="text-sm font-semibold mb-2 text-center" style={{ color: colorPrimaryDark }}>
        Ingresos por Categoría
      </h3>
      <div className="h-48"> {/* Altura reducida */}
        <Pie
          data={chartData.ingresosPorCategoria}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'bottom', // Cambiado a bottom para ahorrar espacio
                labels: {
                  boxWidth: 10, // Tamaño reducido de los ítems de leyenda
                  font: {
                    size: 9 // Tamaño de fuente reducido
                  }
                }
              },
              tooltip: {
                callbacks: {
                  label: function(context) {
                    return `${context.label}: ${formatMoneda(context.raw as number)}`;
                  }
                }
              }
            }
          }}
        />
      </div>
    </div>

    {/* Gráfico de Egresos por categoría - Más pequeño */}
    <div className="bg-white p-3 rounded-lg shadow">
      <h3 className="text-sm font-semibold mb-2 text-center" style={{ color: colorPrimaryDark }}>
        Egresos por Categoría
      </h3>
      <div className="h-48"> {/* Altura reducida */}
        <Pie
          data={chartData.egresosPorCategoria}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'bottom',
                labels: {
                  boxWidth: 10,
                  font: {
                    size: 9
                  }
                }
              },
              tooltip: {
                callbacks: {
                  label: function(context) {
                    return `${context.label}: ${formatMoneda(context.raw as number)}`;
                  }
                }
              }
            }
          }}
        />
      </div>
    </div>

    {/* Gráfico de distribución general - Más pequeño */}
   <div className="bg-white p-3 rounded-lg shadow">
      <h3 className="text-sm font-semibold mb-2 text-center" style={{ color: colorPrimaryDark }}>
        Ingresos vs Egresos
      </h3>
      <div className="h-48">
        <Pie
          data={{
            ...chartData.distribucionGeneral,
            datasets: [{
              ...chartData.distribucionGeneral.datasets[0],
               backgroundColor: ['#81C784', '#E57373'],// Verde para ingresos, rojo para egresos
              borderColor: ['#388E3C', '#D32F2F']     // Verde oscuro y rojo oscuro para bordes
            }]
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'bottom',
                labels: {
                  boxWidth: 10,
                  font: {
                    size: 9
                  }
                }
              },
              tooltip: {
                callbacks: {
                  label: function(context) {
                    return `${context.label}: ${formatMoneda(context.raw as number)}`;
                  }
                }
              }
            }
          }}
        />
      </div>
    </div>
  </div>
)}

        {/* Historial */}
      
{historialVisible && (
  <div className="mt-6 sm:mt-8">
    {/* Filtros de fecha */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
      <div>
        <label className="block text-sm font-medium mb-1">Fecha Inicio:</label>
        <input
          type="date"
          value={fechaInicioHistorial}
          onChange={(e) => setFechaInicioHistorial(e.target.value)}
          className="w-full rounded-lg border-gray-300 shadow-sm p-2 border text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Fecha Fin:</label>
        <input
          type="date"
          value={fechaFinHistorial}
          onChange={(e) => setFechaFinHistorial(e.target.value)}
          className="w-full rounded-lg border-gray-300 shadow-sm p-2 border text-sm"
        />
      </div>
      <div className="flex items-end">
        <button
          onClick={cargarHistorial}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Aplicar Filtros
        </button>
      </div>
    </div>

    {/* Encabezado del historial */}
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4 mb-4">
      <h3 className="text-lg font-semibold" style={{ color: colorPrimaryDark }}>Historial de Movimientos</h3>
      <div className="px-3 py-1 rounded-lg" style={{ backgroundColor: colorSecondary }}>
        <p className="text-sm font-medium" style={{ color: colorPrimaryDark }}>
          Balance del período: 
          <span className={`ml-2 text-lg ${balanceMes >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatMoneda(balanceMes)}
          </span>
        </p>
      </div>
    </div>

    {/* Gráficos del historial */}
    {chartDataHistorial && (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-semibold mb-2 text-center">Ingresos por Categoría</h3>
          <div className="h-64">
            <Pie data={chartDataHistorial.ingresosPorCategoria} />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-semibold mb-2 text-center">Egresos por Categoría</h3>
          <div className="h-64">
            <Pie data={chartDataHistorial.egresosPorCategoria} />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-semibold mb-2 text-center">Balance General</h3>
          <div className="h-64">
            <Pie data={chartDataHistorial.distribucionGeneral} />
          </div>
        </div>
      </div>
    )}

    {/* Tabla de historial */}
    {historialFiltrado.length === 0 ? (
      <p className="text-sm text-gray-500">No hay registros históricos para el período seleccionado</p>
    ) : (
      <div className="space-y-6 sm:space-y-8">
        {historialFiltrado.map((anoData) => (
          <div key={anoData.ano} className="border rounded-lg overflow-hidden" style={styles.card}>
            <div className="px-4 py-2 border-b" style={{ backgroundColor: colorSecondary }}>
              <h4 className="font-medium" style={{ color: colorPrimaryDark }}>{anoData.ano}</h4>
            </div>
            
            <div className="divide-y divide-gray-200">
              {anoData.meses.map((mesData) => {
                const nombreMes = new Date(anoData.ano, mesData.mes - 1, 1)
                  .toLocaleString('es-ES', { month: 'long' });
                
                const balanceMes = mesData.registros.reduce((sum, reg) => {
                  const tipo = reg.tipo_movimiento?.tipo;
                  return tipo === 'Ingreso' ? sum + reg.valor : sum - Math.abs(reg.valor);
                }, 0);
                
                return (
                  <div key={`${anoData.ano}-${mesData.mes}`} className="bg-white">
                    <div className="px-3 sm:px-4 py-2 sm:py-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1 sm:gap-0" style={{ backgroundColor: colorSecondary }}>
                      <span className="font-medium capitalize" style={{ color: colorPrimaryDark }}>
                        {nombreMes}
                      </span>
                      <span className={`text-sm font-medium ${
                        balanceMes >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        Balance: {formatMoneda(balanceMes)}
                      </span>
                    </div>
                    
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider" style={{ color: colorPrimaryDark }}>Fecha</th>
                          
                            <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider" style={{ color: colorPrimaryDark }}>Tipo</th>
                            <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider" style={{ color: colorPrimaryDark }}>Categoría</th>
                            <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider" style={{ color: colorPrimaryDark }}>Paciente</th>
                            <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider" style={{ color: colorPrimaryDark }}>Médico</th>
                            <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider" style={{ color: colorPrimaryDark }}>Forma Pago</th>
                            <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider" style={{ color: colorPrimaryDark }}>Moneda</th>
                            <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider" style={{ color: colorPrimaryDark }}>Valor</th>
                            <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider" style={{ color: colorPrimaryDark }}>Factura</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {mesData.registros.map((registro) => {
                            const tipo = registro.tipo_movimiento?.tipo;
                            const { display: valorDisplay, color: valorColor } = formatValor(registro.valor, tipo || 'Egreso');
                            const { fecha: fechaISO } = formatDateTime(registro.fecha);
                            
                            return (
                              <tr key={registro.id} className="hover:bg-gray-50">
                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                                  {fechaISO}
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
                                  {registro.paciente?.nombreCompleto || '-'}
                                </td>
                                <td className="px-3 py-2 text-sm text-gray-900">
                                  {registro.medico?.nombre || '-'}
                                </td>
                                <td className="px-3 py-2 text-sm text-gray-900">
                                  {registro.forma_pago || '-'}
                                </td>
                                <td className="px-3 py-2 text-sm text-gray-900">
                                  {registro.moneda}
                                </td>
                                <td className={`px-3 py-2 whitespace-nowrap text-sm font-medium ${valorColor}`}>
                                  {valorDisplay}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                                  {registro.numero_factura || '-'}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
)}

      </div>
    </div>
  );
}


function PaginaPrincipal() {
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [userLastName, setUserLastName] = useState('');

 
  const [estaProcesando, setEstaProcesando] = useState<boolean>(false);

  const [ubicacionActual, setUbicacionActual] = useState<Ubicacion | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeTab, setActiveTab] = useState('registro');
  const [userActiveTab, setUserActiveTab] = useState('caja');
  const [userData, setUserData] = useState(null);


  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

 
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUbicacionActual(position.coords);
        },
        () => {
        //  toast.error('No se pudo obtener tu ubicación');
        }
      );
    }
  }, []);

  
  
  useEffect(() => {    
    
    const getSession = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession({
          forceRefresh: true
        });
        
        if (sessionError || !session?.user) {
          throw sessionError || new Error('No hay sesión activa');
        }

        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id, email, nombre, apellido,  activo')
          .eq('id', session.user.id)
          .single();

        if (userError || !userData) {
          throw userError || new Error('Error al obtener datos del usuario');
        }

        if (!userData.activo) {
          await supabase.auth.signOut();
          window.location.reload();
          return;
        }

        setUserId(session.user.id);
        setUserEmail(userData.email);
        setUserName(userData.nombre || '');
        setUserLastName(userData.apellido || '');
        setUserData(userData); 
        
       
      } catch (error) {
        console.error('Error obteniendo sesión:', error);
        toast.error(error.message);
      }
    };
    getSession();
  }, []);

 


 // ADMIN CONTENT
    const renderAdminContent = () => {
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      const checkAdminStatus = async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) {
            setIsAdmin(false);
            return;
          }

          const { data: userData, error } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single();

          if (error) throw error;
          setIsAdmin(userData?.role === 'admin');
        } catch (error) {
          console.error('Error checking admin status:', error);
          setIsAdmin(false);
        } finally {
          setLoading(false);
        }
      };

      checkAdminStatus();
    }, []);

    if (loading) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      );
    }

    return (
      <div className="flex">
        {/* Barra lateral - Solo visible para admin */}
        {isAdmin && (
          <div className="w-64 p-4" style={{ 
            backgroundColor: colors.primary[50],
            borderRight: `1px solid ${colors.primary[100]}`
          }}>
            <button
              className={`px-4 py-3 font-medium text-sm flex items-center w-full mb-3 rounded-lg transition-colors ${
                activeTab === 'registro'
                  ? `text-white bg-${colors.primary[600]} shadow-md`
                  : `text-${colors.primary[600]} hover:bg-${colors.primary[100]}`
              }`}
              onClick={() => setActiveTab('registro')}
              style={{
                backgroundColor: activeTab === 'registro' ? colors.primary[600] : 'transparent',
                color: activeTab === 'registro' ? 'white' : colors.primary[600]
              }}
            >
              <Table2Icon className="w-4 h-4 mr-2" />
              General
            </button>
            
            <button
              className={`px-4 py-3 font-medium text-sm flex items-center w-full mb-3 rounded-lg transition-colors ${
                activeTab === 'medicos'
                  ? `text-white bg-${colors.primary[600]} shadow-md`
                  : `text-${colors.primary[600]} hover:bg-${colors.primary[100]}`
              }`}
              onClick={() => setActiveTab('medicos')}
              style={{
                backgroundColor: activeTab === 'medicos' ? colors.primary[600] : 'transparent',
                color: activeTab === 'medicos' ? 'white' : colors.primary[600]
              }}
            >
              <PersonStandingIcon className="w-4 h-4 mr-2" />
              Médicos
            </button>

            {/* Botão para Pacientes */}
            <button
              className={`px-4 py-3 font-medium text-sm flex items-center w-full mb-3 rounded-lg transition-colors ${
                activeTab === 'pacientes'
                  ? `text-white bg-${colors.primary[600]} shadow-md`
                  : `text-${colors.primary[600]} hover:bg-${colors.primary[100]}`
              }`}
              onClick={() => setActiveTab('pacientes')}
              style={{
                backgroundColor: activeTab === 'pacientes' ? colors.primary[600] : 'transparent',
                color: activeTab === 'pacientes' ? 'white' : colors.primary[600]
              }}
            >
              <User className="w-4 h-4 mr-2" />
              Pacientes
            </button>
            {/* Botão para Dashboard */}

            <button
              className={`px-4 py-3 font-medium text-sm flex items-center w-full mb-3 rounded-lg transition-colors ${
                activeTab === 'dashboard'
                  ? `text-white bg-${colors.primary[600]} shadow-md`
                  : `text-${colors.primary[600]} hover:bg-${colors.primary[100]}`
              }`}
              onClick={() => setActiveTab('dashboard')}
              style={{
                backgroundColor: activeTab === 'dashboard' ? colors.primary[600] : 'transparent',
                color: activeTab === 'dashboard' ? 'white' : colors.primary[600]
              }}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Dashboard
            </button>
          </div>
        )}
    
        {/* Contenido principal */}
        <div className={`${isAdmin ? 'flex-1' : 'w-full'} p-6`}>
          <div className="transition-all duration-200">
            {(!isAdmin || activeTab === 'registro') && renderNormalUserContent()}
            
            {isAdmin && activeTab === 'medicos' && (
              <div className="animate-fadeIn">
                <GestionDoctores />
              </div>
            )}

            {/* Novo conteúdo para Pacientes */}
            {isAdmin && activeTab === 'pacientes' && (
              <div className="animate-fadeIn">
                <GestionPaciente/>
              </div>
            )}
    
            {isAdmin && activeTab === 'dashboard' && (
              <div className="animate-fadeIn">
                <div className="bg-white rounded-lg shadow-lg p-4" style={{ 
                  border: `1px solid ${colors.primary[100]}`,
                  boxShadow: `0 4px 6px ${colors.primary[50]}`
                }}>
                  <iframe 
                    title="Dashboard Power BI"
                    width="100%" 
                    height="700"
                    src="" 
                    frameBorder="0"
                    allowFullScreen
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };
  
 // USER CONTENT
    const renderNormalUserContent = () => {
  return (
    <div className="space-y-6">
      {/* Pestañas de navegación */}
      <div className="flex border-b" style={{ borderColor: colors.primary[100] }}>
        {/* Pestaña Mi Caja */}
        <button
          className={`px-4 py-3 font-medium text-sm flex items-center transition-colors ${
            userActiveTab === 'caja'
              ? `text-white bg-[${colors.primary[900]}]`
              : `text-[${colors.primary[600]}] hover:bg-[${colors.primary[50]}]`
          }`}
          onClick={() => setUserActiveTab('caja')}
          style={{
            backgroundColor: userActiveTab === 'caja' ? colors.primary[900] : 'transparent',
            color: userActiveTab === 'caja' ? 'white' : colors.primary[600],
            borderBottom: userActiveTab === 'caja' ? `2px solid ${colors.primary[900]}` : 'none',
            marginBottom: '-1px'
          }}
          aria-current={userActiveTab === 'caja' ? 'page' : undefined}
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Mi Caja
        </button>
      </div>

      {/* Contenido de la pestaña activa */}
      {userActiveTab === 'caja' && (
        <div 
          className="rounded-xl shadow-sm p-6 bg-white"
          style={{ 
            border: `1px solid ${colors.primary[100]}`
          }}
        >
          <MiCaja userId={userId} />
        </div>
      )}
    </div>
  );
};


  return (
    <div className="min-h-screen" style={{
      background: `linear-gradient(135deg, ${colors.primary[900]} 0%, ${colors.primary[700]} 50%, ${colors.primary[500]} 100%)`,
      backgroundAttachment: 'fixed'
    }}>
      <Toaster position="top-right" />
      
      {/* Barra superior con efecto vidrio */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)'
      }}>
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-3">
              <MolarIcon className="w-8 h-8" style={{ color: colors.primary[500] }} />
              <div>
                <h1 className="text-xl font-bold" style={{ color: colors.primary[800] }}>
                  Andrew's Dental Group
                </h1>
                <p className="text-sm" style={{ color: colors.neutral[600] }}>
                  Sistema de Gestión Odontológica
                </p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
              <div className="flex items-center space-x-2" style={{ color: colors.primary[700] }}>
                <User className="w-5 h-5" />
                <div className="flex flex-col">
                  <span className="font-medium text-sm sm:text-base">
                    {userName || userLastName ? 
                      `Hola, ${userName} ${userLastName}` : 
                      `Bienvenido!, ${userEmail}`}
                  </span>
                  <span className="text-xs truncate max-w-[180px] sm:max-w-none" style={{ color: colors.neutral[600] }}>
                    {userEmail}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center space-x-2" style={{ color: colors.primary[700] }}>
                <Clock className="w-5 h-5" />
                <span className="text-sm sm:text-base">{currentTime.toLocaleTimeString('es-ES')}</span>
              </div>
              
              {ubicacionActual && (
                <div className="hidden sm:flex items-center space-x-2" style={{ color: colors.primary[700] }}>
                  <MapPin className="w-5 h-5" />
                  <span className="text-xs">
                    Lat: {ubicacionActual.latitude.toFixed(6)}, Long: {ubicacionActual.longitude.toFixed(6)}
                  </span>
                </div>
              )}
              
              <button
                onClick={async () => {
                  await supabase.auth.signOut();
                  localStorage.removeItem('sb-auth-token');
                  sessionStorage.removeItem('sb-auth-token');
                }}
                className="flex items-center space-x-1 text-sm sm:text-base rounded-full px-3 py-1 transition-colors hover:bg-opacity-90"
                style={{
                  color: colors.primary[600],
                  backgroundColor: colors.primary[50],
                  border: `1px solid ${colors.primary[100]}`,
                }}
                title="Cerrar sesión"
              >
                <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Cerrar sesión</span> 
              </button>
            </div>
          </div>
        </div>
      </div>
  
      {/* Contenido principal con tarjeta semitransparente */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.92)',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          padding: '2rem',
          minHeight: '70vh'
        }}>
          {renderAdminContent()}
        </div>
      </main>
    </div>
  );
  
}


function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const cleanCache = async () => {
      try {
        let registrations: ServiceWorkerRegistration[] = []; // <- declarar aqui
    
        // Limpiar Service Workers
        if ('serviceWorker' in navigator) {
          registrations = [...await navigator.serviceWorker.getRegistrations()];
          for (const registration of registrations) {
            await registration.unregister();
          }
        }
    
        // Limpiar Cache API
        const cacheNames = await caches.keys();
        for (const name of cacheNames) {
          await caches.delete(name);
        }
    
        // Limpiar localStorage y sessionStorage selectivamente
        const itemsToKeep = ['supabase.auth.token'];
        Object.keys(localStorage).forEach(key => {
          if (!itemsToKeep.includes(key)) {
            localStorage.removeItem(key);
          }
        });
    
        Object.keys(sessionStorage).forEach(key => {
          if (!itemsToKeep.includes(key)) {
            sessionStorage.removeItem(key);
          }
        });
    
        // Forzar recarga si se limpió algo
        if (cacheNames.length > 0 || registrations.length > 0) {
          window.location.reload();
        }
      } catch (error) {
        console.error('Error cleaning cache:', error);
      }
    };
    
  
    
    cleanCache();

    const checkAuth = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session?.user) {
          setIsLoggedIn(false);
          return;
        }
        testSupabase();
        console.log('Verificando dados do usuário ...');
    
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('activo, nombre, apellido')
          .eq('id', session.user.id)
          .single()
          .throwOnError();
          console.log('Dados do usuário:', userData); 
          
        setIsLoggedIn(!!userData?.activo);
        if (!userData?.activo) {
          await supabase.auth.signOut();
        }
      } catch (error) {
        console.error('Auth check error:', error);
        await supabase.auth.signOut();
        setIsLoggedIn(false);
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('activo, nombre, apellido')
          .eq('id', session.user.id)
          .single();
        
        if (userError || !userData?.activo) {
          await supabase.auth.signOut();
          setIsLoggedIn(false);
        } else {
          setIsLoggedIn(true);
        }
      } else {
        setIsLoggedIn(false);
      }
    });

    return () => subscription?.unsubscribe();
  }, []);

  return (
    <Router>
      <Toaster position="top-right" />
      <Routes>
        {/* Ruta pública */}
        <Route path="/login" element={!isLoggedIn ? <IniciarSesion /> : <Navigate to="/caja" />} />

        {/* Ruta protegida */}
        <Route path="/" element={<Navigate to="/caja" replace />} />
        <Route path="/caja" element={isLoggedIn ? <PaginaPrincipal /> : <Navigate to="/login" replace />} />

        {/* Redirección por defecto */}
        <Route path="*" element={<Navigate to={isLoggedIn ? '/caja' : '/login'} replace />} />
      </Routes>
    </Router>
  );
}


export default App;