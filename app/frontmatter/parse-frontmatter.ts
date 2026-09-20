export type Frontmatter = Record<string, string | number | boolean | null>;

const KEY_VALUE = /^([A-Za-z_][\w-]*)[ \t]*:[ \t]*(.*)$/;
const DOUBLE_QUOTED = /^"((?:[^"\\]|\\.)*)"[ \t]*(?:#.*)?$/;
const SINGLE_QUOTED = /^'((?:[^']|'')*)'[ \t]*(?:#.*)?$/;
const NUMBER = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/;

function fail(where: string, message: string): never {
  throw new Error(`[frontmatter] ${where}: ${message}`);
}

function parseValue(raw: string, where: string): Frontmatter[string] {
  const text = raw.trim();
  if (text === "" || text === "null" || text === "~" || text.startsWith("#")) return null;

  if (text.startsWith('"')) {
    const match = DOUBLE_QUOTED.exec(text);
    if (!match) fail(where, `unterminated double-quoted value ${JSON.stringify(text)}`);
    try {
      return JSON.parse(`"${match[1]}"`) as string;
    } catch {
      fail(where, `unsupported escape in ${JSON.stringify(text)}; \\" and \\\\ are supported`);
    }
  }

  if (text.startsWith("'")) {
    const match = SINGLE_QUOTED.exec(text);
    if (!match) fail(where, `unterminated single-quoted value ${JSON.stringify(text)}`);
    return match[1].replace(/''/g, "'");
  }

  if (text.startsWith("|") || text.startsWith(">")) {
    fail(where, "multi-line (block) values are not supported; put long text in the body instead");
  }
  if (text.startsWith("[") || text.startsWith("{") || text.startsWith("- ")) {
    fail(where, "lists and nested values are not supported; frontmatter is one `key: value` per line");
  }

  // Plain scalar: a ` #` comment ends it, as in YAML.
  const plain = text.replace(/[ \t]+#.*$/, "").trim();
  if (plain === "true") return true;
  if (plain === "false") return false;
  if (NUMBER.test(plain)) return Number(plain);
  return plain;
}

export function parseFrontmatter(source: string, file = "frontmatter"): Frontmatter {
  const result: Frontmatter = {};
  source.split(/\r?\n/).forEach((line, index) => {
    const where = `${file} line ${index + 1}`;
    if (!line.trim() || line.trimStart().startsWith("#")) return;
    if (/^[ \t]/.test(line)) {
      fail(where, "indented lines are not supported; frontmatter is one `key: value` per line");
    }
    const match = KEY_VALUE.exec(line.trimEnd());
    if (!match) fail(where, `expected \`key: value\`, got ${JSON.stringify(line.trim())}`);
    const [, key, value] = match;
    if (key in result) fail(where, `duplicate key "${key}"`);
    result[key] = parseValue(value, where);
  });
  return result;
}
