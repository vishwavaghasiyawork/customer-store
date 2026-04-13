import csvOrderSyncService from '../services/csvOrderSyncService.js';
import fs from 'fs';
import path from 'path';

export const generateCsvSalesReport = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      financialStatus,
      fulfillmentStatus,
      customerEmail,
      orderNumber,
      currency,
      tags,
      format = 'csv'
    } = req.query;

    // Validate dates
    if (startDate && !isValidDate(startDate)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid start date format. Use YYYY-MM-DD format.'
      });
    }

    if (endDate && !isValidDate(endDate)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid end date format. Use YYYY-MM-DD format.'
      });
    }

    // Read orders from CSV file
    const allOrders = csvOrderSyncService.readOrdersFromCsv();
    
    if (allOrders.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No orders found in CSV file'
      });
    }

    // Build filters object
    const filters = {
      startDate,
      endDate,
      financialStatus,
      fulfillmentStatus,
      customerEmail,
      orderNumber,
      currency,
      tags
    };

    // Filter orders based on query parameters
    const filteredOrders = csvOrderSyncService.filterOrders(allOrders, filters);
    
    console.log(`Filtered ${filteredOrders.length} orders from ${allOrders.length} total orders`);

    if (filteredOrders.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No orders found matching the specified criteria'
      });
    }

    // Generate CSV content
    const headers = [
      'Order ID',
      'Order Number',
      'Order Name',
      'Customer Email',
      'Customer First Name',
      'Customer Last Name',
      'Customer Phone',
      'Order Date',
      'Financial Status',
      'Fulfillment Status',
      'Currency',
      'Total Price',
      'Subtotal Price',
      'Total Tax',
      'Shipping Price',
      'Total Discount',
      'Payment Methods',
      'Billing Address',
      'Shipping Address',
      'Line Items Count',
      'Product Names',
      'Product SKUs',
      'Product Quantities',
      'Product Prices',
      'Tags',
      'Created At',
      'Updated At'
    ];

    const csvRows = [headers.join(',')];

    filteredOrders.forEach(order => {
      const row = [
        order.shopifyOrderId || '',
        order.orderNumber || '',
        `"${order.orderName || ''}"`,
        `"${order.customerEmail || ''}"`,
        `"${order.customerFirstName || ''}"`,
        `"${order.customerLastName || ''}"`,
        `"${order.customerPhone || ''}"`,
        `"${order.orderDate || ''}"`,
        `"${order.financialStatus || ''}"`,
        `"${order.fulfillmentStatus || ''}"`,
        order.currency || '',
        order.totalPrice || '0',
        order.subtotalPrice || '0',
        order.totalTax || '0',
        order.shippingPrice || '0',
        order.totalDiscount || '0',
        `"${order.paymentMethods || ''}"`,
        `"${order.billingAddress || ''}"`,
        `"${order.shippingAddress || ''}"`,
        order.lineItemsCount || '0',
        `"${order.productNames || ''}"`,
        `"${order.productSKUs || ''}"`,
        `"${order.productQuantities || ''}"`,
        `"${order.productPrices || ''}"`,
        `"${order.tags || ''}"`,
        `"${order.createdAt || ''}"`,
        `"${order.updatedAt || ''}"`
      ];
      csvRows.push(row.join(','));
    });

    const csvContent = csvRows.join('\n');

    // Calculate summary statistics
    const summary = calculateSummary(filteredOrders);

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `filtered_sales_report_${timestamp}.csv`;

    // Save to data directory for static access
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    const filePath = path.join(dataDir, filename);
    fs.writeFileSync(filePath, csvContent, 'utf8');

    // Always return JSON with file URL
    res.status(200).json({
      success: true,
      data: {
        filename,
        totalOrders: filteredOrders.length,
        totalAvailableOrders: allOrders.length,
        appliedFilters: filters,
        summary,
        generatedAt: new Date().toISOString(),
        fileUrl: `http://localhost:3001/data/${filename}`,
        filePath: filePath,
        fileSize: fs.statSync(filePath).size,
        csvPreview: csvContent.split('\n').slice(0, 5).join('\n') + '\n...' // Show first 5 lines as preview
      },
      message: 'CSV sales report generated successfully'
    });
  } catch (error) {
    console.error('Error generating CSV sales report:', error.message);
    
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate CSV sales report'
    });
  }
};

