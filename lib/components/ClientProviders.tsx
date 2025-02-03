"use client";

import { ClientConfigurationContext } from "@/lib/contexts";
import { ClientConfiguration, Locale } from "@/lib/models";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NextIntlClientProvider } from "next-intl";
import React, { Suspense } from "react";
// @ts-ignore
import TimeZone from "use-intl/dist/types/src/core/TimeZone";

const queryClient = new QueryClient();

/**
 * Client component that provides context to other client components.
 */
export function ClientProviders({
  children,
  configuration,
  locale,
  messages,
  timeZone,
}: React.PropsWithChildren<{
  configuration: ClientConfiguration;
  locale: Locale;
  messages: IntlMessages;
  timeZone: TimeZone;
}>) {
  // nuqs useQueryStates calls useSearchParams, so the whole component needs to be wrapped in a Suspense
  // https://nextjs.org/docs/messages/missing-suspense-with-csr-bailout

  return (
    <ClientConfigurationContext.Provider value={configuration}>
      <NextIntlClientProvider
        locale={locale}
        messages={messages}
        timeZone={timeZone}
      >
        <QueryClientProvider client={queryClient}>
          <Suspense>{children}</Suspense>
        </QueryClientProvider>
      </NextIntlClientProvider>
    </ClientConfigurationContext.Provider>
  );
}
