import { PromptTemplateViewer } from "@/lib/components/PromptTemplateViewer";
import { PromptViewer } from "@/lib/components/PromptViewer";
import { Prompt, PromptTemplate, PromptTemplateLike } from "@/lib/models";

export function PromptTemplateLikeViewer({
  promptTemplateLike,
}: { promptTemplateLike: PromptTemplateLike }) {
  switch (promptTemplateLike.type) {
    case "PromptMessage":
      return (
        <PromptViewer prompt={new Prompt({ messages: [promptTemplateLike] })} />
      );
    case "PromptMessageTemplate":
      return (
        <PromptTemplateViewer
          promptTemplate={
            new PromptTemplate({ messageTemplates: [promptTemplateLike] })
          }
        />
      );
    case "Prompt":
      return <PromptViewer prompt={promptTemplateLike} />;
    case "PromptTemplate":
      return <PromptTemplateViewer promptTemplate={promptTemplateLike} />;
  }
}
