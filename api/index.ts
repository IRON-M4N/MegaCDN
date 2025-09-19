import fastify from "fastify";
import rateLimit from "@fastify/rate-limit";
import multipart from "@fastify/multipart";
import * as FileType from "file-type";
import * as stream from "stream";
import * as crypto from "crypto";
import * as Mega from "megajs";
import config from "../config";
import { formatBytes, runtime } from "../functions";
import MegaClient from "../mega";
import db from "../database";
import { UploadResponse, UploadMode, DetectedFileType, UploadQuery, } from "../types";
import { FastifyRequest, FastifyReply } from "fastify";

const app = fastify({
  logger: false,
  bodyLimit: 1024 * 1024 * config.server.maxFileSize,
  keepAliveTimeout: 5000,
  connectionTimeout: 10000,
});

app.register(require("@fastify/static"), {
  root: require("path").join(process.cwd(), "public"),
  prefix: "/",
});

app.register(rateLimit, config.rateLimit);
app.register(multipart, {
  limits: {
    fileSize: 1024 * 1024 * config.server.maxFileSize,
    files: config.server.maxFiles,
  },
});

app.addHook("onSend", (req, rep, _payload, done) => {
  if (req.url.startsWith("/media") || req.url.startsWith("/file")) {
    rep.header("Cache-Control", `public, max-age=${config.server.cacheTTL}`);
  }
  done();
});

const authOK = (req: FastifyRequest): boolean => {
  if (!config.auth?.enable) return true;
  const h = req.headers["authorization"];
  if (!h) return false;
  const [t, token] = h.split(" ");
  return t === "Bearer" && config.auth.keys.includes(token);
};

const origin = (req: FastifyRequest): string => {
  const s = (req.raw.socket as any).encrypted ? "https" : "http";
  const host = req.hostname;
  const port = (req.raw.socket as any).localPort;
  return host === "localhost" ? `${s}://${host}:${port}` : `${s}://${host}`;
};

const parseParts = async (req: FastifyRequest) => {
  let mode = "single",
    query: UploadQuery | undefined = undefined;
  const files: any[] = [];

  for await (const part of req.parts()) {
    if (part.type === "field") {
      if (part.fieldname === "mode") mode = part.value || "single";
      if (part.fieldname === "email" && mode === "dual")
        query = { email: part.value };
      continue;
    }
    if (!part.file) continue;

    const buf = await part.toBuffer();
    const ft = (await FileType.fromBuffer(buf)) as DetectedFileType | undefined;
    if (!ft || !config.server.allowedTypes.includes(ft.mime))
      throw new Error("Invalid: " + ft?.mime);
    const d = new Date();
    const name = `${d.getDate()}_${d.getMonth() + 1}_${d.getFullYear()}_${Math.random().toString(36).slice(2, 8)}.${ft.ext}`;
    const strm = new stream.PassThrough();
    strm.end(buf);
    files.push({
      filename: name,
      stream: strm,
      mime: ft.mime,
      extension: ft.ext,
    });
  }
  return { mode, query, files };
};

const mega = new MegaClient(config);

app.post("/upload", async (req: FastifyRequest, rep: FastifyReply) => {
  if (!authOK(req)) {
    const h = req.headers["authorization"];
    return rep
      .code(h ? 403 : 401)
      .send({ error: h ? "Invalid Auth" : "Missing Auth" });
  }
  try {
    const { mode, query, files } = await parseParts(req);
    const ups = await Promise.all(
      files.map((f) =>
        mega.uploadFile(f.filename, f.stream, mode as UploadMode, query),
      ),
    );

    if (config.autoDelete?.enable) {
      ups.forEach((u) =>
        mega.scheduleDelete(u.name, config.autoDelete!.minutes),
      );
    }

    const o = origin(req);
    const out: UploadResponse = { success: true, files: [] };

    for (let i = 0; i < ups.length; i++) {
      const u = ups[i],
        f = files[i];
      if (config.FILENAMES && db.supportsCustomFilenames()) {
        const custom =
          crypto.randomBytes(4).toString("hex") + "." + f.extension;
        await db.saveCustomFile({
          customFileName: custom,
          originalMegaUrl: u.url,
          fileExtension: f.extension,
        });
        out.files.push({
          url: `${o}/file/${custom}`,
          name: u.name,
          size: u.size,
          formattedSize: formatBytes(u.size),
          mime: u.mime,
        });
      } else {
        const url = `${o}/media/${u.url.replace(/^https:\/\/mega\.nz\/file\//, "").replace("#", "@")}`;
        out.files.push({
          url,
          name: u.name,
          size: u.size,
          formattedSize: formatBytes(u.size),
          mime: u.mime,
        });
      }
    }
    if (config.autoDelete?.enable) {
      const sec = config.autoDelete.minutes * 60;
      out.files.forEach((f) => {
        f.expires = `${sec}s`;
        f.formattedExpires = runtime(sec);
      });
    }
    rep.send(out);
  } catch (err: any) {
    console.error(err);
    rep.code(400).send({ error: err.message });
  }
});

