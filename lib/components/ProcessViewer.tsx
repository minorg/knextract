import { Section } from "@/lib/components/Section";
import { Process } from "@/lib/models";
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

export async function ProcessViewer<InputT, OutputT, SubProcessesT>({
  process,
  renderInput,
  renderOutput,
  renderSubProcesses,
}: {
  process: Process<InputT, OutputT, SubProcessesT>;
  renderInput: (input: InputT) => Promise<readonly SectionProps[]>;
  renderOutput: (output: OutputT) => Promise<readonly SectionProps[]>;
  renderSubProcesses: (
    subProcesses: SubProcessesT,
  ) => Promise<readonly SectionProps[]>;
}) {
  const translations = await getTranslations("ProcessViewer");

  const outputSections = await process.output
    .map(async (output) => await renderOutput(output))
    .mapLeft(async (exception) => [
      {
        title: translations("Exception"),
        content: <span>{exception.message}</span>,
      } as SectionProps,
    ])
    .extract();
  const subProcessSections = await renderSubProcesses(process.subProcesses);

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
