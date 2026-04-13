import Order from '../models/Order.js';
import fs from 'fs';
import path from 'path';

class ReportService {
  generateSalesReportCSV(orders) {
    const headers = [
      'Order ID',
      'Order Number',
      'Order Name',
      'Customer Email',
      'Customer Name',
      'Customer Phone',
      'Order Date',
      'Order Status',
      'Financial Status',
      'Fulfillment Status',
      'Currency',
      'Total Price',
      'Subtotal Price',
      'Total Tax',
      'Shipping Price',
      'Total Discount',
      'Payment Method',
      'Billing Address',
      'Shipping Address',
      'Product Count',
      'Product Names',
      'Product SKUs',
      'Product Quantities',
      'Product Prices',
      'Tags',
      'Created At',
      'Updated At'
    ];

    const csvRows = [headers.join(',')];

    orders.forEach(order => {
      const customerName = `${order.customer?.first_name || ''} ${order.customer?.last_name || ''}`.trim();
      const billingAddress = this.formatAddress(order.billing_address);
      const shippingAddress = this.formatAddress(order.shipping_address);
      const productNames = order.line_items?.map(item => `"${item.name}"`).join(';') || '';
      const productSKUs = order.line_items?.map(item => item.sku || '').join(';') || '';
      const productQuantities = order.line_items?.map(item => item.quantity).join(';') || '';
      const productPrices = order.line_items?.map(item => item.price).join(';') || '';
      const paymentMethods = order.payment_gateway_names?.join(';') || '';

      const row = [
        order.shopifyOrderId || '',
        order.order_number || '',
        `"${order.name || ''}"`,
        `"${order.email || ''}"`,
        `"${customerName}"`,
        `"${order.phone || ''}"`,
        `"${this.formatDate(order.created_at)}"`,
        `"${order.fulfillment_status || 'unfulfilled'}"`,
        `"${order.financial_status || ''}"`,
        `"${order.fulfillment_status || 'pending'}"`,
        order.currency || '',
        order.total_price || '0',
        order.subtotal_price || '0',
        order.total_tax || '0',
        order.shipping_lines?.[0]?.price || '0',
        order.total_discounts || '0',
        `"${paymentMethods}"`,
        `"${billingAddress}"`,
        `"${shippingAddress}"`,
        order.line_items?.length || 0,
        productNames,
        productSKUs,
        productQuantities,
        productPrices,
        `"${order.tags || ''}"`,
        `"${this.formatDate(order.createdAt)}"`,
        `"${this.formatDate(order.updatedAt)}"`
      ];

      csvRows.push(row.join(','));
    });

    return csvRows.join('\n');
  }

  formatAddress(address) {
    if (!address) return '';
    
    const parts = [
      address.first_name,
      address.last_name,
      address.company,
      address.address1,
      address.address2,
      address.city,
      address.province,
      address.country,
      address.zip,
      address.phone
    ].filter(Boolean);

    return parts.join(', ').replace(/"/g, '""');
  }

  formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0]; // YYYY-MM-DD format
  }

  async generateSalesReport(startDate, endDate, status = 'all') {
    try {
      console.log(`Generating sales report from ${startDate} to ${endDate} with status: ${status}`);

      // Build query
      const query = {};
      
      if (startDate || endDate) {
        query.created_at = {};
        if (startDate) {
          query.created_at.$gte = new Date(startDate);
        }
        if (endDate) {
          query.created_at.$lte = new Date(endDate);
        }
      }

      if (status && status !== 'all') {
        query.financial_status = status;
      }

      console.log('Query:', query);

      // Fetch orders
      const orders = await Order.find(query)
        .sort({ created_at: -1 })
        .lean();

      console.log(`Found ${orders.length} orders for report`);

      // Generate CSV
      const csvData = this.generateSalesReportCSV(orders);

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const filename = `sales_report_${timestamp}.csv`;

      // Save to reports directory
      const reportsDir = path.join(process.cwd(), 'reports');
      if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
      }

      const filePath = path.join(reportsDir, filename);
      fs.writeFileSync(filePath, csvData, 'utf8');

      // Calculate summary statistics
      const summary = this.calculateSummary(orders);

      return {
        filename,
        filePath,
        totalOrders: orders.length,
        summary,
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error generating sales report:', error.message);
      throw error;
    }
  }

  calculateSummary(orders) {
    const summary = {
      totalRevenue: 0,
      totalOrders: orders.length,
      averageOrderValue: 0,
      totalTax: 0,
      totalShipping: 0,
      totalDiscount: 0,
      ordersByStatus: {},
      ordersByPaymentMethod: {},
      topProducts: {},
      ordersByMonth: {},
      customersCount: new Set(),
      productsSold: 0
    };

    orders.forEach(order => {
      // Revenue calculations
      const totalPrice = parseFloat(order.total_price) || 0;
      const totalTax = parseFloat(order.total_tax) || 0;
      const shippingPrice = parseFloat(order.shipping_lines?.[0]?.price) || 0;
      const totalDiscount = parseFloat(order.total_discounts) || 0;

      summary.totalRevenue += totalPrice;
      summary.totalTax += totalTax;
      summary.totalShipping += shippingPrice;
      summary.totalDiscount += totalDiscount;

      // Order status
      const status = order.financial_status || 'unknown';
      summary.ordersByStatus[status] = (summary.ordersByStatus[status] || 0) + 1;

      // Payment methods
      const paymentMethods = order.payment_gateway_names || [];
      paymentMethods.forEach(method => {
        summary.ordersByPaymentMethod[method] = (summary.ordersByPaymentMethod[method] || 0) + 1;
      });

      // Top products
      order.line_items?.forEach(item => {
        const productName = item.name;
        const quantity = item.quantity || 1;
        summary.topProducts[productName] = (summary.topProducts[productName] || 0) + quantity;
        summary.productsSold += quantity;
      });

      // Orders by month
      const month = new Date(order.created_at).toISOString().slice(0, 7); // YYYY-MM
      summary.ordersByMonth[month] = (summary.ordersByMonth[month] || 0) + 1;

      // Unique customers
      if (order.email) {
        summary.customersCount.add(order.email);
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

  async getReportList() {
    try {
      const reportsDir = path.join(process.cwd(), 'reports');
      
      if (!fs.existsSync(reportsDir)) {
        return [];
      }

      const files = fs.readdirSync(reportsDir)
        .filter(file => file.endsWith('.csv'))
        .map(file => {
          const filePath = path.join(reportsDir, file);
          const stats = fs.statSync(filePath);
          
          return {
            filename: file,
            filePath,
            size: stats.size,
            createdAt: stats.birthtime,
            modifiedAt: stats.mtime
          };
        })
        .sort((a, b) => b.createdAt - a.createdAt);

      return files;
    } catch (error) {
      console.error('Error getting report list:', error.message);
      throw error;
    }
  }

  async deleteReport(filename) {
    try {
      const filePath = path.join(process.cwd(), 'reports', filename);
      
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error deleting report:', error.message);
      throw error;
    }
  }
}

export default new ReportService();

