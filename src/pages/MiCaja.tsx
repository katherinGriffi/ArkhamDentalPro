import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase'; // Ajuste o caminho conforme necessário
import { toast } from 'react-hot-toast';
import {    Chart as ChartJS,    CategoryScale,    LinearScale,    PointElement,    LineElement,    ArcElement,    Title,    Tooltip,    Legend,    Filler // Importar iller para preenchimento de área em gráficos de linha
} from 'chart.js';
import { Line, Pie } from 'react-chartjs-2';
import { RegistroCaja, TipoMovimiento, Medico, Paciente } from '../types/index';


// Registrar os componentes do Chart.js
ChartJS.register(    CategoryScale,    LinearScale,    PointElement,    LineElement,    ArcElement,    Title,    Tooltip,    Legend,    Filler
);

// --- Tipos (Simplificados - Substitua pelos seus tipos reais) ---
interface Category {
  label: string;
  value: number;
  percentage: number;
}

interface TipoMovimiento {
  id: number;
  nombre: string;
  tipo: 'Ingreso' | 'Egreso' | 'Ajuste';
}

interface Medico {
  id: string;
  nombre: string;
  activo: boolean;
  especialidad?: string;
  telefono?: string;
  correo?: string;
  fecha_ingreso?: string;
  porcentaje_comision?: number;
}

interface Paciente {
  id: number;
  dni?: string;
  nombres: string;
  apellido_paterno: string;
  apellido_materno?: string;
  fecha_nacimiento?: string;
  sexo: 'M' | 'F' | 'O';
  celular?: string;
  telefono_fijo?: string;
  correo?: string;
  direccion?: string;
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
}

type User = {
  id: string;
  nombre: string;
  apellido: string;
  activo?: boolean;
  role?: string;
}

// Estrutura para o histórico filtrado
interface HistorialData {
    anos: {
        ano: number;
        meses: {
            mes: number; // 1-12
            nombreMes: string;
            registros: RegistroCaja[];
            balanceMes: number;
        }[];
        balanceAnual: number;
    }[];
    balanceTotalPeriodo: number;
}

// Props do componente
interface MiCajaProps {
    userId: string;
    userRole: 'admin' | 'user';
}

