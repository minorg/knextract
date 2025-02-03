import { PromptMessageRoleLabel } from "@/lib/components/PromptMessageRoleLabel";
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@/lib/components/ui/table";
import { Prompt } from "@/lib/models";
import React from "react";

export async function PromptViewer({ prompt }: { prompt: Prompt }) {
  return (
    <Table>
      <TableBody>
        {prompt.messages.map((message, messageI) => {
          return (
            <TableRow key={messageI}>
              <TableCell>
                <PromptMessageRoleLabel promptMessageRole={message.role} />
              </TableCell>
              <TableCell>
                <pre style={{ whiteSpace: "pre-wrap" }}>
                  {message.literalForm}
                </pre>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
