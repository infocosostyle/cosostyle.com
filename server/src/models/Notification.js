import mongoose from 'mongoose';
import { isJsonDb } from '../config/db.js';
import { JsonModel } from '../config/jsonDb.js';

const notificationSchema = new mongoose.Schema({
  userEmail: { type: String, required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
  link: { type: String, default: '' },
  createdAt: { type: String, default: () => new Date().toISOString() }
});

let mongooseNotificationModel;
const jsonNotificationModel = new JsonModel('notifications');

const getNotificationModel = () => {
  if (isJsonDb()) {
    return jsonNotificationModel;
  }
  if (!mongooseNotificationModel) {
    mongooseNotificationModel = mongoose.model('Notification', notificationSchema);
  }
  return mongooseNotificationModel;
};

const NotificationProxy = new Proxy({}, {
  get: (target, prop) => {
    const model = getNotificationModel();
    const val = model[prop];
    if (typeof val === 'function') {
      return val.bind(model);
    }
    return val;
  }
});

export default NotificationProxy;
