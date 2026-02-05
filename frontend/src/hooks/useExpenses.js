import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { expensesAPI } from "../lib/api";
import { useExpenseStore } from "../store/expenseStore";
import toast from "react-hot-toast";

export function useExpenses(groupId) {
  const queryClient = useQueryClient();
  const { setExpenses, addExpense, updateExpense, deleteExpense, filters } =
    useExpenseStore();

  const { data: expenses, isLoading } = useQuery({
    queryKey: ["expenses", groupId, filters],
    queryFn: async () => {
      const response = await expensesAPI.getAll({
        groupId,
        ...filters,
      });
      setExpenses(response.data.data);
      return response.data.data;
    },
    enabled: !!groupId,
  });

  const createMutation = useMutation({
    mutationFn: expensesAPI.create,
    onSuccess: (response) => {
      addExpense(response.data.data);
      queryClient.invalidateQueries(["expenses", groupId]);
      queryClient.invalidateQueries(["balances", groupId]);
      queryClient.invalidateQueries(["group", groupId]);
      toast.success("Expense added successfully!");
    },
    onError: (error) => {
      const message = error.response?.data?.message || "Failed to add expense";
      toast.error(message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => expensesAPI.update(id, data),
    onSuccess: (response, variables) => {
      updateExpense(variables.id, response.data.data);
      queryClient.invalidateQueries(["expenses", groupId]);
      queryClient.invalidateQueries(["balances", groupId]);
      queryClient.invalidateQueries(["group", groupId]);
      toast.success("Expense updated successfully!");
    },
    onError: (error) => {
      const message =
        error.response?.data?.message || "Failed to update expense";
      toast.error(message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: expensesAPI.delete,
    onSuccess: (_, id) => {
      deleteExpense(id);
      queryClient.invalidateQueries(["expenses", groupId]);
      queryClient.invalidateQueries(["balances", groupId]);
      queryClient.invalidateQueries(["group", groupId]);
      toast.success("Expense deleted successfully!");
    },
    onError: (error) => {
      const message =
        error.response?.data?.message || "Failed to delete expense";
      toast.error(message);
    },
  });

  return {
    expenses,
    isLoading,
    createExpense: createMutation.mutate,
    updateExpense: updateMutation.mutate,
    deleteExpense: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
