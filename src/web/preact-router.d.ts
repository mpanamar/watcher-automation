import type { ComponentChildren } from "preact";

declare module "preact-router" {
  interface RouterProps {
    children?: ComponentChildren;
  }
}
