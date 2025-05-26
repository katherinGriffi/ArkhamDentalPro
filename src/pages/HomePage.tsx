import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import MolarIcon from '../components/ui/MolarIcon';
import MiCaja from '../features/cashbox/MiCaja';
import GestionPaciente from '../features/patients/GestionPaciente';
import GestionDoctores from '../features/doctors/GestionDoctores';
import { User } from '../App';
import { LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const colorPrimary = '#801461';
const colorSecondary = '#5A0D45';

interface HomePageProps {
  user: User | null;
}

export default function HomePage({ user }: HomePageProps) {
  const [activeTab, setActiveTab] = useState('caja');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

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
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F0E6ED] via-white to-[#F8F5F7]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-[#801461]"></div>
      </div>
    );
  }

  const TabButton = ({ tabId, label, icon }: { tabId: string; label: string; icon: JSX.Element }) => (
    <button
      onClick={() => setActiveTab(tabId)}
      className={`flex items-center whitespace-nowrap py-4 px-4 sm:px-6 border-b-2 font-medium text-sm transition-all duration-300 transform hover:-translate-y-0.5 ${
        activeTab === tabId
          ? `border-[${colorPrimary}] text-[${colorPrimary}] shadow-inner bg-white`
          : `border-transparent text-gray-500 hover:text-[${colorSecondary}] hover:border-gray-300`
      }`}
    >
      {icon}
      <span className="ml-2">{label}</span>
    </button>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'caja':
        return <MiCaja user={user} />;
      case 'pacientes':
        return <GestionPaciente user={user} />;
      case 'doctores':
        return <GestionDoctores user={user} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F8F5F7] to-white">
      <nav className="bg-gradient-to-r from-[#801461] to-[#5A0D45] shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="p-1 bg-white rounded-full">
                <MolarIcon className="h-8 w-8" stroke={colorPrimary} />
              </div>
              <span className="ml-3 text-xl font-bold text-white hidden md:block">Andrew's Dental Group</span>
              <span className="ml-3 text-xl font-bold text-white md:hidden">ADG</span>
            </div>
            <div className="flex md:hidden items-center">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-white hover:text-white hover:bg-[#9D1C7A] focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              >
                <span className="sr-only">Abrir menu</span>
                {isMobileMenuOpen ? (
                  <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
            <div className="hidden md:flex items-center justify-end w-full px-6 py-2 space-x-6 text-white">
              <div className="text-right">
                <p className="text-sm font-semibold">Bienvenido!! <span className="font-normal">{user?.nombre}</span></p>
                <p className="text-xs opacity-80">
                  {new Date().toLocaleDateString('es-ES', {
                    day: '2-digit', month: 'short', year: 'numeric'
                  })} · {currentTime.toLocaleTimeString('es-ES', {
                    hour: '2-digit', minute: '2-digit'
                  })}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-[#801461] bg-white rounded-md hover:bg-[#F0E6ED] transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#801461] transform hover:scale-105 shadow-sm"
              >
                <LogOut className="w-4 h-4" />
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden bg-[#6a1152] shadow-lg rounded-b-lg absolute w-full z-30">
            <div className="pt-2 pb-3 space-y-2 px-4">
              <div className="text-white text-sm py-2 border-b border-[#9D1C7A]">
                <p className="font-medium">{user?.nombre} {user?.apellido}</p>
                <p className="text-xs opacity-80">{currentTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
              <nav className="flex flex-col space-y-1">
                <button onClick={() => { setActiveTab('caja'); setIsMobileMenuOpen(false); }} className="w-full text-left text-white text-sm px-3 py-2 rounded-md hover:bg-[#801461]">
                  💰 Caja
                </button>
                <button onClick={() => { setActiveTab('pacientes'); setIsMobileMenuOpen(false); }} className="w-full text-left text-white text-sm px-3 py-2 rounded-md hover:bg-[#801461]">
                 🧍Pacientes
                </button>
                <button onClick={() => { setActiveTab('doctores'); setIsMobileMenuOpen(false); }} className="w-full text-left text-white text-sm px-3 py-2 rounded-md hover:bg-[#801461]">
                  👨‍⚕️ Doctores
                </button>
              </nav>
              <button onClick={handleLogout} className="w-full mt-3 px-4 py-2 text-sm font-medium text-[#801461] rounded-md bg-white hover:bg-[#F0E6ED] transition-colors duration-300">
                Cerrar Sesión
              </button>
            </div>
          </div>
        )}
      </nav>

      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-xl rounded-lg overflow-hidden border border-[#E0CDD9]">
          <div className="border-b border-gray-200 bg-[#F8F5F7]">
            <div className="overflow-x-auto scrollbar-hide">
              <nav className="-mb-px flex justify-center sm:justify-start px-4">
              <TabButton tabId="caja" label="Caja" icon={<span>💰</span>} />
                <TabButton tabId="pacientes" label="Pacientes" icon={<span>🧍</span>} />
                <TabButton tabId="doctores" label="Doctores" icon={<span>👨‍⚕️</span>} />
              </nav>
            </div>
          </div>
          <div className="p-6">{renderContent()}</div>
        </div>
      </div>
    </div>
  );
}










