import { Mutex } from 'async-mutex';
import * as Mega from 'megajs';
import { Config, MegaAccount, UploadMode, UploadQuery } from './types';
import database from './database';
import { Readable } from 'stream';

function streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', (err) => {
      console.error('Error stream:', err);
      reject(err);
    });
  });
}

async function fullUpload(uploadStream: any): Promise<any> {
  return new Promise((resolve, reject) => {
    // Timeout for lag uploads
    const timeout = setTimeout(() => {
      reject(new Error('Upload timeout after 5 mins'));
    }, 5 * 60 * 1000);

    uploadStream.on('complete', (file: any) => {
      clearTimeout(timeout);
      file.link((err: any, url: string) => {
        if (err) {
          console.error('Error linking file:', err);
          return reject(err);
        }
        resolve({ name: file.name, size: file.size, mime: file.mime, url });
      });
    });

    uploadStream.on('error', (err: any) => {
      clearTimeout(timeout);
      console.error('Could not upload media:', err);
      reject(err);
    });
  });
}

class MegaClient {
  private accounts: MegaAccount[] = [];
  private currentAccountIndex = 0;
  private config: Config;
  private accountMutexes: Map<string, Mutex> = new Map();

  constructor(config: Config) {
    this.config = config;
  }
  
  async initialize() {
    await database.initialize(this.config.DATABASE_URL);
    const creds = this.config.mega.accounts;
    if (!creds) throw new Error('No MEGA accounts found');

    for (const entry of creds.split(';')) {
      const [email, password] = entry.split(':');
      if (email && password) {
        try {
          const storage = new (Mega as any).Storage({ email, password });
          await storage.ready;
          this.accounts.push({ 
            email, 
            password, 
            storage
          });

          this.accountMutexes.set(email, new Mutex());
          console.log(`Logged into: ${email}`);
        } catch (err) {
          console.error(`Login failed: ${email}`, err);
        }
      }
    }

    if (!this.accounts.length) throw new Error('No valid MEGA accounts');
  }

  private selectAccount(mode: UploadMode, query?: UploadQuery): MegaAccount {
    if (mode === 'dual' && query?.email) {
      const account = this.accounts.find(a => a.email === query.email);
      if (!account) throw new Error(`No account for ${query.email}`);
      return account;
    }
    
    const account = this.accounts[this.currentAccountIndex];
    this.currentAccountIndex = (this.currentAccountIndex + 1) % this.accounts.length;
    return account;
  }

  getAccountByEmail(email: string): MegaAccount | null {
    return this.accounts.find(acc => acc.email === email) || null;
  }

  getZeroAcc(): MegaAccount {
    if (!this.accounts.length) throw new Error('No accounts available');
    return this.accounts[0];
  }

  async uploadFile(
    filename: string,
    input: NodeJS.ReadableStream,
    mode: UploadMode = 'single',
    query?: UploadQuery
  ) {
    const account = this.selectAccount(mode, query);

    if (!account || !account.storage) {
      throw new Error('Storage not available for this account - payment required or banned');
    }

    const mutex = this.accountMutexes.get(account.email);
    if (!mutex) throw new Error('Account mutex not found');

    const release = await mutex.acquire();

    try {
      //console.log(`Uploading ${filename} to ${account.email}`);
      const buffer = await streamToBuffer(input);
      const size = buffer.length;

      if (size === 0) {
        throw new Error('File is empty');
      }

      const uploadStream = account.storage.upload({ 
        name: filename, 
        size: size, 
        allowUploadBuffering: true 
      });

      Readable.from(buffer).pipe(uploadStream);
      const result = await fullUpload(uploadStream);
     // console.log(`Successfully uploaded ${filename} to ${account.email}`);
      return result;
    } catch (error) {
      throw new Error('Upload failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      release();
    }
  }

  async uploadBuffer(
    filename: string,
    buffer: Buffer,
    mode: UploadMode = 'single',
    query?: UploadQuery
  ) {
    if (!buffer || buffer.length === 0) {
      throw new Error('Buffer is empty or null');
    }

    return this.uploadFile(filename, Readable.from(buffer), mode, query);
  }

  async getFile(filePath: string) {
    const primary = this.getZeroAcc();
    const fileName = filePath.split('/').pop() || filePath;
    const file = Object.values(primary.storage.files).find((f: any) => f.name === fileName);
    if (!file) throw new Error('File not found');
    return file;
  }

  async scheduleDelete(name: string, mins: number) {
    const deleteTime = Date.now() + mins * 60_000;
    await database.save({ fileName: name, deleteTime });
   // console.log(`Scheduled ${name} for deletion in ${mins} minutes`);
  }

  async processExpired() {
    const now = Date.now();
    const expired = await database.findExpired(now);
    
    for (const record of expired) {
      let fileDeleted = false;
      
      for (const account of this.accounts) {
        try {
          const files = account.storage.root.children;
          const file = files.find((x: any) => x.name === record.fileName);

          if (file) {
            await file.delete();
            console.log(`Deleted: ${record.fileName} from ${account.email}`);
            fileDeleted = true;
            break;
          }
        } catch (error) {
          console.error(`Failed to delete ${record.fileName} from ${account.email}:`, error);
        }
      }

      if (!fileDeleted) {
        console.warn(`Could not find file ${record.fileName} in any account`);
      }

      await database.delete(record.fileName);
    }

    if (expired.length) {
      console.log(`Cleaned up ${expired.length} expired files`);
    }
  }

  async cleanup() {
    try {
      await this.processExpired();
      await database.disconnect();
      console.log('Cleanup completed');
    } catch (error) {
      console.error('Cleanup failed:', error);
    }
  }

  getAccountCount(): number {
    return this.accounts.length;
  }

  getAccountEmails(): string[] {
    return this.accounts.map(acc => acc.email);
  }

  async getStorageInfo(): Promise<any[]> {
    const info = [];
    for (const account of this.accounts) {
      try {
        const accountInfo = await account.storage.getAccountInfo();
        info.push({
          email: account.email,
          used: accountInfo.used || 0,
          total: accountInfo.total || 0,
          available: (accountInfo.total || 0) - (accountInfo.used || 0),
        });
      } catch (error) {
        console.error(`Failed to get acc info for ${account.email}:`, error);
        info.push({
          email: account.email,
          error: 'Failed to get acc info',
        });
      }
    }
    return info;
  }
}

export default MegaClient;
