import React, { type ReactNode } from 'react';
import type { OrgRole } from '@/types/organization';
import { useAuth } from '@/auth/useAuth';

export interface RoleGateProps {
  /** The required role(s) — user must have at least one if an array */
  role: OrgRole | OrgRole[];
  children: ReactNode;
  /** Optional fallback to render when the user does not have the required role */
  fallback?: ReactNode;
}

/**
 * RoleGate checks if the current user has the required role within the current organization context.
 *
 * Usage:
 *   <RoleGate role="org_admin" fallback={<p>Access denied</p>}>
 *     <AdminPanel />
 *   </RoleGate>
 *
 * NOTE: This component requires integration with a useOrganization() hook
 * that provides the current user's membership role. Without it, the component
 * will always render children as a pass-through.
 */
const RoleGate: React.FC<RoleGateProps> = ({ role: _role, children, fallback = null }) => {
  const { user } = useAuth();

  // If no user is logged in, show fallback
  if (!user) {
    return <>{fallback}</>;
  }

  // TODO: Replace with actual role check from useOrganization().membership.role
  // Example:
  //   const { membership } = useOrganization();
  //   const roles = Array.isArray(role) ? role : [role];
  //   const hasRole = membership !== null && roles.includes(membership.role as OrgRole);
  //
  // For now, this is a pass-through that renders children.

  return <>{children}</>;
};

export default RoleGate;
