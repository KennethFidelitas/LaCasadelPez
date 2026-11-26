'use server'

import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import type { CreditCustomerOption, CreditItem, CreditManagementData, CreditStatus } from './types'

const creditSchema = z.object({
  id: z.string().uuid().optional().nullable(),
  customerId: z.string().uuid('Seleccioná un cliente válido.'),
  amount: z.coerce.number().finite().positive('El monto del crédito debe ser mayor a 0.'),
  paid: z.coerce.number().finite().min(0, 'El monto abonado no puede ser negativo.').default(0),
  dueDate: z.string().date('Ingresá una fecha de vencimiento válida.').optional().nullable(),
  notes: z.string().trim().optional().default(''),
})

type ProfileRow = {
  id: string
  email: string | null
  first_name: string | null
  last_name: string | null
  role: string | null
}

type CreditRow = {
  id: string
  user_id: string
  amount: number | string | null
  balance: number | string | null
  description: string | null
  issued_by: string | null
  expires_at: string | null
  created_at: string
}

function profileLabel(profile?: ProfileRow | null) {
  if (!profile) return 'Cliente no encontrado'
  const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(' ').trim()
  return fullName || profile.email || 'Cliente sin nombre'
}

function todayInCostaRica() {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Costa_Rica' }).format(new Date())
}

function mapStatus(balance: number, dueDate: string): CreditStatus {
  if (balance <= 0) return 'Pagado'
  if (dueDate && dueDate < todayInCostaRica()) return 'Vencido'
  return 'Activo'
}

function dateInputValue(value: string | null | undefined) {
  if (!value) return ''
  return value.slice(0, 10)
}

async function requireStaffUser() {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) throw new Error(userError.message)
  if (!user) throw new Error('Debés iniciar sesión para gestionar créditos.')

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('id', user.id)
    .single()

  if (profileError) throw new Error(profileError.message)
  if (!profile || !['admin', 'employee'].includes(profile.role)) {
    throw new Error('Tu usuario no tiene permisos para gestionar créditos.')
  }

  return user.id
}

export async function getCreditManagementData(): Promise<CreditManagementData> {
  await requireStaffUser()
  const supabase = createAdminClient()

  const [{ data: creditRows, error: creditsError }, { data: profileRows, error: profilesError }] =
    await Promise.all([
      supabase
        .from('credits')
        .select('id, user_id, amount, balance, description, issued_by, expires_at, created_at')
        .order('created_at', { ascending: false }),
      supabase
        .from('profiles')
        .select('id, email, first_name, last_name, role')
        .eq('role', 'customer')
        .order('first_name', { ascending: true }),
    ])

  if (creditsError) throw new Error(creditsError.message)
  if (profilesError) throw new Error(profilesError.message)

  const profiles = ((profileRows ?? []) as ProfileRow[])
  const profilesById = new Map(profiles.map((profile) => [profile.id, profile]))

  const issuerIds = Array.from(
    new Set(((creditRows ?? []) as CreditRow[]).map((credit) => credit.issued_by).filter(Boolean)),
  ) as string[]

  if (issuerIds.length) {
    const { data: issuers, error: issuersError } = await supabase
      .from('profiles')
      .select('id, email, first_name, last_name, role')
      .in('id', issuerIds)

    if (issuersError) throw new Error(issuersError.message)
    for (const issuer of (issuers ?? []) as ProfileRow[]) {
      profilesById.set(issuer.id, issuer)
    }
  }

  const customers: CreditCustomerOption[] = profiles.map((profile) => ({
    id: profile.id,
    label: profileLabel(profile),
    email: profile.email,
  }))

  const credits: CreditItem[] = ((creditRows ?? []) as CreditRow[]).map((credit) => {
    const amount = Number(credit.amount ?? 0)
    const balance = Number(credit.balance ?? 0)
    const dueDate = dateInputValue(credit.expires_at)

    return {
      id: credit.id,
      customerId: credit.user_id,
      customer: profileLabel(profilesById.get(credit.user_id)),
      seller: profileLabel(profilesById.get(credit.issued_by ?? '')),
      amount,
      paid: Math.max(amount - balance, 0),
      balance,
      dueDate,
      status: mapStatus(balance, dueDate),
      notes: credit.description ?? '',
      createdAt: credit.created_at,
    }
  })

  return { credits, customers }
}

export async function saveCredit(input: unknown): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const issuedBy = await requireStaffUser()
    const parsed = creditSchema.safeParse(input)

    if (!parsed.success) {
      return {
        ok: false,
        message: parsed.error.issues[0]?.message ?? 'Revisá los datos del crédito.',
      }
    }

    const payload = parsed.data
    const supabase = createAdminClient()

    let currentCredit: { amount: number | string; balance: number | string; expires_at: string | null } | null = null
    if (payload.id) {
      const { data, error } = await supabase.from('credits').select('amount, balance, expires_at').eq('id', payload.id).single()
      if (error) return { ok: false, message: error.message }
      currentCredit = data
    }
    if (payload.dueDate && payload.dueDate < todayInCostaRica() && payload.dueDate !== dateInputValue(currentCredit?.expires_at)) {
      return { ok: false, message: 'La fecha de vencimiento no puede ser anterior a hoy.' }
    }

    const amount = Math.round(payload.amount * 100)
    const previousPaid = currentCredit
      ? Math.max(0, Math.round(Number(currentCredit.amount) * 100) - Math.round(Number(currentCredit.balance) * 100))
      : 0
    const newPayment = Math.round(payload.paid * 100)
    if (previousPaid > amount || newPayment > amount - previousPaid) {
      return { ok: false, message: 'El abono no puede superar el saldo pendiente del crédito.' }
    }
    const balance = (amount - previousPaid - newPayment) / 100

    if (payload.id && currentCredit) {
      const { data, error } = await supabase
        .from('credits')
        .update({
          user_id: payload.customerId,
          amount: payload.amount,
          balance,
          description: payload.notes || null,
          issued_by: issuedBy,
          expires_at: payload.dueDate ? `${payload.dueDate}T23:59:59.999Z` : null,
        })
        .eq('id', payload.id)
        .eq('amount', currentCredit.amount)
        .eq('balance', currentCredit.balance)
        .select('id')
        .maybeSingle()

      if (error) return { ok: false, message: error.message }
      if (!data) return { ok: false, message: 'El crédito cambió en otra sesión. Actualizá el listado e intentá de nuevo.' }
      return { ok: true }
    }

    const { error } = await supabase.from('credits').insert({
      user_id: payload.customerId,
      amount: payload.amount,
      balance,
      type: 'issued',
      description: payload.notes || null,
      issued_by: issuedBy,
      expires_at: payload.dueDate ? `${payload.dueDate}T23:59:59.999Z` : null,
    })

    if (error) return { ok: false, message: error.message }
    return { ok: true }
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : 'Error desconocido.' }
  }
}

export async function deleteCredit(id: string): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    await requireStaffUser()
    const parsed = z.string().uuid().safeParse(id)
    if (!parsed.success) return { ok: false, message: 'Crédito inválido.' }

    const supabase = createAdminClient()
    const { error } = await supabase.from('credits').delete().eq('id', parsed.data)

    if (error) return { ok: false, message: error.message }
    return { ok: true }
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : 'Error desconocido.' }
  }
}

