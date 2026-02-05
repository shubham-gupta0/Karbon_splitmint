import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authAPI } from "../lib/api";
import { useAuthStore } from "../store/authStore";
import toast from "react-hot-toast";

export function useAuth() {
  const { setAuth, logout: storeLogout } = useAuthStore();
  const queryClient = useQueryClient();

  const loginMutation = useMutation({
    mutationFn: authAPI.login,
    onSuccess: (response) => {
      const { token, user } = response.data.data;
      setAuth(user, token);
      toast.success("Welcome back!");
    },
    onError: (error) => {
      const message = error.response?.data?.message || "Login failed";
      toast.error(message);
    },
  });

  const registerMutation = useMutation({
    mutationFn: authAPI.register,
    onSuccess: () => {
      toast.success("Account created! Please log in.");
    },
    onError: (error) => {
      const message = error.response?.data?.message || "Registration failed";
      toast.error(message);
    },
  });

  const logout = () => {
    storeLogout();
    queryClient.clear();
    toast.success("Logged out successfully");
  };

  return {
    login: loginMutation.mutate,
    register: registerMutation.mutate,
    logout,
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
  };
}
