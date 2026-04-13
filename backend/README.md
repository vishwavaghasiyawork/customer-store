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

## Sales Report API

### GET /api/reports/sales/generate
Generate professional sales report in CSV format with comprehensive order data.

**Query Parameters:**
- `startDate` (optional): Filter orders from this date (YYYY-MM-DD format)
- `endDate` (optional): Filter orders until this date (YYYY-MM-DD format)  
- `status` (optional): Filter by order status (pending, paid, cancelled, etc.)
- `format` (optional): Output format (default: csv)

**Response:**
```json
{
  "success": true,
  "data": {
    "filename": "sales_report_2026-04-13T15-30-00.csv",
    "totalOrders": 150,
    "summary": {
      "totalRevenue": 45678.90,
      "totalOrders": 150,
      "averageOrderValue": 304.53,
      "totalTax": 1234.56,
      "totalShipping": 890.12,
      "totalDiscount": 234.56,
      "ordersByStatus": { "paid": 120, "pending": 30 },
      "ordersByPaymentMethod": { "COD": 80, "Credit Card": 70 },
      "topProducts": { "Product A": 25, "Product B": 20 },
      "ordersByMonth": { "2026-04": 150 },
      "customersCount": 120
    },
    "generatedAt": "2026-04-13T15:30:00.000Z"
  }
}
```

### GET /api/reports/download/:filename
Download a generated report file.

### GET /api/reports/list
Get list of all generated reports with file metadata.

### DELETE /api/reports/:filename
Delete a specific report file.

## CSV Report Fields

The sales report includes 20 professional fields:

1. Order ID
2. Order Number  
3. Customer Email
4. Customer Name
5. Customer Phone
6. Order Date
7. Order Status
8. Financial Status
9. Fulfillment Status
10. Currency
11. Total Price
12. Subtotal Price
13. Total Tax
14. Shipping Price
15. Total Discount
16. Payment Method
17. Billing Address
18. Shipping Address
19. Product Count
20. Product Names
21. Product SKUs
22. Product Quantities
23. Product Prices
24. Tags
25. Created At
26. Updated At

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
