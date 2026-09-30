export const PRINT_FONTS:Record<string,string>={
  'Noto Sans':'notosans.ttf','Noto Serif':'notoserif.ttf','Noto Sans Telugu':'notosanstelugu.ttf','Noto Sans Devanagari':'notosansdevanagari.ttf',
  Inter:'inter.ttf',Outfit:'outfit.ttf','EB Garamond':'ebgaramond.ttf',Fraunces:'fraunces.ttf','IBM Plex Sans':'ibmplexsans.ttf',
  'Libre Baskerville':'librebaskerville.ttf','Libre Franklin':'librefranklin.ttf',Nunito:'nunito.ttf','Source Sans 3':'sourcesans3.ttf',Merriweather:'merriweather.ttf',
};
export function printFont(text:string,family?:string,serif=false){
  if(/[\u0c00-\u0c7f]/u.test(text))return 'Noto Sans Telugu';
  if(/[\u0900-\u097f]/u.test(text))return 'Noto Sans Devanagari';
  const name=(family||'').split(',')[0].trim().replaceAll(/['"]/g,'');
  if(!name)return serif?'Noto Serif':'Noto Sans';
  if(PRINT_FONTS[name])return name;
  if(['Arial','Helvetica','sans-serif'].includes(name))return 'Noto Sans';
  if(['Georgia','Times New Roman','serif'].includes(name))return 'Noto Serif';
  throw new Error(`Print font “${name}” is not bundled. Choose a supported font before export.`);
}
