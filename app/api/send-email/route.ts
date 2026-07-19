import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { to, subject, body } = await request.json()

    if (!to || !subject || !body) {
      return NextResponse.json(
        { error: 'Faltan datos para enviar el correo.' },
        { status: 400 },
      )
    }

    const resendApiKey = process.env.RESEND_API_KEY
    const from = process.env.EMAIL_FROM ?? 'La Casa del Pez <notificaciones@lacasadelpez.com>'

    if (resendApiKey) {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from,
          to,
          subject,
          text: body,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Error enviando correo con Resend:', errorText)

        return NextResponse.json(
          { error: 'No se pudo enviar el correo.' },
          { status: 502 },
        )
      }

      return NextResponse.json({
        ok: true,
        message: 'Correo enviado correctamente.',
      })
    }

    console.log('Correo enviado desde API:', {
      to,
      subject,
      body,
    })

    return NextResponse.json({
      ok: true,
      message: 'Correo registrado en consola. Configura RESEND_API_KEY para envío real.',
    })
  } catch (error) {
    console.error('Error enviando correo:', error)

    return NextResponse.json(
      { error: 'No se pudo enviar el correo.' },
      { status: 500 },
    )
  }
}
