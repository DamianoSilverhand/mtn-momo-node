# MTN MoMo SDK

A simple library for integrating with the MTN MoMo Payment Collections API. This repository hosts a Node.js SDK for integrating with MTN MoMo (Mobile Money) API, specifically tailored for payment collections. The SDK provides an easy-to-use interface for developers to initiate payment requests, manage API users, generate API keys, and retrieve transaction statuses.

- [Getting Your API Credentials](#getting-your-api-credentials)
- [Installation](#installation)
- [Usage](#usage)
- [API Reference](#api-reference)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

## Getting Your API Credentials

To use the MTN MoMo Collections API, you need to generate your userId and userApiKey. Here's how you can generate them.

```bash
npx momo-sandbox --callback-host <callbackHost> --primary-key <primaryKey>
```

Replace **`<callbackHost>`** with the URL of your callback host and **`<primaryKey>`** with your actual MTN Mobile Money API primary or secondary key.

This command will generate a new user and display the **`userId`** and **`userApiKey`** in the console.

**Note:** These credentials are specifically intended for use in the sandbox environment. In a production environment, you will be provided with the necessary credentials through the MTN OVA management dashboard after fulfilling the necessary KYC (Know Your Customer) requirements.

## Installation

Use the package manager [npm](https://www.npmjs.com/) to install `mtn-momo-sdk`.

```bash
npm install mtn-momo-sdk --save
```

## Usage

Here's an example of how you can use the MTN MoMo SDK in your project:

```javascript
const { processPayment } = require('mtn-momo-sdk');

async function initiatePayment() {
    try {
        const status = await processPayment('100.00', '260772123456', 'Test Payment');
        console.log('Transaction Status:', status);
    } catch (error) {
        console.error('Payment error:', error);
    }
}

initiatePayment();
```

## API Reference

### `processPayment(amount, phone, reference)`

Initiates a payment request using the MTN MoMo Collections API.

- **`amount`**: The amount to be paid (e.g., `'100.00'`).
- **`phone`**: The payer's phone number (e.g., `'256772123456'`).
- **`reference`**: A reference string for the payment (e.g., `'Test Payment'`).

Returns a promise that resolves to the payment status string.

### Environment Variables

Ensure that your `.env` file includes the following variables:

- **`SUBSCRIPTION_KEY`**: Your MTN MoMo API primary or secondary key.
- **`PROVIDER_CALLBACK_HOST`**: The callback URL for receiving payment notifications.
- **`X_TARGET_ENVIRONMENT`**: The target environment (e.g., `'sandbox'`).
- **`MOMO_API_BASE_URL`**: The base URL for the MTN MoMo API (e.g., `'https://sandbox.momodeveloper.mtn.com'`, for the Sandbox).

Example `.env` file:

```env
SUBSCRIPTION_KEY=your_subscription_key
PROVIDER_CALLBACK_HOST=your_callback_host
X_TARGET_ENVIRONMENT=sandbox
MOMO_API_BASE_URL=https://sandbox.momodeveloper.mtn.com/
```

## Roadmap

- **Future Support**: Plans to expand SDK functionality to support other MoMo API features beyond collections, including disbursements and transfers.

## Contributing

Contributions are welcome! If you find any issues or have suggestions for improvements, please open an issue or submit a pull request.

## License

This project is licensed under the MIT License. See the LICENSE file for details.

## Official Documentation

For more information on the MTN MoMo API, please refer to the [official MTN MoMo developer documentation](https://momodeveloper.mtn.com).