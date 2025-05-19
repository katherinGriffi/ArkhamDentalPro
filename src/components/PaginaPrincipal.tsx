import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { MolarIcon } from './MolarIcon';
import { MiCaja } from './MiCaja';
import { GestionPaciente } from './GestionPaciente';
import GestionDoctores from './GestionDoctores';

const colorPrimary = '#801461';

interface UserData {
  id: string;
  nombre: string;
  apellido: string;
  role?: string;
}

export function PaginaPrincipal() {
  const [activeTab, setActiveTab] = useState('caja');
  const [userId, setUserId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      window.location.href = '/';
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  useEffect(() => {
    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (session?.user) {
          setUserId(session.user.id);
          // Fetch user data
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          if (userError) throw userError;
          setUserData(userData);
        }
      } catch (error) {
        console.error('Error al obtener la sesión:', error);
      } finally {
        setIsLoading(false);
      }
    };

    getSession();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#801461]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <MolarIcon className="h-8 w-8" stroke={colorPrimary} />
                <span className="ml-2 text-xl font-bold text-gray-900">Andrew's Dental Group</span>
              </div>
            </div>
            <div className="flex items-center">
              <div className="text-gray-700 text-sm mr-4">
                <p className="font-medium">
                  Bienvenido, {userData?.nombre} {userData?.apellido}
                </p>
                <p className="text-gray-500">
                  {currentTime.toLocaleTimeString('es-ES', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="ml-4 px-4 py-2 text-sm font-medium text-white rounded-md"
                style={{ backgroundColor: colorPrimary }}
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('caja')}
                className={`${
                  activeTab === 'caja'
                    ? 'border-[#801461] text-[#801461]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Caja
              </button>
              <button
                onClick={() => setActiveTab('pacientes')}
                className={`${
                  activeTab === 'pacientes'
                    ? 'border-[#801461] text-[#801461]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Pacientes
              </button>
              <button
                onClick={() => setActiveTab('doctores')}
                className={`${
                  activeTab === 'doctores'
                    ? 'border-[#801461] text-[#801461]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Doctores
              </button>
            </nav>
          </div>

          <div className="mt-6">
            {activeTab === 'caja' && <MiCaja userId={userId} />}
            {activeTab === 'pacientes' && <GestionPaciente activeTab={activeTab} />}
            {activeTab === 'doctores' && <GestionDoctores activeTab={activeTab} />}
          </div>
        </div>
      </div>
    </div>
  );
} 