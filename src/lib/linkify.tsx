import React from "react";

// Linkify plain text into clickable anchors
// - Supports http/https, www., and bare domain.tld/path
// - Skips emails
// - Adds https:// when protocol is missing
export function linkifyText(text: string): (string | JSX.Element)[] {
  if (!text) return [""];

  const nodes: (string | JSX.Element)[] = [];

  // Regex to find potential URLs but not emails
  const urlRegex = /((?:https?:\/\/)?(?:www\.)?(?![\w.+-]+@)[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:[\/?#][^\s]*)?)/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = urlRegex.exec(text)) !== null) {
    const start = match.index;
    const end = urlRegex.lastIndex;

    // Add text before match
    if (start > lastIndex) nodes.push(text.slice(lastIndex, start));

    let matched = match[1];

    // Trim common trailing punctuation that is not part of URL
    const trailingPunct = /[).,!?:]+$/;
    let punct = "";
    if (trailingPunct.test(matched)) {
      const p = matched.match(trailingPunct)?.[0] || "";
      matched = matched.slice(0, matched.length - p.length);
      punct = p;
    }

    // Skip emails just in case
    if (/^[\w.+-]+@[^\s]+$/.test(matched)) {
      nodes.push(match[0]);
      lastIndex = end;
      continue;
    }

    const href = /^(?:https?:)?\/\//i.test(matched) ? (matched.startsWith("http") ? matched : `https:${matched}`) : `https://${matched}`;

    nodes.push(
      <a
        key={`lnk-${start}`}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary underline"
      >
        {matched}
      </a>
    );

    // Append any punctuation that we trimmed
    if (punct) nodes.push(punct);

    lastIndex = end;
  }

  // Remaining text
  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));

  return nodes.length ? nodes : [text];
}
