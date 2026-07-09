import mongoose from 'mongoose';
import { isJsonDb } from '../config/db.js';
import { JsonModel } from '../config/jsonDb.js';

const orderItemSchema = new mongoose.Schema({
  id: Number,
  title: String,
  price: Number,
  image: String,
  category: String,
  size: String,
  color: String,
  quantity: Number
});

const orderSchema = new mongoose.Schema({
  userEmail: { type: String, required: true },
  items: [orderItemSchema],
  subtotal: { type: Number, required: true },
  shipping: { type: Number, required: true },
  tax: { type: Number, required: true },
  discount: { type: Number, default: 0.0 },
  total: { type: Number, required: true },
  status: { type: String, default: 'Placed' },
  trackingNumber: { type: String, required: true },
  shippingAddress: {
    name: String,
    street: String,
    city: String,
    state: String,
    zip: String,
    country: String
  },
  paymentDetails: {
    method: String,
    last4: String
  },
  date: { type: String, required: true }
});

let mongooseOrderModel;
const jsonOrderModel = new JsonModel('orders');

const getOrderModel = () => {
  if (isJsonDb()) {
    return jsonOrderModel;
  }
  if (!mongooseOrderModel) {
    mongooseOrderModel = mongoose.model('Order', orderSchema);
  }
  return mongooseOrderModel;
};

const OrderProxy = new Proxy({}, {
  get: (target, prop) => {
    const model = getOrderModel();
    const val = model[prop];
    if (typeof val === 'function') {
      return val.bind(model);
    }
    return val;
  }
});

export default OrderProxy;
