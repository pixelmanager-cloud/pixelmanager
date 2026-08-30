// Minimal ambient declarations for the bits of the Node runtime the QA harnesses actually use.
// Deliberately NOT @types/node: this repo has no @types packages at all and is offline-first, so a
// hand-written surface of two members beats pulling a dependency in just to typecheck env lookups.
declare const process: {
  env: Record<string, string | undefined>;
  argv: string[];
  exit(code?: number): never;
  exitCode: number;
  stdout: { write(s: string): void };
};
