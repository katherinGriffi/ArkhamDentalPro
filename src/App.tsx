import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './index.css'; 
import { supabase } from './lib/supabase';
import toast, { Toaster } from 'react-hot-toast';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'moment/locale/es';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Filler } from 'chart.js';

// Import Pages and Components from new locations
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import GestionDoctores from './features/doctors/GestionDoctores';
import GestionPaciente from './features/patients/GestionPaciente';
import MiCaja from './features/cashbox/MiCaja';

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Filler);

// Define color palette (can be moved to a separate theme/config file later)
export const colors = {
  primary: {
    50: '#F5E8F2', 100: '#EBD1E5', 200: '#D7A3CB', 300: '#C374B1', 400: '#AF4697', 500: '#4E023B', 600: '#3E0230', 700: '#2F0125', 800: '#1F011A', 900: '#10000D'
  },
  secondary: {
    50: '#F8F1F6', 100: '#F1E3ED', 200: '#E3C7DB', 300: '#D5AAC9', 400: '#C78EB7', 500: '#801461', 600: '#660F4E', 700: '#4D0B3A', 800: '#330827', 900: '#1A0413'
  },
  accent: {
    50: '#FFF5E6', 100: '#FFEBCC', 200: '#FFD699', 300: '#FFC266', 400: '#FFAD33', 500: '#FF9E00'
  },
  neutral: {
    50: '#FAFAFA', 100: '#F5F5F5', 200: '#EEEEEE', 300: '#E0E0E0', 400: '#BDBDBD', 500: '#9E9E9E', 600: '#757575', 700: '#616161', 800: '#424242', 900: '#212121'
  },
  success: {
    50: '#E8F5E9', 100: '#C8E6C9', 200: '#A5D6A7', 300: '#81C784', 400: '#66BB6A', 500: '#4CAF50', 600: '#43A047', 700: '#388E3C', 800: '#2E7D32', 900: '#1B5E20'
  },
  warning: {
    50: '#FFF8E1', 100: '#FFECB3', 200: '#FFE082', 300: '#FFD54F', 400: '#FFCA28', 500: '#FFC107', 600: '#FFB300', 700: '#FFA000', 800: '#FF8F00', 900: '#FF6F00'
  },
  error: {
    50: '#FFEBEE', 100: '#FFCDD2', 200: '#EF9A9A', 300: '#E57373', 400: '#EF5350', 500: '#F44336', 600: '#E53935', 700: '#D32F2F', 800: '#C62828', 900: '#B71C1C'
  }
};

// Define User type (can be moved to types/index.ts)
export type User = {
  id: string;
  nombre: string;
  apellido: string;
  activo?: boolean;
  role?: string;
};

function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setLoading(false);
    };

    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      if (session?.user?.id) {
        try {
          const { data, error } = await supabase
            .from('users') // Assuming 'usuarios' is the table name
            .select('id, nombre, apellido, activo, role')
            .eq('id', session.user.id)
            .single();
          
          if (error) throw error;
          setCurrentUser(data as User);
        } catch (error: any) {
          console.error('Error fetching user data:', error);
          toast.error('Error al cargar datos del usuario');
          // Optionally sign out if user data cannot be fetched
          // await supabase.auth.signOut(); 
        }
      }
    };

    fetchUser();
  }, [session]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.primary[50] }}>
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4" style={{ borderColor: colors.primary[500] }}></div>
        <p className="ml-4 text-lg font-semibold" style={{ color: colors.primary[700] }}>Cargando...</p>
      </div>
    );
  }

  return (
    <Router>
      <Toaster position="top-center" reverseOrder={false} />
      <Routes>
        <Route 
          path="/login" 
          element={!session ? <LoginPage /> : <Navigate to="/" replace />}
        />
        <Route 
          path="/*" 
          element={session ? <AuthenticatedApp user={currentUser} /> : <Navigate to="/login" replace />}
        />
      </Routes>
    </Router>
  );
}

// Separate component for authenticated routes
const AuthenticatedApp: React.FC<{ user: User | null }> = ({ user }) => {
  // You might want a sidebar or layout component here
  return (
    <Routes>
      <Route path="/" element={<HomePage user={user} />} />
      <Route path="/gestion-doctores" element={<GestionDoctores />} />
      <Route path="/gestion-pacientes" element={<GestionPaciente />} />
      <Route path="/mi-caja" element={<MiCaja />} />
      {/* Add other authenticated routes here */}
      <Route path="*" element={<Navigate to="/" replace />} /> {/* Redirect unknown paths to home */}
    </Routes>
  );
};

export default App;

