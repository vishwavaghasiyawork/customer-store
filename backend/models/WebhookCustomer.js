import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema({
  address1: String,
  city: String,
  province: String,
  zip: String,
  country: String,
  firstName: String,
  lastName: String,
  phone: String
}, { _id: false });

const webhookCustomerSchema = new mongoose.Schema({
  shopifyId: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true
  },
  firstName: String,
  lastName: String,
  phone: String,
  addresses: [addressSchema],
  ordersCount: {
    type: Number,
    default: 0
  },
  totalSpent: {
    type: Number,
    default: 0
  },
  tags: [String],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

webhookCustomerSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.model('WebhookCustomer', webhookCustomerSchema);
