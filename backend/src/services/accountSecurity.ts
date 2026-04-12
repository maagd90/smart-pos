import prisma from '../config/database';

const MAX_ATTEMPTS = 5;
const LOCK_DURATION_MINUTES = 15;

/**
 * Records a failed login attempt. If the user exceeds MAX_ATTEMPTS,
 * their account is locked for LOCK_DURATION_MINUTES minutes.
 */
export async function recordFailedAttempt(email: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return;

  // Count recent failed attempts from audit logs in the last lockout window
  const windowStart = new Date(Date.now() - LOCK_DURATION_MINUTES * 60 * 1000);

  const recentFailures = await prisma.auditLog.count({
    where: {
      userId: user.id,
      action: 'LOGIN_FAILED',
      status: 'FAILURE',
      createdAt: { gte: windowStart },
    },
  });

  // +1 to account for the attempt being recorded right now
  if (recentFailures + 1 >= MAX_ATTEMPTS) {
    const lockedUntil = new Date(Date.now() + LOCK_DURATION_MINUTES * 60 * 1000);
    await prisma.user.update({
      where: { id: user.id },
      data: { lockedUntil },
    });
  }
}

/**
 * Checks whether the given user account is currently locked.
 */
export async function isAccountLocked(email: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { lockedUntil: true },
  });

  if (!user || !user.lockedUntil) return false;
  return user.lockedUntil > new Date();
}

/**
 * Resets the account lockout after a successful login.
 */
export async function resetLockout(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { lockedUntil: null },
  });
}
