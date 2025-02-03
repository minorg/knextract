import { execFile } from "node:child_process";
import * as crypto from "node:crypto";
import * as fs from "node:fs";
import path from "node:path";
import * as stream from "node:stream";
import * as util from "node:util";
import { logger } from "@/lib/logger";
import { fsEither } from "@kos-kit/next-utils/server";
import { Either, Left, Maybe, Right } from "purify-ts";
import * as tmp from "tmp-promise";
import invariant from "ts-invariant";
import which from "which";

const execFilePromisified = util.promisify(execFile);

async function hashFile(filePath: string): Promise<string> {
  const fileInputStream = fs.createReadStream(filePath);
  const hash = crypto.createHash("sha256");
  await stream.promises.pipeline(fileInputStream, hash);
  return hash.digest("hex");
}

export class DocumentFormatConverter {
  private readonly cacheDirectoryPath: Maybe<string>;
  private readonly sofficeFilePath: string;

  private constructor({
    cacheDirectoryPath,
    sofficeFilePath,
  }: {
    cacheDirectoryPath: Maybe<string>;
    sofficeFilePath: string;
  }) {
    this.cacheDirectoryPath = cacheDirectoryPath;
    this.sofficeFilePath = sofficeFilePath;
  }

  static async create(kwds?: {
    cacheDirectoryPath?: string;
  }): Promise<Either<Error, DocumentFormatConverter>> {
    const cacheDirectoryPath = Maybe.fromNullable(kwds?.cacheDirectoryPath);

    switch (process.platform) {
      case "darwin": {
        const sofficeFilePath =
          "/Applications/LibreOffice.app/Contents/MacOS/soffice";
        return (await fsEither.stat(sofficeFilePath))
          .chain((stats) =>
            stats.isFile()
              ? Right(stats)
              : Left(new Error(`${sofficeFilePath} is not a file`)),
          )
          .map(
            (_) =>
              new DocumentFormatConverter({
                cacheDirectoryPath,
                sofficeFilePath,
              }),
          );
      }
      default:
        try {
          return Right(
            new DocumentFormatConverter({
              cacheDirectoryPath,
              sofficeFilePath: await which("soffice"),
            }),
          );
        } catch (e) {
          invariant(e instanceof Error);
          return Left(e);
        }
    }
  }

  /**
   * Convert the input file to the output file in the given format.
   */
  async convert({
    inputFilePath,
    outputFilePath,
  }: {
    inputFilePath: string;
    outputFilePath: string;
  }): Promise<void> {
    if (
      !(await fsEither.stat(inputFilePath))
        .map((stats) => stats.isFile())
        .orDefault(false)
    ) {
      throw new Error(`${inputFilePath} is not a file`);
    }

    const outputFileExtension = path.extname(outputFilePath).toLowerCase();
    if (outputFileExtension.length === 0) {
      throw new Error(`output file path ${outputFilePath} has no extension`);
    }

    if (!this.cacheDirectoryPath.isJust()) {
      // No-caching path
      await this._convert({
        inputFilePath,
        outputFilePath,
      });
      return;
    }

    // Caching path
    const inputFileHash = await hashFile(inputFilePath);
    const cachedOutputFilePath = path.resolve(
      this.cacheDirectoryPath.extract(),
      inputFileHash,
      inputFileHash + outputFileExtension,
    );

    if (
      (await fsEither.stat(cachedOutputFilePath))
        .map((stats) => stats.isFile())
        .orDefault(false)
    ) {
      logger.debug(
        "cached output file %s already exists",
        cachedOutputFilePath,
      );
    } else {
      logger.debug(
        "cached output file %s does not exist",
        cachedOutputFilePath,
      );

      await this._convert({
        inputFilePath,
        outputFilePath: cachedOutputFilePath,
      });
    }

    logger.debug(
      "symlinking cached output file %s to output file %s",
      cachedOutputFilePath,
      outputFilePath,
    );
    await fs.promises.symlink(cachedOutputFilePath, outputFilePath);
    logger.debug(
      "symlinked cached output file %s to output file %s",
      cachedOutputFilePath,
      outputFilePath,
    );
  }

  private async _convert({
    inputFilePath,
    outputFilePath,
  }: {
    inputFilePath: string;
    outputFilePath: string;
  }): Promise<void> {
    const outputFileExtension = path.extname(outputFilePath).toLowerCase();
    if (outputFileExtension.length === 0) {
      throw new Error(`output file path ${outputFilePath} has no extension`);
    }
    const outputFileFormat = outputFileExtension.substring(1);

    logger.debug("converting %s to %s", inputFilePath, outputFileFormat);

    await tmp.withDir(async ({ path: tempDirPath }) => {
      logger.debug("temp dir path: %s", tempDirPath);
      await execFilePromisified(this.sofficeFilePath, [
        "--convert-to",
        outputFileFormat,
        "--headless",
        inputFilePath,
        "--outdir",
        tempDirPath,
      ]);

      const tempOutputFilePath = path.resolve(
        tempDirPath,
        path.basename(inputFilePath, path.extname(inputFilePath)) +
          outputFileExtension,
      );
      if (
        !(await fsEither.stat(tempOutputFilePath))
          .map((stats) => stats.isFile())
          .orDefault(false)
      ) {
        throw new Error(`temp output file ${tempOutputFilePath} is not a file`);
      }

      const outputDirPath = path.dirname(outputFilePath);
      logger.debug("creating output directory %s", outputDirPath);
      await fs.promises.mkdir(outputDirPath, { recursive: true });
      logger.debug("created output directory %s", outputDirPath);

      logger.debug("renaming %s to %s", tempOutputFilePath, outputFilePath);
      await fs.promises.rename(tempOutputFilePath, outputFilePath);
      logger.debug("renamed %s to %s", tempOutputFilePath, outputFilePath);

      logger.debug("converted %s to %s", inputFilePath, outputFileFormat);
    });
  }
}
