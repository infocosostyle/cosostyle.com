import mongoose from 'mongoose';
import { isJsonDb } from '../config/db.js';
import { JsonModel } from '../config/jsonDb.js';

const bannerSchema = new mongoose.Schema({
  title: { type: String, required: true },
  subtitle: { type: String, required: true },
  image: { type: String, required: true },
  videoUrl: { type: String, default: '' },
  link: { type: String, required: true },
  active: { type: Boolean, default: true },
  position: { type: Number, default: 0 }
});

let mongooseBannerModel;
const jsonBannerModel = new JsonModel('banners');

const getBannerModel = () => {
  if (isJsonDb()) {
    return jsonBannerModel;
  }
  if (!mongooseBannerModel) {
    mongooseBannerModel = mongoose.model('Banner', bannerSchema);
  }
  return mongooseBannerModel;
};

const BannerProxy = new Proxy({}, {
  get: (target, prop) => {
    const model = getBannerModel();
    const val = model[prop];
    if (typeof val === 'function') {
      return val.bind(model);
    }
    return val;
  }
});

export default BannerProxy;
