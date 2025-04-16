const { Mutex } = require("async-mutex");
const mega = require("megajs");
const fs = require("fs");
const path = require("path");
const config = require("./config.js");
const { Readable } = require("stream");
const mongoose = require("mongoose");

// Create a file deletion schema for MongoDB
let FileDeleteModel;
const initMongoose = async (uri) => {
  try {
    if (!uri || ["null", "false", false, null, undefined].includes(uri)) {
      return false;
    }

    await mongoose.connect(uri);
    console.log("Connected to MongoDB");

    const schema = new mongoose.Schema({
      fileName: { type: String, required: true, unique: true },
      deleteTime: { type: Number, required: true },
      createdAt: { type: Date, default: Date.now },
    });

    FileDeleteModel = mongoose.model("FileDelete", schema);
    return true;
  } catch (error) {
    console.error("MongoDB connection failed:", error);
    return false;
  }
};

function streamToBuffer(stream) {
  return new Promise((resolve, reject) => {
    var chunks = [];
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", (err) => {
      console.error("Error creating stream:", err);
      reject(err);
    });
  });
}

function fullUpload(upstream) {
  return new Promise((resolve, reject) => {
    upstream.on("complete", (file) => {
      file.link((err, url) => {
        if (err) {
          console.error("Error linking file:", err);
          return reject(err);
        }
        resolve({ name: file.name, size: file.size, mime: file.mime, url });
      });
    });
    upstream.on("error", (err) => {
      console.error("Couldnt upload media:", err);
      reject(err);
    });
  });
}

class Client {
  constructor() {
    this.accounts = [];
    this.useMongoDb = false;
    this.jsonStoragePath = path.join(__dirname, "schedule");

    if (!fs.existsSync(this.jsonStoragePath)) {
      fs.mkdirSync(this.jsonStoragePath, { recursive: true });
    }
  }

  async initialize() {
    var _accounts = config.mega.accounts && config.mega.accounts.length ? config.mega.accounts : [{ email: config.mega.email, password: config.mega.password }];

    for (var i = 0; i < _accounts.length; i++) {
      var acct = _accounts[i];
      var options = {
        email: acct.email,
        password: acct.password,
        autologin: true,
        autoload: true,
      };

      if (config.storage === "file") {
        var storagePath = path.resolve(config.mega.storagePath);
        if (!fs.existsSync(storagePath)) fs.mkdirSync(storagePath, { recursive: true });
        options.storagePath = storagePath;
      }

      try {
        var storage = await new mega.Storage(options).ready;
        this.accounts.push({
          email: acct.email,
          storage: storage,
          lock: new Mutex(),
        });
      } catch (e) {
        console.error(`Error setting up storage for: ${acct.email}\nError: ${e}\nPossible serverless storage config issue. Check temp storage env.`);
      }
    }

    if (this.accounts.length === 0) {
      throw new Error("No account could be setup successfully at least need one account");
    }

    if (config.autoDelete?.enable === true) {
      await this.initDeletionTracking();
      setInterval(() => this.checkPendingDeletions(), 60 * 1000);
    }
  }

  async initDeletionTracking() {
    if (config.autoDelete?.mongodb) {
      try {
        this.useMongoDb = await initMongoose(config.autoDelete?.mongodb);
      } catch (e) {
        this.useMongoDb = false;
      }
    } else {
      this.useMongoDb = false;
    }
    // console.log(`Using ${this.useMongoDb ? "MongoDB" : "JSON files"} for auto-delete tracking`);
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
    if (mode === "dual" && query && query.email) {
      account = this.getAcc(query.email);
      if (!account) throw new Error("Account:" + query.email + " not found or banned");
    } else {
      account = this.getZeroAcc();
    }

    if (!account || !account.storage) throw new Error("Storage not available for this account payment required or forbidden");

    var release = await account.lock.acquire();
    try {
      if (config.storage === "file") {
        var filePath = path.resolve(config.mega.storagePath, filename);
        var writeStream = fs.createWriteStream(filePath);
        stream.pipe(writeStream);
        await new Promise((resolve, reject) => {
          writeStream.on("finish", resolve);
          writeStream.on("error", reject);
        });
        var fileSize = fs.statSync(filePath).size;
        var upstream = account.storage.upload({ name: filename, size: fileSize, allowUploadBuffering: true });
        fs.createReadStream(filePath).pipe(upstream);
        var result = await fullUpload(upstream);
        fs.unlink(filePath, (err) => {
          if (err) console.error("Could not delete file from disk:", filePath, err);
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
      console.error("Error uploading file", filename, "using account", account.email, error);
      throw new Error("Upload failed: " + error.message);
    } finally {
      release();
    }
  }

  async getFile(filePath) {
    var primary = this.getZeroAcc();
    if (!primary) throw new Error("No account available at least need one account");
    var file = Object.values(primary.storage.files).find((f) => f.name === path.basename(filePath));
    if (!file) throw new Error("File not found");
    return file;
  }

  async scheduleFileForDeletion(fileName, minutes = 1440) {
    const deleteTime = Date.now() + minutes * 60 * 1000;

    try {
      if (this.useMongoDb) {
        await FileDeleteModel.findOneAndUpdate({ fileName }, { fileName, deleteTime }, { upsert: true, new: true });
      } else {
        const filePath = path.join(this.jsonStoragePath, `${fileName}.json`);
        fs.writeFileSync(filePath, JSON.stringify({ fileName, deleteTime }));
      }
      // console.log(`Scheduled ${fileName} for deletion after ${minutes} minutes`);
    } catch (error) {
      console.error(`Error scheduling file deletion for ${fileName}:`, error);
    }
  }

  async checkPendingDeletions() {
    const now = Date.now();

    try {
      if (this.useMongoDb) {
        const filesToDelete = await FileDeleteModel.find({ deleteTime: { $lte: now } });

        for (const fileRecord of filesToDelete) {
          await this.deleteFileByName(fileRecord.fileName);
          await FileDeleteModel.deleteOne({ _id: fileRecord._id });
        }
      } else {
        if (!fs.existsSync(this.jsonStoragePath)) return;

        const files = fs.readdirSync(this.jsonStoragePath);

        for (const file of files) {
          const filePath = path.join(this.jsonStoragePath, file);
          const data = JSON.parse(fs.readFileSync(filePath, "utf8"));

          if (data.deleteTime <= now) {
            await this.deleteFileByName(data.fileName);
            fs.unlinkSync(filePath);
          }
        }
      }
    } catch (error) {
      console.error("Error checking pending deletions:", error);
    }
  }

  async deleteFileByName(fileName) {
    try {
      const storage = this.getZeroAcc().storage;
      const file = Object.values(storage.files).find((f) => f.name === fileName);

      if (!file) {
        console.log(`File ${fileName} already deleted or not found`);
        return;
      }

      return new Promise((resolve, reject) => {
        file.delete((err) => {
          if (err) {
            console.error(`Error auto-deleting file ${fileName}:`, err);
            reject(err);
          } else {
            // console.log(`Auto-deleted file ${fileName}`);
            resolve();
          }
        });
      });
    } catch (error) {
      console.error(`Failed to auto-delete file ${fileName}:`, error);
      throw error;
    }
  }
}

module.exports = new Client();
