require('dotenv').config(); // Load .env file

const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

// Determine environment (production or sandbox)
const isProduction = process.env.MTN_MOMO_ENV === 'production';
const MOMO_API_BASE_URL = isProduction ? process.env.MOMO_API_BASE_URL_PRODUCTION : process.env.MOMO_API_BASE_URL_SANDBOX;
const X_TARGET_ENVIRONMENT = isProduction ? process.env.X_TARGET_ENVIRONMENT_PRODUCTION : process.env.X_TARGET_ENVIRONMENT_SANDBOX;
const LOCAL_CURRENCY = process.env.LOCAL_CURRENCY;


// Function to create an API user (used only in sandbox)
async function createApiUser(subscriptionKey, providerCallbackHost, xReferenceId) {
    console.log('Creating API User');
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
        console.log('API User Created:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error in createApiUser:', error.message);
        if (error.response) {
            console.error('Error Response:', error.response.data);
        }
        throw error;
    }
}

// Function to create an API key (used only in sandbox)
async function createApiKey(subscriptionKey, xReferenceId) {
    console.log('Creating API Key');
    try {
        const response = await axios.post(
            `${MOMO_API_BASE_URL}/v1_0/apiuser/${xReferenceId}/apikey`,
            null,
            {
                headers: { 'Ocp-Apim-Subscription-Key': subscriptionKey }
            }
        );
        console.log('API Key Created');
        return response.data.apiKey;
    } catch (error) {
        console.error('Error in createApiKey:', error.message);
        if (error.response) {
            console.error('Error Response:', error.response.data);
        }
        throw error;
    }
}

// Function to create a Bearer Token
async function createBearerToken(subscriptionKey, xReferenceId, apiKey) {
    // subscriptionKey ="1234567890"
    console.log('Creating Bearer Token with');
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
        console.log('Bearer Token Created');
        return response.data.access_token;
    } catch (error) {
        console.error('Error in createBearerToken:', error.message);
        if (error.response) {
            console.error('Error Response:', error.response.data);
        }
        throw error;
    }
}

// Function to request payment using providerCallbackHost
async function requestPayment(xReferenceId, subscriptionKey, tokenSanitized, amount, phone, ref, providerCallbackHost) {
    console.log('Requesting Payment');
    try {
        const response = await axios.post(
            `${MOMO_API_BASE_URL}/collection/v1_0/requesttopay`,
            {
                amount,
                currency : LOCAL_CURRENCY,
                externalId: uuidv4(),
                payer: {
                    partyIdType: 'MSISDN',
                    partyId: phone
                },
                payerMessage: `Payment for ${ref}`,
                payeeNote: 'Payment Initiated'
            },
            {
                headers: {
                    'X-Target-Environment': X_TARGET_ENVIRONMENT,
                    'X-Reference-Id': xReferenceId,
                    'Content-Type': 'application/json',
                    'Ocp-Apim-Subscription-Key': subscriptionKey,
                    'providerCallbackHost': providerCallbackHost, // Notify the result through this
                    'Authorization': `Bearer ${tokenSanitized}`
                }
            }
        );
        console.log('Payment Requested Successfully:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error in requestPayment:', error.message);
        if (error.response) {
            console.error('Error Response:', error.response.data);
        }
        throw error;
    }
}

// Function to get payment status
async function getPaymentStatus(subscriptionKey, tokenSanitized, xReferenceId) {
    console.log('Getting Payment Status');
    try {
        const response = await axios.get(
            `${MOMO_API_BASE_URL}/collection/v1_0/requesttopay/${xReferenceId}`,
            {
                headers: {
                    'X-Target-Environment': X_TARGET_ENVIRONMENT,
                    'Ocp-Apim-Subscription-Key': subscriptionKey,
                    'Authorization': `Bearer ${tokenSanitized}`
                }
            }
        );
        console.log('Payment Status:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error in getPaymentStatus:', error.message);
        if (error.response) {
            console.error('Error Response:', error.response.data);
        }
        throw error;
    }
}


// Polling function to check payment status with timeout and retry logic
async function pollPaymentStatus(subscriptionKey, tokenSanitized, xReferenceId, retries = 2, delay = 5000) {
    console.log('Polling Payment Status...');

    for (let i = 0; i < retries; i++) {
        try {
            const status = await getPaymentStatus(subscriptionKey, tokenSanitized, xReferenceId);
            
            // Check if payment status has reached a final state
            if (status.status === 'SUCCESSFUL' || status.status === 'FAILED') {
                console.log('Final Payment Status:', status.status);
                return status;
            }
            
            console.log(`Payment not completed yet, retrying in ${delay / 1000} seconds (Attempt ${i + 1}/${retries})`);
        } catch (error) {
            console.error('Error in polling:', error.message);
        }
        
        // Delay before retrying
        await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    console.error('Polling timed out after reaching maximum retries.');
    throw new Error('Payment status polling timed out');
}


// Process Payment Function with Callback Handling and Polling Fallback
async function processPayment(amount, phone, reference) {
    const subscriptionKey = process.env.SUBSCRIPTION_KEY;
    const providerCallbackHost = process.env.PROVIDER_CALLBACK_HOST;
    const xReferenceId = uuidv4();
    console.log('Generated xReferenceId');

    console.log('Processing Payment');

    try {
        let apiKey, xRefIdForToken;

        if (isProduction) {
            // Production: Use API user and key from environment variables
            console.log('Production Mode: Using API_USER_PRODUCTION and API_KEY_PRODUCTION from .env');
            apiKey = process.env.API_KEY_PRODUCTION;
            xRefIdForToken = process.env.API_USER_PRODUCTION;
        } else {
            // Sandbox: Create API user and key dynamically
            console.log('Sandbox Mode: Creating API User and API Key dynamically');
            await createApiUser(subscriptionKey, providerCallbackHost, xReferenceId);
            apiKey = await createApiKey(subscriptionKey, xReferenceId);
            xRefIdForToken = xReferenceId;
        }

        // Step 3: Create Bearer Token
        const tokenSanitized = await createBearerToken(subscriptionKey, xRefIdForToken, apiKey);

        // Step 4: Request Payment using providerCallbackHost
        await requestPayment(xReferenceId, subscriptionKey, tokenSanitized, amount, phone, reference, providerCallbackHost);

        // Step 5: Fallback polling in case the callback doesn't work
        const paymentStatusResponse = await pollPaymentStatus(subscriptionKey, tokenSanitized, xReferenceId);

        // Return payment status
        console.log('Payment Status Final:', paymentStatusResponse.status.replace(/["']/g, ''));
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
