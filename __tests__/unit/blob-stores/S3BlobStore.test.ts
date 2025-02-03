import { behavesLikeBlobStore } from "@/__tests__/unit/blob-stores/behavesLikeBlobStore";
import { S3BlobStore } from "@/lib/blob-stores/S3BlobStore";
import { describe } from "vitest";

describe.skipIf(process.env["CI"])("S3BlobStore", () => {
  const bucketName = "knextract-test-documents";
  const baseUrl = new URL(`https://${bucketName}.s3.amazonaws.com/`);

  behavesLikeBlobStore({
    baseUrl,
    withBlobStore: async (use) =>
      use((await S3BlobStore.create({ bucketName })).unsafeCoerce()),
  });
});
