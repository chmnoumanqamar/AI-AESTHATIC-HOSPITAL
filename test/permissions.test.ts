import { adminService } from '../src/modules/admin/admin.service';
import { authService } from '../src/modules/auth/auth.service';
import { RolePermissionRule } from '../src/common/data/mock-db';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${testName} ${detail ? `(${detail})` : ''}`);
    failed++;
  }
}

async function runPermissionsTestSuite() {
  console.log('\n========================================================');
  console.log('🔒 RUNNING ROLE PERMISSION TOGGLE & ACCESS CONTROL TESTS');
  console.log('========================================================\n');

  console.log('--- TEST GROUP 1: ROLE PERMISSIONS STORE INITIALIZATION ---');
  await adminService.resetRolePermissions('test-runner');
  const { roles } = await adminService.getRolePermissions();
  assert(Array.isArray(roles) && roles.length > 0, 'Role permissions initialized with roles');

  const doctorRole = roles.find((r: any) => r.role === 'DOCTOR');
  assert(!!doctorRole, 'DOCTOR role exists in permission registry');

  const docTokensPerm = doctorRole?.permissions.find((p: RolePermissionRule) => p.moduleId === 'doctor_tokens');
  assert(!!docTokensPerm && docTokensPerm.read === true, 'DOCTOR role has doctor_tokens module permission in registry');

  console.log('\n--- TEST GROUP 2: PERMISSION TOGGLE DEACTIVATION (read: false) ---');
  const users = await adminService.getAllUsers();
  const doctorUser = users.find((u: any) => u.role === 'DOCTOR');
  assert(!!doctorUser, 'Doctor user exists in database');
  if (!doctorUser) return;

  const initialAllowed = authService.getEffectiveAllowedModules(doctorUser as any);
  assert(initialAllowed.includes('doctor_tokens'), 'doctor_tokens initially allowed for DOCTOR');

  // 2. Toggle doctor_tokens read: false
  const updatedDoctorPerms: RolePermissionRule[] = doctorRole!.permissions.map((p: RolePermissionRule) => {
    if (p.moduleId === 'doctor_tokens') {
      return { ...p, read: false, write: false, delete: false };
    }
    return { ...p };
  });

  await adminService.updateRolePermissions('DOCTOR', updatedDoctorPerms);

  // 3. Verify effective allowed modules removes doctor_tokens
  const restrictedAllowed = authService.getEffectiveAllowedModules(doctorUser as any);
  assert(
    !restrictedAllowed.includes('doctor_tokens'),
    'doctor_tokens excluded from allowed modules when read: false',
    `Expected doctor_tokens to be excluded, but received: ${restrictedAllowed.join(', ')}`
  );

  console.log('\n--- TEST GROUP 3: PERMISSION TOGGLE RESTORATION (read: true) ---');
  // 4. Re-enable doctor_tokens read: true
  const restoredDoctorPerms: RolePermissionRule[] = updatedDoctorPerms.map((p: RolePermissionRule) => {
    if (p.moduleId === 'doctor_tokens') {
      return { ...p, read: true, write: true, delete: false };
    }
    return { ...p };
  });

  await adminService.updateRolePermissions('DOCTOR', restoredDoctorPerms);

  // 5. Verify doctor_tokens restored
  const restoredAllowed = authService.getEffectiveAllowedModules(doctorUser as any);
  assert(
    restoredAllowed.includes('doctor_tokens'),
    'doctor_tokens re-included in allowed modules when read: true restored'
  );

  console.log('\n--- TEST GROUP 4: RECEPTIONIST ROLE TOGGLE (reception_reports) ---');
  const receptionistUser = users.find((u: any) => u.role === 'RECEPTIONIST');
  assert(!!receptionistUser, 'Receptionist user exists in database');
  if (receptionistUser) {
    const recepInitial = authService.getEffectiveAllowedModules(receptionistUser as any);
    assert(recepInitial.includes('recep_reports'), 'recep_reports initially permitted for RECEPTIONIST');

    const { roles: currentRoles } = await adminService.getRolePermissions();
    const recepRole = currentRoles.find((r: any) => r.role === 'RECEPTIONIST');
    const updatedRecepPerms: RolePermissionRule[] = recepRole!.permissions.map((p: RolePermissionRule) => {
      if (p.moduleId === 'recep_reports') {
        return { ...p, read: false, write: false, delete: false };
      }
      return { ...p };
    });

    await adminService.updateRolePermissions('RECEPTIONIST', updatedRecepPerms);
    const recepRestricted = authService.getEffectiveAllowedModules(receptionistUser as any);
    assert(
      !recepRestricted.includes('recep_reports'),
      'recep_reports blocked when read: false for RECEPTIONIST'
    );

    // Restore
    const restoredRecepPerms: RolePermissionRule[] = updatedRecepPerms.map((p: RolePermissionRule) => {
      if (p.moduleId === 'recep_reports') {
        return { ...p, read: true, write: false, delete: false };
      }
      return { ...p };
    });
    await adminService.updateRolePermissions('RECEPTIONIST', restoredRecepPerms);

    const recepFinal = authService.getEffectiveAllowedModules(receptionistUser as any);
    assert(recepFinal.includes('recep_reports'), 'recep_reports restored for RECEPTIONIST');
  }

  console.log('\n--- TEST GROUP 5: PHARMACIST ROLE TOGGLE (pharma_procurement) ---');
  const pharmacistUser = users.find((u: any) => u.role === 'PHARMACIST');
  assert(!!pharmacistUser, 'Pharmacist user exists in database');
  if (pharmacistUser) {
    const pharmaInitial = authService.getEffectiveAllowedModules(pharmacistUser as any);
    assert(pharmaInitial.includes('pharma_procurement'), 'pharma_procurement initially permitted for PHARMACIST');

    const { roles: currentRoles } = await adminService.getRolePermissions();
    const pharmaRole = currentRoles.find((r: any) => r.role === 'PHARMACIST');
    const updatedPharmaPerms: RolePermissionRule[] = pharmaRole!.permissions.map((p: RolePermissionRule) => {
      if (p.moduleId === 'pharma_procurement') {
        return { ...p, read: false, write: false, delete: false };
      }
      return { ...p };
    });

    await adminService.updateRolePermissions('PHARMACIST', updatedPharmaPerms);
    const pharmaRestricted = authService.getEffectiveAllowedModules(pharmacistUser as any);
    assert(
      !pharmaRestricted.includes('pharma_procurement'),
      'pharma_procurement blocked when read: false for PHARMACIST'
    );

    // Restore
    const restoredPharmaPerms: RolePermissionRule[] = updatedPharmaPerms.map((p: RolePermissionRule) => {
      if (p.moduleId === 'pharma_procurement') {
        return { ...p, read: true, write: true, delete: true };
      }
      return { ...p };
    });
    await adminService.updateRolePermissions('PHARMACIST', restoredPharmaPerms);

    const pharmaFinal = authService.getEffectiveAllowedModules(pharmacistUser as any);
    assert(pharmaFinal.includes('pharma_procurement'), 'pharma_procurement restored for PHARMACIST');
  }

  console.log('\n========================================================');
  console.log(`SUMMARY: ${passed} PASSED | ${failed} FAILED`);
  console.log('========================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runPermissionsTestSuite().catch(err => {
  console.error('Fatal error in permissions test suite:', err);
  process.exit(1);
});
