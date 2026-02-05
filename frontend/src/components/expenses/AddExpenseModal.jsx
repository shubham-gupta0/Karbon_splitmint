import { useState } from "react";
import { Loader2, DollarSign } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { ParticipantAvatar } from "@/components/common/ParticipantAvatar";
import { useExpenses } from "@/hooks/useExpenses";
import { SPLIT_TYPES, EXPENSE_CATEGORIES } from "@/lib/constants";
import {
  calculateSplitAmounts,
  validateCustomSplits,
} from "@/lib/balanceEngine";

export default function AddExpenseModal({ open, onClose, group }) {
  const { createExpense, isCreating } = useExpenses(group?.id);

  const [formData, setFormData] = useState({
    amount: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
    payerId: "",
    category: "other",
    splitType: SPLIT_TYPES.EQUAL,
    selectedParticipants: [],
    customSplits: [],
  });
  const [errors, setErrors] = useState({});

  const handleSubmit = (e) => {
    e.preventDefault();

    const newErrors = {};

    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = "Amount must be greater than 0";
    }
    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    }
    if (!formData.payerId) {
      newErrors.payerId = "Please select who paid";
    }
    if (formData.selectedParticipants.length === 0) {
      newErrors.participants = "Select at least one participant";
    }

    // Validate custom splits if needed
    if (formData.splitType === SPLIT_TYPES.CUSTOM) {
      const validation = validateCustomSplits(
        parseFloat(formData.amount),
        formData.customSplits,
      );
      if (!validation.valid) {
        newErrors.splits = validation.error;
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const expenseData = {
      groupId: group.id,
      amount: parseFloat(formData.amount),
      description: formData.description.trim(),
      date: formData.date,
      payerId: formData.payerId,
      category: formData.category,
      splitType: formData.splitType,
      participants: formData.selectedParticipants,
      customSplits:
        formData.splitType === SPLIT_TYPES.CUSTOM
          ? formData.customSplits
          : undefined,
    };

    createExpense(expenseData, {
      onSuccess: () => {
        handleClose();
      },
    });
  };

  const handleClose = () => {
    setFormData({
      amount: "",
      description: "",
      date: new Date().toISOString().split("T")[0],
      payerId: "",
      category: "other",
      splitType: SPLIT_TYPES.EQUAL,
      selectedParticipants: [],
      customSplits: [],
    });
    setErrors({});
    onClose();
  };

  const handleParticipantToggle = (participantId) => {
    const isSelected = formData.selectedParticipants.includes(participantId);
    const newSelected = isSelected
      ? formData.selectedParticipants.filter((id) => id !== participantId)
      : [...formData.selectedParticipants, participantId];

    setFormData({ ...formData, selectedParticipants: newSelected });
    if (errors.participants) setErrors({ ...errors, participants: "" });
  };

  const handleSelectAll = () => {
    if (formData.selectedParticipants.length === group.participants.length) {
      setFormData({ ...formData, selectedParticipants: [] });
    } else {
      setFormData({
        ...formData,
        selectedParticipants: group.participants.map((p) => p.id),
      });
    }
  };

  if (!group) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Expense</DialogTitle>
          <DialogDescription>
            Add a new expense to {group.name}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Amount */}
          <div>
            <Label htmlFor="amount">Amount</Label>
            <div className="relative mt-1">
              <DollarSign className="absolute left-3 top-3 h-5 w-5 text-neutral-400" />
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => {
                  setFormData({ ...formData, amount: e.target.value });
                  if (errors.amount) setErrors({ ...errors, amount: "" });
                }}
                error={errors.amount}
                className="pl-10 text-2xl font-semibold"
                autoFocus
              />
            </div>
            {errors.amount && (
              <p className="mt-1 text-sm text-error">{errors.amount}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              placeholder="What was this for?"
              value={formData.description}
              onChange={(e) => {
                setFormData({ ...formData, description: e.target.value });
                if (errors.description)
                  setErrors({ ...errors, description: "" });
              }}
              error={errors.description}
              className="mt-1"
            />
            {errors.description && (
              <p className="mt-1 text-sm text-error">{errors.description}</p>
            )}
          </div>

          {/* Date */}
          <div>
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) =>
                setFormData({ ...formData, date: e.target.value })
              }
              className="mt-1"
            />
          </div>

          {/* Category */}
          <div>
            <Label htmlFor="category">Category</Label>
            <select
              id="category"
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
              className="mt-1 flex h-11 w-full rounded-lg border-2 border-neutral-300 bg-white px-4 py-3 text-sm focus-visible:outline-none focus-visible:border-primary-500 focus-visible:ring-4 focus-visible:ring-primary-100"
            >
              {EXPENSE_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.icon} {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Who Paid */}
          <div>
            <Label>Who Paid?</Label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {group.participants.map((participant) => (
                <button
                  key={participant.id}
                  type="button"
                  onClick={() => {
                    setFormData({ ...formData, payerId: participant.id });
                    if (errors.payerId) setErrors({ ...errors, payerId: "" });
                  }}
                  className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                    formData.payerId === participant.id
                      ? "border-primary-500 bg-primary-50"
                      : "border-neutral-200 bg-white hover:border-neutral-300"
                  }`}
                >
                  <ParticipantAvatar participant={participant} size="small" />
                  <span className="font-medium text-sm">
                    {participant.name}
                  </span>
                </button>
              ))}
            </div>
            {errors.payerId && (
              <p className="mt-1 text-sm text-error">{errors.payerId}</p>
            )}
          </div>

          {/* Split Among */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Split Among</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleSelectAll}
              >
                {formData.selectedParticipants.length ===
                group.participants.length
                  ? "Deselect All"
                  : "Select All"}
              </Button>
            </div>
            <div className="space-y-2">
              {group.participants.map((participant) => {
                const isSelected = formData.selectedParticipants.includes(
                  participant.id,
                );
                return (
                  <button
                    key={participant.id}
                    type="button"
                    onClick={() => handleParticipantToggle(participant.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
                      isSelected
                        ? "border-primary-500 bg-primary-50"
                        : "border-neutral-200 bg-white hover:border-neutral-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <ParticipantAvatar
                        participant={participant}
                        size="small"
                      />
                      <span className="font-medium">{participant.name}</span>
                    </div>
                    {isSelected && formData.amount && (
                      <span className="text-sm text-primary-600 font-medium">
                        $
                        {(
                          parseFloat(formData.amount) /
                          formData.selectedParticipants.length
                        ).toFixed(2)}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            {errors.participants && (
              <p className="mt-1 text-sm text-error">{errors.participants}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-4 border-t">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Expense"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
