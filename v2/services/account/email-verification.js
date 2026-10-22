const crypto = require('node:crypto');
const {spawn} = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');
function smtpConfigured(){return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD && process.env.MAIL_SENDER_EMAIL);}
function sendEmail(email,code){
 if(!smtpConfigured())return Promise.reject(new Error('MAIL_NOT_CONFIGURED'));
 return new Promise((resolve,reject)=>{
  const child=spawn(process.env.PYTHON_BIN||(process.platform==='win32'?'python':'python3'),[path.join(__dirname,'send-verification.py')],{stdio:['pipe','ignore','ignore'],windowsHide:true});
  const timer=setTimeout(()=>{child.kill();reject(new Error('MAIL_SEND_FAILED'));},25000);
  child.once('error',()=>{clearTimeout(timer);reject(new Error('MAIL_SEND_FAILED'));});
  child.once('exit',code=>{clearTimeout(timer);code===0?resolve():reject(new Error('MAIL_SEND_FAILED'));});
  child.stdin.on('error',()=>{});child.stdin.end(JSON.stringify({email,code}));
 });
}
function createVerification({send=sendEmail,clock=Date.now,randomCode=()=>String(crypto.randomInt(100000,1000000)),storeFile}={}){
 const entries=new Map(),limits=new Map();
 if(storeFile&&fs.existsSync(storeFile)){
  const saved=JSON.parse(fs.readFileSync(storeFile,'utf8'));
  for(const [email,row] of saved.entries||[])if(Math.min(row.expires,row.sentAt+300000)>clock())entries.set(email,{...row,expires:Math.min(row.expires,row.sentAt+300000),hash:Buffer.from(row.hash,'hex')});
  for(const [key,row] of saved.limits||[])if(clock()-row.start<3600000)limits.set(key,row);
 }
 function save(){if(!storeFile)return;const temporary=storeFile+'.tmp';fs.writeFileSync(temporary,JSON.stringify({entries:[...entries].map(([email,row])=>[email,{...row,hash:row.hash.toString('hex')}]),limits:[...limits]}),{mode:0o600});fs.renameSync(temporary,storeFile);}
 const digest=(salt,code)=>crypto.createHash('sha256').update(salt+'|'+code).digest();
 function check(email,code){
  const row=entries.get(email);
  if(!row)return {ok:false,reason:'EMAIL_CODE_MISSING'};
  if(row.expires<=clock())return {ok:false,reason:'EMAIL_CODE_EXPIRED'};
  if(row.attempts>=5)return {ok:false,reason:'EMAIL_CODE_LOCKED'};
  const value=String(code||'').trim();
  if(!/^\d{6}$/.test(value))return {ok:false,reason:'EMAIL_CODE_FORMAT'};
  row.attempts++;save();
  return crypto.timingSafeEqual(row.hash,digest(row.salt,value))?{ok:true}:{ok:false,reason:row.attempts>=5?'EMAIL_CODE_LOCKED':'EMAIL_CODE_MISMATCH'};
 }
 function quota(key,max){const now=clock();let q=limits.get(key);if(!q||now-q.start>=3600000)q={start:now,count:0};if(q.count>=max)throw Error('CODE_RATE_LIMITED');q.count++;limits.set(key,q);}
 return {
  async issue(email,ip){
   const now=clock();for(const [k,v] of entries)if(v.expires<=now)entries.delete(k);for(const [k,v] of limits)if(now-v.start>=3600000)limits.delete(k);
   if(entries.get(email)?.sentAt>now-60000)throw Error('CODE_COOLDOWN');
   quota('email:'+email,5);quota('ip:'+ip,20);save();
   const code=randomCode(),salt=crypto.randomBytes(16).toString('hex');
   await send(email,code);const delivered=clock();entries.set(email,{salt,hash:digest(salt,code),expires:delivered+300000,sentAt:delivered,attempts:0});save();
  },
  check,
  valid(email,code){return check(email,code).ok;},
  consume(email){entries.delete(email);save();}
 };
}
module.exports={createVerification,smtpConfigured};
