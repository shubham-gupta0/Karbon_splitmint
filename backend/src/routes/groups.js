import express from "express";
import db from "../services/database.js";
import { authenticate } from "../middleware/authenticate.js";
import { ValidationError, NotFoundError } from "../lib/errors.js";
import { createGroupSchema, updateGroupSchema } from "../utils/validators.js";
import {
  calculateGroupBalances,
  calculateSettlements,
} from "../utils/balanceEngine.js";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Helper: Get group with related data
async function getGroupWithData(groupId, userId) {
  const group = await db.getById(db.groups(), groupId);

  if (!group || group.createdById !== userId) {
    return null;
  }

  // Get participants
  const participants = await db.getAll(db.groupParticipants(groupId));

  // Get expenses
  const expensesSnapshot = await db
    .expenses()
    .where("groupId", "==", groupId)
    .orderBy("date", "desc")
    .get();

  const expenses = [];
  for (const expenseDoc of expensesSnapshot.docs) {
    const expenseData = { id: expenseDoc.id, ...expenseDoc.data() };

    // Get splits for this expense
    const splits = await db.getAll(db.expenseSplits(expenseDoc.id));

    // Find payer
    const payer = participants.find((p) => p.id === expenseData.payerId);

    // Attach participant info to splits
    const splitsWithParticipants = splits.map((split) => ({
      ...split,
      participant: participants.find((p) => p.id === split.participantId),
    }));

    expenses.push({
      ...expenseData,
      payer,
      splits: splitsWithParticipants,
    });
  }

  return {
    ...group,
    participants,
    expenses,
  };
}

// Get all groups for authenticated user
router.get("/", async (req, res, next) => {
  try {
    const groups = await db.query(db.groups(), [
      ["createdById", "==", req.user.id],
    ]);

    // Get stats for each group
    const groupsWithStats = await Promise.all(
      groups.map(async (group) => {
        const participants = await db.getAll(db.groupParticipants(group.id));

        const expensesSnapshot = await db
          .expenses()
          .where("groupId", "==", group.id)
          .get();

        const expenses = expensesSnapshot.docs.map((doc) => doc.data());

        const totalSpent = expenses.reduce(
          (sum, exp) => sum + (exp.amount || 0),
          0,
        );

        const lastActivity =
          expenses.length > 0
            ? expenses.sort(
                (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
              )[0].createdAt
            : group.updatedAt;

        return {
          id: group.id,
          name: group.name,
          participants,
          totalSpent: Math.round(totalSpent * 100) / 100,
          lastActivity,
          expenseCount: expenses.length,
        };
      }),
    );

    // Sort by last activity
    groupsWithStats.sort(
      (a, b) => new Date(b.lastActivity) - new Date(a.lastActivity),
    );

    res.json({
      success: true,
      data: groupsWithStats,
    });
  } catch (error) {
    next(error);
  }
});

// Get single group by ID
router.get("/:id", async (req, res, next) => {
  try {
    const group = await getGroupWithData(req.params.id, req.user.id);

    if (!group) {
      throw new NotFoundError("Group not found");
    }

    const totalSpent = group.expenses.reduce((sum, exp) => sum + exp.amount, 0);

    res.json({
      success: true,
      data: {
        ...group,
        totalSpent: Math.round(totalSpent * 100) / 100,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Create new group
router.post("/", async (req, res, next) => {
  try {
    const { error, value } = createGroupSchema.validate(req.body);
    if (error) throw new ValidationError(error.message);

    const { name, participants } = value;

    // Check maximum participants (owner + 3 others = 4 total)
    if (participants.length > 3) {
      throw new ValidationError(
        "Maximum 3 participants allowed (excluding owner)",
      );
    }

    // Create group
    const group = await db.create(db.groups(), {
      name,
      createdById: req.user.id,
    });

    // Create owner participant
    const ownerParticipant = await db.create(db.groupParticipants(group.id), {
      name: req.user.name,
      color: "#10B981",
      isOwner: true,
    });

    // Create other participants
    const otherParticipants = await Promise.all(
      participants.map((p) => db.create(db.groupParticipants(group.id), p)),
    );

    const allParticipants = [ownerParticipant, ...otherParticipants];

    res.status(201).json({
      success: true,
      message: "Group created successfully",
      data: {
        ...group,
        participants: allParticipants,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Update group
router.put("/:id", async (req, res, next) => {
  try {
    const { error, value } = updateGroupSchema.validate(req.body);
    if (error) throw new ValidationError(error.message);

    // Check group exists and user owns it
    const existingGroup = await db.getById(db.groups(), req.params.id);

    if (!existingGroup || existingGroup.createdById !== req.user.id) {
      throw new NotFoundError("Group not found");
    }

    const { name } = value;
    const updateData = {};

    if (name) updateData.name = name;

    await db.update(db.groups(), req.params.id, updateData);

    const participants = await db.getAll(db.groupParticipants(req.params.id));

    res.json({
      success: true,
      message: "Group updated successfully",
      data: {
        ...existingGroup,
        ...updateData,
        participants,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Delete group
router.delete("/:id", async (req, res, next) => {
  try {
    const group = await db.getById(db.groups(), req.params.id);

    if (!group || group.createdById !== req.user.id) {
      throw new NotFoundError("Group not found");
    }

    // Delete all participants (subcollection)
    const participants = await db.getAll(db.groupParticipants(req.params.id));
    await Promise.all(
      participants.map((p) =>
        db.delete(db.groupParticipants(req.params.id), p.id),
      ),
    );

    // Delete all expenses and their splits
    const expensesSnapshot = await db
      .expenses()
      .where("groupId", "==", req.params.id)
      .get();

    for (const expenseDoc of expensesSnapshot.docs) {
      const splits = await db.getAll(db.expenseSplits(expenseDoc.id));
      await Promise.all(
        splits.map((s) => db.delete(db.expenseSplits(expenseDoc.id), s.id)),
      );
      await db.delete(db.expenses(), expenseDoc.id);
    }

    // Delete group
    await db.delete(db.groups(), req.params.id);

    res.json({
      success: true,
      message: "Group deleted successfully",
    });
  } catch (error) {
    next(error);
  }
});

// Get group balances
router.get("/:id/balances", async (req, res, next) => {
  try {
    const group = await getGroupWithData(req.params.id, req.user.id);

    if (!group) {
      throw new NotFoundError("Group not found");
    }

    const balances = calculateGroupBalances(group.expenses, group.participants);
    const settlements = calculateSettlements(balances, group.participants);

    res.json({
      success: true,
      data: {
        balances,
        settlements,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
