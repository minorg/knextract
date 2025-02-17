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

export async function ProcessViewer<ProcessT extends Process>({
  process,
  renderInput,
  renderOutput,
  renderSubProcesses,
}: {
  process: ProcessT;
  renderInput: (process: ProcessT) => Promise<readonly SectionProps[]>;
  renderOutput: (process: ProcessT) => Promise<readonly SectionProps[]>;
  renderSubProcesses: (process: ProcessT) => Promise<readonly SectionProps[]>;
}) {
  const translations = await getTranslations("ProcessViewer");

  const outputSections = await renderOutput(process);
  const subProcessSections = await renderSubProcesses(process);

  return (
    <div className="flex flex-col ps-2">
      <Section title={translations("Input")}>
        {renderSections(await renderInput(process))}
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
