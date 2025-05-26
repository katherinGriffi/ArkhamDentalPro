import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import MolarIcon from '../components/ui/MolarIcon';
import { Eye, EyeOff } from 'lucide-react'; // Ícones de olho

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error signing in:', error);
      const errorMessage = (error instanceof Error && error.message.includes('Invalid login credentials'))
        ? 'Credenciales inválidas. Verifique su correo y contraseña.'
        : 'Error al iniciar sesión. Intente nuevamente.';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#F0E6ED] via-white to-[#F8F5F7] p-4">
      <div className="max-w-md w-full bg-white p-8 sm:p-10 rounded-2xl shadow-2xl border border-[#E0CDD9] transform transition-all duration-500 hover:scale-[1.01]">
        <div className="flex flex-col items-center mb-8">
          <div className="p-3 bg-gradient-to-br from-[#9D1C7A] to-[#6a1152] rounded-full shadow-lg mb-4 transform transition-transform duration-300 hover:rotate-6">
            <MolarIcon className="h-16 w-16 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-center text-[#5A0D45]">
            Andrew's Dental Group
          </h1>
          <p className="mt-2 text-center text-sm text-gray-500">
            Sistema de gestión de la clínica dental
          </p>
        </div>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email-address" className="block text-sm font-medium text-[#801461] mb-1">
              Correo Electrónico
            </label>
            <input
              id="email-address"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="appearance-none relative block w-full px-4 py-3 border border-[#E0CDD9] placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B58AAD] focus:border-[#801461] sm:text-sm transition-all duration-200 shadow-sm hover:shadow-md"
              placeholder="su.correo@ejemplo.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-[#801461] mb-1">
              Contraseña
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none relative block w-full px-4 py-3 border border-[#E0CDD9] placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B58AAD] focus:border-[#801461] sm:text-sm transition-all duration-200 shadow-sm hover:shadow-md pr-12"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700 focus:outline-none"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className={`w-full flex justify-center py-3 px-4 border border-transparent text-base font-medium rounded-lg text-white bg-gradient-to-r from-[#9D1C7A] to-[#801461] hover:from-[#801461] hover:to-[#6a1152] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#801461] transition-all duration-300 transform hover:scale-[1.03] shadow-lg hover:shadow-xl ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {loading ? (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                'Iniciar Sesión'
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Rodapé */}
      <div className="mt-6 text-sm text-gray-400">
        Desarrollado por{' '}
        <a
          href="https://grupoarkham.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#801461] hover:underline font-semibold"
        >
          Arkham Tech
        </a>
      </div>
    </div>
  );
}
