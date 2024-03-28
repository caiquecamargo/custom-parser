import { Mark, ParserResponse } from "./parser";

export const replace = (text: string, markeds: ParserResponse[]) => {
  const tokens = markeds
    .flatMap((marked) => {
      const { start, end, mark, content } = marked;

      return [{ position: start, mark, content, open: true }, { position: end, mark, content, open: false }];
    })
    .sort((a, b) => a.position[0] - b.position[0]);
  
  let result = "";
  let cursor = 0;

  for (const token of tokens) {
    const [init, end] = token.position;

    const content = token.content ? text.slice(token.content.start[1] + end, token.content.end[0] + end) : "";
    const replaced = token.mark.replace ? token.mark.replace(token.open, content) : "";

    const contentEnd = token.content?.end[1] ?? 0;
    const resolvedEnd = token.open ? contentEnd + end : end;

    result += text.slice(cursor, init) + replaced;
    cursor = resolvedEnd;
  }

  return result + text.slice(cursor);
}