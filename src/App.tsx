import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import './index.css'; 
import { Truck, Clock, MapPin, LogIn, LogOut, Calendar, User, MapPinned, Timer, FileText, Upload, Download, Table2Icon, Table, PanelsTopLeft, PersonStanding, PersonStandingIcon , Eye, EyeOff} from 'lucide-react';
import { supabase } from './lib/supabase';
import toast, { Toaster } from 'react-hot-toast';
import { Calendar as BigCalendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'moment/locale/es';
import { Event } from 'react-big-calendar';

import { Pie } from 'react-chartjs-2';
import {   Chart as ChartJS,   ArcElement,   Tooltip,   Legend,  CategoryScale,  LinearScale,  BarElement,  PointElement,  LineElement,  Title } from 'chart.js';


ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title
);

// Configuración del calendario
const localizer = momentLocalizer(moment);
moment.locale('es', {
  months: 'Enero_Febrero_Marzo_Abril_Mayo_Junio_Julio_Agosto_Septiembre_Octubre_Noviembre_Diciembre'.split('_'),
  weekdays: 'Domingo_Lunes_Martes_Miércoles_Jueves_Viernes_Sábado'.split('_')
});

function formatDuration(milliseconds:number) {
  const seconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

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
    50: '#F5E8F2',    100: '#EBD1E5',    200: '#D7A3CB',    300: '#C374B1',
    400: '#AF4697',    500: '#4E023B', // Color principal
    600: '#3E0230',    700: '#2F0125',    800: '#1F011A',    900: '#10000D'
  },
  secondary: {
    50: '#F8F1F6',    100: '#F1E3ED',    200: '#E3C7DB',
    300: '#D5AAC9',    400: '#C78EB7',    500: '#801461', // Color secundario
    600: '#660F4E',    700: '#4D0B3A',    800: '#330827',    900: '#1A0413'
  },
  accent: {
    50: '#FFF5E6',    100: '#FFEBCC',    200: '#FFD699',    300: '#FFC266',
    400: '#FFAD33',    500: '#FF9E00', // Color de acento
    600: '#CC7E00',    700: '#995F00',    800: '#663F00',    900: '#332000'
  },
  neutral: {
    50: '#FAFAFA',    100: '#F5F5F5',    200: '#EEEEEE',    300: '#E0E0E0',    400: '#BDBDBD',
    500: '#9E9E9E',    600: '#757575',    700: '#616161',    800: '#424242',    900: '#212121'
  },
  success: {
    50: '#E8F5E9',    100: '#C8E6C9',    200: '#A5D6A7',    300: '#81C784',    400: '#66BB6A',
    500: '#4CAF50',    600: '#43A047',    700: '#388E3C',    800: '#2E7D32',    900: '#1B5E20'
  },
  warning: {
    50: '#FFF8E1',     100: '#FFECB3',    200: '#FFE082',    300: '#FFD54F',    400: '#FFCA28',    500: '#FFC107',    600: '#FFB300',    700: '#FFA000',
    800: '#FF8F00',    900: '#FF6F00'
  },
  error: {
    50: '#FFEBEE',    100: '#FFCDD2',    200: '#EF9A9A',    300: '#E57373',
    400: '#EF5350',    500: '#F44336',    600: '#E53935',
    700: '#D32F2F',    800: '#C62828',    900: '#B71C1C'
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

    // // Verifica se a conta está ativa
    // const isActive = [true, 'true', 'ativo', '1', 1].includes(String(userData.activo).toLowerCase());

    // if (!isActive) {
    //   await supabase.auth.signOut();
    //   console.warn('🚫 Conta desativada:', {
    //     userId: user.id,
    //     userEmail: user.email,
    //     userActivo: userData.activo
    //   });
    //   throw new Error('Conta desativada. Contate o administrador.');
    // }

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

type MisBoletasProps = {
  userId: string;
};
type Boleta = {
  id: string;
  user_id: string;
  ano: number;
  mes: number;
  created_at: string;
  arquivo_url: string;
  // adicione outros campos se houver
};

type Ubicacion = {
  latitude: number;
  longitude: number;
};
type BoletaUsuario = {
  id: string;
  user_id: string;
  created_at: string;
  ano: number;
  mes: number;
  arquivo_url: string; 
  // outros campos...
};

type User  ={
  id: string;
  nombre: string;
  apellido: string;
  
  
  activo?: boolean;
  role?: string;
}

type DiaLibre = {
  id: string;
  fecha: string;
  user_id: string;
  users?: User;
  // ... otras propiedades
};

type Workspace = {
  id: number;
  name: string;
  ativo: boolean;
  // adicione outros campos se necessário
};

type TimeEntry = {
  id: number;
  user_id: string;
  start_time: string;
  end_time: string | null;
  end_latitude?: number | null;
  end_longitude?: number | null;
};



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
  medico_id?: number | null;
  medico?: {
    id: number;
    nombre: string;
  };
  forma_pago?: 'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA' | 'YAPE' | 'PLIN' | 'OTROS';
}



interface Doctor {
  id: string;
  nombre_completo: string;
  especialidad: string | null;
  telefono: string | null;
  correo: string | null;
  fecha_ingreso: string;
  porcentaje_comision: number | null;
  created_at: string;
}

