const { Mutex } = require('async-mutex');
const mega = require('megajs');
const fs = require('fs');
const path = require('path');
const config = require('./config.js');
const { Readable } = require('stream');

function streamToBuffer(stream) {
  return new Promise((resolve, reject) => {
    var chunks = [];
    stream.on('data', chunk => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', err => {
      console.error('Error creating stream:', err);
      reject(err);
    });
  });
}

function fullUpload(upstream) {
  return new Promise((resolve, reject) => {
    upstream.on('complete', file => {
      file.link((err, url) => {
        if (err) {
          console.error('Error linking file:', err);
          return reject(err);
        }
        resolve({ name: file.name, size: file.size, mime: file.mime, url });
      });
    });
    upstream.on('error', err => {
      console.error('Couldnt upload media:', err);
      reject(err);
    });
  });
}

class Client {
  constructor() {
    this.accounts = [];
  }

  async initialize() {
    var _accounts = (config.mega.accounts && config.mega.accounts.length)
      ? config.mega.accounts
      : [{ email: config.mega.email, password: config.mega.password }];
    for (var i = 0; i < _accounts.length; i++) {
      var acct = _accounts[i];
      var options = {
        email: acct.email,
        password: acct.password,
        autologin: true,
        autoload: true
      };
      if (config.storage === 'file') {
        var storagePath = path.resolve(config.mega.storagePath);
        if (!fs.existsSync(storagePath)) fs.mkdirSync(storagePath, { recursive: true });
        options.storagePath = storagePath;
      }
      try {
        var storage = await new mega.Storage(options).ready;
        this.accounts.push({
          email: acct.email,
          storage: storage,
          lock: new Mutex()
        });
      } catch (e) {
        console.error(`Error setting up storage for: ${acct.email}\nError: ${e}\nPossible serverless storage config issue. Check temp storage env.`);
      }
    }
    if (this.accounts.length === 0) {
      throw new Error('No account could be setup successfully at least need one account');
    }
  }

  getAcc(email) {
    for (var i = 0; i < this.accounts.length; i++) {
      if (this.accounts[i].email === email) return this.accounts[i];
    }
    return null;
  }

  getZeroAcc() {
    return this.accounts[0];
  }

  async uploadFile(filename, stream, mode, query) {
    var account;
    if (mode === 'dual' && query && query.email) {
      account = this.getAcc(query.email);
      if (!account) throw new Error('Account:' + query.email + ' not found or banned');
    } else {
      account = this.getZeroAcc();
    }
    if (!account || !account.storage) throw new Error('Storage not available for this account payment required or forbidden');
    var release = await account.lock.acquire();
    try {
      if (config.storage === 'file') {
        var filePath = path.resolve(config.mega.storagePath, filename);
        var writeStream = fs.createWriteStream(filePath);
        stream.pipe(writeStream);
        await new Promise((resolve, reject) => {
          writeStream.on('finish', resolve);
          writeStream.on('error', reject);
        });
        var fileSize = fs.statSync(filePath).size;
        var upstream = account.storage.upload({ name: filename, size: fileSize, allowUploadBuffering: true });
        fs.createReadStream(filePath).pipe(upstream);
        var result = await fullUpload(upstream);
        fs.unlink(filePath, err => {
          if (err) console.error('Could not delete file from disk:', filePath, err);
        });
        return result;
      } else {
        var buffer = await streamToBuffer(stream);
        var size = buffer.length;
        var ups = account.storage.upload({ name: filename, size: size, allowUploadBuffering: true });
        Readable.from(buffer).pipe(ups);
        var res = await fullUpload(ups);
        buffer = null;
        return res;
      }
    } catch (error) {
      console.error('Error uploading file', filename, 'using account', account.email, error);
      throw new Error('Upload failed: ' + error.message);
    } finally {
      release();
    }
  }

  async getFile(filePath) {
    var primary = this.getZeroAcc();
    if (!primary) throw new Error('No account available at least need one account');
    var file = Object.values(primary.storage.files).find(f => f.name === path.basename(filePath));
    if (!file) throw new Error('File not found');
    return file;
  }
}

module.exports = new Client();
