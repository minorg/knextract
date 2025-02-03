import fs from "node:fs";
import path from "node:path";
import { BlobStore } from "@/lib/blob-stores/BlobStore";
import { logger } from "@/lib/logger";
import { encodeFileName, isSafeFileName } from "@kos-kit/next-utils";
import { Either, Left, Right } from "purify-ts";
import invariant from "ts-invariant";
import urlJoin from "url-join";

/**
 * An implementation of BlobStore that reads and writes blobs from a file system.
 *
 * This would typically be used to write to a Next.js "public" directory so the blobs are accessible via the app.
 */
export class FsBlobStore implements BlobStore {
  private readonly baseDirectoryPath: string;
  private readonly baseUrl: URL;
  private readonly metadataDirectoryName = ".blob-metadata";

  constructor({
    baseDirectoryPath,
    baseUrl,
  }: { baseDirectoryPath: string; baseUrl: URL }) {
    this.baseDirectoryPath = baseDirectoryPath;
    this.baseUrl = baseUrl;
  }

  async get(key: BlobStore.Key): Promise<Either<Error, BlobStore.GetResult>> {
    const metadataEither = await this.getMetadata(key);
    if (metadataEither.isLeft()) {
      return metadataEither;
    }

    let data: Buffer;
    try {
      data = await fs.promises.readFile(this.keyToDataFilePath(key));
    } catch (e) {
      invariant(e instanceof Error);
      return Left(e);
    }

    return Either.of({
      buffer: data.buffer,
      metadata: metadataEither.unsafeCoerce(),
      url: metadataEither.unsafeCoerce().url,
    });
  }

  async getMetadata(
    key: BlobStore.Key,
  ): Promise<Either<Error, BlobStore.GetMetadataResult>> {
    const metadataFilePath = this.keyToMetadataFilePath(key);
    let metadataBuffer: Buffer;
    try {
      metadataBuffer = await fs.promises.readFile(metadataFilePath);
    } catch (e) {
      invariant(e instanceof Error);
      return Left(e);
    }
    return Either.of({
      ...JSON.parse(metadataBuffer.toString()),
      url: this.keyToDataUrl(key),
    });
  }

  async put(
    key: BlobStore.Key,
    value: BlobStore.PutValue,
  ): Promise<Either<Error, URL>> {
    const keyDataFilePath = this.keyToDataFilePath(key);
    const keyDataDirectoryPath = path.dirname(keyDataFilePath);
    const keyMetadataFilePath = this.keyToMetadataFilePath(key);
    const keyMetadataDirectoryPath = path.dirname(keyMetadataFilePath);

    try {
      logger.debug("creating blob data directory %s", keyDataDirectoryPath);
      await fs.promises.mkdir(keyDataDirectoryPath, { recursive: true });
      logger.debug("created blob data directory %s", keyDataDirectoryPath);

      logger.debug(
        "creating blob metadata directory %s",
        keyMetadataDirectoryPath,
      );
      await fs.promises.mkdir(keyMetadataDirectoryPath, { recursive: true });
      logger.debug(
        "created blob metadata directory %s",
        keyMetadataDirectoryPath,
      );

      switch (value.type) {
        case "buffer":
          logger.debug("writing blob file %s", keyDataFilePath);
          await fs.promises.writeFile(
            keyDataFilePath,
            Buffer.from(value.buffer),
          );
          logger.debug("wrote blob file %s", keyDataFilePath);
          break;
        case "file": {
          try {
            logger.debug("unlinking blob file %s", keyDataFilePath);
            await fs.promises.unlink(keyDataFilePath);
            logger.debug("unlinked blob file %s", keyDataFilePath);
          } catch {
            logger.debug(
              "blob file %s could not be unlinked, probably because it doesn't exist",
              keyDataFilePath,
            );
          }

          logger.debug(
            "copying %s to blob file %s",
            value.filePath,
            keyDataFilePath,
          );
          await fs.promises.copyFile(value.filePath, keyDataFilePath);
          logger.debug(
            "copied %s to blob file %s",
            value.filePath,
            keyDataFilePath,
          );
        }
      }

      logger.debug("writing blob metadata to %s", keyMetadataFilePath);
      await fs.promises.writeFile(
        keyMetadataFilePath,
        JSON.stringify(value.metadata ?? {}),
      );
      logger.debug("wrote blob metadata to %s", keyMetadataFilePath);
    } catch (e) {
      invariant(e instanceof Error);
      return Left(e);
    }

    const keyUrl = this.keyToDataUrl(key);
    logger.debug("blob file %s is URL %s", keyDataFilePath, keyUrl);
    return Right(keyUrl);
  }

  private encodeKey(key: BlobStore.Key): readonly string[] {
    invariant(key.length > 0);
    const encodedKey = key.map((keyPart) =>
      isSafeFileName(keyPart) ? keyPart : encodeFileName(keyPart),
    );
    invariant(encodedKey[0] !== this.metadataDirectoryName);
    return encodedKey;
  }

  private keyToDataFilePath(key: BlobStore.Key): string {
    return path.resolve(this.baseDirectoryPath, ...this.encodeKey(key));
  }

  private keyToDataUrl(key: BlobStore.Key): URL {
    return new URL(urlJoin(this.baseUrl.toString(), ...this.encodeKey(key)));
  }

  private keyToMetadataFilePath(key: BlobStore.Key): string {
    return path.resolve(
      this.baseDirectoryPath,
      this.metadataDirectoryName,
      `${path.join(...this.encodeKey(key))}.json`,
    );
  }
}
