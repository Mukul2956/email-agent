const fs = require('fs').promises;
const path = require('path');

/**
 * File Service - Handles JSON file operations
 * Provides reusable methods for reading/writing JSON data
 */
class FileService {
  constructor() {
    this.dataDir = path.join(__dirname, '../data');
  }

  /**
   * Read JSON file
   * @param {string} filename - Name of JSON file (without extension)
   * @returns {Promise<any>} Parsed JSON data
   */
  async readJSON(filename) {
    try {
      const filePath = path.join(this.dataDir, `${filename}.json`);
      const data = await fs.readFile(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.log(`File ${filename}.json not found, returning empty array/object`);
        return filename.includes('inbox') || filename.includes('emails') || filename.includes('drafts') ? [] : {};
      }
      throw error;
    }
  }

  /**
   * Write JSON file
   * @param {string} filename - Name of JSON file (without extension)
   * @param {any} data - Data to write
   * @returns {Promise<void>}
   */
  async writeJSON(filename, data) {
    try {
      const filePath = path.join(this.dataDir, `${filename}.json`);
      const jsonString = JSON.stringify(data, null, 2);
      await fs.writeFile(filePath, jsonString, 'utf8');
      console.log(`Successfully wrote ${filename}.json`);
    } catch (error) {
      console.error(`Error writing ${filename}.json:`, error);
      throw error;
    }
  }

  /**
   * Append to JSON array file
   * @param {string} filename - Name of JSON file (without extension)
   * @param {any} newItem - Item to append
   * @returns {Promise<any[]>} Updated array
   */
  async appendJSON(filename, newItem) {
    try {
      const currentData = await this.readJSON(filename);
      const updatedData = Array.isArray(currentData) ? [...currentData, newItem] : [newItem];
      await this.writeJSON(filename, updatedData);
      return updatedData;
    } catch (error) {
      console.error(`Error appending to ${filename}.json:`, error);
      throw error;
    }
  }

  /**
   * Update item in JSON array by ID
   * @param {string} filename - Name of JSON file
   * @param {string} id - ID of item to update
   * @param {any} updates - Updates to apply
   * @returns {Promise<any>} Updated item
   */
  async updateById(filename, id, updates) {
    try {
      const currentData = await this.readJSON(filename);
      if (!Array.isArray(currentData)) {
        throw new Error(`${filename}.json is not an array`);
      }

      const itemIndex = currentData.findIndex(item => item.id === id);
      if (itemIndex === -1) {
        throw new Error(`Item with ID ${id} not found in ${filename}.json`);
      }

      currentData[itemIndex] = { ...currentData[itemIndex], ...updates };
      await this.writeJSON(filename, currentData);
      return currentData[itemIndex];
    } catch (error) {
      console.error(`Error updating ${id} in ${filename}.json:`, error);
      throw error;
    }
  }

  /**
   * Delete item from JSON array by ID
   * @param {string} filename - Name of JSON file
   * @param {string} id - ID of item to delete
   * @returns {Promise<any[]>} Updated array
   */
  async deleteById(filename, id) {
    try {
      const currentData = await this.readJSON(filename);
      if (!Array.isArray(currentData)) {
        throw new Error(`${filename}.json is not an array`);
      }

      const updatedData = currentData.filter(item => item.id !== id);
      await this.writeJSON(filename, updatedData);
      return updatedData;
    } catch (error) {
      console.error(`Error deleting ${id} from ${filename}.json:`, error);
      throw error;
    }
  }

  /**
   * Check if file exists
   * @param {string} filename - Name of JSON file (without extension)
   * @returns {Promise<boolean>}
   */
  async fileExists(filename) {
    try {
      const filePath = path.join(this.dataDir, `${filename}.json`);
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get file stats
   * @param {string} filename - Name of JSON file (without extension)
   * @returns {Promise<any>} File stats
   */
  async getFileStats(filename) {
    try {
      const filePath = path.join(this.dataDir, `${filename}.json`);
      return await fs.stat(filePath);
    } catch (error) {
      console.error(`Error getting stats for ${filename}.json:`, error);
      throw error;
    }
  }
}

module.exports = new FileService();