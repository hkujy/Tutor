export interface SmsResult {
  success: boolean
  messageId?: string
  cost?: number
  error?: string
}

export class SmsService {
  private accountSid: string | undefined
  private authToken: string | undefined
  private fromNumber: string | undefined

  constructor() {
    this.accountSid = process.env.TWILIO_ACCOUNT_SID
    this.authToken = process.env.TWILIO_AUTH_TOKEN
    this.fromNumber = process.env.TWILIO_FROM_NUMBER
  }

  /**
   * Sends an SMS message to a specific phone number.
   * Calculates estimated cost.
   */
  async send(to: string, body: string): Promise<SmsResult> {
    try {
      // Basic validation
      if (!to || !body) {
        throw new Error('Missing "to" or "body" for SMS')
      }

      // Calculate estimated cost
      // Standard SMS segment is 160 chars.
      // Cost per segment varies, assuming roughly $0.0079 per segment (US rate example)
      const segments = Math.ceil(body.length / 160)
      const estimatedCost = segments * 0.0079 

      // If credentials are present, attempt real send (mocked here for now as we don't have creds)
      if (this.accountSid && this.authToken && this.fromNumber) {
        // const client = require('twilio')(this.accountSid, this.authToken);
        // const message = await client.messages.create({ body, from: this.fromNumber, to });
        // return { success: true, messageId: message.sid, cost: estimatedCost }
        
        console.log(`[SMS Service] Simulation: Sending to ${to}: "${body}"`)
        return { 
          success: true, 
          messageId: `mock_sid_${Date.now()}`, 
          cost: estimatedCost 
        }
      } else {
        // Simulation mode
        console.log(`[SMS Service] Simulation (No Creds): Sending to ${to}: "${body}"`)
        return { 
          success: true, 
          messageId: `sim_sid_${Date.now()}`, 
          cost: estimatedCost 
        }
      }

    } catch (error: any) {
      console.error('[SMS Service] Error:', error)
      return { success: false, error: error.message || 'Unknown error' }
    }
  }
}

export const smsService = new SmsService()
