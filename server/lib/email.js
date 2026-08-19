const { Resend } = require('resend');

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM = process.env.EMAIL_FROM || 'Yuuban <hola@yuuban.mx>';
const BASE_URL = process.env.CORS_ORIGIN || 'http://localhost:3000';

const fmtPrice = (cents) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 }).format(cents / 100);

const ticketEmailHtml = ({ name, eventTitle, eventDate, eventLocation, ticketUrl, paid, priceCents }) => `
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
            <div style="display:inline-block;background:rgba(255,255,255,0.15);border-radius:12px;padding:10px 14px;margin-bottom:16px">
              <span style="font-size:24px">🎵</span>
            </div>
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

const sendTicketEmail = async ({ to, name, eventTitle, eventDate, eventLocation, ticketUrl, paid = false, priceCents = 0 }) => {
  if (!resend) {
    console.log(`[email] Sin Resend configurado — correo NO enviado a ${to}`);
    return;
  }
  try {
    await resend.emails.send({
      from: FROM,
      to,
      subject: `🎵 Tu ticket para ${eventTitle}`,
      html: ticketEmailHtml({ name, eventTitle, eventDate, eventLocation, ticketUrl, paid, priceCents }),
    });
    console.log(`[email] Ticket enviado a ${to}`);
  } catch (err) {
    console.error(`[email] Error al enviar a ${to}:`, err.message);
  }
};

module.exports = { sendTicketEmail };
