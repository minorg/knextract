import { Either } from "purify-ts";

/**
 * Minimal abstraction over a key-value blob store such as Amazon S3.
 */
export interface BlobStore {
  get(key: BlobStore.Key): Promise<Either<Error, BlobStore.GetResult>>;

  getMetadata(
    key: BlobStore.Key,
  ): Promise<Either<Error, BlobStore.GetMetadataResult>>;

  /**
   * Put a blob to the store under the given key.
   *
   * On success, returns the public URL where the blob can be accessed.
   */
  put(
    key: BlobStore.Key,
    value: BlobStore.PutValue,
  ): Promise<Either<Error, URL>>;
}

export namespace BlobStore {
  export type Key = readonly string[];

  export interface ValueMetadata {
    mimeType?: string;
    userDefinedMetadata?: Record<string, string>;
  }

  export interface GetMetadataResult extends ValueMetadata {
    url: URL;
  }

  export interface GetResult {
    buffer: ArrayBufferLike;
    metadata?: ValueMetadata;
    url: URL;
  }

  export type PutValue =
    | {
        buffer: ArrayBufferLike;
        metadata?: ValueMetadata;
        type: "buffer";
      }
    | {
        filePath: string;
        metadata?: ValueMetadata;
        type: "file";
      };
}
