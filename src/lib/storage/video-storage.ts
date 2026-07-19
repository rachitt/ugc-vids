import { createReadStream } from "node:fs";
import { copyFile, mkdir, stat as statFile } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";

import {
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";

import { createR2Client, getR2BucketName } from "./r2";

export type VideoStorageDriver = "local" | "r2";

export type VideoByteRange = {
  start: number;
  end?: number;
};

export type RenderedVideoUpload = {
  contentType: "video/mp4";
  key: string;
  localPath: string;
};

export type RenderedVideoUploadResult = {
  key: string;
  url: string;
};

export type StoredVideoStat = {
  contentType?: string;
  key: string;
  lastModified?: Date;
  size: number;
};

export type StoredVideoStream = StoredVideoStat & {
  contentLength: number;
  range?: {
    end: number;
    start: number;
  };
  stream: Readable;
};

export type StoredVideoWebStream = {
  body: ReadableStream<Uint8Array>;
  contentLength: number;
};

export interface RenderedVideoStorage {
  readonly driver: VideoStorageDriver;
  getStream(key: string, range?: VideoByteRange): Promise<StoredVideoStream>;
  put(upload: RenderedVideoUpload): Promise<RenderedVideoUploadResult>;
  stat(key: string): Promise<StoredVideoStat | null>;
  stream(
    key: string,
    options?: { range?: VideoByteRange },
  ): Promise<StoredVideoWebStream | null>;
}

export class VideoStorageNotFoundError extends Error {
  constructor(readonly key: string) {
    super(`Rendered video not found: ${key}`);
    this.name = "VideoStorageNotFoundError";
  }
}

export class VideoStorageInvalidKeyError extends Error {
  constructor(readonly key: string) {
    super(`Invalid rendered video key: ${key}`);
    this.name = "VideoStorageInvalidKeyError";
  }
}

export class VideoStorageRangeNotSatisfiableError extends Error {
  constructor(
    readonly key: string,
    readonly size: number,
  ) {
    super(`Requested range cannot be satisfied for rendered video: ${key}`);
    this.name = "VideoStorageRangeNotSatisfiableError";
  }
}

const defaultLocalStoreRoot = path.join(process.cwd(), ".renders", "store");
let hasLoggedStorageDriver = false;

export class R2VideoStorage implements RenderedVideoStorage {
  readonly driver = "r2";

  private readonly bucketName: string;
  private readonly client: ReturnType<typeof createR2Client>;

  constructor({
    bucketName = getR2BucketName(),
    client = createR2Client(),
  }: {
    bucketName?: string;
    client?: ReturnType<typeof createR2Client>;
  } = {}) {
    this.bucketName = bucketName;
    this.client = client;
  }

  async put(upload: RenderedVideoUpload): Promise<RenderedVideoUploadResult> {
    const key = normalizeVideoStorageKey(upload.key);

    await this.client.send(
      new PutObjectCommand({
        Body: createReadStream(upload.localPath),
        Bucket: this.bucketName,
        ContentType: upload.contentType,
        Key: key,
      }),
    );

    return {
      key,
      url: publicUrlForKey(key),
    };
  }

  async stat(key: string): Promise<StoredVideoStat | null> {
    const normalizedKey = normalizeVideoStorageKey(key);

    try {
      const head = await this.client.send(
        new HeadObjectCommand({
          Bucket: this.bucketName,
          Key: normalizedKey,
        }),
      );

      return {
        contentType: head.ContentType,
        key: normalizedKey,
        lastModified: head.LastModified,
        size: Number(head.ContentLength ?? 0),
      };
    } catch (error) {
      if (isStorageNotFoundError(error)) {
        return null;
      }

      throw error;
    }
  }

  async getStream(
    key: string,
    range?: VideoByteRange,
  ): Promise<StoredVideoStream> {
    const stat = await this.stat(key);
    const normalizedKey = normalizeVideoStorageKey(key);

    if (!stat) {
      throw new VideoStorageNotFoundError(normalizedKey);
    }

    const normalizedRange = normalizeVideoRange(stat.key, stat.size, range);

    try {
      const object = await this.client.send(
        new GetObjectCommand({
          Bucket: this.bucketName,
          Key: stat.key,
          Range: normalizedRange
            ? `bytes=${normalizedRange.start}-${normalizedRange.end}`
            : undefined,
        }),
      );

      if (!object.Body) {
        throw new Error("R2 object response did not include a body.");
      }

      return {
        ...stat,
        contentLength:
          normalizedRange?.contentLength ?? object.ContentLength ?? stat.size,
        range: normalizedRange
          ? { end: normalizedRange.end, start: normalizedRange.start }
          : undefined,
        stream: toNodeReadableStream(object.Body),
      };
    } catch (error) {
      if (isStorageNotFoundError(error)) {
        throw new VideoStorageNotFoundError(stat.key);
      }

      throw error;
    }
  }

  async stream(
    key: string,
    options?: { range?: VideoByteRange },
  ): Promise<StoredVideoWebStream | null> {
    try {
      const video = await this.getStream(key, options?.range);

      return {
        body: Readable.toWeb(video.stream) as ReadableStream<Uint8Array>,
        contentLength: video.contentLength,
      };
    } catch (error) {
      if (
        error instanceof VideoStorageNotFoundError ||
        error instanceof VideoStorageRangeNotSatisfiableError
      ) {
        return null;
      }

      throw error;
    }
  }
}

export class LocalVideoStorage implements RenderedVideoStorage {
  readonly driver = "local";

  private readonly rootDir: string;

  constructor(rootDir = defaultLocalStoreRoot) {
    this.rootDir = path.resolve(rootDir);
  }

  async put(upload: RenderedVideoUpload): Promise<RenderedVideoUploadResult> {
    const key = normalizeVideoStorageKey(upload.key);
    const destination = this.pathForKey(key);

    await mkdir(path.dirname(destination), { recursive: true });

    if (path.resolve(upload.localPath) !== destination) {
      await copyFile(upload.localPath, destination);
    }

    return {
      key,
      url: `/api/videos/${key}`,
    };
  }

  async stat(key: string): Promise<StoredVideoStat | null> {
    const normalizedKey = normalizeVideoStorageKey(key);
    const filePath = this.pathForKey(normalizedKey);

    try {
      const stats = await statFile(filePath);

      if (!stats.isFile()) {
        return null;
      }

      return {
        contentType: "video/mp4",
        key: normalizedKey,
        lastModified: stats.mtime,
        size: stats.size,
      };
    } catch (error) {
      if (isStorageNotFoundError(error)) {
        return null;
      }

      throw error;
    }
  }

  async getStream(
    key: string,
    range?: VideoByteRange,
  ): Promise<StoredVideoStream> {
    const stat = await this.stat(key);
    const normalizedKey = normalizeVideoStorageKey(key);

    if (!stat) {
      throw new VideoStorageNotFoundError(normalizedKey);
    }

    const normalizedRange = normalizeVideoRange(stat.key, stat.size, range);
    const filePath = this.pathForKey(stat.key);

    return {
      ...stat,
      contentLength: normalizedRange?.contentLength ?? stat.size,
      range: normalizedRange
        ? { end: normalizedRange.end, start: normalizedRange.start }
        : undefined,
      stream: createReadStream(
        filePath,
        normalizedRange
          ? { end: normalizedRange.end, start: normalizedRange.start }
          : undefined,
      ),
    };
  }

  async stream(
    key: string,
    options?: { range?: VideoByteRange },
  ): Promise<StoredVideoWebStream | null> {
    try {
      const video = await this.getStream(key, options?.range);

      return {
        body: Readable.toWeb(video.stream) as ReadableStream<Uint8Array>,
        contentLength: video.contentLength,
      };
    } catch (error) {
      if (
        error instanceof VideoStorageNotFoundError ||
        error instanceof VideoStorageRangeNotSatisfiableError
      ) {
        return null;
      }

      throw error;
    }
  }

  private pathForKey(key: string) {
    const normalizedKey = normalizeVideoStorageKey(key);
    const filePath = path.resolve(this.rootDir, normalizedKey);

    if (
      filePath !== this.rootDir &&
      !filePath.startsWith(`${this.rootDir}${path.sep}`)
    ) {
      throw new VideoStorageInvalidKeyError(key);
    }

    return filePath;
  }
}

export function createVideoStorageFromEnv(): RenderedVideoStorage {
  const driver = resolveStorageDriver();

  if (!hasLoggedStorageDriver) {
    console.info("Video storage driver selected", { driver });
    hasLoggedStorageDriver = true;
  }

  return driver === "r2" ? new R2VideoStorage() : new LocalVideoStorage();
}

export function normalizeVideoStorageKey(key: string) {
  const normalizedKey = key.trim().replace(/\\/g, "/");
  const parts = normalizedKey.split("/");

  if (
    normalizedKey.length === 0 ||
    normalizedKey.startsWith("/") ||
    normalizedKey.includes("\0") ||
    parts.some((part) => part.length === 0 || part === "." || part === "..") ||
    path.posix.normalize(normalizedKey) !== normalizedKey
  ) {
    throw new VideoStorageInvalidKeyError(key);
  }

  return normalizedKey;
}

function normalizeVideoRange(
  key: string,
  size: number,
  range?: VideoByteRange,
) {
  if (!range) {
    return undefined;
  }

  if (
    !Number.isSafeInteger(range.start) ||
    range.start < 0 ||
    (typeof range.end === "number" &&
      (!Number.isSafeInteger(range.end) || range.end < range.start))
  ) {
    throw new VideoStorageRangeNotSatisfiableError(key, size);
  }

  if (size === 0 || range.start >= size) {
    throw new VideoStorageRangeNotSatisfiableError(key, size);
  }

  const end =
    typeof range.end === "number" ? Math.min(range.end, size - 1) : size - 1;

  return {
    contentLength: end - range.start + 1,
    end,
    start: range.start,
  };
}

function resolveStorageDriver(): VideoStorageDriver {
  const configuredDriver = process.env.STORAGE_DRIVER?.trim().toLowerCase();

  if (configuredDriver === "local" || configuredDriver === "r2") {
    return configuredDriver;
  }

  if (configuredDriver) {
    throw new Error(
      `Unsupported STORAGE_DRIVER "${process.env.STORAGE_DRIVER}". Use "local" or "r2".`,
    );
  }

  return hasCompleteR2Config() ? "r2" : "local";
}

function hasCompleteR2Config() {
  return Boolean(
    envValue("CLOUDFLARE_ACCOUNT_ID") &&
      envValue("R2_ACCESS_KEY_ID") &&
      envValue("R2_SECRET_ACCESS_KEY") &&
      envValue("R2_BUCKET_NAME"),
  );
}

function envValue(name: string) {
  const value = process.env[name]?.trim();

  return value && value.length > 0 ? value : null;
}

function publicUrlForKey(key: string) {
  const publicBaseUrl = envValue("R2_PUBLIC_BASE_URL");

  if (!publicBaseUrl) {
    return `/api/videos/${key}`;
  }

  return `${publicBaseUrl.replace(/\/+$/, "")}/${key}`;
}

function toNodeReadableStream(body: unknown): Readable {
  if (body instanceof Readable) {
    return body;
  }

  if (isWebReadableStream(body)) {
    return Readable.fromWeb(
      body as unknown as Parameters<typeof Readable.fromWeb>[0],
    );
  }

  if (hasTransformToWebStream(body)) {
    return Readable.fromWeb(
      body.transformToWebStream() as unknown as Parameters<
        typeof Readable.fromWeb
      >[0],
    );
  }

  if (isAsyncIterable(body)) {
    return Readable.from(body);
  }

  throw new Error("Storage object body is not streamable.");
}

function isWebReadableStream(body: unknown): body is ReadableStream<Uint8Array> {
  return (
    typeof body === "object" &&
    body !== null &&
    "getReader" in body &&
    typeof body.getReader === "function"
  );
}

function hasTransformToWebStream(
  body: unknown,
): body is { transformToWebStream: () => ReadableStream<Uint8Array> } {
  return (
    typeof body === "object" &&
    body !== null &&
    "transformToWebStream" in body &&
    typeof body.transformToWebStream === "function"
  );
}

function isAsyncIterable(body: unknown): body is AsyncIterable<Uint8Array> {
  return (
    typeof body === "object" &&
    body !== null &&
    Symbol.asyncIterator in body &&
    typeof body[Symbol.asyncIterator] === "function"
  );
}

function isStorageNotFoundError(error: unknown) {
  return (
    isFileNotFoundError(error) ||
    getErrorStatusCode(error) === 404 ||
    getErrorName(error) === "NoSuchKey" ||
    getErrorName(error) === "NotFound"
  );
}

function isFileNotFoundError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "ENOENT"
  );
}

function getErrorStatusCode(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "$metadata" in error &&
    typeof error.$metadata === "object" &&
    error.$metadata !== null &&
    "httpStatusCode" in error.$metadata
  ) {
    return error.$metadata.httpStatusCode;
  }

  return undefined;
}

function getErrorName(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    typeof error.name === "string"
  ) {
    return error.name;
  }

  return undefined;
}
