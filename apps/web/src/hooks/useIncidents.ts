import type {
  AssignRequest,
  CsatRequest,
  IncidentFilters,
  IncidentStatus,
  ResolveRequest,
  SlaConfig,
  TriageRequest,
} from '@incident/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/apiClient';

export function useIncidents(filters: IncidentFilters = {}) {
  return useQuery({ queryKey: ['incidents', filters], queryFn: () => api.listIncidents(filters) });
}

export function useIncident(id: string | undefined) {
  return useQuery({ queryKey: ['incident', id], queryFn: () => api.getIncident(id!), enabled: !!id });
}

export function useSuggestions(id: string | undefined, enabled: boolean) {
  return useQuery({ queryKey: ['suggestions', id], queryFn: () => api.getSuggestions(id!), enabled: !!id && enabled });
}

export function useAlerts() {
  return useQuery({ queryKey: ['alerts'], queryFn: () => api.listAlerts(), refetchInterval: 20_000 });
}

export function useKpi(range: string = 'all') {
  return useQuery({ queryKey: ['kpi', range], queryFn: () => api.getKpi(range) });
}

export function useSlaConfig() {
  return useQuery({ queryKey: ['slaConfig'], queryFn: () => api.getSlaConfig() });
}

export function useAudit(id: string | undefined) {
  return useQuery({ queryKey: ['audit', id], queryFn: () => api.getAudit(id!), enabled: !!id });
}

export function useUsers() {
  return useQuery({ queryKey: ['users'], queryFn: () => api.listUsers() });
}

// ---- Mutations ----
function useIncidentMutation<TArgs>(fn: (args: TArgs) => Promise<unknown>, id?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['incidents'] });
      qc.invalidateQueries({ queryKey: ['alerts'] });
      qc.invalidateQueries({ queryKey: ['kpi'] });
      if (id) {
        qc.invalidateQueries({ queryKey: ['incident', id] });
        qc.invalidateQueries({ queryKey: ['audit', id] });
      }
    },
  });
}

export function useCreateIncident() {
  return useIncidentMutation((args: { payload: { title: string; description: string; impact?: string; urgency?: string }; idempotencyKey?: string }) =>
    api.createIncident(args.payload, args.idempotencyKey)
  );
}
export function useTriage(id: string) {
  return useIncidentMutation((req: TriageRequest) => api.triage(id, req), id);
}
export function useAssign(id: string) {
  return useIncidentMutation((req: AssignRequest) => api.assign(id, req), id);
}
export function useAddNote(id: string) {
  return useIncidentMutation((note: string) => api.addNote(id, note), id);
}
export function useChangeStatus(id: string) {
  return useIncidentMutation((toStatus: IncidentStatus) => api.changeStatus(id, toStatus), id);
}
export function useResolve(id: string) {
  return useIncidentMutation((req: ResolveRequest) => api.resolve(id, req), id);
}
export function useConfirm(id: string) {
  return useIncidentMutation<void>(() => api.confirm(id), id);
}
export function useSubmitCsat(id: string) {
  return useIncidentMutation((req: CsatRequest) => api.submitCsat(id, req), id);
}
export function useReopen(id: string) {
  return useIncidentMutation((reason: string) => api.reopen(id, reason), id);
}
export function useClose(id: string) {
  return useIncidentMutation<void>(() => api.close(id), id);
}
export function useAckAlert() {
  return useIncidentMutation((alertId: string) => api.ackAlert(alertId));
}
export function useUpdateSlaConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (config: SlaConfig) => api.updateSlaConfig(config),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['slaConfig'] }),
  });
}
