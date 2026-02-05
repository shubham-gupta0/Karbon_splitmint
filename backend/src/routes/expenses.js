import express from "express";
import db from "../services/database.js";
import { authenticate } from "../middleware/authenticate.js";
import { ValidationError, NotFoundError } from "../lib/errors.js";
import {
  createExpenseSchema,
  updateExpenseSchema,
} from "../utils/validators.js";
import { calculateSplitAmounts } from "../utils/balanceEngine.js";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get all expenses for a group with filters
router.get("/", async (req, res, next) => {
  try {
    const {
      groupId,
      search,
      participantId,
      dateFrom,
      dateTo,
      sortBy = "date",
      sortOrder = "desc",
    } = req.query;

    if (!groupId) {
      throw new ValidationError("groupId is required");
    }

    // Verify user owns the group
    const group = await db.getById(db.groups(), groupId);

    if (!group || group.createdById !== req.user.id) {
      throw new NotFoundError("Group not found");
    }

    // Get all expenses for the group
    let query = db.expenses().where("groupId", "==", groupId);

    // Apply date filters
    if (dateFrom) {
      query = query.where("date", ">=", new Date(dateFrom).toISOString());
    }
    if (dateTo) {
      query = query.where("date", "<=", new Date(dateTo).toISOString());
    }

    // Apply sorting
    query = query.orderBy(sortBy === "amount" ? "amount" : "date", sortOrder);

    const expensesSnapshot = await query.get();

    // Get participants for the group
    const participants = await db.getAll(db.groupParticipants(groupId));

    // Process expenses with filters and populate related data
    const expenses = [];
    for (const expenseDoc of expensesSnapshot.docs) {
      const expenseData = { id: expenseDoc.id, ...expenseDoc.data() };

      // Apply search filter
      if (
        search &&
        !expenseData.description.toLowerCase().includes(search.toLowerCase())
      ) {
        continue;
      }

      // Get splits
      const splits = await db.getAll(db.expenseSplits(expenseDoc.id));

      // Apply participant filter
      if (participantId) {
        const isPayerOrInSplit =
          expenseData.payerId === participantId ||
          splits.some((s) => s.participantId === participantId);
        if (!isPayerOrInSplit) continue;
      }

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

    res.json({
      success: true,
      data: expenses,
    });
  } catch (error) {
    next(error);
  }
});

// Get single expense
router.get("/:id", async (req, res, next) => {
  try {
    const expense = await db.getById(db.expenses(), req.params.id);

    if (!expense) {
      throw new NotFoundError("Expense not found");
    }

    // Get group and verify user ownership
    const group = await db.getById(db.groups(), expense.groupId);

    if (!group || group.createdById !== req.user.id) {
      throw new NotFoundError("Expense not found");
    }

    // Get participants
    const participants = await db.getAll(db.groupParticipants(expense.groupId));

    // Get payer
    const payer = participants.find((p) => p.id === expense.payerId);

    // Get splits
    const splits = await db.getAll(db.expenseSplits(req.params.id));
    const splitsWithParticipants = splits.map((split) => ({
      ...split,
      participant: participants.find((p) => p.id === split.participantId),
    }));

    res.json({
      success: true,
      data: {
        ...expense,
        group,
        payer,
        splits: splitsWithParticipants,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Create expense
router.post("/", async (req, res, next) => {
  try {
    const { error, value } = createExpenseSchema.validate(req.body);
    if (error) throw new ValidationError(error.message);

    const {
      groupId,
      amount,
      description,
      date,
      payerId,
      category,
      splitType,
      participants,
      customSplits,
    } = value;

    // Verify group exists and user owns it
    const group = await db.getById(db.groups(), groupId);

    if (!group || group.createdById !== req.user.id) {
      throw new NotFoundError("Group not found");
    }

    // Get all participants
    const groupParticipants = await db.getAll(db.groupParticipants(groupId));

    // Verify payer exists in group
    const payer = groupParticipants.find((p) => p.id === payerId);
    if (!payer) {
      throw new ValidationError("Payer must be a participant in the group");
    }

    // Verify all participants exist in group
    const validParticipants = participants.every((pid) =>
      groupParticipants.some((p) => p.id === pid),
    );
    if (!validParticipants) {
      throw new ValidationError(
        "All participants must be members of the group",
      );
    }

    // Calculate splits
    const splits = calculateSplitAmounts(
      amount,
      participants,
      splitType,
      customSplits,
    );

    // Verify splits add up to total amount
    const totalSplits = splits.reduce((sum, split) => sum + split.amount, 0);
    if (Math.abs(totalSplits - amount) > 0.01) {
      throw new ValidationError(
        "Split amounts must equal total expense amount",
      );
    }

    // Create expense
    const expense = await db.create(db.expenses(), {
      groupId,
      amount,
      description,
      date: date || new Date().toISOString(),
      payerId,
      category,
    });

    // Create splits
    const createdSplits = await Promise.all(
      splits.map((split) => db.create(db.expenseSplits(expense.id), split)),
    );

    // Attach participant info
    const splitsWithParticipants = createdSplits.map((split) => ({
      ...split,
      participant: groupParticipants.find((p) => p.id === split.participantId),
    }));

    res.status(201).json({
      success: true,
      message: "Expense created successfully",
      data: {
        ...expense,
        payer,
        splits: splitsWithParticipants,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Update expense
router.put("/:id", async (req, res, next) => {
  try {
    const { error, value } = updateExpenseSchema.validate(req.body);
    if (error) throw new ValidationError(error.message);

    // Verify expense exists and user owns the group
    const existingExpense = await db.getById(db.expenses(), req.params.id);

    if (!existingExpense) {
      throw new NotFoundError("Expense not found");
    }

    const group = await db.getById(db.groups(), existingExpense.groupId);

    if (!group || group.createdById !== req.user.id) {
      throw new NotFoundError("Expense not found");
    }

    const {
      amount,
      description,
      date,
      payerId,
      category,
      splitType,
      participants,
      customSplits,
    } = value;

    // Delete existing splits if amount or participants changed
    if (amount || participants) {
      const existingSplits = await db.getAll(db.expenseSplits(req.params.id));
      await Promise.all(
        existingSplits.map((split) =>
          db.delete(db.expenseSplits(req.params.id), split.id),
        ),
      );
    }

    // Calculate new splits if needed
    let newSplits = null;
    if (amount && participants) {
      newSplits = calculateSplitAmounts(
        amount,
        participants,
        splitType || "equal",
        customSplits,
      );
    }

    // Update expense
    const updateData = {};
    if (amount !== undefined) updateData.amount = amount;
    if (description) updateData.description = description;
    if (date) updateData.date = date;
    if (payerId) updateData.payerId = payerId;
    if (category) updateData.category = category;

    await db.update(db.expenses(), req.params.id, updateData);

    // Create new splits if provided
    if (newSplits) {
      await Promise.all(
        newSplits.map((split) =>
          db.create(db.expenseSplits(req.params.id), split),
        ),
      );
    }

    // Get updated data
    const groupParticipants = await db.getAll(
      db.groupParticipants(existingExpense.groupId),
    );
    const payer = groupParticipants.find(
      (p) => p.id === (payerId || existingExpense.payerId),
    );
    const splits = await db.getAll(db.expenseSplits(req.params.id));
    const splitsWithParticipants = splits.map((split) => ({
      ...split,
      participant: groupParticipants.find((p) => p.id === split.participantId),
    }));

    res.json({
      success: true,
      message: "Expense updated successfully",
      data: {
        ...existingExpense,
        ...updateData,
        payer,
        splits: splitsWithParticipants,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Delete expense
router.delete("/:id", async (req, res, next) => {
  try {
    const expense = await db.getById(db.expenses(), req.params.id);

    if (!expense) {
      throw new NotFoundError("Expense not found");
    }

    const group = await db.getById(db.groups(), expense.groupId);

    if (!group || group.createdById !== req.user.id) {
      throw new NotFoundError("Expense not found");
    }

    // Delete all splits
    const splits = await db.getAll(db.expenseSplits(req.params.id));
    await Promise.all(
      splits.map((split) =>
        db.delete(db.expenseSplits(req.params.id), split.id),
      ),
    );

    // Delete expense
    await db.delete(db.expenses(), req.params.id);

    res.json({
      success: true,
      message: "Expense deleted successfully",
    });
  } catch (error) {
    next(error);
  }
});

export default router;
