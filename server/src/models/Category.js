import mongoose from 'mongoose';
import { isJsonDb } from '../config/db.js';
import { JsonModel } from '../config/jsonDb.js';

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true }
});

let mongooseCategoryModel;
const jsonCategoryModel = new JsonModel('categories');

const getCategoryModel = () => {
  if (isJsonDb()) {
    return jsonCategoryModel;
  }
  if (!mongooseCategoryModel) {
    mongooseCategoryModel = mongoose.model('Category', categorySchema);
  }
  return mongooseCategoryModel;
};

const CategoryProxy = new Proxy({}, {
  get: (target, prop) => {
    const model = getCategoryModel();
    const val = model[prop];
    if (typeof val === 'function') {
      return val.bind(model);
    }
    return val;
  }
});

export default CategoryProxy;
