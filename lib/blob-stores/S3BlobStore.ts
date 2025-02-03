import fs from "node:fs";
import { BlobStore } from "@/lib/blob-stores/BlobStore";
import { logger } from "@/lib/logger";
import {
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import basex from "base-x";
import { Either, Left, Right } from "purify-ts";
import invariant from "ts-invariant";

// https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-keys.html
const safeKeyCharacters =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!-_.*'()";
const keySegmentCodec = basex(safeKeyCharacters);
function isSafeKeySegment(keySegment: string) {
  for (const c of keySegment) {
    if (!safeKeyCharacters.includes(c)) {
      return false;
    }
  }
  return true;
}

/**
 * An implementation of BlobStore that reads and writes blobs from Amazon S3.
 */
export class S3BlobStore implements BlobStore {
  private readonly bucketName: string;
  private readonly s3Client: S3Client;

  private constructor({
    bucketName,
    s3Client,
  }: {
    bucketName: string;
    s3Client: S3Client;
  }) {
    this.bucketName = bucketName;
    this.s3Client = s3Client;
  }

  /**
   * Create an instance of the S3BlobStore with the given bucket name.
   *
   * The named bucket is assumed to exist and be publicly readable, so that objects uploaded to it can be accessed
   * via URL.
   */
  static async create({
    bucketName,
  }: { bucketName: string }): Promise<Either<Error, S3BlobStore>> {
    let s3Client: S3Client;
    try {
      s3Client = new S3Client();
      await s3Client.config.credentials();
      await s3Client.config.region();
    } catch (e) {
      invariant(e instanceof Error);
      return Left(e);
    }

    return Right(
      new S3BlobStore({
        bucketName,
        s3Client,
      }),
    );
  }

  async get(key: BlobStore.Key): Promise<Either<Error, BlobStore.GetResult>> {
    const s3Key = this.keyToS3Key(key);
    logger.debug("getting key %s value from S3", s3Key);
    try {
      const response = await this.s3Client.send(
        new GetObjectCommand({
          Bucket: this.bucketName,
          Key: s3Key,
        }),
      );
      logger.debug("got key %s metadata from S3", s3Key);
      return Either.of({
        buffer: await response.Body!.transformToByteArray(),
        mimeType: response.ContentType,
        userDefinedMetadata: response.Metadata,
        url: this.keyToUrl(key),
      });
    } catch (e) {
      invariant(e instanceof Error);
      return Left(e);
    }
  }

  async getMetadata(
    key: BlobStore.Key,
  ): Promise<Either<Error, BlobStore.GetMetadataResult>> {
    const s3Key = this.keyToS3Key(key);
    logger.debug("getting key %s metadata from S3", s3Key);
    try {
      const response = await this.s3Client.send(
        new HeadObjectCommand({
          Bucket: this.bucketName,
          Key: s3Key,
        }),
      );
      logger.debug("got key %s metadata from S3", s3Key);
      return Either.of({
        mimeType: response.ContentType,
        userDefinedMetadata: response.Metadata,
        url: this.keyToUrl(key),
      });
    } catch (e) {
      invariant(e instanceof Error);
      return Left(e);
    }
  }

  async put(
    key: BlobStore.Key,
    value: BlobStore.PutValue,
  ): Promise<Either<Error, URL>> {
    try {
      let buffer: Buffer;
      switch (value.type) {
        case "buffer":
          buffer = Buffer.from(value.buffer);
          break;
        case "file":
          buffer = await fs.promises.readFile(value.filePath);
          break;
      }

      const s3Key = this.keyToS3Key(key);

      logger.debug("putting %d bytes to S3 key %s", buffer.length, s3Key);
      await this.s3Client.send(
        new PutObjectCommand({
          Body: buffer,
          Bucket: this.bucketName,
          ContentType: value.metadata?.mimeType,
          Key: s3Key,
          Metadata: value.metadata?.userDefinedMetadata,
        }),
      );
      logger.debug("put %d bytes to S3 key %s", buffer.length, s3Key);

      const s3Url = this.keyToUrl(key);
      logger.debug("S3 key %s has URL %s", s3Key, s3Url);
      return Right(s3Url);
    } catch (e) {
      invariant(e instanceof Error);
      return Left(e);
    }
  }

  private keyToS3Key(key: BlobStore.Key): string {
    return key
      .map((keySegment) =>
        isSafeKeySegment(keySegment)
          ? keySegment
          : keySegmentCodec.encode(Buffer.from(keySegment, "utf-8")),
      )
      .join("/");
  }

  private keyToUrl(key: BlobStore.Key): URL {
    return new URL(
      `https://${this.bucketName}.s3.amazonaws.com/${this.keyToS3Key(key)}`,
    );
  }
}
