export type CreditStatus = 'Activo' | 'Pagado' | 'Vencido'

export type CreditCustomerOption = {
  id: string
  label: string
  email: string | null
}

export type CreditItem = {
  id: string
  customerId: string
  customer: string
  seller: string
  amount: number
  paid: number
  balance: number
  dueDate: string
  status: CreditStatus
  notes: string
  createdAt: string
}

export type CreditManagementData = {
  credits: CreditItem[]
  customers: CreditCustomerOption[]
}

