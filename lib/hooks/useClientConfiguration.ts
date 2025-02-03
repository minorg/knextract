import { ClientConfigurationContext } from "@/lib/contexts";
import { useContext } from "react";

export function useClientConfiguration() {
  return useContext(ClientConfigurationContext);
}
