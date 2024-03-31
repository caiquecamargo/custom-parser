import { retext } from 'retext';
import type { Node, Paragraph, ParagraphContent, Punctuation, Root, Sentence, SentenceContent, Symbol } from 'nlcst';
import type { VFile } from 'vfile';

enum NodeType {
  Sentence = 'SentenceNode',
  WhiteSpace = 'WhiteSpaceNode',
  Paragraph = 'ParagraphNode',
  Word = 'WordNode',
  Punctuation = 'PunctuationNode',
  Text = 'TextNode',
  Symbol = 'SymbolNode',
}

export enum MarkType {
  // eslint-disable-next-line ts/prefer-literal-enum-member
  Symbol = NodeType.Symbol,
  // eslint-disable-next-line ts/prefer-literal-enum-member
  Punctuation = NodeType.Punctuation,
}

export interface Mark {
  type: MarkType;
  open: string;
  close?: string;
  content?: Mark;
  transform?: (node: Marked) => Marked[];
  replace?: (open: boolean, content: string, innerContent: string) => string;
  replaceText?: (content: string) => string;
}

export interface ParserConfig {
  marks: Mark[];
  resolveConflicts?: (rest: Marked[]) => MarkGroup[];
}

// eslint-disable-next-line ts/ban-types
type MarkContent = Symbol | Punctuation;
export type MarkGroup = [Marked, Marked];

export interface Marked {
  mark: Mark;
  start: number;
  end: number;
  value: string;
};

export interface ParserResponse {
  open: string;
  close: string;
  start: [init: number, end: number];
  end: [init: number, end: number];
  content?: ParserResponse;
  mark: Mark;
};

const isParagraph = (node: Node): node is Paragraph => node.type === 'ParagraphNode';
const extractParagraphs = (node: Node): ParagraphContent[] => (node as Paragraph).children;
const extractSentences = (node: Sentence): SentenceContent[] => node.children;
const isSentence = (node: Node): node is Sentence => node.type === 'SentenceNode';

function includedInMarks(marks: Mark[]) {
  return (node: SentenceContent): node is MarkContent =>
    marks.some(mark => mark.type === node.type && (mark.open === node.value || mark.close === node.value));
}

function toMarked(marks: Mark[]) {
  return (node: MarkContent): Marked => ({
    value: node.value,
    start: node.position?.start.offset ?? 0,
    end: node.position?.end.offset ?? 0,
    mark: marks.find(mark => mark.open === node.value || mark.close === node.value) as Mark,
  });
}

function toResponse(group: MarkGroup): ParserResponse {
  const [init, end] = group;
  return {
    open: init.value,
    close: end.value,
    start: [init.start, init.end],
    end: [end.start, end.end],
    mark: init.mark,
  };
}

const isNodeEquals = (a: Marked, b: Marked) => a.mark.open === b.value || a.mark.close === b.value;

function processSentence(nodes: Marked[], groups: MarkGroup[] = [], consumed: Marked[] = []): [MarkGroup[], Marked[]] {
  if (!nodes.length)
    return [groups, consumed];
  if (!consumed.length)
    return processSentence(nodes.slice(1), groups, [nodes[0]]);

  const last = consumed[consumed.length - 1];
  const node = nodes[0];

  if (isNodeEquals(last, node))
    return processSentence(nodes.slice(1), [...groups, [last, node]], consumed.slice(0, -1));
  return processSentence(nodes.slice(1), groups, [...consumed, node]);
}

function resolveContent(input: string, groups: ParserResponse[]) {
  groups.forEach((group) => {
    if (!group.mark.content)
      return;

    const start = group.start[0] + group.open.length;
    const [end] = group.end;
    group.content = parse(input.slice(start, end), { marks: [group.mark.content] })[0];
  });
}

function plugin(config?: ParserConfig) {
  return () => {
    return (tree: Root, file: VFile) => {
      const marks = config?.marks ?? [];
      const resolveConflicts = config?.resolveConflicts ?? (_ => ([]));

      const sentences = tree.children
        .filter(isParagraph)
        .flatMap(extractParagraphs)
        .filter(isSentence)
        .flatMap(extractSentences)
        .filter(includedInMarks(marks))
        .map(toMarked(marks));

      const [groups, rest] = processSentence(sentences);
      const processed = [...groups, ...resolveConflicts(rest)].map(toResponse);

      resolveContent(file.value as string, processed);
      file.data.processed = processed;
    };
  };
}

export function parse(input: string, config?: ParserConfig) {
  const tree = retext().use(plugin(config)).processSync(input);

  return tree.data.processed as ParserResponse[];
}
