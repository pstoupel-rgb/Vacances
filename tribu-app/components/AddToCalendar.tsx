'use client';

function pad(n: number) {
  return String(n).padStart(2, '0');
}

export default function AddToCalendar({ title, date, time, place }: { title: string; date: string | null; time: string | null; place: string | null }) {
  if (!date) return null;

  function build() {
    if (!date) return;
    let dtStart: string;
    let dtEnd: string;
    let allDay = false;
    if (time) {
      const start = new Date(`${date}T${time}:00`);
      const end = new Date(start.getTime() + 2 * 60 * 60 * 1000); // +2h
      const fmt = (d: Date) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
      dtStart = fmt(start);
      dtEnd = fmt(end);
    } else {
      allDay = true;
      dtStart = date.replace(/-/g, '');
      const d = new Date(`${date}T00:00:00`);
      d.setDate(d.getDate() + 1);
      dtEnd = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
    }
    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Vini//FR',
      'BEGIN:VEVENT',
      `UID:${Date.now()}@vini`,
      `DTSTAMP:${dtStart}${allDay ? '' : ''}`,
      allDay ? `DTSTART;VALUE=DATE:${dtStart}` : `DTSTART:${dtStart}`,
      allDay ? `DTEND;VALUE=DATE:${dtEnd}` : `DTEND:${dtEnd}`,
      `SUMMARY:${title.replace(/\n/g, ' ')}`,
      place ? `LOCATION:${place.replace(/\n/g, ' ')}` : '',
      'END:VEVENT',
      'END:VCALENDAR',
    ]
      .filter(Boolean)
      .join('\r\n');
    const blob = new Blob([ics], { type: 'text/calendar' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'vini-event.ics';
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  return (
    <button className="btn ghost small" onClick={build}>
      📅 Calendrier
    </button>
  );
}
