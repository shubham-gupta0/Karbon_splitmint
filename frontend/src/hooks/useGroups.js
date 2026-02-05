import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { groupsAPI } from "../lib/api";
import { useGroupStore } from "../store/groupStore";
import toast from "react-hot-toast";

export function useGroups() {
  const queryClient = useQueryClient();
  const { setGroups, addGroup, updateGroup, deleteGroup } = useGroupStore();

  const { data: groups, isLoading } = useQuery({
    queryKey: ["groups"],
    queryFn: async () => {
      const response = await groupsAPI.getAll();
      setGroups(response.data.data);
      return response.data.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: groupsAPI.create,
    onSuccess: (response) => {
      addGroup(response.data.data);
      queryClient.invalidateQueries(["groups"]);
      toast.success("Group created successfully!");
    },
    onError: (error) => {
      const message = error.response?.data?.message || "Failed to create group";
      toast.error(message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => groupsAPI.update(id, data),
    onSuccess: (response, variables) => {
      updateGroup(variables.id, response.data.data);
      queryClient.invalidateQueries(["groups"]);
      queryClient.invalidateQueries(["group", variables.id]);
      toast.success("Group updated successfully!");
    },
    onError: (error) => {
      const message = error.response?.data?.message || "Failed to update group";
      toast.error(message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: groupsAPI.delete,
    onSuccess: (_, id) => {
      deleteGroup(id);
      queryClient.invalidateQueries(["groups"]);
      toast.success("Group deleted successfully!");
    },
    onError: (error) => {
      const message = error.response?.data?.message || "Failed to delete group";
      toast.error(message);
    },
  });

  return {
    groups,
    isLoading,
    createGroup: createMutation.mutate,
    updateGroup: updateMutation.mutate,
    deleteGroup: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

export function useGroup(id) {
  const queryClient = useQueryClient();

  const { data: group, isLoading } = useQuery({
    queryKey: ["group", id],
    queryFn: async () => {
      const response = await groupsAPI.getById(id);
      return response.data.data;
    },
    enabled: !!id,
  });

  const { data: balances, isLoading: isLoadingBalances } = useQuery({
    queryKey: ["balances", id],
    queryFn: async () => {
      const response = await groupsAPI.getBalances(id);
      return response.data.data;
    },
    enabled: !!id,
  });

  return {
    group,
    balances,
    isLoading: isLoading || isLoadingBalances,
  };
}
