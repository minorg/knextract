import { Section } from "@/lib/components/Section";
import {
  Exception,
  Process,
  ProcessInput,
  ProcessOutput,
  ProcessSubProcesses,
} from "@/lib/models";
import { getTranslations } from "next-intl/server";
import React from "react";
import invariant from "ts-invariant";

interface SectionProps {
  content: React.ReactElement;
  key?: string;
  title: React.ReactElement | string;
}

function renderSections(sections: readonly SectionProps[]) {
  return (
    <div className="flex flex-col gap-4">
      {sections.map(({ content, key, title }) => {
        if (!key) {
          invariant(typeof title === "string");
          key = title;
        }
        return (
          <Section key={key} title={title}>
            {content}
          </Section>
        );
      })}
    </div>
  );
}

export async function ProcessViewer<
  ProcessT extends Process & {
    input: ProcessInputT;
    output?: Exception | ProcessOutputT;
    subProcesses?: ProcessSubProcessesT;
  },
  ProcessInputT extends ProcessInput,
  ProcessOutputT extends ProcessOutput,
  ProcessSubProcessesT extends ProcessSubProcesses,
>({
  process,
  renderInput,
  renderOutput,
  renderSubProcesses,
}: {
  process: ProcessT;
  renderInput: (process: ProcessInputT) => Promise<readonly SectionProps[]>;
  renderOutput?: (process: ProcessOutputT) => Promise<readonly SectionProps[]>;
  renderSubProcesses?: (
    process: ProcessSubProcessesT,
  ) => Promise<readonly SectionProps[]>;
}) {
  const translations = await getTranslations("ProcessViewer");

  let outputSections: readonly SectionProps[];
  if (process.output) {
    if (process.output.type === "Exception") {
      outputSections = [
        {
          content: <>{process.output.message}</>,
          title: translations("Exception"),
        },
      ];
    } else if (renderOutput) {
      outputSections = await renderOutput(process.output);
    } else {
      outputSections = [];
    }
  } else {
    outputSections = [];
  }

  const subProcessSections =
    process.subProcesses && renderSubProcesses
      ? await renderSubProcesses(process.subProcesses)
      : [];

  return (
    <div className="flex flex-col ps-2">
      <Section title={translations("Input")}>
        {renderSections(await renderInput(process.input))}
      </Section>
      {outputSections.length > 0 ? (
        <Section title={translations("Output")}>
          {renderSections(outputSections)}
        </Section>
      ) : null}
      {subProcessSections.length > 0 ? (
        <Section title={translations("Sub-processes")}>
          {renderSections(subProcessSections)}
        </Section>
      ) : null}
    </div>
  );
}
