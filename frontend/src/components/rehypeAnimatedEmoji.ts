import { SKIP, visit } from 'unist-util-visit';
import type { Root, Element, ElementContent } from 'hast';
import { EMOJI_REGEX } from './AnimatedEmoji';

const SKIP_TAGS = new Set([
  'pre',
  'code',
  'kbd',
  'script',
  'style',
  'textarea',
  'input',
]);

/**
 * Plugin Rehype qui intercepte les émojis dans les nœuds de texte Markdown
 * et les transforme en `<span className="animated-emoji-host" data-emoji="🔥"></span>`.
 * Le composant Markdown interceptera ce span pour afficher l'émoji animé avec fallback.
 * Ignore automatiquement les blocs de code et évite toute récursion infinie.
 */
export function rehypeAnimatedEmoji() {
  return (tree: Root) => {
    visit(tree, 'element', (node: Element) => {
      // Évite de retraiter nos propres spans d'émojis ou les balises réservées
      if (
        SKIP_TAGS.has(node.tagName) ||
        node.properties?.['data-emoji'] ||
        node.properties?.['dataEmoji']
      ) {
        return SKIP;
      }

      // Vérifie rapidement si au moins un enfant direct contient un émoji
      const hasEmoji = node.children.some(
        (c) => c.type === 'text' && EMOJI_REGEX.test(c.value),
      );
      if (!hasEmoji) return;

      const newChildren: ElementContent[] = [];

      for (const child of node.children) {
        if (child.type === 'text' && EMOJI_REGEX.test(child.value)) {
          const parts = child.value.split(EMOJI_REGEX);
          for (const part of parts) {
            if (!part) continue;
            if (EMOJI_REGEX.test(part)) {
              newChildren.push({
                type: 'element',
                tagName: 'span',
                properties: {
                  className: ['animated-emoji-host'],
                  'data-emoji': part,
                },
                children: [], // Enfants vides : empêche toute récursion de `visit`
              });
            } else {
              newChildren.push({
                type: 'text',
                value: part,
              });
            }
          }
        } else {
          newChildren.push(child);
        }
      }

      node.children = newChildren;
      return SKIP; // Ne pas ré-analyser récursivement les enfants nouvellement insérés
    });
  };
}
