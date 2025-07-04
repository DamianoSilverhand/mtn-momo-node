# MTN MoMo Node SDK

A comprehensive Node.js SDK for integrating with the MTN MoMo API, supporting both sandbox and production environments with automatic API user/key management, real-time callbacks, and intelligent polling mechanisms.

## Features

- **Dual Environment Support**: Seamless switching between sandbox and production environments
- **Automatic API Management**: Creates API users and keys automatically in sandbox mode
- **Real-Time Callbacks**: Supports callback URLs for instant payment status updates
- **Intelligent Polling**: Fallback polling mechanism with configurable retries and delays
- **Bearer Token Management**: Automatic token generation and management
- **Comprehensive Error Handling**: Detailed error logging with full response data
- **Unique Payment References**: Generates unique external IDs using UUID v4

## Prerequisites

- Node.js (>= 14.x)
- NPM or Yarn
- MTN MoMo API access (sandbox and/or production)

## Installation

Install the package in your Node.js project:

```bash
npm install mtn-momo-sdk
```

## Configuration

1. Copy the `env.example` file to `.env`:
```bash
cp env.example .env
```

2. Update the `.env` file with your actual values:

```bash
# Environment Configuration
MTN_MOMO_ENV=sandbox  # Set to 'sandbox' or 'production'
LOCAL_CURRENCY=ZMW    # Local currency for transactions

# Sandbox Configuration
MOMO_API_BASE_URL_SANDBOX=https://sandbox.momodeveloper.mtn.com
X_TARGET_ENVIRONMENT_SANDBOX=sandbox
SUBSCRIPTION_KEY_SANDBOX=your_sandbox_subscription_key_here
PROVIDER_CALLBACK_HOST_SANDBOX=https://your-sandbox-callback-url.com

# Production Configuration
MOMO_API_BASE_URL_PRODUCTION=https://your-production-api-url.com
X_TARGET_ENVIRONMENT_PRODUCTION=production
SUBSCRIPTION_KEY_PRODUCTION=your_production_subscription_key_here
API_USER_PRODUCTION=your_production_api_user_here
API_KEY_PRODUCTION=your_production_api_key_here
PROVIDER_CALLBACK_HOST_PRODUCTION=https://your-production-callback-url.com

# Polling Configuration
DEFAULT_POLL_RETRIES=3
DEFAULT_POLL_DELAY_MS=5000
```

## Usage

### Basic Payment Processing

To initiate a payment, call the `processPayment` function with the payment amount, recipient's phone number, and a business reference.

```javascript
const { processPayment } = require('mtn-momo-sdk');

async function makePayment() {
    try {
        const amount = '100.00';
        const phone = '260XXXXXXXXX';  // Recipient's phone number with country code
        const businessRef = 'Invoice #12345';  // Business reference for the payment

        const paymentResult = await processPayment(amount, phone, businessRef);
        console.log('Final Payment Status:', paymentResult);
        
        // paymentResult will contain:
        // { status: 'SUCCESSFUL' | 'FAILED', data: responseData }
        
    } catch (error) {
        console.error('Payment processing failed:', error.message);
    }
}

makePayment();
```

### Environment-Specific Behavior

The SDK automatically handles different behaviors based on the environment:

#### Sandbox Mode (`MTN_MOMO_ENV=sandbox`)
- Automatically creates API users and keys for each transaction
- Uses the business reference as the API user ID
- Generates new API keys dynamically
- Perfect for testing and development

#### Production Mode (`MTN_MOMO_ENV=production`)
- Uses pre-configured API user and key from environment variables
- Requires `API_USER_PRODUCTION` and `API_KEY_PRODUCTION` to be set
- Optimized for production workloads

### Payment Flow

1. **Environment Detection**: SDK determines sandbox vs production mode
2. **API User/Key Setup**: Creates or uses existing API credentials
3. **Bearer Token Generation**: Authenticates with MTN MoMo API
4. **Payment Request**: Initiates the payment with callback URL
5. **Status Polling**: Polls for payment status if callback fails
6. **Result Return**: Returns final payment status and data

## Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `MTN_MOMO_ENV` | Environment mode (sandbox/production) | - | Yes |
| `LOCAL_CURRENCY` | Currency code for transactions | `ZMW` | No |
| `MOMO_API_BASE_URL_SANDBOX` | Sandbox API base URL | - | Yes (sandbox) |
| `X_TARGET_ENVIRONMENT_SANDBOX` | Sandbox target environment | - | Yes (sandbox) |
| `SUBSCRIPTION_KEY_SANDBOX` | Sandbox subscription key | - | Yes (sandbox) |
| `PROVIDER_CALLBACK_HOST_SANDBOX` | Sandbox callback URL | - | Yes (sandbox) |
| `MOMO_API_BASE_URL_PRODUCTION` | Production API base URL | - | Yes (production) |
| `X_TARGET_ENVIRONMENT_PRODUCTION` | Production target environment | - | Yes (production) |
| `SUBSCRIPTION_KEY_PRODUCTION` | Production subscription key | - | Yes (production) |
| `API_USER_PRODUCTION` | Production API user | - | Yes (production) |
| `API_KEY_PRODUCTION` | Production API key | - | Yes (production) |
| `PROVIDER_CALLBACK_HOST_PRODUCTION` | Production callback URL | - | Yes (production) |
| `DEFAULT_POLL_RETRIES` | Maximum polling retries | `3` | No |
| `DEFAULT_POLL_DELAY_MS` | Polling interval (ms) | `5000` | No |

## API Endpoints

The SDK interacts with the following MTN MoMo API endpoints:

- **API User Creation**: `POST /v1_0/apiuser` (sandbox only)
- **API Key Generation**: `POST /v1_0/apiuser/{referenceId}/apikey` (sandbox only)
- **Bearer Token**: `POST /collection/token/`
- **Payment Request**: `POST /collection/v1_0/requesttopay`
- **Payment Status**: `GET /collection/v1_0/requesttopay/{referenceId}`

## Error Handling

The SDK provides comprehensive error handling:
- All API errors are logged with full response details
- Automatic retry mechanism for failed requests
- Detailed error messages for debugging
- Graceful handling of network timeouts
- Environment validation with clear error messages

## Payment Status Values

The SDK returns the following payment statuses:
- `SUCCESSFUL`: Payment completed successfully
- `FAILED`: Payment failed
- `PENDING`: Payment is being processed
- `TIMEOUT`: Payment status polling timed out

## Callback Integration

The SDK supports callback URLs for real-time payment status updates:
- Set `PROVIDER_CALLBACK_HOST_SANDBOX` or `PROVIDER_CALLBACK_HOST_PRODUCTION`
- Callbacks are sent to your specified URL with payment status updates
- If callbacks fail, the SDK automatically falls back to polling

## Contributing

Contributions are welcome! Feel free to submit a pull request or open an issue for any improvements or suggestions.

## License

This project is licensed under the MIT License. See the LICENSE file for details.

## Official Documentation

For more information on the MTN MoMo API, please refer to the [official MTN MoMo developer documentation](https://momodeveloper.mtn.com).