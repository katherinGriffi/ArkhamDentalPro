// ManageHistoryEntryForm.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';

import Odontograma from './Odontograma';

interface ManageHistoryEntryFormProps {
  patientId: string;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  initialEntryData?: HistoryEntry | null;
}

interface Medico {
  id: string;
  nombre: string;
}

interface CategoriaServicio {
  id: string;
  nombre_categoria: string;
}

interface OdontogramData {
  [toothId: string]: {
    estado_geral?: string;
    superficies?: {
      [surface: string]: {
        estado?: string;
        material?: string;
      };
    };
    mobilidade?: string;
    notas?: string;
  };
}

// **Esta interfaz Radiografia NO se usará directamente en el formData de este componente.**
// La mantenemos si aún deseas que el historial clínico *sepa* qué radiografías existen,
// pero no las cargará ni gestionará. Podría ser un array de IDs de radiografías si quisieras
// mantener una relación, pero por ahora, la quitamos de HistoryEntry para evitar confusiones.
// interface Radiografia { /* ... */ }

// Interfaz HistoryEntry sin la propiedad 'radiografias' aquí
interface HistoryEntry {
  id?: string;
  fecha_consulta: string;
  doctor_id: string | null;
  motivo_consulta: string;
  diagnostico: string;
  tratamiento_realizado: string;
  observaciones: string;
  examen_intrabucal: string;
  plan_tratamiento: string;
  proxima_cita_sugerida: string | null;
  recordatorios_especiales: string;
  //odontograma_data?: OdontogramData | null; // Odontograma sigue aquí
  categoria_servico: string;
}

