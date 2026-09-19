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

function patch(path: string, body: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 4000,
      path,
      method: 'PATCH',
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

async function runMoveDepartmentTest() {
  console.log('\n========================================================');
  console.log('🔄 TESTING DEPARTMENT MOVE & REORGANIZATION DROPDOWN');
  console.log('========================================================\n');

  // 1. Initial State
  const initial = await get('/api/admin/hierarchy');
  const queuePage = initial.data.find((m: any) => m.id === 'doctor_queue');
  console.log('1. Initial doctor_queue department:', queuePage?.category);

  // 2. User changes dropdown to RECEPTION (Front-Desk)
  console.log('\n2. Moving doctor_queue from Clinical to Front-Desk (RECEPTION)...');
  const patchRes = await patch('/api/admin/hierarchy/move-page', {
    pageId: 'doctor_queue',
    targetCategory: 'RECEPTION',
  });
  console.log('  PATCH Response:', patchRes.status, '-', patchRes.message);

  if (patchRes.status !== 'SUCCESS') {
    console.error('❌ FAILED: movePageModule did not return SUCCESS');
    process.exit(1);
  }

  // 3. Simulate browser refresh / re-query
  console.log('\n3. Simulating page refresh (GET /api/admin/hierarchy)...');
  const refreshed = await get('/api/admin/hierarchy');
  const refreshedQueue = refreshed.data.find((m: any) => m.id === 'doctor_queue');
  console.log('  After refresh department:', refreshedQueue?.category);

  if (refreshedQueue?.category !== 'RECEPTION') {
    console.error(`❌ FAILED: Expected RECEPTION, got ${refreshedQueue?.category}`);
    process.exit(1);
  }
  console.log('✅ PASS: Module relocated to Front-Desk and persisted across reload!');

  // 4. Restore back to CLINICAL
  console.log('\n4. Restoring doctor_queue back to CLINICAL...');
  await patch('/api/admin/hierarchy/move-page', {
    pageId: 'doctor_queue',
    targetCategory: 'CLINICAL',
  });
  const restored = await get('/api/admin/hierarchy');
  const restoredQueue = restored.data.find((m: any) => m.id === 'doctor_queue');
  console.log('  Restored department:', restoredQueue?.category);

  if (restoredQueue?.category !== 'CLINICAL') {
    console.error('❌ FAILED: Could not restore to CLINICAL');
    process.exit(1);
  }
  console.log('✅ PASS: Successfully restored to CLINICAL!');

  console.log('\n========================================================');
  console.log('🎉 ALL TESTS PASSED: Department dropdown is fully operational!');
  console.log('========================================================\n');
}

runMoveDepartmentTest().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
