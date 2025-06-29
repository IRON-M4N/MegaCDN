import PostgresConnector from './postgres';
import SQLiteConnector from './sqlite';
import MongoDBConnector from './mongoose';
import { DatabaseConnector, DatabaseType, FileDeleteRecord, CustomFileRecord, BatchResult } from '../types';

class DatabaseManager {
  private connector: DatabaseConnector | null = null;
  private dbType: DatabaseType | null = null;
  private err: string = 'Database not initialized';

  async initialize(databaseUrl?: string): Promise<boolean> {
    if (!databaseUrl || databaseUrl === 'null' || databaseUrl === null) {
      this.dbType = 'sqlite';
      this.connector = new SQLiteConnector();
    } else if (databaseUrl.startsWith('postgres://') || databaseUrl.startsWith('postgresql://')) {
      // PostgreSQL
      this.dbType = 'postgres';
      this.connector = new PostgresConnector(databaseUrl);
    } else if (databaseUrl.startsWith('mongodb://') || databaseUrl.startsWith('mongodb+srv://')) {
      // MongoDB
      this.dbType = 'mongodb';
      this.connector = new MongoDBConnector(databaseUrl);
    } else if (databaseUrl.startsWith('sqlite://')) {
      // SQLite
      this.dbType = 'sqlite';
      const dbPath = databaseUrl.replace('sqlite://', '');
      this.connector = new SQLiteConnector(dbPath);
    } else {
      // Default to SQLite if no other db
      this.dbType = 'sqlite';
      this.connector = new SQLiteConnector();
    }

    console.log(`Connecting to ${this.dbType}...`);
    
    try {
      const connected = await this.connector.connect();
      if (!connected) {
        throw new Error(`Failed to connect to ${this.dbType}`);
      }
      return true;
    } catch (error) {
      console.error(`Connection failed for ${this.dbType}:`, error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.connector) {
      await this.connector.disconnect();
      this.connector = null;
      this.dbType = null;
    }
  }

  async save(data: FileDeleteRecord): Promise<any> {
    if (!this.connector) {
      throw new Error(this.err);
    }
    return await this.connector.save(data);
  }

  async get(fileName: string): Promise<any> {
    if (!this.connector) {
      throw new Error(this.err);
    }
    return await this.connector.get(fileName);
  }

  async update(fileName: string, data: Partial<FileDeleteRecord>): Promise<boolean> {
    if (!this.connector) {
      throw new Error(this.err);
    }
    return await this.connector.update(fileName, data);
  }

  async delete(fileName: string): Promise<boolean> {
    if (!this.connector) {
      throw new Error(this.err);
    }
    return await this.connector.delete(fileName);
  }

  async findExpired(currentTime: number): Promise<any[]> {
    if (!this.connector) {
      throw new Error(this.err);
    }
    return await this.connector.findExpired(currentTime);
  }

  async saveCustomFile(data: CustomFileRecord): Promise<any> {
    if (!this.connector) {
      throw new Error(this.err);
    }
    
    if ('saveCustomFile' in this.connector && typeof this.connector.saveCustomFile === 'function') {
      return await (this.connector as any).saveCustomFile(data);
    }
    
    throw new Error(`filename not in ${this.dbType} database`);
  }

  async getCustomFile(customFileName: string): Promise<any> {
    if (!this.connector) {
      throw new Error(this.err);
    }
    
    if ('getCustomFile' in this.connector && typeof this.connector.getCustomFile === 'function') {
      return await (this.connector as any).getCustomFile(customFileName);
    }
    
    throw new Error(`filename not available ${this.dbType} database`);
  }

  async deleteCustomFile(customFileName: string): Promise<boolean> {
    if (!this.connector) {
      throw new Error(this.err);
    }
    
    if ('deleteCustomFile' in this.connector && typeof this.connector.deleteCustomFile === 'function') {
      return await (this.connector as any).deleteCustomFile(customFileName);
    }
    
    throw new Error(`filename not available ${this.dbType} database`);
  }

  getDbType(): DatabaseType | null {
    return this.dbType;
  }

  isConnected(): boolean {
    return this.connector ? this.connector.isConnected : false;
  }

  supportsCustomFilenames(): boolean {
    if (!this.connector) return false;
    
    return 'saveCustomFile' in this.connector && 
           'getCustomFile' in this.connector && 
           'deleteCustomFile' in this.connector;
  }

  async batchSave(dataArray: FileDeleteRecord[]): Promise<BatchResult<any>[]> {
    if (!this.connector) {
      throw new Error(this.err);
    }
    
    const results: BatchResult<any>[] = [];
    for (const data of dataArray) {
      try {
        const result = await this.connector.save(data);
        results.push({ success: true, data: result });
      } catch (error) {
        results.push({ success: false, error: (error as Error).message });
      }
    }
    return results;
  }

  async batchDelete(fileNames: string[]): Promise<BatchResult<boolean>[]> {
    if (!this.connector) {
      throw new Error(this.err);
    }
    
    const results: BatchResult<boolean>[] = [];
    for (const fileName of fileNames) {
      try {
        const result = await this.connector.delete(fileName);
        results.push({ success: true, deleted: result });
      } catch (error) {
        results.push({ success: false, error: (error as Error).message });
      }
    }
    return results;
  }

  async batchSaveCustomFiles(dataArray: CustomFileRecord[]): Promise<BatchResult<any>[]> {
    if (!this.connector) {
      throw new Error(this.err);
    }
    
    const results: BatchResult<any>[] = [];
    for (const data of dataArray) {
      try {
        const result = await this.saveCustomFile(data);
        results.push({ success: true, data: result });
      } catch (error) {
        results.push({ success: false, error: (error as Error).message });
      }
    }
    return results;
  }

  async batchDeleteCustomFiles(customFileNames: string[]): Promise<BatchResult<boolean>[]> {
    if (!this.connector) {
      throw new Error(this.err);
    }
    
    const results: BatchResult<boolean>[] = [];
    for (const customFileName of customFileNames) {
      try {
        const result = await this.deleteCustomFile(customFileName);
        results.push({ success: true, deleted: result });
      } catch (error) {
        results.push({ success: false, error: (error as Error).message });
      }
    }
    return results;
  }
}

// singleton instance
const databaseManager = new DatabaseManager();
export default databaseManager;

