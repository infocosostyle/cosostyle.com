import mongoose from 'mongoose';
import { isJsonDb } from '../config/db.js';
import { JsonModel } from '../config/jsonDb.js';

const returnSchema = new mongoose.Schema({
  orderId: { type: String, required: true },
  userEmail: { type: String, required: true },
  items: [{
    id: Number,
    title: String,
    price: Number,
    quantity: Number,
    size: String,
    color: String,
    image: String
  }],
  reason: { type: String, required: true },
  status: { type: String, default: 'Pending' }, // 'Pending' | 'Approved' | 'Rejected'
  refundAmount: { type: Number, required: true },
  createdAt: { type: String, default: () => new Date().toISOString() }
});

let mongooseReturnModel;
const jsonReturnModel = new JsonModel('returns');

const getReturnModel = () => {
  if (isJsonDb()) {
    return jsonReturnModel;
  }
  if (!mongooseReturnModel) {
    mongooseReturnModel = mongoose.model('Return', returnSchema);
  }
  return mongooseReturnModel;
};

const ReturnProxy = new Proxy({}, {
  get: (target, prop) => {
    const model = getReturnModel();
    const val = model[prop];
    if (typeof val === 'function') {
      return val.bind(model);
    }
    return val;
  }
});

export default ReturnProxy;
