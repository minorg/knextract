import { Project } from "@/lib/Project";
import { GlobalRef } from "@kos-kit/next-utils/server";

const projectGlobalRef = new GlobalRef<Project>("project");
projectGlobalRef.value = Project.fromEnvironment();
export const project = projectGlobalRef.value;
