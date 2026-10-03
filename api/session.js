import { configured, checkPassword, authenticated, sessionCookie, sameOrigin, respond, readBody } from '../lib/auth.js';
export default async function handler(req,res){
 try{
  if(req.method==='GET')return respond(res,200,{authenticated:authenticated(req),configured:configured()});
  if(!['POST','DELETE'].includes(req.method)){res.setHeader('Allow','GET, POST, DELETE');return respond(res,405,{error:'Method not allowed.'});}
  if(!sameOrigin(req))return respond(res,403,{error:'Request origin is not allowed.'});
  if(!configured())return respond(res,503,{error:'Admin access has not been configured.'});
  if(req.method==='DELETE'){res.setHeader('Set-Cookie',sessionCookie(true));return respond(res,200,{authenticated:false});}
  const body=await readBody(req);if(!checkPassword(body.password))return respond(res,401,{error:'Incorrect admin password.'});
  res.setHeader('Set-Cookie',sessionCookie());return respond(res,200,{authenticated:true});
 }catch(e){return respond(res,e.status||500,{error:e.status?e.message:'Could not sign in. Please try again.'});}
}
