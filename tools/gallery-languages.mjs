import { publicationNodes } from './gallery-document.mjs';

const text = value => Array.isArray(value)
  ? value.map(part => part.plain_text ?? part.text?.content ?? '').join('')
  : String(value ?? '');

// Keep the two editable Notion versions in one reading position. Photographs
// and subsequent comparison groups remain in their authored columns/order.
export function withReadingLanguages(nodes, config) {
  if (!config) return nodes;
  const published = publicationNodes(nodes);
  const translationAt = published.findIndex(node => node.type === 'toggle'
    && text(node.text).toLowerCase() === config.translation.source.toLowerCase());
  const originalAt = published.findIndex(node => node.type === 'columns'
    && node.columns.some(column => column.children.some(child => child.type === 'paragraph')
      && !column.children.some(child => ['image', 'video'].includes(child.type))));
  if (translationAt < 0 || originalAt < 0) throw new Error('Bilingual article requires its original prose column and translated Notion section.');
  const original = published[originalAt];
  const proseAt = original.columns.findIndex(column => column.children.some(child => child.type === 'paragraph')
    && !column.children.some(child => ['image', 'video'].includes(child.type)));
  const translated = published[translationAt].children.filter((node, index) => !(index === 0
    && node.type === 'heading' && /^\(?Translation:/i.test(text(node.text))));
  if (!translated.length) throw new Error('Bilingual article translation is empty.');
  const pair = {
    type: 'language-pair',
    children: [
      { ...config.original, children: original.columns[proseAt].children },
      { ...config.translation, children: translated }
    ]
  };
  return published.flatMap((node, index) => index === translationAt ? [] : [index === originalAt
    ? { ...original, columns: original.columns.map((column, at) => at === proseAt ? { ...column, children: [pair] } : column) }
    : node]);
}
