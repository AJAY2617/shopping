import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import session from '../api/session.js';
import products from '../api/products.js';
process.env.LOCAL_DATA_DIR ||= path.resolve('.local-data');
const root=path.resolve('dist');
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.jpg':'image/jpeg'};
const server=http.createServer(async(req,res)=>{
 const pathname=new URL(req.url,'http://local').pathname;
 if(pathname==='/api/session')return session(req,res);if(pathname==='/api/products')return products(req,res);
 const location=pathname==='/'?'index.html':pathname==='/admin'?'admin.html':decodeURIComponent(pathname.slice(1));
 const filename=path.resolve(root,location);if(!filename.startsWith(root+path.sep)){res.writeHead(403);return res.end();}
 try{const data=await readFile(filename);res.writeHead(200,{'Content-Type':mime[path.extname(filename)]||'application/octet-stream'});res.end(data);}catch{res.writeHead(404);res.end('Not found');}
});
server.listen(Number(process.env.PORT)||4173,'127.0.0.1',()=>console.log(`Leo Shopping: http://127.0.0.1:${server.address().port}`));
