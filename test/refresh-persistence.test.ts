import http from 'http';

function get(path: string): Promise<any> {
  return new Promise((resolve, reject) => {
    http.get({ hostname: 'localhost', port: 4000, path }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });
}

function put(path: string, body: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 4000,
      path,
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' }
    }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => resolve(JSON.parse(data)));
    });
    req.on('error', reject);
    req.write(JSON.stringify(body));
    req.end();
  });
}

async function runRefreshTest() {
  console.log('\n========================================================');
  console.log('🔄 TESTING PERMISSION TOGGLE PERSISTENCE ACROSS REFRESH');
  console.log('========================================================\n');

  // 1. Initial State
  const initial = await get('/api/admin/role-permissions');
  const docInit = initial.data.roles.find((r: any) => r.role === 'DOCTOR');
  const initTokensRule = docInit.permissions.find((p: any) => p.moduleId === 'doctor_tokens');
  console.log('1. Initial doctor_tokens state: read =', initTokensRule?.read);

  // 2. Turn toggle OFF (read: false)
  console.log('\n2. User clicks toggle to turn OFF doctor_tokens read permission...');
  const updatedPerms = docInit.permissions.map((p: any) => {
    if (p.moduleId === 'doctor_tokens') return { ...p, read: false, write: false, delete: false };
    return p;
  });
  await put('/api/admin/role-permissions/DOCTOR', { permissions: updatedPerms });

  // 3. Simulate browser REFRESH (GET /api/admin/role-permissions freshly from server)
  console.log('\n3. Simulating page REFRESH (fetching fresh data from server)...');
  const afterRefresh = await get('/api/admin/role-permissions');
  const docAfterRefresh = afterRefresh.data.roles.find((r: any) => r.role === 'DOCTOR');
  const refreshedTokensRule = docAfterRefresh.permissions.find((p: any) => p.moduleId === 'doctor_tokens');
  console.log('  State after refresh: read =', refreshedTokensRule?.read);

  if (refreshedTokensRule?.read !== false) {
    console.error('❌ FAILED: doctor_tokens was re-enabled after refresh!');
    process.exit(1);
  }
  console.log('  ✅ SUCCESS: doctor_tokens is STILL OFF after page refresh!');

  // 4. Restore toggle ON (read: true)
  console.log('\n4. Restoring toggle ON (read: true)...');
  const restoredPerms = docInit.permissions.map((p: any) => {
    if (p.moduleId === 'doctor_tokens') return { ...p, read: true, write: true, delete: false };
    return p;
  });
  await put('/api/admin/role-permissions/DOCTOR', { permissions: restoredPerms });

  const finalRefresh = await get('/api/admin/role-permissions');
  const docFinal = finalRefresh.data.roles.find((r: any) => r.role === 'DOCTOR');
  const finalTokensRule = docFinal.permissions.find((p: any) => p.moduleId === 'doctor_tokens');
  console.log('  Final state after restore and refresh: read =', finalTokensRule?.read);

  if (finalTokensRule?.read !== true) {
    console.error('❌ FAILED: doctor_tokens was not restored!');
    process.exit(1);
  }
  console.log('  ✅ SUCCESS: doctor_tokens is correctly restored and stays ON across refresh!');

  console.log('\n========================================================');
  console.log('🎉 REFRESH PERSISTENCE TEST PASSED PERFECTLY!');
  console.log('========================================================\n');
}

runRefreshTest().catch(err => {
  console.error('Fatal refresh test error:', err);
  process.exit(1);
});
