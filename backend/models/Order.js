import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema({
  first_name: String,
  last_name: String,
  address1: String,
  address2: String,
  city: String,
  province: String,
  country: String,
  zip: String,
  phone: String,
  company: String,
  latitude: Number,
  longitude: Number,
  name: String,
  country_code: String,
  province_code: String
}, { _id: false });

const lineItemSchema = new mongoose.Schema({
  id: Number,
  admin_graphql_api_id: String,
  name: String,
  title: String,
  quantity: Number,
  price: String,
  product_id: Number,
  variant_id: Number,
  sku: String,
  vendor: String,
  product_exists: Boolean,
  requires_shipping: Boolean,
  taxable: Boolean,
  gift_card: Boolean,
  fulfillment_service: String,
  grams: Number,
  variant_title: String,
  variant_inventory_management: String,
  properties: [mongoose.Schema.Types.Mixed],
  tax_lines: [{
    title: String,
    price: String,
    rate: Number,
    channel_liable: Boolean
  }],
  discount_allocations: [mongoose.Schema.Types.Mixed],
  duties: [mongoose.Schema.Types.Mixed],
  price_set: {
    shop_money: {
      amount: String,
      currency_code: String
    },
    presentment_money: {
      amount: String,
      currency_code: String
    }
  },
  total_discount: String,
  total_discount_set: {
    shop_money: {
      amount: String,
      currency_code: String
    },
    presentment_money: {
      amount: String,
      currency_code: String
    }
  }
}, { _id: false });

const customerSchema = new mongoose.Schema({
  id: Number,
  email: String,
  first_name: String,
  last_name: String,
  phone: String,
  created_at: Date,
  updated_at: Date,
  state: String,
  tags: String,
  currency: String,
  verified_email: Boolean,
  tax_exempt: Boolean,
  admin_graphql_api_id: String,
  default_address: addressSchema
}, { _id: false });

const orderSchema = new mongoose.Schema({
  shopifyOrderId: {
    type: Number,
    required: true,
    unique: true
  },
  admin_graphql_api_id: String,
  app_id: Number,
  browser_ip: String,
  buyer_accepts_marketing: Boolean,
  cancel_reason: String,
  cancelled_at: Date,
  cart_token: String,
  checkout_id: Number,
  checkout_token: String,
  confirmation_number: String,
  confirmed: Boolean,
  contact_email: String,
  created_at: Date,
  updated_at: Date,
  processed_at: Date,
  currency: String,
  financial_status: String,
  fulfillment_status: String,
  total_price: String,
  subtotal_price: String,
  total_tax: String,
  total_weight: Number,
  order_number: Number,
  name: String,
  email: String,
  phone: String,
  tags: String,
  note: String,
  token: String,
  test: Boolean,
  customer: customerSchema,
  billing_address: addressSchema,
  shipping_address: addressSchema,
  line_items: [lineItemSchema],
  shipping_lines: [{
    id: Number,
    code: String,
    title: String,
    carrier_identifier: String,
    price: String,
    discounted_price: String,
    requested_fulfillment_service_id: String,
    source: String,
    phone: String,
    tax_lines: [mongoose.Schema.Types.Mixed],
    discount_allocations: [mongoose.Schema.Types.Mixed],
    price_set: {
      shop_money: {
        amount: String,
        currency_code: String
      },
      presentment_money: {
        amount: String,
        currency_code: String
      }
    },
    discounted_price_set: {
      shop_money: {
        amount: String,
        currency_code: String
      },
      presentment_money: {
        amount: String,
        currency_code: String
      }
    }
  }],
  payment_gateway_names: [String],
  discount_codes: [mongoose.Schema.Types.Mixed],
  discount_applications: [mongoose.Schema.Types.Mixed],
  tax_lines: [mongoose.Schema.Types.Mixed],
  fulfillments: [mongoose.Schema.Types.Mixed],
  refunds: [mongoose.Schema.Types.Mixed],
  current_total_price: String,
  current_subtotal_price: String,
  current_total_tax: String,
  current_total_discounts: String,
  total_discounts: String,
  total_shipping_price_set: {
    shop_money: {
      amount: String,
      currency_code: String
    },
    presentment_money: {
      amount: String,
      currency_code: String
    }
  },
  current_total_price_set: {
    shop_money: {
      amount: String,
      currency_code: String
    },
    presentment_money: {
      amount: String,
      currency_code: String
    }
  },
  current_subtotal_price_set: {
    shop_money: {
      amount: String,
      currency_code: String
    },
    presentment_money: {
      amount: String,
      currency_code: String
    }
  },
  current_total_tax_set: {
    shop_money: {
      amount: String,
      currency_code: String
    },
    presentment_money: {
      amount: String,
      currency_code: String
    }
  },
  current_total_discounts_set: {
    shop_money: {
      amount: String,
      currency_code: String
    },
    presentment_money: {
      amount: String,
      currency_code: String
    }
  },
  subtotal_price_set: {
    shop_money: {
      amount: String,
      currency_code: String
    },
    presentment_money: {
      amount: String,
      currency_code: String
    }
  },
  total_price_set: {
    shop_money: {
      amount: String,
      currency_code: String
    },
    presentment_money: {
      amount: String,
      currency_code: String
    }
  },
  total_tax_set: {
    shop_money: {
      amount: String,
      currency_code: String
    },
    presentment_money: {
      amount: String,
      currency_code: String
    }
  },
  total_discounts_set: {
    shop_money: {
      amount: String,
      currency_code: String
    },
    presentment_money: {
      amount: String,
      currency_code: String
    }
  },
  total_line_items_price_set: {
    shop_money: {
      amount: String,
      currency_code: String
    },
    presentment_money: {
      amount: String,
      currency_code: String
    }
  },
  total_line_items_price: String,
  total_outstanding: String,
  total_tip_received: String,
  total_cash_rounding_payment_adjustment_set: {
    shop_money: {
      amount: String,
      currency_code: String
    },
    presentment_money: {
      amount: String,
      currency_code: String
    }
  },
  total_cash_rounding_refund_adjustment_set: {
    shop_money: {
      amount: String,
      currency_code: String
    },
    presentment_money: {
      amount: String,
      currency_code: String
    }
  },
  order_status_url: String,
  landing_site: String,
  source_name: String,
  referring_site: String,
  source_identifier: String,
  source_url: String,
  processed_at: Date,
  device_id: Number,
  location_id: Number,
  reference: String,
  po_number: String,
  presentment_currency: String,
  customer_locale: String,
  estimated_taxes: Boolean,
  taxes_included: Boolean,
  duties_included: Boolean,
  original_total_additional_fees_set: mongoose.Schema.Types.Mixed,
  original_total_duties_set: mongoose.Schema.Types.Mixed,
  current_total_additional_fees_set: mongoose.Schema.Types.Mixed,
  current_total_duties_set: mongoose.Schema.Types.Mixed,
  merchant_business_entity_id: Number,
  merchant_of_record_app_id: Number,
  user_id: Number,
  payment_terms: mongoose.Schema.Types.Mixed,
  note_attributes: [mongoose.Schema.Types.Mixed],
  client_details: {
    accept_language: String,
    browser_height: Number,
    browser_ip: String,
    browser_width: Number,
    session_hash: String,
    user_agent: String
  }
}, {
  timestamps: true
});

orderSchema.index({ created_at: -1 });
orderSchema.index({ email: 1 });

export default mongoose.model('Order', orderSchema);
