import mongoose from 'mongoose';
import { isJsonDb } from '../config/db.js';
import { JsonModel } from '../config/jsonDb.js';

const addressSchema = new mongoose.Schema({
  id: { type: Number, default: Date.now },
  type: { type: String, default: 'Shipping' },
  name: { type: String, required: true },
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  zip: { type: String, required: true },
  country: { type: String, default: 'United States' },
  isDefault: { type: Boolean, default: false }
});

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'user' },
  phone: { type: String, default: '' },
  avatar: { type: String, default: '' },
  addresses: [addressSchema],
  wishlist: [{ type: Number }], // Product IDs
  loyaltyPoints: { type: Number, default: 0 },
  referralCode: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

let mongooseUserModel;
const jsonUserModel = new JsonModel('users');

const getUserModel = () => {
  if (isJsonDb()) {
    return jsonUserModel;
  }
  if (!mongooseUserModel) {
    mongooseUserModel = mongoose.model('User', userSchema);
  }
  return mongooseUserModel;
};

const UserProxy = new Proxy({}, {
  get: (target, prop) => {
    const model = getUserModel();
    const val = model[prop];
    if (typeof val === 'function') {
      return val.bind(model);
    }
    return val;
  }
});

export default UserProxy;
