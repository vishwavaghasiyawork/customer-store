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

const customerSchema = new mongoose.Schema({
  shopifyCustomerId: {
    type: String,
    required: true,
    unique: true
  },
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  phone: String,
  tags: [String],
  addresses: [addressSchema],
  emailMarketingConsent: {
    marketingState: String,
    marketingOptInLevel: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

customerSchema.pre('save', function(next) {
  this.updatedAt = new Date();
});

export default mongoose.model('Customer', customerSchema);
