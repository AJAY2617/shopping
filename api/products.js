import { authenticated, sameOrigin, respond, readBody } from '../lib/auth.js';
import { readCatalog, writeCatalog, validateProducts } from '../lib/catalog.js';
export default async function handler(req,res){
 try{
  const admin=new URL(req.url,'http://local').searchParams.get('admin')==='1';
  if(req.method==='GET'){
   if(admin&&!authenticated(req))return respond(res,401,{error:'Please sign in.'});
   const catalog=await readCatalog();return respond(res,200,admin?catalog:{products:catalog.products.filter(p=>p.active)});
  }
  if(req.method!=='PUT'){res.setHeader('Allow','GET, PUT');return respond(res,405,{error:'Method not allowed.'});}
  if(!authenticated(req))return respond(res,401,{error:'Please sign in.'});
  if(!sameOrigin(req))return respond(res,403,{error:'Request origin is not allowed.'});
  const body=await readBody(req);if(typeof body.revision!=='string'||!body.revision)return respond(res,400,{error:'Catalog revision is required.'});
  let products;try{products=validateProducts(body.products);}catch(e){return respond(res,400,{error:e.message});}
  await writeCatalog(products,body.revision);return respond(res,200,await readCatalog());
 }catch(e){return respond(res,e.status||503,{error:e.status?e.message:'Could not access the catalog. Please try again.'});}
}
