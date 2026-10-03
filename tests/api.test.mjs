import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import session from '../api/session.js';
import products from '../api/products.js';
import { validateProducts } from '../lib/catalog.js';
process.env.ADMIN_PASSWORD='test-password-with-enough-entropy';
process.env.SESSION_SECRET='test-secret-that-is-at-least-thirty-two-characters';
delete process.env.VERCEL;
async function invoke(handler,{method='GET',url='/',body,cookie,origin='http://store.test'}={}){const headers={host:'store.test',origin,'content-type':'application/json',cookie};const values={};let result;const res={setHeader(k,v){values[k.toLowerCase()]=v;},end(text){result=JSON.parse(text);},statusCode:200};await handler({method,url,body,headers},res);return{status:res.statusCode,headers:values,body:result};}
test('admin session and catalog authorization, validation and persistence',async()=>{
 const directory=await mkdtemp(path.join(tmpdir(),'leo-tests-'));process.env.LOCAL_DATA_DIR=directory;
 try{
  assert.equal((await invoke(products,{url:'/api/products?admin=1'})).status,401);
  assert.equal((await invoke(session,{method:'POST',body:{password:'wrong'}})).status,401);
  assert.equal((await invoke(session,{method:'POST',body:{password:process.env.ADMIN_PASSWORD},origin:'https://attacker.test'})).status,403);
  const login=await invoke(session,{method:'POST',body:{password:process.env.ADMIN_PASSWORD}});assert.equal(login.status,200);assert.match(login.headers['set-cookie'],/HttpOnly; SameSite=Strict/);const cookie=login.headers['set-cookie'].split(';')[0];
  assert.equal((await invoke(session,{cookie})).body.authenticated,true);
  assert.equal((await invoke(session,{cookie:cookie+'tampered'})).body.authenticated,false);
  const initial=await invoke(products,{url:'/api/products?admin=1',cookie});assert.equal(initial.body.products.length,8);
  const catalog=initial.body.products.map((p,i)=>i===0?{...p,active:false,name:'Safe <img src=x onerror=alert(1)> name'}:p);
  assert.equal((await invoke(products,{method:'PUT',body:{products:catalog,revision:initial.body.revision}})).status,401);
  assert.equal((await invoke(products,{method:'PUT',cookie,origin:'https://attacker.test',body:{products:catalog,revision:initial.body.revision}})).status,403);
  const saved=await invoke(products,{method:'PUT',cookie,body:{products:catalog,revision:initial.body.revision}});assert.equal(saved.status,200);assert.equal(JSON.parse(await readFile(path.join(directory,'catalog.json')))[0].active,false);
  assert.equal((await invoke(products)).body.products.length,7);
  assert.equal((await invoke(products,{method:'PUT',cookie,body:{products:catalog,revision:initial.body.revision}})).status,409);
  assert.equal((await invoke(products,{method:'PUT',cookie,body:{products:[{...catalog[0],image:'javascript:alert(1)'}],revision:saved.body.revision}})).status,400);
  assert.throws(()=>validateProducts([{...catalog[0],price:-1}]));
  const oldPassword=process.env.ADMIN_PASSWORD;process.env.ADMIN_PASSWORD='rotated-password-with-enough-entropy';assert.equal((await invoke(session,{cookie})).body.authenticated,false);process.env.ADMIN_PASSWORD=oldPassword;
  assert.equal((await invoke(session,{method:'DELETE',cookie})).headers['set-cookie'].includes('Max-Age=0'),true);
 }finally{await rm(directory,{recursive:true,force:true});delete process.env.LOCAL_DATA_DIR;}
});
