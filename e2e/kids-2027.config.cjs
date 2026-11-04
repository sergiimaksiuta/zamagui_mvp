const {defineConfig,devices}=require('@playwright/test');
module.exports=defineConfig({
 testDir:__dirname,testMatch:'**/kids-2027.spec.cjs',
 timeout:30000,workers:2,retries:0,reporter:'line',
 use:{...devices['Desktop Chrome'],baseURL:'http://127.0.0.1:4179',screenshot:'only-on-failure',trace:'retain-on-failure'}
});
