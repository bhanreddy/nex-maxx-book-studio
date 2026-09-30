export async function readPublicationImage(file:File):Promise<{src:string;rawWidthPx:number;rawHeightPx:number}> {
  if(!["image/png","image/jpeg","image/webp"].includes(file.type))throw new Error("Choose a PNG, JPEG or WebP image.");
  if(file.size>3*1024*1024)throw new Error("This local editor stores images in browser storage. Choose a file below 3 MB, or use vector artwork.");
  const src=await new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=()=>reject(new Error("Could not read this image."));reader.readAsDataURL(file);});
  const dimensions=await new Promise<{rawWidthPx:number;rawHeightPx:number}>((resolve,reject)=>{const image=new Image();image.onload=()=>resolve({rawWidthPx:image.naturalWidth,rawHeightPx:image.naturalHeight});image.onerror=()=>reject(new Error("Could not decode this image."));image.src=src;});
  return {src,...dimensions};
}
