import mammoth from 'mammoth';
import { validateDocxArchive } from './validateDocx';

self.onmessage = async (event: MessageEvent<ArrayBuffer>) => {
  try {
    validateDocxArchive(event.data);
    const warnings: string[] = [];
    const result = await mammoth.convertToHtml({ arrayBuffer: event.data }, {
      externalFileAccess: false, includeEmbeddedStyleMap: false,
      styleMap: ['u => u', 'strike => s', "p[style-name='Title'] => h1:fresh"],
      convertImage: mammoth.images.imgElement(async image => {
        if (!/^image\/(png|jpeg|gif|webp)$/.test(image.contentType)) {
          warnings.push(`An image in ${image.contentType} format could not be imported. Convert it to PNG or JPEG in Word.`);
          return { src: '' };
        }
        return { src: `data:${image.contentType};base64,${await image.readAsBase64String()}` };
      }),
    });
    self.postMessage({ html: result.value, warnings: [...warnings, ...result.messages.map(message => message.message)] });
  } catch (error) { self.postMessage({ error: error instanceof Error ? error.message : 'Word conversion failed.' }); }
};
