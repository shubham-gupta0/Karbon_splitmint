import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Plus,
  DollarSign,
  Users,
  Search,
  Trash2,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { EmptyState } from "@/components/common/EmptyState";
import { PageLoader } from "@/components/common/LoadingSpinner";
import { ParticipantAvatar } from "@/components/common/ParticipantAvatar";
import { useGroup } from "@/hooks/useGroups";
import { useExpenses } from "@/hooks/useExpenses";
import { useGroups } from "@/hooks/useGroups";
import { useDebounce } from "@/hooks/useDebounce";
import { useExpenseStore } from "@/store/expenseStore";
import { formatCurrency, formatDate } from "@/lib/utils";
import AddExpenseModal from "@/components/expenses/AddExpenseModal";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";

export default function GroupDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { group, balances, isLoading } = useGroup(id);
  const {
    expenses,
    isLoading: isLoadingExpenses,
    deleteExpense,
    isDeleting,
  } = useExpenses(id);
  const { deleteGroup: deleteGroupMutation, isDeleting: isDeletingGroup } =
    useGroups();
  const { filters, setFilters } = useExpenseStore();
  const [isAddExpenseModalOpen, setIsAddExpenseModalOpen] = useState(false);
  const [isDeleteGroupModalOpen, setIsDeleteGroupModalOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState(null);

  const debouncedSearch = useDebounce(filters.search, 300);

  if (isLoading) return <PageLoader />;

  if (!group) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <Header />
        <div className="container px-4 py-20 text-center">
          <h2 className="text-2xl font-bold mb-4">Group not found</h2>
          <Button onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const totalSpent = expenses?.reduce((sum, exp) => sum + exp.amount, 0) || 0;
  const yourBalance = balances?.balances?.[group.participants?.[0]?.id] || 0;

  const handleDeleteGroup = () => {
    deleteGroupMutation(id, {
      onSuccess: () => {
        navigate("/dashboard");
      },
    });
  };

  const handleDeleteExpense = () => {
    if (expenseToDelete) {
      deleteExpense(expenseToDelete.id);
      setExpenseToDelete(null);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <Header />

      <main className="container px-4 py-8">
        {/* Back Button & Title */}
        <div className="mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/dashboard")}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Groups
          </Button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold font-display mb-2">
                {group.name}
              </h1>
              <div className="flex items-center gap-2 text-neutral-600">
                <Users className="h-4 w-4" />
                <span>{group.participants?.length || 0} members</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setIsDeleteGroupModalOpen(true)}
              >
                <Trash2 className="h-4 w-4" />
                Delete Group
              </Button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-gradient-to-br from-primary-500 to-primary-600 text-white border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-primary-100">Total Spent</span>
                  <DollarSign className="h-5 w-5 text-primary-200" />
                </div>
                <p className="text-3xl font-bold">
                  {formatCurrency(totalSpent)}
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-neutral-600">Your Balance</span>
                </div>
                <p
                  className={`text-3xl font-bold ${yourBalance >= 0 ? "text-success" : "text-error"}`}
                >
                  {yourBalance >= 0 ? "+" : ""}
                  {formatCurrency(yourBalance)}
                </p>
                <p className="text-sm text-neutral-500 mt-1">
                  {yourBalance >= 0 ? "You are owed" : "You owe"}
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-neutral-600">Transactions</span>
                </div>
                <p className="text-3xl font-bold">{expenses?.length || 0}</p>
                <p className="text-sm text-neutral-500 mt-1">Total expenses</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Participants */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">Group Members</h3>
            <div className="flex flex-wrap gap-4">
              {group.participants?.map((participant) => (
                <div
                  key={participant.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-neutral-50 border border-neutral-200"
                >
                  <ParticipantAvatar participant={participant} />
                  <div>
                    <p className="font-medium">{participant.name}</p>
                    {participant.isOwner && (
                      <p className="text-xs text-neutral-500">Owner</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Expenses Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold">Transactions</h2>
            <Button onClick={() => setIsAddExpenseModalOpen(true)}>
              <Plus className="h-5 w-5" />
              Add Expense
            </Button>
          </div>

          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-neutral-400" />
              <Input
                placeholder="Search expenses..."
                value={filters.search}
                onChange={(e) => setFilters({ search: e.target.value })}
                className="pl-10"
              />
            </div>
          </div>

          {/* Expense List */}
          {!expenses || expenses.length === 0 ? (
            <EmptyState
              icon={DollarSign}
              title="No expenses yet"
              description="Start tracking expenses by adding your first transaction."
              action={
                <Button onClick={() => setIsAddExpenseModalOpen(true)}>
                  <Plus className="h-5 w-5" />
                  Add First Expense
                </Button>
              }
            />
          ) : (
            <div className="space-y-4">
              {expenses.map((expense) => (
                <motion.div
                  key={expense.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  layout
                >
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <ParticipantAvatar
                              participant={expense.payer}
                              size="small"
                            />
                            <div>
                              <p className="font-semibold">
                                {expense.description}
                              </p>
                              <p className="text-sm text-neutral-500">
                                Paid by {expense.payer.name} •{" "}
                                {formatDate(expense.date)}
                              </p>
                            </div>
                          </div>
                          <div className="mt-3 flex items-center gap-2">
                            <span className="text-xs text-neutral-500">
                              Split among:
                            </span>
                            <div className="flex -space-x-2">
                              {expense.splits?.map((split) => (
                                <ParticipantAvatar
                                  key={split.participant.id}
                                  participant={split.participant}
                                  size="small"
                                  className="ring-2 ring-white"
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-primary-600">
                            {formatCurrency(expense.amount)}
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="mt-2 text-error hover:text-error hover:bg-error/10"
                            onClick={() => setExpenseToDelete(expense)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Add Expense Modal */}
      <AddExpenseModal
        open={isAddExpenseModalOpen}
        onClose={() => setIsAddExpenseModalOpen(false)}
        group={group}
      />

      {/* Delete Expense Confirmation */}
      <Dialog
        open={!!expenseToDelete}
        onOpenChange={() => setExpenseToDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Expense</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this expense? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setExpenseToDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteExpense}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete Expense"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Group Confirmation */}
      <Dialog
        open={isDeleteGroupModalOpen}
        onOpenChange={setIsDeleteGroupModalOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Group</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{group.name}"? This will
              permanently delete all expenses and cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setIsDeleteGroupModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteGroup}
              disabled={isDeletingGroup}
            >
              {isDeletingGroup ? "Deleting..." : "Delete Group"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
