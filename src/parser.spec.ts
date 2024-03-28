import { describe, expect, it } from "vitest";
import { parse, MarkType, MarkGroup, Marked, ParserConfig } from "./parser";
import { inChunks } from "@caiquecamargo/utils/core";

const config: ParserConfig = {
  marks: [
    { type: MarkType.Punctuation, open: "{{", close: "}}" },
    { type: MarkType.Symbol, open: "**" },
    { type: MarkType.Symbol, open: "*" },
    { type: MarkType.Symbol, open: "***" },
    { type: MarkType.Symbol, open: "##", content: { type: MarkType.Punctuation, open: "[[", close: "]]" }, },
  ],
  resolveConflicts: (rest) => {
    const groups: MarkGroup[] = [];
    for (const [first, second, third] of inChunks(rest, 3)) {
      if (!first || !second || !third) continue;
      if (new Set([first, second, third].map(a => a.value)).size !== 3) continue;

      const bold = [first, second, third].find(a => a.mark.open === "**") as Marked;
      const italic = [first, second, third].find(a => a.mark.open === "*") as Marked;
      const boldItalic = [first, second, third].find(a => a.mark.open === "***") as Marked;

      const union: Marked = {
        start: bold?.start ?? 0,
        end: italic?.end ?? 0,
        value: "***",
        mark: { type: MarkType.Symbol, open: "***" },
      }

      groups.push(union.start < boldItalic?.start ? [union, boldItalic] : [boldItalic, union])
    }

    return groups;
  }
}

describe('parser', () => {
  it.each([
    [
      [],
      ""
    ],
    [
      [
        { open: "{{", close: "}}", start: [0, 2], end: [18, 20], mark: { open: "{{", close: "}}", type: MarkType.Punctuation }},
      ],
      "{{personalYearText}}"
    ],
    [
      [
        { open: "**", close: "**", start: [0, 2], end: [11, 13], mark: { open: "**", type: MarkType.Symbol }},
      ],
      "**bold text**"
    ],
    [
      [
        { open: "*", close: "*", start: [0, 1], end: [12, 13], mark: { open: "*", type: MarkType.Symbol }},
      ],
      "*italic text*"
    ],
    [
      [
        { open: "***", close: "***", start: [0, 3], end: [11, 14], mark: { open: "***", type: MarkType.Symbol }},
      ],
      "***red text***"
    ],
    [
      [
        { open: "***", close: "***", start: [0, 3], end: [11, 15], mark: { open: "***", type: MarkType.Symbol }},
      ],
      "***red text** *"
    ],
    [
      [
        { open: "##", close: "##", start: [0, 2], end: [53, 55],
          mark: { type: MarkType.Symbol, open: "##", content: { type: MarkType.Punctuation, open: "[[", close: "]]" }},
          content:
            { open: "[[", close: "]]", start: [0, 2], end: [36, 38], mark: { open: "[[", close: "]]", type: MarkType.Punctuation }}
        },
      ],
      "##[[color:#6f1f1f; and a wider content]]estabelecido ##"
    ],
    [
      [
        { open: "**", close: "**", start: [11, 13], end: [20, 22], mark: { open: "**", type: MarkType.Symbol }},
        { open: "*", close: "*", start: [42, 43], end: [47, 48], mark: { open: "*", type: MarkType.Symbol }},
        { open: "##", close: "##", start: [61, 63], end: [94, 96],
          mark: { type: MarkType.Symbol, open: "##", content: { type: MarkType.Punctuation, open: "[[", close: "]]" }},
          content:
            { open: "[[", close: "]]", start: [0, 2], end: [16, 18], mark: { open: "[[", close: "]]", type: MarkType.Punctuation }}
        },
        { open: "**", close: "**", start: [134, 136], end: [139, 141], mark: { open: "**", type: MarkType.Symbol }},
        { open: "*", close: "*", start: [125, 126], end: [167, 168], mark: { open: "*", type: MarkType.Symbol }},
        { open: "***", close: "***", start: [187, 190], end: [196, 199], mark: { open: "***", type: MarkType.Symbol }},
        { open: "*", close: "*", start: [251, 252], end: [259, 260], mark: { open: "*", type: MarkType.Symbol }},
        { open: "**", close: "**", start: [265, 267], end: [275, 277], mark: { open: "**", type: MarkType.Symbol }},
        { open: "##", close: "##", start: [224, 226], end: [299, 301],
          mark: { type: MarkType.Symbol, open: "##", content: { type: MarkType.Punctuation, open: "[[", close: "]]" }},
          content:
            { open: "[[", close: "]]", start: [0, 2], end: [16, 18], mark: { open: "[[", close: "]]", type: MarkType.Punctuation }}
        },
      ],
      "É o ano de **iniciar** novas coisas, onde *todo* estilo será ##[[color:#6f1f1f;]]estabelecido ##pelo ciclo de nove anos. É a *hora de **ter** iniciativa e ser corajoso* e determinado. Se ***quiser*** sucesso e felicidade, a ##[[color:#6f1f1f;]]pessoa *precisa* ser **criativa**, segura, independente## e confiar na própria intuição. Deve tomar cuidado com a apatia e procrastinação, ou seja, deixar tudo para depois."
    ],
    [
      [
        { open: "**", close: "**", start: [11, 13], end: [20, 22], mark: { open: "**", type: MarkType.Symbol }},
        { open: "**", close: "**", start: [50, 52], end: [56, 58], mark: { open: "**", type: MarkType.Symbol }},
        { open: "*", close: "*", start: [44, 45], end: [64, 65], mark: { open: "*", type: MarkType.Symbol }},
        { open: "**", close: "**", start: [29, 31], end: [72, 74], mark: { open: "**", type: MarkType.Symbol }},
        { open: "##", close: "##", start: [80, 82], end: [113, 115], 
          mark: { type: MarkType.Symbol, open: "##", content: { type: MarkType.Punctuation, open: "[[", close: "]]" }},
          content:
            { open: "[[", close: "]]", start: [0, 2], end: [16, 18], mark: { open: "[[", close: "]]", type: MarkType.Punctuation }}
        },
      ],
      "É o ano de **iniciar** novas **coisas, onde *todo **novo** doido* estilo** será ##[[color:#6f1f1f;]]estabelecido ##"
    ],
  ])('should process input', async (expected, text) => {
    const processed = parse(text, config);
    expect(processed).toEqual(expected);
  })
});