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

## Security

- Access tokens are loaded from environment variables only
- No sensitive data is exposed in responses
- Input validation is performed on all requests
