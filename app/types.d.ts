declare module "*.mdx" {
  import type { ComponentType } from "react";
  export const frontmatter: Record<string, unknown>;
  export const text: string;
  const MDXContent: ComponentType<{ components?: Record<string, unknown> }>;
  export default MDXContent;
}

declare module "*&as=url" {
  const src: string;
  export default src;
}
