import { Navbar } from "@/lib/components/Navbar";
import { PropsWithChildren } from "react";

export function Layout({ children }: PropsWithChildren) {
  return (
    <div className="flex flex-col gap-4 min-h-screen px-2 sm:px-4 md:px-8 lg:px-16 xl:px-32 2xl:px-64 py-4">
      <Navbar />
      <main className="flex-grow">
        <div className="flex flex-col gap-8">{children}</div>
      </main>
    </div>
  );
}
