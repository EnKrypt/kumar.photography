import { parseFrontmatter } from "./parse-frontmatter.ts";

type Node = { type: string; value?: string; data?: unknown; children?: Node[] };
type Root = Node & { children: Node[] };

/** Visible text of the body: link and emphasis text included, frontmatter and JSX left out. */
function plainText(node: Node): string {
  if (node.type === "yaml" || node.type === "mdxjsEsm") return "";
  if (node.type === "text" || node.type === "inlineCode") return node.value ?? "";
  if (!node.children) return "";
  const separator = node.type === "paragraph" || node.type === "root" ? " " : "";
  return node.children.map(plainText).join(separator);
}

function jsonExport(name: string, value: unknown) {
  const json = JSON.stringify(value);
  return {
    type: "ExportNamedDeclaration",
    specifiers: [],
    source: null,
    declaration: {
      type: "VariableDeclaration",
      kind: "const",
      declarations: [
        {
          type: "VariableDeclarator",
          id: { type: "Identifier", name },
          init: {
            type: "CallExpression",
            optional: false,
            callee: {
              type: "MemberExpression",
              object: { type: "Identifier", name: "JSON" },
              property: { type: "Identifier", name: "parse" },
              computed: false,
              optional: false,
            },
            arguments: [{ type: "Literal", value: json, raw: JSON.stringify(json) }],
          },
        },
      ],
    },
  };
}

export default function remarkYamlFrontmatter() {
  return (tree: Root, file?: { basename?: string }) => {
    const yamlNode = tree.children.find((node) => node.type === "yaml");
    const frontmatter = yamlNode?.value
      ? parseFrontmatter(yamlNode.value, file?.basename ?? "frontmatter")
      : {};
    const text = plainText(tree).replace(/\s+/g, " ").trim();

    tree.children.unshift({
      type: "mdxjsEsm",
      value: "",
      data: {
        estree: {
          type: "Program",
          sourceType: "module",
          body: [jsonExport("frontmatter", frontmatter), jsonExport("text", text)],
        },
      },
    });
  };
}
