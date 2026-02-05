import express from "express";
import bcrypt from "bcryptjs";
import db from "../services/database.js";
import { generateToken } from "../lib/auth.js";
import {
  ValidationError,
  ConflictError,
  UnauthorizedError,
} from "../lib/errors.js";
import { registerSchema, loginSchema } from "../utils/validators.js";

const router = express.Router();

// Register
router.post("/register", async (req, res, next) => {
  try {
    const { error, value } = registerSchema.validate(req.body);
    if (error) throw new ValidationError(error.message);

    const { name, email, password } = value;

    // Check if user exists
    const existingUsers = await db.query(db.users(), [["email", "==", email]]);

    if (existingUsers.length > 0) {
      throw new ConflictError("Email already registered");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await db.create(db.users(), {
      name,
      email,
      password: hashedPassword,
    });

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: userWithoutPassword,
    });
  } catch (error) {
    next(error);
  }
});

// Login
router.post("/login", async (req, res, next) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) throw new ValidationError(error.message);

    const { email, password } = value;

    // Find user
    const users = await db.query(db.users(), [["email", "==", email]]);
    const user = users[0];

    if (!user) {
      throw new UnauthorizedError("Invalid credentials");
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      throw new UnauthorizedError("Invalid credentials");
    }

    // Generate JWT
    const token = generateToken({ userId: user.id });

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
