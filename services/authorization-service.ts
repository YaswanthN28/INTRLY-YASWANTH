import { createClient } from "@/lib/supabase/server"

export type ActorRole = 'candidate' | 'interviewer' | 'admin' | 'owner';

export type MembershipContext = {
  organizationId: string;
  role: 'owner' | 'admin' | 'interviewer';
};

export const AuthorizationService = {
  /**
   * Determine the user's available organizational memberships.
   * Authentication does NOT equal authorization. Being logged in only grants 'candidate' privileges.
   */
  async getUserMemberships(userId: string): Promise<MembershipContext[]> {
    const supabase = await createClient()
    const { data: memberships, error } = await supabase
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', userId)

    if (error || !memberships) {
      return []
    }

    return memberships as MembershipContext[]
  },

  /**
   * Strictly verify if a user has the required permission level for a specific organization.
   */
  async verifyOrganizationAccess(userId: string, organizationId: string, requiredRoles: string[]): Promise<boolean> {
    const supabase = await createClient()
    
    // Explicit server-side lookup against the secure members table
    const { data: member, error } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', userId)
      .single()

    if (error || !member) {
      return false // User is not a member of this organization
    }

    return requiredRoles.includes(member.role)
  },

  /**
   * Verifies if the user is authorized to act as an interviewer AT ALL.
   * Does not grant access to specific candidate data; only validates platform capability.
   */
  async canActAsInterviewer(userId: string): Promise<boolean> {
    const memberships = await this.getUserMemberships(userId);
    // If they have ANY membership in ANY organization, they have the capability to act as an interviewer
    // for that organization.
    return memberships.length > 0;
  }
}
