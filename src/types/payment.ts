export interface Package {
  id: string
  name: string
  price: number
  duration: number // minutes
}

export interface Payment {
  id: string
  phone: string
  packageId: string
  amount: number
  status: 'pending' | 'paid' | 'failed' | 'cancelled'
  createdAt: string
  checkoutId: string
}

export interface CreatePaymentRequest {
  phone?: string
  PhoneNumber?: string
  Amount?: number
  packageId?: string
  Provider?: string
}

export type StkPushResponse = {
  CheckoutRequestID: string
  ResponseCode: string
  ResponseDescription: string
}

