const sb = require('./supabase');

// Interruptor de cobros. Apagado (por defecto): todo es gratis, no se usa Stripe y
// nadie queda bloqueado por "pago pendiente". Para cobrar: PAYMENTS_ENABLED=true
const PAYMENTS_ENABLED = process.env.PAYMENTS_ENABLED === 'true';

// Precio que ve el público (0 mientras los cobros estén apagados)
const publicPrice = (row) => (row && !PAYMENTS_ENABLED ? { ...row, price_cents: 0 } : row);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Devuelve un mensaje de error o null si los datos del asistente son válidos
const validateAttendee = ({ name, email, instrument, notes }) => {
  if (typeof name !== 'string' || typeof email !== 'string' || !name.trim() || !email.trim())
    return 'Nombre y correo son obligatorios';
  if (!EMAIL_RE.test(email.trim()) || email.length > 254) return 'Correo no válido';
  if (name.trim().length > 120) return 'El nombre es demasiado largo';
  if (instrument && (typeof instrument !== 'string' || instrument.length > 120)) return 'Instrumento no válido';
  if (notes && (typeof notes !== 'string' || notes.length > 1000)) return 'Las notas son demasiado largas';
  return null;
};

// Precio y nombre del plan elegido. El tipo de boleto debe ser de ESTE evento,
// estar activo y tener cupo; si no, alguien podría usar un boleto gratis de otro evento.
const resolveTicketType = async (ev, ticketTypeId) => {
  if (!ticketTypeId) {
    const { count } = await sb.from('event_ticket_types')
      .select('id', { count: 'exact', head: true }).eq('event_id', ev.id).eq('is_active', true);
    if (count > 0) return { status: 400, error: 'Elige un tipo de boleto' };
    return { effectivePrice: ev.price_cents ?? 0, ticketTypeName: null, productName: `Inscripción — ${ev.title}` };
  }

  const { data: tt } = await sb.from('event_ticket_types')
    .select('id, name, price_cents, capacity, is_active')
    .eq('id', ticketTypeId).eq('event_id', ev.id).maybeSingle();
  if (!tt || tt.is_active === false) return { status: 400, error: 'Tipo de boleto no válido' };

  if (tt.capacity) {
    const { count } = await sb.from('registrations')
      .select('id', { count: 'exact', head: true }).eq('ticket_type_id', tt.id);
    if (count >= tt.capacity) return { status: 409, error: `"${tt.name}" está agotado` };
  }

  return { effectivePrice: tt.price_cents ?? 0, ticketTypeName: tt.name, productName: `${tt.name} — ${ev.title}` };
};

module.exports = { PAYMENTS_ENABLED, publicPrice, validateAttendee, resolveTicketType };
