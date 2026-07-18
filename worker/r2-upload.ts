export type RenderedVideoUpload = {
  contentType: "video/mp4";
  key: string;
  localPath: string;
};

export type RenderedVideoUploadResult = {
  key: string;
  url: string;
};

export interface RenderedVideoUploader {
  uploadRenderedVideo(
    upload: RenderedVideoUpload,
  ): Promise<RenderedVideoUploadResult>;
}

export class StubR2RenderedVideoUploader implements RenderedVideoUploader {
  async uploadRenderedVideo(
    upload: RenderedVideoUpload,
  ): Promise<RenderedVideoUploadResult> {
    console.info("R2 upload stub skipped network I/O", {
      contentType: upload.contentType,
      key: upload.key,
      localPath: upload.localPath,
    });

    return {
      key: upload.key,
      url: `r2://stub/${upload.key}`,
    };
  }
}
