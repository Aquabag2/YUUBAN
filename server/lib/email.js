const { Resend } = require('resend');

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

// Todo texto que venga del usuario pasa por aquí antes de entrar al HTML del correo
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const FROM = process.env.EMAIL_FROM || 'Yuuban <hola@yuuban.mx>';
const BASE_URL = process.env.APP_URL || process.env.CORS_ORIGIN || 'http://localhost:3000';
// URL pública de un PNG (Gmail/Outlook no muestran SVG). Ej.: https://tudominio.com/logo-email.png
const LOGO_URL = process.env.EMAIL_LOGO_URL || '';
const logoImg = (alt = 'Yuuban') =>
  `<img src="${esc(LOGO_URL)}" alt="${alt}" height="40" style="display:block;height:40px;width:auto;border:0">`;

const fmtPrice = (cents) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 }).format(cents / 100);

const ticketEmailHtml = (raw) => {
  const { paid, priceCents } = raw;
  const name = esc(raw.name), eventTitle = esc(raw.eventTitle), eventDate = esc(raw.eventDate);
  const eventLocation = esc(raw.eventLocation), ticketUrl = esc(raw.ticketUrl);
  return `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0f172a;font-family:'Helvetica Neue',Arial,sans-serif;color:#f8fafc">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:40px 20px">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#1e293b;border-radius:20px;overflow:hidden;border:1px solid rgba(255,255,255,0.08)">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#7c3aed,#4f46e5);padding:36px 40px;text-align:center">
            ${LOGO_URL
              ? `<div style="display:inline-block;margin-bottom:16px">${logoImg()}</div>`
              : `<div style="display:inline-block;background:rgba(255,255,255,0.15);border-radius:12px;padding:10px 14px;margin-bottom:16px"><span style="font-size:24px">🎵</span></div>`}
            <h1 style="margin:0;font-size:26px;font-weight:700;color:#fff;letter-spacing:-0.5px">¡Estás inscrito!</h1>
            <p style="margin:8px 0 0;font-size:15px;color:rgba(255,255,255,0.75)">${eventTitle}</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:36px 40px">
            <p style="margin:0 0 24px;font-size:15px;color:#94a3b8">Hola <strong style="color:#f1f5f9">${name}</strong>, tu lugar está confirmado. Aquí están los detalles:</p>

            <!-- Info del evento -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;border-radius:14px;padding:4px;margin-bottom:28px">
              <tr>
                <td style="padding:14px 18px;border-bottom:1px solid rgba(255,255,255,0.06)">
                  <span style="font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.05em">Evento</span>
                  <div style="font-size:15px;font-weight:600;color:#f1f5f9;margin-top:4px">${eventTitle}</div>
                </td>
              </tr>
              ${eventDate ? `<tr><td style="padding:14px 18px;border-bottom:1px solid rgba(255,255,255,0.06)">
                <span style="font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.05em">Fecha</span>
                <div style="font-size:15px;color:#f1f5f9;margin-top:4px">${eventDate}</div>
              </td></tr>` : ''}
              ${eventLocation ? `<tr><td style="padding:14px 18px;border-bottom:1px solid rgba(255,255,255,0.06)">
                <span style="font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.05em">Lugar</span>
                <div style="font-size:15px;color:#f1f5f9;margin-top:4px">${eventLocation}</div>
              </td></tr>` : ''}
              <tr><td style="padding:14px 18px">
                <span style="font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.05em">Pago</span>
                <div style="font-size:15px;margin-top:4px">
                  ${paid && priceCents > 0
                    ? `<span style="color:#34d399;font-weight:600">✓ Pagado — ${fmtPrice(priceCents)}</span>`
                    : `<span style="color:#a78bfa;font-weight:600">✓ Gratuito</span>`}
                </div>
              </td></tr>
            </table>

            <!-- CTA -->
            <div style="text-align:center;margin-bottom:28px">
              <a href="${BASE_URL}${ticketUrl}"
                style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:#fff;text-decoration:none;padding:14px 32px;border-radius:12px;font-size:15px;font-weight:600;letter-spacing:-0.2px">
                Ver mi ticket QR 🎟️
              </a>
            </div>

            <p style="margin:0;font-size:13px;color:#475569;text-align:center;line-height:1.6">
              Presenta este ticket en la entrada del evento.<br>Guarda este correo o el link de tu ticket.
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#0f172a;padding:20px 40px;text-align:center;border-top:1px solid rgba(255,255,255,0.06)">
            <p style="margin:0;font-size:12px;color:#334155">Yuuban · Plataforma de gestión de festivales musicales</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
};

const sendTicketEmail = async ({ to, name, eventTitle, eventDate, eventLocation, ticketUrl, paid = false, priceCents = 0 }) => {
  if (!resend) {
    console.log(`[email] Sin Resend configurado — correo NO enviado a ${to}`);
    return;
  }
  try {
    await resend.emails.send({
      from: FROM,
      to,
      subject: `🎵 Tu ticket para ${String(eventTitle).replace(/[\r\n]/g, ' ')}`,
      html: ticketEmailHtml({ name, eventTitle, eventDate, eventLocation, ticketUrl, paid, priceCents }),
    });
    console.log(`[email] Ticket enviado a ${to}`);
  } catch (err) {
    console.error(`[email] Error al enviar a ${to}:`, err.message);
  }
};

// ── Correos de cuenta (confirmación, acceso sin contraseña, recuperación) ─────
const AUTH_COPY = {
  signup: {
    subject: 'Confirma tu cuenta en Yuuban',
    title: 'Confirma tu correo',
    text: 'Gracias por unirte a Yuuban. Confirma que este correo es tuyo para activar tu cuenta.',
    cta: 'Confirmar mi cuenta',
  },
  magiclink: {
    subject: 'Tu enlace para entrar a Yuuban',
    title: 'Entra con un clic',
    text: 'Usa este botón para entrar a tu cuenta. No necesitas contraseña.',
    cta: 'Entrar a Yuuban',
  },
  recovery: {
    subject: 'Restablece tu contraseña de Yuuban',
    title: 'Restablece tu contraseña',
    text: 'Recibimos una solicitud para cambiar tu contraseña. Si no fuiste tú, ignora este correo.',
    cta: 'Elegir nueva contraseña',
  },
};

const authEmailHtml = ({ title, text, cta, link }) => `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0e130f;font-family:'Helvetica Neue',Arial,sans-serif;color:#ece6d4">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0e130f;padding:40px 20px">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="max-width:520px;background:#172019;border:1px solid #2c3a2f">
        <tr><td style="padding:32px 40px 0">
          ${LOGO_URL ? logoImg() : '<div style="font-family:Georgia,serif;font-size:26px;color:#b9dc8f">Yuuban</div>'}
          <div style="height:2px;width:48px;background:#d1a95a;margin-top:12px"></div>
        </td></tr>
        <tr><td style="padding:28px 40px 36px">
          <h1 style="margin:0 0 12px;font-family:Georgia,serif;font-weight:normal;font-size:28px;color:#ece6d4">${esc(title)}</h1>
          <p style="margin:0 0 28px;font-size:15px;line-height:1.6;color:#a8ab98">${esc(text)}</p>
          <a href="${esc(link)}" style="display:inline-block;background:#b9dc8f;color:#0e130f;text-decoration:none;padding:14px 28px;font-size:15px;font-weight:600">${esc(cta)}</a>
          <p style="margin:28px 0 0;font-size:12px;line-height:1.6;color:#6f7466">
            El enlace caduca en 1 hora y solo funciona una vez.<br>
            Si el botón no abre, copia esta dirección en tu navegador:<br>
            <span style="color:#a8ab98;word-break:break-all">${esc(link)}</span>
          </p>
        </td></tr>
        <tr><td style="padding:18px 40px;border-top:1px solid #2c3a2f;font-size:12px;color:#6f7466">
          Yuuban · Festival de música y arte · Xalapa, Veracruz
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

// type: 'signup' | 'magiclink' | 'recovery'. Devuelve true si se envió.
const sendAuthEmail = async ({ to, type, link }) => {
  const copy = AUTH_COPY[type];
  if (!resend) {
    // En desarrollo se imprime el enlace para poder probar sin Resend
    console.log(`[email] Sin Resend — enlace de ${type} para ${to}: ${process.env.NODE_ENV === 'production' ? '(oculto)' : link}`);
    return false;
  }
  try {
    const { error } = await resend.emails.send({ from: FROM, to, subject: copy.subject, html: authEmailHtml({ ...copy, link }) });
    if (error) throw new Error(error.message);
    return true;
  } catch (err) {
    console.error(`[email] Error al enviar ${type} a ${to}:`, err.message);
    return false;
  }
};

module.exports = { sendTicketEmail, sendAuthEmail };
