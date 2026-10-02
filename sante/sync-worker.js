/* ============================================================
   Endpoint de synchronisation Santé — Cloudflare Worker (gratuit)
   ------------------------------------------------------------
   Rôle : ton iPhone POSTe ici le JSON de tes données Santé ;
   l'app le récupère en GET à chaque ouverture. Rien d'autre ne
   le lit (protégé par un jeton). Le stockage est ton compte à toi.

   MISE EN PLACE (une seule fois) :
   1. Crée un compte gratuit sur https://dash.cloudflare.com
   2. Workers & Pages → Create → Worker → colle ce fichier → Deploy
   3. Onglet "Settings" du Worker :
        • Variables : ajoute  SYNC_TOKEN  = un mot de passe de ton choix
        • KV namespace : crée-en un, puis "Bindings" → Variable name: HEALTH
   4. Note l'URL du Worker (ex. https://ma-sante.toncompte.workers.dev)
   5. Dans l'app (onglet Données → ☁️ Sync automatique) :
        URL = cette URL   ·   Jeton = ton SYNC_TOKEN
   6. Sur l'iPhone (Health Auto Export → Automations → REST API) :
        URL = cette URL, méthode POST, header  Authorization: Bearer <jeton>
        format JSON, métriques : vo2_max, resting_heart_rate,
        weight_body_mass, sleep_analysis + Workouts. Fréquence : quotidienne.
   ============================================================ */

const KEY = "latest";

function cors() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Authorization,Content-Type",
  };
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: cors() });
    }

    // Contrôle du jeton (header Bearer OU ?token=…)
    const token = env.SYNC_TOKEN || "";
    if (token) {
      const auth = (request.headers.get("Authorization") || "").replace("Bearer ", "").trim();
      const qtok = new URL(request.url).searchParams.get("token") || "";
      if (auth !== token && qtok !== token) {
        return new Response("unauthorized", { status: 401, headers: cors() });
      }
    }

    if (request.method === "POST") {
      const body = await request.text();
      try { JSON.parse(body); } catch (e) {
        return new Response("bad json", { status: 400, headers: cors() });
      }
      await env.HEALTH.put(KEY, body);
      return new Response(JSON.stringify({ ok: true, bytes: body.length }), {
        headers: { ...cors(), "Content-Type": "application/json" },
      });
    }

    // GET : renvoie le dernier JSON reçu
    const data = await env.HEALTH.get(KEY);
    return new Response(data || "{}", {
      headers: { ...cors(), "Content-Type": "application/json" },
    });
  },
};
