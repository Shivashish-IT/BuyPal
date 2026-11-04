import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { pool } from '../db/pool.js';
import { env } from '../config/env.js';
import { asyncHandler } from '../utils/async-handler.js';
import { requireAuth } from '../middleware/require-auth.js';

const router = Router();
const createOrderSchema = z.object({
  itemName: z.string().trim().min(1).max(120),
  amount: z.string().regex(/^\\d{1,7}\\.\\d{2}$/),
});

let accessToken;
let tokenExpiresAt = 0;

async function getAccessToken() {
  if (!env.paypal.clientId || !env.paypal.clientSecret) {
    const error = new Error('PayPal Sandbox credentials are not configured on the server.');
    error.status = 503;
    throw error;
  }

  if (accessToken && Date.now() < tokenExpiresAt - 60_000) return accessToken;

  const basic = Buffer.from(`${env.paypal.clientId}:${env.paypal.clientSecret}`).toString('base64');
  const response = await fetch(`${env.paypal.baseUrl}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  const data = await response.json();
  if (!response.ok || !data.access_token) {
    console.error('PayPal OAuth request failed:', data.error || response.status);
    const error = new Error('Could not authenticate with PayPal Sandbox.');
    error.status = 502;
    throw error;
  }

  accessToken = data.access_token;
  tokenExpiresAt = Date.now() + Number(data.expires_in || 300) * 1000;
  return accessToken;
}

async function paypalCall(path, token, { method = 'GET', body, requestId } = {}) {
  const response = await fetch(`${env.paypal.baseUrl}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(requestId ? { 'PayPal-Request-Id': requestId } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    console.error('PayPal API request failed:', data.name || response.status);
    const error = new Error('PayPal Sandbox request failed.');
    error.status = 502;
    throw error;
  }
  return data;
}

// Demo integration endpoint: amount is supplied by the authenticated client.
// Before production, derive price and currency from a server-validated cart/catalogue.
router.post('/orders', requireAuth, asyncHandler(async (req, res) => {
  const parsed = createOrderSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Provide an item name and an amount such as 19.99.' });
  }

  const token = await getAccessToken();
  const order = await paypalCall('/v2/checkout/orders', token, {
    method: 'POST',
    requestId: randomUUID(),
    body: {
      intent: 'CAPTURE',
      purchase_units: [{
        reference_id: 'buypal-demo-checkout',
        description: parsed.data.itemName,
        amount: { currency_code: env.paypal.currency, value: parsed.data.amount },
      }],
      application_context: {
        brand_name: 'BuyPal',
        user_action: 'PAY_NOW',
        return_url: `${env.frontendOrigin}/checkout/paypal/return`,
        cancel_url: `${env.frontendOrigin}/checkout/paypal/cancel`,
      },
    },
  });

  const approvalUrl = order.links?.find(link => link.rel === 'approve')?.href;
  if (!order.id || !approvalUrl) {
    const error = new Error('PayPal did not return an order approval link.');
    error.status = 502;
    throw error;
  }

  await pool.query(
    `INSERT INTO paypal_orders (user_id, paypal_order_id, item_name, amount, currency, status)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [req.user.id, order.id, parsed.data.itemName, parsed.data.amount, env.paypal.currency, order.status || 'CREATED'],
  );

  return res.status(201).json({
    orderId: order.id,
    status: order.status,
    approvalUrl,
  });
}));

router.post('/orders/:orderId/capture', requireAuth, asyncHandler(async (req, res) => {
  const saved = await pool.query(
    'SELECT paypal_order_id, status FROM paypal_orders WHERE paypal_order_id = $1 AND user_id = $2',
    [req.params.orderId, req.user.id],
  );
  if (!saved.rowCount) return res.status(404).json({ message: 'PayPal order not found.' });
  if (saved.rows[0].status === 'COMPLETED') {
    return res.json({ orderId: req.params.orderId, status: 'COMPLETED', alreadyCaptured: true });
  }

  const token = await getAccessToken();
  const current = await paypalCall(`/v2/checkout/orders/${encodeURIComponent(req.params.orderId)}`, token);
  if (current.status !== 'APPROVED') {
    return res.status(409).json({ message: 'The PayPal buyer has not approved this order yet.', status: current.status });
  }

  const capture = await paypalCall(
    `/v2/checkout/orders/${encodeURIComponent(req.params.orderId)}/capture`,
    token,
    { method: 'POST', body: {}, requestId: `buypal-${req.params.orderId}`.slice(0, 38) },
  );
  const status = capture.status || 'PENDING';
  await pool.query(
    'UPDATE paypal_orders SET status = $1, updated_at = NOW() WHERE paypal_order_id = $2 AND user_id = $3',
    [status, req.params.orderId, req.user.id],
  );

  return res.json({ orderId: capture.id, status });
}));

export default router;
