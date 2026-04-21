import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM   = process.env.RESEND_FROM ?? 'TapCard <noreply@tapcard.io>'
const APP    = process.env.NEXT_PUBLIC_APP_URL ?? 'https://tapcard-v3ml.vercel.app'

interface ContactCard {
  name:     string
  role?:    string | null
  company?: string | null
  handle:   string
  gradient?: { c1: string; c2: string } | null
}

export async function sendConnectionEmail(
  toEmail:  string,
  owner:    ContactCard,   // card owner (recipient)
  contact:  ContactCard,   // visitor who shared back
): Promise<void> {
  if (!process.env.RESEND_API_KEY) return   // silently skip if not configured

  const c1   = contact.gradient?.c1 ?? '#6D28D9'
  const c2   = contact.gradient?.c2 ?? '#DB2777'
  const grad = `linear-gradient(140deg, ${c1}, ${c2})`
  const contactUrl = `${APP}/${contact.handle}`
  const initials   = contact.name.split(' ').slice(0, 2).map(w => w[0] ?? '').join('').toUpperCase() || 'TC'
  const subtitle   = [contact.role, contact.company].filter(Boolean).join(' · ')

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Nouvelle connexion TapCard</title>
</head>
<body style="margin:0;padding:0;background:#F2F2F7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F2F2F7;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;">

        <!-- Logo / header -->
        <tr><td style="padding-bottom:24px;text-align:center;">
          <span style="font-size:11px;font-weight:400;letter-spacing:2px;text-transform:uppercase;color:#8E8E93;">
            TAPCARD · ONE TAP. REAL CONNECTION.
          </span>
        </td></tr>

        <!-- Card visuel contact -->
        <tr><td style="padding-bottom:20px;">
          <table width="100%" cellpadding="0" cellspacing="0"
            style="background:${grad};border-radius:20px;overflow:hidden;">
            <tr><td style="padding:28px 24px 22px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="vertical-align:top;">
                    <div style="font-family:Georgia,serif;font-size:26px;font-weight:700;color:#fff;
                      line-height:1.1;letter-spacing:-0.5px;">${escHtml(contact.name)}</div>
                    ${subtitle ? `<div style="font-size:13px;color:rgba(255,255,255,.72);margin-top:6px;">${escHtml(subtitle)}</div>` : ''}
                  </td>
                  <td width="52" style="vertical-align:top;padding-left:12px;">
                    <div style="width:52px;height:52px;border-radius:14px;background:rgba(255,255,255,.22);
                      display:flex;align-items:center;justify-content:center;
                      font-family:Georgia,serif;font-size:18px;font-weight:700;color:#fff;
                      text-align:center;line-height:52px;">${escHtml(initials)}</div>
                  </td>
                </tr>
              </table>
              <div style="margin-top:20px;font-size:12px;color:rgba(255,255,255,.42);letter-spacing:.4px;">
                tapcard.io/${escHtml(contact.handle)}
              </div>
            </td></tr>
          </table>
        </td></tr>

        <!-- Main message -->
        <tr><td style="background:#fff;border-radius:16px;padding:28px 24px;margin-bottom:12px;">
          <p style="margin:0 0 8px;font-size:22px;font-weight:600;color:#1C1C1E;letter-spacing:-0.3px;">
            Nouvelle connexion 🎉
          </p>
          <p style="margin:0 0 24px;font-size:15px;color:#636366;line-height:1.6;">
            <strong style="color:#1C1C1E;">${escHtml(contact.name)}</strong> a scanné ta carte
            et a partagé la sienne en retour. Tu peux maintenant la retrouver dans tes contacts TapCard.
          </p>

          <!-- CTA -->
          <table cellpadding="0" cellspacing="0" width="100%">
            <tr><td align="center">
              <a href="${contactUrl}"
                style="display:inline-block;padding:14px 32px;background:${grad};
                  border-radius:12px;color:#fff;font-size:15px;font-weight:600;
                  text-decoration:none;letter-spacing:.2px;">
                Voir la carte de ${escHtml(contact.name.split(' ')[0] ?? contact.name)}
              </a>
            </td></tr>
          </table>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:20px 0 0;text-align:center;">
          <p style="margin:0;font-size:11px;color:#AEAEB2;line-height:1.7;">
            Tu reçois cet email car quelqu'un a partagé sa carte avec toi via
            <a href="${APP}" style="color:#AEAEB2;">tapcard.io</a>.<br/>
            Carte : <a href="${APP}/${owner.handle}" style="color:#AEAEB2;">tapcard.io/${escHtml(owner.handle)}</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`

  try {
    await resend.emails.send({
      from:    FROM,
      to:      toEmail,
      subject: `${contact.name} a partagé sa carte avec toi 👋`,
      html,
    })
  } catch (err) {
    console.error('[sendConnectionEmail]', err)
    // Never throw — email failure must not break the connection creation
  }
}

function escHtml(s: string): string {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
}
