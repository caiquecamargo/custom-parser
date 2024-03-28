import { parse, ParserConfig } from "./parser";
import { replace } from "./replace";

export const process = (input: string, config?: ParserConfig): string => {
  const parsed = parse(input, config);
  const processed = replace(input, parsed);

  return processed;
}