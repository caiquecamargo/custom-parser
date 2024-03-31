import { describe, expect, it } from 'vitest';
import type { HTMLParserConfig } from './html-parser';
import { parseHtml } from './html-parser';

const config: HTMLParserConfig = {
  marks: [
    { tagName: 'mark', replace: element => `{{${element.properties.dataProccess}}}` },
    { tagName: 'b', replace: (_, content) => `**${content}**` },
    { tagName: 'i', replace: (_, content) => `*${content}*` },
    { tagName: 'span', replace: (element, content) => `##[[${element.properties.style}]]${content}##` },
  ],
};

describe('html-parser', () => {
  it.each([
    [
      '',
      '',
    ],
    [
      `<mark contenteditable="false" class="bg-primary text-white p-1 rounded" data-proccess="personalYearText">Ano pessoal: texto</mark>`,
      '{{personalYearText}}',
    ],
    [
      '<b>bold text</b>',
      '**bold text**',
    ],
    [
      '<i>italic text</i>',
      '*italic text*',
    ],
    [
      '<b><i>red text</i></b>',
      '***red text***',
    ],
    [
      '<span style="color:#6f1f1f; and a wider content">estabelecido </span>',
      '##[[color:#6f1f1f; and a wider content]]estabelecido ##',
    ],
    [
      'É o ano de <b>iniciar</b> novas coisas, onde <i>todo</i> estilo será <span style="color:#6f1f1f;">estabelecido </span>pelo ciclo de nove anos. É a <i>hora de <b>ter</b> iniciativa e ser corajoso</i> e determinado. Se <b><i>quiser</i></b> sucesso e felicidade, a <span style="color:#6f1f1f;">pessoa <i>precisa</i> ser <b>criativa</b>, segura, independente</span> e confiar na própria intuição. Deve tomar cuidado com a apatia e procrastinação, ou seja, deixar tudo para depois.',
      'É o ano de **iniciar** novas coisas, onde *todo* estilo será ##[[color:#6f1f1f;]]estabelecido ##pelo ciclo de nove anos. É a *hora de **ter** iniciativa e ser corajoso* e determinado. Se ***quiser*** sucesso e felicidade, a ##[[color:#6f1f1f;]]pessoa *precisa* ser **criativa**, segura, independente## e confiar na própria intuição. Deve tomar cuidado com a apatia e procrastinação, ou seja, deixar tudo para depois.',
    ],
    [
      'É o ano de <b>iniciar</b> novas <b>coisas, onde <i>todo <b>novo</b> doido</i> estilo</b> será <span style="color:#6f1f1f;">estabelecido </span>',
      'É o ano de **iniciar** novas **coisas, onde *todo **novo** doido* estilo** será ##[[color:#6f1f1f;]]estabelecido ##',
    ],
  ])('should process input', async (html, expected) => {
    const processed = parseHtml(html, config);
    expect(processed).toEqual(expected);
  });
});
