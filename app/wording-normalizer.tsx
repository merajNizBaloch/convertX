"use client";

import { useEffect } from "react";

const replacements = [
  ["Fabrication", "Conversion"],
  ["fabrication", "conversion"],
] as const;

function normalizeTextNode(node: Text) {
  const current = node.nodeValue ?? "";
  if (!/fabrication/i.test(current)) return;

  let next = current;
  for (const [from, to] of replacements) {
    next = next.replaceAll(from, to);
  }

  if (next !== current) node.nodeValue = next;
}

function normalizeSubtree(root: Node) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);

  while (walker.nextNode()) {
    const node = walker.currentNode as Text;
    if (node.parentElement?.closest("script, style, noscript")) continue;
    normalizeTextNode(node);
  }
}

export default function WordingNormalizer() {
  useEffect(() => {
    normalizeSubtree(document.body);

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type !== "childList") continue;

        for (const addedNode of Array.from(mutation.addedNodes)) {
          if (addedNode.nodeType === Node.TEXT_NODE) {
            normalizeTextNode(addedNode as Text);
          } else if (addedNode.nodeType === Node.ELEMENT_NODE) {
            normalizeSubtree(addedNode);
          }
        }
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return null;
}
