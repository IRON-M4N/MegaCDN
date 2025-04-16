const { toBool } = require("@nexoracle/utils");

module.exports = {
  mega: {
    accounts: (process.env.MEGA_ACCOUNT || "ironman@onlyfans.com:katarenai nemurenai toroimerai") //email:password
      .split(";")
      .map((a) => {
        const [email, password] = a.split(":");
        return email && password ? { email, password } : null;
      })
      .filter(Boolean),
    storagePath: "./storage",
  },
  rateLimit: {
    max: process.env.MAX_REQUESTS || 100,
    timeWindow: process.env.RATE_LIMIT || "1 minute", // 100 req per minute change to ur need
  },
  storage: process.env.TEMP || "memory", // 'file' or 'memory' based on ur needs
  autoDelete: {
    enable: toBool(process.env.AUTO_DELETE) || false, // Set true to enable auto-deletion
    minutes: process.env.DELETE_TIME || 1440, // Default: 1 day (1440 minutes)
    mongodb: process.env.MONGODB_URI || null, // Replace null with your mongodb uri if u wanna use monogdb
  },
  auth: {
    enable: toBool(process.env.AUTHORIZATION) || false, // false by default
    keys: (process.env.AUTH_TOKEN || "Maher").split(",").filter(Boolean), // 'key1,key2'
  },
  server: {
    port: process.env.PORT || 3000,
    maxFileSize: process.env.MAX_FILE_SIZE || 100, // 100 MB
    maxFiles: process.env.MAX_FILES || 10, // Max 10 files
    cacheTTL: process.env.CACHE_TTL || 3600, // 1 hour you can change it to any seconds
    allowedTypes: [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/bmp",
      "image/svg+xml",
      "image/tiff",
      "image/x-icon",
      "image/heic",
      "image/heif",
      "image/avif",
      "video/mp4",
      "video/webm",
      "video/ogg",
      "video/quicktime",
      "video/x-msvideo",
      "video/x-matroska",
      "video/3gpp",
      "video/3gpp2",
      "video/x-ms-wmv",
      "video/mpeg",
      "video/avi",
      "audio/mpeg",
      "audio/mp3",
      "audio/mp4",
      "audio/wav",
      "audio/wave",
      "audio/webm",
      "audio/ogg",
      "audio/aac",
      "audio/flac",
      "audio/x-m4a",
      "audio/x-ms-wma",
      "audio/midi",
      "audio/x-midi",
      "text/plain",
      "text/html",
      "text/css",
      "text/javascript",
      "text/csv",
      "text/xml",
      "text/markdown",
      "text/rtf",
      "application/pdf",
      "application/msword",
      "application/vnd.ms-excel",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "application/vnd.oasis.opendocument.text",
      "application/vnd.oasis.opendocument.spreadsheet",
      "application/vnd.oasis.opendocument.presentation",
      "application/rtf",
      "application/x-abiword",
      "application/zip",
      "application/x-zip-compressed",
      "application/x-rar-compressed",
      "application/x-7z-compressed",
      "application/x-tar",
      "application/gzip",
      "application/x-bzip",
      "application/x-bzip2",
      "application/json",
      "application/ld+json",
      "application/xml",
      "application/javascript",
      "application/typescript",
      "application/x-httpd-php",
      "application/x-yaml",
      "application/graphql",
      "application/sql",
      "font/ttf",
      "font/otf",
      "font/woff",
      "font/woff2",
      "application/x-font-ttf",
      "application/x-font-otf",
      "application/font-woff",
      "application/font-woff2",
      "application/octet-stream",
      "application/x-www-form-urlencoded",
      "multipart/form-data",
      "text/calendar",
      "application/vnd.android.package-archive",
      "application/x-msdownload",
      "application/x-apple-diskimage",
    ],
  },
};
