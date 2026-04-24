import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { to, message, twilioSid, twilioToken, twilioWhatsapp } = await req.json();

    const sid = twilioSid || process.env.TWILIO_SID;
    const token = twilioToken || process.env.TWILIO_TOKEN;
    const from = twilioWhatsapp || process.env.TWILIO_WHATSAPP;

    if (!sid || !token || !from) {
      return NextResponse.json(
        { error: 'Configurá las credenciales de Twilio en Settings' },
        { status: 400 }
      );
    }

    if (!to || !message) {
      return NextResponse.json({ error: 'Faltan destinatario o mensaje' }, { status: 400 });
    }

    const toNumber = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
    const fromNumber = from.startsWith('whatsapp:') ? from : `whatsapp:${from}`;

    const body = new URLSearchParams({
      From: fromNumber,
      To: toNumber,
      Body: message,
    });

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      }
    );

    if (!response.ok) {
      const err = await response.json();
      return NextResponse.json(
        { error: err.message || 'Error de Twilio' },
        { status: response.status }
      );
    }

    const result = await response.json();
    return NextResponse.json({ success: true, sid: result.sid });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    return NextResponse.json({ error: err.message, stack: err.stack, detail: String(error) }, { status: 500 });
  }
}
