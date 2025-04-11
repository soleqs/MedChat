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
      requesterName,
      requesterRole,
      requesterAvatar,
      shiftDate,
      acceptUrl,
      rejectUrl
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
        <h2 style="color: #2563eb;">Запрос на обмен сменами</h2>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <div style="display: flex; align-items: center; margin-bottom: 20px;">
            <img 
              src="${requesterAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(requesterName)}&background=random`}" 
              alt="${requesterName}"
              style="width: 60px; height: 60px; border-radius: 50%; margin-right: 15px;"
            />
            <div>
              <h3 style="margin: 0; color: #1f2937;">${requesterName}</h3>
              <p style="margin: 5px 0; color: #6b7280;">${requesterRole}</p>
            </div>
          </div>
          
          <p style="color: #4b5563; margin-bottom: 20px;">
            Хочет поменяться с вами сменами на дату: <strong>${formattedDate}</strong>
          </p>
          
          <div style="display: flex; gap: 10px;">
            <a 
              href="${acceptUrl}" 
              style="background-color: #22c55e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;"
            >
              Принять
            </a>
            <a 
              href="${rejectUrl}" 
              style="background-color: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;"
            >
              Отклонить
            </a>
          </div>
        </div>
      </div>
    `;

    await client.send({
      from: Deno.env.get('SMTP_FROM')!,
      to,
      subject: 'Запрос на обмен сменами',
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