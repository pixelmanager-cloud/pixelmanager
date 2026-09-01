// Types for the gate parser, so shared/qa_gate_parse.ts typechecks under `npm run typecheck:shared`.
// The implementation stays plain .mjs because scripts/ runs under bare node, with no tsx in the chain.
export declare function norm(s: string): string;
export declare function collect(text: string): Set<string>;
