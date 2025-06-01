import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import Odontograma from './components/Odontograma';
import ManageHistoryEntryForm from './components/ManageHistoryEntryForm';

// --- Interfaces ---
interface PatientDetails {
  id: string;
  dni?: string;
  nombres: string;
  apellido_paterno: string;
  apellido_materno?: string;
  fecha_nacimiento?: string;
  celular?: string;
  telefono_fijo?: string;
  correo?: string;
  direccion?: string;
  ciudad?: string;
  distrito?: string;
  grupo_sanguineo?: string;
  alergias?: string;
  enfermedades_cronicas?: string;
  medicamentos_actuales?: string;
  seguro_medico?: string;
  estado_civil?: string;
  ocupacion?: string;
  referencia?: string;
  historial_dental?: string;
  activo: boolean;
  sexo?: 'M' | 'F' | 'O' | null;
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

interface Radiografia {
  id: string;
  paciente_id: string;
  url: string;
  file_name: string;
  fecha_radiografia: string;
  observaciones: string;
  fecha_subida: string;
  created_at: string;
}

interface HistorialEntry {
  id: string;
  created_at: string;
  paciente_id: string;
  doctor_id: string | null;
  fecha_consulta: string;
  motivo_consulta: string | null;
  diagnostico: string | null;
  tratamiento_realizado: string | null;
  observaciones: string | null;
  examen_intrabucal: string | null;
  plan_tratamiento: string | null;
  proxima_cita_sugerida: string | null;
  recordatorios_especiales: string | null;
  //odontograma_data: OdontogramData | null;

  medicos?: { nombre: string } | null;
  categoria_servico?: {
    id: string;
    nombre_categoria: string;
    nombre_servicio: string;
    descripcion: string;
    precio_medio_pen: number;
  } | null;
}

interface OdontogramRecord {
  id: string;
  patient_id: string;
  odontogram_data: any;
  record_date: string;
  notes?: string;
  created_at: string;
}

const colors = {
  raspberry50: 'bg-raspberry-50',
  raspberry100: 'bg-raspberry-100',
  raspberry500: 'bg-raspberry-500',
  raspberry700: 'bg-raspberry-700',
  raspberry900: 'bg-raspberry-900',
  raspberry200: 'bg-raspberry-200',
  textRaspberry700: 'text-raspberry-700',
  textRaspberry500: 'text-raspberry-500',
  textRaspberry900: 'text-raspberry-900',
  borderRaspberry100: 'border-raspberry-100',
  focusRaspberry500: 'focus:border-raspberry-500 focus:ring-raspberry-500',
  bgRaspberryLight: 'bg-[#F0E6ED]',
  textRed800: 'text-red-800',
  bgRed100: 'bg-red-100',
  textGreen800: 'text-green-800',
  bgGreen100: 'bg-green-100',
  textGray700: 'text-gray-700',
  textGray900: 'text-gray-900',
  borderGray300: 'border-gray-300',
};

const getAvatar = useCallback((s: 'M' | 'F' | 'O' | null | undefined) => {
  switch (s) {
    case 'F': return "/avatars/female.png";
    case 'M': return "/avatars/male.png";
    default: return "/avatars/neutral.png";
  }
}, []);

const calculateAge = (dob: string): number | null => {
  if (!dob) return null;
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

const PatientClinicalHistoryPage: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const [patient, setPatient] = useState<PatientDetails | null>(null);
  const [historyEntries, setHistoryEntries] = useState<HistorialEntry[]>([]);
  const [odontogramRecords, setOdontogramRecords] = useState<OdontogramRecord[]>([]);
  const [radiografias, setRadiografias] = useState<Radiografia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isManageHistoryModalOpen, setIsManageHistoryModalOpen] = useState(false);
  const [selectedHistoryEntry, setSelectedHistoryEntry] = useState<HistorialEntry | null>(null);

