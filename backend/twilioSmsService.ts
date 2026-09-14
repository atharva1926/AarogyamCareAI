import twilio from 'twilio'

export interface SmsSendResult {
  success: boolean
  sid?: string
  status?: string
  usedTrialTemplate?: boolean
  error?: string
  errorCode?: number | string
  errorStatus?: number
  moreInfo?: string
}

export interface SmsConfigurationStatus {
  configured: boolean
  message: string
}

const e164PhonePattern = /^\+[1-9]\d{7,14}$/

type TwilioError = {
  code?: number | string
  message?: string
  status?: number
  moreInfo?: string
}

const trialAppointmentTemplate = 'sms_appointment_reminders'

export function isE164PhoneNumber(value: string): boolean {
  return e164PhonePattern.test(value.trim())
}

function twilioSettings() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim()
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim()
  const phoneNumber = process.env.TWILIO_PHONE_NUMBER?.trim()

  if (!accountSid || !authToken || !phoneNumber) {
    return null
  }

  if (!isE164PhoneNumber(phoneNumber)) {
    console.error('Twilio is not configured: TWILIO_PHONE_NUMBER must use E.164 format.')
    return null
  }

  return { accountSid, authToken, phoneNumber }
}

/** Safe to return to the browser: it never includes credential values. */
export function getSmsConfigurationStatus(): SmsConfigurationStatus {
  const settings = twilioSettings()
  return settings
    ? { configured: true, message: 'Twilio SMS is configured on the server.' }
    : { configured: false, message: 'Twilio SMS credentials or sender number are missing or invalid on the server.' }
}

/**
 * Sends one SMS using credentials that exist only on the Express server.
 * The return value deliberately contains no credentials or provider internals.
 */
export async function sendSms(to: string, body: string): Promise<SmsSendResult> {
  const recipient = to.trim()
  if (!isE164PhoneNumber(recipient)) {
    return { success: false, error: 'Use a phone number in international format, for example +919876543210.' }
  }

  const settings = twilioSettings()
  if (!settings) {
    return { success: false, error: 'SMS is not configured on the server yet.' }
  }

  const client = twilio(settings.accountSid, settings.authToken)
  const createMessage = (messageBody: string) => client.messages.create({
    body: messageBody,
    from: settings.phoneNumber,
    to: recipient,
  })

  try {
    const message = await createMessage(body.trim())

    return { success: true, sid: message.sid, status: message.status }
  } catch (error) {
    const twilioError = (error && typeof error === 'object' ? error : {}) as TwilioError
    const message = typeof twilioError.message === 'string'
      ? twilioError.message
      : error instanceof Error
        ? error.message
        : 'Unknown Twilio error'
    const code = twilioError.code
    const status = typeof twilioError.status === 'number' ? twilioError.status : undefined
    const moreInfo = typeof twilioError.moreInfo === 'string' ? twilioError.moreInfo : undefined

    // Twilio trials accept only the documented template names as the SMS body.
    // Keep custom messages for paid accounts, but retry a trial rejection with the appointment template.
    if (code === 572006 || code === '572006') {
      try {
        const trialMessage = await createMessage(trialAppointmentTemplate)
        console.info('Twilio trial template accepted for appointment reminder.')
        return {
          success: true,
          sid: trialMessage.sid,
          status: trialMessage.status,
          usedTrialTemplate: true,
        }
      } catch (trialError) {
        const retryError = (trialError && typeof trialError === 'object' ? trialError : {}) as TwilioError
        const retryMessage = typeof retryError.message === 'string'
          ? retryError.message
          : trialError instanceof Error
            ? trialError.message
            : 'Unknown Twilio error'
        const retryCode = retryError.code
        const retryStatus = typeof retryError.status === 'number' ? retryError.status : undefined
        const retryMoreInfo = typeof retryError.moreInfo === 'string' ? retryError.moreInfo : undefined
        console.error('Twilio SMS diagnostic:', { code: retryCode, message: retryMessage, status: retryStatus, moreInfo: retryMoreInfo })
        return {
          success: false,
          error: process.env.NODE_ENV !== 'production'
            ? `Twilio error${retryCode !== undefined ? ` ${retryCode}` : ''}: ${retryMessage}`
            : 'Twilio could not send the SMS. Check the configured account, sender, and recipient number.',
          errorCode: retryCode,
          errorStatus: retryStatus,
          moreInfo: retryMoreInfo,
        }
      }
    }

    // Deliberately log only Twilio's safe diagnostic fields; never log credentials or phone numbers.
    console.error('Twilio SMS diagnostic:', { code, message, status, moreInfo })
    const developmentMessage = `Twilio error${code !== undefined ? ` ${code}` : ''}: ${message}`
    return {
      success: false,
      error: process.env.NODE_ENV !== 'production'
        ? developmentMessage
        : 'Twilio could not send the SMS. Check the configured account, sender, and recipient number.',
      errorCode: code,
      errorStatus: status,
      moreInfo,
    }
  }
}
