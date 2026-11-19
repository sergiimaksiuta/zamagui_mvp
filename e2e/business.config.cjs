const {defineConfig,devices}=require('@playwright/test');
module.exports=defineConfig({
 testDir:__dirname,
 testMatch:'**/business-consistency.spec.cjs',
 timeout:30000,
 workers:2,
 reporter:'line',
 use:{...devices['Desktop Chrome'],baseURL:'http://127.0.0.1:4174',screenshot:'only-on-failure',trace:'retain-on-failure'}
});
