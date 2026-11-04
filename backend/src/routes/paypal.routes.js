import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { PayPalOrder } from '../models/PayPalOrder.js';
import { env } from '../config/env.js';
import { asyncHandler } from '../utils/async-handler.js';
import { requireAuth } from '../middleware/require-auth.js';

const router = Router();
const createOrderSchema = z.object({
  itemName: z.string().trim().min(1).max(120),
  amount: z.string().regex(/^\d{1,7}\.\d{2}$/).refine(value => Number(value) > 0),
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

  const basic = Buffer.from(\`\${env.paypal.clientId}:\${env.paypal.clientSecret}\`).toString('base64');
  const response = await fetch(\`\${env.paypal.baseUrl}/v1/oauth2/token\`, {
    method: 'POST',
    headers: {
      Authorization: \`Basic \${basic}\`,
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
  const response = await fetch(\`\${env.paypal.baseUrl}\${path}\`, {
    method,
    headers: {
      Authorization: \`Bearer \${token}\`,
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

// Demo integration: amount is supplied by the signed-in client.
// Production must derive price and currency from a server-validated cart/catalogue.
router.post('/orders', requireAuth, asyncHandler(async (req, res) => {
  const parsed = createOrderSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Provide an item name and a positive amount such as 19.99.' });
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
        return_url: \`\${env.frontendOrigin}/checkout/paypal/return\`,
        cancel_url: \`\${env.frontendOrigin}/checkout/paypal/cancel\`,
      },
    },
  });

  const approvalUrl = order.links?.find(link => link.rel === 'approve')?.href;
  if (!order.id || !approvalUrl) {
    const error = new Error('PayPal did not return an order approval link.');
    error.status = 502;
    throw error;
  }

  await PayPalOrder.create({
    userId: req.user.id,
    paypalOrderId: order.id,
    itemName: parsed.data.itemName,
    amount: parsed.data.amount,
    currency: env.paypal.currency,
    status: order.status || 'CREATED',
  });

  return res.status(201).json({ orderId: order.id, status: order.status, approvalUrl });
}));

router.post('/orders/:orderId/capture', requireAuth, asyncHandler(async (req, res) => {
  const saved = await PayPalOrder.findOne({
    paypalOrderId: req.params.orderId,
    userId: req.user.id,
  });
  if (!saved) return res.status(404).json({ message: 'PayPal order not found.' });
  if (saved.status === 'COMPLETED') {
    return res.json({ orderId: req.params.orderId, status: 'COMPLETED', alreadyCaptured: true });
  }
  if (saved.status === 'CAPTURING') {
    return res.status(409).json({ message: 'This payment is already being captured. Please check again shortly.' });
  }

  const token = await getAccessToken();
  const current = await paypalCall(\`/v2/checkout/orders/\${encodeURIComponent(req.params.orderId)}\`, token);
  if (current.status !== 'APPROVED') {
    return res.status(409).json({ message: 'The PayPal buyer has not approved this order yet.', status: current.status });
  }

  // Claim the capture atomically so two concurrent requests cannot both start it.
  const claimed = await PayPalOrder.findOneAndUpdate(
    { _id: saved._id, status: { $nin: ['COMPLETED', 'CAPTURING'] } },
    { $set: { status: 'CAPTURING' } },
    { new: true },
  );
  if (!claimed) {
    const latest = await PayPalOrder.findById(saved._id).lean();
    if (latest?.status === 'COMPLETED') {
      return res.json({ orderId: req.params.orderId, status: 'COMPLETED', alreadyCaptured: true });
    }
    return res.status(409).json({ message: 'This payment is already being processed. Please check again shortly.' });
  }

  try {
    const capture = await paypalCall(
      \`/v2/checkout/orders/\${encodeURIComponent(req.params.orderId)}/capture\`,
      token,
      { method: 'POST', body: {}, requestId: \`buypal-\${req.params.orderId}\`.slice(0, 38) },
    );
    const status = capture.status || 'PENDING';
    const captureId = capture.purchase_units?.[0]?.payments?.captures?.[0]?.id || null;
    await PayPalOrder.updateOne(
      { _id: saved._id },
      { $set: { status, captureId } },
    );
    return res.json({ orderId: capture.id, status });
  } catch (error) {
    await PayPalOrder.updateOne({ _id: saved._id, status: 'CAPTURING' }, { $set: { status: 'APPROVED' } });
    throw error;
  }
}));

export default router;
