import fs from "node:fs";
import { SingleTableExporter } from "@/lib/exporters/SingleTableExporter";
import { stringify } from "csv-stringify/sync";

export class CsvSingleTableExporter implements SingleTableExporter {
  private readonly csvFilePath: string;

  constructor({ csvFilePath }: { csvFilePath: string }) {
    this.csvFilePath = csvFilePath;
  }

  async export({
    columnDefinitions,
    rows,
  }: Parameters<SingleTableExporter["export"]>[0]): Promise<void> {
    const csvFileDescriptor = await fs.promises.open(this.csvFilePath, "w");
    try {
      await csvFileDescriptor.appendFile(
        `${stringify([columnDefinitions.map((columnDefinition) => columnDefinition.label)], { eof: false })}\n`,
      );

      for await (const row of rows) {
        await csvFileDescriptor.appendFile(
          `${stringify([row.map((cell) => (cell !== null ? cell.toString() : ""))], { eof: false })}\n`,
        );
      }
    } finally {
      await csvFileDescriptor.close();
    }
  }
}
