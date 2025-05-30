import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './index.css'; 
import { supabase } from './lib/supabase';
import toast, { Toaster } from 'react-hot-toast';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'moment/locale/es';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Filler } from 'chart.js';

// Import Pages and Components
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage'; // HomePage is our main layout component

// Import specific feature components (ensure these paths are correct for your project)
import GestionDoctores from './pages/GestionDoctores';
import GestionPaciente from './pages/GestionPaciente';
import MiCaja from './pages/MiCaja';
import GestionCitas from './pages/GestionCitas.tsx';
import ClinicalHistoryOverviewPage from './pages/ClinicalHistoryOverviewPage';
import PatientClinicalHistoryPage from './pages/PatientClinicalHistoryPage';

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Filler);

// Define User type (consider moving this to a shared types file, e.g., 'src/types/index.ts')
export type User = {
  id: string;
  nombre: string;
  apellido: string;
  activo?: boolean;
  role?: string;
};

function App() {
  const [session, setSession] = useState<any>(null); // Use a more specific type if available (e.g., Session from @supabase/supabase-js)
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    // Fetch initial session
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setLoading(false);
    };

    getSession();

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    // Fetch user data if session exists
    const fetchUser = async () => {
      if (session?.user?.id) {
        try {
          const { data, error } = await supabase
            .from('users') // Assuming 'users' is your table name for user profiles
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
      } else {
        // If session is null or user ID is missing, clear current user
        setCurrentUser(null);
      }
    };

    fetchUser();
  }, [session]); // Depend on session to refetch user data if session changes

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-raspberry-50">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-raspberry-500"></div>
        <p className="ml-4 text-lg font-semibold text-raspberry-700">Cargando...</p>
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

        {/* Main route that uses HomePage as its layout.
          All nested routes under this will render within HomePage's <Outlet />.
          HomePage will handle the visible navigation.
        */}
        <Route 
          path="/*" // Catches all paths not explicitly defined above (like /login)
          element={session ? <HomePage user={currentUser} session={session} /> : <Navigate to="/login" replace />}
        >
          {/* Default route for the root path "/", navigates to /caja */}
          <Route index element={<Navigate to="/citas" replace />} />
          
          {/* Nested routes for each tab */}
          <Route path="citas" element={<GestionCitas user={currentUser} />} />
          
          <Route path="pacientes" element={<GestionPaciente user={currentUser} />} />
          
          

          {/* Nested routes for the clinical history section */}
          <Route path="historial-clinico">
            {/* Base path /historial-clinico will show the patient overview page */}
            <Route index element={<ClinicalHistoryOverviewPage />} />
            {/* Dynamic path /historial-clinico/:patientId will show the specific patient's history */}
            <Route path=":patientId" element={<PatientClinicalHistoryPage />} />
          </Route>
          <Route path="doctores" element={<GestionDoctores user={currentUser} />} />
          <Route path="caja" element={<MiCaja user={currentUser} />} />
          {/* Fallback route for any other unrecognized path within the authenticated layout.
              Redirects to /caja. Consider a proper NotFoundPage component for a better UX.
          */}
          <Route path="*" element={<Navigate to="/citas" replace />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;