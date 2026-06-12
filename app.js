// Stockage local
function getVoyages() {
  return JSON.parse(localStorage.getItem('voyages') || '[]');
}

function saveVoyage(voyage) {
  const voyages = getVoyages();
  voyages.push(voyage);
  localStorage.setItem('voyages', JSON.stringify(voyages));
}

// Formatage
function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

function duree(depart, retour) {
  if (!depart || !retour) return '?';
  const d1 = new Date(depart);
  const d2 = new Date(retour);
  return Math.max(0, Math.round((d2 - d1) / 86400000));
}

function typeEmoji(type) {
  const map = { plage: '🏖️', culture: '🏛️', aventure: '🏔️', gastronomie: '🍽️', city: '🏙️', autre: '🌟' };
  return map[type] || '✈️';
}

// Rendu grille voyages (index.html)
function renderVoyages() {
  const el = document.getElementById('voyages-list');
  if (!el) return;
  const voyages = getVoyages();

  if (voyages.length === 0) {
    el.innerHTML = `
      <div class="empty-state">
        <span>🌍</span>
        <p>Aucun voyage planifié pour l'instant</p>
        <a href="planner.html" class="btn-primary">Planifier mon premier voyage</a>
      </div>`;
    return;
  }

  el.innerHTML = voyages.map(v => `
    <div class="voyage-card" onclick="window.location='activites.html?id=${v.id}'">
      <h3>${typeEmoji(v.type)} ${v.destination}</h3>
      <div class="dates">📅 ${formatDate(v.dateDepart)} → ${formatDate(v.dateRetour)} (${duree(v.dateDepart, v.dateRetour)} jours)</div>
      <div class="voyage-meta">
        <span>👥 ${v.nbPersonnes} pers.</span>
        ${v.budget > 0 ? `<span>💶 ${Number(v.budget).toLocaleString()} €</span>` : ''}
        ${(v.activites || []).length > 0 ? `<span>🎯 ${v.activites.length} activité(s)</span>` : ''}
      </div>
    </div>
  `).join('');
}

// Stats (index.html)
function updateStats() {
  const voyages = getVoyages();
  const totalJours = voyages.reduce((s, v) => s + duree(v.dateDepart, v.dateRetour), 0);
  const totalActs = voyages.reduce((s, v) => s + (v.activites || []).length, 0);

  const elV = document.getElementById('total-voyages');
  const elJ = document.getElementById('total-jours');
  const elA = document.getElementById('total-activites');
  if (elV) elV.textContent = voyages.length;
  if (elJ) elJ.textContent = totalJours;
  if (elA) elA.textContent = totalActs;
}

// Toast
function showToast(msg) {
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}