const GestionDoctores: React.FC = () => {
  // Estados
  const [medicos, setMedicos] = useState<Medico[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [editingMedico, setEditingMedico] = useState<Medico | null>(null);

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
    setFechaIngreso(medico.fecha_ingreso.split('T')[0]); // Formatear solo la fecha
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
    <div 
  className="p-4 rounded-lg mb-6 shadow-md" 
  style={{ backgroundColor: '#801461', color: 'white' }}
>
  <h2 className="text-xl md:text-2xl font-bold">Gestión de Médicos</h2>

      {/* Formulario */}
      <div className="mb-8 p-4 md:p-6 border rounded-lg bg-white shadow-sm">
        <h3 className="text-lg md:text-xl font-semibold mb-4" style={{ color: colorPrimary }}>
          {editingMedico ? 'Editar Médico' : 'Nuevo Médico'}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {/* Nombre */}
          <div className="col-span-full">
            <label className="block text-sm font-medium mb-1" style={{ color: colorPrimaryDark }}>Nombre Completo *</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-[#801461] focus:ring-[#801461] p-3 border text-sm h-12"
              placeholder="Ej: Dr. Juan Pérez"
            />
          </div>

          {/* Especialidad */}
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: colorPrimaryDark }}>Especialidad</label>
            <input
              type="text"
              value={especialidad}
              onChange={(e) => setEspecialidad(e.target.value)}
              className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-[#801461] focus:ring-[#801461] p-3 border text-sm h-12"
              placeholder="Ej: Cardiología"
            />
          </div>

          {/* Teléfono */}
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: colorPrimaryDark }}>Teléfono</label>
            <input
              type="text"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-[#801461] focus:ring-[#801461] p-3 border text-sm h-12"
              placeholder="Ej: +51 987654321"
            />
          </div>

          {/* Correo */}
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: colorPrimaryDark }}>Correo Electrónico</label>
            <input
              type="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-[#801461] focus:ring-[#801461] p-3 border text-sm h-12"
              placeholder="Ej: medico@clinica.com"
            />
          </div>

          {/* Fecha de Ingreso */}
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: colorPrimaryDark }}>Fecha de Ingreso *</label>
            <input
              type="date"
              value={fechaIngreso}
              onChange={(e) => setFechaIngreso(e.target.value)}
              className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-[#801461] focus:ring-[#801461] p-3 border text-sm h-12"
            />
          </div>

          {/* Porcentaje de Comisión */}
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: colorPrimaryDark }}>Porcentaje de Comisión (%)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={porcentajeComision}
              onChange={(e) => setPorcentajeComision(e.target.value)}
              className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-[#801461] focus:ring-[#801461] p-3 border text-sm h-12"
              placeholder="Ej: 30.5"
            />
          </div>
        </div>

        {/* Botones */}
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            onClick={handleSave}
            className="px-6 py-3 bg-[#801461] text-white rounded-lg hover:bg-[#5d0e45] transition-colors text-base font-medium"
          >
            {editingMedico ? 'Actualizar Médico' : 'Registrar Médico'}
          </button>
          {editingMedico && (
            <button
              onClick={resetForm}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-base font-medium"
            >
              Cancelar Edición
            </button>
          )}
        </div>
      </div>

      {/* Tabla de Médicos */}
      {/* Lista de Médicos */}
<div className="bg-white p-4 md:p-6 rounded-lg shadow-sm">
  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
    <h3 className="text-lg md:text-xl font-semibold" style={{ color: colorPrimary }}>
      Listado de Médicos
    </h3>
    <div className="text-sm" style={{ color: colorPrimaryDark }}>
      {medicos.length} {medicos.length === 1 ? 'médico registrado' : 'médicos registrados'}
    </div>
  </div>
  
  {loading ? (
    <div className="text-center py-8">
      <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#801461]"></div>
      <p className="mt-2">Cargando médicos...</p>
    </div>
  ) : medicos.length === 0 ? (
    <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
      <p className="mt-2">No se encontraron médicos registrados</p>
    </div>
  ) : (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse">
        <thead>
          <tr style={{ backgroundColor: colorPrimaryLight }}>
            <th className="border p-2 md:p-3 text-left text-sm md:text-base font-semibold text-white">Nombre</th>
            <th className="border p-2 md:p-3 text-left text-sm md:text-base font-semibold text-white">Especialidad</th>
            <th className="border p-2 md:p-3 text-left text-sm md:text-base font-semibold text-white hidden sm:table-cell">Teléfono</th>
            <th className="border p-2 md:p-3 text-left text-sm md:text-base font-semibold text-white hidden md:table-cell">Correo</th>
            <th className="border p-2 md:p-3 text-left text-sm md:text-base font-semibold text-white">Ingreso</th>
            <th className="border p-2 md:p-3 text-left text-sm md:text-base font-semibold text-white">Comisión</th>
            <th className="border p-2 md:p-3 text-center text-sm md:text-base font-semibold text-white">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {medicos.map((med) => (
            <tr key={med.id} className="hover:bg-gray-50 even:bg-gray-50">
              <td className="border p-2 md:p-3 text-sm md:text-base font-medium text-gray-900">
                {med.nombre}
              </td>
              <td className="border p-2 md:p-3 text-sm md:text-base text-gray-900">
                {med.especialidad || '-'}
              </td>
              <td className="border p-2 md:p-3 text-sm md:text-base text-gray-900 hidden sm:table-cell">
                {med.telefono || '-'}
              </td>
              <td className="border p-2 md:p-3 text-sm md:text-base text-gray-900 hidden md:table-cell">
                {med.correo || '-'}
              </td>
              <td className="border p-2 md:p-3 text-sm md:text-base text-gray-900 whitespace-nowrap">
                {new Date(med.fecha_ingreso).toLocaleDateString()}
              </td>
              <td className="border p-2 md:p-3 text-sm md:text-base text-gray-900">
                {med.porcentaje_comision !== null ? `${med.porcentaje_comision}%` : '-'}
              </td>
              <td className="border p-2 md:p-3 text-center">
                <div className="flex flex-col sm:flex-row gap-1 md:gap-2 justify-center">
                  <button
                    onClick={() => handleEdit(med)}
                    className="px-2 py-1 md:px-3 md:py-1.5 bg-[#801461] text-black rounded text-xs md:text-sm hover:bg-[#5d0e45] transition-colors"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(med.id)}
                    className="px-2 py-1 md:px-3 md:py-1.5 bg-red-600 text-white rounded text-xs md:text-sm hover:bg-red-800 transition-colors"
                  >
                    Eliminar
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
  );
};





// Definición de interfaces
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



function MiCaja({ userId }: { userId: string }) {
  // Estados
  const [registros, setRegistros] = useState<RegistroCaja[]>([]);
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
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
    const date = new Date(dateString);
    return {
      fecha: date.toLocaleDateString('es-ES'),
      hora: date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
    };
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
    const cargarMedicos = async () => {
      try {
        const { data, error } = await supabase.from('medicos').select('id, nombre');
        if (error) throw error;
        setMedicos(data || []);
      } catch (error) {
        console.error('Error al cargar médicos:', error);
        toast.error('Error al cargar lista de médicos');
      }
    };
    cargarMedicos();
  }, []);

  // Cargar registros y calcular balances
  const cargarRegistros = async (fechaSeleccionada: string) => {
    setIsLoading(true);
    try {
      const { data: registrosData, error: registrosError } = await supabase
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
          tipos_movimiento (id, nombre, tipo),
          users:user_id(nombre)
        `)
        .eq('user_id', userId)
        .eq('fecha', fechaSeleccionada)
        .order('created_at', { ascending: true });

      if (registrosError) throw registrosError;

      const registrosCompletos = registrosData?.map(registro => ({
        ...registro,
        tipo_movimiento: registro.tipos_movimiento,
        usuario: registro.users
      })) || [];

      setRegistros(registrosCompletos);
      setChartData(prepararDatosGrafico(registrosCompletos));

      const totalDia = registrosCompletos.reduce((sum, registro) => {
        return registro.tipo_movimiento?.tipo === 'Ingreso' ? sum + registro.valor : sum - Math.abs(registro.valor);
      }, 0);
      setTotalDia(totalDia);

    } catch (error) {
      console.error('Error cargando registros:', error);
      toast.error('Error al cargar registros de caja');
    } finally {
      setIsLoading(false);
    }
  };

  // Preparar datos para el gráfico
const prepararDatosGrafico = (registros: RegistroCaja[]) => {
  // 1. Gráfico de Ingresos por categoría (incluye ajustes positivos)
  const ingresos = registros.filter(r => 
    r.tipo_movimiento?.tipo === 'Ingreso' || 
    (r.tipo_movimiento?.tipo === 'Ajuste' && r.valor >= 0)
  );
  
  const categoriasIngresos = ingresos.reduce((acc, registro) => {
    const categoria = registro.tipo_movimiento?.nombre || 'Otros ingresos';
    acc[categoria] = (acc[categoria] || 0) + Math.abs(registro.valor);
    return acc;
  }, {} as Record<string, number>);

  // 2. Gráfico de Egresos por categoría (incluye ajustes negativos)
  const egresos = registros.filter(r => 
    r.tipo_movimiento?.tipo === 'Egreso' || 
    (r.tipo_movimiento?.tipo === 'Ajuste' && r.valor < 0)
  );
  
  const categoriasEgresos = egresos.reduce((acc, registro) => {
    const categoria = registro.tipo_movimiento?.nombre || 'Otros egresos';
    acc[categoria] = (acc[categoria] || 0) + Math.abs(registro.valor);
    return acc;
  }, {} as Record<string, number>);

  // 3. Gráfico de distribución general (Ingresos vs Egresos)
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
        backgroundColor: [colorPrimary, colorAccent],
        borderColor: [colorPrimaryDark, '#E68A00'],
        borderWidth: 1
      }]
    }
  };
};
  

  // Cargar historial
  const cargarHistorial = async () => {
    try {
      setIsLoading(true);
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
          tipos_movimiento (id, nombre, tipo),
          users:user_id(nombre)
        `)
        .eq('user_id', userId)
        .order('fecha', { ascending: false });
      if (registrosError) throw registrosError;

      const historialPorAno: Record<number, Record<number, RegistroCaja[]>> = {};
      registrosData.forEach(registro => {
        const fecha = new Date(registro.fecha);
        const ano = fecha.getFullYear();
        const mes = fecha.getMonth() + 1;
        if (!historialPorAno[ano]) historialPorAno[ano] = {};
        if (!historialPorAno[ano][mes]) historialPorAno[ano][mes] = [];
        historialPorAno[ano][mes].push({
          ...registro,
          tipo_movimiento: registro.tipos_movimiento,
          usuario: registro.users
        });
      });

      const historialFormateado = Object.entries(historialPorAno).map(([anoStr, meses]) => ({
        ano: parseInt(anoStr),
        meses: Object.entries(meses).map(([mesStr, registros]) => ({
          mes: parseInt(mesStr),
          registros
        }))
      }));

      setHistorialFiltrado(historialFormateado);
      const balance = registrosData.reduce((sum, reg) => {
        const tipo = reg.tipo_movimiento?.tipo;
        return tipo === 'Ingreso' ? sum + reg.valor : sum - Math.abs(reg.valor);
      }, 0);
      setBalanceMes(balance);
    } catch (error) {
      console.error('Error cargando historial:', error);
      toast.error('Error al cargar historial');
    } finally {
      setIsLoading(false);
    }
  };

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

  // Conversión y validación del valor
  let valorNumerico = parseFloat(valor);
  if (isNaN(valorNumerico)) {
    toast.error('El valor debe ser un número');
    return;
  }

  // Lógica de ingreso/egreso
  const tipoMovimientoSeleccionado = tiposMovimiento.find(t => t.id === tipoMovimientoId)?.tipo;
  if (tipoMovimientoSeleccionado === 'Ingreso' && valorNumerico < 0) {
    toast.error('Los ingresos deben ser valores positivos');
    return;
  }
  if (tipoMovimientoSeleccionado === 'Egreso') {
    valorNumerico = -Math.abs(valorNumerico);
  }

  // Insertar registro
  setIsLoading(true);
  try {
    const { error } = await supabase
      .from('registros_caja')
      .insert([{
        fecha,
        tipo_movimiento_id: tipoMovimientoId,
        descripcion,
        valor: valorNumerico,
        numero_factura: numeroFactura || null,
        user_id: userId,
        medico_id: medicoId,  // ← Nombre correcto de la columna
        forma_pago: formaPago
      }]);

    if (error) throw error;
    
    toast.success('Registro agregado correctamente');
    // Resetear formulario
    setDescripcion('');
    setValor('');
    setNumeroFactura('');
    setMedicoId(null);  // Limpiar selección de médico
    // Recargar registros
    cargarRegistros(fecha);
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

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100">
      <h2 className="text-lg font-semibold text-white mb-4 sm:mb-6 p-4 rounded-lg" style={styles.header}>
        Registro de Caja Diaria
      </h2>

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

        {/* Formulario */}
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
    onChange={(e) => setTipoMovimientoId(Number(e.target.value))}
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
    onChange={(e) => setMedicoId(e.target.value || null)}
    className="block w-full  min-w-[450px] rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border text-sm"
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
      <label className="block text-sm font-medium mb-1" style={{ color: colorPrimaryDark }}>Valor</label>
      <input
        type="number"
        step="0.01"
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        placeholder="0.00"
        className="block w-full rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border text-sm"
        style={{ borderColor: colorPrimaryLight }}
      />
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
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
            <h3 className="font-medium" style={{ color: colorPrimaryDark }}>Movimientos del día</h3>
            <div className="px-3 py-1 rounded-lg" style={{ backgroundColor: colorSecondary }}>
              <p className="text-sm font-medium" style={{ color: colorPrimaryDark }}>
                Balance del día: 
                <span className={`ml-2 text-lg ${totalDia >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatMoneda(totalDia)}
                </span>
              </p>
            </div>
          </div>

          {isLoading && registros.length === 0 ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : registros.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">No hay registros para esta fecha</p>
          ) : (
            <div className="overflow-x-auto border rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider" style={{ color: colorPrimaryDark }}>Fecha</th>
                    <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider" style={{ color: colorPrimaryDark }}>Hora</th>
                    <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider" style={{ color: colorPrimaryDark }}>Tipo</th>
                    <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider" style={{ color: colorPrimaryDark }}>Categoría</th>
                   
                    <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider" style={{ color: colorPrimaryDark }}>Valor</th>
                    <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider" style={{ color: colorPrimaryDark }}>Factura</th>
                    <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider" style={{ color: colorPrimaryDark }}>Usuario</th>
                    <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider" style={{ color: colorPrimaryDark }}>Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {registros.map((registro) => {
                    const tipo = registro.tipo_movimiento?.tipo;
                    const { display: valorDisplay, color: valorColor } = formatValor(registro.valor, tipo || 'Egreso');
                    const { fecha: fechaFormateada, hora } = formatDateTime(registro.created_at);
                    
                    return (
                      <tr key={registro.id} className="hover:bg-gray-50">
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                          {fechaFormateada}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                          {hora}
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
                        <td className={`px-3 py-2 whitespace-nowrap text-sm font-medium ${valorColor}`}>
                          {valorDisplay}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                          {registro.numero_factura || '-'}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700">
                          {registro.usuario?.nombre || 'Desconocido'}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => eliminarRegistro(registro.id)}
                            className="text-red-600 hover:text-red-900 flex items-center"
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
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4 mb-4">
              <h3 className="text-lg font-semibold" style={{ color: colorPrimaryDark }}>Historial de Movimientos</h3>
              <div className="px-3 py-1 rounded-lg" style={{ backgroundColor: colorSecondary }}>
                <p className="text-sm font-medium" style={{ color: colorPrimaryDark }}>
                  Balance del mes: 
                  <span className={`ml-2 text-lg ${balanceMes >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatMoneda(balanceMes)}
                  </span>
                </p>
              </div>
            </div>
            
            {historialFiltrado.length === 0 ? (
              <p className="text-sm text-gray-500">No hay registros históricos</p>
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
                                    <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider" style={{ color: colorPrimaryDark }}>Hora</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider" style={{ color: colorPrimaryDark }}>Tipo</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider" style={{ color: colorPrimaryDark }}>Categoría</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider" style={{ color: colorPrimaryDark }}>Valor</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider" style={{ color: colorPrimaryDark }}>Factura</th>
                                  </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                  {mesData.registros.map((registro) => {
                                    const tipo = registro.tipo_movimiento?.tipo;
                                    const { display: valorDisplay, color: valorColor } = formatValor(registro.valor, tipo || 'Egreso');
                                    const { fecha: fechaFormateada, hora } = formatDateTime(registro.created_at);
                                    
                                    return (
                                      <tr key={registro.id} className="hover:bg-gray-50">
                                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                                          {fechaFormateada}
                                        </td>
                                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                                          {hora}
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



function MisBoletas({ userId }: MisBoletasProps) {

  const [boletas, setBoletas] = useState<Boleta[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const cargarBoletas = async () => {
      try {
        const { data, error } = await supabase
          .from('boletas_usuarios')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setBoletas(data || []);
      } catch (error) {
        console.error('Error cargando boletas:', error);
        toast.error('Error al cargar tus boletas');
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) cargarBoletas();
  }, [userId]);

  const handleDownload = (url:string) => {
    window.open(url, '_blank');
  };

  return (
    <div className="rounded-xl p-6" style={{ 
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      border: `1px solid ${colors.primary[100]}`,
      boxShadow: `0 4px 6px ${colors.primary[50]}`
    }}>
      <h2 className="text-xl font-semibold mb-6" style={{ color: colors.primary[700] }}>
        Historias Clínicas
      </h2>
      
      <div className="mb-8 p-4 rounded-lg text-center" style={{ 
        backgroundColor: colors.primary[50],
        border: `1px solid ${colors.primary[200]}`
      }}>
        <h4 className="text-lg font-semibold" style={{ color: colors.primary[600] }}>        
          ¡Muy pronto podrás acceder a las historias clínicas de tus pacientes! 🚀
        </h4>
      </div>
  
      {isLoading ? (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6" style={{
            borderTopColor: colors.primary[500],
            borderRightColor: colors.primary[200],
            borderBottomColor: colors.primary[200],
            borderLeftColor: colors.primary[200]
          }}></div>
        </div>
      ) : boletas.length === 0 ? (
        <p className="text-sm text-center py-4" style={{ color: colors.neutral[500] }}>
          No hay historias clínicas registradas.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg" style={{ borderColor: colors.primary[100] }}>
          <table className="min-w-full divide-y" style={{ divideColor: colors.primary[100] }}>
            <thead style={{ backgroundColor: colors.primary[50] }}>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: colors.primary[600] }}>
                  Año
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: colors.primary[600] }}>
                  Mes
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: colors.primary[600] }}>
                  Fecha de Subida
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: colors.primary[600] }}>
                  Acción
                </th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ 
              backgroundColor: 'white',
              divideColor: colors.primary[100]
            }}>
              {boletas.map((boleta) => (
                <tr key={boleta.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: colors.primary[800] }}>
                    {boleta.ano}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: colors.primary[800] }}>
                    {new Date(2000, boleta.mes - 1, 1).toLocaleString('es-ES', { month: 'long' })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: colors.neutral[600] }}>
                    {new Date(boleta.created_at).toLocaleString('es-ES')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleDownload(boleta.arquivo_url)}
                      className="flex items-center transition-colors"
                      style={{
                        color: colors.primary[600],
                        hoverColor: colors.primary[700]
                      }}
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Descargar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}



