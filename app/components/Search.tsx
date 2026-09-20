import { type KeyboardEvent, type ReactNode, useEffect, useId, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import type { SearchItem } from "~/lib/content";
import { CloseIcon } from "./icons";

type Props = {
  id: string;
  label: string;
  items: SearchItem[];
  icon: ReactNode;
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
};

const normalize = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

function match(items: SearchItem[], query: string): SearchItem[] {
  const q = normalize(query);
  if (!q) return items;
  const starts: SearchItem[] = [];
  const contains: SearchItem[] = [];
  for (const item of items) {
    const name = normalize(item.name);
    if (name.startsWith(q) || name.split(/[\s\-,]+/).some((w) => w.startsWith(q))) starts.push(item);
    else if (name.includes(q)) contains.push(item);
  }
  return [...starts, ...contains];
}

export function Search({ id, label, items, icon, expanded, onExpandedChange }: Props) {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const results = useMemo(() => match(items, query), [items, query]);

  useEffect(() => {
    if (expanded) inputRef.current?.focus();
  }, [expanded]);

  const choose = (item: SearchItem) => {
    setQuery("");
    setOpen(false);
    setActive(-1);
    inputRef.current?.blur();
    onExpandedChange(false);
    navigate(item.href);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setOpen(true);
        setActive((i) => (results.length ? (i + 1) % results.length : -1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setOpen(true);
        setActive((i) => (results.length ? (i <= 0 ? results.length - 1 : i - 1) : -1));
        break;
      case "Enter": {
        const item = results[active] ?? (query.trim() ? results[0] : undefined);
        if (item) {
          e.preventDefault();
          choose(item);
        }
        break;
      }
      case "Escape":
        e.preventDefault();
        if (open && (query || results.length)) {
          setOpen(false);
          setActive(-1);
        } else {
          setQuery("");
          inputRef.current?.blur();
          onExpandedChange(false);
        }
        break;
    }
  };

  const showList = open && results.length > 0;
  const optionId = (i: number) => `${id}-option-${i}`;

  return (
    <div className="search" data-expanded={expanded || undefined}>
      <button
        type="button"
        className="search-toggle"
        aria-label={label}
        aria-expanded={expanded}
        aria-controls={id}
        onClick={() => onExpandedChange(true)}
      >
        {icon}
      </button>
      <div className="search-field">
        <span className="search-icon">{icon}</span>
        <input
          ref={inputRef}
          id={id}
          className="search-input"
          type="text"
          role="combobox"
          aria-label={label}
          aria-autocomplete="list"
          aria-expanded={showList}
          aria-controls={listId}
          aria-activedescendant={showList && active >= 0 ? optionId(active) : undefined}
          placeholder={label}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          enterKeyHint="go"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setActive(e.target.value.trim() ? 0 : -1);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            setOpen(false);
            setActive(-1);
            if (!query) onExpandedChange(false);
          }}
          onKeyDown={onKeyDown}
        />
        <button
          type="button"
          className="search-close"
          aria-label="Close search"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            setQuery("");
            setOpen(false);
            onExpandedChange(false);
          }}
        >
          <CloseIcon />
        </button>
        <ul id={listId} role="listbox" aria-label={label} className="search-list" hidden={!showList}>
          {results.map((item, i) => (
            <li
              key={item.slug}
              id={optionId(i)}
              role="option"
              aria-selected={i === active}
              className="search-option"
              onMouseDown={(e) => e.preventDefault()}
              onMouseEnter={() => setActive(i)}
              onClick={() => choose(item)}
            >
              {item.name}
            </li>
          ))}
        </ul>
        {open && query.trim() && results.length === 0 && (
          <p className="search-empty" role="status">
            No matches
          </p>
        )}
      </div>
    </div>
  );
}
