import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
<<<<<<< HEAD
import './index.css';
=======
import './index.css'; 
>>>>>>> 467e8c8fb733366c086c28fdfc32ed68069ed003
import { supabase } from './lib/supabase';
import toast, { Toaster } from 'react-hot-toast';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'moment/locale/es';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Filler } from 'chart.js';

// Import Pages and Components
import LoginPage from './pages/LoginPage';
<<<<<<< HEAD
import HomePage from './pages/HomePage';

// Import specific feature components
import GestionDoctores from './pages/GestionDoctores';
import GestionPaciente from './pages/GestionPaciente';
import MiCaja from './pages/MiCaja';
// Importe o AuthProvider e o GestionCitas do mesmo arquivo, já que AuthProvider é exportado de lá
import GestionCitas, { AuthProvider } from './pages/GestionCitas.tsx'; // <--- IMPORTANTE AQUI!

=======
import HomePage from './pages/HomePage'; // HomePage is our main layout component

// Import specific feature components (ensure these paths are correct for your project)
import GestionDoctores from './pages/GestionDoctores';
import GestionPaciente from './pages/GestionPaciente';
import MiCaja from './pages/MiCaja';
import GestionCitas from './pages/GestionCitas.tsx';
>>>>>>> 467e8c8fb733366c086c28fdfc32ed68069ed003
import ClinicalHistoryOverviewPage from './pages/ClinicalHistoryOverviewPage';
import PatientClinicalHistoryPage from './pages/PatientClinicalHistoryPage';

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Filler);

<<<<<<< HEAD
// Define User type
=======
// Define User type (consider moving this to a shared types file, e.g., 'src/types/index.ts')
>>>>>>> 467e8c8fb733366c086c28fdfc32ed68069ed003
export type User = {
  id: string;
  nombre: string;
  apellido: string;
  activo?: boolean;
  role?: string;
};

function App() {
<<<<<<< HEAD
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true); // Este é o loading para o Supabase Auth
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
=======
  const [session, setSession] = useState<any>(null); // Use a more specific type if available (e.g., Session from @supabase/supabase-js)
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    // Fetch initial session
>>>>>>> 467e8c8fb733366c086c28fdfc32ed68069ed003
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setLoading(false);
    };

    getSession();

<<<<<<< HEAD
=======
    // Listen for auth state changes
>>>>>>> 467e8c8fb733366c086c28fdfc32ed68069ed003
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
<<<<<<< HEAD
=======
    // Fetch user data if session exists
>>>>>>> 467e8c8fb733366c086c28fdfc32ed68069ed003
    const fetchUser = async () => {
      if (session?.user?.id) {
        try {
          const { data, error } = await supabase
<<<<<<< HEAD
            .from('users')
=======
            .from('users') // Assuming 'users' is your table name for user profiles
>>>>>>> 467e8c8fb733366c086c28fdfc32ed68069ed003
            .select('id, nombre, apellido, activo, role')
            .eq('id', session.user.id)
            .single();
          
          if (error) throw error;
          setCurrentUser(data as User);
        } catch (error: any) {
          console.error('Error fetching user data:', error);
          toast.error('Error al cargar datos del usuario');
<<<<<<< HEAD
        }
      } else {
=======
          // Optionally sign out if user data cannot be fetched
          // await supabase.auth.signOut(); 
        }
      } else {
        // If session is null or user ID is missing, clear current user
>>>>>>> 467e8c8fb733366c086c28fdfc32ed68069ed003
        setCurrentUser(null);
      }
    };

    fetchUser();
<<<<<<< HEAD
  }, [session]);

  if (loading) { // Este loading é para a inicialização do Supabase Auth
=======
  }, [session]); // Depend on session to refetch user data if session changes

  if (loading) {
>>>>>>> 467e8c8fb733366c086c28fdfc32ed68069ed003
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

<<<<<<< HEAD
        <Route 
          path="/*"
          element={session ? <HomePage user={currentUser} session={session} /> : <Navigate to="/login" replace />}
        >
          <Route index element={<Navigate to="/citas" replace />} />
          
          {/* AQUI ESTÁ A MUDANÇA MAIS IMPORTANTE: Envolva GestionCitas com AuthProvider */}
          <Route 
            path="citas" 
            element={
              <AuthProvider> {/* <-- AGORA O AuthProvider ENVOLVE O GestionCitas */}
                <GestionCitas user={currentUser} />
              </AuthProvider>
            } 
          />
          
          <Route path="pacientes" element={<GestionPaciente user={currentUser} />} />
          
          <Route path="historial-clinico">
            <Route index element={<ClinicalHistoryOverviewPage />} />
=======
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
>>>>>>> 467e8c8fb733366c086c28fdfc32ed68069ed003
            <Route path=":patientId" element={<PatientClinicalHistoryPage />} />
          </Route>
          <Route path="doctores" element={<GestionDoctores user={currentUser} />} />
          <Route path="caja" element={<MiCaja user={currentUser} />} />
<<<<<<< HEAD
          
=======
          {/* Fallback route for any other unrecognized path within the authenticated layout.
              Redirects to /caja. Consider a proper NotFoundPage component for a better UX.
          */}
>>>>>>> 467e8c8fb733366c086c28fdfc32ed68069ed003
          <Route path="*" element={<Navigate to="/citas" replace />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;