function PaginaPrincipal() {
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [userLastName, setUserLastName] = useState('');
  const [lugarTrabajo, setLugarTrabajo] = useState('');
  const [lugarPersonalizado, setLugarPersonalizado] = useState('');
  const [registroTiempo, setRegistroTiempo] = useState<TimeEntry | null>(null);
  const [estaTrabajando, setEstaTrabajando] = useState<boolean>(false);
  const [estaProcesando, setEstaProcesando] = useState<boolean>(false);
  const [tiempoTranscurrido, setTiempoTranscurrido] = useState<number>(0);
  const [ubicacionActual, setUbicacionActual] = useState<Ubicacion | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [ultimoRegistro, setUltimoRegistro] = useState(null);
  const [todosRegistros, setTodosRegistros] = useState([]);
  const [lugaresTrabajo, setLugaresTrabajo] = useState<Workspace[]>([]);
  const [eventosCalendario, setEventosCalendario] = useState([]);
  const [diasLibres, setDiasLibres] = useState<DiaLibre[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeTab, setActiveTab] = useState('registro');
  const [userActiveTab, setUserActiveTab] = useState('caja');
  const [userData, setUserData] = useState(null);
  const [gpsDisabled, setGpsDisabled] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (estaTrabajando && registroTiempo) {
      interval = setInterval(() => {
        setTiempoTranscurrido(new Date().getTime() - new Date(registroTiempo.start_time).getTime());
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [estaTrabajando, registroTiempo]);

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

  const getLocationPromise = () => {
    return new Promise<GeolocationCoordinates | null>((resolve) => {
      // Si ya tenemos coordenadas, devolvemos esas inmediatamente
      if (ubicacionActual) {
        console.log("Usando ubicación ya almacenada:", ubicacionActual);
        resolve(ubicacionActual);
        return;
      }
  
      if (!navigator.geolocation) {
        console.error("Geolocalización no soportada por el navegador");
        resolve(null);
        return;
      }
  
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log("Ubicación obtenida:", position.coords);
          // Actualizar estado global
          setUbicacionActual(position.coords);
          setGpsDisabled(false);
          resolve(position.coords);
        },
        (error) => {
          console.error("Error obteniendo ubicación:", error.code, error.message);
          // No actualizar gpsDisabled aquí, solo para solicitudes explícitas
          resolve(null);
        },
        { 
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    });
  };
  
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
        buscarUltimoRegistro(session.user.id);
        buscarTodosRegistros(session.user.id);
        buscarLugaresTrabajo();
       
      } catch (error) {
        console.error('Error obteniendo sesión:', error);
        toast.error(error.message);
      }
    };
    getSession();
  }, []);

  // Función mejorada para verificar y activar GPS
    const handleActivarGPS = () => {
      // Verificar si el navegador está en modo incógnito (puede causar problemas de permiso)
      const isIncognito = !window.indexedDB;
      
      if (isIncognito) {
        toast.error('El modo incógnito puede bloquear los permisos de ubicación. Por favor, usa una ventana normal.');
        return;
      }
      
      // Detectar si es dispositivo móvil
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      if (isMobile) {
        // Para dispositivos móviles
        toast(
          <div>
            <p className="font-bold">Pasos para activar el GPS:</p>
            <ol className="list-decimal pl-5 mt-2 text-sm">
              <li>Cierra la app y ve a Configuración</li>
              <li>Busca "Aplicaciones" y luego esta aplicación</li>
              <li>Ve a "Permisos" y activa "Ubicación"</li>
              <li>Regresa a la app y refresca la página</li>
            </ol>
          </div>,
          { duration: 15000 }
        );
      } else {
        // Para navegadores de escritorio
        toast(
          <div>
            <p className="font-bold">Para activar la ubicación:</p>
            <ol className="list-decimal pl-5 mt-2 text-sm">
              <li>Haz clic en el icono de candado en la barra de direcciones</li>
              <li>Busca permisos de ubicación</li>
              <li>Selecciona "Permitir"</li>
              <li>Recarga la página</li>
            </ol>
          </div>,
          { duration: 15000 }
        );
      }
      
      // Intentar obtener ubicación de forma forzada
      if (navigator.geolocation) {
        const options = {
          enableHighAccuracy: true,
          timeout: 20000,
          maximumAge: 0
        };
        
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setUbicacionActual(position.coords);
            setGpsDisabled(false);
            toast.success('¡GPS activado correctamente!');
          },
          (error) => {
            setGpsDisabled(true);
            switch (error.code) {
              case error.PERMISSION_DENIED:
                toast.error('Permiso denegado para acceder a tu ubicación');
                break;
              case error.POSITION_UNAVAILABLE:
                toast.error('La información de ubicación no está disponible');
                break;
              case error.TIMEOUT:
                toast.error('Tiempo de espera agotado para obtener ubicación');
                break;
              default:
                toast.error('Error desconocido al acceder a la ubicación');
            }
          },
          options
        );
      } else {
        toast.error('Tu navegador no soporta geolocalización');
      }
    };

    // Función para realizar múltiples intentos de obtener la ubicación
    const obtenerUbicacionConIntentos = async (maxIntentos = 3) => {
      let intentos = 0;
      
      while (intentos < maxIntentos) {
        try {
          const coords = await new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
              reject(new Error('Tiempo de espera agotado'));
            }, 15000);
            
            navigator.geolocation.getCurrentPosition(
              (position) => {
                clearTimeout(timeoutId);
                resolve(position.coords);
              },
              (error) => {
                clearTimeout(timeoutId);
                reject(error);
              },
              { 
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 0 
              }
            );
          });
          
          // Si llegamos aquí, hemos obtenido las coordenadas
          return coords;
        } catch (error) {
          intentos++;
          
          // En el último intento, mostrar un mensaje diferente
          if (intentos === maxIntentos) {
            console.error('No se pudo obtener la ubicación después de varios intentos:', error);
            return null;
          }
          
          // Esperamos un momento antes del siguiente intento
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Si no es el último intento, mostramos mensaje de reintento
          if (intentos < maxIntentos) {
            toast('Reintentando obtener ubicación... (' + intentos + '/' + maxIntentos + ')', { 
              icon: '🔄',
              duration: 1000
            });
          }
        }
      }
      
      return null;
    };

  
  
  // Modifique a verificação de geolocalização no useEffect
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUbicacionActual(position.coords);
          setGpsDisabled(false);
        },
        () => {
          setGpsDisabled(true);
        }
      );
    }
  }, []);

