import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
//import { createClient } from '@supabase/supabase-js';
import { toast, ToastContainer } from 'react-toastify';
import { supabase } from '../lib/supabase';
import 'react-toastify/dist/ReactToastify.css'; // Asegúrate de que esto esté en tu archivo principal o App.tsx
import { sendAppointmentEmail } from '../api/email'; 

/**
 * GoogleCalendarIntegration - Componente completo para integración con Google Calendar
 *
 * Este componente maneja:
 * - Autenticación con Google OAuth 2.0 (se recomienda PKCE para SPAs)
 * - Visualización de eventos del calendario
 * - Creación, edición y eliminación de eventos
 * - Diseño responsivo con la paleta de colores "raspberry"
 * - Integración con Supabase para pacientes y médicos
 *
 * Instrucciones de uso:
 * 1. Importar este componente en tu aplicación React
 * 2. Colocar el componente en tu aplicación: <GoogleCalendarIntegration />
 * 3. Asegurarse de que las credenciales de Google y Supabase estén configuradas como variables de entorno.
 * (CLIENT_SECRET NO DEBE ESTAR EN EL FRONTEND)
 */

// --- Configuración de Supabase ---
// Usa variables de entorno para seguridad.
// Asegúrate de que process.env.REACT_APP_SUPABASE_URL y REACT_APP_SUPABASE_ANON_KEY estén definidos.


// --- Tipos ---
interface Event {
    id: string;
    summary: string;
    // La descripción de Google Calendar es un buen lugar para almacenar datos de paciente/médico
    description?: string;
    start: {
        dateTime: string;
        timeZone: string;
    };
    end: {
        dateTime: string;
        timeZone: string;
    };
    // Los siguientes campos no son parte del objeto Evento de Google Calendar.
    // Los usamos para la lógica interna y para mostrar, pero se mapearán a 'description'
    // o 'extendedProperties' al interactuar con la API de Google Calendar.
    // Para simplificar, los mapearemos a 'description' en este ejemplo.
    paciente?: {
        id: string;
        nombre: string;
        celular: string;
        email: string;
    };
    medico?: {
        id: string;
        nombre: string;
    };
    colorId?: string;
    // Si usaras extendedProperties de Google Calendar, la interfaz Event se vería así:
    // extendedProperties?: {
    //     private?: {
    //         patientId?: string;
    //         patientName?: string;
    //         patientCelular?: string;
    //         patientEmail?: string;
    //         medicoId?: string;
    //         medicoNombre?: string;
    //     };
    // };
}

interface TokenData {
    accessToken: string | null;
    refreshToken: string | null;
    tokenExpiry: number | null;
}

interface Patient {
    id: string;
    dni: string;
    nombres: string;
    apellido_paterno: string;
    apellido_materno: string;
    celular: string;
    correo: string;
}
interface Doctor {
    id: string;
    nombre: string;
}
interface AuthContextType {
    isLoggedIn: boolean;
    loading: boolean;
    error: string | null;
    getAccessToken: () => Promise<string | null>;
    handleLogout: () => void;
}

// --- Configuración de OAuth ---
// Usa variables de entorno para seguridad. CLIENT_SECRET NO DEBE ESTAR AQUÍ.


const REDIRECT_URI = 'http://localhost:5173/AndrewsDentalGroup/'; // Asegúrate de que coincida con lo configurado en Google Cloud Console
const SCOPES = ['https://www.googleapis.com/auth/calendar'];

// Constantes para las claves de localStorage
const ACCESS_TOKEN_KEY = 'googleAccessToken';
const REFRESH_TOKEN_KEY = 'googleRefreshToken';
const TOKEN_EXPIRY_KEY = 'googleTokenExpiry';

// Contexto de autenticación
const AuthContext = createContext<AuthContextType>({
  isLoggedIn: false,
  loading: true,
  error: null,
  getAccessToken: async () => null,
  handleLogout: () => {},
});

// Hook para usar el contexto de autenticación
const useAuth = () => useContext(AuthContext);

// --- Utilidades para el manejo de tokens ---
// Utilidades para el manejo de tokens
const storeTokens = (accessToken: string, refreshToken: string, expiresIn: number): void => {
    const expiryTime = Date.now() + expiresIn * 1000;
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
  };
  
  const getTokens = (): TokenData => {
    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    const tokenExpiryStr = localStorage.getItem(TOKEN_EXPIRY_KEY);
    
    return {
      accessToken,
      refreshToken,
      tokenExpiry: tokenExpiryStr ? parseInt(tokenExpiryStr) : null
    };
  };
  
  const clearTokens = (): void => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
  };

