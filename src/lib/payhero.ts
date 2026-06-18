/**
 * PayHero M-Pesa STK Push integration
 * Docs: https://backend.payhero.co.ke/api/v2/payments/stk-push
 */

export interface StkPushPayload {
  amount: number
  phone_number: string   // Safaricom format: 254XXXXXXXXX
  channel_id: number
  provider: string       // "m-pesa"
  external_reference: string
  callback_url: string
}

export interface StkPushResult {
  success: boolean
  checkoutId: string | null
  raw: Record<string, unknown>
  error?: string
}

/**
 * Normalise any Kenyan phone format to 254XXXXXXXXX
 * Accepts: 07XXXXXXXX, 01XXXXXXXX, +254XXXXXXXXX, 254XXXXXXXXX
 */
export function normalisePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('254') && digits.length === 12) return digits
  if (digits.startsWith('0') && digits.length === 10) return '254' + digits.slice(1)
  if (digits.startsWith('7') && digits.length === 9) return '254' + digits
  if (digits.startsWith('1') && digits.length === 9) return '254' + digits
  // Return as-is and let the API reject it if invalid
  return digits
}

/**
 * Initiate an M-Pesa STK Push via PayHero.
 * Returns the CheckoutRequestID on success, or throws on failure.
 */
export async function initiateStkPush(
  phone: string,
  amount: number,
  externalReference: string
): Promise<StkPushResult> {
  const authToken = process.env.PAYHERO_AUTH_TOKEN
  const channelId = process.env.PAYHERO_CHANNEL_ID
  const stkUrl =
    process.env.PAYHERO_STK_PUSH_URL ||
    'https://backend.payhero.co.ke/api/v2/payments/stk-push'
  const callbackUrl =
    (process.env.NEXT_PUBLIC_APP_BASE_URL || '').replace(/\/$/, '') +
    '/api/webhook'

  if (!authToken || !channelId) {
    return {
      success: false,
      checkoutId: null,
      raw: {},
      error: 'PayHero credentials not configured (PAYHERO_AUTH_TOKEN / PAYHERO_CHANNEL_ID)',
    }
  }

  const payload: StkPushPayload = {
    amount: Math.round(amount),
    phone_number: normalisePhone(phone),
    channel_id: Number(channelId),
    provider: 'm-pesa',
    external_reference: externalReference,
    callback_url: callbackUrl,
  }

  try {
    const res = await fetch(stkUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authToken,
      },
      body: JSON.stringify(payload),
    })

    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>

    if (!res.ok) {
      const errMsg =
        (data.message as string) ||
        (data.error as string) ||
        `PayHero HTTP ${res.status}`
      return { success: false, checkoutId: null, raw: data, error: errMsg }
    }

    // PayHero returns CheckoutRequestID on success
    const checkoutId =
      (data.CheckoutRequestID as string) ||
      (data.checkout_id as string) ||
      (data.reference as string) ||
      null

    return { success: true, checkoutId, raw: data }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown network error'
    return { success: false, checkoutId: null, raw: {}, error: message }
  }
}