// Añadir esto después de los otros useEffect
useEffect(() => {
  // Verificar el estado del GPS periódicamente
  const checkGpsStatus = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => setGpsDisabled(false),
        () => setGpsDisabled(true),
        { timeout: 5000 }
      );
    } else {
      setGpsDisabled(true);
    }
  };
  
  // Verificar al inicio
  checkGpsStatus();
  
  // Verificar cada 30 segundos
  const interval = setInterval(checkGpsStatus, 30000);
  
  return () => clearInterval(interval);
}, []);

  
  


  const isAdminUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;
  
      const { data: userData, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();
  
      if (error) throw error;
      
      return userData?.role === 'admin';
    } catch (error) {
      console.error('Error verificando rol de admin:', error);
      return false;
    }
  };

  const buscarLugaresTrabajo = async () => {
    try {
      const { data, error } = await supabase
        .from('workspaces')
        .select('*')
        .eq('ativo', true);

      if (error) throw error;
      setLugaresTrabajo(data);
      if (data.length > 0) {
        setLugarTrabajo(data[0].name);
      }
    } catch (error) {
      console.error('Error buscando lugares de trabajo:', error);
      toast.error('Error cargando lugares de trabajo');
    }
  };

  const buscarUltimoRegistro = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('time_entries')
        .select('*')
        .eq('user_id', userId)
        .is('end_time', null)
        .order('start_time', { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;
      if (data) {
        setUltimoRegistro(data);
        setRegistroTiempo(data);
        setEstaTrabajando(true);
        toast('¡Tienes un turno abierto!', { icon: '⚠️' });
      }
    } catch (error) {
      console.error('Error buscando último registro:', error);
    }
  };

  // En la función buscarTodosRegistros
