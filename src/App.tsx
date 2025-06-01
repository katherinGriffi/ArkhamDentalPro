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
import HomePage from './pages/HomePage';

// Import specific feature components
import GestionDoctores from './pages/GestionDoctores';
import GestionPaciente from './pages/GestionPaciente';
import MiCaja from './pages/MiCaja';
// Importe o AuthProvider e o GestionCitas do mesmo arquivo, já que AuthProvider é exportado de lá
import GestionCitas, { AuthProvider } from './pages/GestionCitas.tsx'; // <--- IMPORTANTE AQUI!

import ClinicalHistoryOverviewPage from './pages/ClinicalHistoryOverviewPage';
import PatientClinicalHistoryPage from './pages/PatientClinicalHistoryPage';

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Filler);

// Define User type
export type User = {
  id: string;
  nombre: string;
  apellido: string;
  activo?: boolean;
  role?: string;
};

function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true); // Este é o loading para o Supabase Auth
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
            .from('users')
            .select('id, nombre, apellido, activo, role')
            .eq('id', session.user.id)
            .single();
          
          if (error) throw error;
          setCurrentUser(data as User);
        } catch (error: any) {
          console.error('Error fetching user data:', error);
          toast.error('Error al cargar datos del usuario');
        }
      } else {
        setCurrentUser(null);
      }
    };

    fetchUser();
  }, [session]);

  if (loading) { // Este loading é para a inicialização do Supabase Auth
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
            <Route path=":patientId" element={<PatientClinicalHistoryPage />} />
          </Route>
          <Route path="doctores" element={<GestionDoctores user={currentUser} />} />
          <Route path="caja" element={<MiCaja user={currentUser} />} />
          
          <Route path="*" element={<Navigate to="/citas" replace />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;