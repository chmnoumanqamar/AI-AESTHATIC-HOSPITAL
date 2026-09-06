import { db } from '../src/common/data/mock-db';
import { logger } from '../src/common/utils/logger';

async function main() {
  logger.info('🌱 Seeding database...');
  logger.info(`✅ Users loaded: ${db.users.length}`);
  logger.info(`✅ Doctors loaded: ${db.doctors.length}`);
  logger.info(`✅ Patients loaded: ${db.patients.length}`);
  logger.info(`✅ Receptionists loaded: ${db.receptionists.length}`);
  logger.info(`✅ Services loaded: ${db.services.length}`);
  logger.info(`✅ Daily Tokens loaded: ${db.dailyTokens.length}`);
  logger.info(`✅ Appointments loaded: ${db.appointments.length}`);
  logger.info(`✅ Clinical Records loaded: ${db.clinicalRecords.length}`);
  logger.info(`✅ Prescription Versions loaded: ${db.prescriptionVersions.length}`);
  logger.info('🎉 Database seeding completed successfully.');
}

main().catch(e => {
  logger.error('Error during seed:', e);
  process.exit(1);
});