const buscarTodosRegistros = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('time_entries')
      .select('id, workplace, start_time, end_time')
      .eq('user_id', userId)
      .order('start_time', { ascending: false })
      .limit(100); // Limitar a 100 registros

    if (error) throw error;
    
    if (data) {
      setTodosRegistros(data);
      // Procesar eventos de manera más eficiente
      const eventos = data.map(registro => ({
        id: registro.id,
        title: registro.workplace,
        start: new Date(registro.start_time),
        end: registro.end_time ? new Date(registro.end_time) : new Date(),
        status: registro.end_time ? 'completado' : 'en progreso',
      }));
      
      setEventosCalendario(eventos);
    }
  } catch (error) {
    console.error('Error buscando todos los registros:', error);
    toast.error('Error al cargar registros históricos');
  }
};

const iniciarTurno = async () => {
  if (!userId) {
    toast.error('Usuario no autenticado');
    return;
  }

  if (estaProcesando) return;
  setEstaProcesando(true);
  
  try {
    // Usar directamente getLocationPromise en lugar de obtenerUbicacionConIntentos
    const coords = await getLocationPromise();
    
    if (!coords) {
      const confirmar = window.confirm(
        'No se pudo obtener tu ubicación. ' +
        '¿Deseas iniciar el turno sin registrar ubicación?\n\n' +
        'Nota: Para registros futuros, asegúrate de permitir el acceso a la ubicación.'
      );
      
      if (!confirmar) {
        toast.error('Operación cancelada por el usuario');
        setEstaProcesando(false);
        return;
      }
    }

    const lugarSeleccionado = lugarTrabajo === 'Otro' ? lugarPersonalizado : lugarTrabajo;

    const nuevoRegistro = {
      user_id: userId,
      workplace: lugarSeleccionado,
      start_time: new Date().toISOString(),
      start_latitude: coords?.latitude || null,
      start_longitude: coords?.longitude || null,
    };

    // Log para depuración
    console.log("Enviando registro:", nuevoRegistro);

    // Guardar en Supabase
    const { data: registro, error } = await supabase
      .from('time_entries')
      .insert([nuevoRegistro])
      .select()
      .single();

    if (error) throw error;

    setRegistroTiempo(registro);
    setEstaTrabajando(true);
    toast.success('¡Turno iniciado correctamente!');
    buscarTodosRegistros(userId);
  } catch (error) {
    console.error('Error iniciando turno:', error);
    toast.error('Error al iniciar el turno: ' + (error.message || 'Error desconocido'));
  } finally {
    setEstaProcesando(false);
  }
};

