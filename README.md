# MTN MoMo Payment Integration

This project provides a Node.js-based integration with the MTN MoMo API for processing mobile money payments. It supports both sandbox and production environments, handles real-time payment status callbacks, and includes a fallback polling mechanism.

## Features

- **Seamless Environment Switching**: Easily switch between sandbox and production environments via environment variables.
- **Real-Time Callbacks**: Supports `providerCallbackHost` to receive real-time payment status updates.
- **Polling Mechanism**: A fallback polling mechanism for cases where callback notifications fail.
- **API User and Key Management**: Automatically creates API users and keys in the sandbox environment.
- **Unique Payment References**: Generates unique payment reference IDs using `uuidv4()` for each transaction.

## Prerequisites

- Node.js (>= 14.x)
- NPM or Yarn
- MTN MoMo API access (for both sandbox and production environments)

## Getting Started

### 1. Install the package in your project

```bash
npm install mtn-momo-sdk
```

### 3. Environment Configuration

Create a `.env` file in your project root and add the following variables:

```bash
# General Configuration
MTN_MOMO_ENV=sandbox                     # Set to 'production' or 'sandbox'
LOCAL_CURRENCY=ZMW                       # Local currency for transactions

# Sandbox Configuration
MOMO_API_BASE_URL_SANDBOX=https://sandbox.momodeveloper.mtn.com
X_TARGET_ENVIRONMENT_SANDBOX=sandbox
SUBSCRIPTION_KEY_SANDBOX=<your_sandbox_subscription_key>
PROVIDER_CALLBACK_HOST_SANDBOX=<your_sandbox_callback_url>

# Production Configuration
MOMO_API_BASE_URL_PRODUCTION=https://your-production-api-url.com
X_TARGET_ENVIRONMENT_PRODUCTION=production
SUBSCRIPTION_KEY_PRODUCTION=<your_production_subscription_key>
API_USER_PRODUCTION=<your_production_api_user>
API_KEY_PRODUCTION=<your_production_api_key>
PROVIDER_CALLBACK_HOST_PRODUCTION=<your_production_callback_url>
```

### 4. Running the Application

To test the integration in **sandbox** mode, ensure that the `MTN_MOMO_ENV` is set to `sandbox` in your `.env` file.

```bash
npm start
```

### 5. Payment Processing

Use the provided `processPayment` function to initiate a payment. Here's an example of how to call it:

```javascript
const { processPayment } = require('mtn-momo-sdk');

async function initiatePayment() {
    try {
        const amount = '100.00';
        const phone = '260XXXXXXXXX';  // Recipient's phone number
        const reference = 'Invoice #12345';  // Reference for the payment

        const status = await processPayment(amount, phone, reference);
        console.log('Final Payment Status:', status);
    } catch (error) {
        console.error('Error initiating payment:', error.message);
    }
}

initiatePayment();
```

## For Developers

### `createApiUser(subscriptionKey, providerCallbackHost, xReferenceId)`
Used to create an API user in the sandbox environment.

### `createApiKey(subscriptionKey, xReferenceId)`
Generates an API key for the newly created API user.

### `createBearerToken(subscriptionKey, xReferenceId, apiKey)`
Creates a Bearer token using the API user and key to authenticate subsequent requests.

### `requestPayment(xReferenceId, subscriptionKey, tokenSanitized, amount, phone, ref, providerCallbackHost)`
Initiates the payment request.

### `getPaymentStatus(subscriptionKey, tokenSanitized, xReferenceId)`
Retrieves the status of the payment request.

### `pollPaymentStatus(subscriptionKey, tokenSanitized, xReferenceId, retries = 5, delay = 50000)`
Polls for the payment status if the callback fails, retrying up to a specified number of times.

## Error Handling

- In case of an error during API requests, detailed error responses are logged.
- If the callback URL fails, the fallback polling mechanism ensures that the payment status is eventually retrieved.

## Roadmap

- **Future Support**: Plans to expand SDK functionality to support other MoMo API features beyond collections, including disbursements and transfers.

## Contributing

Contributions are welcome! If you find any issues or have suggestions for improvements, please open an issue or submit a pull request.

## License

This project is licensed under the MIT License. See the LICENSE file for details.

## Official Documentation

For more information on the MTN MoMo API, please refer to the [official MTN MoMo developer documentation](https://momodeveloper.mtn.com).