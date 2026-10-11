import { useEffect, useState } from "react";

const TYPE_MS = 90;
const ERASE_MS = 45;
const HOLD_MS = 1500;
const START_DELAY_MS = 400;

/**
 * Types `prefix` once, then cycles through `words`: typing each word
 * char-by-char, pausing, erasing it, and moving to the next. The prefix
 * stays on screen forever.
 */
export function useTypewriterCycle(prefix: string, words: readonly string[]) {
  const [typed, setTyped] = useState("");

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    const schedule = (fn: () => void, ms: number) => {
      timer = setTimeout(() => {
        if (!cancelled) fn();
      }, ms);
    };

    const eraseWord = (word: string, next: () => void) => {
      let i = word.length;
      const step = () => {
        i -= 1;
        setTyped(prefix + word.slice(0, i));
        if (i > 0) schedule(step, ERASE_MS);
        else schedule(next, 250);
      };
      schedule(step, ERASE_MS);
    };

    const typeWord = (word: string, next: () => void) => {
      let i = 0;
      const step = () => {
        i += 1;
        setTyped(prefix + word.slice(0, i));
        if (i < word.length) schedule(step, TYPE_MS);
        else schedule(() => eraseWord(word, next), HOLD_MS);
      };
      schedule(step, TYPE_MS);
    };

    const loop = (index: number) => {
      const word = words[index % words.length]!;
      typeWord(word, () => loop(index + 1));
    };

    // Phase 1: type the prefix char-by-char, then start the word cycle.
    let i = 0;
    const typePrefix = () => {
      i += 1;
      setTyped(prefix.slice(0, i));
      if (i < prefix.length) schedule(typePrefix, TYPE_MS);
      else schedule(() => loop(0), 300);
    };
    schedule(typePrefix, START_DELAY_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [prefix, words]);

  return typed;
}
