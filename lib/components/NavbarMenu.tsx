"use client";

import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/lib/components/ui/navigation-menu";
import { useHrefs } from "@/lib/hooks";
import { useTranslations } from "next-intl";

export function NavbarMenu() {
  const hrefs = useHrefs();
  const translations = useTranslations("NavbarMenu");

  return (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          {[
            {
              href: hrefs.conceptSchemes,
              text: translations("Concept schemes"),
            },
            {
              href: hrefs.corpora,
              text: translations("Corpora"),
            },
            {
              href: hrefs.workflows,
              text: translations("Workflows"),
            },
          ].map(({ href, text }) => (
            <NavigationMenuLink
              className={navigationMenuTriggerStyle()}
              href={href}
              key={href}
            >
              {text}
            </NavigationMenuLink>
          ))}
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}
