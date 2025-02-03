import fs from "node:fs";
import { BlobStore } from "@/lib/blob-stores/BlobStore";
import * as tmp from "tmp-promise";
import urlJoin from "url-join";
import { it } from "vitest";

export function behavesLikeBlobStore({
  baseUrl,
  withBlobStore,
}: {
  baseUrl: URL;
  withBlobStore: (
    use: (blobStore: BlobStore) => Promise<void>,
  ) => Promise<void>;
}) {
  it("get: should return Left if a key is absent", async ({ expect }) => {
    await withBlobStore(async (blobStore) => {
      await blobStore.put(["test"], {
        type: "buffer",
        buffer: Buffer.from("testvalue"),
      });
      expect((await blobStore.get(["test2"])).isLeft()).toStrictEqual(true);
    });
  });

  it("get: should return a Right if a key is present", async ({ expect }) => {
    await withBlobStore(async (blobStore) => {
      const key = ["test"];
      const valueBuffer = Buffer.from("testvalue");
      const putUrl = (
        await blobStore.put(key, {
          type: "buffer",
          buffer: valueBuffer,
        })
      ).unsafeCoerce();
      const value = (await blobStore.get(key)).unsafeCoerce();
      expect(Buffer.from(value.buffer).toString()).toStrictEqual("testvalue");
      expect(value.url).toStrictEqual(putUrl);
    });
  });

  it("getMetadata: should return Left if a key is absent", async ({
    expect,
  }) => {
    await withBlobStore(async (blobStore) => {
      await blobStore.put(["test"], {
        type: "buffer",
        buffer: Buffer.from("testvalue"),
      });
      expect((await blobStore.getMetadata(["test2"])).isLeft()).toStrictEqual(
        true,
      );
    });
  });

  it("getMetadata: should return a Right if a key is present", async ({
    expect,
  }) => {
    await withBlobStore(async (blobStore) => {
      const key = ["test"];
      const valueBuffer = Buffer.from("testvalue");
      const putUrl = (
        await blobStore.put(key, {
          buffer: valueBuffer,
          metadata: {
            mimeType: "text/plain",
            userDefinedMetadata: {
              key: "value",
            },
          },
          type: "buffer",
        })
      ).unsafeCoerce();
      const value = (await blobStore.getMetadata(key)).unsafeCoerce();
      expect(value.mimeType).toStrictEqual("text/plain");
      expect(value.userDefinedMetadata).toStrictEqual({ key: "value" });
      expect(value.url).toStrictEqual(putUrl);
    });
  });

  it("put: should put a buffer blob with a single-part key", async ({
    expect,
  }) => {
    await withBlobStore(async (blobStore) => {
      const url = (
        await blobStore.put(["test"], {
          type: "buffer",
          buffer: Buffer.from("testvalue"),
        })
      ).unsafeCoerce();
      expect(url.toString()).toStrictEqual(
        urlJoin(baseUrl.toString(), "/test"),
      );
    });
  });

  it("put: should put a buffer blob with a multi-part key", async ({
    expect,
  }) => {
    await withBlobStore(async (blobStore) => {
      const url = (
        await blobStore.put(["test1", "test2.pdf"], {
          type: "buffer",
          buffer: Buffer.from("testvalue"),
        })
      ).unsafeCoerce();
      expect(url.toString()).toStrictEqual(
        urlJoin(baseUrl.toString(), "/test1/test2.pdf"),
      );
    });
  });

  it("put: should put a file blob with a single-part key", async ({
    expect,
  }) => {
    await tmp.withFile(async ({ path: tempFilePath }) => {
      await fs.promises.writeFile(tempFilePath, "testvalue");
      await withBlobStore(async (blobStore) => {
        const url = (
          await blobStore.put(["test"], {
            filePath: tempFilePath,
            type: "file",
          })
        ).unsafeCoerce();
        expect(url.toString()).toStrictEqual(
          urlJoin(baseUrl.toString(), "/test"),
        );
      });
    });
  });

  it("put: should put a blob with unsafe key characters", async ({
    expect,
  }) => {
    await withBlobStore(async (blobStore) => {
      const url = (
        await blobStore.put(["test1", "////"], {
          type: "buffer",
          buffer: Buffer.from("testvalue"),
        })
      ).unsafeCoerce();
      expect(
        url.toString().startsWith(urlJoin(baseUrl.toString(), "/test1/")),
      ).toStrictEqual(true);
      expect(url.toString().endsWith("////")).toStrictEqual(false);
    });
  });
}
