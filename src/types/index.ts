export interface TipoMovimiento {
  id: number;
  nombre: string;
  tipo: 'Ingreso' | 'Egreso' | 'Ajuste';
}

export interface Medico {
  id: string;
  nombre: string;
  activo: boolean;
  especialidad?: string;
  telefono?: string;
  correo?: string;
  fecha_ingreso?: string;
  porcentaje_comision?: number;
}

export interface Paciente {
  id: number;
  dni: string;
  nombres: string;
  apellido_paterno: string;
  apellido_materno: string;
  fecha_nacimiento: string;
  sexo: 'M' | 'F' | 'O';
  celular: string;
  telefono_fijo: string;
  correo: string;
  direccion: string;
  distrito: string;
  grupo_sanguineo: string;
  alergias: string;
  enfermedades_cronicas: string;
  medicamentos_actuales: string;
  seguro_medico: string;
  estado_civil: string;
  ocupacion: string;
  referencia: string;
  historial_dental: string;
  activo: boolean;
  fecha_registro: string;
}

export interface RegistroCaja {
  id: string;
  fecha: string;
  tipo_movimiento_id: number;
  tipo_movimiento?: {
    id: number;
    nombre: string;
    tipo: 'Ingreso' | 'Egreso' | 'Ajuste';
  };
  descripcion: string;
  valor: number;
  numero_factura?: string;
  user_id: string;
  created_at: string;
  usuario?: {
    nombre: string;
  };
  paciente?: Paciente;
  medico?: Medico;
  forma_pago?: 'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA' | 'YAPE' | 'PLIN' | 'OTROS';
}

export interface HistorialMes {
  mes: number;
  registros: RegistroCaja[];
  balanceMes: number;
}

export interface HistorialAno {
  ano: number;
  meses: HistorialMes[];
}

export interface Session {
  user: {
    id: string;
    email?: string;
  };
} 