// Servicios de autenticación
const initiateGoogleAuth = (): void => {
    const authUrl = new URL('https://accounts.google.com/o/oauth2/auth');
    
    authUrl.searchParams.append('client_id', CLIENT_ID);
    authUrl.searchParams.append('redirect_uri', REDIRECT_URI);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('scope', SCOPES.join(' '));
    authUrl.searchParams.append('access_type', 'offline');
    authUrl.searchParams.append('prompt', 'consent');
    
    window.location.href = authUrl.toString();
  };
  
  const handleAuthCode = async (code: string): Promise<boolean> => {
    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
          redirect_uri: REDIRECT_URI,
          grant_type: 'authorization_code',
          code,
        }),
      });
  
      const data = await response.json();
      
      if (data.access_token && data.refresh_token) {
        storeTokens(data.access_token, data.refresh_token, data.expires_in);
        return true;
      } else {
        console.error('Error en la respuesta de token:', data);
        return false;
      }
    } catch (error) {
      console.error('Error al intercambiar el código por tokens:', error);
      return false;
    }
  };
  
  const getValidAccessToken = async (): Promise<string | null> => {
    const { accessToken, refreshToken, tokenExpiry } = getTokens();
    
    if (!accessToken || !refreshToken) {
      return null;
    }
    
    if (tokenExpiry && Date.now() < tokenExpiry) {
      return accessToken;
    }
    
    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
        }),
      });
      
      const data = await response.json();
      
      if (data.access_token) {
        storeTokens(data.access_token, refreshToken, data.expires_in);
        return data.access_token;
      } else {
        clearTokens();
        return null;
      }
    } catch (error) {
      console.error('Error al renovar el token:', error);
      clearTokens();
      return null;
    }
  };
  
  const isAuthenticated = async (): Promise<boolean> => {
    const token = await getValidAccessToken();
    return !!token;
  };
  
  const extractAuthCode = (): string | null => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('code');
  };
  
  const logout = (): void => {
    clearTokens();
    window.location.href = '/';
  };

// --- Servicios de Google Calendar ---
// Servicios de Google Calendar
const fetchEvents = async (accessToken: string, timeMin?: string, timeMax?: string): Promise<Event[]> => {
    try {
      const now = new Date();
      const oneMonthFromNow = new Date(now);
      oneMonthFromNow.setMonth(now.getMonth() + 1);
      
      const params = new URLSearchParams({
        timeMin: timeMin || now.toISOString(),
        timeMax: timeMax || oneMonthFromNow.toISOString(),
        singleEvents: 'true',
        orderBy: 'startTime',
      });
      
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message);
      }
      
      return data.items || [];
    } catch (error) {
      console.error('Error al obtener eventos:', error);
      throw error;
    }
  };
  
  const createEvent = async (accessToken: string, event: Omit<Event, 'id'>): Promise<Event> => {
    try {
      const response = await fetch(
        'https://www.googleapis.com/calendar/v3/calendars/primary/events',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(event),
        }
      );
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message);
      }
      
      return data;
    } catch (error) {
      console.error('Error al crear evento:', error);
      throw error;
    }
  };
  
  const updateEvent = async (accessToken: string, eventId: string, event: Partial<Omit<Event, 'id'>>): Promise<Event> => {
    try {
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(event),
        }
      );
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message);
      }
      
      return data;
    } catch (error) {
      console.error('Error al actualizar evento:', error);
      throw error;
    }
  };
  
  const deleteEvent = async (accessToken: string, eventId: string): Promise<void> => {
    try {
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      
      if (response.status !== 204) {
        const data = await response.json();
        throw new Error(data.error?.message || 'Error al eliminar evento');
      }
    } catch (error) {
      console.error('Error al eliminar evento:', error);
      throw error;
    }
  };
  



// --- Componente de botón de inicio de sesión con Google ---
const GoogleLoginButton: React.FC<{ className?: string }> = ({ className = '' }) => {
    const { isLoggedIn, loading, handleLogout } = useAuth();

    const handleLogin = () => {
        initiateGoogleAuth();
    };

    if (loading) {
        return (
            <button
                disabled
                className={`flex items-center justify-center px-4 py-2 bg-raspberry-200 text-raspberry-700 rounded-lg shadow-md ${className}`}
            >
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-raspberry-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Cargando...
            </button>
        );
    }

    if (isLoggedIn) {
        return (
            <button
                onClick={handleLogout}
                className={`flex items-center justify-center px-4 py-2 bg-raspberry-100 text-raspberry-700 hover:bg-raspberry-200 rounded-lg shadow-md transition-colors ${className}`}
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Cerrar Sesión de Google
            </button>
        );
    }

    return (
        <button
            onClick={handleLogin}
            className={`flex items-center justify-center px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-lg shadow-md transition-colors ${className}`}
        >
            <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                    <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z" />
                    <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z" />
                    <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z" />
                    <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z" />
                </g>
            </svg>
            Iniciar sesión con Google
        </button>
    );
};