const ManageHistoryEntryForm: React.FC<ManageHistoryEntryFormProps> = ({
  patientId,
  isOpen,
  onClose,
  onSaved,
  initialEntryData,
}) => {
  const isEditing = !!initialEntryData;
  const [formData, setFormData] = useState<HistoryEntry>({
    fecha_consulta: new Date().toISOString().split('T')[0],
    doctor_id: '',
    motivo_consulta: '',
    diagnostico: '',
    tratamiento_realizado: '',
    observaciones: '',
    examen_intrabucal: '',
    plan_tratamiento: '',
    proxima_cita_sugerida: '',
    recordatorios_especiales: '',
    //odontograma_data: null,
    categoria_servico: '',
  });

  const [odontogramData, setOdontogramData] = useState<OdontogramData>({});
  const [medicos, setMedicos] = useState<Medico[]>([]);
  const [categorias, setCategorias] = useState<CategoriaServicio[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && initialEntryData) {
      setFormData({
        ...initialEntryData,
        fecha_consulta: initialEntryData.fecha_consulta.split('T')[0],
        proxima_cita_sugerida: initialEntryData.proxima_cita_sugerida || '',
        categoria_servico: initialEntryData.categoria_servico || '',
      });
      //setOdontogramData(initialEntryData.odontograma_data || {});
    } else if (isOpen && !initialEntryData) {
      setFormData({
        fecha_consulta: new Date().toISOString().split('T')[0],
        doctor_id: '',
        motivo_consulta: '',
        diagnostico: '',
        tratamiento_realizado: '',
        observaciones: '',
        examen_intrabucal: '',
        plan_tratamiento: '',
        proxima_cita_sugerida: '',
        recordatorios_especiales: '',
       // odontograma_data: null,
        categoria_servico: '',
      });
      setOdontogramData({});
    }
  }, [isOpen, initialEntryData]);

  useEffect(() => {
    const fetchMedicos = async () => {
      try {
        const { data, error } = await supabase
          .from('medicos')
          .select('id, nombre')
          .eq('activo', true)
          .order('nombre');
        if (error) throw error;
        setMedicos(data || []);
      } catch (error) {
        console.error('Error fetching doctors:', error);
        toast.error('Erro ao carregar lista de médicos.');
      }
    };
    if (isOpen) {
      fetchMedicos();
    }
  }, [isOpen]);

  useEffect(() => {
    const fetchCategorias = async () => {
      try {
        const { data, error } = await supabase
          .from('servicios_dentales')
          .select('id, nombre_categoria')
          .order('nombre_categoria');

        if (error) throw error;

        setCategorias(data || []);
      } catch (error) {
        console.error('Error fetching categories:', error);
        toast.error('Erro ao carregar categorias de servicio.');
      }
    };
    if (isOpen) {
      fetchCategorias();
    }
  }, [isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleOdontogramChange = useCallback((data: OdontogramData) => {
    setOdontogramData(data);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { medicos, ...restOfFormData } = formData; // Still destructure medicos, though not needed for DB insert

      const entryData = {
        ...restOfFormData,
        paciente_id: patientId,
        doctor_id: formData.doctor_id || null,
        proxima_cita_sugerida: formData.proxima_cita_sugerida === '' ? null : formData.proxima_cita_sugerida,
        categoria_servico: formData.categoria_servico === '' ? null : formData.categoria_servico,
      //  odontograma_data: odontogramData, // Save odontogram
      };

      let error = null;
      if (isEditing && initialEntryData?.id) {
        const { error: updateError } = await supabase
          .from('historial_clinico')
          .update(entryData)
          .eq('id', initialEntryData.id);
        error = updateError;
        if (!error) toast.success('Entrada de historial atualizada com sucesso!');
      } else {
        const { error: insertError } = await supabase.from('historial_clinico').insert([entryData]);
        error = insertError;
        if (!error) toast.success('Entrada de historial guardada com sucesso!');
      }

      if (error) throw error;

      if (!isEditing) {
        setFormData({
          fecha_consulta: new Date().toISOString().split('T')[0],
          doctor_id: '',
          motivo_consulta: '',
          diagnostico: '',
          tratamiento_realizado: '',
          observaciones: '',
          examen_intrabucal: '',
          plan_tratamiento: '',
          proxima_cita_sugerida: '',
          recordatorios_especiales: '',
          //odontograma_data: null,
          categoria_servico: '',
        });
      }
      setOdontogramData({});
      onSaved();
    } catch (error: any) {
      console.error('Error saving history entry:', error);
      toast.error(`Erro ao guardar entrada: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-raspberry-700 bg-opacity-80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[95vh] overflow-hidden flex flex-col transform transition-all duration-300 scale-100 border border-raspberry-100">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-raspberry-100 bg-gradient-to-r from-raspberry-700 to-raspberry-900 flex items-center justify-between flex-shrink-0">
          <h3 className="text-lg font-medium text-white flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {isEditing ? 'Editar Entrada do Historial Clínico' : 'Adicionar Entrada ao Historial Clínico'}
          </h3>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-white hover:text-raspberry-100 transition-colors duration-200 disabled:opacity-50"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Body - Scrollable */}
        <div className="px-6 py-4 overflow-y-auto flex-grow">
          <form onSubmit={handleSubmit} className="space-y-6" id="history-entry-form">
            {/* Top Row: Date and Doctor */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="fecha_consulta" className="block text-sm font-medium text-raspberry-700">
                  Data da Consulta *
                </label>
                <input
                  type="date"
                  id="fecha_consulta"
                  name="fecha_consulta"
                  value={formData.fecha_consulta}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-raspberry-100 shadow-sm focus:border-raspberry-500 focus:ring-raspberry-500 sm:text-sm transition-colors duration-200 p-2"
                  required
                  disabled={loading}
                />
              </div>
              <div>
                <label htmlFor="doctor_id" className="block text-sm font-medium text-raspberry-700">
                  Médico Responsável
                </label>
                <select
                  id="doctor_id"
                  name="doctor_id"
                  value={formData.doctor_id || ''}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-raspberry-100 shadow-sm focus:border-raspberry-500 focus:ring-raspberry-500 sm:text-sm transition-colors duration-200 p-2 bg-white"
                  disabled={loading}
                >
                  <option value="">Selecione um médico...</option>
                  {medicos.map(medico => (
                    <option key={medico.id} value={medico.id}>{medico.nombre}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Categoria de Serviço */}
            <div>
              <label htmlFor="categoria_servico" className="block text-sm font-medium text-raspberry-900">
                Categoria de la consulta
              </label>
              <select
                id="categoria_servico"
                name="categoria_servico"
                value={formData.categoria_servico}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-raspberry-100 shadow-sm focus:border-raspberry-500 focus:ring-raspberry-500 sm:text-sm transition-colors duration-200 p-2 bg-white"
                disabled={loading}
              >
                <option value="">Selecione uma categoria...</option>
                {categorias.map(categoria => (
                  <option key={categoria.id} value={categoria.id}>{categoria.nombre_categoria}</option>
                ))}
              </select>
            </div>

            {/* Campos de la consulta actual */}
            <div>
              <label htmlFor="motivo_consulta" className="block text-sm font-medium text-raspberry-700">
                Motivo da Consulta
              </label>
              <textarea
                id="motivo_consulta"
                name="motivo_consulta"
                rows={2}
                value={formData.motivo_consulta}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-raspberry-100 shadow-sm focus:border-raspberry-500 focus:ring-raspberry-500 sm:text-sm transition-colors duration-200 p-2"
                disabled={loading}
              />
            </div>
            <div>
              <label htmlFor="diagnostico" className="block text-sm font-medium text-raspberry-700">
                Diagnóstico
              </label>
              <textarea
                id="diagnostico"
                name="diagnostico"
                rows={3}
                value={formData.diagnostico}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-raspberry-100 shadow-sm focus:border-raspberry-500 focus:ring-raspberry-500 sm:text-sm transition-colors duration-200 p-2"
                disabled={loading}
              />
            </div>
            <div>
              <label htmlFor="tratamiento_realizado" className="block text-sm font-medium text-raspberry-700">
                Tratamento Realizado
              </label>
              <textarea
                id="tratamiento_realizado"
                name="tratamiento_realizado"
                rows={3}
                value={formData.tratamiento_realizado}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-raspberry-100 shadow-sm focus:border-raspberry-500 focus:ring-raspberry-500 sm:text-sm transition-colors duration-200 p-2"
                disabled={loading}
              />
            </div>

            {/* Nuevos campos específicos de la consulta dental */}
            <div className="space-y-4 pt-4 border-t border-raspberry-50">
              <h4 className="text-md font-semibold text-raspberry-700">Detalhes da Consulta Odontológica</h4>
              <div>
                <label htmlFor="examen_intrabucal" className="block text-sm font-medium text-raspberry-700">
                  Exame Intrabucal (Tecidos, Higiene, Oclusão)
                </label>
                <textarea
                  id="examen_intrabucal"
                  name="examen_intrabucal"
                  rows={3}
                  value={formData.examen_intrabucal}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-raspberry-100 shadow-sm focus:border-raspberry-500 focus:ring-raspberry-500 sm:text-sm transition-colors duration-200 p-2"
                  disabled={loading}
                />
              </div>
              <div>
                <label htmlFor="plan_tratamiento" className="block text-sm font-medium text-raspberry-700">
                  Plano de Tratamento Proposto
                </label>
                <textarea
                  id="plan_tratamiento"
                  name="plan_tratamiento"
                  rows={3}
                  value={formData.plan_tratamiento}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-raspberry-100 shadow-sm focus:border-raspberry-500 focus:ring-raspberry-500 sm:text-sm transition-colors duration-200 p-2"
                  disabled={loading}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="proxima_cita_sugerida" className="block text-sm font-medium text-raspberry-700">
                    Próxima Consulta Sugerida
                  </label>
                  <input
                    type="date"
                    id="proxima_cita_sugerida"
                    name="proxima_cita_sugerida"
                    value={formData.proxima_cita_sugerida || ''}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-raspberry-100 shadow-sm focus:border-raspberry-500 focus:ring-raspberry-500 sm:text-sm transition-colors duration-200 p-2"
                    disabled={loading}
                  />
                </div>
                <div>
                  <label htmlFor="recordatorios_especiales" className="block text-sm font-medium text-raspberry-700">
                    Recordatórios Especiais
                  </label>
                  <textarea
                    id="recordatorios_especiales"
                    name="recordatorios_especiales"
                    rows={1}
                    value={formData.recordatorios_especiales}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-raspberry-100 shadow-sm focus:border-raspberry-500 focus:ring-raspberry-500 sm:text-sm transition-colors duration-200 p-2"
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="observaciones" className="block text-sm font-medium text-raspberry-700">
                Observações Gerais
              </label>
              <textarea
                id="observaciones"
                name="observaciones"
                rows={3}
                value={formData.observaciones}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-raspberry-100 shadow-sm focus:border-raspberry-500 focus:ring-raspberry-500 sm:text-sm transition-colors duration-200 p-2"
                disabled={loading}
              />
            </div>

            {/* Odontogram Component */}
            <div className="pt-4 border-t border-raspberry-50">
              <h4 className="text-md font-semibold text-raspberry-700 mb-3">Odontograma</h4>
              <Odontograma
                initialData={odontogramData}
                onChange={handleOdontogramChange}
                readOnly={loading}
              />
            </div>
            {/* Removed the Radiograph upload section from here */}
          </form>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-raspberry-100 bg-gray-50 flex justify-end space-x-3 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-raspberry-700 bg-raspberry-50 rounded-md hover:bg-raspberry-100 transition-colors duration-200 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="history-entry-form"
            disabled={loading}
            className="px-6 py-2 text-sm font-medium text-white rounded-md bg-raspberry-500 hover:bg-raspberry-700 transition-all duration-300 transform hover:scale-105 shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {loading && (
              <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {loading ? 'A guardar...' : (isEditing ? 'Guardar' : 'Guardar Entrada')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ManageHistoryEntryForm;