import nodemailer from 'nodemailer'

interface SendEmailArgs {
  to: string
  subject: string
  text: string
  html?: string
}

interface SendEmailResult {
  delivered: boolean
  reason?: string
}

let transporter: nodemailer.Transporter | null = null

const getTransporter = () => {
  if (transporter) {
    return transporter
  }

  const host = process.env.SMTP_HOST
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  if (!host || !port || !user || !pass) {
    return null
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass
    }
  })

  return transporter
}

export const sendEmail = async ({ to, subject, text, html }: SendEmailArgs): Promise<SendEmailResult> => {
  const smtpTransporter = getTransporter()

  if (!smtpTransporter) {
    return { delivered: false, reason: 'SMTP_NOT_CONFIGURED' }
  }

  const from = process.env.SMTP_FROM || process.env.SMTP_USER

  if (!from) {
    return { delivered: false, reason: 'SMTP_FROM_NOT_CONFIGURED' }
  }

  await smtpTransporter.sendMail({
    from,
    to,
    subject,
    text,
    html
  })

  return { delivered: true }
}
