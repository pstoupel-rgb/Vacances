import Stripe from 'stripe';

// Instance Stripe côté serveur uniquement (utilise la clé secrète).
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
  typescript: true,
});
