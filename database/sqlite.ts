import { Sequelize, DataTypes, Op } from 'sequelize';
import { DatabaseConnector, FileDeleteRecord, CustomFileRecord } from '../types';
import * as path from 'path';
import * as fs from 'fs';

class SQLiteConnector implements DatabaseConnector {
  private sequelize: Sequelize;
  private FileDelete: any = null;
  private CustomFile: any = null;
  public isConnected: boolean = false;

  constructor(databasePath?: string) {
    const dbPath = databasePath || path.join(process.cwd(), 'storage', 'megacdn.sqlite');
    const storageDir = path.dirname(dbPath);
    if (!fs.existsSync(storageDir)) {
      fs.mkdirSync(storageDir, { recursive: true });
    }
    
    this.sequelize = new Sequelize({
      dialect: 'sqlite',
      storage: dbPath,
      logging: false,
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000,
      },
    });
  }

  async connect(): Promise<boolean> {
    try {
      await this.sequelize.authenticate();
      console.log('Connected to SQLite database');
      
      this.FileDelete = this.sequelize.define('FileDelete', {
        fileName: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true,
        },
        deleteTime: {
          type: DataTypes.BIGINT,
          allowNull: false,
        },
      }, {
        tableName: 'file_deletes',
        timestamps: true,
      });

      this.CustomFile = this.sequelize.define('CustomFile', {
        customFileName: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true,
        },
        originalMegaUrl: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        fileExtension: {
          type: DataTypes.STRING,
          allowNull: false,
        },
      }, {
        tableName: 'custom_files',
        timestamps: true,
      });

      await this.sequelize.sync();
      this.isConnected = true;
      
      return true;
    } catch (error) {
      console.error('SQLite connection failed:', error);
      return false;
    }
  }

  async disconnect(): Promise<void> {
    if (this.sequelize) {
      await this.sequelize.close();
      this.isConnected = false;
    }
  }

  async save(data: FileDeleteRecord): Promise<any> {
    if (!this.isConnected || !this.FileDelete) throw new Error('Database not connected');
    
    try {
      const result = await this.FileDelete.upsert({
        fileName: data.fileName,
        deleteTime: data.deleteTime,
      });
      return result[0];
    } catch (error) {
      console.error('Error saving:', error);
      throw error;
    }
  }

  async get(fileName: string): Promise<any> {
    if (!this.isConnected || !this.FileDelete) throw new Error('Database not connected');
    
    try {
      const result = await this.FileDelete.findOne({
        where: { fileName }
      });
      return result;
    } catch (error) {
      console.error('Error gettinng:', error);
      throw error;
    }
  }

  async update(fileName: string, data: Partial<FileDeleteRecord>): Promise<boolean> {
    if (!this.isConnected || !this.FileDelete) throw new Error('Database not connected');
    
    try {
      const [updatedRowsCount] = await this.FileDelete.update(data, {
        where: { fileName }
      });
      return updatedRowsCount > 0;
    } catch (error) {
      console.error('Error updating:', error);
      throw error;
    }
  }

  async delete(fileName: string): Promise<boolean> {
    if (!this.isConnected || !this.FileDelete) throw new Error('Database not connected');
    
    try {
      const deletedRowsCount = await this.FileDelete.destroy({
        where: { fileName }
      });
      return deletedRowsCount > 0;
    } catch (error) {
      console.error('Error deleting:', error);
      throw error;
    }
  }

  async findExpired(currentTime: number): Promise<any[]> {
    if (!this.isConnected || !this.FileDelete) throw new Error('Database not connected');
    
    try {
      const results = await this.FileDelete.findAll({
        where: {
          deleteTime: {
            [Op.lte]: currentTime
          }
        }
      });
      return results;
    } catch (error) {
      console.error('Error finding files:', error);
      throw error;
    }
  }

  async saveCustomFile(data: CustomFileRecord): Promise<any> {
    if (!this.isConnected || !this.CustomFile) throw new Error('Database not connected');
    
    try {
      const result = await this.CustomFile.upsert({
        customFileName: data.customFileName,
        originalMegaUrl: data.originalMegaUrl,
        fileExtension: data.fileExtension,
      });
      return result[0];
    } catch (error) {
      console.error('Error saving file:', error);
      throw error;
    }
  }

  async getCustomFile(customFileName: string): Promise<any> {
    if (!this.isConnected || !this.CustomFile) throw new Error('Database not connected');
    
    try {
      const result = await this.CustomFile.findOne({
        where: { customFileName }
      });
      return result;
    } catch (error) {
      console.error('Error getting file:', error);
      throw error;
    }
  }

  async deleteCustomFile(customFileName: string): Promise<boolean> {
    if (!this.isConnected || !this.CustomFile) throw new Error('Database not connected');
    
    try {
      const deletedRowsCount = await this.CustomFile.destroy({
        where: { customFileName }
      });
      return deletedRowsCount > 0;
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }
}

export default SQLiteConnector;

