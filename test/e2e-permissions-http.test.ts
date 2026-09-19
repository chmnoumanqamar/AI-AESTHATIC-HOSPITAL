import http from 'http';

function request(options: http.RequestOptions, body?: any): Promise<{ status: number; body: any }> {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode || 500, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode || 500, body: data });
        }
      });
    });
    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runE2eHttpTest() {
  console.log('\n========================================================');
  console.log('🌐 RUNNING LIVE HTTP E2E PERMISSIONS TOGGLE VERIFICATION');
  console.log('========================================================\n');

  // 1. Login as Admin
  console.log('1. Logging in as Admin (admin@hospital.com)...');
  const loginRes = await request({
    hostname: 'localhost',
    port: 4000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { identifier: 'admin@hospital.com', password: 'Password123!' });

  if (loginRes.status !== 200 || !loginRes.body.data?.token) {
    throw new Error(`Admin login failed: ${JSON.stringify(loginRes.body)}`);
  }
  const adminToken = loginRes.body.data.token;
  console.log('  ✅ Admin logged in successfully');

  // 2. Fetch current role permissions
  console.log('\n2. Fetching role permissions via GET /api/admin/role-permissions...');
  const permsRes = await request({
    hostname: 'localhost',
    port: 4000,
    path: '/api/admin/role-permissions',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });

  if (permsRes.status !== 200) {
    throw new Error(`Failed to fetch role permissions: ${JSON.stringify(permsRes.body)}`);
  }
  const doctorRole = permsRes.body.data.roles.find((r: any) => r.role === 'DOCTOR');
  console.log('  ✅ Fetched role permissions. DOCTOR has', doctorRole?.permissions?.length, 'module permissions.');

  // 3. Toggle OFF doctor_tokens read
  console.log('\n3. Toggling OFF read permission for doctor_tokens...');
  const updatedDoctorPerms = doctorRole.permissions.map((p: any) => {
    if (p.moduleId === 'doctor_tokens') {
      return { ...p, read: false, write: false, delete: false };
    }
    return p;
  });

  const putRes = await request({
    hostname: 'localhost',
    port: 4000,
    path: '/api/admin/role-permissions/DOCTOR',
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    }
  }, { permissions: updatedDoctorPerms });

  if (putRes.status !== 200) {
    throw new Error(`Failed to update permissions: ${JSON.stringify(putRes.body)}`);
  }
  console.log('  ✅ PUT /api/admin/role-permissions/DOCTOR succeeded.');

  // 4. Log in as Doctor and inspect effective allowed modules
  console.log('\n4. Logging in as Doctor (dr.aisha@hospital.com) to verify restricted modules...');
  const docLoginRes = await request({
    hostname: 'localhost',
    port: 4000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { identifier: 'dr.aisha@hospital.com', password: 'Password123!' });

  const docAllowedModules: string[] = docLoginRes.body.data.user.allowedModules;
  console.log('  Doctor effective allowed modules:', docAllowedModules);
  if (docAllowedModules.includes('doctor_tokens')) {
    throw new Error('❌ FAILURE: doctor_tokens is still present in allowedModules when read was toggled OFF!');
  }
  console.log('  ✅ SUCCESS: doctor_tokens is successfully EXCLUDED from doctor allowedModules!');

  // 5. Restore doctor_tokens read: true
  console.log('\n5. Restoring read permission for doctor_tokens...');
  const restoredDoctorPerms = doctorRole.permissions.map((p: any) => {
    if (p.moduleId === 'doctor_tokens') {
      return { ...p, read: true, write: true, delete: false };
    }
    return p;
  });

  await request({
    hostname: 'localhost',
    port: 4000,
    path: '/api/admin/role-permissions/DOCTOR',
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    }
  }, { permissions: restoredDoctorPerms });

  const docLoginRes2 = await request({
    hostname: 'localhost',
    port: 4000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { identifier: 'dr.aisha@hospital.com', password: 'Password123!' });

  const docAllowedModules2: string[] = docLoginRes2.body.data.user.allowedModules;
  console.log('  Doctor effective allowed modules after restore:', docAllowedModules2);
  if (!docAllowedModules2.includes('doctor_tokens')) {
    throw new Error('❌ FAILURE: doctor_tokens was not restored!');
  }
  console.log('  ✅ SUCCESS: doctor_tokens is restored to doctor allowedModules!');

  // 6. Test RECEPTIONIST Permission Toggle
  console.log('\n6. Testing RECEPTIONIST permission toggle (recep_reports)...');
  const recepRole = permsRes.body.data.roles.find((r: any) => r.role === 'RECEPTIONIST');
  const updatedRecepPerms = recepRole.permissions.map((p: any) => {
    if (p.moduleId === 'recep_reports') {
      return { ...p, read: false, write: false, delete: false };
    }
    return p;
  });

  await request({
    hostname: 'localhost',
    port: 4000,
    path: '/api/admin/role-permissions/RECEPTIONIST',
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    }
  }, { permissions: updatedRecepPerms });

  const recepLoginRes = await request({
    hostname: 'localhost',
    port: 4000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { identifier: 'receptionist@hospital.com', password: 'Password123!' });

  const recepAllowed = recepLoginRes.body.data.user.allowedModules;
  console.log('  Receptionist effective allowed modules:', recepAllowed);
  if (recepAllowed.includes('recep_reports')) {
    throw new Error('❌ FAILURE: recep_reports is still present in allowedModules when toggled OFF!');
  }
  console.log('  ✅ SUCCESS: recep_reports is successfully EXCLUDED from receptionist allowedModules!');

  // Restore Receptionist
  await request({
    hostname: 'localhost',
    port: 4000,
    path: '/api/admin/role-permissions/RECEPTIONIST',
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    }
  }, { permissions: recepRole.permissions });

  // 7. Test PHARMACIST Permission Toggle
  console.log('\n7. Testing PHARMACIST permission toggle (pharma_procurement)...');
  const pharmaRole = permsRes.body.data.roles.find((r: any) => r.role === 'PHARMACIST');
  const updatedPharmaPerms = pharmaRole.permissions.map((p: any) => {
    if (p.moduleId === 'pharma_procurement') {
      return { ...p, read: false, write: false, delete: false };
    }
    return p;
  });

  await request({
    hostname: 'localhost',
    port: 4000,
    path: '/api/admin/role-permissions/PHARMACIST',
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    }
  }, { permissions: updatedPharmaPerms });

  const pharmaLoginRes = await request({
    hostname: 'localhost',
    port: 4000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { identifier: 'pharmacy@hospital.com', password: 'Password123!' });

  const pharmaAllowed = pharmaLoginRes.body.data.user.allowedModules;
  console.log('  Pharmacist effective allowed modules:', pharmaAllowed);
  if (pharmaAllowed.includes('pharma_procurement')) {
    throw new Error('❌ FAILURE: pharma_procurement is still present in allowedModules when toggled OFF!');
  }
  console.log('  ✅ SUCCESS: pharma_procurement is successfully EXCLUDED from pharmacist allowedModules!');

  // Restore Pharmacist
  await request({
    hostname: 'localhost',
    port: 4000,
    path: '/api/admin/role-permissions/PHARMACIST',
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    }
  }, { permissions: pharmaRole.permissions });

  console.log('\n========================================================');
  console.log('🎉 ALL LIVE HTTP E2E PERMISSION TOGGLE CHECKS PASSED!');
  console.log('========================================================\n');
}

runE2eHttpTest().catch(err => {
  console.error('Fatal E2E error:', err);
  process.exit(1);
});
