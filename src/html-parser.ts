import type { Comment, Element, Root } from 'hast';
import { rehype } from 'rehype';
import type { VFile } from 'vfile';
import type { ParserResponse } from './parser';

export interface HTMLMark {
  tagName: string;
  replace: (element: Element, content: string) => string;
}

export interface HTMLParserConfig {
  marks: HTMLMark[];
}

function unrun(node: Element | Comment, input: string, marks: HTMLMark[]): string {
  if (node.type === 'comment')
    return '';

  return node.children.map((child) => {
    if (child.type === 'comment')
      return '';
    if (child.type === 'text')
      return child.value;

    const mark = marks.find(mark => mark.tagName === child.tagName);

    return mark?.replace(child, unrun(child, input, marks));
  }).join('');
}

function plugin(config?: HTMLParserConfig) {
  return () => {
    return (tree: Root, file: VFile) => {
      const marks = config?.marks ?? [];
      const [_, body] = (tree.children.shift() as Element).children;
      file.data.parsed = unrun(body as Element | Comment, file.value as string, marks);
    };
  };
}

export function parseHtml(input: string, config?: HTMLParserConfig) {
  const tree = rehype().use(plugin(config)).processSync(input);

  return tree.data.parsed as string;
}
