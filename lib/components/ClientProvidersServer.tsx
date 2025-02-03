import { project } from "@/app/project";
import { ClientProviders } from "@/lib/components/ClientProviders";
import { Locale } from "@/lib/models";
import { getLocale, getMessages, getTimeZone } from "next-intl/server";
import React from "react";

/**
 * Server component that passes server data to a ClientProviders component and its children.
 */
export async function ClientProvidersServer({
  children,
}: React.PropsWithChildren) {
  return (
    <ClientProviders
      configuration={project.clientConfiguration}
      locale={(await getLocale()) as Locale}
      messages={(await getMessages()) as IntlMessages}
      timeZone={await getTimeZone()}
    >
      {children}
    </ClientProviders>
  );
}
