import { verifyToken } from "../lib/auth.js";
import { UnauthorizedError } from "../lib/errors.js";
import db from "../services/database.js";

export async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new UnauthorizedError("No token provided");
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (!decoded) {
      throw new UnauthorizedError("Invalid or expired token");
    }

    // Get user from database
    const user = await db.getById(db.users(), decoded.userId);

    if (!user) {
      throw new UnauthorizedError("User not found");
    }

    // Remove password from user object
    const { password, ...userWithoutPassword } = user;

    req.user = userWithoutPassword;
    next();
  } catch (error) {
    next(error);
  }
}
