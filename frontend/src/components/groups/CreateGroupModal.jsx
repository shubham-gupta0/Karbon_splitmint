import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, Plus, Loader2 } from "lucide-react";
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
import { useGroups } from "@/hooks/useGroups";
import { getRandomColor } from "@/lib/utils";
import { MAX_PARTICIPANTS } from "@/lib/constants";

export default function CreateGroupModal({ open, onClose }) {
  const navigate = useNavigate();
  const { createGroup, isCreating } = useGroups();
  const [groupName, setGroupName] = useState("");
  const [participants, setParticipants] = useState([]);
  const [currentParticipant, setCurrentParticipant] = useState({
    name: "",
    color: getRandomColor(),
  });
  const [errors, setErrors] = useState({});

  const handleAddParticipant = () => {
    if (!currentParticipant.name.trim()) {
      setErrors({ participant: "Name is required" });
      return;
    }

    if (participants.length >= MAX_PARTICIPANTS - 1) {
      setErrors({
        participant: `Maximum ${MAX_PARTICIPANTS - 1} participants allowed (excluding you)`,
      });
      return;
    }

    setParticipants([
      ...participants,
      { ...currentParticipant, id: Date.now().toString() },
    ]);
    setCurrentParticipant({ name: "", color: getRandomColor() });
    setErrors({});
  };

  const handleRemoveParticipant = (id) => {
    setParticipants(participants.filter((p) => p.id !== id));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const newErrors = {};
    if (!groupName.trim()) {
      newErrors.groupName = "Group name is required";
    }
    if (participants.length === 0) {
      newErrors.participants = "At least one participant is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const groupData = {
      name: groupName.trim(),
      participants: participants.map((p) => ({ name: p.name, color: p.color })),
    };

    createGroup(groupData, {
      onSuccess: (response) => {
        const newGroupId = response.data.data.id;
        onClose();
        resetForm();
        navigate(`/groups/${newGroupId}`);
      },
    });
  };

  const resetForm = () => {
    setGroupName("");
    setParticipants([]);
    setCurrentParticipant({ name: "", color: getRandomColor() });
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Group</DialogTitle>
          <DialogDescription>
            Add members to start tracking shared expenses
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Group Name */}
          <div>
            <Label htmlFor="groupName">Group Name</Label>
            <Input
              id="groupName"
              placeholder="e.g., Roommates, Weekend Trip"
              value={groupName}
              onChange={(e) => {
                setGroupName(e.target.value);
                if (errors.groupName) setErrors({ ...errors, groupName: "" });
              }}
              error={errors.groupName}
              className="mt-1"
              autoFocus
            />
            {errors.groupName && (
              <p className="mt-1 text-sm text-error">{errors.groupName}</p>
            )}
          </div>

          {/* Add Participants */}
          <div>
            <Label>
              Add Participants ({participants.length}/{MAX_PARTICIPANTS - 1})
            </Label>
            <div className="flex gap-2 mt-1">
              <Input
                placeholder="Participant name"
                value={currentParticipant.name}
                onChange={(e) => {
                  setCurrentParticipant({
                    ...currentParticipant,
                    name: e.target.value,
                  });
                  if (errors.participant)
                    setErrors({ ...errors, participant: "" });
                }}
                error={errors.participant}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddParticipant();
                  }
                }}
              />
              <Button
                type="button"
                onClick={handleAddParticipant}
                disabled={participants.length >= MAX_PARTICIPANTS - 1}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {errors.participant && (
              <p className="mt-1 text-sm text-error">{errors.participant}</p>
            )}
            {errors.participants && (
              <p className="mt-1 text-sm text-error">{errors.participants}</p>
            )}
          </div>

          {/* Participants List */}
          {participants.length > 0 && (
            <div className="space-y-2">
              <Label>Participants</Label>
              <div className="space-y-2">
                {participants.map((participant) => (
                  <div
                    key={participant.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-neutral-50 border border-neutral-200"
                  >
                    <div className="flex items-center gap-3">
                      <ParticipantAvatar
                        participant={participant}
                        size="small"
                      />
                      <span className="font-medium">{participant.name}</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveParticipant(participant.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Group"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
