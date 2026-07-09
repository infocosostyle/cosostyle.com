import mongoose from 'mongoose';
import { isJsonDb } from '../config/db.js';
import { JsonModel } from '../config/jsonDb.js';

const supportTicketSchema = new mongoose.Schema({
  ticketId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  subject: { type: String, required: true },
  message: { type: String, required: true },
  category: { type: String, default: 'General' },
  status: { type: String, default: 'Open' }, // Open | In Progress | Resolved | Closed
  priority: { type: String, default: 'Normal' }, // Low | Normal | High | Urgent
  adminNotes: { type: String, default: '' },
  userEmail: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

let mongooseTicketModel;
const jsonTicketModel = new JsonModel('tickets');

const getTicketModel = () => {
  if (isJsonDb()) return jsonTicketModel;
  if (!mongooseTicketModel) {
    mongooseTicketModel = mongoose.model('SupportTicket', supportTicketSchema);
  }
  return mongooseTicketModel;
};

const TicketProxy = new Proxy({}, {
  get: (target, prop) => {
    const model = getTicketModel();
    const val = model[prop];
    if (typeof val === 'function') return val.bind(model);
    return val;
  }
});

export default TicketProxy;
