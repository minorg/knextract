import { PromptMessageRoleLabel } from "@/lib/components/PromptMessageRoleLabel";
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@/lib/components/ui/table";
import { PromptTemplate } from "@/lib/models";
import React from "react";

export function PromptTemplateViewer({
  promptTemplate,
}: { promptTemplate: PromptTemplate }) {
  return (
    <Table>
      <TableBody>
        {promptTemplate.messageTemplates.map((messageTemplate, messageI) => {
          return (
            <TableRow key={messageI}>
              <TableCell>
                {" "}
                <PromptMessageRoleLabel
                  promptMessageRole={messageTemplate.role}
                />
              </TableCell>
              <TableCell>
                <pre style={{ whiteSpace: "pre-wrap" }}>
                  {messageTemplate.literalForm}
                </pre>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
