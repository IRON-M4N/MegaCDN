import * as mongoose from 'mongoose';
import { DatabaseConnector, FileDeleteRecord, CustomFileRecord } from '../types';

interface FileDeleteDocument extends mongoose.Document {
  fileName: string;
  deleteTime: number;
}

interface CustomFileDocument extends mongoose.Document {
  customFileName: string;
  originalMegaUrl: string;
  fileExtension: string;
}

class MongoDBConnector implements DatabaseConnector {
  private databaseUrl: string;
  private FileDelete: mongoose.Model<FileDeleteDocument> | null = null;
  private CustomFile: mongoose.Model<CustomFileDocument> | null = null;
  public isConnected: boolean = false;

  constructor(databaseUrl: string) {
    this.databaseUrl = databaseUrl;
  }

  async connect(): Promise<boolean> {
    try {
      await mongoose.connect(this.databaseUrl, {
        maxPoolSize: 5,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });
      
      console.log('Connected to MongoDB..');
      
      const fileDeleteSchema = new mongoose.Schema({
        fileName: { 
          type: String, 
          required: true, 
          unique: true 
        },
        deleteTime: { 
          type: Number, 
          required: true 
        },
      }, {
        timestamps: true,
        collection: 'file_deletes'
      });

      const customFileSchema = new mongoose.Schema({
        customFileName: { 
          type: String, 
          required: true, 
          unique: true 
        },
        originalMegaUrl: { 
          type: String, 
          required: true 
        },
        fileExtension: { 
          type: String, 
          required: true 
        },
      }, {
        timestamps: true,
        collection: 'custom_files'
      });

      this.FileDelete = mongoose.model<FileDeleteDocument>('FileDelete', fileDeleteSchema);
      this.CustomFile = mongoose.model<CustomFileDocument>('CustomFile', customFileSchema);
      this.isConnected = true;
      
      return true;
    } catch (error) {
      console.error('MongoDB connection:', error);
      return false;
    }
  }

  async disconnect(): Promise<void> {
    if (this.isConnected) {
      await mongoose.disconnect();
      this.isConnected = false;
    }
  }

  async save(data: FileDeleteRecord): Promise<any> {
    if (!this.isConnected || !this.FileDelete) throw new Error('Database not connected');
    
    try {
      const result = await this.FileDelete.findOneAndUpdate(
        { fileName: data.fileName },
        { fileName: data.fileName, deleteTime: data.deleteTime },
        { upsert: true, new: true }
      );
      return result;
    } catch (error) {
      console.error('Error saving:', error);
      throw error;
    }
  }

  async get(fileName: string): Promise<any> {
    if (!this.isConnected || !this.FileDelete) throw new Error('Database not connected');
    
    try {
      const result = await this.FileDelete.findOne({ fileName });
      return result;
    } catch (error) {
      console.error('Error getting it:', error);
      throw error;
    }
  }

  async update(fileName: string, data: Partial<FileDeleteRecord>): Promise<boolean> {
    if (!this.isConnected || !this.FileDelete) throw new Error('Database not connected');
    
    try {
      const result = await this.FileDelete.updateOne(
        { fileName },
        { $set: data }
      );
      return result.modifiedCount > 0;
    } catch (error) {
      console.error('Error updating:', error);
      throw error;
    }
  }

  async delete(fileName: string): Promise<boolean> {
    if (!this.isConnected || !this.FileDelete) throw new Error('Database not connected');
    
    try {
      const result = await this.FileDelete.deleteOne({ fileName });
      return result.deletedCount > 0;
    } catch (error) {
      console.error('Error deleting from:', error);
      throw error;
    }
  }

  async findExpired(currentTime: number): Promise<any[]> {
    if (!this.isConnected || !this.FileDelete) throw new Error('Database not connected');
    
    try {
      const results = await this.FileDelete.find({
        deleteTime: { $lte: currentTime }
      });
      return results;
    } catch (error) {
      console.error('Error finding expired files:', error);
      throw error;
    }
  }

  async saveCustomFile(data: CustomFileRecord): Promise<any> {
    if (!this.isConnected || !this.CustomFile) throw new Error('Database not connected');
    
    try {
      const result = await this.CustomFile.findOneAndUpdate(
        { customFileName: data.customFileName },
        { 
          customFileName: data.customFileName,
          originalMegaUrl: data.originalMegaUrl,
          fileExtension: data.fileExtension
        },
        { upsert: true, new: true }
      );
      return result;
    } catch (error) {
      console.error('Error saving file:', error);
      throw error;
    }
  }

  async getCustomFile(customFileName: string): Promise<any> {
    if (!this.isConnected || !this.CustomFile) throw new Error('Database not connected');
    
    try {
      const result = await this.CustomFile.findOne({ customFileName });
      return result;
    } catch (error) {
      console.error('Error getting file:', error);
      throw error;
    }
  }

  async deleteCustomFile(customFileName: string): Promise<boolean> {
    if (!this.isConnected || !this.CustomFile) throw new Error('Database not connected');
    
    try {
      const result = await this.CustomFile.deleteOne({ customFileName });
      return result.deletedCount > 0;
    } catch (error) {
      console.error('Error deleting:', error);
      throw error;
    }
  }
}

export default MongoDBConnector;

