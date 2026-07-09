import mongoose from 'mongoose';
import { isJsonDb } from '../config/db.js';
import { JsonModel } from '../config/jsonDb.js';

const newsletterSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  subscribedAt: { type: Date, default: Date.now },
  active: { type: Boolean, default: true }
});

let mongooseNewsletterModel;
const jsonNewsletterModel = new JsonModel('newsletter');

const getNewsletterModel = () => {
  if (isJsonDb()) return jsonNewsletterModel;
  if (!mongooseNewsletterModel) {
    mongooseNewsletterModel = mongoose.model('Newsletter', newsletterSchema);
  }
  return mongooseNewsletterModel;
};

const NewsletterProxy = new Proxy({}, {
  get: (target, prop) => {
    const model = getNewsletterModel();
    const val = model[prop];
    if (typeof val === 'function') return val.bind(model);
    return val;
  }
});

export default NewsletterProxy;
