// File: src/api/households-api.ts — Endpoints de hogares (backend NestJS /households).

// Phase 2: incluye invitaciones por hogar, roles y expulsión de miembros.

import { api } from "@/api/api";
import type { SearchUserResult } from "@/types/households";

export type HouseholdApi = {
  id: string;
  name: string;
  currency: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateMyHouseholdDto = {
  name?: string;
  currency?: string; // ISO-4217, 3 letras (ej: CUP)
};

export type HouseholdMemberApi = {
  userId: string;
  email: string | null;
  displayName: string;
  role?: "owner" | "member";
};

export type UpdateHouseholdDto = {
  name?: string;
  currency?: string; // ISO-4217
};

export type UpdateHouseholdResponse = {
  ok: true;
  household: HouseholdApi;
};

export type InviteHouseholdDto = {
  email?: string;
  phone?: string;
};

export type InviteHouseholdResponse = {
  ok: true;
  invitationId: string;
  token: string;
  email: string | null;
  phone: string | null;
  method: "email" | "phone";
};

export type HouseholdInvitationApi = {
  id: string;
  householdId: string;
  status: "pending" | "accepted" | "revoked" | "expired";
  invitedIdentifier: string | null;
  email: string | null;
  createdAt: string;
  expiresAt: string | null;
  acceptedAt: string | null;
  invitedById: string | null;
  acceptedById: string | null;
};

export type RevokeInvitationResponse = {
  ok: true;
  invitationId: string;
  status: "revoked";
};

export type SetHouseholdMemberRoleDto = {
  role: "owner" | "member";
};

export type SetHouseholdMemberRoleResponse = {
  ok: true;
  userId: string;
  role: "owner" | "member";
};

export type RemoveHouseholdMemberResponse = {
  ok: true;
  removedUserId: string;
};

export type SearchUserDto = {
  identifier: string;
  householdId?: string;
};

export type AcceptInvitationDto = {
  token: string;
};

export type RegisterHouseholdMemberDto = {
  email?: string;
  phone?: string;
  password: string;
  displayName: string;
};

export type RegisterHouseholdMemberResponse = {
  ok: true;
  household: { id: string; name: string };
  user: {
    id: string;
    email: string | null;
    phone: string | null;
    displayName: string;
  };
};

export type MyHouseholdApi = {
  id: string;
  name: string;
  currency: string;
  isPrimary: boolean;
  role: "owner" | "member";
};

export type SwitchHouseholdDto = {
  householdId: string;
};

export type DeleteHouseholdResponse = {
  ok: true;
  deletedHouseholdId: string;
};

export const householdsApi = {
  async createMyHousehold(dto: CreateMyHouseholdDto): Promise<HouseholdApi> {
    const { data } = await api.post<HouseholdApi>("/households/me", dto);
    return data;
  },

  async listMyHouseholds(): Promise<MyHouseholdApi[]> {
    const { data } = await api.get<MyHouseholdApi[]>("/households/me/all");
    return data;
  },

  async switchPrimaryHousehold(
    dto: SwitchHouseholdDto
  ): Promise<{ ok: true; household: HouseholdApi }> {
    const { data } = await api.post<{ ok: true; household: HouseholdApi }>(
      "/households/me/switch",
      dto
    );
    return data;
  },

  async listMyMembers(): Promise<HouseholdMemberApi[]> {
    const { data } = await api.get<HouseholdMemberApi[]>(
      "/households/me/members"
    );
    return data;
  },

  async listMembers(householdId: string): Promise<HouseholdMemberApi[]> {
    const { data } = await api.get<HouseholdMemberApi[]>(
      `/households/${householdId}/members`
    );
    return data;
  },

  async updateHousehold(
    householdId: string,
    dto: UpdateHouseholdDto
  ): Promise<UpdateHouseholdResponse> {
    const { data } = await api.patch<UpdateHouseholdResponse>(
      `/households/${householdId}`,
      dto
    );
    return data;
  },

  async inviteByEmail(
    dto: InviteHouseholdDto
  ): Promise<InviteHouseholdResponse> {
    const { data } = await api.post<InviteHouseholdResponse>(
      "/households/invitations",
      dto
    );
    return data;
  },

  async inviteToHousehold(
    householdId: string,
    dto: InviteHouseholdDto
  ): Promise<InviteHouseholdResponse> {
    const { data } = await api.post<InviteHouseholdResponse>(
      `/households/${householdId}/invitations`,
      dto
    );
    return data;
  },

  async listHouseholdInvitations(
    householdId: string
  ): Promise<HouseholdInvitationApi[]> {
    const { data } = await api.get<HouseholdInvitationApi[]>(
      `/households/${householdId}/invitations`
    );
    return data;
  },

  async revokeHouseholdInvitation(
    householdId: string,
    invitationId: string
  ): Promise<RevokeInvitationResponse> {
    const { data } = await api.delete<RevokeInvitationResponse>(
      `/households/${householdId}/invitations/${invitationId}`
    );
    return data;
  },

  async setHouseholdMemberRole(
    householdId: string,
    memberUserId: string,
    dto: SetHouseholdMemberRoleDto
  ): Promise<SetHouseholdMemberRoleResponse> {
    const { data } = await api.patch<SetHouseholdMemberRoleResponse>(
      `/households/${householdId}/members/${memberUserId}/role`,
      dto
    );
    return data;
  },

  async removeHouseholdMember(
    householdId: string,
    memberUserId: string
  ): Promise<RemoveHouseholdMemberResponse> {
    const { data } = await api.delete<RemoveHouseholdMemberResponse>(
      `/households/${householdId}/members/${memberUserId}`
    );
    return data;
  },

  async searchUser(dto: SearchUserDto): Promise<SearchUserResult> {
    const { data } = await api.post<SearchUserResult>(
      "/households/search-user",
      dto
    );
    return data;
  },

  async acceptInvitation(dto: AcceptInvitationDto): Promise<HouseholdApi> {
    const { data } = await api.post<HouseholdApi>(
      "/households/invitations/accept",
      dto
    );
    return data;
  },

  async registerMemberFromMyHousehold(
    dto: RegisterHouseholdMemberDto
  ): Promise<RegisterHouseholdMemberResponse> {
    const { data } = await api.post<RegisterHouseholdMemberResponse>(
      "/households/me/members/register",
      dto
    );
    return data;
  },

  async deleteHousehold(householdId: string): Promise<DeleteHouseholdResponse> {
    const { data } = await api.delete<DeleteHouseholdResponse>(
      `/households/${householdId}`
    );
    return data;
  },
};
