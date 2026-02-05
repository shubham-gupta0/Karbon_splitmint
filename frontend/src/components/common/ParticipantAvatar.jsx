import { Avatar, AvatarFallback } from "../ui/Avatar";
import { getInitials } from "@/lib/utils";

export function ParticipantAvatar({
  participant,
  size = "default",
  className = "",
}) {
  const sizeClasses = {
    small: "h-8 w-8 text-xs",
    default: "h-10 w-10 text-sm",
    large: "h-12 w-12 text-base",
  };

  return (
    <Avatar className={`${sizeClasses[size]} ${className}`}>
      <AvatarFallback
        style={{ backgroundColor: participant.color }}
        className="text-white font-semibold"
      >
        {getInitials(participant.name)}
      </AvatarFallback>
    </Avatar>
  );
}

export function ParticipantAvatarGroup({
  participants,
  max = 4,
  size = "default",
}) {
  const displayParticipants = participants.slice(0, max);
  const remaining = participants.length - max;

  return (
    <div className="flex -space-x-2">
      {displayParticipants.map((participant) => (
        <ParticipantAvatar
          key={participant.id}
          participant={participant}
          size={size}
          className="ring-2 ring-white dark:ring-neutral-800"
        />
      ))}
      {remaining > 0 && (
        <Avatar className={size === "small" ? "h-8 w-8" : "h-10 w-10"}>
          <AvatarFallback className="bg-neutral-200 text-neutral-700 text-xs font-semibold dark:bg-neutral-700 dark:text-neutral-300">
            +{remaining}
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
