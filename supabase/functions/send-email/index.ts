// supabase/functions/RESEND-EMAILS/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const FROM_EMAIL = Deno.env.get('FROM_EMAIL'); // e.g. 'notificaciones@tudominio.com'

serve(async (req) => {
  const headers = {
    'Content-Type': 'application/json',
  };

  try {
    const body = await req.json();
    console.log('✅ Email payload recibido:', body);

    const { to, subject, html } = body;

    // Validaciones básicas
    if (!to || !subject || !html) {
      console.error('❌ Faltan campos obligatorios en el cuerpo del request');
      return new Response(JSON.stringify({
        error: 'Faltan campos: to, subject y html son requeridos.'
      }), {
        status: 400,
        headers
      });
    }

    if (!RESEND_API_KEY || !FROM_EMAIL) {
      console.error('❌ Variables de entorno faltantes:', {
        RESEND_API_KEY: !!RESEND_API_KEY,
        FROM_EMAIL
      });
      return new Response(JSON.stringify({
        error: 'Variables de entorno RESEND_API_KEY o FROM_EMAIL no definidas.'
      }), {
        status: 500,
        headers
      });
    }

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to,
        subject,
        html
      })
    });

    const responseText = await resendResponse.text();
    console.log('📩 Respuesta de Resend:', responseText);

    if (!resendResponse.ok) {
      console.error('❌ Error al enviar el correo:', responseText);
      return new Response(JSON.stringify({
        error: 'Fallo al enviar el correo.',
        details: responseText
      }), {
        status: 500,
        headers
      });
    }

    return new Response(responseText, {
      status: 200,
      headers
    });

  } catch (err) {
    console.error('❌ Error inesperado:', err);
    return new Response(JSON.stringify({
      error: err.message || 'Error desconocido'
    }), {
      status: 500,
      headers
    });
  }
});
