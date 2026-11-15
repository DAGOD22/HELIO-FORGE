// Storage may be blocked or contain invalid/older values. The explorer should
// still open; favourites then last for the current session only.
export function readFavorites(storage){
 try{const value=JSON.parse(storage.getItem('cosmos-favorites')||'[]');return Array.isArray(value)?[...new Set(value.filter(id=>typeof id==='string'))]:[]}catch{return []}
}
export function saveFavorites(storage,ids){try{storage.setItem('cosmos-favorites',JSON.stringify(ids));return true}catch{return false}}
