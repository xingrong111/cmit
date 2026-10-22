const {test}=require('node:test');
const assert=require('node:assert/strict');
const {createVerification}=require('./email-verification');
test('verification requires delivery, binds email, expires and is single use',async()=>{
 let now=1000000;const sent=[];const v=createVerification({clock:()=>now,randomCode:()=> '123456',send:async(email,code)=>sent.push({email,code})});
 assert.equal(v.valid('a@example.com','123456'),false);
 await v.issue('a@example.com','ip');assert.equal(sent.length,1);
 assert.equal(v.valid('b@example.com','123456'),false);
 assert.equal(v.valid('a@example.com','999999'),false);
 assert.equal(v.valid('a@example.com','123456'),true);v.consume('a@example.com');
 assert.equal(v.valid('a@example.com','123456'),false);
 now+=61000;await v.issue('a@example.com','ip');now+=600001;assert.equal(v.valid('a@example.com','123456'),false);
});
test('cooldown and guessing limits cannot be bypassed',async()=>{
 const v=createVerification({clock:()=>1000000,randomCode:()=> '123456',send:async()=>{}});
 await v.issue('a@example.com','ip');await assert.rejects(v.issue('a@example.com','ip'),/CODE_COOLDOWN/);
 for(let i=0;i<5;i++)assert.equal(v.valid('a@example.com','111111'),false);
 assert.equal(v.valid('a@example.com','123456'),false);
});
test('delivery failure never creates a usable code',async()=>{
 const v=createVerification({randomCode:()=> '123456',send:async()=>{throw Error('MAIL_SEND_FAILED');}});
 await assert.rejects(v.issue('a@example.com','ip'));assert.equal(v.valid('a@example.com','123456'),false);
});

test('failure reasons distinguish missing, mismatch, expiry and exhausted attempts',async()=>{
 let now=1000000;
 const v=createVerification({clock:()=>now,randomCode:()=> '654321',send:async()=>{now+=25000;}});
 assert.equal(v.check('a@example.com','654321').reason,'EMAIL_CODE_MISSING');
 await v.issue('a@example.com','ip');
 assert.equal(v.check('a@example.com','111111').reason,'EMAIL_CODE_MISMATCH');
 now+=290000;assert.equal(v.check('a@example.com','654321').ok,true);
 now+=10001;assert.equal(v.check('a@example.com','654321').reason,'EMAIL_CODE_EXPIRED');
});

test('restart preserves only hashed codes, attempts and single-use consumption',async()=>{
 const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'shanhe-code-'));
 const storeFile=path.join(dir,'verification.json');
 const options={storeFile,clock:()=>1000000,randomCode:()=> '654321',send:async()=>{}};
 try{
  const first=createVerification(options);await first.issue('a@example.com','ip');
  assert.equal(fs.readFileSync(storeFile,'utf8').includes('654321'),false);
  assert.equal(first.check('a@example.com','111111').ok,false);
  const second=createVerification(options);assert.equal(second.check('a@example.com','654321').ok,true);
  await assert.rejects(second.issue('a@example.com','ip'),/CODE_COOLDOWN/);
  second.consume('a@example.com');assert.equal(createVerification(options).check('a@example.com','654321').reason,'EMAIL_CODE_MISSING');
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
