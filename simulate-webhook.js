/**
 * Webhook Simulation Test
 * Simulates a Stripe webhook without authentication
 */

const http = require('http');

// Create a mock Stripe webhook payload
const webhookPayload = {
  id: "evt_test_webhook",
  object: "event",
  api_version: "2020-08-27",
  created: Math.floor(Date.now() / 1000),
  data: {
    object: {
      id: "cs_test_a1euirfMMv0pZoVp0sSFtYFRH0fEPShUSv3H7zuq11jsDQwkvhgpj2r37z", // Use actual session ID from logs
      object: "checkout.session",
      payment_status: "paid",
      payment_intent: "pi_test_" + Date.now(),
      status: "complete"
    }
  },
  livemode: false,
  pending_webhooks: 1,
  request: {
    id: "req_test",
    idempotency_key: null
  },
  type: "checkout.session.completed"
};

console.log('🧪 Testing webhook simulation...');
console.log('📋 Mock payload for session:', webhookPayload.data.object.id);

// Try to POST to webhook endpoint
const postData = JSON.stringify(webhookPayload);

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/payments/webhook',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData),
    // Note: In real scenario, this would need proper Stripe signature
    'stripe-signature': 't=test,v1=test_signature'
  }
};

const req = http.request(options, (res) => {
  console.log(`📡 Response status: ${res.statusCode}`);
  console.log(`📡 Response headers:`, res.headers);
  
  let responseBody = '';
  res.on('data', (chunk) => {
    responseBody += chunk;
  });
  
  res.on('end', () => {
    console.log('📨 Response body:', responseBody);
    
    if (res.statusCode === 200) {
      console.log('✅ Webhook endpoint is working perfectly!');
    } else if (res.statusCode === 400) {
      console.log('⚠️  Webhook endpoint returned 400 (likely signature verification failed)');
      console.log('🎉 This means the webhook endpoint IS accessible - it just needs proper Stripe signature!');
    } else {
      console.log(`❌ Unexpected status: ${res.statusCode}`);
    }
  });
});

req.on('error', (e) => {
  console.error('❌ Request failed:', e.message);
});

req.write(postData);
req.end();