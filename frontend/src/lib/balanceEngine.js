/**
 * Calculate balances for a group based on expenses
 * @param {Array} expenses - Array of expense objects
 * @param {Array} participants - Array of participant objects
 * @returns {Object} Balance object { participantId: balance }
 */
export function calculateGroupBalances(expenses, participants) {
  const balances = {};

  // Initialize balances to 0
  participants.forEach((p) => {
    balances[p.id] = 0;
  });

  // Process each expense
  expenses.forEach((expense) => {
    // Payer gets credited
    balances[expense.payerId] =
      (balances[expense.payerId] || 0) + expense.amount;

    // Each split participant gets debited
    expense.splits.forEach((split) => {
      balances[split.participantId] =
        (balances[split.participantId] || 0) - split.amount;
    });
  });

  return balances;
}

/**
 * Calculate settlement transactions to minimize payments
 * @param {Object} balances - Balance object { participantId: balance }
 * @param {Array} participants - Array of participant objects
 * @returns {Array} Array of settlement objects { from, to, amount }
 */
export function calculateSettlements(balances, participants) {
  // Create creditors (positive balance) and debtors (negative balance) arrays
  const creditors = [];
  const debtors = [];

  Object.entries(balances).forEach(([id, balance]) => {
    const participant = participants.find((p) => p.id === id);
    if (!participant) return;

    if (balance > 0.01) {
      creditors.push({ ...participant, amount: balance });
    } else if (balance < -0.01) {
      debtors.push({ ...participant, amount: Math.abs(balance) });
    }
  });

  // Sort by amount (largest first) for greedy algorithm
  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const settlements = [];
  let i = 0,
    j = 0;

  // Greedy matching algorithm
  while (i < creditors.length && j < debtors.length) {
    const creditor = creditors[i];
    const debtor = debtors[j];

    const settleAmount = Math.min(creditor.amount, debtor.amount);

    if (settleAmount > 0.01) {
      settlements.push({
        from: { id: debtor.id, name: debtor.name },
        to: { id: creditor.id, name: creditor.name },
        amount: Math.round(settleAmount * 100) / 100,
      });
    }

    creditor.amount -= settleAmount;
    debtor.amount -= settleAmount;

    if (creditor.amount < 0.01) i++;
    if (debtor.amount < 0.01) j++;
  }

  return settlements;
}

/**
 * Calculate split amounts based on split type
 * @param {number} amount - Total expense amount
 * @param {Array} participants - Array of participant IDs involved
 * @param {string} splitType - Type of split (equal/custom/percentage)
 * @param {Array} customSplits - Custom split data (for custom/percentage splits)
 * @returns {Array} Array of split objects { participantId, amount, percentage }
 */
export function calculateSplitAmounts(
  amount,
  participants,
  splitType = "equal",
  customSplits = [],
) {
  const splits = [];

  if (splitType === "equal") {
    const splitAmount = Math.round((amount / participants.length) * 100) / 100;
    const totalSplit = splitAmount * participants.length;
    const remainder = Math.round((amount - totalSplit) * 100) / 100;

    participants.forEach((participantId, index) => {
      splits.push({
        participantId,
        amount: index === 0 ? splitAmount + remainder : splitAmount,
        percentage: Math.round((100 / participants.length) * 100) / 100,
      });
    });
  } else if (splitType === "custom") {
    customSplits.forEach((split) => {
      splits.push({
        participantId: split.participantId,
        amount: split.amount,
        percentage: Math.round((split.amount / amount) * 100 * 100) / 100,
      });
    });
  } else if (splitType === "percentage") {
    customSplits.forEach((split) => {
      const splitAmount =
        Math.round(((amount * split.percentage) / 100) * 100) / 100;
      splits.push({
        participantId: split.participantId,
        amount: splitAmount,
        percentage: split.percentage,
      });
    });

    // Adjust for rounding errors
    const totalSplit = splits.reduce((sum, s) => sum + s.amount, 0);
    const diff = Math.round((amount - totalSplit) * 100) / 100;
    if (diff !== 0 && splits.length > 0) {
      splits[0].amount = Math.round((splits[0].amount + diff) * 100) / 100;
    }
  }

  return splits;
}

/**
 * Validate custom split amounts
 * @param {number} totalAmount - Total expense amount
 * @param {Array} splits - Array of custom splits
 * @returns {Object} Validation result { valid, error, remaining }
 */
export function validateCustomSplits(totalAmount, splits) {
  const total = splits.reduce((sum, split) => sum + (split.amount || 0), 0);
  const remaining = Math.round((totalAmount - total) * 100) / 100;

  if (Math.abs(remaining) < 0.01) {
    return { valid: true, remaining: 0 };
  }

  return {
    valid: false,
    error:
      remaining > 0
        ? `$${Math.abs(remaining).toFixed(2)} remaining to split`
        : `Over by $${Math.abs(remaining).toFixed(2)}`,
    remaining,
  };
}

/**
 * Validate percentage splits
 * @param {Array} splits - Array of percentage splits
 * @returns {Object} Validation result { valid, error, remaining }
 */
export function validatePercentageSplits(splits) {
  const total = splits.reduce((sum, split) => sum + (split.percentage || 0), 0);
  const remaining = Math.round((100 - total) * 100) / 100;

  if (Math.abs(remaining) < 0.01) {
    return { valid: true, remaining: 0 };
  }

  return {
    valid: false,
    error:
      remaining > 0
        ? `${Math.abs(remaining).toFixed(2)}% remaining`
        : `Over by ${Math.abs(remaining).toFixed(2)}%`,
    remaining,
  };
}