const finalizarTurno = async () => {
  if (!registroTiempo?.id || estaProcesando) {
    return;
  }

  setEstaProcesando(true);
  
  try {
    // Usar getLocationPromise
    const coords = await getLocationPromise();
    
    if (!coords) {
      const confirmar = window.confirm(
        'No se pudo obtener tu ubicación. ' +
        '¿Deseas finalizar el turno sin registrar ubicación de salida?'
      );
      
      if (!confirmar) {
        toast.error('Finalización cancelada por el usuario');
        setEstaProcesando(false);
        return;
      }
    }

    // Preparar datos para actualización
    const endTime = new Date().toISOString();
    const actualizaciones = {
      end_time: endTime,
      end_latitude: coords?.latitude || null,
      end_longitude: coords?.longitude || null,
    };

    // Log para depuración
    console.log("Actualizando registro:", actualizaciones);

    // Actualizar en Supabase
    const { error } = await supabase
      .from('time_entries')
      .update(actualizaciones)
      .eq('id', registroTiempo.id);

    if (error) throw error;

    // Calcular tiempo trabajado
    const tiempoTotal = new Date(endTime).getTime() - new Date(registroTiempo.start_time).getTime();
    
    // Actualizar estado local
    setRegistroTiempo(null);
    setEstaTrabajando(false);
    setTiempoTranscurrido(0);
    
    // Mostrar feedback al usuario
    toast.success(`¡Turno finalizado! Tiempo trabajado: ${formatDuration(tiempoTotal)}`);
    buscarTodosRegistros(userId);
  } catch (error) {
    console.error('Error finalizando turno:', error);
    toast.error('Error al finalizar el turno: ' + (error.message || 'Error desconocido'));
  } finally {
    setEstaProcesando(false);
  }
};





  const estiloEvento = (evento: {
    status: string;
  }) => {
    let colorFondo = '#3174ad';
    if (evento.status === 'completado') {
      colorFondo = '#28a745';
    } else if (evento.status === 'en progreso') {
      colorFondo = '#ffc107';
    }
    return {
      style: {
        backgroundColor: colorFondo,
        borderRadius: '4px',
        color: 'white',
        border: 'none',
        padding: '2px 8px',
        fontSize: '14px',
      },
    };
  };

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
              <Truck className="w-4 h-4 mr-2" />
              General
            </button>
            
            {/* Botón de Boletas (comentado)
            <button
              className={`px-4 py-3 font-medium text-sm flex items-center w-full mb-3 rounded-lg transition-colors ${
                activeTab === 'boletas'
                  ? `text-white bg-${colors.primary[600]} shadow-md`
                  : `text-${colors.primary[600]} hover:bg-${colors.primary[100]}`
              }`}
              onClick={() => setActiveTab('boletas')}
              style={{
                backgroundColor: activeTab === 'boletas' ? colors.primary[600] : 'transparent',
                color: activeTab === 'boletas' ? 'white' : colors.primary[600]
              }}
            >
              <FileText className="w-4 h-4 mr-2" />
              Gestión Boletas
            </button> */}
            
            {/* Botón de Días Libres (comentado)
            <button
              className={`px-4 py-3 font-medium text-sm flex items-center w-full mb-3 rounded-lg transition-colors ${
                activeTab === 'dias-libres'
                  ? `text-white bg-${colors.primary[600]} shadow-md`
                  : `text-${colors.primary[600]} hover:bg-${colors.primary[100]}`
              }`}
              onClick={() => setActiveTab('dias-libres')}
              style={{
                backgroundColor: activeTab === 'dias-libres' ? colors.primary[600] : 'transparent',
                color: activeTab === 'dias-libres' ? 'white' : colors.primary[600]
              }}
            >
              <Calendar className="w-4 h-4 mr-2" />
              Gestión Días Libres
            </button> */}
            <button
              className={`px-4 py-3 font-medium text-sm flex items-center w-full mb-3 rounded-lg transition-colors ${
                activeTab === 'medicos'
                  ? `text-white bg-${colors.primary[600]} shadow-md`
                  : `text-${colors.primary[600]} hover:bg-${colors.primary[100]}`
              }`}
              onClick={() => setActiveTab('medicos')}
              style={{
                backgroundColor: activeTab === 'medicos' ? colors.primary[900] : 'transparent',
                color: activeTab === 'medicos' ? 'white' : colors.primary[600]
              }}
            >
              <PersonStandingIcon className="w-4 h-4 mr-2" />
              Médicos
            </button>
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
            
            {/* {isAdmin && activeTab === 'boletas' && (
              <div className="animate-fadeIn">
                <GestionBoletas />
              </div>
            )}
            
            {isAdmin && activeTab === 'dias-libres' && (
              <div className="animate-fadeIn">
                <GestionDiasLibres />
              </div>
            )} */}

            {isAdmin && activeTab === 'medicos' && (
  <div className="animate-fadeIn">
    <GestionDoctores />
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
                    src="https://app.powerbi.com/view?r=eyJrIjoiOTEwODdmMmYtM2FjZC00ZDUyLWI1MjctM2IwYTVjM2RiMTNiIiwidCI6IjljNzI4NmYyLTg0OTUtNDgzZi1hMTc4LTQwMjZmOWU0ZTM2MiIsImMiOjR9" 
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
  
  
  const renderNormalUserContent = () => {
    return (
      <>
        <div className="flex border-b mb-6" style={{ borderColor: colors.primary[100] }}>
         
    
          {/* Pestaña Mi Caja */}
          <button
            className={`px-4 py-3 font-medium text-sm flex items-center transition-colors ${
              userActiveTab === 'caja'
                ? `text-white bg-${colors.primary[900]}`
                : `text-${colors.primary[600]} hover:bg-${colors.primary[50]}`
            }`}
            onClick={() => setUserActiveTab('caja')}
            style={{
              borderBottom: userActiveTab === 'caja' ? `2px solid ${colors.primary[900]}` : 'none',
              marginBottom: '-1px'
            }}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Mi Caja
          </button>

           {/* Pestaña Historias Clínicas */}
           <button
            className={`px-4 py-3 font-medium text-sm flex items-center transition-colors ${
              userActiveTab === 'boletas'
                ? `text-white bg-${colors.primary[900]}`
                : `text-${colors.primary[600]} hover:bg-${colors.primary[900]}`
            }`}
            onClick={() => setUserActiveTab('boletas')}
            style={{
              borderBottom: userActiveTab === 'boletas' ? `2px solid ${colors.primary[900]}` : 'none',
              marginBottom: '-1px'
            }}
          >
            <FileText className="w-4 h-4 mr-2" />
            Historias Clínicas
          </button>
        </div>
    
        {/* Contenido de las pestañas */}
        {userActiveTab === 'mis-datos' && (
          <MisDatos userData={userData} />
        )}
    
        {userActiveTab === 'boletas' && (
          <div className="rounded-xl shadow-sm p-6" style={{ 
            backgroundColor: 'white',
            border: `1px solid ${colors.primary[100]}`
          }}>
            <MisBoletas userId={userId} />
          </div>
        )}
    
        {userActiveTab === 'caja' && (
          <div className="rounded-xl shadow-sm p-6" style={{ 
            backgroundColor: 'white',
            border: `1px solid ${colors.primary[100]}`
          }}>
            <MiCaja userId={userId} />
          </div>
        )}
      </>
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
