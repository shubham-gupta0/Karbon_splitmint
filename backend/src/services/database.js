import { getDb } from "../config/firebase.js";
import { FieldValue } from "firebase-admin/firestore";

/**
 * Firestore Database Service
 * Provides helper methods for common database operations
 */

export const db = {
  // Collections
  users: () => getDb().collection("users"),
  groups: () => getDb().collection("groups"),
  expenses: () => getDb().collection("expenses"),

  // Subcollections
  groupParticipants: (groupId) =>
    getDb().collection("groups").doc(groupId).collection("participants"),
  expenseSplits: (expenseId) =>
    getDb().collection("expenses").doc(expenseId).collection("splits"),

  // Timestamps
  timestamp: () => FieldValue.serverTimestamp(),
  now: () => new Date().toISOString(),

  // Helper: Create document with auto ID
  async create(collectionRef, data) {
    const docRef = collectionRef.doc();
    await docRef.set({
      id: docRef.id,
      ...data,
      createdAt: this.now(),
      updatedAt: this.now(),
    });
    return { id: docRef.id, ...data };
  },

  // Helper: Get document by ID
  async getById(collectionRef, id) {
    const doc = await collectionRef.doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() };
  },

  // Helper: Update document
  async update(collectionRef, id, data) {
    await collectionRef.doc(id).update({
      ...data,
      updatedAt: this.now(),
    });
    return { id, ...data };
  },

  // Helper: Delete document
  async delete(collectionRef, id) {
    await collectionRef.doc(id).delete();
  },

  // Helper: Query with filters
  async query(collectionRef, filters = []) {
    let query = collectionRef;
    filters.forEach(([field, operator, value]) => {
      query = query.where(field, operator, value);
    });
    const snapshot = await query.get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  },

  // Helper: Get all documents
  async getAll(collectionRef) {
    const snapshot = await collectionRef.get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  },

  // Batch operations
  batch: () => getDb().batch(),

  // Transaction support
  runTransaction: (updateFunction) => getDb().runTransaction(updateFunction),
};

export default db;
