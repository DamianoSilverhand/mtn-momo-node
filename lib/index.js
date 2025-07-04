//lib/index.js

require('dotenv').config();
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

// ───────────────────────────────────────────────────────────────────────────────
// 1) Configuration & Environment
// ───────────────────────────────────────────────────────────────────────────────
// Read MTN_MOMO_ENV directly—no fallback here
const MTN_MOMO_ENV = process.env.MTN_MOMO_ENV;
if (!MTN_MOMO_ENV) {
  throw new Error('MTN_MOMO_ENV is not set. Must be "sandbox" or "production".');
}
if (!['sandbox', 'production'].includes(MTN_MOMO_ENV)) {
  throw new Error(`Invalid MTN_MOMO_ENV "${MTN_MOMO_ENV}". Must be "sandbox" or "production".`);
}

const LOCAL_CURRENCY = process.env.LOCAL_CURRENCY || 'ZMW';

// Sandbox vars
const {
  MOMO_API_BASE_URL_SANDBOX,
  X_TARGET_ENVIRONMENT_SANDBOX,
  SUBSCRIPTION_KEY_SANDBOX,
  PROVIDER_CALLBACK_HOST_SANDBOX
} = process.env;

// Production vars
const {
  MOMO_API_BASE_URL_PRODUCTION,
  X_TARGET_ENVIRONMENT_PRODUCTION,
  SUBSCRIPTION_KEY_PRODUCTION,
  API_USER_PRODUCTION,
  API_KEY_PRODUCTION,
  PROVIDER_CALLBACK_HOST_PRODUCTION
} = process.env;

// Polling defaults
const DEFAULT_POLL_RETRIES   = Number(process.env.DEFAULT_POLL_RETRIES  || 3);
const DEFAULT_POLL_DELAY_MS  = Number(process.env.DEFAULT_POLL_DELAY_MS || 5000);

const isProduction = MTN_MOMO_ENV === 'production';

const CONFIG = {
  baseUrl:             isProduction ? MOMO_API_BASE_URL_PRODUCTION   : MOMO_API_BASE_URL_SANDBOX,
  targetEnv:           isProduction ? X_TARGET_ENVIRONMENT_PRODUCTION : X_TARGET_ENVIRONMENT_SANDBOX,
  subscriptionKey:     isProduction ? SUBSCRIPTION_KEY_PRODUCTION     : SUBSCRIPTION_KEY_SANDBOX,
  providerCallbackHost: isProduction ? PROVIDER_CALLBACK_HOST_PRODUCTION : PROVIDER_CALLBACK_HOST_SANDBOX,
  apiUser:             API_USER_PRODUCTION,
  apiKey:              API_KEY_PRODUCTION
};

// ───────────────────────────────────────────────────────────────────────────────
// 2) Utility: Centralized Error Logging
// ───────────────────────────────────────────────────────────────────────────────
function logAxiosError(fnName, error) {
  console.error(`Error in ${fnName}:`, error.message);
  if (error.response) {
    console.error('  Response:', error.response.data);
    console.error('  Status:', error.response.status);
  }
}

// ───────────────────────────────────────────────────────────────────────────────
// 3) Sandbox‐only setup: create API user & key
// ───────────────────────────────────────────────────────────────────────────────
async function createApiUser(referenceId) {
  console.log('[Sandbox] Creating API user, X-Reference-Id:', referenceId);
  const url = `${CONFIG.baseUrl}/v1_0/apiuser`;
  try {
    const { data } = await axios.post(
      url,
      { providerCallbackHost: CONFIG.providerCallbackHost },
      {
        headers: {
          'Ocp-Apim-Subscription-Key': CONFIG.subscriptionKey,
          'Content-Type': 'application/json',
          'X-Reference-Id': referenceId
        }
      }
    );
    console.log('[Sandbox] API user created:', data);
    return data;
  } catch (err) {
    logAxiosError('createApiUser', err);
    throw err;
  }
}

async function createApiKey(referenceId) {
  console.log('[Sandbox] Creating API key, for user:', referenceId);
  const url = `${CONFIG.baseUrl}/v1_0/apiuser/${referenceId}/apikey`;
  try {
    const { data } = await axios.post(
      url,
      null,
      {
        headers: {
          'Ocp-Apim-Subscription-Key': CONFIG.subscriptionKey
        }
      }
    );
    console.log('[Sandbox] API key created.');
    return data.apiKey;
  } catch (err) {
    logAxiosError('createApiKey', err);
    throw err;
  }
}

