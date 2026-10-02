import fs from 'node:fs';

/** Unit fixtures use the original local artwork instead of a browser canvas crop. */
export function embedFooterFixture(pages) {
  const src = `data:image/png;base64,${fs.readFileSync(new URL('../../public/assets/brand/nex-maxx-logo.png', import.meta.url)).toString('base64')}`;
  for (const page of pages) for (const node of page.footer?.nodes || []) if (node.kind === 'image') node.src = src;
  return pages;
}
