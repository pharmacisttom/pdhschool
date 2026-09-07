import { RoleType } from '@prisma/client';
import { SessionUser } from './session';

export function hasRole(userRole: RoleType, allowedRoles: RoleType[]): boolean {
  if (userRole === RoleType.SUPER_ADMIN) return true;
  return allowedRoles.includes(userRole);
}

export function canManageQuotas(user: SessionUser): boolean {
  const allowed: RoleType[] = [RoleType.SUPER_ADMIN, RoleType.TRAINING_ADMIN, RoleType.DEPARTMENT_ADMIN];
  return allowed.includes(user.role);
}

export function canApproveRequests(user: SessionUser): boolean {
  const allowed: RoleType[] = [RoleType.SUPER_ADMIN, RoleType.TRAINING_ADMIN];
  return allowed.includes(user.role);
}

export function canReviewDepartment(user: SessionUser, departmentId?: string): boolean {
  if (user.role === RoleType.SUPER_ADMIN || user.role === RoleType.TRAINING_ADMIN) return true;
  if (user.role === RoleType.DEPARTMENT_ADMIN && user.departmentId === departmentId) return true;
  return false;
}

export function canManageStudents(user: SessionUser, institutionId?: string): boolean {
  const allowed: RoleType[] = [RoleType.SUPER_ADMIN, RoleType.TRAINING_ADMIN];
  if (allowed.includes(user.role)) return true;
  if (user.role === RoleType.INSTITUTION && user.institutionId === institutionId) return true;
  return false;
}

export function canEvaluate(user: SessionUser): boolean {
  const allowed: RoleType[] = [RoleType.SUPER_ADMIN, RoleType.TRAINING_ADMIN, RoleType.DEPARTMENT_ADMIN, RoleType.PRECEPTOR];
  return allowed.includes(user.role);
}

export function canViewAudit(user: SessionUser): boolean {
  const allowed: RoleType[] = [RoleType.SUPER_ADMIN, RoleType.TRAINING_ADMIN];
  return allowed.includes(user.role);
}

export function canManageUsers(user: SessionUser): boolean {
  return user.role === RoleType.SUPER_ADMIN;
}

export function canManageSettings(user: SessionUser): boolean {
  return user.role === RoleType.SUPER_ADMIN;
}
