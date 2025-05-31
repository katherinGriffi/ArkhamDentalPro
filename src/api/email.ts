// src/api/email.ts
import { supabase } from '../lib/supabase'; // Ajusta la ruta si es necesario

interface EmailParams {
  to: string;
  patientName: string;
  doctorName: string;
  date: string; // Formato legible para el email
  time: string; // Formato legible para el email
  action: 'created' | 'updated' | 'cancelled';
}

export const sendAppointmentEmail = async (params: EmailParams): Promise<void> => {
  console.log('Attempting to send email with params:', params);

  const subjectMap = {
    created: `Confirmación de Cita - Andrews Dental Group: ${params.patientName}`,
    updated: `Actualización de Cita - Andrews Dental Group: ${params.patientName}`,
    cancelled: `Cancelación de Cita - Andrews Dental Group: ${params.patientName}`
  };

  const subject = subjectMap[params.action];

  const html = `
    <p>Estimado(a) ${params.patientName},</p>
    <p>Le informamos que su cita con el Dr(a). <strong>${params.doctorName}</strong> en Andrews Dental Group ha sido <strong>${params.action === 'created' ? 'confirmada' : (params.action === 'updated' ? 'actualizada' : 'cancelada')}</strong>.</p>
    <p><strong>Detalles de la cita:</strong></p>
    <ul>
      <li><strong>Fecha:</strong> ${params.date}</li>
      <li><strong>Hora:</strong> ${params.time}</li>
      <li><strong>Motivo:</strong> ${params.action === 'created' ? 'Nueva Cita' : (params.action === 'updated' ? 'Cita Actualizada' : 'Cita Cancelada')}</li>
    </ul>
    <p>Le esperamos. ¡Gracias!</p>
    <p>Atentamente,</p>
    <p>El equipo de Andrews Dental Group</p>
  `;

  try {
    const { data, error } = await supabase.functions.invoke('RESEND-EMAILS', {
        body: JSON.stringify({
          to: params.to,
          subject: subject, // <-- ¡CORREGIDO! Pasa la variable subject
          html: html,       // <-- ¡CORREGIDO! Pasa la variable html
        }),
      });

    if (error) {
      console.error('Supabase Function Invocation Error:', error);
      throw new Error(`Error al invocar la función de email: ${error.message}`);
    }

    if (data && typeof data === 'object' && 'error' in data) {
      console.error('Error from Edge Function (response body):', data.error);
      throw new Error(`Error de la función de email (detalles): ${data.details || data.error}`);
    }

    console.log('Email function invoked successfully:', data);

  } catch (err: any) {
    console.error('Error in sendAppointmentEmail:', err);
    throw err;
  }
};