// --- Componente de formulario de evento (Unified EventForm) ---
const EventForm: React.FC<{
    event?: Event;
    onSubmit: (event: Omit<Event, 'id'>) => void;
    onCancel: () => void;
    pacientes: Patient[]; // Renombrado a 'patients' para consistencia con los tipos
    medicos: Doctor[];   // Renombrado a 'doctors' para consistencia con los tipos
}> = ({ event, onSubmit, onCancel, pacientes, medicos }) => { // Destructurar los props de pacientes y médicos
    const [summary, setSummary] = useState(event?.summary || '');
    const [description, setDescription] = useState(event?.description || '');
    const [startDate, setStartDate] = useState(
        event?.start.dateTime
            ? new Date(event.start.dateTime).toISOString().slice(0, 16)
            : new Date().toISOString().slice(0, 16)
    );
    const [endDate, setEndDate] = useState(
        event?.end.dateTime
            ? new Date(event.end.dateTime).toISOString().slice(0, 16)
            : new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16)
    );
    const [colorId, setColorId] = useState(event?.colorId || '1');

    // Inicializar selectedPaciente/Medico por ID si el evento ya los tiene
    const initialPacienteId = event?.paciente?.id || '';
    const initialMedicoId = event?.medico?.id || '';

    const [selectedPacienteId, setSelectedPacienteId] = useState(initialPacienteId);
    const [selectedMedicoId, setSelectedMedicoId] = useState(initialMedicoId);

    // Encontrar los objetos completos de paciente y médico basados en los IDs seleccionados
    const selectedPaciente = pacientes.find(p => p.id === selectedPacienteId);
    const selectedMedico = medicos.find(m => m.id === selectedMedicoId);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const newEvent: Omit<Event, 'id'> = {
            summary,
            description, // La descripción base
            start: {
                dateTime: new Date(startDate).toISOString(),
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            },
            end: {
                dateTime: new Date(endDate).toISOString(),
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            },
            colorId,
            // Adjuntar paciente y médico al objeto Event para la gestión interna
            ...(selectedPaciente && {
                paciente: {
                    id: selectedPaciente.id,
                    nombre: `${selectedPaciente.nombres} ${selectedPaciente.apellido_paterno} ${selectedPaciente.apellido_materno}`,
                    celular: selectedPaciente.celular,
                    email: selectedPaciente.correo
                }
            }),
            ...(selectedMedico && {
                medico: {
                    id: selectedMedico.id,
                    nombre: selectedMedico.nombre
                }
            })
        };

        onSubmit(newEvent);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="summary" className="block text-sm font-medium text-gray-700 mb-1">
                    Título *
                </label>
                <input
                    id="summary"
                    type="text"
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-raspberry-500 focus:border-raspberry-500"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                        Inicio *
                    </label>
                    <input
                        id="startDate"
                        type="datetime-local"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-raspberry-500 focus:border-raspberry-500"
                    />
                </div>

                <div>
                    <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                        Fin *
                    </label>
                    <input
                        id="endDate"
                        type="datetime-local"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        required
                        min={startDate}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-raspberry-500 focus:border-raspberry-500"
                    />
                </div>
            </div>

            <div>
                <label htmlFor="paciente" className="block text-sm font-medium text-gray-700 mb-1">
                    Paciente *
                </label>
                <select
                    id="paciente"
                    value={selectedPacienteId}
                    onChange={(e) => setSelectedPacienteId(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-raspberry-500 focus:border-raspberry-500"
                >
                    <option value="">Seleccione un paciente</option>
                    {pacientes.map((paciente) => (
                        <option key={paciente.id} value={paciente.id}>
                            {paciente.nombres} {paciente.apellido_paterno} {paciente.apellido_materno}
                        </option>
                    ))}
                </select>
            </div>
            {selectedPaciente && (
                <>
                    <div>
                        <label htmlFor="pacienteCelular" className="block text-sm font-medium text-gray-700 mb-1">
                            Celular del Paciente
                        </label>
                        <input
                            id="pacienteCelular"
                            type="text"
                            value={selectedPaciente.celular || ''}
                            readOnly
                            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
                        />
                    </div>
                    <div>
                        <label htmlFor="pacienteEmail" className="block text-sm font-medium text-gray-700 mb-1">
                            Email del Paciente
                        </label>
                        <input
                            id="pacienteEmail"
                            type="email"
                            value={selectedPaciente.correo || ''}
                            readOnly
                            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
                        />
                    </div>
                </>
            )}

            <div>
                <label htmlFor="medico" className="block text-sm font-medium text-gray-700 mb-1">
                    Médico *
                </label>
                <select
                    id="medico"
                    value={selectedMedicoId}
                    onChange={(e) => setSelectedMedicoId(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-raspberry-500 focus:border-raspberry-500"
                >
                    <option value="">Seleccione un médico</option>
                    {medicos.map((medico) => (
                        <option key={medico.id} value={medico.id}>
                            {medico.nombre}
                        </option>
                    ))}
                </select>
            </div>


            <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción (Adicional)
                </label>
                <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-raspberry-500 focus:border-raspberry-500"
                />
            </div>

            <div>
                <label htmlFor="colorId" className="block text-sm font-medium text-gray-700 mb-1">
                    Color
                </label>
                <select
                    id="colorId"
                    value={colorId}
                    onChange={(e) => setColorId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-raspberry-500 focus:border-raspberry-500"
                >
                    <option value="1">Azul</option>
                    <option value="2">Verde</option>
                    <option value="3">Morado</option>
                    <option value="4">Rojo</option>
                    <option value="5">Amarillo</option>
                    <option value="6">Naranja</option>
                    <option value="7">Turquesa</option>
                    <option value="8">Gris</option>
                    <option value="9">Azul oscuro</option>
                    <option value="10">Verde oscuro</option>
                    <option value="11">Rojo oscuro</option>
                </select>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-raspberry-500"
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-raspberry-700 border border-transparent rounded-md shadow-sm hover:bg-raspberry-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-raspberry-500"
                >
                    {event ? 'Actualizar' : 'Crear'}
                </button>
            </div>
        </form>
    );
};

// --- Componente de elemento de evento (Unified EventItem) ---
const EventItem: React.FC<{
    event: Event;
    onEdit: () => void;
    onDelete: () => void;
}> = ({ event, onEdit, onDelete }) => {
    const startDate = new Date(event.start.dateTime);
    const endDate = new Date(event.end.dateTime);

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('es-ES', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
        });
    };

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const isSameDay = startDate.toDateString() === endDate.toDateString();

    const getColorClass = (colorId?: string) => {
        const colorMap: Record<string, string> = {
            '1': 'bg-blue-100 border-blue-300 text-blue-800',
            '2': 'bg-green-100 border-green-300 text-green-800',
            '3': 'bg-purple-100 border-purple-300 text-purple-800',
            '4': 'bg-red-100 border-red-300 text-red-800',
            '5': 'bg-yellow-100 border-yellow-300 text-yellow-800',
            '6': 'bg-orange-100 border-orange-300 text-orange-800',
            '7': 'bg-teal-100 border-teal-300 text-teal-800',
            '8': 'bg-gray-100 border-gray-300 text-gray-800',
            '9': 'bg-indigo-100 border-indigo-300 text-indigo-800',
            '10': 'bg-emerald-100 border-emerald-300 text-emerald-800',
            '11': 'bg-rose-100 border-rose-300 text-rose-800',
        };

        return colorMap[colorId || '1'] || 'bg-raspberry-100 border-raspberry-300 text-raspberry-800';
    };

    return (
        <div className={`p-4 mb-3 rounded-lg border-l-4 shadow-sm ${getColorClass(event.colorId)}`}>
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="font-medium">{event.summary}</h3>
                    {event.paciente && (
                        <div className="text-sm mt-1 flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            {event.paciente.nombre}
                            {event.paciente.celular && (
                                <span className="ml-3 flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                    </svg>
                                    {event.paciente.celular}
                                </span>
                            )}
                        </div>
                    )}
                    {event.medico && (
                        <div className="text-sm mt-1 flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                            Dr. {event.medico.nombre}
                        </div>
                    )}
                    <div className="text-sm mt-1">
                        {isSameDay ? (
                            <span>
                                {formatDate(startDate)} • {formatTime(startDate)} - {formatTime(endDate)}
                            </span>
                        ) : (
                            <span>
                                {formatDate(startDate)} {formatTime(startDate)} - {formatDate(endDate)} {formatTime(endDate)}
                            </span>
                        )}
                    </div>
                    {event.description && (
                        <div className="text-sm mt-2 line-clamp-2">{event.description}</div>
                    )}
                </div>
                <div className="flex space-x-2">
                    <button
                        onClick={onEdit}
                        className="p-1 text-gray-500 hover:text-raspberry-700 rounded-full hover:bg-raspberry-50"
                        title="Editar"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                    </button>
                    <button
                        onClick={onDelete}
                        className="p-1 text-gray-500 hover:text-red-700 rounded-full hover:bg-red-50"
                        title="Eliminar"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Componente MonthView ---
const MonthView: React.FC<{
    events: Event[];
    currentDate: Date;
    onEventClick: (event: Event) => void;
}> = ({ events, currentDate, onEventClick }) => {
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    const startDate = new Date(startOfMonth);
    startDate.setDate(startOfMonth.getDate() - startOfMonth.getDay()); // Empieza en Domingo de la primera semana visible

    const endDate = new Date(endOfMonth);
    endDate.setDate(endOfMonth.getDate() + (6 - endOfMonth.getDay())); // Termina en Sábado de la última semana visible

    const weeks: Date[][] = [];
    let currentWeek: Date[] = [];
    let currentDay = new Date(startDate);

    while (currentDay <= endDate) {
        currentWeek.push(new Date(currentDay));
        currentDay.setDate(currentDay.getDate() + 1);

        if (currentWeek.length === 7) {
            weeks.push(currentWeek);
            currentWeek = [];
        }
    }
    // Añadir la última semana si no está completa (ej. si el mes termina en medio de una semana)
    if (currentWeek.length > 0) {
        weeks.push(currentWeek);
    }

    const isSameDay = (date1: Date, date2: Date) => {
        return date1.getDate() === date2.getDate() &&
            date1.getMonth() === date2.getMonth() &&
            date1.getFullYear() === date2.getFullYear();
    };

    const isCurrentMonth = (date: Date) => {
        return date.getMonth() === currentDate.getMonth() &&
            date.getFullYear() === currentDate.getFullYear();
    };

    const getEventsForDay = (day: Date) => {
        return events.filter(event => {
            const eventStart = new Date(event.start.dateTime);
            const eventEnd = new Date(event.end.dateTime);
            // Considerar eventos que duran varios días
            return (
                (eventStart <= day && eventEnd >= day) || // Evento abarca o está en este día
                isSameDay(eventStart, day) ||
                isSameDay(eventEnd, day)
            );
        }).sort((a, b) => new Date(a.start.dateTime).getTime() - new Date(b.start.dateTime).getTime());
    };

    return (
        <div className="mt-4">
            {/* Días de la semana */}
            <div className="grid grid-cols-7 gap-1 mb-2">
                {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
                    <div key={day} className="text-center font-medium text-gray-500 text-sm py-2">
                        {day}
                    </div>
                ))}
            </div>

            {/* Semanas del mes */}
            <div className="grid grid-cols-7 gap-1 auto-rows-fr"> {/* auto-rows-fr para alturas de fila flexibles */}
                {weeks.map((week, weekIndex) => (
                    <React.Fragment key={`week-${weekIndex}`}>
                        {week.map((day, dayIndex) => {
                            const dayEvents = getEventsForDay(day);
                            const isToday = isSameDay(day, new Date());

                            return (
                                <div
                                    key={`day-${weekIndex}-${dayIndex}`}
                                    className={`min-h-24 border rounded p-1 flex flex-col ${isCurrentMonth(day) ? 'bg-white' : 'bg-gray-50'} ${
                                        isToday ? 'border-raspberry-500 border-2' : 'border-gray-200'
                                    }`}
                                >
                                    <div className={`text-right text-sm ${
                                        isCurrentMonth(day) ? 'text-gray-700' : 'text-gray-400'
                                    } ${isToday ? 'font-bold text-raspberry-700' : ''}`}>
                                        {day.getDate()}
                                    </div>

                                    <div className="mt-1 space-y-1 overflow-y-auto flex-grow custom-scrollbar"> {/* custom-scrollbar si quieres uno especial */}
                                        {dayEvents.map(event => (
                                            <div
                                                key={event.id}
                                                onClick={() => onEventClick(event)}
                                                className={`text-xs p-1 rounded truncate cursor-pointer ${
                                                    event.colorId === '1' ? 'bg-blue-100 text-blue-800' :
                                                    event.colorId === '2' ? 'bg-green-100 text-green-800' :
                                                    event.colorId === '3' ? 'bg-purple-100 text-purple-800' :
                                                    event.colorId === '4' ? 'bg-red-100 text-red-800' :
                                                    event.colorId === '5' ? 'bg-yellow-100 text-yellow-800' :
                                                    event.colorId === '6' ? 'bg-orange-100 text-orange-800' :
                                                    event.colorId === '7' ? 'bg-teal-100 text-teal-800' :
                                                    event.colorId === '8' ? 'bg-gray-100 text-gray-800' :
                                                    event.colorId === '9' ? 'bg-indigo-100 text-indigo-800' :
                                                    event.colorId === '10' ? 'bg-emerald-100 text-emerald-800' :
                                                    event.colorId === '11' ? 'bg-rose-100 text-rose-800' :
                                                    'bg-raspberry-100 text-raspberry-800'
                                                }`}
                                            >
                                                {event.paciente?.nombre ? `${event.paciente.nombre} - ` : ''}{event.summary}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </React.Fragment>
                ))}
            </div>
        </div>
    );
};


// --- Componente principal de Google Calendar ---
const GoogleCalendarIntegration: React.FC = () => {
    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [events, setEvents] = useState<Event[]>([]);
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
    const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
    const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState<boolean>(false);
    const [eventToDelete, setEventToDelete] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'week' | 'month'>('week'); // Default to 'week'
    const [currentDate, setCurrentDate] = useState<Date>(new Date());
    const [loadingEvents, setLoadingEvents] = useState<boolean>(false);

    const [pacientes, setPacientes] = useState<Patient[]>([]);
    const [medicos, setMedicos] = useState<Doctor[]>([]);

    // Función memoizada para cargar pacientes
    const fetchPacientes = useCallback(async () => {
        if (!isLoggedIn) return;
        setLoading(true);
        try {
            const { data, error: pacientesError } = await supabase
                .from('pacientes')
                .select('id, nombres, apellido_paterno, apellido_materno, celular, correo')
                .eq('activo', true) // Solo pacientes activos
                .order('nombres', { ascending: true });

            if (pacientesError) throw pacientesError;

            setPacientes(data || []);
        } catch (error: any) {
            console.error('Error al cargar pacientes:', error);
            toast.error(`Error al cargar pacientes: ${error.message}`);
        } finally {
            setLoading(false);
        }
    }, [isLoggedIn]);

    // Función memoizada para cargar médicos
    const fetchMedicos = useCallback(async () => {
        if (!isLoggedIn) return;
        setLoading(true);
        try {
            const { data, error: medicosError } = await supabase
                .from('medicos')
                .select('id, nombre')
                .order('nombre', { ascending: true });

            if (medicosError) throw medicosError;

            setMedicos(data || []);
        } catch (error: any) {
            console.error('Error al cargar médicos:', error);
            toast.error(`Error al cargar médicos: ${error.message}`);
        } finally {
            setLoading(false);
        }
    }, [isLoggedIn]);

    // Cargar pacientes y médicos cuando el usuario está autenticado
    useEffect(() => {
        if (isLoggedIn) {
            fetchPacientes();
            fetchMedicos();
        }
    }, [isLoggedIn, fetchPacientes, fetchMedicos]);


    const handleEventClick = (event: Event) => {
        setSelectedEvent(event);
        setIsFormOpen(true);
    };

    // validación de email en tus utilidades
    const isValidEmail = (email: string): boolean => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

    // Renderizar la vista adecuada
    const renderCalendarView = () => {
        if (viewMode === 'month') {
            return (
                <MonthView
                    events={events}
                    currentDate={currentDate}
                    onEventClick={handleEventClick}
                />
            );
        } else { // 'week' view, enhanced to group by day
            const startOfWeek = new Date(currentDate);
            startOfWeek.setDate(currentDate.getDate() - currentDate.getDay()); // Set to Sunday

            const daysInWeek = Array.from({ length: 7 }).map((_, i) => {
                const day = new Date(startOfWeek);
                day.setDate(startOfWeek.getDate() + i);
                return day;
            });

            return (
                <div className="bg-gray-50 rounded-lg p-4">
                    {loadingEvents ? (
                        <div className="flex justify-center items-center p-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-raspberry-700"></div>
                        </div>
                    ) : (
                        <div className="space-y-6"> {/* Increased spacing between days */}
                            {daysInWeek.map((day) => {
                                const eventsForDay = events.filter(event => {
                                    const eventDate = new Date(event.start.dateTime);
                                    return (
                                        eventDate.getDate() === day.getDate() &&
                                        eventDate.getMonth() === day.getMonth() &&
                                        eventDate.getFullYear() === day.getFullYear()
                                    );
                                }).sort((a, b) => new Date(a.start.dateTime).getTime() - new Date(b.start.dateTime).getTime());

                                const isToday = day.toDateString() === new Date().toDateString();

                                return (
                                    <div key={day.toISOString().split('T')[0]} className={`border rounded-lg p-3 ${isToday ? 'border-raspberry-500 bg-raspberry-50' : 'border-gray-200 bg-white'}`}>
                                        <h4 className={`text-lg font-semibold mb-2 ${isToday ? 'text-raspberry-800' : 'text-gray-800'}`}>
                                            {day.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                                            {isToday && <span className="ml-2 text-sm px-2 py-0.5 rounded-full bg-raspberry-200 text-raspberry-700">Hoy</span>}
                                        </h4>
                                        {eventsForDay.length === 0 ? (
                                            <p className="text-gray-500 text-sm">No hay eventos para este día.</p>
                                        ) : (
                                            <div className="space-y-2">
                                                {eventsForDay.map(event => (
                                                    <EventItem
                                                        key={event.id}
                                                        event={event}
                                                        onEdit={() => {
                                                            setSelectedEvent(event);
                                                            setIsFormOpen(true);
                                                        }}
                                                        onDelete={() => {
                                                            setEventToDelete(event.id);
                                                            setIsConfirmDeleteOpen(true);
                                                        }}
                                                    />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            );
        }
    };


    // Verificar el estado de autenticación al cargar el componente
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const authCode = extractAuthCode();

                if (authCode) {
                    const success = await handleAuthCode(authCode);
                    if (success) {
                        setIsLoggedIn(true);
                        // Limpiar el código de la URL para evitar problemas al recargar
                        window.history.replaceState({}, document.title, window.location.pathname);
                    } else {
                        setError('Error al procesar el código de autorización.');
                    }
                } else {
                    const authenticated = await isAuthenticated();
                    setIsLoggedIn(authenticated);
                }
            } catch (err: any) {
                console.error('Error al verificar la autenticación:', err);
                setError(`Error al verificar la autenticación: ${err.message}`);
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
    }, []);

    // Cargar eventos cuando el usuario está autenticado y la vista cambia
    useEffect(() => {
        const loadEvents = async () => {
            if (!isLoggedIn) return;

            setLoadingEvents(true);
            try {
                const accessToken = await getValidAccessToken();
                if (!accessToken) {
                    throw new Error('No se pudo obtener un token de acceso válido. Por favor, inicia sesión de nuevo.');
                }

                let timeMin, timeMax;
                if (viewMode === 'week') {
                    const startOfWeek = new Date(currentDate);
                    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
                    startOfWeek.setHours(0, 0, 0, 0);

                    const endOfWeek = new Date(startOfWeek);
                    endOfWeek.setDate(startOfWeek.getDate() + 7); // Fetch events for the next 7 days from Sunday
                    endOfWeek.setHours(23, 59, 59, 999);

                    timeMin = startOfWeek.toISOString();
                    timeMax = endOfWeek.toISOString();
                } else { // 'month' view
                    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
                    startOfMonth.setHours(0,0,0,0);
                    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
                    endOfMonth.setHours(23,59,59,999);

                    // Para la vista de mes, a menudo se busca un rango que incluya días de meses adyacentes
                    // para llenar la cuadrícula del calendario visualmente.
                    const startOfCalendarGrid = new Date(startOfMonth);
                    startOfCalendarGrid.setDate(startOfMonth.getDate() - startOfMonth.getDay());

                    const endOfCalendarGrid = new Date(endOfMonth);
                    endOfCalendarGrid.setDate(endOfMonth.getDate() + (6 - endOfMonth.getDay()));

                    timeMin = startOfCalendarGrid.toISOString();
                    timeMax = endOfCalendarGrid.toISOString();
                }

                const fetchedEvents = await fetchEvents(accessToken, timeMin, timeMax);
                setEvents(fetchedEvents);
            } catch (err: any) {
                console.error('Error al cargar eventos:', err);
                setError(`Error al cargar eventos: ${err.message}`);
                toast.error(`Error al cargar eventos: ${err.message}`);
            } finally {
                setLoadingEvents(false);
            }
        };

        loadEvents();
    }, [isLoggedIn, viewMode, currentDate]); // Dependencias de los estados que afectan la carga de eventos

    // Obtener un token de acceso válido
    const getAccessToken = async (): Promise<string | null> => {
        try {
            return await getValidAccessToken();
        } catch (err: any) {
            console.error('Error al obtener el token de acceso:', err);
            setError(`Error al obtener el token de acceso: ${err.message}`);
            return null;
        }
    };

    // Manejar el cierre de sesión
    const handleLogout = () => {
        logout();
        setIsLoggedIn(false);
        setEvents([]);
        toast.info('Sesión cerrada.');
    };

    // Manejar la creación de un evento
    const handleCreateEvent = async (eventData: Omit<Event, 'id'>) => {
        try {
            const accessToken = await getAccessToken();
            if (!accessToken) {
                throw new Error('No se pudo obtener un token de acceso válido');
            }
    
            const newEvent = await createEvent(accessToken, eventData);
            setEvents([...events, newEvent]);
            setIsFormOpen(false);
            toast.success('Evento creado exitosamente.');
    
            // Enviar email de confirmación si el paciente tiene email válido
            if (eventData.paciente?.email && isValidEmail(eventData.paciente.email)) {
                try {
                    await sendAppointmentEmail({
                        to: eventData.paciente.email,
                        patientName: eventData.paciente.nombre,
                        doctorName: eventData.medico?.nombre || 'el médico',
                        date: new Date(newEvent.start.dateTime).toLocaleDateString('es-ES', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                        }),
                        time: new Date(newEvent.start.dateTime).toLocaleTimeString('es-ES', {
                            hour: '2-digit',
                            minute: '2-digit',
                        }),
                        action: 'created' // Correct action for creation
                    });
                    toast.success('Email de confirmación enviado al paciente.');
                } catch (emailError) {
                    console.error('Error al enviar el email de confirmación:', emailError);
                    toast.warning('Evento creado pero no se pudo enviar el email de confirmación.');
                }
            } else if (eventData.paciente?.email) { // Only show this warning if email exists but is invalid
                toast.warning('Evento creado pero el email del paciente no es válido.');
            }
    
        } catch (err: any) {
            console.error('Error al crear evento:', err);
            setError(`Error al crear evento: ${err.message}`);
            toast.error(`Error al crear evento: ${err.message}`);
        }
    };

    // Manejar la actualización de un evento
    const handleUpdateEvent = async (eventData: Omit<Event, 'id'>) => {
        // Ensure selectedEvent exists before attempting to update
        if (!selectedEvent) {
            toast.error('No hay evento seleccionado para actualizar.');
            return;
        }
    
        try {
            const accessToken = await getAccessToken();
            if (!accessToken) {
                throw new Error('No se pudo obtener un token de acceso válido');
            }
    
            // --- CORE CORRECTION: Add the actual event update logic ---
            const updatedEvent = await updateEvent(accessToken, selectedEvent.id, eventData);
            setEvents(events.map(event => event.id === selectedEvent.id ? updatedEvent : event));
            setSelectedEvent(null);
            setIsFormOpen(false);
            toast.success('Evento actualizado exitosamente.');
    
            // Enviar email de actualización si el paciente tiene email válido
            if (eventData.paciente?.email && isValidEmail(eventData.paciente.email)) {
                try {
                    await sendAppointmentEmail({
                        to: eventData.paciente.email,
                        patientName: eventData.paciente.nombre,
                        doctorName: eventData.medico?.nombre || 'el médico',
                        date: new Date(updatedEvent.start.dateTime).toLocaleDateString('es-ES', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                        }),
                        time: new Date(updatedEvent.start.dateTime).toLocaleTimeString('es-ES', {
                            hour: '2-digit',
                            minute: '2-digit',
                        }),
                        action: 'updated' // Correct action for update
                    });
                    toast.success('Email de actualización enviado al paciente.');
                } catch (emailError) {
                    console.error('Error al enviar el email de actualización:', emailError);
                    toast.warning('Evento actualizado pero no se pudo enviar el email de confirmación.');
                }
            } else if (eventData.paciente?.email) { // Only show this warning if email exists but is invalid
                toast.warning('Evento actualizado pero el email del paciente no es válido.');
            }
    
        } catch (err: any) {
            console.error('Error al actualizar evento:', err);
            setError(`Error al actualizar evento: ${err.message}`);
            toast.error(`Error al actualizar evento: ${err.message}`);
        }
    };
      
      // Función para enviar emails (usando Supabase o un servicio externo)
interface EmailParams {
    to: string;
    patientName: string;
    doctorName: string;
    date: string;
    time: string;
    action: 'created' | 'updated';
  }
  
 

    // Manejar la eliminación de un evento
    const handleDeleteEvent = async () => {
        if (!eventToDelete) return;

        try {
            const accessToken = await getAccessToken();
            if (!accessToken) {
                throw new Error('No se pudo obtener un token de acceso válido');
            }

            await deleteEvent(accessToken, eventToDelete);
            setEvents(events.filter(event => event.id !== eventToDelete));
            setEventToDelete(null);
            setIsConfirmDeleteOpen(false);
            toast.success('Evento eliminado exitosamente.');
        } catch (err: any) {
            console.error('Error al eliminar evento:', err);
            setError(`Error al eliminar evento: ${err.message}`);
            toast.error(`Error al eliminar evento: ${err.message}`);
        }
    };

    // Manejar la navegación de fechas
    const handleDateNavigation = (direction: 'prev' | 'next') => {
        const newDate = new Date(currentDate);

        if (viewMode === 'week') {
            newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
        } else { // month
            newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
        }

        setCurrentDate(newDate);
    };

    // Formatear el rango de fechas actual
    const formatDateRange = () => {
        if (viewMode === 'week') {
            const startOfWeek = new Date(currentDate);
            startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());

            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6);

            const startMonth = startOfWeek.toLocaleDateString('es-ES', { month: 'short' });
            const endMonth = endOfWeek.toLocaleDateString('es-ES', { month: 'short' });

            if (startOfWeek.getFullYear() === endOfWeek.getFullYear()) {
                if (startMonth === endMonth) {
                    return `${startOfWeek.getDate()} - ${endOfWeek.getDate()} ${startMonth} ${startOfWeek.getFullYear()}`;
                } else {
                    return `${startOfWeek.getDate()} ${startMonth} - ${endOfWeek.getDate()} ${endMonth} ${endOfWeek.getFullYear()}`;
                }
            } else {
                return `${startOfWeek.getDate()} ${startMonth} ${startOfWeek.getFullYear()} - ${endOfWeek.getDate()} ${endMonth} ${endOfWeek.getFullYear()}`;
            }
        } else { // 'month' view
            return currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
        }
    };


    // Valor del contexto de autenticación
    const authContextValue = {
        isLoggedIn,
        loading,
        error,
        getAccessToken,
        handleLogout,
    };

    // Renderizar el componente
    return (
        <AuthContext.Provider value={authContextValue}>
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                {/* Cabecera */}
                <div className="bg-gradient-to-r from-raspberry-700 to-raspberry-800 p-4 sm:p-6 text-white">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
                        <h1 className="text-xl font-bold flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Agenda Médica
                        </h1>
                        <GoogleLoginButton className="w-full sm:w-auto" />
                    </div>
                </div>

                {/* Contenido principal */}
                {loading ? (
                    <div className="flex justify-center items-center p-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-raspberry-700"></div>
                    </div>
                ) : !isLoggedIn ? (
                    <div className="p-6 text-center">
                        <div className="mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-raspberry-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-semibold text-gray-700 mb-2">Acceso a la Agenda</h2>
                        <p className="text-gray-500 mb-6">Inicia sesión con tu cuenta de Google para gestionar la agenda médica.</p>
                        <GoogleLoginButton className="mx-auto" />
                    </div>
                ) : (
                    <div className="p-4 sm:p-6">
                        {/* Barra de herramientas */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={() => handleDateNavigation('prev')}
                                    className="p-2 rounded-full hover:bg-gray-100"
                                    title="Anterior"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>
                                <h2 className="text-lg font-medium text-gray-800">{formatDateRange()}</h2>
                                <button
                                    onClick={() => handleDateNavigation('next')}
                                    className="p-2 rounded-full hover:bg-gray-100"
                                    title="Siguiente"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                                <button
                                    onClick={() => setCurrentDate(new Date())}
                                    className="ml-2 px-3 py-1 text-sm text-raspberry-700 hover:bg-raspberry-50 rounded-md"
                                    title="Hoy"
                                >
                                    Hoy
                                </button>
                            </div>

                            <div className="flex space-x-2 w-full sm:w-auto">
                                <div className="flex border rounded-md overflow-hidden">
                                    <button
                                        onClick={() => setViewMode('week')}
                                        className={`px-3 py-1 text-sm ${
                                            viewMode === 'week'
                                                ? 'bg-raspberry-100 text-raspberry-700'
                                                : 'bg-white text-gray-700 hover:bg-gray-50'
                                        }`}
                                    >
                                        Semana
                                    </button>
                                    <button
                                        onClick={() => setViewMode('month')}
                                        className={`px-3 py-1 text-sm ${
                                            viewMode === 'month'
                                                ? 'bg-raspberry-100 text-raspberry-700'
                                                : 'bg-white text-gray-700 hover:bg-gray-50'
                                        }`}
                                    >
                                        Mes
                                    </button>
                                </div>

                                <button
                                    onClick={() => {
                                        setSelectedEvent(null);
                                        setIsFormOpen(true);
                                    }}
                                    className="flex items-center px-3 py-1 text-sm text-white bg-raspberry-700 rounded-md hover:bg-raspberry-800 transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    Nuevo Evento
                                </button>
                            </div>
                        </div>

                        {/* Área de visualización del calendario/eventos */}
                        {renderCalendarView()}
                    </div>
                )}

                {/* Modal de formulario de evento */}
                {isFormOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                            <div className="px-6 py-4 border-b border-gray-200 bg-raspberry-50">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-medium text-raspberry-800">
                                        {selectedEvent ? 'Editar Evento' : 'Nuevo Evento'}
                                    </h3>
                                    <button
                                        onClick={() => {
                                            setIsFormOpen(false);
                                            setSelectedEvent(null);
                                        }}
                                        className="text-gray-400 hover:text-gray-500"
                                    >
                                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                            <div className="px-6 py-4">
                                <EventForm
                                    event={selectedEvent || undefined}
                                    onSubmit={selectedEvent ? handleUpdateEvent : handleCreateEvent}
                                    onCancel={() => {
                                        setIsFormOpen(false);
                                        setSelectedEvent(null);
                                    }}
                                    pacientes={pacientes}
                                    medicos={medicos}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Modal de confirmación de eliminación */}
                {isConfirmDeleteOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                            <div className="px-6 py-4 border-b border-gray-200">
                                <h3 className="text-lg font-medium text-gray-900">Confirmar eliminación</h3>
                            </div>
                            <div className="px-6 py-4">
                                <p className="text-gray-700">¿Estás seguro de que deseas eliminar este evento? Esta acción no se puede deshacer.</p>
                            </div>
                            <div className="px-6 py-4 bg-gray-50 flex justify-end space-x-3">
                                <button
                                    onClick={() => setIsConfirmDeleteOpen(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleDeleteEvent}
                                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md shadow-sm hover:bg-red-700"
                                >
                                    Eliminar
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AuthContext.Provider>
    );
};

export default GoogleCalendarIntegration;