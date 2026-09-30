export interface AssetPin {assetId:string;revision:number;checksum:string}
export function assetRenderUrl(pin:AssetPin){
  return `/api/curriculum/assets/${encodeURIComponent(pin.assetId)}/revisions/${pin.revision}/render?checksum=${encodeURIComponent(pin.checksum)}`;
}
