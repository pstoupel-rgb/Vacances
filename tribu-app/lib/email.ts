// Envoi d'emails via l'API Resend (https://resend.com).
// Aucune dépendance : appel REST direct. Si RESEND_API_KEY est absent, on ne fait rien
// (l'invitation reste valable : la personne rejoint en se connectant avec son email).

export async function sendInviteEmails(
  emails: string[],
  opts: { inviterName: string; groupName: string; eventTitle?: string }
) {
  const key = process.env.RESEND_API_KEY;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
  if (!key || !emails.length) return;
  const from = process.env.EMAIL_FROM || 'Vini <onboarding@resend.dev>';

  const subject = opts.eventTitle
    ? `${opts.inviterName} t'invite : ${opts.eventTitle} 🍷`
    : `${opts.inviterName} t'invite sur Vini 🍷`;

  const html = `
    <div style="font-family:Inter,Arial,sans-serif;max-width:480px;margin:auto;color:#1c1530">
      <div style="background:linear-gradient(135deg,#7c3aed,#a855f7);border-radius:18px;padding:26px;text-align:center;color:#fff">
        <div style="font-size:34px">🍷</div>
        <div style="font-size:22px;font-weight:800;margin-top:6px">Vini</div>
      </div>
      <h2 style="margin:22px 0 8px">${esc(opts.inviterName)} t'invite ${opts.eventTitle ? `à « ${esc(opts.eventTitle)} »` : `dans « ${esc(opts.groupName)} »`}</h2>
      <p style="color:#555;line-height:1.5">Rejoins le groupe sur Vini pour organiser, partager les dépenses et régler en un tap.</p>
      <a href="${appUrl}/login" style="display:inline-block;background:#7c3aed;color:#fff;text-decoration:none;padding:14px 22px;border-radius:12px;font-weight:600;margin-top:12px">
        Rejoindre sur Vini
      </a>
      <p style="color:#999;font-size:12px;margin-top:20px">Connecte-toi avec cette adresse email pour rejoindre automatiquement.</p>
    </div>`;

  await Promise.all(
    emails.map((to) =>
      fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from, to, subject, html }),
      }).catch(() => {})
    )
  );
}

function esc(s: string) {
  return (s || '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
}
