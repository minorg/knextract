import { Answer, QuestionnaireAdministration } from "@/lib/models";

export function questionnaireAdministrationAnswers(
  questionnaireAdministration: QuestionnaireAdministration,
): readonly Answer[] {
  return questionnaireAdministration.subProcesses.questionAdministrations.flatMap(
    (questionAdministration) =>
      questionAdministration.output.type !== "Exception"
        ? [questionAdministration.output.answer]
        : [],
  );
}
