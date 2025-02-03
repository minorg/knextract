import { ClientProvidersServer } from "@/lib/components/ClientProvidersServer";
import { Link } from "@/lib/components/Link";
import { getHrefs } from "@/lib/getHrefs";
import { getTranslations } from "next-intl/server";
import { NavbarMenu } from "./NavbarMenu";

export async function Navbar() {
  return (
    <nav className="bg-white border-gray-200 dark:bg-gray-900">
      <div className="max-w-screen-xl flex flex-wrap justify-between">
        <Link
          href={(await getHrefs()).locale}
          className="flex space-x-3 rtl:space-x-reverse"
        >
          {/* <ListBulletIcon className="h-8 w-8" /> */}
          <span className="self-center text-xl font-semibold whitespace-nowrap dark:text-white">
            {(await getTranslations("Navbar"))("Knextract")}
          </span>
        </Link>
        <div className="flex gap-4 justify-end">
          <ClientProvidersServer>
            <NavbarMenu />
          </ClientProvidersServer>
        </div>
      </div>
    </nav>
  );
}