app.get("/file/:filename", async (req, rep) => {
  const { filename } = req.params as any;
  if (!config.FILENAMES || !db.supportsCustomFilenames())
    return rep.code(404).send({ error: "Not enabled" });
  const cf = await db.getCustomFile(filename);
  if (!cf) return rep.code(404).send({ error: "Not found" });
  const h = cf.originalMegaUrl
    .replace(/^https:\/\/mega\.nz\/file\//, "")
    .replace("#", "@")
    .replace("@", "#");
  const url = "https://mega.nz/file/" + h;
  const file = Mega.File.fromURL(url);
  await file.loadAttributes();
  rep.header("Content-Type", (file as any).mime || "application/octet-stream");
  rep.header("Content-Disposition", `inline; filename="${filename}"`);
  return rep.send(file.download({}));
});

app.get("/media/*", async (req, rep) => {
  const h = (req.params as any)["*"].replace("@", "#");
  const file = Mega.File.fromURL("https://mega.nz/file/" + h);
  await file.loadAttributes();
  rep.header("Content-Type", (file as any).mime || "application/octet-stream");
  rep.header("Content-Disposition", `inline; filename="${file.name}"`);
  return rep.send(file.download({}));
});

app.delete("/delete/*", async (req: FastifyRequest, rep: FastifyReply) => {
  if (!authOK(req)) {
    const h = req.headers["authorization"];
    return rep
      .code(h ? 403 : 401)
      .send({ error: h ? "Invalid Auth" : "Missing Auth" });
  }
  try {
    const path = (req.params as any)["*"];
    let fileName: string;
    let dltdb = false;

    if (path.startsWith("file/")) {
      const id = path.replace("file/", "");

      if (config.FILENAMES && db.supportsCustomFilenames()) {
        const customFile = await db.getCustomFile(id);
        if (!customFile) {
          return rep.code(404).send({ error: "File not found in database" });
        }

        try {
          fileName = await mega.getFileNameFromUrl(customFile.originalMegaUrl);
          const fileDeleted = await mega.deleteFileByName(fileName);

          if (!fileDeleted) {
            await db.deleteCustomFile(id);
            return rep
              .code(404)
              .send({
                error: "File not found in any acc deleted it from database",
              });
          }

          await db.deleteCustomFile(id);
          dltdb = true;
        } catch (error) {
          await db.deleteCustomFile(id);
          return rep
            .code(404)
            .send({ error: "File not found on acc deleted it from database" });
        }
      } else {
        return rep.code(400).send({ error: "Custom filenames not enabled" });
      }
    } else if (path.startsWith("media/")) {
      const hash = path.replace("media/", "").replace("@", "#");
      const megaUrl = `https://mega.nz/file/${hash}`;

      try {
        fileName = await mega.getFileNameFromUrl(megaUrl);
        const fileDeleted = await mega.deleteFileByName(fileName);
        if (!fileDeleted) {
          return rep.code(404).send({ error: "File not found in any account" });
        }
      } catch (error) {
        return rep.code(404).send({ error: "File not found on Mega" });
      }
    } else {
      return rep.code(400).send({ error: "Invalid path." });
    }

    rep.send({
      success: true,
      message: "File deleted successfully",
      deletedFrom: { megaAcc: true, database: dltdb },
    });
  } catch (err: any) {
    console.error("Delete error:", err);
    rep.code(400).send({ error: err.message || "Failed to delete file" });
  }
});

app.get("/info", (_, rep) =>
  rep.send({
    request_limit: config.rateLimit.max,
    rate_limit: config.rateLimit.timeWindow,
    file_size: config.server.maxFileSize,
    max_files: config.server.maxFiles,
    ...(config.autoDelete?.enable && {
      auto_delete_time: config.autoDelete.minutes,
    }),
  }),
);

app.get("/health", (_, rep) =>
  rep.send({
    status: "ok",
    timestamp: new Date().toISOString(),
    database: db.isConnected() ? "connected" : "disconnected",
    database_type: db.getDbType(),
    custom_filenames: config.FILENAMES && db.supportsCustomFilenames(),
  }),
);

const shutdown = async (s: string) => {
  console.log(`Got ${s}, shutting down...`);
  try {
    await mega.cleanup();
    await app.close();
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

const start = async () => {
  try {
    await mega.initialize();
    console.log("Instance ready");
    await app.listen({ port: config.server.port, host: "0.0.0.0" });
    console.log(`Server at:${config.server.port}`);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

start();
