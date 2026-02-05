import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus, Users, DollarSign, Clock } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { EmptyState } from "@/components/common/EmptyState";
import { LoadingSpinner, PageLoader } from "@/components/common/LoadingSpinner";
import { ParticipantAvatarGroup } from "@/components/common/ParticipantAvatar";
import { useGroups } from "@/hooks/useGroups";
import { formatCurrency, formatRelativeTime } from "@/lib/utils";
import CreateGroupModal from "@/components/groups/CreateGroupModal";

export default function DashboardPage() {
  const navigate = useNavigate();
  const { groups, isLoading } = useGroups();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  if (isLoading) return <PageLoader />;

  return (
    <div className="min-h-screen bg-neutral-50">
      <Header />

      <main className="container px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold font-display mb-2">My Groups</h1>
            <p className="text-neutral-600">
              Manage your expense groups and splits
            </p>
          </div>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="h-5 w-5" />
            Create Group
          </Button>
        </div>

        {/* Groups Grid */}
        {!groups || groups.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No groups yet"
            description="Create your first group to start tracking shared expenses with friends, roommates, or travel buddies."
            action={
              <Button onClick={() => setIsCreateModalOpen(true)}>
                <Plus className="h-5 w-5" />
                Create Your First Group
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.map((group, index) => (
              <motion.div
                key={group.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card
                  className="cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all"
                  onClick={() => navigate(`/groups/${group.id}`)}
                >
                  <CardContent className="p-6">
                    {/* Group Name */}
                    <h3 className="text-xl font-semibold mb-4">{group.name}</h3>

                    {/* Participants */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-neutral-500" />
                        <span className="text-sm text-neutral-600">
                          {" "}
                          {group.participants?.length || 0} members
                        </span>
                      </div>
                      {group.participants && group.participants.length > 0 && (
                        <ParticipantAvatarGroup
                          participants={group.participants}
                          max={3}
                          size="small"
                        />
                      )}
                    </div>

                    {/* Stats */}
                    <div className="space-y-3 pt-3 border-t border-neutral-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-neutral-600">
                          <DollarSign className="h-4 w-4" />
                          <span className="text-sm">Total spent</span>
                        </div>
                        <span className="font-semibold text-primary-600">
                          {formatCurrency(group.totalSpent || 0)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-neutral-500">
                          <Clock className="h-4 w-4" />
                          <span>Last activity</span>
                        </div>
                        <span className="text-neutral-600">
                          {formatRelativeTime(
                            group.lastActivity || group.createdAt,
                          )}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      {/* Create Group Modal */}
      <CreateGroupModal
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
}
