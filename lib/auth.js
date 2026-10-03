import { createHmac, createHash, timingSafeEqual } from 'node:crypto';
const cookieName = () => process.env.VERCEL ? '__Host-leo-admin' : 'leo-admin';
function equal(a,b){const left=Buffer.from(a||'');const right=Buffer.from(b||'');return left.length===right.length&&timingSafeEqual(left,right);}
function signature(value){return createHmac('sha256',process.env.SESSION_SECRET).update(value).digest('base64url');}
function passwordVersion(){return createHash('sha256').update(process.env.ADMIN_PASSWORD).digest('hex').slice(0,16);}
export function configured(){return Boolean(process.env.ADMIN_PASSWORD?.length>=16&&process.env.SESSION_SECRET?.length>=32);}
export function checkPassword(value){return typeof value==='string'&&configured()&&equal(value,process.env.ADMIN_PASSWORD);}
export function authenticated(req){
 if(!configured())return false;
 const cookie=(req.headers.cookie||'').split(';').map(v=>v.trim()).find(v=>v.startsWith(`${cookieName()}=`));
 if(!cookie)return false;const value=cookie.slice(cookie.indexOf('=')+1);const parts=value.split('.');
 if(parts.length!==2||!equal(signature(parts[0]),parts[1]))return false;
 try{const payload=JSON.parse(Buffer.from(parts[0],'base64url').toString());return payload.role==='admin'&&payload.exp>Date.now()&&payload.pv===passwordVersion();}catch{return false;}
}
export function sessionCookie(clear=false){
 const payload=Buffer.from(JSON.stringify({role:'admin',exp:Date.now()+8*60*60*1000,pv:passwordVersion()})).toString('base64url');
 return `${cookieName()}=${clear?'':`${payload}.${signature(payload)}`}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${clear?0:28800}${process.env.VERCEL?'; Secure':''}`;
}
export function sameOrigin(req){try{return new URL(req.headers.origin).host===req.headers.host;}catch{return false;}}
export function respond(res,status,data){res.setHeader('Cache-Control','no-store');res.setHeader('Content-Type','application/json');res.statusCode=status;res.end(JSON.stringify(data));}
export async function readBody(req){
 if(!String(req.headers['content-type']||'').startsWith('application/json'))throw Object.assign(new Error('JSON body required.'),{status:415});
 if(req.body!==undefined){const body=typeof req.body==='string'?JSON.parse(req.body):req.body;if(Buffer.byteLength(JSON.stringify(body))>250000)throw Object.assign(new Error('Request too large.'),{status:413});return body;}
 let text='';for await(const part of req){text+=part;if(Buffer.byteLength(text)>250000)throw Object.assign(new Error('Request too large.'),{status:413});}try{return JSON.parse(text);}catch{throw Object.assign(new Error('Invalid JSON.'),{status:400});}
}
