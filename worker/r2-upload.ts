import {
  createVideoStorageFromEnv,
  type RenderedVideoStorage,
  type RenderedVideoUpload,
  type RenderedVideoUploadResult,
} from "../src/lib/storage/video-storage";

export type { RenderedVideoUpload, RenderedVideoUploadResult };

export interface RenderedVideoUploader {
  uploadRenderedVideo(
    upload: RenderedVideoUpload,
  ): Promise<RenderedVideoUploadResult>;
}

export class RenderedVideoStorageUploader implements RenderedVideoUploader {
  constructor(
    private readonly storage: RenderedVideoStorage = createVideoStorageFromEnv(),
  ) {}

  async uploadRenderedVideo(
    upload: RenderedVideoUpload,
  ): Promise<RenderedVideoUploadResult> {
    return this.storage.put(upload);
  }
}
