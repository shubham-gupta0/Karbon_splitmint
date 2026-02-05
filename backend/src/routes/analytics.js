import express from "express";
import db from "../services/database.js";
import { authenticate } from "../middleware/authenticate.js";
import { NotFoundError } from "../lib/errors.js";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get analytics summary for a group
router.get("/summary/:groupId", async (req, res, next) => {
  try {
    const { groupId } = req.params;

    // Verify group exists and user owns it
    const group = await db.getById(db.groups(), groupId);

    if (!group || group.createdById !== req.user.id) {
      throw new NotFoundError("Group not found");
    }

    // Get participants
    const participants = await db.getAll(db.groupParticipants(groupId));

    // Get all expenses
    const expensesSnapshot = await db
      .expenses()
      .where("groupId", "==", groupId)
      .get();

    const expenses = [];
    for (const expenseDoc of expensesSnapshot.docs) {
      const expenseData = { id: expenseDoc.id, ...expenseDoc.data() };
      const splits = await db.getAll(db.expenseSplits(expenseDoc.id));
      expenses.push({
        ...expenseData,
        splits,
      });
    }

    // Calculate totals
    const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const totalExpenses = expenses.length;
    const averageExpense = totalExpenses > 0 ? totalSpent / totalExpenses : 0;

    // Category breakdown
    const categoryBreakdown = {};
    expenses.forEach((exp) => {
      const category = exp.category || "other";
      categoryBreakdown[category] =
        (categoryBreakdown[category] || 0) + exp.amount;
    });

    // Participant contributions
    const participantContributions = participants.map((participant) => {
      const totalPaid = expenses
        .filter((exp) => exp.payerId === participant.id)
        .reduce((sum, exp) => sum + exp.amount, 0);

      return {
        id: participant.id,
        name: participant.name,
        color: participant.color,
        amount: Math.round(totalPaid * 100) / 100,
        percentage:
          totalSpent > 0 ? Math.round((totalPaid / totalSpent) * 100) : 0,
      };
    });

    res.json({
      success: true,
      data: {
        totalSpent: Math.round(totalSpent * 100) / 100,
        totalExpenses,
        averageExpense: Math.round(averageExpense * 100) / 100,
        categoryBreakdown,
        participantContributions: participantContributions.sort(
          (a, b) => b.amount - a.amount,
        ),
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
