import mongoose from 'mongoose';
import { isJsonDb } from '../config/db.js';
import { JsonModel } from '../config/jsonDb.js';

const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  discountPercent: { type: Number, required: true },
  active: { type: Boolean, default: true }
});

let mongooseCouponModel;
const jsonCouponModel = new JsonModel('coupons');

const getCouponModel = () => {
  if (isJsonDb()) {
    return jsonCouponModel;
  }
  if (!mongooseCouponModel) {
    mongooseCouponModel = mongoose.model('Coupon', couponSchema);
  }
  return mongooseCouponModel;
};

const CouponProxy = new Proxy({}, {
  get: (target, prop) => {
    const model = getCouponModel();
    const val = model[prop];
    if (typeof val === 'function') {
      return val.bind(model);
    }
    return val;
  }
});

export default CouponProxy;
