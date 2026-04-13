# Shopify Customer Backend API

Backend service for handling Shopify customer operations via Admin APIs.

## Setup

1. Copy environment configuration:
   ```bash
   cp env.example .env
   ```

2. Configure your `.env` file:
   ```
   SHOPIFY_STORE_URL=your-store-name.myshopify.com
   SHOPIFY_ACCESS_TOKEN=your-access-token
   PORT=3001
   MONGODB_URI=mongodb://localhost:27017/shopify_customers
   ```

3. Make sure MongoDB is running on your system

4. Install dependencies:
   ```bash
   npm install
   ```

5. Start the server:
   ```bash
   npm start
   ```

## API Endpoints

### POST /api/customers/create
Create a new Shopify customer and sync to MongoDB.

### POST /api/customers/create-dummy
Create a customer with dummy data and sync to MongoDB.

### GET /api/customers/all
Retrieve all customers from MongoDB.

### POST /webhooks/setup
Create Shopify customer webhook automatically.

### POST /webhooks/customers/create
Webhook endpoint to receive customer creation events from Shopify.

### POST /api/orders/sync
Manually trigger order sync from Shopify to MongoDB.

### GET /api/orders/all
Retrieve all orders from MongoDB.

### GET /api/orders/shopify/:shopifyId
Retrieve a specific order by Shopify ID.

### GET /api/orders/email/:email
Retrieve all orders for a specific customer email.

## Webhook Setup

1. Add webhook secret to `.env`:
   ```
   SHOPIFY_WEBHOOK_SECRET=your-webhook-secret
   ```

2. Setup webhook:
   ```bash
   npm run setup-webhook
   ```

3. Or setup manually via API:
   ```bash
   POST /webhooks/setup
   ```

## API Endpoints

### POST /api/customers/create
**Request Body:**
```json
{
  "input": {
    "firstName": "Bob",
    "lastName": "Norman",
    "email": "bob.norman@mail.example.com",
    "phone": "+15145555555",
    "tags": ["wholesale", "newsletter"],
    "addresses": [
      {
        "address1": "123 Oak St",
        "city": "Ottawa",
        "province": "Ontario",
        "zip": "123 ABC",
        "country": "Canada",
        "firstName": "Bob",
        "lastName": "Norman",
        "phone": "555-1212"
      }
    ],
    "emailMarketingConsent": {
      "marketingState": "SUBSCRIBED"
    }
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "gid://shopify/Customer/123456789",
    "firstName": "Bob",
    "lastName": "Norman",
    "defaultEmailAddress": {
      "emailAddress": "bob.norman@mail.example.com"
    },
    "defaultPhoneNumber": {
      "phoneNumber": "+15145555555"
    }
  },
  "message": "Customer created successfully"
}
```

### GET /health
Health check endpoint.

## Error Handling

The API returns structured error responses:
```json
{
  "success": false,
  "error": "Error message"
}
```

## Automated Order Sync

The server automatically syncs orders from Shopify to MongoDB every minute using cron jobs:

- **Frequency**: Every minute (`* * * * *`)
- **Deduplication**: Orders are upserted based on `shopifyOrderId`
- **Update Logic**: Only updates if Shopify timestamp is newer than local timestamp
- **Logging**: Detailed logs for created, updated, skipped, and error orders

## Security

- Access tokens are loaded from environment variables only
- No sensitive data is exposed in responses
- Input validation is performed on all requests
