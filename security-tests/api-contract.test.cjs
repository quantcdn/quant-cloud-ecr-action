const {test} = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const {spawn} = require('node:child_process');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const kind = 'ecr';
for (const suffix of ['', '/api/v3/']) {
  test(`bundled ${kind} action preserves API contract with base URL ${suffix || '/'}`, async () => {
    const temp = await fs.mkdtemp(path.join(os.tmpdir(), 'quant-action-contract-'));
    const requests = [];
    const server = http.createServer(async (req,res) => {
      let body='';for await (const chunk of req)body+=chunk;
      requests.push({method:req.method,url:req.url,authorization:req.headers.authorization,body});
      res.setHeader('Content-Type','application/json');
      res.end(JSON.stringify(kind==='create' ? {appName:'security-fixture'} : {username:'AWS',password:'fake-registry-password',endpoint:'https://registry.example.test'}));
    });
    await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
    try {
      await fs.copyFile(path.join(__dirname,'../dist/index.js'),path.join(temp,'action.cjs'));
      const output=path.join(temp,'output');await fs.writeFile(output,'');
      const env={...process.env,GITHUB_OUTPUT:output,INPUT_API_KEY:'fake-api-key',INPUT_ORGANIZATION:'fixture-org',INPUT_BASE_URL:`http://127.0.0.1:${server.address().port}${suffix}`,INPUT_APP_NAME:'security-fixture',INPUT_COMPOSE_SPEC:JSON.stringify({containers:[]})};
      const result=await new Promise((resolve,reject)=>{
        const child=spawn(process.execPath,[path.join(temp,'action.cjs')],{cwd:temp,env});let stdout='',stderr='';
        child.stdout.on('data',x=>stdout+=x);child.stderr.on('data',x=>stderr+=x);child.on('error',reject);
        const timer=setTimeout(()=>{child.kill();reject(new Error('Action timed out'));},20000);
        child.on('close',code=>{clearTimeout(timer);resolve({code,stdout,stderr});});
      });
      assert.equal(result.code,0,result.stderr+'\n'+result.stdout);
      assert.equal(requests.length,1);
      assert.equal(requests[0].authorization,'Bearer fake-api-key');
      assert.equal(requests[0].url,kind==='create'?'/api/v3/organizations/fixture-org/applications':'/api/v3/organizations/fixture-org/applications/ecr-login');
      assert.equal(requests[0].method,kind==='create'?'POST':'GET');
      const data=await fs.readFile(output,'utf8');
      if(kind==='create'){
        assert.deepEqual(JSON.parse(requests[0].body),{appName:'security-fixture',composeDefinition:{containers:[]}});
        assert.match(data,/app_name<<[^\n]+\nsecurity-fixture\n/);
      }else{
        assert.match(data,/username<<[^\n]+\nAWS\n/);assert.match(data,/password<<[^\n]+\nfake-registry-password\n/);
        assert.match(result.stdout,/::add-mask::fake-registry-password/);
      }
    }finally{await new Promise(resolve=>server.close(resolve));await fs.rm(temp,{recursive:true,force:true});}
  });
}