// ───────────────────────────────────────────────────────────────────────────────
// 4) Create Bearer Token
// ───────────────────────────────────────────────────────────────────────────────
async function createBearerToken(apiUserId, apiKey) {
  console.log('Requesting Bearer token for user:', apiUserId);
  const url = `${CONFIG.baseUrl}/collection/token/`;
  const auth = Buffer.from(`${apiUserId}:${apiKey}`).toString('base64');
  try {
    const { data } = await axios.post(
      url,
      null,
      {
        headers: {
          'Ocp-Apim-Subscription-Key': CONFIG.subscriptionKey,
          Authorization: `Basic ${auth}`,
          'Content-Length': 0
        }
      }
    );
    console.log('Bearer token acquired.');
    return data.access_token;
  } catch (err) {
    logAxiosError('createBearerToken', err);
    throw err;
  }
}

// ───────────────────────────────────────────────────────────────────────────────
// 5) Request Payment
// ───────────────────────────────────────────────────────────────────────────────
async function requestPayment({ referenceId, bearerToken, amount, phone, businessRef }) {
  console.log('Requesting payment, X-Reference-Id:', referenceId);
  const url = `${CONFIG.baseUrl}/collection/v1_0/requesttopay`;
  const body = {
    amount,
    currency: LOCAL_CURRENCY,
    externalId: uuidv4(),
    payer: { partyIdType: 'MSISDN', partyId: phone },
    payerMessage: `Payment for ${businessRef}`,
    payeeNote: 'Payment Initiated'
  };

  try {
    const { data } = await axios.post(
      url,
      body,
      {
        headers: {
          'X-Target-Environment': CONFIG.targetEnv,
          'X-Reference-Id': referenceId,
          'Ocp-Apim-Subscription-Key': CONFIG.subscriptionKey,
          'Content-Type': 'application/json',
          'X-Callback-Url': CONFIG.providerCallbackHost,
          Authorization: `Bearer ${bearerToken}`
        }
      }
    );
    console.log('Payment request accepted:', data);
    return data;
  } catch (err) {
    logAxiosError('requestPayment', err);
    throw err;
  }
}

// ───────────────────────────────────────────────────────────────────────────────
// 6) Get Payment Status
// ───────────────────────────────────────────────────────────────────────────────
async function getPaymentStatus({ referenceId, bearerToken }) {
  console.log('Fetching payment status, X-Reference-Id:', referenceId);
  const url = `${CONFIG.baseUrl}/collection/v1_0/requesttopay/${referenceId}`;
  try {
    const { data } = await axios.get(
      url,
      {
        headers: {
          'X-Target-Environment': CONFIG.targetEnv,
          'Ocp-Apim-Subscription-Key': CONFIG.subscriptionKey,
          Authorization: `Bearer ${bearerToken}`
        }
      }
    );
    console.log('Payment status:', data);
    return data;
  } catch (err) {
    logAxiosError('getPaymentStatus', err);
    throw err;
  }
}

// ───────────────────────────────────────────────────────────────────────────────
// 7) Polling Loop
// ───────────────────────────────────────────────────────────────────────────────
async function pollPaymentStatus({ referenceId, bearerToken, retries = DEFAULT_POLL_RETRIES, delay = DEFAULT_POLL_DELAY_MS }) {
  console.log('Starting polling for', referenceId);
  for (let i = 1; i <= retries; i++) {
    try {
      const status = await getPaymentStatus({ referenceId, bearerToken });
      if (['SUCCESSFUL', 'FAILED'].includes(status.status)) {
        console.log('Final status:', status.status);
        return status;
      }
      console.log(`Status = ${status.status}, retrying in ${delay}ms (${i}/${retries})`);
    } catch (err) {
      console.error(`Polling error (attempt ${i}):`, err.message);
    }
    await new Promise(res => setTimeout(res, delay));
  }
  console.error('Polling timed out after', retries, 'attempts');
  throw new Error('Payment status polling timed out');
}

// ───────────────────────────────────────────────────────────────────────────────
// 8) Public API: processPayment()
// ───────────────────────────────────────────────────────────────────────────────
async function processPayment(amount, phone, businessRef) {
  console.log(`\n=== Processing Payment (${MTN_MOMO_ENV}) ===`);
  console.log(`Amount: ${amount}, Phone: ${phone}, Ref: ${businessRef}`);

  // Use the provided businessRef as reference ID for consistency
  const referenceId = businessRef;

  try {
    let apiUserId, apiKey;

    if (isProduction) {
      console.log('Production mode: using env API_USER & API_KEY');
      apiUserId = CONFIG.apiUser;
      apiKey     = CONFIG.apiKey;
    } else {
      console.log('Sandbox mode: creating API user & key');
      await createApiUser(referenceId);
      apiUserId = referenceId;
      apiKey    = await createApiKey(referenceId);
    }

    const bearerToken = await createBearerToken(apiUserId, apiKey);

    await requestPayment({ referenceId, bearerToken, amount, phone, businessRef });

    // If callback fails, fallback to polling:
    const finalStatus = await pollPaymentStatus({ referenceId, bearerToken });

    return { status: finalStatus.status, data: finalStatus };
  } catch (err) {
    console.error('processPayment failed:', err.message);
    throw err;
  }
}

module.exports = { processPayment };