export const getCsvOrderStats = async (req, res) => {
  try {
    const orders = csvOrderSyncService.readOrdersFromCsv();
    
    if (orders.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          totalOrders: 0,
          lastSyncTime: null,
          summary: {}
        },
        message: 'No orders found in CSV file'
      });
    }

    const summary = calculateSummary(orders);
    const lastSyncTime = orders.length > 0 ? 
      Math.max(...orders.map(o => new Date(o.lastSyncedAt).getTime())) : null;

    res.status(200).json({
      success: true,
      data: {
        totalOrders: orders.length,
        lastSyncTime: lastSyncTime ? new Date(lastSyncTime).toISOString() : null,
        summary
      },
      message: 'CSV order statistics retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting CSV order stats:', error.message);
    
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get CSV order statistics'
    });
  }
};

function calculateSummary(orders) {
  const summary = {
    totalRevenue: 0,
    totalOrders: orders.length,
    averageOrderValue: 0,
    totalTax: 0,
    totalShipping: 0,
    totalDiscount: 0,
    ordersByStatus: {},
    ordersByFulfillmentStatus: {},
    ordersByCurrency: {},
    ordersByPaymentMethod: {},
    topProducts: {},
    ordersByMonth: {},
    customersCount: new Set(),
    productsSold: 0
  };

  orders.forEach(order => {
    // Revenue calculations
    const totalPrice = parseFloat(order.totalPrice) || 0;
    const totalTax = parseFloat(order.totalTax) || 0;
    const shippingPrice = parseFloat(order.shippingPrice) || 0;
    const totalDiscount = parseFloat(order.totalDiscount) || 0;

    summary.totalRevenue += totalPrice;
    summary.totalTax += totalTax;
    summary.totalShipping += shippingPrice;
    summary.totalDiscount += totalDiscount;

    // Order status
    const status = order.financialStatus || 'unknown';
    summary.ordersByStatus[status] = (summary.ordersByStatus[status] || 0) + 1;

    // Fulfillment status
    const fulfillmentStatus = order.fulfillmentStatus || 'unknown';
    summary.ordersByFulfillmentStatus[fulfillmentStatus] = (summary.ordersByFulfillmentStatus[fulfillmentStatus] || 0) + 1;

    // Currency
    const currency = order.currency || 'unknown';
    summary.ordersByCurrency[currency] = (summary.ordersByCurrency[currency] || 0) + 1;

    // Payment methods
    const paymentMethods = (order.paymentMethods || '').split(';').filter(m => m.trim());
    paymentMethods.forEach(method => {
      summary.ordersByPaymentMethod[method] = (summary.ordersByPaymentMethod[method] || 0) + 1;
    });

    // Top products
    const productNames = (order.productNames || '').split(';').filter(p => p.trim());
    const productQuantities = (order.productQuantities || '').split(';').map(q => parseInt(q) || 1);
    
    productNames.forEach((productName, index) => {
      const cleanName = productName.replace(/"/g, '').trim();
      const quantity = productQuantities[index] || 1;
      summary.topProducts[cleanName] = (summary.topProducts[cleanName] || 0) + quantity;
      summary.productsSold += quantity;
    });

    // Orders by month
    if (order.orderDate) {
      const month = order.orderDate.slice(0, 7); // YYYY-MM
      summary.ordersByMonth[month] = (summary.ordersByMonth[month] || 0) + 1;
    }

    // Unique customers
    if (order.customerEmail) {
      summary.customersCount.add(order.customerEmail);
    }
  });

  // Calculate average order value
  summary.averageOrderValue = summary.totalOrders > 0 ? summary.totalRevenue / summary.totalOrders : 0;
  summary.customersCount = summary.customersCount.size;

  // Sort top products
  summary.topProducts = Object.entries(summary.topProducts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .reduce((obj, [name, count]) => {
      obj[name] = count;
      return obj;
    }, {});

  return summary;
}

// Helper function for date validation
function isValidDate(dateString) {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
}
