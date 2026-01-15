// Types for households and invitations

export type InviteMethod = "email" | "phone";

export interface SearchUserResult {
  exists: boolean;
  isAlreadyMember: boolean;
  canInvite: boolean;
  displayName?: string;
  method: InviteMethod;
}

export interface InvitationResult {
  ok: true;
  invitationId: string;
  token: string;
  email: string | null;
  phone: string | null;
  method: InviteMethod;
}

export interface Household {
  id: string;
  name: string;
  currency: string;
}

export interface HouseholdMember {
  userId: string;
  email: string | null;
  displayName: string;
  role?: "owner" | "member";
}
