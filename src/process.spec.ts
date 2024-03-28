import { describe, expect, it } from "vitest";
import { MarkType, MarkGroup, Marked, ParserConfig } from "./parser";
import { inChunks } from "@caiquecamargo/utils/core";
import { process } from "./process";

const config: ParserConfig = {
  marks: [
    { type: MarkType.Punctuation, open: "{{", close: "}}" },
    { type: MarkType.Symbol, open: "**", replace: (open) => open ? "<b>" : "</b>" },
    { type: MarkType.Symbol, open: "*", replace: (open) => open ? "<i>" : "</i>" },
    { type: MarkType.Symbol, open: "***", replace: (open) => open ? "<b><i>" : "</i></b>"},
    { 
      type: MarkType.Symbol,
      open: "##",
      content: { type: MarkType.Punctuation, open: "[[", close: "]]" },
      replace: (open, content) => open ? `<span style="${content}">` : "</span>",
    }
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

describe('process', () => {
  it.each([
    [
      "",
      ""
    ],
    [
      "personalYearText",
      "{{personalYearText}}"
    ],
    [
      "<b>bold text</b>",
      "**bold text**"
    ],
    [
      "<i>italic text</i>",
      "*italic text*"
    ],
    [
      "<b><i>red text</i></b>",
      "***red text***"
    ],
    [
      "<b><i>red text</i></b>",
      "***red text** *"
    ],
    [
      "<span style=\"color:#6f1f1f; and a wider content\">estabelecido </span>",
      "##[[color:#6f1f1f; and a wider content]]estabelecido ##"
    ],
    [
      "É o ano de <b>iniciar</b> novas coisas, onde <i>todo</i> estilo será <span style=\"color:#6f1f1f;\">estabelecido </span>pelo ciclo de nove anos. É a <i>hora de <b>ter</b> iniciativa e ser corajoso</i> e determinado. Se <b><i>quiser</i></b> sucesso e felicidade, a <span style=\"color:#6f1f1f;\">pessoa <i>precisa</i> ser <b>criativa</b>, segura, independente</span> e confiar na própria intuição. Deve tomar cuidado com a apatia e procrastinação, ou seja, deixar tudo para depois.",
      "É o ano de **iniciar** novas coisas, onde *todo* estilo será ##[[color:#6f1f1f;]]estabelecido ##pelo ciclo de nove anos. É a *hora de **ter** iniciativa e ser corajoso* e determinado. Se ***quiser*** sucesso e felicidade, a ##[[color:#6f1f1f;]]pessoa *precisa* ser **criativa**, segura, independente## e confiar na própria intuição. Deve tomar cuidado com a apatia e procrastinação, ou seja, deixar tudo para depois."
    ],
    [
      "É o ano de <b>iniciar</b> novas <b>coisas, onde <i>todo <b>novo</b> doido</i> estilo</b> será <span style=\"color:#6f1f1f;\">estabelecido </span>",
      "É o ano de **iniciar** novas **coisas, onde *todo **novo** doido* estilo** será ##[[color:#6f1f1f;]]estabelecido ##"
    ],
  ])('should process input', async (expected, text) => {
    const processed = process(text, config);
    expect(processed).toEqual(expected);
  })
});