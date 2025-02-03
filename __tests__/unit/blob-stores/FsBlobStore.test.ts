import { behavesLikeBlobStore } from "@/__tests__/unit/blob-stores/behavesLikeBlobStore";
import { FsBlobStore } from "@/lib/blob-stores/FsBlobStore";
import * as tmp from "tmp-promise";
import { describe } from "vitest";

describe("FsBlobStore", () => {
  const baseUrl = new URL("http://example.com/");

  behavesLikeBlobStore({
    baseUrl,
    withBlobStore: (use) =>
      tmp.withDir(
        ({ path: baseDirectoryPath }) =>
          use(new FsBlobStore({ baseDirectoryPath, baseUrl })),
        { unsafeCleanup: true },
      ),
  });
});
