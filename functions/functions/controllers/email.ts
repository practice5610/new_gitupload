import * as sendgrid from '@sendgrid/mail'
import * as functions from 'firebase-functions'
// import * as Mailgen from '@silverstone/mailgen'

/**
 * Initialize SendGrid
 */
const SENDGRID_API_KEY = functions.config().sendgrid.key
sendgrid.setApiKey(SENDGRID_API_KEY)

export function send(mailOptions: any) {
    return sendgrid.send(mailOptions)
}

export function sendMultiple(mailOptions: any) {
    return sendgrid.sendMultiple(mailOptions)
}