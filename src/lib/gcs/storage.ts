import { Storage } from "@google-cloud/storage";

let storageInstance: Storage | null = null;

function getStorage(): Storage {
  if (!storageInstance) {
    const keyFilePath = process.env.GCS_SERVICE_ACCOUNT_PATH;
    storageInstance = keyFilePath
      ? new Storage({ keyFilename: keyFilePath })
      : new Storage();
  }
  return storageInstance;
}

function getBucket() {
  const bucketName = process.env.GCS_BUCKET_NAME;
  if (!bucketName) {
    throw new Error("GCS_BUCKET_NAME environment variable is not set");
  }
  return getStorage().bucket(bucketName);
}

export async function uploadFile(
  path: string,
  data: Buffer,
  contentType: string = "application/pdf"
): Promise<void> {
  const file = getBucket().file(path);
  await file.save(data, {
    metadata: { contentType },
    resumable: false,
  });
}

export async function downloadFile(path: string): Promise<Buffer> {
  const file = getBucket().file(path);
  const [contents] = await file.download();
  return contents;
}

export async function getSignedUrl(
  path: string,
  expiresInSeconds: number = 3600
): Promise<string> {
  const file = getBucket().file(path);
  const [url] = await file.getSignedUrl({
    action: "read",
    expires: Date.now() + expiresInSeconds * 1000,
  });
  return url;
}

export async function deleteFile(path: string): Promise<void> {
  const file = getBucket().file(path);
  await file.delete({ ignoreNotFound: true });
}
