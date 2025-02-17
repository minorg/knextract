import { ConceptSelectorViewer } from "@/lib/components/ConceptSelectorViewer";
import { PromptTemplateLikeViewer } from "@/lib/components/PromptTemplateLikeViewer";
import { Section } from "@/lib/components/Section";
import { Identifier, Question } from "@/lib/models";
import { getTranslations } from "next-intl/server";
import React from "react";

export async function QuestionViewer({ question }: { question: Question }) {
  const translations = await getTranslations("QuestionViewer");

  const subsections: React.ReactElement[] = [];

  subsections.push(
    <Section key="path" title={translations("Path")}>
      {Identifier.toString(question.path)}
    </Section>,
  );

  subsections.push(
    <Section key="promptTemplate" title={translations("Prompt template")}>
      <PromptTemplateLikeViewer promptTemplateLike={question.promptTemplate} />
    </Section>,
  );

  let title: string;
  switch (question.type) {
    case "CategoricalQuestion":
      subsections.push(
        <Section key="conceptSelector" title={translations("Concept selector")}>
          <ConceptSelectorViewer conceptSelector={question.conceptSelector} />
        </Section>,
      );
      title = translations("Categorical question");
      break;
    case "DichotomousQuestion":
      question.yesLabel.ifJust((yesLabel) => {
        subsections.push(
          <Section key="yesLabel" title={translations("Yes label")}>
            {yesLabel.value}
          </Section>,
        );
      });
      question.noLabel.ifJust((noLabel) => {
        subsections.push(
          <Section key="noLabel" title={translations("No label")}>
            {noLabel.value}
          </Section>,
        );
      });
      title = translations("Dichotomous question");
      break;
    case "RealValuedQuestion":
      title = translations("Real-valued question");
      break;
    case "TextQuestion":
      title = translations("Text question");
      break;
  }

  return <Section title={title}>{subsections}</Section>;
}
