import type { StkPushResponse } from '@/types/payment'

type StkPushParams = {
  phone: string
  amount: number
  checkoutId: string
  accountId?: string
  channelId?: string
}

/**
 * Initiate an STK push via PayHero (third-party provider).
 *
 * Requirements:
 * - `PAYHERO_STK_PUSH_URL` (full URL to the provider's STK push endpoint)
 * - `PAYHERO_BASIC_AUTH_TOKEN` (Basic auth token e.g. "Basic ...")
 * - optionally `PAYHERO_ACCOUNT_ID` and `PAYHERO_CHANNEL_ID` will be used if not provided
 */
export async function payheroStkPush(params: StkPushParams): Promise<StkPushResponse> {
  const url = process.env.PAYHERO_STK_PUSH_URL
  const auth = process.env.PAYHERO_BASIC_AUTH_TOKEN

  if (!url || !auth) throw new Error('PayHero not configured (missing PAYHERO_STK_PUSH_URL or PAYHERO_BASIC_AUTH_TOKEN)')

  const payload = {
    AccountId: params.accountId ?? process.env.PAYHERO_ACCOUNT_ID,
    ChannelId: params.channelId ?? process.env.PAYHERO_CHANNEL_ID,
    Amount: Number(params.amount),
    PhoneNumber: params.phone,
    CheckoutRequestID: params.checkoutId,
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: auth,
    },
    body: JSON.stringify(payload),
  })

  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    // Attempt to provide a helpful error message
    const message = (data && (data.error || data.message)) || `PayHero error: ${res.status}`
    throw new Error(message)
  }

  return data as StkPushResponse
}

export default payheroStkPush
