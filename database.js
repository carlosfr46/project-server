const fs = require('fs').promises;
const path = require('path');

const DB_PATH = path.join(__dirname, 'database.json');

class Database {
  async readDatabase() {
    try {
      const data = await fs.readFile(DB_PATH, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        // File doesn't exist, create initial structure
        const initialData = {
          products: [],
          users: [],
          orders: []
        };
        await this.writeDatabase(initialData);
        return initialData;
      }
      throw error;
    }
  }

  async writeDatabase(data) {
    try {
      await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
      console.error('Error writing to database:', error);
      throw error;
    }
  }

  async getCollection(collectionName) {
    const db = await this.readDatabase();
    return db[collectionName] || [];
  }

  async updateCollection(collectionName, data) {
    const db = await this.readDatabase();
    db[collectionName] = data;
    await this.writeDatabase(db);
    return data;
  }

  async addToCollection(collectionName, item) {
    const collection = await this.getCollection(collectionName);
    
    // Generate ID if not provided
    if (!item.id) {
      const maxId = collection.length > 0 ? Math.max(...collection.map(i => parseInt(i.id) || 0)) : 0;
      item.id = (maxId + 1).toString();
    }
    
    collection.push(item);
    await this.updateCollection(collectionName, collection);
    return item;
  }

  async findInCollection(collectionName, query) {
    const collection = await this.getCollection(collectionName);
    return collection.filter(item => {
      return Object.keys(query).every(key => item[key] === query[key]);
    });
  }

  async findOneInCollection(collectionName, query) {
    const results = await this.findInCollection(collectionName, query);
    return results[0] || null;
  }

  async updateInCollection(collectionName, id, updates) {
    const collection = await this.getCollection(collectionName);
    const index = collection.findIndex(item => item.id === id);
    
    if (index === -1) {
      throw new Error('Item not found');
    }
    
    collection[index] = { ...collection[index], ...updates };
    await this.updateCollection(collectionName, collection);
    return collection[index];
  }

  async deleteFromCollection(collectionName, id) {
    const collection = await this.getCollection(collectionName);
    const filteredCollection = collection.filter(item => item.id !== id);
    
    if (filteredCollection.length === collection.length) {
      throw new Error('Item not found');
    }
    
    await this.updateCollection(collectionName, filteredCollection);
    return true;
  }
}

module.exports = new Database();