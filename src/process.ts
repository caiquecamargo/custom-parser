import type { ParserConfig } from './parser';
import { parse } from './parser';
import { replace } from './replace';

export function process(input: string, config?: ParserConfig): string {
  const parsed = parse(input, config);
  const processed = replace(input, parsed);

  return processed;
}
