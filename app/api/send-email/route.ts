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

    console.log('Correo enviado desde API:', {
      to,
      subject,
      body,
    })

    return NextResponse.json({
      ok: true,
      message: 'Correo enviado correctamente.',
    })
  } catch (error) {
    console.error('Error enviando correo:', error)

    return NextResponse.json(
      { error: 'No se pudo enviar el correo.' },
      { status: 500 },
    )
  }
}
