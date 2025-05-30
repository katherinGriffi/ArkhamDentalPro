// src/pages/HomePage.tsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import MolarIcon from '../components/ui/MolarIcon';
import { toast } from 'react-hot-toast';

// Importa los componentes necesarios de react-router-dom
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';

// Importa los iconos de lucide-react (asegúrate de que estén instalados)
import { LogOut, Stethoscope, ClipboardList, Menu, X, DollarSign, Users, CalendarDays, BarChart4 } from 'lucide-react';

interface User {
    id: string;
    nombre: string;
    apellido?: string;
    email?: string;
}

interface HomePageProps {
    user: User | null;
    session: any;
}

export default function HomePage({ user, session }: HomePageProps) {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    // Effect to update time every minute
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 60000); // Update every minute
        return () => clearInterval(timer);
    }, []);

    // Effect to handle redirection if no session
    useEffect(() => {
        if (!session) {
            navigate('/login', { replace: true });
        }
    }, [session, navigate]);

    // Manejador de cierre de sesión
    const handleLogout = async () => {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            toast.success('Sesión cerrada exitosamente.');
            navigate('/login'); // Redirige a la página de login
        } catch (error) {
            console.error('Error signing out:', error);
            toast.error('Error al cerrar sesión.');
        }
    };

    // Show loading spinner if user data is not yet available
    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-raspberry-50">
                <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-raspberry-700"></div>
                <p className="ml-4 text-lg font-semibold text-raspberry-700">Cargando datos de usuario...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-raspberry-50 font-sans antialiased">
            {/* Main Navigation Bar */}
            <nav className="bg-gradient-to-r from-raspberry-700 to-raspberry-900 shadow-2xl sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        {/* Logo and Clinic Name */}
                        <div className="flex items-center flex-shrink-0">
                            <NavLink to="/caja" className="flex items-center group">
                                <div className="p-1.5 bg-raspberry-600 rounded-full shadow-md transition-all duration-300 group-hover:scale-110 group-hover:ring-2 group-hover:ring-white group-hover:ring-opacity-50">
                                    <MolarIcon className="h-8 w-8 text-white" />
                                </div>
                                <span className="ml-1 text-xl font-bold text-white tracking-wide hidden md:block">Andrew's Dental Group</span>
                                <span className="ml-1 text-xl font-bold text-white md:hidden">Andrew's</span>
                            </NavLink>
                        </div>

                        {/* Desktop Navigation Menu (Tabs) */}
                        <div className="hidden md:flex flex-1 justify-center items-center space-x-4 lg:space-x-6 mx-8">
                        <NavLink
                                to="/citas" // Assuming a /citas route
                                className={({ isActive }) =>
                                    `px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 whitespace-nowrap
                                    flex items-center justify-center
                                    ${isActive
                                        ? 'bg-white text-raspberry-700 shadow-md font-bold'
                                        : 'text-white hover:bg-white hover:bg-opacity-20'
                                    }`
                                }
                            >
                                <CalendarDays className="w-4 h-4 mr-2" /> Citas
                            </NavLink>
                            <NavLink
                                to="/pacientes"
                                className={({ isActive }) =>
                                    `px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 whitespace-nowrap
                                    flex items-center justify-center
                                    ${isActive
                                        ? 'bg-white text-raspberry-700 shadow-md font-bold'
                                        : 'text-white hover:bg-white hover:bg-opacity-20'
                                    }`
                                }
                            >
                                <Users className="w-4 h-4 mr-2" /> Pacientes
                            </NavLink>
                            <NavLink
                                to="/historial-clinico"
                                className={({ isActive }) => {
                                    const isHistorialActive = location.pathname.startsWith('/historial-clinico');
                                    return `px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 whitespace-nowrap
                                        flex items-center justify-center
                                        ${isHistorialActive
                                            ? 'bg-white text-raspberry-700 shadow-md font-bold'
                                            : 'text-white hover:bg-white hover:bg-opacity-20'
                                        }`;
                                }}
                            >
                                <ClipboardList className="w-4 h-4 mr-2" /> Historial Clínico
                            </NavLink>
                            <NavLink
                                to="/doctores"
                                className={({ isActive }) =>
                                    `px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 whitespace-nowrap
                                    flex items-center justify-center
                                    ${isActive
                                        ? 'bg-white text-raspberry-700 shadow-md font-bold'
                                        : 'text-white hover:bg-white hover:bg-opacity-20'
                                    }`
                                }
                            >
                                <Stethoscope className="w-4 h-4 mr-2" /> Doctores
                            </NavLink>
                            <NavLink
                                to="/caja"
                                className={({ isActive }) =>
                                    `px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 whitespace-nowrap
                                    flex items-center justify-center
                                    ${isActive || location.pathname === '/' // Also active for root
                                        ? 'bg-white text-raspberry-700 shadow-md font-bold' // ACTIVE: White background, raspberry text, bold, shadow
                                        : 'text-white hover:bg-white hover:bg-opacity-20' // INACTIVE: White text, subtle white overlay on hover
                                    }`
                                }
                            >
                                <DollarSign className="w-4 h-4 mr-2" /> Caja
                            </NavLink>
                                                       
                            
                            {/* Example of new links for further consistency */}
                            
                            <NavLink
                                to="/reportes" // Assuming a /reportes route
                                className={({ isActive }) =>
                                    `px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 whitespace-nowrap
                                    flex items-center justify-center
                                    ${isActive
                                        ? 'bg-white text-raspberry-700 shadow-md font-bold'
                                        : 'text-white hover:bg-white hover:bg-opacity-20'
                                    }`
                                }
                            >
                                <BarChart4 className="w-4 h-4 mr-2" /> Reportes
                            </NavLink>
                        </div>

                        {/* User Info and Logout Button (Desktop) */}
                        <div className="hidden md:flex items-center space-x-4 lg:space-x-6 text-white ml-auto flex-shrink-0">
                            <div className="text-right flex flex-col items-end">
                                <p className="text-sm font-medium whitespace-nowrap">Bienvenido!! <span className="font-semibold">{user?.nombre} {user?.apellido}</span></p>
                                <p className="text-xs text-raspberry-50 whitespace-nowrap">
                                    {new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })} · {currentTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-1 px-4 py-2 text-sm font-bold text-raspberry-700 bg-white rounded-md hover:bg-raspberry-100 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-raspberry-700 transform hover:scale-105 shadow-md"
                            >
                                <LogOut className="w-4 h-4" />
                                Cerrar Sesión
                            </button>
                        </div>

                        {/* Mobile Menu Button (Hamburger) */}
                        <div className="flex md:hidden items-center flex-shrink-0">
                            <button
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="inline-flex items-center justify-center p-2 rounded-md text-white hover:text-raspberry-50 hover:bg-raspberry-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                                aria-expanded={isMobileMenuOpen ? "true" : "false"}
                                aria-label="Abrir menú principal"
                            >
                                <span className="sr-only">Abrir menú principal</span>
                                {isMobileMenuOpen ? (
                                    <X className="block h-6 w-6" aria-hidden="true" />
                                ) : (
                                    <Menu className="block h-6 w-6" aria-hidden="true" />
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu Dropdown - ADJUSTED */}
                {/* We remove fixed/absolute positioning here and let it flow as block content below the nav */}
                <div
                    className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${isMobileMenuOpen ? 'max-h-screen' : 'max-h-0'
                        } bg-raspberry-900 shadow-lg`} // Removed rounded-b-lg to avoid breaking animation
                >
                    <div className="pt-2 pb-4 space-y-2 px-4"> {/* Increased pb-4 for more padding */}
                        {/* User info on mobile */}
                        <div className="text-white text-sm py-2 border-b border-raspberry-800 mb-2">
                            <p className="font-semibold">{user?.nombre} {user?.apellido}</p>
                            <p className="text-xs text-raspberry-50">{currentTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                        {/* Mobile Navigation with NavLink */}
                        <nav className="flex flex-col space-y-1">
                        <NavLink
                                to="/citas" // New example link
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={({ isActive }) =>
                                    `w-full text-left text-sm px-4 py-3 rounded-md transition-colors duration-200 flex items-center font-medium
                                        ${isActive
                                        ? 'bg-raspberry-700 text-white shadow-inner'
                                        : 'text-white hover:bg-raspberry-800'}`
                                }
                            >
                                <CalendarDays className="w-4 h-4 mr-2" /> Citas
                            </NavLink>
                            
                            <NavLink
                                to="/pacientes"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={({ isActive }) =>
                                    `w-full text-left text-sm px-4 py-3 rounded-md transition-colors duration-200 flex items-center font-medium
                                        ${isActive
                                        ? 'bg-raspberry-700 text-white shadow-inner'
                                        : 'text-white hover:bg-raspberry-800'}`
                                }
                            >
                                <Users className="w-4 h-4 mr-2" /> Pacientes
                            </NavLink>
                            
                            <NavLink
                                to="/historial-clinico"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={() => {
                                    const isHistorialActive = location.pathname.startsWith('/historial-clinico');
                                    return `w-full text-left text-sm px-4 py-3 rounded-md transition-colors duration-200 flex items-center font-medium
                                            ${isHistorialActive
                                            ? 'bg-raspberry-700 text-white shadow-inner'
                                            : 'text-white hover:bg-raspberry-800'}`;
                                }}
                            >
                                <ClipboardList className="w-4 h-4 mr-2" /> Historial Clínico
                            </NavLink>
                            <NavLink
                                to="/doctores"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={({ isActive }) =>
                                    `w-full text-left text-sm px-4 py-3 rounded-md transition-colors duration-200 flex items-center font-medium
                                        ${isActive
                                        ? 'bg-raspberry-700 text-white shadow-inner'
                                        : 'text-white hover:bg-raspberry-800'}`
                                }
                            >
                                <Stethoscope className="w-4 h-4 mr-2" /> Doctores
                            </NavLink>
                            <NavLink
                                to="/caja"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={({ isActive }) =>
                                    `w-full text-left text-sm px-4 py-3 rounded-md transition-colors duration-200 flex items-center font-medium
                                        ${isActive || location.pathname === '/' // Also active for root
                                        ? 'bg-raspberry-700 text-white shadow-inner' // Active state for mobile
                                        : 'text-white hover:bg-raspberry-800'}`
                                }
                            >
                                <DollarSign className="w-4 h-4 mr-2" /> Caja
                            </NavLink>
                            
                            <NavLink
                                to="/reportes" // New example link
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={({ isActive }) =>
                                    `w-full text-left text-sm px-4 py-3 rounded-md transition-colors duration-200 flex items-center font-medium
                                        ${isActive
                                        ? 'bg-raspberry-700 text-white shadow-inner'
                                        : 'text-white hover:bg-raspberry-800'}`
                                }
                            >
                                <BarChart4 className="w-4 h-4 mr-2" /> Reportes
                            </NavLink>
                        </nav>
                        {/* Mobile Logout Button */}
                        <button
                            onClick={handleLogout}
                            className="w-full mt-4 px-4 py-3 text-sm font-bold text-raspberry-700 rounded-md bg-white hover:bg-raspberry-100 transition-colors duration-300 shadow-md flex items-center justify-center"
                        >
                            <LogOut className="w-4 h-4 mr-2" /> Cerrar Sesión
                        </button>
                    </div>
                </div>
            </nav>

            {/* Main content that will change with nested routes */}
            <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex-grow w-full">
                <Outlet />
            </main>

            {/* Footer */}
            <footer className="bg-gray-100 text-gray-600 text-center p-4 text-xs mt-auto">
                © {new Date().getFullYear()} Arkham Tech. Todos los derechos reservados.
            </footer>
        </div>
    );
}