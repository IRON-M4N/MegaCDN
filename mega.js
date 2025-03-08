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
      console.error('Error stream:', err);
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
      console.error('Error in upload:', err);
      reject(err);
    });
  });
}

class Client {
  constructor() {
    this.lock = new Mutex();
    this.storage = null;
  }

  async initialize() {
    var options = {
      email: config.mega.email,
      password: config.mega.password,
      autologin: true,
      autoload: true
    };
    if (config.storage === 'file') {
      var storagePath = path.resolve(config.mega.storagePath);
      if (!fs.existsSync(storagePath)) fs.mkdirSync(storagePath, { recursive: true });
      options.storagePath = storagePath;
    }
    try {
      this.storage = await new mega.Storage(options).ready;
    } catch (e) {
      console.error('Error initializating storage:', e);
      throw new Error(`Login failed: ${e}`);
    }
  }

  async uploadFile(filename, stream) {
    if (!this.storage) {
      console.error('Storage not set up when trying to upload:', filename);
      throw new Error('Storage not setup yet!');
    }
    var release = await this.lock.acquire();
    try {
      if (config.storage === 'file') {
        var filePath = path.resolve(config.mega.storagePath, filename);
        var writeStream = fs.createWriteStream(filePath);
        stream.pipe(writeStream);
        await new Promise((resolve, reject) => {
          writeStream.on('finish', () => resolve());
          writeStream.on('error', err => {
            console.error('Error saving file:', filePath, err);
            reject(err);
          });
        });
        var fileSize = fs.statSync(filePath).size;
        var upstream = this.storage.upload({ name: filename, size: fileSize, allowUploadBuffering: true });
        fs.createReadStream(filePath).pipe(upstream);
        var result = await fullUpload(upstream);
        fs.unlink(filePath, err => {
          if (err) console.error('Couldnt delete file from disk:', filePath, err);
        });
        return result;
      } else {
        var buffer = await streamToBuffer(stream);
        var size = buffer.length;
        var ups = this.storage.upload({ name: filename, size: size, allowUploadBuffering: true });
        Readable.from(buffer).pipe(ups);
        var res = await fullUpload(ups);
        buffer = null;
        return res;
      }
    } catch (error) {
      console.error('Error uploading file', filename, error);
      throw new Error(`Upload failed: ${error.message}`);
    } finally {
      release();
    }
  }

  async getFile(filePath) {
    if (!this.storage) {
      console.error('Storage not set up when trying to get file:', filePath);
      throw new Error('Storage not setup yet!');
    }
    var file = Object.values(this.storage.files).find(f => f.name === path.basename(filePath));
    if (!file) {
      console.error('File not found:', filePath);
      throw new Error('File not found');
    }
    return file;
  }
}

module.exports = new Client();
