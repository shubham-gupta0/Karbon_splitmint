/**
 * Calculate balances for all participants in a group
 * @param {Array} expenses - Array of expense objects with splits
 * @param {Array} participants - Array of participant objects
 * @returns {Object} Balance object { participantId: balance }
 */
export function calculateGroupBalances(expenses, participants) {
  const balances = {};

  // Initialize all participants with 0 balance
  participants.forEach((p) => {
    balances[p.id] = 0;
  });

  // Process each expense
  expenses.forEach((expense) => {
    // Payer gets credited with the full amount
    balances[expense.payerId] =
      (balances[expense.payerId] || 0) + expense.amount;

    // Each split participant gets debited their share
    expense.splits.forEach((split) => {
      balances[split.participantId] =
        (balances[split.participantId] || 0) - split.amount;
    });
  });

  // Round to 2 decimal places
  Object.keys(balances).forEach((key) => {
    balances[key] = Math.round(balances[key] * 100) / 100;
  });

  return balances;
}

/**
 * Calculate optimal settlement transactions
 * @param {Object} balances - Balance object from calculateGroupBalances
 * @param {Array} participants - Array of participant objects
 * @returns {Array} Array of settlement objects { from, to, amount }
 */
export function calculateSettlements(balances, participants) {
  const creditors = [];
  const debtors = [];

  // Separate creditors and debtors
  Object.entries(balances).forEach(([id, balance]) => {
    const participant = participants.find((p) => p.id === id);
    if (!participant) return;

    if (balance > 0.01) {
      creditors.push({ ...participant, amount: balance });
    } else if (balance < -0.01) {
      debtors.push({ ...participant, amount: Math.abs(balance) });
    }
  });

  // Sort by amount descending for greedy algorithm
  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const settlements = [];
  let i = 0,
    j = 0;

  // Greedy matching
  while (i < creditors.length && j < debtors.length) {
    const creditor = creditors[i];
    const debtor = debtors[j];

    const settleAmount = Math.min(creditor.amount, debtor.amount);

    if (settleAmount > 0.01) {
      settlements.push({
        from: {
          id: debtor.id,
          name: debtor.name,
          color: debtor.color,
        },
        to: {
          id: creditor.id,
          name: creditor.name,
          color: creditor.color,
        },
        amount: Math.round(settleAmount * 100) / 100,
      });
    }

    creditor.amount = Math.round((creditor.amount - settleAmount) * 100) / 100;
    debtor.amount = Math.round((debtor.amount - settleAmount) * 100) / 100;

    if (creditor.amount < 0.01) i++;
    if (debtor.amount < 0.01) j++;
  }

  return settlements;
}

/**
 * Calculate split amounts based on split type
 * @param {number} amount - Total expense amount
 * @param {Array} participantIds - Array of participant IDs
 * @param {string} splitType - 'equal', 'custom', or 'percentage'
 * @param {Array} customSplits - Custom split data if splitType is not equal
 * @returns {Array} Array of split objects
 */
export function calculateSplitAmounts(
  amount,
  participantIds,
  splitType = "equal",
  customSplits = [],
) {
  const splits = [];

  if (splitType === "equal") {
    const splitAmount = amount / participantIds.length;
    const roundedSplit = Math.floor(splitAmount * 100) / 100;
    const totalRounded = roundedSplit * participantIds.length;
    const remainder = Math.round((amount - totalRounded) * 100) / 100;

    participantIds.forEach((participantId, index) => {
      splits.push({
        participantId,
        amount: index === 0 ? roundedSplit + remainder : roundedSplit,
        percentage: Math.round((100 / participantIds.length) * 100) / 100,
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
    let totalAmount = 0;

    customSplits.forEach((split, index) => {
      const splitAmount =
        Math.round(((amount * split.percentage) / 100) * 100) / 100;
      totalAmount += splitAmount;

      splits.push({
        participantId: split.participantId,
        amount: splitAmount,
        percentage: split.percentage,
      });
    });

    // Adjust first split for rounding errors
    const diff = Math.round((amount - totalAmount) * 100) / 100;
    if (Math.abs(diff) > 0 && splits.length > 0) {
      splits[0].amount = Math.round((splits[0].amount + diff) * 100) / 100;
    }
  }

  return splits;
}