// --- Componente Principal ---
function MiCaja({ userId, userRole }: MiCajaProps) {
    // --- Estados --- 
    const [currentUserId, setCurrentUserId] = useState<string | null>(null); // State for fetched user ID
    const [isSessionLoading, setIsSessionLoading] = useState(true); // Loading state for session check
    const [registros, setRegistros] = useState<RegistroCaja[]>([]);
    const [fecha, setFecha] = useState<string>(new Date().toISOString().split('T')[0]);
    const [descripcion, setDescripcion] = useState('');
    const [valor, setValor] = useState('');
    const [numeroFactura, setNumeroFactura] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isHistoryLoading, setIsHistoryLoading] = useState(false); // Loading específico para histórico
    const [totalDia, setTotalDia] = useState(0);
    const [tipoMovimiento, setTipoMovimiento] = useState<'Ingreso' | 'Egreso' | 'Ajuste'>('Ingreso');
    const [tipoMovimientoId, setTipoMovimientoId] = useState<number | null>(null);
    const [tiposMovimiento, setTiposMovimiento] = useState<TipoMovimiento[]>([]);
    const [historialVisible, setHistorialVisible] = useState(false);
    const [historialData, setHistorialData] = useState<HistorialData>({ anos: [], balanceTotalPeriodo: 0 }); // Estado para dados do histórico
    const [medicoId, setMedicoId] = useState<string | null>(null);
    const [formaPago, setFormaPago] = useState<'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA' | 'YAPE' | 'PLIN' | 'OTROS'>('EFECTIVO');
    const [medicos, setMedicos] = useState<Medico[]>([]);
    const [busquedaPaciente, setBusquedaPaciente] = useState('');
    const [pacienteId, setPacienteId] = useState<string | null>(null);
    const [pacientes, setPacientes] = useState<Paciente[]>([]);
    const [tipoMoneda, setTipoMoneda] = useState<'SOLES' | 'USD'>('SOLES');
    const [valorEnSoles, setValorEnSoles] = useState(0);
    const [queryPaciente, setQueryPaciente] = useState(''); // Renomeado de 'query'
    const [showPacienteDropdown, setShowPacienteDropdown] = useState(false);
    const [fechaInicioHistorial, setFechaInicioHistorial] = useState<string>('');
    const [fechaFinHistorial, setFechaFinHistorial] = useState<string>('');
    const [usuarioFiltro, setUsuarioFiltro] = useState('');
    const [tipoFiltro, setTipoFiltro] = useState('');
    const [categoriaFiltro, setCategoriaFiltro] = useState('');
    const [pacienteFiltro, setPacienteFiltro] = useState('');
    const [medicoFiltro, setMedicoFiltro] = useState('');
    const [formaPagoFiltro, setFormaPagoFiltro] = useState('');
    const [busquedaMedico, setBusquedaMedico] = useState('');
    const [showMedicoDropdown, setShowMedicoDropdown] = useState(false);
    
    // Estado para dados dos gráficos (inicialização mais limpa)
    const [chartDataHistorial, setChartDataHistorial] = useState<any>({
        ingresosPorCategoria: { labels: [], datasets: [] },
        egresosPorCategoria: { labels: [], datasets: [] },
        distribucionGeneral: { labels: [], datasets: [] },
        balanceEvolucion: { labels: [], datasets: [] },
    });

    // --- Constantes e Funções Auxiliares --- 
    const isAdmin = useMemo(() => userRole === 'admin', [userRole]);
    const taxaCambioUSD = 3.7; // Exemplo, idealmente viria de config/API

    const formatMoneda = (num: number, currency: 'PEN' | 'USD' = 'PEN') => {
        const options: Intl.NumberFormatOptions = {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        };
        const formatted = new Intl.NumberFormat(currency === 'PEN' ? 'es-PE' : 'en-US', options).format(num);
        return currency === 'PEN' ? formatted.replace('PEN', 'S/') : formatted;
    };

    const formatValorClass = (valor: number, tipo?: 'Ingreso' | 'Egreso' | 'Ajuste') => {
        if (tipo === 'Ingreso' || (tipo === 'Ajuste' && valor > 0)) return 'text-green-600';
        if (tipo === 'Egreso' || (tipo === 'Ajuste' && valor < 0)) return 'text-red-600';
        return 'text-gray-700'; // Caso padrão ou tipo indefinido
    };

    const formatValorDisplay = (valor: number, tipo?: 'Ingreso' | 'Egreso' | 'Ajuste') => {
        const valorAbs = Math.abs(valor);
        if (tipo === 'Ingreso') return `+${formatMoneda(valorAbs)}`;
        if (tipo === 'Egreso') return `-${formatMoneda(valorAbs)}`;
        if (tipo === 'Ajuste') return valor > 0 ? `+${formatMoneda(valor)}` : formatMoneda(valor);
        return formatMoneda(valor); // Caso padrão
    };

    const formatDateTime = (dateString?: string | null): { fecha: string; hora: string } => {
        if (!dateString) return { fecha: '-', hora: '-' };
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) throw new Error('Invalid Date');
            return {
                fecha: date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }),
                hora: date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
            };
        } catch (e) {
            console.error("Error formatting date:", dateString, e);
            return { fecha: 'Inválida', hora: 'Inválida' };
        }
    };

    const getNombreMes = (mesIndex: number): string => {
        const date = new Date(2000, mesIndex, 1); // Ano arbitrário, mês indexado em 0
        return date.toLocaleString('es-ES', { month: 'long' });
    };

    // --- Fetch Current User Session ---
    useEffect(() => {
      const fetchUserSession = async () => {
          setIsSessionLoading(true);
          try {
              const { data: { session }, error } = await supabase.auth.getSession();
              if (error) {
                  throw error;
              }
              if (session?.user) {
                  setCurrentUserId(session.user.id);
              } else {
                  // Handle case where user is not logged in (e.g., redirect to login)
                  console.error("No active session found.");
                  toast.error("No se encontró sesión activa. Por favor, inicie sesión.");
                  // Optionally redirect: navigate('/login'); - Requires importing useNavigate
              }
          } catch (error: any) {
              console.error('Error fetching user session:', error);
              toast.error(`Error al obtener la sesión: ${error.message}`);
          } finally {
              setIsSessionLoading(false);
          }
      };
      fetchUserSession();
  }, []); // Run once on mount



    // --- Carregamento de Dados Essenciais (Tipos Mov., Pacientes, Médicos) --- 
    useEffect(() => {
        const cargarDatosEsenciales = async () => {
            try {
                const [tiposMovData, pacientesData, medicosData] = await Promise.all([
                    supabase.from('tipos_movimiento').select('*').eq('activo', true),
                    supabase.from('pacientes').select('id, nombres, apellido_paterno, apellido_materno').eq('activo', true),
                    supabase.from('medicos').select('id, nombre').eq('activo', true).order('nombre', { ascending: true })
                ]);

                if (tiposMovData.error) throw tiposMovData.error;
                setTiposMovimiento(tiposMovData.data || []);
                if (tiposMovData.data?.length > 0 && !tipoMovimientoId) {
                    // Tenta pré-selecionar baseado no tipo atual, senão o primeiro
                    const defaultCat = tiposMovData.data.find(t => t.tipo === tipoMovimiento) || tiposMovData.data[0];
                    setTipoMovimientoId(defaultCat.id);
                }

                if (pacientesData.error) throw pacientesData.error;
                const pacientesTransformados = (pacientesData.data || []).map((p: { id: number; nombres: string; apellido_paterno: string; apellido_materno?: string; sexo?: 'M' | 'F' | 'O' }) => ({
                    ...p,
                    nombre: `${p.nombres || ''} ${p.apellido_paterno || ''} ${p.apellido_materno || ''}`.trim(),
                    sexo: p.sexo || 'O' as const,
                    activo: true
                }));
                setPacientes(pacientesTransformados);

                if (medicosData.error) throw medicosData.error;
                setMedicos((medicosData.data || []).map(med => ({
                    ...med,
                    activo: true  // Set default value for required property
                })));

            } catch (error) {
                console.error("Error al cargar datos esenciales:", error);
                toast.error("Error al cargar datos iniciales (categorías, pacientes, médicos).");
            }
        };
        cargarDatosEsenciales();
    }, []); // Carregar apenas uma vez

    // Recarregar categorias quando o tipo (Ingreso/Egreso) muda
    useEffect(() => {
        const recargarCategoriasPorTipo = async () => {
            if (!tipoMovimiento) return;
            try {
                setIsLoading(true); // Usar loading geral aqui pode ser ok
                const { data, error } = await supabase
                    .from('tipos_movimiento')
                    .select('*')
                    .eq('activo', true)
                    .eq('tipo', tipoMovimiento);

                if (error) throw error;
                setTiposMovimiento(data || []);
                // Resetar ou definir a primeira categoria do novo tipo
                setTipoMovimientoId(data?.[0]?.id || null);
            } catch (error) {
                console.error(`Error al cargar categorías para ${tipoMovimiento}:`, error);
                toast.error(`Error al cargar categorías de ${tipoMovimiento}.`);
            } finally {
                setIsLoading(false);
            }
        };
        recargarCategoriasPorTipo();
    }, [tipoMovimiento]);

    // --- Carregamento de Registros do Dia --- 
    const cargarRegistros = async (fechaSeleccionada: string) => {
        if (!fechaSeleccionada) return;
        setIsLoading(true);
        try {
            // Adicionar T00:00:00 e T23:59:59 para garantir que a consulta inclua todo o dia, 
            // independentemente do fuso horário do servidor Supabase.
            const fechaInicioDia = `${fechaSeleccionada}T00:00:00`;
            const fechaFinDia = `${fechaSeleccionada}T23:59:59`;

            const { data, error } = await supabase
                .from('registros_caja')
                .select(`
                    *,
                    tipo_movimiento:tipos_movimiento(id, nombre, tipo),
                    usuario:users(id, nombre),
                    medico:medicos(id, nombre),
                    paciente:pacientes(id, nombres, apellido_paterno, apellido_materno)
                `)
                // Usar gte e lte com as horas para abranger o dia inteiro
                .gte('fecha', fechaInicioDia)
                .lte('fecha', fechaFinDia)
                .order('created_at', { ascending: false }); // Ordenar por hora de criação

            if (error) throw error;

            const registrosProcesados: RegistroCaja[] = (data || []).map((reg: any) => ({
                ...reg,
                // Garantir que os objetos aninhados existam ou sejam undefined
                tipo_movimiento: reg.tipo_movimiento || undefined,
                usuario: reg.usuario || undefined,
                medico: reg.medico || undefined,
                paciente: reg.paciente ? { 
                    ...reg.paciente, 
                    nombreCompleto: `${reg.paciente.nombres || ''} ${reg.paciente.apellido_paterno || ''}`.trim() 
                } : undefined,
            }));

            setRegistros(registrosProcesados);
            calcularTotales(registrosProcesados);
        } catch (error: any) {
            console.error('Error cargando registros del día:', error);
            toast.error(`Error al cargar registros del día: ${error.message}`);
            setRegistros([]); // Limpar em caso de erro
            setTotalDia(0);
        } finally {
            setIsLoading(false);
        }
    };

    const calcularTotales = (registrosAct: RegistroCaja[]) => {
        const total = registrosAct.reduce((sum, registro) => sum + (registro.valor || 0), 0);
        setTotalDia(total);
    };

    // Efeito para carregar registros do dia quando a data muda
    useEffect(() => {
        cargarRegistros(fecha);
    }, [fecha, userId]); // Depende da data e userId

    // --- Lógica do Histórico --- 

    // Inicializar datas do histórico para o mês atual
    useEffect(() => {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
        if (!fechaInicioHistorial) setFechaInicioHistorial(firstDay);
        if (!fechaFinHistorial) setFechaFinHistorial(lastDay);
    }, []); // Apenas na montagem inicial

    const cargarHistorial = async (filtros: {
      fechaInicio: string; fechaFin: string; usuario?: string; tipo?: string;
      categoria?: string; paciente?: string; medico?: string; formaPago?: string;
  }) => {
      // Validación de fechas obligatorias
      if (!filtros.fechaInicio || !filtros.fechaFin) {
          toast.error('Se requieren fechas de inicio y fin para el historial.');
          return;
      }
  
      setIsHistoryLoading(true);
      try {
          // Adicionar horas para garantir a cobertura completa do intervalo
          const fechaInicioISO = `${filtros.fechaInicio}T00:00:00`;
          const fechaFinISO = `${filtros.fechaFin}T23:59:59`;
  
          let queryBuilder = supabase
              .from('registros_caja')
              .select(`
                  id, fecha, descripcion, valor, numero_factura, forma_pago, moneda, created_at,
                  tipo_movimiento:tipos_movimiento(id, nombre, tipo),
                  usuario:users(id, nombre),
                  medico:medicos(id, nombre),
                  paciente:pacientes(id, nombres, apellido_paterno, apellido_materno)
              `)
              .gte('fecha', fechaInicioISO)
              .lte('fecha', fechaFinISO)
              .order('fecha', { ascending: true }); // Ordenar por data ascendente para gráficos de evolución
  
          // Aplicar filtros
          if (filtros.usuario) {
              // Solo los admins pueden filtrar por otros usuarios
              
                  // Usuarios normales solo pueden ver sus propios registros
                  queryBuilder = queryBuilder.eq('user_id', userId);
              
          } 
          
          if (filtros.tipo) queryBuilder = queryBuilder.eq('tipo_movimiento.tipo', filtros.tipo);
          if (filtros.categoria) queryBuilder = queryBuilder.eq('tipo_movimiento_id', filtros.categoria);
          if (filtros.paciente) queryBuilder = queryBuilder.eq('paciente_id', filtros.paciente);
          if (filtros.medico) queryBuilder = queryBuilder.eq('medico_id', filtros.medico);
          if (filtros.formaPago) queryBuilder = queryBuilder.eq('forma_pago', filtros.formaPago);
  
          const { data, error } = await queryBuilder;
          if (error) throw error;
  
          const registrosProcesados: RegistroCaja[] = (data || []).map((reg: any) => ({
              ...reg,
              tipo_movimiento: reg.tipo_movimiento || undefined,
              usuario: reg.usuario || undefined,
              medico: reg.medico || undefined,
              categoria: reg.categoria || undefined,
              paciente: reg.paciente ? { 
                  ...reg.paciente, 
                  nombreCompleto: `${reg.paciente.nombres || ''} ${reg.paciente.apellido_paterno || ''} ${reg.paciente.apellido_materno || ''}`.trim() 
              } : undefined,
          }));
  
          // Organizar e preparar dados
          const historialOrganizado = organizarRegistrosPorMes(registrosProcesados);
          setHistorialData(historialOrganizado);
  
          const dataGraficos = prepararDatosGrafico(registrosProcesados);
          setChartDataHistorial(dataGraficos);
  
      } catch (error: any) {
          console.error('Error cargando historial:', error);
          toast.error(`Error al cargar historial: ${error.message}`);
          setHistorialData({ anos: [], balanceTotalPeriodo: 0 }); // Limpar em caso de erro
          setChartDataHistorial({ // Limpar gráficos
              ingresosPorCategoria: { labels: [], datasets: [] },
              egresosPorCategoria: { labels: [], datasets: [] },
              distribucionGeneral: { labels: [], datasets: [] },
              balanceEvolucion: { labels: [], datasets: [] },
          });
      } finally {
          setIsHistoryLoading(false);
      }
  };

    // CORREÇÃO: Função para organizar por múltiplos anos e meses
    const organizarRegistrosPorMes = (registros: RegistroCaja[]): HistorialData => {
        const resultado: { [ano: number]: { [mes: number]: { registros: RegistroCaja[], balanceMes: number } } } = {};
        let balanceTotalPeriodo = 0;

        registros.forEach(registro => {
            try {
                const fechaReg = new Date(registro.fecha);
                if (isNaN(fechaReg.getTime())) throw new Error('Invalid date in record');
                const ano = fechaReg.getFullYear();
                const mes = fechaReg.getMonth(); // 0-11

                if (!resultado[ano]) resultado[ano] = {};
                if (!resultado[ano][mes]) resultado[ano][mes] = { registros: [], balanceMes: 0 };

                resultado[ano][mes].registros.push(registro);
                resultado[ano][mes].balanceMes += registro.valor || 0;
                balanceTotalPeriodo += registro.valor || 0;
            } catch (e) {
                console.error("Error processing record date:", registro, e);
            }
        });

        const anosOrdenados = Object.keys(resultado).map(Number).sort((a, b) => a - b);

        const anosFormatados = anosOrdenados.map(ano => {
            const mesesOrdenados = Object.keys(resultado[ano]).map(Number).sort((a, b) => a - b);
            let balanceAnual = 0;
            const mesesFormatados = mesesOrdenados.map(mesIndex => {
                const dataMes = resultado[ano][mesIndex];
                balanceAnual += dataMes.balanceMes;
                // Ordenar registros dentro do mês pela data completa (mais recentes primeiro)
                dataMes.registros.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
                return {
                    mes: mesIndex + 1, // Converter para 1-12
                    nombreMes: getNombreMes(mesIndex),
                    registros: dataMes.registros,
                    balanceMes: dataMes.balanceMes
                };
            });
            return {
                ano: ano,
                meses: mesesFormatados,
                balanceAnual: balanceAnual
            };
        });

        return { anos: anosFormatados, balanceTotalPeriodo };
    };

    // Função para preparar dados dos gráficos
    const prepararDatosGrafico = (registros: RegistroCaja[]) => {
        const ingresos = registros.filter(r => r.tipo_movimiento?.tipo === 'Ingreso' || (r.tipo_movimiento?.tipo === 'Ajuste' && r.valor >= 0));
        const egresos = registros.filter(r => r.tipo_movimiento?.tipo === 'Egreso' || (r.tipo_movimiento?.tipo === 'Ajuste' && r.valor < 0));

        const agruparPorCategoria = (regs: RegistroCaja[]) => regs.reduce((acc, r) => {
            const categoria = r.tipo_movimiento?.nombre || (r.valor >= 0 ? 'Otros Ingresos/Ajustes' : 'Otros Egresos/Ajustes');
            acc[categoria] = (acc[categoria] || 0) + Math.abs(r.valor || 0);
            return acc;
        }, {} as Record<string, number>);

        const categoriasIngresos = agruparPorCategoria(ingresos);
        const categoriasEgresos = agruparPorCategoria(egresos);

        const totalIngresos = Object.values(categoriasIngresos).reduce((a, b) => a + b, 0);
        const totalEgresos = Object.values(categoriasEgresos).reduce((a, b) => a + b, 0);

        // Evolução do Balance (requer registros ordenados por data ASC)
        // A query já ordena por data ASC
        let balanceAcumulado = 0;
        const balanceEvolucionData = registros.map(r => {
            balanceAcumulado += r.valor || 0;
            return {
                fecha: formatDateTime(r.fecha).fecha, // Usar data formatada
                balance: balanceAcumulado
            };
        });
        // Agrupar por data para evitar múltiplos pontos no mesmo dia (opcional, mas bom para clareza)
        const balancePorDia = balanceEvolucionData.reduce((acc, curr) => {
            acc[curr.fecha] = curr.balance; // Último balance do dia
            return acc;
        }, {} as Record<string, number>);

        const labelsEvolucion = Object.keys(balancePorDia);
        const dataEvolucion = Object.values(balancePorDia);

        // Cores (usando Tailwind theme se possível, senão fallback)
        // Exemplo: Acessar cores do Tailwind via JS não é direto em React padrão.
        // Manteremos cores fixas por enquanto, mas idealmente seriam variáveis CSS ou tema.
        const coloresRaspberry = ['#b0005a', '#ffc4e0', '#8b0046', '#ffe7f3', '#4c0026']; // 500, 100, 700, 50, 900
        const coloresVerdes = ['#10B981', '#34D399', '#6EE7B7', '#A7F3D0']; // Exemplo Tailwind Green
        const coloresRojos = ['#EF4444', '#F87171', '#FCA5A5', '#FECACA']; // Exemplo Tailwind Red

        return {
            ingresosPorCategoria: {
                labels: Object.keys(categoriasIngresos),
                datasets: [{
                    data: Object.values(categoriasIngresos),
                    backgroundColor: coloresVerdes.slice(0, Object.keys(categoriasIngresos).length),
                    borderColor: '#ffffff',
                    borderWidth: 1
                }]
            },
            egresosPorCategoria: {
                labels: Object.keys(categoriasEgresos),
                datasets: [{
                    data: Object.values(categoriasEgresos),
                    backgroundColor: coloresRojos.slice(0, Object.keys(categoriasEgresos).length),
                    borderColor: '#ffffff',
                    borderWidth: 1
                }]
            },
            distribucionGeneral: {
                labels: ['Ingresos', 'Egresos'],
                datasets: [{
                    data: [totalIngresos, totalEgresos],
                    backgroundColor: [coloresVerdes[1], coloresRojos[1]],
                    borderColor: '#ffffff',
                    borderWidth: 1
                }]
            },
            balanceEvolucion: {
                labels: labelsEvolucion,
                datasets: [{
                    label: 'Balance Acumulado',
                    data: dataEvolucion,
                    borderColor: coloresRaspberry[0], // Cor principal
                    backgroundColor: 'rgba(176, 0, 90, 0.1)', // Cor principal com transparência
                    fill: true,
                    tension: 0.3,
                    pointBackgroundColor: coloresRaspberry[0],
                    pointRadius: 3,
                    pointHoverRadius: 5
                }]
            }
        };
    };

    // Efeito para carregar histórico quando visível e filtros mudam (apenas admin)
    useEffect(() => {
        if ( historialVisible && fechaInicioHistorial && fechaFinHistorial) {
            cargarHistorial({
                fechaInicio: fechaInicioHistorial,
                fechaFin: fechaFinHistorial,
                usuario: usuarioFiltro,
                tipo: tipoFiltro,
                categoria: categoriaFiltro,
                paciente: pacienteFiltro,
                medico: medicoFiltro,
                formaPago: formaPagoFiltro
            });
        }
        // Se não for admin ou não estiver visível, garantir que os dados do histórico estejam limpos
        if ( !historialVisible) {
             setHistorialData({ anos: [], balanceTotalPeriodo: 0 });
             setChartDataHistorial({ // Limpar gráficos
                ingresosPorCategoria: { labels: [], datasets: [] },
                egresosPorCategoria: { labels: [], datasets: [] },
                distribucionGeneral: { labels: [], datasets: [] },
                balanceEvolucion: { labels: [], datasets: [] },
            });
        }
    }, [ historialVisible, fechaInicioHistorial, fechaFinHistorial, usuarioFiltro, tipoFiltro, categoriaFiltro, pacienteFiltro, medicoFiltro, formaPagoFiltro]);

    // --- Ações do Formulário --- 

    const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const inputValor = e.target.value;
        setValor(inputValor);
        try {
            const valorNumerico = parseFloat(inputValor);
            if (!isNaN(valorNumerico)) {
                setValorEnSoles(tipoMoneda === 'USD' ? valorNumerico * taxaCambioUSD : valorNumerico);
            } else {
                setValorEnSoles(0);
            }
        } catch { setValorEnSoles(0); }
    };

    const handleMonedaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const novaMoneda = e.target.value as 'SOLES' | 'USD';
        setTipoMoneda(novaMoneda);
        // Recalcular valor em soles ao mudar a moeda
        try {
            const valorNumerico = parseFloat(valor);
            if (!isNaN(valorNumerico)) {
                setValorEnSoles(novaMoneda === 'USD' ? valorNumerico * taxaCambioUSD : valorNumerico);
            }
        } catch { /* Manter valorEnSoles como está se valor for inválido */ }
    };

    const agregarRegistro = async () => {
      if (!currentUserId) {
           toast.error("Error: No se pudo identificar al usuario. Intente recargar la página.");
           return;
      }
      if (!valor || isNaN(parseFloat(valor))) { toast.error('El valor debe ser un número válido.'); return; }
      if (!tipoMovimientoId) { toast.error('Debe seleccionar una categoría.'); return; }
      if (!fecha) { toast.error('Debe seleccionar una fecha.'); return; }

      let valorFinal = valorEnSoles;
      const tipoMov = tiposMovimiento.find(t => t.id === tipoMovimientoId)?.tipo;

      if (tipoMov === 'Ingreso' && valorFinal < 0) { toast.error('Los ingresos deben ser valores positivos.'); return; }
      if (tipoMov === 'Egreso' && valorFinal > 0) { valorFinal = -Math.abs(valorFinal); }
      if (tipoMov === 'Egreso' && valorFinal === 0) { toast.error('Los egresos deben tener un valor.'); return; }

      const fechaParaGuardar = new Date(fecha + 'T12:00:00');
      if (isNaN(fechaParaGuardar.getTime())) { toast.error('Fecha no válida.'); return; }

      setIsLoading(true);
      try {
          const registroParaGuardar = {
              fecha: fechaParaGuardar.toISOString(),
              tipo_movimiento_id: tipoMovimientoId,
              descripcion: descripcion.trim() || ' ',
              valor: valorFinal,
              numero_factura: numeroFactura.trim() || null,
              user_id: currentUserId, // Corrected: Use fetched user ID
              medico_id: medicoId || null,
              forma_pago: formaPago,
              paciente_id: pacienteId || null,
              moneda: tipoMoneda
          };

          const { data: registroInsertado, error: errorRegistro } = await supabase
              .from('registros_caja')
              .insert([registroParaGuardar])
              .select('id')
              .single();

          if (errorRegistro) throw errorRegistro;

          let comisionAgregada = false;
          if (tipoMov === 'Ingreso' && formaPago === 'TARJETA' && valorFinal > 0) {
              const comisionTarjeta = parseFloat((valorFinal * 0.05).toFixed(2));
              const ID_CATEGORIA_COMISION = 116; // TODO: Make configurable

              if (comisionTarjeta > 0 && ID_CATEGORIA_COMISION) {
                  const { error: errorComision } = await supabase
                      .from('registros_caja')
                      .insert([{
                          fecha: fechaParaGuardar.toISOString(),
                          tipo_movimiento_id: ID_CATEGORIA_COMISION,
                          descripcion: `Comisión tarjeta (${descripcion ? descripcion.substring(0, 30) + '...' : 'Ingreso'})`,
                          valor: -comisionTarjeta,
                          user_id: currentUserId, // Corrected: Use fetched user ID
                          medico_id: medicoId || null,
                          forma_pago: 'TARJETA',
                          paciente_id: pacienteId || null,
                          moneda: 'SOLES',
                          // relacionado_con: registroInsertado.id // If field exists
                      }]);

                  if (errorComision) {
                      console.error('Error al insertar comisión:', errorComision);
                      toast.error(`Ingreso registrado, pero falló la comisión: ${errorComision.message}`);
                  } else {
                      comisionAgregada = true;
                  }
              }
          }

          if (comisionAgregada) {
              toast.success('Ingreso y comisión registrados.');
          } else {
              toast.success('Registro agregado correctamente.');
          }

          // Reset form
          setDescripcion('');
          setValor('');
          setValorEnSoles(0);
          setNumeroFactura('');
          setMedicoId(null);
          setBusquedaMedico('');
          setPacienteId(null);
          setBusquedaPaciente('');
          setTipoMoneda('SOLES');
          setFormaPago('EFECTIVO');

          cargarRegistros(fecha); // Reload daily records

      } catch (error: any) {
          console.error('Error agregando registro:', error);
          if (error.message?.includes('violates not-null constraint') && error.message?.includes('"user_id"')) {
               toast.error('Error: Falta el ID de usuario al guardar. Intente recargar.');
          } else {
               toast.error(`Error al agregar registro: ${error.message}`);
          }
      } finally {
          setIsLoading(false);
      }
  };

    const eliminarRegistro = async (id: string) => {
        if (!id) { toast.error('ID inválido.'); return; }
        if (!window.confirm('¿Estás seguro de eliminar este registro? Esta acción no se puede deshacer.')) return;

        setIsLoading(true);
        try {
            const { error } = await supabase.from('registros_caja').delete().eq('id', id);
            if (error) throw error;
            toast.success('Registro eliminado.');
            cargarRegistros(fecha); // Recarregar dia
            // Recarregar histórico se estiver visível
            if (historialVisible) {
                cargarHistorial({
                    fechaInicio: fechaInicioHistorial,
                    fechaFin: fechaFinHistorial,
                    usuario: usuarioFiltro,
                    tipo: tipoFiltro,
                    categoria: categoriaFiltro,
                    paciente: pacienteFiltro,
                    medico: medicoFiltro,
                    formaPago: formaPagoFiltro
                });
            }
        } catch (error: any) {
            console.error('Error eliminando registro:', error);
            toast.error(`Error al eliminar: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    // --- Componentes Internos (Filtros, Dropdowns) --- 

    const FiltrosHistorial = () => {
        const [usuarios, setUsuarios] = useState<User[]>([]);
        const [categorias, setCategorias] = useState<TipoMovimiento[]>([]);
        const [medicosFiltro, setMedicosFiltro] = useState<Medico[]>([]);
        const [pacientesFiltro, setPacientesFiltro] = useState<Paciente[]>([]);

        useEffect(() => {
            const fetchFilterOptions = async () => {
                try {
                    const [usersData, catsData, medsData, pacsData] = await Promise.all([
                        supabase.from('users').select('id, nombre, apellido'), // Assumindo tabela 'users'
                        supabase.from('tipos_movimiento').select('id, nombre, tipo').eq('activo', true),
                        supabase.from('medicos').select('id, nombre').eq('activo', true),
                        supabase.from('pacientes').select('id, nombres, apellido_paterno').eq('activo', true)
                    ]);

                    if (usersData.error) throw usersData.error;
                    setUsuarios((usersData.data || []).map(user => ({
                        ...user,
                        apellido: user.apellido || ''  // Add default empty string for apellido
                    })));

                    if (catsData.error) throw catsData.error;
                    setCategorias(catsData.data || []);

                    if (medsData.error) throw medsData.error;
                    setMedicosFiltro((medsData.data || []).map(med => ({
                        ...med,
                        activo: true  // Set default value for required property
                    })));

                    if (pacsData.error) throw pacsData.error;
                    const pacsFormatados = (pacsData.data || []).map((p: { id: number; nombres: string; apellido_paterno: string; sexo?: 'M' | 'F' | 'O' }) => ({ 
                        ...p, 
                        nombreCompleto: `${p.nombres} ${p.apellido_paterno}`.trim(),
                        sexo: p.sexo || 'O' as const,
                        activo: true
                    }));
                    setPacientesFiltro(pacsFormatados);

                } catch (error: any) {
                    console.error("Error fetching filter options:", error);
                    toast.error(`Error al cargar opciones de filtro: ${error.message}`);
                }
            };
            fetchFilterOptions();
        }, []);

        const handleAplicarFiltros = () => {
            if (!fechaInicioHistorial || !fechaFinHistorial) {
                toast.error('Se requieren fechas de inicio y fin.'); return;
            }
            cargarHistorial({
                fechaInicio: fechaInicioHistorial, fechaFin: fechaFinHistorial,
                usuario: usuarioFiltro, tipo: tipoFiltro, categoria: categoriaFiltro,
                paciente: pacienteFiltro, medico: medicoFiltro, formaPago: formaPagoFiltro
            });
        };

        const handleLimpiarFiltros = () => {
            const now = new Date();
            const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
            const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
            setFechaInicioHistorial(firstDay);
            setFechaFinHistorial(lastDay);
            setUsuarioFiltro(''); setTipoFiltro(''); setCategoriaFiltro('');
            setPacienteFiltro(''); setMedicoFiltro(''); setFormaPagoFiltro('');
            // Recarregar com filtros limpos (datas padrão)
            cargarHistorial({ fechaInicio: firstDay, fechaFin: lastDay });
        };

        // MELHORIA UI/UX: Layout mais compacto e responsivo para filtros
        return (
            <div className="p-4 bg-gray-50 rounded-lg shadow-sm border border-gray-200 mb-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {/* Datas */} 
                    <div>
                        <label htmlFor="fechaInicioHist" className="block text-xs font-medium text-gray-600 mb-1">Inicio</label>
                        <input id="fechaInicioHist" type="date" value={fechaInicioHistorial} onChange={(e) => setFechaInicioHistorial(e.target.value)}
                            className="w-full text-sm rounded-md border-gray-300 shadow-sm p-2 border focus:ring-raspberry-500 focus:border-raspberry-500" />
                    </div>
                    <div>
                        <label htmlFor="fechaFinHist" className="block text-xs font-medium text-gray-600 mb-1">Fin</label>
                        <input id="fechaFinHist" type="date" value={fechaFinHistorial} onChange={(e) => setFechaFinHistorial(e.target.value)} min={fechaInicioHistorial}
                            className="w-full text-sm rounded-md border-gray-300 shadow-sm p-2 border focus:ring-raspberry-500 focus:border-raspberry-500" />
                    </div>
                    {/* Usuário */} 
                    <div>
                        <label htmlFor="usuarioFiltro" className="block text-xs font-medium text-gray-600 mb-1">Usuario</label>
                        <select id="usuarioFiltro" value={usuarioFiltro} onChange={(e) => setUsuarioFiltro(e.target.value)}
                            className="w-full text-sm rounded-md border-gray-300 shadow-sm p-2 border focus:ring-raspberry-500 focus:border-raspberry-500 bg-white">
                            <option value="">Todos</option>
                            {usuarios.map((u) => <option key={u.id} value={u.id}>{u.nombre}</option>)}
                        </select>
                    </div>
                    {/* Tipo */} 
                    <div>
                        <label htmlFor="tipoFiltro" className="block text-xs font-medium text-gray-600 mb-1">Tipo</label>
                        <select id="tipoFiltro" value={tipoFiltro} onChange={(e) => setTipoFiltro(e.target.value)}
                            className="w-full text-sm rounded-md border-gray-300 shadow-sm p-2 border focus:ring-raspberry-500 focus:border-raspberry-500 bg-white">
                            <option value="">Todos</option>
                            <option value="Ingreso">Ingreso</option>
                            <option value="Egreso">Egreso</option>
                            <option value="Ajuste">Ajuste</option>
                        </select>
                    </div>
                    {/* Categoria */} 
                    <div>
                        <label htmlFor="categoriaFiltro" className="block text-xs font-medium text-gray-600 mb-1">Categoría</label>
                        <select id="categoriaFiltro" value={categoriaFiltro} onChange={(e) => setCategoriaFiltro(e.target.value)}
                            className="w-full text-sm rounded-md border-gray-300 shadow-sm p-2 border focus:ring-raspberry-500 focus:border-raspberry-500 bg-white">
                            <option value="">Todas</option>
                            {categorias.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                        </select>
                    </div>
                    {/* Paciente */} 
                    <div>
                        <label htmlFor="pacienteFiltro" className="block text-xs font-medium text-gray-600 mb-1">Paciente</label>
                        <select id="pacienteFiltro" value={pacienteFiltro} onChange={(e) => setPacienteFiltro(e.target.value)}
                            className="w-full text-sm rounded-md border-gray-300 shadow-sm p-2 border focus:ring-raspberry-500 focus:border-raspberry-500 bg-white">
                            <option value="">Todos</option>
                            {pacientesFiltro.map((p) => <option key={p.id} value={p.id}>{p.nombres} {p.apellido_paterno} {p.apellido_materno}</option>)}
                        </select>
                    </div>
                    {/* Médico */} 
                    <div>
                        <label htmlFor="medicoFiltro" className="block text-xs font-medium text-gray-600 mb-1">Médico</label>
                        <select id="medicoFiltro" value={medicoFiltro} onChange={(e) => setMedicoFiltro(e.target.value)}
                            className="w-full text-sm rounded-md border-gray-300 shadow-sm p-2 border focus:ring-raspberry-500 focus:border-raspberry-500 bg-white">
                            <option value="">Todos</option>
                            {medicosFiltro.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                        </select>
                    </div>
                    {/* Forma Pago */} 
                    <div>
                        <label htmlFor="formaPagoFiltro" className="block text-xs font-medium text-gray-600 mb-1">Forma Pago</label>
                        <select id="formaPagoFiltro" value={formaPagoFiltro} onChange={(e) => setFormaPagoFiltro(e.target.value)}
                            className="w-full text-sm rounded-md border-gray-300 shadow-sm p-2 border focus:ring-raspberry-500 focus:border-raspberry-500 bg-white">
                            <option value="">Todas</option>
                            <option value="EFECTIVO">Efectivo</option>
                            <option value="TARJETA">Tarjeta</option>
                            <option value="TRANSFERENCIA">Transferencia</option>
                            <option value="YAPE">Yape</option>
                            <option value="PLIN">Plin</option>
                            <option value="OTROS">Otros</option>
                        </select>
                    </div>
                    {/* Botões */} 
                    <div className="flex items-end gap-2 col-span-full sm:col-span-1 md:col-span-1 lg:col-span-1 xl:col-span-2">
                        <button onClick={handleAplicarFiltros} disabled={isHistoryLoading}
                            className="flex-1 px-4 py-2 bg-raspberry-700 text-white rounded-md hover:bg-raspberry-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-raspberry-500 disabled:opacity-50 text-sm font-medium transition-colors">
                            {isHistoryLoading ? 'Buscando...' : 'Aplicar'}
                        </button>
                        <button onClick={handleLimpiarFiltros} disabled={isHistoryLoading}
                            className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 disabled:opacity-50 text-sm font-medium transition-colors">
                            Limpiar
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    // --- Renderização Principal --- 
    return (
        <div className="bg-gray-50 rounded-lg shadow-md overflow-hidden transition-all duration-300">
            {/* Card Principal */}
            <div className="bg-gray-50 rounded-lg shadow-md overflow-hidden transition-all duration-300">
                {/* Cabeçalho do Card */}
                <div className="bg-gradient-to-r from-[#801461] to-[#5A0D45] p-6 text-white">
                    <h1 className="text-xl md:text-2xl font-bold">Gestión Financiera</h1>
                    {/* Botão Histórico (Condicional para Admin) */}
                    <div className="w-full flex justify-end mb-4">
                      <button
                        onClick={() => setHistorialVisible(!historialVisible)}
                        className={`px-4 py-2 text-sm font-medium rounded-md flex items-center transition-colors duration-200 ${
                          historialVisible
                            ? 'bg-white text-[#801461] hover:bg-gray-100'
                            : 'bg-[#F0E6ED] text-[#801461] hover:bg-[#E0CDD9]'
                        }`}
                      >
                        {historialVisible ? (
                          <>
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4 mr-1.5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2}
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Ocultar Historial
                          </>
                        ) : (
                          <>
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4 mr-1.5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                              />
                            </svg>
                            Ver Historial y Gráficos
                          </>
                        )}
                      </button>
</div>

                </div>

                {/* Conteúdo Principal (Formulário e Tabela Diária) */}
                <div className="p-4 md:p-6 space-y-6">
                    {/* Seletor de Data */}
                    <div className="max-w-xs">
                        <label htmlFor="fechaDiaria" className="block text-sm font-medium text-gray-700 mb-1">Fecha de Registro:</label>
                        <input
                            id="fechaDiaria"
                            type="date"
                            value={fecha}
                            onChange={(e) => setFecha(e.target.value)}
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-raspberry-500 focus:ring-raspberry-500 p-2 border text-sm"
                        />
                    </div>

                   {/* Formulário de Novo Registro con flujo natural de llenado */}
                  <div className="bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200">
                      <h2 className="text-lg font-semibold text-raspberry-900 mb-4">Registro Diario</h2>
                      <div className="space-y-4">
                          {/* Primera línea: Tipo → Categoría → Médico → Paciente */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                              {/* Tipo */}
                              <div>
                                  <label htmlFor="tipoMov" className="block text-xs font-medium text-gray-600 mb-1">Tipo*</label>
                                  <select id="tipoMov" value={tipoMovimiento} onChange={(e) => setTipoMovimiento(e.target.value as any)}
                                      className="w-full text-sm rounded-md border-gray-300 shadow-sm p-2 border focus:ring-raspberry-500 focus:border-raspberry-500 bg-white">
                                      <option value="Ingreso">Ingreso</option>
                                      <option value="Egreso">Egreso</option>
                                      <option value="Ajuste">Ajuste</option>
                                  </select>
                              </div>

                              {/* Categoría */}
                              <div>
                                  <label htmlFor="categoriaMov" className="block text-xs font-medium text-gray-600 mb-1">Categoría*</label>
                                  <select id="categoriaMov" value={tipoMovimientoId || ''} onChange={(e) => setTipoMovimientoId(Number(e.target.value) || null)}
                                      className="w-full text-sm rounded-md border-gray-300 shadow-sm p-2 border focus:ring-raspberry-500 focus:border-raspberry-500 bg-white"
                                      disabled={isLoading || tiposMovimiento.length === 0}>
                                      {isLoading ? <option>Cargando...</option> : 
                                      tiposMovimiento.length === 0 ? <option>No hay</option> : 
                                      <><option value="">Seleccione...</option>{tiposMovimiento.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}</>}
                                  </select>
                              </div>

                              {/* Médico */}
                              <div className="relative">
                                  <label htmlFor="medicoReg" className="block text-xs font-medium text-gray-600 mb-1">Médico</label>
                                  <input id="medicoReg" type="text" placeholder="Buscar..." value={busquedaMedico}
                                      onChange={(e) => { setBusquedaMedico(e.target.value); setShowMedicoDropdown(true); if (!e.target.value) setMedicoId(null); }}
                                      onFocus={() => setShowMedicoDropdown(true)} onBlur={() => setTimeout(() => setShowMedicoDropdown(false), 150)}
                                      className="w-full text-sm rounded-md border-gray-300 shadow-sm p-2 border focus:ring-raspberry-500 focus:border-raspberry-500" />
                                  {showMedicoDropdown && medicos.filter(m => m.nombre.toLowerCase().includes(busquedaMedico.toLowerCase())).length > 0 && (
                                      <ul className="absolute z-20 w-full bg-white border border-gray-300 rounded-md shadow-lg mt-1 max-h-40 overflow-y-auto">
                                          {medicos.filter(m => m.nombre.toLowerCase().includes(busquedaMedico.toLowerCase())).slice(0, 10).map(med => (
                                              <li key={med.id} className="px-3 py-1.5 text-sm hover:bg-raspberry-50 cursor-pointer" 
                                                  onMouseDown={() => { setMedicoId(med.id); setBusquedaMedico(med.nombre); setShowMedicoDropdown(false); }}>
                                                  {med.nombre}
                                              </li>
                                          ))}
                                      </ul>
                                  )}
                                  {medicoId && <span className="text-xs text-green-600 block mt-0.5">✓ Seleccionado</span>}
                              </div>

                              {/* Paciente */}
                              <div className="relative">
                                  <label htmlFor="pacienteReg" className="block text-xs font-medium text-gray-600 mb-1">Paciente</label>
                                  <input id="pacienteReg" type="text" placeholder="Buscar..." value={busquedaPaciente}
                                      onChange={(e) => { setBusquedaPaciente(e.target.value); setQueryPaciente(e.target.value); setShowPacienteDropdown(true); if (!e.target.value) setPacienteId(null); }}
                                      onFocus={() => setShowPacienteDropdown(true)} onBlur={() => setTimeout(() => setShowPacienteDropdown(false), 150)}
                                      className="w-full text-sm rounded-md border-gray-300 shadow-sm p-2 border focus:ring-raspberry-500 focus:border-raspberry-500" />
                                  {showPacienteDropdown && pacientes.filter(p => p.nombres.toLowerCase().includes(queryPaciente.toLowerCase())).length > 0 && (
                                      <ul className="absolute z-20 w-full bg-white border border-gray-300 rounded-md shadow-lg mt-1 max-h-40 overflow-y-auto">
                                          {pacientes.filter(p => p.nombres.toLowerCase().includes(queryPaciente.toLowerCase())).slice(0, 10).map(pac => (
                                              <li key={pac.id} className="px-3 py-1.5 text-sm hover:bg-raspberry-50 cursor-pointer"
                                                  onMouseDown={() => { setPacienteId(String(pac.id)); setBusquedaPaciente(pac.nombres); setQueryPaciente(pac.nombres); setShowPacienteDropdown(false); }}>
                                                  {pac.nombres} {pac.apellido_paterno} {pac.apellido_materno}
                                              </li>
                                          ))}
                                      </ul>
                                  )}
                                  {pacienteId && <span className="text-xs text-green-600 block mt-0.5">✓ Seleccionado</span>}
                              </div>
                          </div>

                          {/* Segunda línea: Forma de pago → Descripción → Valor/Moneda → Factura */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                              {/* Forma de pago */}
                              <div>
                                  <label htmlFor="formaPagoMov" className="block text-xs font-medium text-gray-600 mb-1">Forma Pago*</label>
                                  <select id="formaPagoMov" value={formaPago} onChange={(e) => setFormaPago(e.target.value as any)}
                                      className="w-full text-sm rounded-md border-gray-300 shadow-sm p-2 border focus:ring-raspberry-500 focus:border-raspberry-500 bg-white">
                                      <option value="EFECTIVO">Efectivo</option>
                                      <option value="TARJETA">Tarjeta</option>
                                      <option value="TRANSFERENCIA">Transferencia</option>
                                      <option value="YAPE">Yape</option>
                                      <option value="PLIN">Plin</option>
                                      <option value="OTROS">Otros</option>
                                  </select>
                              </div>

                              {/* Descripción */}
                              <div>
                                <label htmlFor="descripcionMov" className="block text-xs font-medium text-gray-600 mb-1">Descripción</label>
                                <input 
                                    id="descripcionMov" 
                                    type="text" 
                                    value={descripcion} 
                                    onChange={(e) => setDescripcion(e.target.value || "Sin descripción")} 
                                    placeholder="Detalles del movimiento"
                                    className="w-full text-sm rounded-md border-gray-300 shadow-sm p-2 border focus:ring-raspberry-500 focus:border-raspberry-500" 
                                />
                            </div>

                              {/* Valor y Moneda */}
                              <div>
                                            <label htmlFor="valorMov" className="block text-xs font-medium text-gray-600 mb-1">Valor*</label>
                                            <div className="flex gap-2">
                                                <select value={tipoMoneda} onChange={handleMonedaChange} aria-label="Tipo de Moneda"
                                                    className="text-sm rounded-md border-gray-300 shadow-sm p-2 border focus:ring-raspberry-500 focus:border-raspberry-500 bg-white">
                                                    <option value="SOLES">S/</option>
                                                    <option value="USD">$</option>
                                                </select>
                                                <input id="valorMov" type="number" step="0.01" value={valor} onChange={handleValorChange} placeholder="0.00" required
                                                    className="flex-grow text-sm rounded-md border-gray-300 shadow-sm p-2 border focus:ring-raspberry-500 focus:border-raspberry-500" />
                                            </div>
                                            {tipoMoneda === 'USD' && valorEnSoles > 0 && (
                                                <div className="text-xs text-gray-500 mt-1">
                                                    ≈ {formatMoneda(valorEnSoles, 'PEN')}
                                                </div>
                                            )}
                          </div>

                              {/* Factura */}
                              <div>
                                  <label htmlFor="numFactura" className="block text-xs font-medium text-gray-600 mb-1">Nº Factura</label>
                                  <input id="numFactura" type="text" value={numeroFactura} onChange={(e) => setNumeroFactura(e.target.value)} placeholder="Ej: F001-123"
                                      className="w-full text-sm rounded-md border-gray-300 shadow-sm p-2 border focus:ring-raspberry-500 focus:border-raspberry-500" />
                              </div>
                          </div>

                          {/* Botón de submit - centrado */}
                          <div className="pt-2 flex justify-center">
                              <button onClick={agregarRegistro} disabled={isLoading || !valor || !tipoMovimientoId}
                                  className="px-6 py-2 bg-raspberry-700 text-white rounded-md hover:bg-raspberry-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-raspberry-500 disabled:opacity-60 disabled:cursor-not-allowed transition-colors text-sm font-medium shadow-sm">
                                  {isLoading ? (
                                      <span className="flex items-center justify-center">
                                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                          </svg>
                                          Agregando...
                                      </span>
                                  ) : 'Agregar Registro'}
                              </button>
                          </div>
                      </div>
                  </div>

                    {/* Tabela de Registros do Dia (Layout Melhorado) */}
                    <div className="mt-6">
                        <h2 className="text-lg font-semibold text-raspberry-900 mb-3">Registros del Día ({formatDateTime(fecha).fecha})</h2>
                        <div className="overflow-x-auto shadow rounded-lg border border-gray-200 bg-white">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        {/* Cabeçalhos da Tabela */} 
                                        <th className="px-3 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                                        <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Hora</th>
                                        <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tipo</th>
                                        <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Categoría</th>
                                        <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Descripción</th>
                                        <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Paciente</th>
                                        <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Médico</th>
                                        <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Forma Pago</th>
                                        <th className="px-3 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Valor</th>
                                        
                                        <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Acción</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {/* Linhas da Tabela */} 
                                    {isLoading && (
                                        <tr><td colSpan={9} className="py-4 text-center text-sm text-gray-500 italic">Cargando registros...</td></tr>
                                    )}
                                    {!isLoading && registros.length === 0 && (
                                        <tr><td colSpan={9} className="py-4 text-center text-sm text-gray-500 italic">No hay registros para esta fecha.</td></tr>
                                    )}
                                    {!isLoading && registros.map((reg) => {
                                        const { hora } = formatDateTime(reg.created_at);
                                        const tipoMov = reg.tipo_movimiento?.tipo;
                                        const valorColor = formatValorClass(reg.valor, tipoMov);
                                        const valorDisplay = formatValorDisplay(reg.valor, tipoMov);
                                        const pacienteNombre = reg.paciente?.nombres || 'N/A';
                                        const medicoNombre = reg.medico?.nombre || 'N/A';
                                        let badgeClass = 'bg-gray-100 text-gray-800';
                                        if (tipoMov === 'Ingreso') badgeClass = 'bg-green-100 text-green-800';
                                        else if (tipoMov === 'Egreso') badgeClass = 'bg-red-100 text-red-800';
                                        else if (tipoMov === 'Ajuste') badgeClass = 'bg-yellow-100 text-yellow-800';

                                        return (
                                            <tr key={reg.id} className="hover:bg-gray-50 transition-colors duration-100">

                                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-600">{reg.usuario?.nombre|| 'N/A'}</td>
                                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{hora}</td>
                                                <td className="px-3 py-2 whitespace-nowrap">
                                                    <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${badgeClass}`}>
                                                        {tipoMov || 'N/A'}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-800">{reg.tipo_movimiento?.nombre || 'N/A'}</td>
                                                <td className="px-3 py-2 text-sm text-gray-600 max-w-xs truncate" title={reg.descripcion}>{reg.descripcion || '-'}</td>
                                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-600">{pacienteNombre}</td>
                                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-600">{medicoNombre}</td>
                                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-600">{reg.forma_pago || 'N/A'}</td>
                                                <td className={`px-3 py-2 whitespace-nowrap text-sm text-right font-medium ${valorColor}`}>{valorDisplay}</td>
                                                
                                                <td className="px-3 py-2 whitespace-nowrap text-center text-sm font-medium">
                                                    <button onClick={() => eliminarRegistro(reg.id)} disabled={isLoading} title="Eliminar Registro"
                                                        className="text-red-500 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                                {/* Rodapé da Tabela */} 
                                <tfoot className="bg-gray-150">
                                    <tr>
                                        <td colSpan={8} className="px-3 py-2 text-right text-sm font-semibold text-gray-700">Total del Día:</td>
                                       
                                        <td className={`px-3 py-2 text-right text-sm font-bold ${totalDia >= 0 ? 'text-green-700' : 'text-red-700'}`}>{formatMoneda(totalDia)}</td>
                                        <td className="px-3 py-3"></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

          

            {/* Seção Historial e Gráficos */}
            

            {/* Seção Historial e Gráficos */}
            { historialVisible && (
                <div className="mt-8 pt-6 border-t border-gray-200 space-y-6">
                    <h2 className="overflow-x-auto text-lg font-semibold text-raspberry-900 mb-3">   Historial y Análisis</h2>
                    
                    {/* Filtros do Histórico */} 
                    <FiltrosHistorial />

                    {/* Indicador de Loading */} 
                    {isHistoryLoading && (
                        <div className="text-center py-10">
                            <p className="text-sm text-gray-500 italic">Cargando historial...</p>
                            {/* Opcional: Adicionar um spinner aqui */} 
                        </div>
                    )}

                    {/* Conteúdo do Histórico (Gráficos e Tabelas) */} 
                    {!isHistoryLoading && historialData.anos.length === 0 && (
                         <div className="text-center py-10 bg-white rounded-lg shadow border border-gray-200">
                            <p className="text-md text-gray-600">No se encontraron registros para el período y filtros seleccionados.</p>
                            <p className="text-sm text-gray-400 mt-1">Intente ajustar las fechas o los filtros.</p>
                        </div>
                    )}
                    
                    {!isHistoryLoading && historialData.anos.length > 0 && (
                        <div className="space-y-8">
                            {/* Gráficos - Aplicar 'items-stretch' para que os filhos tentem ter a mesma altura */} 
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 items-stretch">
                            
                        {/* Ingresos x Categoría - Adicionado 'h-full flex flex-col' */} 
                       <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-200 flex flex-col h-full">
                          <h3 className="text-lg font-bold text-gray-800 text-center mb-4"> Ingresos por Categoría</h3>

                          {chartDataHistorial.ingresosPorCategoria?.datasets?.[0]?.data?.length > 0 ? (
                            // Adicionado 'flex-grow' para que este div ocupe o espaço restante
                            <div className="space-y-6 flex flex-col flex-grow">

                              {/* Gráfico opcional */}
                              <div className="h-48 flex-shrink-0">
                                <Pie 
                                  data={chartDataHistorial.ingresosPorCategoria} 
                                  options={{ 
                                    responsive: true, 
                                    maintainAspectRatio: false, 
                                    plugins: { 
                                      legend: { display: false },
                                      tooltip: {
                                        callbacks: {
                                          label: function(context) {
                                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                            const value = context.raw as number;
                                            const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                                            return `${context.label}: S/.${value.toLocaleString()} (${percentage}%)`;
                                          }
                                        }
                                      }
                                    } 
                                  }} 
                                />
                              </div>

                              {/* Tabla - Adicionado 'flex-shrink-0' */} 
                              <div className="overflow-x-auto rounded-lg border border-gray-100 flex-shrink-0">
                                <table className="min-w-full text-sm divide-y divide-gray-200">
                                  <thead className="bg-gray-50">
                                    <tr>
                                      <th className="px-4 py-2 text-left font-semibold text-gray-600">Categoría</th>
                                      <th className="px-4 py-2 text-right font-semibold text-gray-600">Monto</th>
                                      <th className="px-4 py-2 text-right font-semibold text-gray-600">% del Total</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-100">
                                    {(() => {
                                      const data = chartDataHistorial.ingresosPorCategoria;
                                      const labels = data.labels || [];
                                      const values = data.datasets[0].data || [];
                                      const total = values.reduce((sum: number, value: number) => sum + value, 0);

                                      type Category = { label: string; value: number; percentage: number };
                                      const categories = labels.map((label: string, index: number) => ({
                                        label,
                                        value: values[index],
                                        percentage: total > 0 ? (values[index] / total) * 100 : 0
                                      })).sort((a: Category, b: Category) => b.value - a.value);

                                      return (
                                        <>
                                          {categories.map((cat: Category, i: number) => (
                                            <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                              <td className="px-4 py-2 font-medium text-gray-700">{cat.label}</td>
                                              <td className="px-4 py-2 text-right">S/.{cat.value.toLocaleString()}</td>
                                              <td className="px-4 py-2 text-right">{cat.percentage.toFixed(1)}%</td>
                                            </tr>
                                          ))}
                                          {total > 0 && (
                                            <tr className="bg-green-50 font-semibold text-green-800">
                                              <td className="px-4 py-2">Total Ingresos</td>
                                              <td className="px-4 py-2 text-right">S/.{total.toLocaleString()}</td>
                                              <td className="px-4 py-2 text-right">100%</td>
                                            </tr>
                                          )}
                                        </>
                                      );
                                    })()}
                                  </tbody>
                                </table>
                              </div>

                              {/* Insights - Cores alteradas para verde, adicionado 'mt-auto' para empurrar para baixo */}
                              <div className="p-4 bg-green-50 border border-green-200 rounded-xl mt-auto flex-shrink-0">
                                <h4 className="text-green-900 font-bold mb-2">💡 Insights de Ingresos:</h4>
                                <ul className="space-y-2 text-green-800 text-sm">
                                  {(() => {
                                    const data = chartDataHistorial.ingresosPorCategoria;
                                    const labels = data.labels || [];
                                    const values = data.datasets[0].data || [];
                                    const total = values.reduce((sum: number, value: number) => sum + value, 0);

                                    if (total === 0) return <li>No hay datos para generar insights.</li>;

                                    type Category = { label: string; value: number; percentage: number };
                                    const categories = labels.map((label: string, index: number) => ({
                                      label,
                                      value: values[index],
                                      percentage: total > 0 ? (values[index] / total) * 100 : 0
                                    })).sort((a: Category, b: Category) => b.value - a.value);

                                    const insights = [];

                                    // Categoría principal
                                    if (categories.length > 0) {
                                      insights.push(`✅ La categoría principal es **${categories[0].label}**, aportando el  ${categories[0].percentage.toFixed(1)}% del total (S/.${categories[0].value.toLocaleString()}).`);
                                    }

                                    // Diversificación
                                    if (categories.length >= 3) {
                                        const topPercent = categories.slice(0, 3).reduce((acc: number, cat: Category) => acc + cat.percentage, 0);
                                        if (topPercent > 80) {
                                          insights.push(`⚠️ Más del 80% de los ingresos (${topPercent.toFixed(1)}%) proviene de solo **${categories.slice(0, 3).map((c: Category) => c.label).join(', ')}**. Considera diversificar.`);
                                        } else {
                                          insights.push(`📌 Buena diversificación: Las 3 categorías principales suman el ${topPercent.toFixed(1)}% del total.`);
                                        }
                                    } else if (categories.length > 0) {
                                        insights.push(`📌 Los ingresos se concentran en ${categories.length} categorí${categories.length > 1 ? 'as' : 'a'}.`);
                                    }

                                    // Diferencia entre top 1 y 2
                                    if (categories.length >= 2) {
                                      const ratio = categories[1].value > 0 ? categories[0].value / categories[1].value : Infinity;
                                      if (ratio >= 2 && ratio !== Infinity) {
                                        insights.push(`📈 **${categories[0].label}** genera ${ratio.toFixed(1)} veces más ingresos que **${categories[1].label}**.`);
                                      }
                                    }

                                    // Total
                                    insights.push(`💰 **Total de ingresos:** S/.${total.toLocaleString()}`);

                                    return insights.map((text, i) => (
                                      <li key={i} className="flex items-start gap-1.5">
                                        <span className="mt-0.5 text-base">•</span>
                                        <span dangerouslySetInnerHTML={{ __html: text }} />
                                      </li>
                                    ));
                                  })()}
                                </ul>
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500 text-center italic mt-8 flex-grow flex items-center justify-center">No hay datos de ingresos por categoría disponibles</p>
                          )}
                        </div>

                       

                      {/* Egresos x Categoría - Adicionado 'h-full flex flex-col' */}
                      <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-200 flex flex-col h-full">
                        <h3 className="text-lg font-semibold text-gray-800 text-center mb-4">
                          Egresos por Categoría
                        </h3>

                        {chartDataHistorial.egresosPorCategoria?.datasets?.[0]?.data?.length > 0 ? (
                          // Adicionado 'flex-grow'
                          <div className="space-y-6 flex flex-col flex-grow">
                            {/* Gráfico de egresos - Adicionado 'flex-shrink-0' */}
                            <div className="h-48 flex-shrink-0">
                              <Pie 
                                data={chartDataHistorial.egresosPorCategoria} 
                                options={{ 
                                  responsive: true, 
                                  maintainAspectRatio: false, 
                                  plugins: { 
                                    legend: { display: false },
                                    tooltip: {
                                      callbacks: {
                                        label: function(context) {
                                          const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                          const value = context.raw as number;
                                          const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                                          return `${context.label}: S/.${value.toLocaleString()} (${percentage}%)`;
                                        }
                                      }
                                    }
                                  } 
                                }} 
                              />
                            </div>

                            {/* Tabla de análisis de egresos - Adicionado 'flex-shrink-0' */}
                            <div className="overflow-x-auto rounded-lg border border-gray-100 flex-shrink-0">
                              <table className="min-w-full text-sm divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                  <tr>
                                    <th className="px-4 py-2 text-left font-semibold text-gray-600">Categoría</th>
                                    <th className="px-4 py-2 text-right font-semibold text-gray-600">Monto</th>
                                    <th className="px-4 py-2 text-right font-semibold text-gray-600">% del Total</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                  {(() => {
                                    const data = chartDataHistorial.egresosPorCategoria;
                                    const labels = data.labels || [];
                                    const values = data.datasets[0].data || [];
                                    const total = values.reduce((sum: number, value: number) => sum + value, 0);
                                    const categories = labels.map((label: string, index: number) => ({
                                      label,
                                      value: values[index],
                                      percentage: total > 0 ? (values[index] / total) * 100 : 0
                                    })).sort((a: any, b: any) => b.value - a.value);

                                    return (
                                      <>
                                        {categories.map((cat: Category, i: number) => (
                                          <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                            <td className="px-4 py-2 font-medium text-gray-700">{cat.label}</td>
                                            <td className="px-4 py-2 text-right">S/.{cat.value.toLocaleString()}</td>
                                            <td className="px-4 py-2 text-right">{cat.percentage.toFixed(1)}%</td>
                                          </tr>
                                        ))}
                                        {total > 0 && (
                                          <tr className="bg-red-50 font-semibold text-red-800">
                                            <td className="px-4 py-2">Total Egresos</td>
                                            <td className="px-4 py-2 text-right">S/.{total.toLocaleString()}</td>
                                            <td className="px-4 py-2 text-right">100%</td>
                                          </tr>
                                        )}
                                      </>
                                    );
                                  })()}
                                </tbody>
                              </table>
                            </div>

                            {/* Insights automáticos de egresos - Adicionado 'mt-auto', melhorada estrutura da lista */}
                            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mt-auto flex-shrink-0">
                              <h4 className="font-semibold text-red-900 mb-2">🔍 Análisis de Gastos</h4>
                              <ul className="space-y-2 text-sm text-red-800">
                                {(() => {
                                  const data = chartDataHistorial.egresosPorCategoria;
                                  const labels = data.labels || [];
                                  const values = data.datasets[0].data || [];
                                  const total = values.reduce((sum: number, value: number) => sum + value, 0);

                                  if (total === 0) return <li>No hay datos para generar insights.</li>;

                                  const sorted = labels.map((label: string, i: number) => ({
                                    label,
                                    value: values[i],
                                    percentage: total > 0 ? (values[i] / total) * 100 : 0
                                  })).sort((a: any, b: any) => b.value - a.value);

                                  const insights = [];

                                  // Gasto principal
                                  if (sorted.length > 0) {
                                    insights.push(`❗️ El mayor gasto es **${sorted[0].label}**, representando el ${sorted[0].percentage.toFixed(1)}% del total (S/.${sorted[0].value.toLocaleString()}).`);
                                  }

                                  // Concentración
                                  if (sorted.length >= 3) {
                                    const top3Percent = sorted.slice(0, 3).reduce((acc: number, cat: Category) => acc + cat.percentage, 0);
                                    if (top3Percent > 75) {
                                      insights.push(`⚠️ El ${top3Percent.toFixed(1)}% de los gastos se concentra en **${sorted.slice(0, 3).map((c: Category) => c.label).join(', ')}**. Evalúa si es posible optimizar.`);
                                    } else {
                                        insights.push(`📊 Gastos diversificados: Las 3 categorías principales suman el ${top3Percent.toFixed(1)}%.`);
                                    }
                                  } else if (sorted.length > 0) {
                                      insights.push(`📊 Los gastos se distribuyen en ${sorted.length} categorí${sorted.length > 1 ? 'as' : 'a'}.`);
                                  }

                                  // Gasto menor
                                  if (sorted.length > 1) {
                                    const menor = sorted[sorted.length - 1];
                                    if (menor && menor.percentage < 5) {
                                      insights.push(
                                        `📉 **${menor.label}** tiene un impacto bajo en los gastos (${menor.percentage.toFixed(1)}%).`
                                      );
                                    }
                                  }

                                  // Total
                                  insights.push(`💸 **Total de egresos:** S/.${total.toLocaleString()}`);

                                  return insights.map((text, i) => (
                                    <li key={i} className="flex items-start gap-1.5">
                                      <span className="mt-0.5 text-base">•</span>
                                      <span dangerouslySetInnerHTML={{ __html: text }} />
                                    </li>
                                  ));
                                })()}
                              </ul>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 text-center italic mt-8 flex-grow flex items-center justify-center">
                            No hay datos de egresos por categoría disponibles
                          </p>
                        )}
                      </div>



                          {/* Ingresos vs Egresos - Adicionado 'h-full flex flex-col' */}
                        <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-200 flex flex-col h-full md:col-span-2 xl:col-span-1">
                          <h3 className="text-lg font-semibold text-gray-800 text-center mb-4">Ingresos vs Egresos</h3>

                          {chartDataHistorial.distribucionGeneral?.datasets?.[0]?.data?.some((d: number) => d > 0) ? (
                            // Adicionado 'flex-grow'
                            <div className="space-y-6 flex flex-col flex-grow">
                              {/* Gráfico de distribución - Adicionado 'flex-shrink-0' */}
                              <div className="h-48 flex-shrink-0">
                                <Pie
                                  data={chartDataHistorial.distribucionGeneral}
                                  options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: {
                                      legend: { position: 'bottom', labels: { padding: 15, boxWidth: 12 } },
                                      tooltip: {
                                        callbacks: {
                                          label: function (context) {
                                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                            const value = context.raw as number;
                                            const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                                            return `${context.label}: S/.${value.toLocaleString()} (${percentage}%)`;
                                          },
                                        },
                                      },
                                    },
                                  }}
                                />
                              </div>

                              {/* Tabla de comparación - Adicionado 'flex-shrink-0' */}
                              <div className="overflow-x-auto rounded-lg border border-gray-100 flex-shrink-0">
                                <table className="min-w-full text-sm divide-y divide-gray-200">
                                  <thead className="bg-gray-50">
                                    <tr>
                                      <th className="px-4 py-2 text-left font-semibold text-gray-600">Concepto</th>
                                      <th className="px-4 py-2 text-right font-semibold text-gray-600">Monto</th>
                                      <th className="px-4 py-2 text-right font-semibold text-gray-600">% del Total</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-100">
                                    {(() => {
                                      const data = chartDataHistorial.distribucionGeneral;
                                      const labels = data.labels || [];
                                      const values = data.datasets[0].data || [];
                                      const total = values.reduce((sum: number, value: number) => sum + value, 0);

                                      const rows = labels.map((label: string, index: number) => ({
                                        label,
                                        value: values[index],
                                        percentage: total > 0 ? (values[index] / total) * 100 : 0,
                                        bgColor: /ingreso/i.test(label) ? 'bg-green-50' : (/egreso/i.test(label) ? 'bg-red-50' : 'bg-white'),
                                        textColor: /ingreso/i.test(label) ? 'text-green-800' : (/egreso/i.test(label) ? 'text-red-800' : 'text-gray-700'),
                                      })).sort((a: any, b: any) => b.value - a.value);

                                      const balance = (rows.find((r: { label: string; value: number }) => /ingreso/i.test(r.label))?.value || 0) - (rows.find((r: { label: string; value: number }) => /egreso/i.test(r.label))?.value || 0);

                                      return (
                                        <>
                                          {rows.map((item: { label: string; value: number; percentage: number; bgColor: string; textColor: string }, i: number) => (
                                            <tr key={i} className={`${item.bgColor} hover:bg-gray-100`}>
                                              <td className={`px-4 py-2 font-medium ${item.textColor}`}>{item.label}</td>
                                              <td className={`px-4 py-2 text-right ${item.textColor}`}>S/.{item.value.toLocaleString()}</td>
                                              <td className={`px-4 py-2 text-right ${item.textColor}`}>{item.percentage.toFixed(1)}%</td>
                                            </tr>
                                          ))}
                                          <tr className={`font-semibold ${balance >= 0 ? 'bg-green-100 text-green-900' : 'bg-red-100 text-red-900'}`}>
                                            <td className="px-4 py-2">Balance (Ingresos - Egresos)</td>
                                            <td className="px-4 py-2 text-right" colSpan={2}>S/.{balance.toLocaleString()}</td>
                                          </tr>
                                        </>
                                      );
                                    })()}
                                  </tbody>
                                </table>
                              </div>

                              {/* Insights específicos - Cores alteradas para cinza neutro, adicionado 'mt-auto', melhorada estrutura da lista */}
                              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mt-auto flex-shrink-0">
                                <h4 className="font-semibold text-gray-800 mb-2">⚖️ Análisis de Balance</h4>
                                <ul className="space-y-2 text-sm text-gray-700">
                                  {(() => {
                                    const data = chartDataHistorial.distribucionGeneral;
                                    const labels = data.labels || [];
                                    const values = data.datasets[0].data || [];
                                    const total = values.reduce((sum: number, value: number) => sum + value, 0);

                                    if (total === 0) return <li>No hay datos para generar insights.</li>;

                                    const sorted = labels.map((label: string, i: number) => ({
                                      label,
                                      value: values[i],
                                      percentage: total > 0 ? (values[i] / total) * 100 : 0,
                                    })).sort((a: Category, b: Category) => b.value - a.value);

                                    const insights = [];
                                    const ingresos = sorted.find((item: Category) => /ingreso/i.test(item.label));
                                    const egresos = sorted.find((item: Category) => /egreso/i.test(item.label));

                                    if (ingresos && egresos) {
                                      const balance = ingresos.value - egresos.value;
                                      const balanceSign = balance >= 0 ? '+' : '-';
                                      const balanceClass = balance >= 0 ? 'text-green-700 font-semibold' : 'text-red-700 font-semibold';
                                      insights.push(`📊 Comparativa: Ingresos (${ingresos.percentage.toFixed(1)}%) vs Egresos (${egresos.percentage.toFixed(1)}%).`);
                                      insights.push(balance >= 0
                                        ? `✅ ¡Superávit! El balance es <span class="${balanceClass}">${balanceSign}S/.${Math.abs(balance).toLocaleString()}</span>.`
                                        : `⚠️ ¡Déficit! El balance es <span class="${balanceClass}">${balanceSign}S/.${Math.abs(balance).toLocaleString()}</span>. Revisa tus gastos.`);
                                    } else if (ingresos) {
                                        insights.push(`✅ Solo se registraron ingresos por $${ingresos.value.toLocaleString()}.`);
                                    } else if (egresos) {
                                        insights.push(`⚠️ Solo se registraron egresos por $${egresos.value.toLocaleString()}.`);
                                    }

                                    // Dominancia (se mantém a lógica original, mas pode ser redundante com a comparativa)
                                    // if (sorted.length > 0 && sorted[0]?.percentage > 60) {
                                    //   insights.push(`⚖️ ${sorted[0].label} representa más del 60% (${sorted[0].percentage.toFixed(1)}%) del flujo total.`);
                                    // }

                                    insights.push(`💰 **Flujo total (Ingresos + Egresos):** S/.${total.toLocaleString()}`);

                                    return insights.map((text, i) => (
                                      <li key={i} className="flex items-start gap-1.5">
                                        <span className="mt-0.5 text-base">•</span>
                                        <span dangerouslySetInnerHTML={{ __html: text }} />
                                      </li>
                                    ));
                                  })()}
                                </ul>
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500 text-center italic mt-8 flex-grow flex items-center justify-center">Sin datos para comparar Ingresos vs Egresos</p>
                          )}
                        </div>



                          {/* Evolucion del Balance */} 

                          <div className="md:col-span-2 xl:col-span-3 bg-white p-6 rounded-lg shadow border border-gray-200 space-y-6">
  <h3 className="text-md font-semibold text-gray-700 mb-3">Evolución del Balance</h3>

  {chartDataHistorial.balanceEvolucion?.datasets?.[0]?.data?.length > 0 ? (
    <>
      {/* Gráfico com linhas acumuladas de Balance, Ingresos e Egresos */}
      <div className="h-60">
        <Line
          data={{
            ...chartDataHistorial.balanceEvolucion,
            datasets: [
              ...(chartDataHistorial.balanceEvolucion.datasets || []),
              chartDataHistorial.ingresosAcumulado && {
                label: 'Ingresos Acumulados',
                data: chartDataHistorial.ingresosAcumulado.datasets[0].data,
                borderColor: 'rgb(34, 197, 94)', // Verde
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                fill: false,
                tension: 0.3,
                yAxisID: 'y',
              },
              chartDataHistorial.egresosAcumulado && {
                label: 'Egresos Acumulados',
                data: chartDataHistorial.egresosAcumulado.datasets[0].data,
                borderColor: 'rgb(239, 68, 68)', // Vermelho
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                fill: false,
                tension: 0.3,
                yAxisID: 'y',
              },
            ].filter(Boolean),
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            scales: {
              y: { beginAtZero: true, position: 'left', title: { display: true, text: 'Monto Acumulado' } },
              x: { title: { display: true, text: 'Fecha' } },
            },
            plugins: {
              legend: { display: true, position: 'bottom' },
              tooltip: {
                callbacks: {
                  label: context => `${context.dataset.label}: $${context.parsed.y.toLocaleString()}`,
                },
              },
            },
          }}
        />
      </div>



    </>
  ) : (
    <p className="text-sm text-gray-500 text-center italic mt-8">Datos insuficientes para mostrar la evolución</p>
  )}
</div>


                            </div>

                            {/* Tabela Historial por Ano/Mês */} 
                            <div>
                                <h3 className="text-lg font-semibold text-raspberry-900 mb-4">Detalle del Historial</h3>
                                <div className="space-y-6">
                                    {historialData.anos.map(anoData => (
                                        <div key={anoData.ano} className="bg-white p-4 rounded-lg shadow border border-gray-200">
                                            <h4 className="text-lg font-semibold text-gray-800 mb-3 flex justify-between items-center">
                                                <span>Año {anoData.ano}</span>
                                                <span className={`text-sm font-bold ${anoData.balanceAnual >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                    Balance Anual: {formatMoneda(anoData.balanceAnual)}
                                                </span>
                                            </h4>
                                            <div className="space-y-4">
                                                {anoData.meses.map(mesData => (
                                                    <details key={mesData.mes} className="border-b border-gray-100 last:border-b-0 pb-2 mb-2">
                                                        <summary className="cursor-pointer text-md font-medium text-gray-700 hover:text-raspberry-800 flex justify-between items-center py-1">
                                                            <span className="capitalize">{mesData.nombreMes}</span>
                                                            <span className={`text-sm font-semibold ${mesData.balanceMes >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                                Balance Mes: {formatMoneda(mesData.balanceMes)}
                                                            </span>
                                                        </summary>
                                                        {mesData.registros.length > 0 ? (
                                                            <div className="overflow-x-auto mt-2 pl-4 pr-1">
                                                                <table className="min-w-full divide-y divide-gray-200 text-sm">
                                                                    <thead className="bg-gray-50">
                                                                        <tr>
                                                                            <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                                                                            <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                                                                            <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cat.</th>
                                                                            <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Desc.</th>
                                                                            <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paciente</th>
                                                                            <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Médico</th>
                                                                            <th className="px-2 py-1.5 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody className="bg-white divide-y divide-gray-100">
                                                                        {mesData.registros.map(reg => {
                                                                            const { fecha: fechaReg } = formatDateTime(reg.fecha);
                                                                            const tipoMovHist = reg.tipo_movimiento?.tipo;
                                                                            const valorColorHist = formatValorClass(reg.valor, tipoMovHist);
                                                                            
                                                                            return (
                                                                                <tr key={reg.id} className="hover:bg-gray-50">
                                                                                    <td className="px-2 py-1.5 whitespace-nowrap">{fechaReg}</td>
                                                                                    <td className="px-2 py-1.5">
                                                                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${tipoMovHist === 'Ingreso' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                                                            {tipoMovHist}
                                                                                        </span>
                                                                                    </td>
                                                                                    <td className="px-2 py-1.5">{reg.tipo_movimiento?.nombre || '-'}</td>
                                                                                    <td className="px-2 py-1.5 truncate max-w-xs" title={reg.descripcion}>{reg.descripcion || '-'}</td>
                                                                                    <td className="px-2 py-1.5">{reg.paciente?.nombres || '-'}</td>
                                                                                    <td className="px-2 py-1.5">{reg.medico?.nombre || '-'}</td>
                                                                                    <td className={`px-2 py-1.5 text-right whitespace-nowrap font-medium ${valorColorHist}`}>
                                                                                        {formatMoneda(reg.valor)}
                                                                                    </td>
                                                                                </tr>
                                                                            );
                                                                        })}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        ) : (
                                                            <p className="text-xs text-gray-400 italic pl-4 mt-1">No hay registros para este mes.</p>
                                                        )}
                                                    </details>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}



        </div>
    );
}

export default MiCaja;

