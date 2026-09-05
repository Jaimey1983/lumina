import { Role, VerificationMethod, VerificationStatus } from '@prisma/client';

import {
  canPublishOrInvite,
  invitationGraceExpiry,
  isTeacherRole,
  resolveEffectiveStatus,
} from './verification.util';

describe('isTeacherRole', () => {
  it('true para TEACHER y TEACHER_ASSISTANT', () => {
    expect(isTeacherRole(Role.TEACHER)).toBe(true);
    expect(isTeacherRole(Role.TEACHER_ASSISTANT)).toBe(true);
  });

  it('false para el resto', () => {
    for (const r of [
      Role.STUDENT,
      Role.ADMIN,
      Role.SUPERADMIN,
      Role.PARENT,
      Role.DEPARTMENT_HEAD,
      Role.GUEST,
    ]) {
      expect(isTeacherRole(r)).toBe(false);
    }
  });
});

describe('resolveEffectiveStatus (expiración perezosa)', () => {
  const NOW = new Date('2026-06-01T00:00:00Z');

  it('VERIFIED por INVITATION_CODE con gracia vencida → EXPIRED', () => {
    expect(
      resolveEffectiveStatus(
        {
          verificationStatus: VerificationStatus.VERIFIED,
          verificationMethod: VerificationMethod.INVITATION_CODE,
          verificationExpiresAt: new Date('2026-05-31T23:59:59Z'),
        },
        NOW,
      ),
    ).toBe(VerificationStatus.EXPIRED);
  });

  it('VERIFIED por INVITATION_CODE con gracia vigente → VERIFIED', () => {
    expect(
      resolveEffectiveStatus(
        {
          verificationStatus: VerificationStatus.VERIFIED,
          verificationMethod: VerificationMethod.INVITATION_CODE,
          verificationExpiresAt: new Date('2026-06-15T00:00:00Z'),
        },
        NOW,
      ),
    ).toBe(VerificationStatus.VERIFIED);
  });

  it('VERIFIED por INSTITUTIONAL_EMAIL no expira aunque no haya fecha', () => {
    expect(
      resolveEffectiveStatus(
        {
          verificationStatus: VerificationStatus.VERIFIED,
          verificationMethod: VerificationMethod.INSTITUTIONAL_EMAIL,
          verificationExpiresAt: null,
        },
        NOW,
      ),
    ).toBe(VerificationStatus.VERIFIED);
  });

  it('PENDING / null / REJECTED se devuelven sin cambios', () => {
    const base = {
      verificationMethod: null,
      verificationExpiresAt: null,
    };
    expect(
      resolveEffectiveStatus(
        { ...base, verificationStatus: VerificationStatus.PENDING },
        NOW,
      ),
    ).toBe(VerificationStatus.PENDING);
    expect(
      resolveEffectiveStatus({ ...base, verificationStatus: null }, NOW),
    ).toBeNull();
    expect(
      resolveEffectiveStatus(
        { ...base, verificationStatus: VerificationStatus.REJECTED },
        NOW,
      ),
    ).toBe(VerificationStatus.REJECTED);
  });
});

describe('canPublishOrInvite', () => {
  it('roles no docentes siempre pueden (guard no aplica)', () => {
    expect(canPublishOrInvite(Role.ADMIN, VerificationStatus.PENDING)).toBe(
      true,
    );
    expect(canPublishOrInvite(Role.SUPERADMIN, null)).toBe(true);
    expect(canPublishOrInvite(Role.STUDENT, VerificationStatus.REJECTED)).toBe(
      true,
    );
  });

  it('docente: VERIFIED o null → puede; PENDING/EXPIRED/REJECTED → no', () => {
    expect(canPublishOrInvite(Role.TEACHER, VerificationStatus.VERIFIED)).toBe(
      true,
    );
    expect(canPublishOrInvite(Role.TEACHER, null)).toBe(true);
    expect(canPublishOrInvite(Role.TEACHER, VerificationStatus.PENDING)).toBe(
      false,
    );
    expect(canPublishOrInvite(Role.TEACHER, VerificationStatus.EXPIRED)).toBe(
      false,
    );
    expect(
      canPublishOrInvite(Role.TEACHER_ASSISTANT, VerificationStatus.REJECTED),
    ).toBe(false);
  });
});

describe('invitationGraceExpiry', () => {
  it('suma 30 días', () => {
    const from = new Date('2026-01-01T00:00:00Z');
    expect(invitationGraceExpiry(from).toISOString()).toBe(
      '2026-01-31T00:00:00.000Z',
    );
  });
});
