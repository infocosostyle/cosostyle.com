import mongoose from 'mongoose';
import { isJsonDb } from '../config/db.js';
import { JsonModel } from '../config/jsonDb.js';

const reviewSchema = new mongoose.Schema({
  productId: { type: Number, required: true },
  user: { type: String, required: true },
  rating: { type: Number, required: true },
  comment: { type: String, required: true },
  likes: { type: Number, default: 0 },
  helpful: { type: Boolean, default: false },
  date: { type: String, required: true }
});

let mongooseReviewModel;
const jsonReviewModel = new JsonModel('reviews');

const getReviewModel = () => {
  if (isJsonDb()) {
    return jsonReviewModel;
  }
  if (!mongooseReviewModel) {
    mongooseReviewModel = mongoose.model('Review', reviewSchema);
  }
  return mongooseReviewModel;
};

const ReviewProxy = new Proxy({}, {
  get: (target, prop) => {
    const model = getReviewModel();
    const val = model[prop];
    if (typeof val === 'function') {
      return val.bind(model);
    }
    return val;
  }
});

export default ReviewProxy;