  const [newRadiografiaFiles, setNewRadiografiaFiles] = useState<File[]>([]);
  const [newRadiografiaDetails, setNewRadiografiaDetails] = useState<{ [fileName: string]: { fecha: string, observaciones: string } }>({});
  const [uploadingRadiografias, setUploadingRadiografias] = useState(false);
  const [isUploadFormOpen, setIsUploadFormOpen] = useState(false); // State to control upload form visibility

  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);
  const [expandedOdontogramId, setExpandedOdontogramId] = useState<string | null>(null);

  const navigate = useNavigate();

  const handleClosePatient = () => {
    navigate('/historial-clinico');
  };

  // --- Data Fetching ---
  const fetchData = useCallback(async () => {
    if (!patientId) {
      setError('ID do paciente não fornecido na URL.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Fetch Patient Details
      const { data: patientData, error: patientError } = await supabase
        .from('pacientes')
        .select(`id, dni, nombres, apellido_paterno, apellido_materno, fecha_nacimiento, sexo,
                 grupo_sanguineo, alergias, enfermedades_cronicas, medicamentos_actuales,
                 celular, telefono_fijo, correo, direccion, ciudad, distrito, seguro_medico,
                 estado_civil, ocupacion, referencia, historial_dental, activo`)
        .eq('id', patientId)
        .single();
      if (patientError) throw patientError;
      setPatient(patientData as PatientDetails);

      // 2. Fetch Clinical History Entries
      const { data: historyData, error: historyError } = await supabase
        .from('historial_clinico')
        .select(`
          *,
          medicos ( nombre ),
          categoria_servico:servicios_dentales ( nombre_categoria )
        `)
        .eq('paciente_id', patientId)
        .order('fecha_consulta', { ascending: false });
      if (historyError) throw historyError;
      setHistoryEntries(historyData as HistorialEntry[] || []);

      // 3. Fetch Patient Radiographs from 'paciente_radiografias' table
      const { data: radiografiasData, error: radiografiasError } = await supabase
        .from('paciente_radiografias')
        .select('*')
        .eq('paciente_id', patientId)
        .order('fecha_subida', { ascending: false });

      if (radiografiasError) {
        // --- RLS Logging Enhancement ---
        console.error('RLS Error fetching radiografias:', radiografiasError);
        toast.error(`Erro RLS ao carregar radiografias: ${radiografiasError.message}. Verifique as políticas de segurança.`);
        const { data: userData } = await supabase.auth.getUser();
        console.log('Current authenticated user UID (for RLS context):', userData.user?.id);
        console.log('Attempted patientId for fetch:', patientId);
        // -----------------------------
        setRadiografias([]); // Ensure no data is displayed on error
      } else {
        setRadiografias(radiografiasData as Radiografia[] || []);
        console.log('Radiografias fetched successfully:', radiografiasData);
      }

      // 4. Fetch Separate Odontogram Records
      const { data: odontogramData, error: odontogramError } = await supabase
        .from('pacientes_odontogramas')
        .select('*')
        .eq('patient_id', patientId)
        .order('record_date', { ascending: false });
      if (odontogramError) {
        console.warn("Could not fetch separate odontogram records, table might not exist or be empty.", odontogramError);
        setOdontogramRecords([]);
      } else {
        setOdontogramRecords(odontogramData as OdontogramRecord[] || []);
      }

    } catch (err: any) {
      console.error('Error general fetching data:', err);
      setError(`Erro ao carregar dados: ${err.message}`);
      toast.error(`Erro ao carregar dados: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- Radiograph Upload Logic ---
  const handleNewRadiografiaFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setNewRadiografiaFiles(files);
      const initialDetails = files.reduce((acc, file) => {
        acc[file.name] = { fecha: new Date().toISOString().split('T')[0], observaciones: '' };
        return acc;
      }, {} as { [fileName: string]: { fecha: string, observaciones: string } });
      setNewRadiografiaDetails(initialDetails);
    }
  };

  const handleNewRadiografiaDetailChange = (fileName: string, field: 'fecha' | 'observaciones', value: string) => {
    setNewRadiografiaDetails(prev => ({
      ...prev,
      [fileName]: {
        ...prev[fileName],
        [field]: value,
      },
    }));
  };

  const handleRemoveNewRadiografiaFile = (fileToRemove: File) => {
    setNewRadiografiaFiles(prev => prev.filter(file => file.name !== fileToRemove.name));
    setNewRadiografiaDetails(prev => {
      const newState = { ...prev };
      delete newState[fileToRemove.name];
      return newState;
    });
  };

  const handleUploadRadiografias = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newRadiografiaFiles.length === 0) {
      toast.error('Nenhum arquivo selecionado para upload.');
      return;
    }

    setUploadingRadiografias(true);
    let successCount = 0;
    let failCount = 0;

    try {
      for (const file of newRadiografiaFiles) {
        const fileExt = file.name.split('.').pop();
        // IMPORTANT: The path `radiografias/${patientId}/...` must match your Storage RLS policies
        // AND the DB RLS policy for the `url` column's folder extraction (`storage.foldername(url)`)
        // If your DB RLS expects `auth.uid()` as the folder, and patientId is not auth.uid(), this will fail.
        // Assuming your DB RLS is now checking `paciente_id` directly, or that `patientId` *is* the user's UID.
        const filePathInStorage = `radiografias/${patientId}/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('archivos_pacientes') // Your bucket name
          .upload(filePathInStorage, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) {
          console.error(`Error uploading file ${file.name} to Storage:`, uploadError);
          toast.error(`Falha ao carregar ${file.name}: ${uploadError.message}`);
          failCount++;
          continue;
        }

        const { data: publicURLData } = supabase.storage.from('archivos_pacientes').getPublicUrl(filePathInStorage);
        const publicUrl = publicURLData?.publicUrl;

        if (!publicUrl) {
          console.error(`Could not get public URL for ${filePathInStorage}`);
          toast.error(`Erro ao obter URL pública para ${file.name}.`);
          failCount++;
          continue;
        }

        const { error: insertError } = await supabase
          .from('paciente_radiografias')
          .insert({
            paciente_id: patientId,
            url: publicUrl,
            file_name: file.name,
            fecha_radiografia: newRadiografiaDetails[file.name]?.fecha || new Date().toISOString().split('T')[0],
            observaciones: newRadiografiaDetails[file.name]?.observaciones || '',
          });

        if (insertError) {
          console.error(`Erro ao registrar radiografia ${file.name} na DB:`, insertError);
          toast.error(`Falha ao registrar ${file.name} na base de dados: ${insertError.message}`);
          await supabase.storage.from('archivos_pacientes').remove([filePathInStorage]);
          failCount++;
        } else {
          successCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`${successCount} radiografía(s) cargada(s) y registrada(s) con éxito.`);
      }
      if (failCount > 0) {
        toast.error(`${failCount} radiografia(s) falhou no upload/registro.`);
      }
      setNewRadiografiaFiles([]); // Clear selected files
      setNewRadiografiaDetails({}); // Clear details
      setIsUploadFormOpen(false); // Close the upload form after successful upload
      fetchData(); // Re-fetch all data to update the display
    } catch (err: any) {
      console.error('Error general en el proceso de carga de radiografías.', err);
      toast.error(`Error inesperado al cargar radiografías.: ${err.message}`);
    } finally {
      setUploadingRadiografias(false);
    }
  };

  const handleDeleteRadiografia = async (radiografiaId: string, url: string) => {
    if (!window.confirm('¿Está seguro de que desea eliminar esta radiografía? Esta acción es irreversible.')) return;
    setLoading(true);
    try {
      // Extract the path from the URL for Supabase storage removal
      // This assumes URLs are consistent and contain '/public/YOUR_BUCKET_NAME/'
      const urlParts = url.split('/public/');
      const filePathInStorage = urlParts.length > 1 ? urlParts[1].substring(urlParts[1].indexOf('/') + 1) : null; // Get path after bucket name

      if (!filePathInStorage) {
        console.error("Could not parse storage path from URL for deletion:", url);
        toast.error("No fue posible determinar la ruta del archivo en el almacenamiento para su eliminación.");
        setLoading(false);
        return;
      }

      // 1. Delete from Supabase Storage
      const { error: storageError } = await supabase.storage
        .from('archivos_pacientes')
        .remove([filePathInStorage]);

      if (storageError) {
        console.warn(`Erro ao excluir arquivo do Storage (${filePathInStorage}): ${storageError.message}. Prosseguindo com a exclusão da DB.`);
      }

      // 2. Delete from paciente_radiografias table
      const { error: dbError } = await supabase
        .from('paciente_radiografias')
        .delete()
        .eq('id', radiografiaId);

      if (dbError) throw dbError;

      toast.success('Radiografia excluída com sucesso!');
      fetchData();
    } catch (err: any) {
      console.error('Error deleting radiografia:', err);
      toast.error(`Erro ao excluir radiografia: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // --- UI State Management for Modals ---
  const handleAddHistoryModalOpen = () => {
    setSelectedHistoryEntry(null);
    setIsManageHistoryModalOpen(true);
  };
  const handleManageHistoryModalClose = () => {
    setIsManageHistoryModalOpen(false);
    setSelectedHistoryEntry(null);
  };

  const handleEditHistoryEntry = (entry: HistorialEntry) => {
    setSelectedHistoryEntry(entry);
    setIsManageHistoryModalOpen(true);
  };

  const handleDeleteHistoryEntry = async (entryId: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta entrada do histórico?')) return;
    try {
      setLoading(true);
      const { error } = await supabase
        .from('historial_clinico')
        .delete()
        .eq('id', entryId);

      if (error) throw error;
      toast.success('Entrada do histórico excluída com sucesso!');
      fetchData();
    } catch (err: any) {
      console.error('Error deleting history entry:', err);
      toast.error(`Erro ao excluir entrada do histórico: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSavedChanges = () => {
    handleManageHistoryModalClose();
    fetchData();
  };

  // --- Render Conditional States ---
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className={`animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 ${colors.raspberry500}`}></div>
        <p className={`ml-4 ${colors.textRaspberry700}`}>Carregando...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-6 text-center text-red-600 ${colors.raspberry50} rounded-lg shadow`}>
        <p>{error}</p>
        <Link to="/historial-clinico" className={`text-sm ${colors.textRaspberry700} hover:underline mt-2 inline-block`}>
          Voltar para a seleção de pacientes
        </Link>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className={`p-6 text-center text-gray-600 ${colors.raspberry50} rounded-lg shadow`}>
        <p>Paciente não encontrado ou ID inválido.</p>
        <Link to="/historial-clinico" className={`text-sm ${colors.textRaspberry700} hover:underline mt-2 inline-block`}>
          Voltar para a seleção de pacientes
        </Link>
      </div>
    );
  }

  const getFileIcon = (url: string) => {
    const fileExt = url.split('.').pop()?.toLowerCase();
    const baseUrl = import.meta.env.BASE_URL || '/';
    switch (fileExt) {
      case 'pdf': return `${baseUrl}icons/pdf-icon.png`; // Placeholder for PDF icon
      case 'doc':
      case 'docx': return `${baseUrl}icons/doc-icon.png`; // Placeholder for DOC icon
      // Add more cases for other file types if needed
      default: return `${baseUrl}icons/file-icon.png`; // Generic file icon
    }
  };

  const isImageFile = (url: string) => {
    const fileExt = url.split('.').pop()?.toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(fileExt || '');
  };

  return (
    <div className={`container mx-auto p-0 sm:p-4 bg-raspberry-50 min-h-screen font-sans`}>
      {/* Header and Patient Details */}
      <div className={`sticky top-0 z-10 bg-gradient-to-br from-raspberry-700 to-raspberry-900 text-white shadow-xl rounded-b-xl overflow-hidden mb-6`}>
        <div className="p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <div className="flex items-center space-x-4 mb-4 sm:mb-0">
            <img
              src={getAvatar(patient.sexo)}
              alt="Avatar del paciente"
              className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md flex-shrink-0"
            />
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight">
                {patient.nombres} {patient.apellido_paterno} {patient.apellido_materno}
              </h1>
              <p className="text-lg opacity-90 mt-1">DNI: {patient.dni || 'N/A'}</p>
              {patient.fecha_nacimiento && (
                <p className="text-md opacity-80">
                  {calculateAge(patient.fecha_nacimiento)} años
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
            <button
              onClick={handleAddHistoryModalOpen}
              className={`w-full sm:w-auto px-5 py-2.5 text-sm font-semibold ${colors.textRaspberry700} rounded-lg bg-white hover:${colors.bgRaspberryLight} transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-raspberry-700 focus:ring-white transform hover:scale-105 shadow-md flex items-center justify-center`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Adicionar Entrada
            </button>
            <button
              onClick={handleClosePatient}
              className={`w-full sm:w-auto px-5 py-2.5 text-sm font-semibold text-white rounded-lg bg-raspberry-500 hover:bg-raspberry-700 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-raspberry-700 focus:ring-white transform hover:scale-105 shadow-md flex items-center justify-center`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Cerrar Paciente
            </button>
          </div>
        </div>

        {/* Important Medical Info */}
        <div className="bg-white/10 backdrop-blur-sm p-4 sm:p-6 border-t border-white/20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm font-medium">
          {patient.grupo_sanguineo && (<div className="flex items-center"><span className="text-red-300 mr-2">&#x25CF;</span><span>**Tipo Sanguíneo:** {patient.grupo_sanguineo}</span></div>)}
          {patient.alergias && (<div className="flex items-center text-yellow-100"><span className="text-yellow-300 mr-2">&#x25CF;</span><span>**Alergias:** {patient.alergias}</span></div>)}
          {patient.enfermedades_cronicas && (<div className="flex items-center text-blue-100"><span className="text-blue-300 mr-2">&#x25CF;</span><span>**Enfermedades Crónicas:** {patient.enfermedades_cronicas}</span></div>)}
          {patient.medicamentos_actuales && (<div className="flex items-center text-green-100"><span className="text-green-300 mr-2">&#x25CF;</span><span>**Medicamentos Actuales:** {patient.medicamentos_actuales}</span></div>)}
          {(!patient.grupo_sanguineo && !patient.alergias && !patient.enfermedades_cronicas && !patient.medicamentos_actuales) && (
            <div className="col-span-full text-center text-white/70">No hay información médica crítica registrada para este paciente.</div>
          )}
        </div>
      </div>

      {/* --- Main Content: Stacked Blocks --- */}
      {/* Consultation History */}
      <div className={`bg-white shadow-xl rounded-lg border ${colors.borderRaspberry100} p-4 mb-6`}>
        <h2 className={`text-2xl font-bold mb-5 ${colors.textRaspberry700}`}>Historial de Consultas</h2>
        {historyEntries.length === 0 ? (
          <div className={`p-10 text-center text-gray-500 ${colors.raspberry50} rounded-lg border ${colors.borderRaspberry100}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className={`mx-auto h-12 w-12 ${colors.textRaspberry500} mb-2`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Nenhuma entrada no historial de consultas para este paciente.
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {historyEntries.map((entry) => (
              <li key={entry.id} className={`transition-colors duration-150 hover:${colors.raspberry50} p-4`}>
                <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpandedHistoryId(expandedHistoryId === entry.id ? null : entry.id)}>
                  <p className={`text-sm font-medium ${colors.textRaspberry700} truncate`}>
                    Consulta: {new Date(entry.fecha_consulta).toLocaleDateString('es-ES')}
                  </p>
                  <div className="ml-2 flex-shrink-0 flex space-x-2">
                    <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${colors.raspberry100} ${colors.textRaspberry900}`}>
                      {entry.medicos?.nombre || 'Médico não especificado'}
                    </p>
                    <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${colors.raspberry200} ${colors.textRaspberry900}`}>
                      {entry.categoria_servico?.nombre_categoria || 'Categoria não especificada'}
                    </p>

                    <button
                      onClick={(e) => { e.stopPropagation(); handleEditHistoryEntry(entry); }}
                      className="text-gray-500 hover:text-blue-600"
                      title="Editar Consulta"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteHistoryEntry(entry.id); }}
                      className="text-gray-500 hover:text-red-600"
                      title="Excluir Consulta"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  <p className="truncate">Motivo: {entry.motivo_consulta || 'N/A'}</p>
                </div>

                {expandedHistoryId === entry.id && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-md">
                    <p><strong>Diagnóstico:</strong> {entry.diagnostico || '-'}</p>
                    <p><strong>Tratamento:</strong> {entry.tratamiento_realizado || '-'}</p>
                    <p><strong>Observações Gerais:</strong> {entry.observaciones || '-'}</p>
                    {entry.examen_intrabucal && <p><strong>Exame Intrabucal:</strong> {entry.examen_intrabucal}</p>}
                    {entry.plan_tratamiento && <p><strong>Plano de Tratamento:</strong> {entry.plan_tratamiento}</p>}
                    {entry.proxima_cita_sugerida && <p><strong>Próxima Cita Sugerida:</strong> {new Date(entry.proxima_cita_sugerida).toLocaleDateString('es-ES')}</p>}
                    {entry.recordatorios_especiales && <p><strong>Recordatórios Especiais:</strong> {entry.recordatorios_especiales}</p>}
                   
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Historial de Radiografias/ Exámenes (DEDICATED SECTION - IMPROVED UI/UX) */}
      <div className={`bg-white shadow-xl rounded-lg border ${colors.borderRaspberry100} p-4 mb-6`}>
        <div className="flex justify-between items-center mb-5">
          <h2 className={`text-2xl font-bold ${colors.textRaspberry700}`}>Historial de Radiografias/ Exámenes</h2>
          <button
            onClick={() => setIsUploadFormOpen(!isUploadFormOpen)}
            className={`px-4 py-2 text-sm font-semibold text-white rounded-lg transition-all duration-300
              ${isUploadFormOpen ? 'bg-gray-500 hover:bg-gray-600' : 'bg-raspberry-500 hover:bg-raspberry-700'}
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-raspberry-700 shadow-md flex items-center`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {isUploadFormOpen ? 'Cerrar Subida' : 'Adicionar Radiografias'}
          </button>
        </div>

        {/* Upload Interface for Radiographs - Collapsible */}
        <div
          className={`overflow-hidden transition-all duration-500 ease-in-out ${
            isUploadFormOpen ? 'max-h-screen opacity-100 mb-6' : 'max-h-0 opacity-0 mb-0'
          }`}
        >
          <form onSubmit={handleUploadRadiografias} className="space-y-6 p-6 border border-raspberry-200 rounded-lg bg-raspberry-50">
            <h3 className="text-xl font-bold text-raspberry-700 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-raspberry-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L20 20m-6-10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Subir Nuevas Radiografias
            </h3>

            {/* File Input with Drag-and-Drop Hint */}
            <div className="border-2 border-dashed border-raspberry-300 rounded-lg p-6 text-center hover:border-raspberry-500 transition-colors cursor-pointer relative group">
                <input
                    type="file"
                    id="radiografiaUpload"
                    multiple
                    onChange={handleNewRadiografiaFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={uploadingRadiografias || loading}
                    aria-label="Seleccionar archivo(s) de radiografía"
                />
                <div className="flex flex-col items-center justify-center space-y-2">
                    <svg className={`h-10 w-10 ${colors.textRaspberry500} group-hover:text-raspberry-700 transition-colors`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 0115.9 6L16 6a3 3 0 011 5.917m-7 0a4 4 0 01-8 0" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 13V9m0 0l3 3m-3-3l-3 3" />
                    </svg>
                    <p className={`text-md font-semibold ${colors.textRaspberry700}`}>
                        Arrastra y suelta tus archivos aquí, o <span className="text-raspberry-500 underline group-hover:text-raspberry-700">haz clic para seleccionar</span>
                    </p>
                    <p className="text-sm text-gray-500">JPG, PNG, SVG, PDF (Max. 5MB por archivo)</p>
                </div>
            </div>

            {newRadiografiaFiles.length > 0 && (
                <div className="space-y-4">
                    <p className="text-sm font-medium text-raspberry-700 border-b pb-2">Detalles de los archivos a subir ({newRadiografiaFiles.length}):</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {newRadiografiaFiles.map((file, index) => (
                            <div key={file.name} className="border p-4 rounded-md shadow-sm bg-white relative">
                                <button
                                    type="button"
                                    onClick={() => handleRemoveNewRadiografiaFile(file)}
                                    className="absolute top-2 right-2 text-gray-400 hover:text-red-600 transition-colors"
                                    disabled={uploadingRadiografias || loading}
                                    title="Remover archivo"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                                <p className="font-semibold text-raspberry-800 text-base mb-2 pr-8 truncate">{file.name}</p>
                                <div className="space-y-3">
                                    <div>
                                        <label htmlFor={`new_rad_fecha_${index}`} className="block text-xs font-medium text-gray-700 mb-1">
                                            Fecha de la Radiografía
                                        </label>
                                        <input
                                            type="date"
                                            id={`new_rad_fecha_${index}`}
                                            value={newRadiografiaDetails[file.name]?.fecha || ''}
                                            onChange={(e) => handleNewRadiografiaDetailChange(file.name, 'fecha', e.target.value)}
                                            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm ${colors.focusRaspberry500} text-sm p-2`}
                                            disabled={uploadingRadiografias || loading}
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor={`new_rad_observaciones_${index}`} className="block text-xs font-medium text-gray-700 mb-1">
                                            Observaciones
                                        </label>
                                        <textarea
                                            id={`new_rad_observaciones_${index}`}
                                            rows={2}
                                            value={newRadiografiaDetails[file.name]?.observaciones || ''}
                                            onChange={(e) => handleNewRadiografiaDetailChange(file.name, 'observaciones', e.target.value)}
                                            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm ${colors.focusRaspberry500} text-sm p-2`}
                                            disabled={uploadingRadiografias || loading}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <button
                type="submit"
                className="w-full px-5 py-3 text-base font-semibold text-white rounded-md bg-raspberry-500 hover:bg-raspberry-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-md"
                disabled={newRadiografiaFiles.length === 0 || uploadingRadiografias || loading}
            >
                {uploadingRadiografias && (
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                )}
                {uploadingRadiografias ? 'Subiendo Radiografía(s)...' : `Subir ${newRadiografiaFiles.length > 0 ? newRadiografiaFiles.length : ''} Radiografía(s)`}
            </button>
          </form>
        </div>

        {/* Display Existing Radiographs - Gallery Style */}
        {radiografias.length === 0 ? (
            <div className={`p-10 text-center text-gray-500 ${colors.raspberry50} rounded-lg border ${colors.borderRaspberry100}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className={`mx-auto h-12 w-12 ${colors.textRaspberry500} mb-2`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L20 20m-6-10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                Nenhuma radiografia registrada para este paciente.
            </div>
        ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {radiografias.map((rad) => (
                    <div key={rad.id} className="border border-gray-200 rounded-lg p-4 bg-white shadow-md flex flex-col group hover:shadow-lg transition-shadow duration-200">
                        <div className="block w-full h-48 overflow-hidden rounded-md border border-gray-300 relative bg-gray-100 flex items-center justify-center">
                            {isImageFile(rad.url) ? (
                                <img
                                    src={rad.url}
                                    alt={rad.file_name || 'Radiografía'}
                                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                    onError={(e) => { (e.target as HTMLImageElement).src = `${import.meta.env.BASE_URL}placeholders/image-placeholder.png`; }}
                                />
                            ) : (
                                <img
                                    src={getFileIcon(rad.url)}
                                    alt="File Icon"
                                    className="w-24 h-24 object-contain opacity-70"
                                />
                            )}
                            <button
                                onClick={() => window.open(rad.url, '_blank')}
                                className="absolute inset-0 bg-black bg-opacity-25 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-white text-lg font-bold"
                                title="Ver en nueva pestaña"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                            </button>
                        </div>
                        <div className="mt-3 text-sm text-gray-700 flex-grow space-y-1">
                            <p className="font-semibold text-raspberry-800 truncate">{rad.file_name}</p>
                            <p><strong className="text-gray-800">Fecha Radiografía:</strong> {new Date(rad.fecha_radiografia).toLocaleDateString('es-ES')}</p>
                            <p><strong className="text-gray-800">Subido en:</strong> {new Date(rad.fecha_subida).toLocaleDateString('es-ES')}</p>
                            {rad.observaciones && <p className="line-clamp-2"><strong>Observaciones:</strong> {rad.observaciones}</p>}
                        </div>
                        <div className="flex justify-end mt-4 flex-shrink-0">
                            <button
                                onClick={() => handleDeleteRadiografia(rad.id, rad.url)}
                                className="text-gray-500 hover:text-red-600 p-2 rounded-full transition-colors ml-2"
                                title="Eliminar Radiografía"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>

      {/* Historial de Odontogramas (Independentes - if you use this separate table) */}
      <div className={`bg-white shadow-xl rounded-lg border ${colors.borderRaspberry100} p-4 mb-6`}>
        <h2 className={`text-2xl font-bold mb-5 ${colors.textRaspberry700}`}>Historial de Odontogramas</h2>
        {odontogramRecords.length === 0 ? (
          <div className={`p-10 text-center text-gray-500 ${colors.raspberry50} rounded-lg border ${colors.borderRaspberry100}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className={`mx-auto h-12 w-12 ${colors.textRaspberry500} mb-2`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Nenhum odontograma registrado (independentemente) para este paciente.
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {odontogramRecords.map((odo) => (
              <li key={odo.id} className={`transition-colors duration-150 hover:${colors.raspberry50} p-4`}>
                <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpandedOdontogramId(expandedOdontogramId === odo.id ? null : odo.id)}>
                  <p className={`text-sm font-medium ${colors.textRaspberry700} truncate`}>
                    Odontograma: {new Date(odo.record_date).toLocaleDateString('es-ES')}
                  </p>
                  <div className="ml-2 flex-shrink-0 flex space-x-2">
                    {/* ... (buttons for editing/deleting separate odontograms) */}
                  </div>
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  <p className="truncate">Notas: {odo.notes || 'N/A'}</p>
                </div>
                {expandedOdontogramId === odo.id && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-md">
                    <h4 className={`text-sm font-medium ${colors.textRaspberry700} mb-2`}>Visualização Detalhada</h4>
                    <Odontograma initialData={odo.odontogram_data} onChange={() => {}} readOnly={true} />
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Modals */}
      {isManageHistoryModalOpen && patientId && (
        <ManageHistoryEntryForm
          patientId={patientId}
          isOpen={isManageHistoryModalOpen}
          onClose={handleManageHistoryModalClose}
          onSaved={handleSavedChanges}
          //initialEntryData={selectedHistoryEntry}
        />
      )}
    </div>
  );
};

export default PatientClinicalHistoryPage;