// File: src/query/households.ts — Hooks React Query para hogares.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  householdsApi,
  type AcceptInvitationDto,
  type CreateMyHouseholdDto,
  type DeleteHouseholdResponse,
  type InviteHouseholdDto,
  type SearchUserDto,
  type SetHouseholdMemberRoleDto,
  type SwitchHouseholdDto,
  type UpdateHouseholdDto,
} from "@/api/households-api";

const householdsKeys = {
  all: ["households"] as const,
  myHouseholds: () => [...householdsKeys.all, "my", "all"] as const,
  membersRoot: () => [...householdsKeys.all, "members"] as const,
  membersByHousehold: (householdId: string) =>
    [...householdsKeys.membersRoot(), householdId] as const,
  myMembers: () => [...householdsKeys.all, "me", "members"] as const,
  invitationsRoot: () => [...householdsKeys.all, "invitations"] as const,
  invitationsByHousehold: (householdId: string) =>
    [...householdsKeys.invitationsRoot(), householdId] as const,
};

export function useMyHouseholdsQuery() {
  return useQuery({
    queryKey: householdsKeys.myHouseholds(),
    queryFn: () => householdsApi.listMyHouseholds(),
    staleTime: 30_000,
    refetchOnMount: "always",
    refetchOnReconnect: true,
    // En RN, window focus puede variar por plataforma; si está soportado, ayuda.
    refetchOnWindowFocus: true,
  });
}

export function useSwitchPrimaryHouseholdMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: SwitchHouseholdDto) =>
      householdsApi.switchPrimaryHousehold(dto),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: householdsKeys.myHouseholds() });
      await qc.invalidateQueries({ queryKey: householdsKeys.myMembers() });
      await qc.invalidateQueries({ queryKey: householdsKeys.membersRoot() });
      await qc.invalidateQueries({ queryKey: ["expenses"] });
      await qc.invalidateQueries({ queryKey: ["lists"] });
      await qc.invalidateQueries({ queryKey: ["reports"] });
      await qc.invalidateQueries({ queryKey: ["incomes"] });
    },
  });
}

export function useCreateMyHouseholdMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateMyHouseholdDto) =>
      householdsApi.createMyHousehold(dto),
    onSuccess: async () => {
      // Members list depends on having a household; refresh if shown.
      await qc.invalidateQueries({ queryKey: householdsKeys.myMembers() });
      await qc.invalidateQueries({ queryKey: householdsKeys.myHouseholds() });
      await qc.invalidateQueries({ queryKey: householdsKeys.membersRoot() });
      await qc.invalidateQueries({ queryKey: ["expenses"] });
      await qc.invalidateQueries({ queryKey: ["lists"] });
      await qc.invalidateQueries({ queryKey: ["reports"] });
      await qc.invalidateQueries({ queryKey: ["incomes"] });
    },
  });
}

export function useMyHouseholdMembersQuery(enabled: boolean) {
  return useQuery({
    queryKey: householdsKeys.myMembers(),
    queryFn: () => householdsApi.listMyMembers(),
    enabled,
    staleTime: 30_000,
  });
}

export function useHouseholdMembersQuery(
  householdId: string | null,
  enabled: boolean
) {
  return useQuery({
    queryKey: householdsKeys.membersByHousehold(householdId ?? ""),
    queryFn: () => {
      if (!householdId) throw new Error("householdId requerido");
      return householdsApi.listMembers(householdId);
    },
    enabled: enabled && !!householdId,
    staleTime: 30_000,
  });
}

export function useUpdateHouseholdMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { householdId: string; dto: UpdateHouseholdDto }) =>
      householdsApi.updateHousehold(params.householdId, params.dto),
    onSuccess: async (_data, variables) => {
      await qc.invalidateQueries({ queryKey: householdsKeys.myHouseholds() });
      await qc.invalidateQueries({
        queryKey: householdsKeys.membersByHousehold(variables.householdId),
      });
    },
  });
}

export function useInviteHouseholdByEmailMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: InviteHouseholdDto) => householdsApi.inviteByEmail(dto),
    onSuccess: async () => {
      // Inviting doesn't always change members immediately, but the UI may show pending state later.
      await qc.invalidateQueries({ queryKey: householdsKeys.myMembers() });
      await qc.invalidateQueries({ queryKey: ["expenses"] });
    },
  });
}

