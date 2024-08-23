require('dotenv').config(); // Load .env file

const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

const MOMO_API_BASE_URL = process.env.MOMO_API_BASE_URL;

async function createApiUser(subscriptionKey, providerCallbackHost, xReferenceId) {
    console.log('Creating API User with:', { subscriptionKey, providerCallbackHost, xReferenceId });
    try {
        const response = await axios.post(
            `${MOMO_API_BASE_URL}/v1_0/apiuser`,
            { providerCallbackHost },
            {
                headers: {
                    'Ocp-Apim-Subscription-Key': subscriptionKey,
                    'Content-Type': 'application/json',
                    'X-Reference-Id': xReferenceId
                }
            }
        );
        console.log('API User created:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error in createApiUser:', error.message);
        if (error.response) {
            console.error('Error Response:', error.response.data);
        }
        throw error;
    }
}

async function createApiKey(subscriptionKey, xReferenceId) {
    console.log('Creating API Key with:', { subscriptionKey, xReferenceId });
    try {
        const response = await axios.post(
            `${MOMO_API_BASE_URL}/v1_0/apiuser/${xReferenceId}/apikey`,
            null,
            {
                headers: { 'Ocp-Apim-Subscription-Key': subscriptionKey }
            }
        );
        console.log('API Key created:', response.data);
        return response.data.apiKey;
    } catch (error) {
        console.error('Error in createApiKey:', error.message);
        if (error.response) {
            console.error('Error Response:', error.response.data);
        }
        throw error;
    }
}

async function createBearerToken(subscriptionKey, xReferenceId, apiKey) {
    console.log('Creating Bearer Token with:', { subscriptionKey, xReferenceId, apiKey });
    const authHeader = `Basic ${Buffer.from(`${xReferenceId}:${apiKey}`).toString('base64')}`;
    try {
        const response = await axios.post(
            `${MOMO_API_BASE_URL}/collection/token/`,
            null,
            {
                headers: {
                    'Ocp-Apim-Subscription-Key': subscriptionKey,
                    'Authorization': authHeader,
                    'Content-Length': 0
                }
            }
        );
        console.log('Bearer Token created:', response.data);
        return response.data.access_token;
    } catch (error) {
        console.error('Error in createBearerToken:', error.message);
        if (error.response) {
            console.error('Error Response:', error.response.data);
        }
        throw error;
    }
}

async function requestPayment(xReferenceId, xTargetEnvironment, subscriptionKey, tokenSanitized, amount, phone, ref, providerCallbackHost) {
    let payeeNote = 'Payment Initiated';
    console.log('Requesting payment with:', { xReferenceId, xTargetEnvironment, subscriptionKey, amount, phone, ref, providerCallbackHost });

    try {
        const response = await axios.post(
            `${MOMO_API_BASE_URL}/collection/v1_0/requesttopay`,
            {
                amount,
                currency: 'EUR',
                externalId: uuidv4(),
                payer: {
                    partyIdType: 'MSISDN',
                    partyId: phone
                },
                payerMessage: `Payment for ${ref}`,
                payeeNote: payeeNote  // Note that this is before the status is known
            },
            {
                headers: {
                    'X-Target-Environment': xTargetEnvironment,
                    'X-Reference-Id': xReferenceId,
                    'Content-Type': 'application/json',
                    'Ocp-Apim-Subscription-Key': subscriptionKey,
                    'providerCallbackHost': providerCallbackHost,
                    'Authorization': `Bearer ${tokenSanitized}`
                }
            }
        );
        console.log('Payment requested successfully:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error in requestPayment:', error.message);
        if (error.response) {
            console.error('Error Response:', error.response.data);
        }
        throw error;
    }
}


async function getPaymentStatus(subscriptionKey, tokenSanitized, xReferenceId) {
    console.log('Getting payment status with:', { subscriptionKey, tokenSanitized, xReferenceId });
    try {
        const response = await axios.get(
            `${MOMO_API_BASE_URL}/collection/v1_0/requesttopay/${xReferenceId}`,
            {
                headers: {
                    'X-Target-Environment': 'sandbox',
                    'Ocp-Apim-Subscription-Key': subscriptionKey,
                    'Authorization': `Bearer ${tokenSanitized}`
                }
            }
        );
        console.log('Payment status received:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error in getPaymentStatus:', error.message);
        if (error.response) {
            console.error('Error Response:', error.response.data);
        }
        throw error;
    }
}

async function processPayment(amount, phone, reference) {
    console.log('Processing payment with:', { amount, phone, reference });
    const subscriptionKey = process.env.SUBSCRIPTION_KEY;
    const providerCallbackHost = process.env.PROVIDER_CALLBACK_HOST;
    const xReferenceId = uuidv4();
    const xTargetEnvironment = process.env.X_TARGET_ENVIRONMENT;

    try {
        // Step 1: Create API User
        await createApiUser(subscriptionKey, providerCallbackHost, xReferenceId);

        // Step 2: Create API Key
        const apiKey = await createApiKey(subscriptionKey, xReferenceId);

        // Step 3: Create Bearer Token
        const tokenSanitized = await createBearerToken(subscriptionKey, xReferenceId, apiKey);

        // Step 4: Request Payment
        await requestPayment(
            xReferenceId, xTargetEnvironment, subscriptionKey, tokenSanitized, amount, phone, reference, providerCallbackHost
        );

        // Step 5: Get Payment Status
        const paymentStatusResponse = await getPaymentStatus(subscriptionKey, tokenSanitized, xReferenceId);

        // Return payment status
        return paymentStatusResponse.status.replace(/["']/g, '');

    } catch (error) {
        console.error('Payment error:', error.message);
        if (error.response && error.response.data) {
            console.error('Error Response:', error.response.data);
        }
        throw error;
    }
}

module.exports = { processPayment };
