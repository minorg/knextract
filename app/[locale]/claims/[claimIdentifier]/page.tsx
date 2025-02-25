import { project } from "@/app/project";
import { PageMetadata } from "@/lib/PageMetadata";
import { Layout } from "@/lib/components/Layout";
import { Link } from "@/lib/components/Link";
import { PageTitleHeading } from "@/lib/components/PageTitleHeading";
import { Section } from "@/lib/components/Section";
import { getHrefs } from "@/lib/getHrefs";
import {
  Identifier,
  Locale,
  WorkflowExecution,
  displayLabel,
} from "@/lib/models";
import { routing } from "@/lib/routing";
import { decodeFileName, encodeFileName } from "@kos-kit/next-utils";
import { Metadata } from "next";
import { getTranslations, unstable_setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { EitherAsync } from "purify-ts";

interface ClaimPageParams {
  claimIdentifier: string;
  locale: Locale;
}

export default async function ClaimPage({
  params: { claimIdentifier, locale },
}: {
  params: ClaimPageParams;
}) {
  unstable_setRequestLocale(locale);

  const modelSet = await project.modelSet({ locale });

  const claim = (
    await modelSet.claim(Identifier.fromString(decodeFileName(claimIdentifier)))
  )
    .toMaybe()
    .extractNullable();
  if (!claim) {
    notFound();
  }

  const subjectDocument = (await modelSet.documentStub(claim.subject))
    .mapLeft(() => undefined)
    .extract();

  const hrefs = await getHrefs();
  const translations = await getTranslations("ClaimPage");

  const workflowExecutions = await EitherAsync(async ({ liftEither }) => {
    const workflowExecutions: WorkflowExecution[] = [];
    for (const stub of await liftEither(
      await modelSet.workflowExecutionStubs({
        query: { claimIdentifier: claim.identifier, type: "ClaimGenerator" },
      }),
    )) {
      workflowExecutions.push(
        await liftEither(await modelSet.workflowExecution(stub.identifier)),
      );
    }
    return workflowExecutions;
  }).orDefault([]);

  return (
    <Layout>
      <PageTitleHeading>{translations("Claim")}</PageTitleHeading>
      {subjectDocument ? (
        <Section title={translations("Subject")}>
          <Link
            href={hrefs.document({
              identifier: subjectDocument.identifier,
            })}
          >
            {displayLabel(subjectDocument, { locale })}
          </Link>
        </Section>
      ) : null}
      <Section title={translations("Predicate")}>
        {Identifier.toString(claim.predicate)}
      </Section>
      <Section title={translations("Type")}>
        {claim.gold ? translations("Gold") : translations("Inferred")}
      </Section>
      {workflowExecutions.length > 0 ? (
        <Section title={translations("Output of")}>
          <ul className="list list-disc list-inside">
            {workflowExecutions.map((workflowExecution) => (
              <li key={Identifier.toString(workflowExecution.identifier)}>
                <Link
                  href={hrefs.workflowExecution({
                    workflowIdentifier:
                      workflowExecution.input.workflow.identifier,
                    workflowExecutionIdentifier: workflowExecution.identifier,
                  })}
                >
                  {translations("Workflow execution")}
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}
    </Layout>
  );
}

export async function generateMetadata({
  params: { claimIdentifier, locale },
}: {
  params: ClaimPageParams;
}): Promise<Metadata> {
  const pageMetadata = await PageMetadata.get({ locale });

  if (!project.nextConfiguration.generatePageMetadata) {
    return pageMetadata.locale;
  }

  return (
    await (
      await project.modelSet({ locale })
    ).claim(Identifier.fromString(decodeFileName(claimIdentifier)))
  )
    .map((claim) => pageMetadata.claim(claim))
    .orDefault({} satisfies Metadata);
}

export async function generateStaticParams(): Promise<ClaimPageParams[]> {
  if (!project.nextConfiguration.generateStaticParams) {
    return [];
  }

  const staticParams: ClaimPageParams[] = [];

  for (const locale of routing.locales) {
    for (const claim of (
      await (
        await project.modelSet({ locale })
      ).claims({
        query: { type: "All" },
      })
    ).unsafeCoerce()) {
      staticParams.push({
        claimIdentifier: encodeFileName(Identifier.toString(claim.identifier)),
        locale: locale,
      });
    }
  }

  return staticParams;
}
