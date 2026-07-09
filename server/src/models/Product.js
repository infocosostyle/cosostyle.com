import mongoose from 'mongoose';
import { isJsonDb } from '../config/db.js';
import { JsonModel } from '../config/jsonDb.js';

const productSchema = new mongoose.Schema({
  id: { type: Number, required: true },
  sku: { type: String, default: '' },
  title: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: String, required: true },
  subcategory: { type: String, default: '' },
  collectionName: { type: String, default: '' },
  gender: { type: String, default: 'unisex' },
  tag: { type: String, default: 'NEW' },
  image: { type: String, required: true },
  images: [String],
  color: { type: String, required: true },
  colors: [{
    name: String,
    value: String,
    class: String
  }],
  sizes: [String],
  description: { type: String, required: true },
  specs: [String],
  highlights: [String],
  fabric: { type: String, default: '100% Cotton' },
  material: { type: String, default: 'Cotton' },
  fitType: { type: String, default: 'Regular Fit' },
  sleeveType: { type: String, default: 'Half Sleeve' },
  neckType: { type: String, default: 'Round Neck' },
  pattern: { type: String, default: 'Solid' },
  occasion: { type: String, default: 'Casual' },
  washCare: { type: String, default: 'Wash cold, hang to dry.' },
  countryOfOrigin: { type: String, default: 'India' },
  packageContents: { type: String, default: '1 T-Shirt' },
  brandInfo: { type: String, default: 'CoSoStyle' },
  sizeChart: { type: mongoose.Schema.Types.Mixed, default: null },
  seoTitle: { type: String, default: '' },
  seoDescription: { type: String, default: '' },
  seoKeywords: [String],
  inventory: { type: Number, default: 100 },
  rating: { type: Number, default: 5.0 },
  reviewsCount: { type: Number, default: 0 },
  availability: { type: String, default: 'in-stock' },
  variants: [{
    sku: String,
    size: String,
    color: String,
    price: Number,
    inventory: Number,
    images: [String]
  }]
});

let mongooseProductModel;
const jsonProductModel = new JsonModel('products');

const getProductModel = () => {
  if (isJsonDb()) {
    return jsonProductModel;
  }
  if (!mongooseProductModel) {
    mongooseProductModel = mongoose.model('Product', productSchema);
  }
  return mongooseProductModel;
};

const ProductProxy = new Proxy({}, {
  get: (target, prop) => {
    const model = getProductModel();
    const val = model[prop];
    if (typeof val === 'function') {
      return val.bind(model);
    }
    return val;
  }
});

export default ProductProxy;
