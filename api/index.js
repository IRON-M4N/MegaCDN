const fastifyRateLimit = require("@fastify/rate-limit");
const fastifyMultipart = require("@fastify/multipart");
const FileType = require("file-type");
const stream = require("stream");
const { runtime, formatBytes } = require("@nexoracle/utils");
require("dotenv").config();
const mega = require("../mega.js");
const config = require("../config.js");
const fastify = require("fastify")({ logger: 0 });
const Mega = require("megajs");

//plugins
fastify.register(require("@fastify/static"), {
  root: require("path").join(__dirname, "../public"),
  prefix: "/",
});

fastify.register(fastifyRateLimit, config.rateLimit);
fastify.register(fastifyMultipart, {
  limits: { fileSize: config.server.maxFileSize, files: 10 },
});

fastify.addHook("onSend", (request, reply, payload, done) => {
  if (request.url.startsWith("/media")) {
    reply.header("Cache-Control", `public, max-age=${config.server.cacheTTL}`);
  }
  done();
});

fastify.post("/upload", async (request, reply) => {
  var scheme = request.raw.socket.encrypted ? "https" : "http";
  var hostname = request.hostname;
  var port = request.raw.socket.localPort;
  var origin = hostname === "localhost" ? `${scheme}://${hostname}:${port}` : `${scheme}://${hostname}`;
  var mode = "single";
  var query = null;
  var files = [];

  try {
    for await (var part of request.parts()) {
      if (part.type === "field") {
        if (part.fieldname === "mode") mode = part.value || "single";
        if (part.fieldname === "email" && mode === "dual") query = { email: part.value };
        continue;
      }
      if (!part.file) continue;
      var buffer = await part.toBuffer();
      var fileType = await FileType.fromBuffer(buffer);
      if (!fileType || !config.server.allowedTypes.includes(fileType.mime)) {
        throw new Error(`File type not allowed: ${fileType?.mime || "unknown"}`);
      }
      var Myr = Math.random().toString(36).substring(2, 8);
      var date = new Date();
      var fixedDate = `${date.getDate()}_${date.getMonth() + 1}_${date.getFullYear()}`;
      var filename = `${fixedDate}_${Myr}.${fileType.ext || "bin"}`;
      var fileStream = new stream.PassThrough();
      fileStream.end(buffer);
      files.push({ filename, stream: fileStream, mime: fileType.mime });
    }

    var uploads = await Promise.all(files.map((file) => mega.uploadFile(file.filename, file.stream, mode, query)));

    if (config.autoDelete?.enable) {
      const deleteAfter = config.autoDelete?.minutes;
      uploads.forEach((upload) => {
        mega.scheduleFileForDeletion(upload.name, deleteAfter);
      });
    }

    const response = {
      success: true,
      files: uploads.map((upload) => ({
        url: `${origin}/media/${upload.url.replace(/^https:\/\/mega\.nz\/file\//, "").replace("#", "@")}`,
        name: upload.name,
        size: upload.size,
        formattedSize: formatBytes(upload.size),
        mime: upload.mime,
      })),
    };

    if (config.autoDelete?.enable) {
      const deleteAfter = config.autoDelete?.minutes;
      response.files.forEach((file) => {
        file.expires = deleteAfter * 60 + " sec";
        file.formattedExpires = runtime(deleteAfter * 60);
      });
    }

    return response;
  } catch (error) {
    console.log("Upload error:", error);
    reply.code(400).send({ error: error.message });
  }
});

fastify.get("/media/*", async (request, reply) => {
  try {
    var Hash = request.params["*"].replace("@", "#");
    var url = `https://mega.nz/file/${Hash}`;
    var file = Mega.File.fromURL(url);
    await file.loadAttributes();
    reply.header("Content-Type", file.mime);
    reply.header("Content-Disposition", `inline; filename="${file.name}"`);
    return reply.send(file.download());
  } catch (error) {
    console.log("Media error:", error);
    reply.code(404).send({ error: error.message });
  }
});

var start = async () => {
  try {
    await mega.initialize();
    console.log("Mega Account Logged IN");
    fastify.listen({ port: config.server.port, host: "0.0.0.0" }, (err, address) => {
      if (err) {
        console.error(err);
        process.exit(1);
      }
      console.log(`CDN is alive!? http://localhost:${config.server.port}`);
    });
  } catch (err) {
    console.error(err);
    console.log("EXITING");
    process.exit(1);
  }
};
start();
