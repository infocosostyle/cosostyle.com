import fs from 'fs';
import path from 'path';

const DATA_DIR = path.resolve('data');

const getFilePath = (collection) => path.join(DATA_DIR, `${collection}.json`);

const readCollection = (collection) => {
  const filePath = getFilePath(collection);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify([]));
    return [];
  }
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    return [];
  }
};

const writeCollection = (collection, data) => {
  const filePath = getFilePath(collection);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

export class JsonModel {
  constructor(collectionName) {
    this.collectionName = collectionName;
  }

  async find(query = {}) {
    const list = readCollection(this.collectionName);
    return list.filter((item) => {
      for (const key in query) {
        // Simple equality check
        if (item[key] !== query[key]) return false;
      }
      return true;
    });
  }

  async findOne(query = {}) {
    const list = readCollection(this.collectionName);
    return list.find((item) => {
      for (const key in query) {
        if (item[key] !== query[key]) return false;
      }
      return item;
    }) || null;
  }

  async findById(id) {
    const list = readCollection(this.collectionName);
    const cleanId = id?.toString();
    return list.find((item) => item.id?.toString() === cleanId || item._id?.toString() === cleanId) || null;
  }

  async create(doc) {
    const list = readCollection(this.collectionName);
    const newDoc = {
      _id: Date.now().toString() + Math.floor(Math.random() * 1000).toString(),
      id: Date.now(),
      createdAt: new Date().toISOString(),
      ...doc
    };
    list.push(newDoc);
    writeCollection(this.collectionName, list);
    return newDoc;
  }

  async findByIdAndUpdate(id, update, options = {}) {
    const list = readCollection(this.collectionName);
    const cleanId = id?.toString();
    const idx = list.findIndex((item) => item.id?.toString() === cleanId || item._id?.toString() === cleanId);
    if (idx === -1) return null;

    // Handle Mongoose-like $push or simple override
    let updatedDoc = { ...list[idx] };
    if (update.$push) {
      for (const key in update.$push) {
        if (!updatedDoc[key]) updatedDoc[key] = [];
        updatedDoc[key].push(update.$push[key]);
      }
    } else {
      updatedDoc = { ...updatedDoc, ...update };
    }

    list[idx] = updatedDoc;
    writeCollection(this.collectionName, list);
    return updatedDoc;
  }

  async findByIdAndDelete(id) {
    const list = readCollection(this.collectionName);
    const cleanId = id?.toString();
    const filtered = list.filter((item) => item.id?.toString() !== cleanId && item._id?.toString() !== cleanId);
    writeCollection(this.collectionName, filtered);
    return { success: true };
  }

  async deleteMany(query = {}) {
    const list = readCollection(this.collectionName);
    const keys = Object.keys(query);
    const filtered = list.filter((item) => {
      if (keys.length === 0) return false;
      for (const key of keys) {
        if (item[key] === query[key]) return false;
      }
      return true;
    });
    writeCollection(this.collectionName, filtered);
    return { deletedCount: list.length - filtered.length };
  }

  async countDocuments(query = {}) {
    const list = await this.find(query);
    return list.length;
  }
}