export function useHouseholdInvitationsQuery(
  householdId: string | null,
  enabled: boolean
) {
  return useQuery({
    queryKey: householdsKeys.invitationsByHousehold(householdId ?? ""),
    queryFn: () => {
      if (!householdId) throw new Error("householdId requerido");
      return householdsApi.listHouseholdInvitations(householdId);
    },
    enabled: enabled && !!householdId,
    staleTime: 10_000,
  });
}

export function useInviteToHouseholdMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { householdId: string; dto: InviteHouseholdDto }) =>
      householdsApi.inviteToHousehold(params.householdId, params.dto),
    onSuccess: async (_data, variables) => {
      await qc.invalidateQueries({
        queryKey: householdsKeys.invitationsByHousehold(variables.householdId),
      });
    },
  });
}

export function useRevokeHouseholdInvitationMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { householdId: string; invitationId: string }) =>
      householdsApi.revokeHouseholdInvitation(
        params.householdId,
        params.invitationId
      ),
    onSuccess: async (_data, variables) => {
      await qc.invalidateQueries({
        queryKey: householdsKeys.invitationsByHousehold(variables.householdId),
      });
    },
  });
}

export function useSetHouseholdMemberRoleMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      householdId: string;
      memberUserId: string;
      dto: SetHouseholdMemberRoleDto;
    }) =>
      householdsApi.setHouseholdMemberRole(
        params.householdId,
        params.memberUserId,
        params.dto
      ),
    onSuccess: async (_data, variables) => {
      await qc.invalidateQueries({
        queryKey: householdsKeys.membersByHousehold(variables.householdId),
      });
      await qc.invalidateQueries({ queryKey: householdsKeys.myHouseholds() });
    },
  });
}

export function useRemoveHouseholdMemberMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { householdId: string; memberUserId: string }) =>
      householdsApi.removeHouseholdMember(
        params.householdId,
        params.memberUserId
      ),
    onSuccess: async (_data, variables) => {
      await qc.invalidateQueries({
        queryKey: householdsKeys.membersByHousehold(variables.householdId),
      });
      await qc.invalidateQueries({ queryKey: householdsKeys.myHouseholds() });
    },
  });
}

export function useSearchUserForInviteMutation() {
  return useMutation({
    mutationFn: (dto: SearchUserDto) => householdsApi.searchUser(dto),
  });
}

export function useAcceptHouseholdInvitationMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: AcceptInvitationDto) =>
      householdsApi.acceptInvitation(dto),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: householdsKeys.myMembers() });
      await qc.invalidateQueries({ queryKey: householdsKeys.myHouseholds() });
      await qc.invalidateQueries({ queryKey: householdsKeys.membersRoot() });
      await qc.invalidateQueries({ queryKey: ["expenses"] });
      await qc.invalidateQueries({ queryKey: ["lists"] });
      await qc.invalidateQueries({ queryKey: ["reports"] });
      await qc.invalidateQueries({ queryKey: ["incomes"] });
    },
  });
}

export function useDeleteHouseholdMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (householdId: string): Promise<DeleteHouseholdResponse> =>
      householdsApi.deleteHousehold(householdId),
    onSuccess: async () => {
      // Important: when the last household is deleted, Dashboard disables expense queries.
      // Disabled queries keep their cached data, so we must purge them to avoid showing stale totals.
      qc.removeQueries({ queryKey: ["expenses"] });
      qc.removeQueries({ queryKey: ["lists"] });
      qc.removeQueries({ queryKey: ["reports"] });
      qc.removeQueries({ queryKey: ["incomes"] });

      await qc.invalidateQueries({ queryKey: householdsKeys.myHouseholds() });
      await qc.invalidateQueries({ queryKey: householdsKeys.myMembers() });
      await qc.invalidateQueries({ queryKey: householdsKeys.membersRoot() });

      // If user still has other households and a new primary is selected, screens will refetch fresh data.
      await qc.invalidateQueries({ queryKey: ["expenses"] });
      await qc.invalidateQueries({ queryKey: ["lists"] });
      await qc.invalidateQueries({ queryKey: ["reports"] });
      await qc.invalidateQueries({ queryKey: ["incomes"] });
    },
  });
}
