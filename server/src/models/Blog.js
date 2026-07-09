import mongoose from 'mongoose';
import { isJsonDb } from '../config/db.js';
import { JsonModel } from '../config/jsonDb.js';

const blogSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, required: true },
  image: { type: String, required: true },
  category: { type: String, required: true },
  excerpt: { type: String, required: true },
  content: { type: String, required: true },
  tags: [String],
  date: { type: String, required: true },
  readTime: { type: String, required: true }
});

let mongooseBlogModel;
const jsonBlogModel = new JsonModel('blogs');

const getBlogModel = () => {
  if (isJsonDb()) {
    return jsonBlogModel;
  }
  if (!mongooseBlogModel) {
    mongooseBlogModel = mongoose.model('Blog', blogSchema);
  }
  return mongooseBlogModel;
};

const BlogProxy = new Proxy({}, {
  get: (target, prop) => {
    const model = getBlogModel();
    const val = model[prop];
    if (typeof val === 'function') {
      return val.bind(model);
    }
    return val;
  }
});

export default BlogProxy;
