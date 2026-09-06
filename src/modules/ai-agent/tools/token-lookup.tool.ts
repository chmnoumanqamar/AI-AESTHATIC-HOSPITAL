import { tokenService } from '../../token/token.service';
import { normalizeDateString } from '../../../common/utils/date-helper';

export async function findAvailableTokens(params: { doctorId: string; date: string }) {
  const normDate = normalizeDateString(params.date);
  const matrix = await tokenService.getDoctorTokensMatrix(params.doctorId, normDate);

  return {
    doctorId: matrix.doctorId,
    doctorName: matrix.doctorName,
    date: matrix.date,
    dailyLimit: matrix.dailyLimit,
    activePatientsCount: matrix.activePatientsCount,
    availableCapacity: matrix.availableCapacity,
    nextEstimatedToken: matrix.maxSequenceIssued + 1,
    canBook: matrix.availableCapacity > 0
  };
}
