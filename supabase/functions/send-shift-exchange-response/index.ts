import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { SmtpClient } from 'https://deno.land/x/smtp@v0.7.0/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const {
      to,
      responderName,
      shiftDate,
      accepted
    } = await req.json();

    const client = new SmtpClient();

    await client.connectTLS({
      hostname: Deno.env.get('SMTP_HOSTNAME')!,
      port: Number(Deno.env.get('SMTP_PORT')),
      username: Deno.env.get('SMTP_USERNAME')!,
      password: Deno.env.get('SMTP_PASSWORD')!,
    });

    const formattedDate = new Date(shiftDate).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: ${accepted ? '#22c55e' : '#ef4444'};">
          ${accepted ? 'Запрос на обмен сменами принят' : 'Запрос на обмен сменами отклонен'}
        </h2>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="color: #4b5563; margin-bottom: 20px;">
            Пользователь ${responderName} ${accepted ? 'принял' : 'отклонил'} ваш запрос на обмен сменами на дату: <strong>${formattedDate}</strong>
          </p>
        </div>
      </div>
    `;

    await client.send({
      from: Deno.env.get('SMTP_FROM')!,
      to,
      subject: `${accepted ? 'Принят' : 'Отклонен'} запрос на обмен сменами`,
      content: 'Это HTML письмо. Пожалуйста, используйте почтовый клиент с поддержкой HTML.',
      html,
    });

    await client.close();

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error sending email:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});