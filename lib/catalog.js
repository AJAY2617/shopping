import { get, put, BlobPreconditionFailedError } from '@vercel/blob';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
const pathname='leo-shopping/catalog.json';
export function validateProducts(value){
 if(!Array.isArray(value)||value.length>200)throw new Error('The catalog can contain up to 200 products.');
 const ids=new Set();
 return value.map(p=>{
  if(!p||typeof p!=='object')throw new Error('Invalid product.');
  const text=(key,max,required=true)=>{if(typeof p[key]!=='string'||p[key].length>max||(required&&!p[key].trim()))throw new Error(`Invalid ${key}.`);return p[key].trim();};
  const id=text('id',80);if(!/^[a-z0-9-]+$/.test(id)||ids.has(id))throw new Error('Product IDs must be unique lowercase letters, numbers and hyphens.');ids.add(id);
  const category=text('category',50);if(!['Mobiles','Electronics','Fashion','Home & Living'].includes(category))throw new Error('Choose a valid category.');
  for(const key of ['price','mrp'])if(!Number.isSafeInteger(p[key])||p[key]<1||p[key]>10000000)throw new Error('Prices must be whole rupees between 1 and 10,000,000.');
  if(p.mrp<p.price)throw new Error('Original price cannot be lower than selling price.');
  if(typeof p.rating!=='number'||p.rating<0||p.rating>5||!Number.isFinite(p.rating)||!Number.isSafeInteger(p.reviews)||p.reviews<0)throw new Error('Invalid sample rating.');
  const image=text('image',1500);if(!/^[a-zA-Z0-9_-]+\.(jpg|jpeg|png|webp)$/.test(image)){try{const url=new URL(image);if(url.protocol!=='https:'||url.username||url.password)throw new Error();}catch{throw new Error('Image must be an existing asset filename or an HTTPS image URL.');}}
  if(!Array.isArray(p.specs)||p.specs.length>10||p.specs.some(s=>typeof s!=='string'||s.length>180))throw new Error('Use up to 10 short specifications.');
  if(typeof p.active!=='boolean')throw new Error('Invalid visibility setting.');
  return{id,name:text('name',120),category,price:p.price,mrp:p.mrp,rating:p.rating,reviews:p.reviews,tag:text('tag',40,false),image,description:text('description',1200),specs:p.specs.map(s=>s.trim()),active:p.active};
 });
}
function localPath(){return process.env.LOCAL_DATA_DIR&&!process.env.VERCEL?path.join(process.env.LOCAL_DATA_DIR,'catalog.json'):null;}
export async function readCatalog(){
 const local=localPath();
 if(local){let text;try{text=await readFile(local,'utf8');}catch(e){if(e.code!=='ENOENT')throw e;text=await readFile(new URL('../dist/catalog.json',import.meta.url),'utf8');}return{products:JSON.parse(text),revision:createHash('sha256').update(text).digest('hex')};}
 if(!process.env.BLOB_READ_WRITE_TOKEN&&!process.env.BLOB_STORE_ID)throw Object.assign(new Error('Catalog storage is not configured.'),{status:503});
 const result=await get(pathname,{access:'private',useCache:false});
 if(!result)throw Object.assign(new Error('Catalog has not been initialized.'),{status:503});
 // Private downloads may use a weak HTTP ETag for transfer encoding;
 // conditional Blob writes require the strong storage ETag.
 return{products:await new Response(result.stream).json(),revision:result.blob.etag.replace(/^W\//,'')};
}
export async function writeCatalog(products,revision){
 const local=localPath();const text=JSON.stringify(products);
 if(local){const current=await readCatalog();if(current.revision!==revision)throw Object.assign(new Error('Catalog changed. Reload before saving.'),{status:409});await mkdir(path.dirname(local),{recursive:true});await writeFile(local,text);return;}
 try{await put(pathname,text,{access:'private',contentType:'application/json',addRandomSuffix:false,allowOverwrite:true,ifMatch:revision});}catch(e){if(e instanceof BlobPreconditionFailedError)throw Object.assign(new Error('Catalog changed. Reload before saving.'),{status:409});throw e;}
}
