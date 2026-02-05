import Joi from "joi";

export const registerSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

export const createGroupSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  participants: Joi.array()
    .items(
      Joi.object({
        name: Joi.string().min(1).max(100).required(),
        color: Joi.string()
          .pattern(/^#[0-9A-F]{6}$/i)
          .required(),
      }),
    )
    .min(1)
    .max(3)
    .required(),
});

export const updateGroupSchema = Joi.object({
  name: Joi.string().min(1).max(100),
  participants: Joi.array()
    .items(
      Joi.object({
        id: Joi.string(),
        name: Joi.string().min(1).max(100).required(),
        color: Joi.string()
          .pattern(/^#[0-9A-F]{6}$/i)
          .required(),
      }),
    )
    .min(1)
    .max(4),
});

export const createExpenseSchema = Joi.object({
  groupId: Joi.string().required(),
  amount: Joi.number().positive().required(),
  description: Joi.string().min(1).max(200).required(),
  date: Joi.date()
    .iso()
    .default(() => new Date()),
  payerId: Joi.string().required(),
  category: Joi.string()
    .valid(
      "food",
      "transport",
      "entertainment",
      "utilities",
      "shopping",
      "healthcare",
      "travel",
      "education",
      "other",
    )
    .default("other"),
  splitType: Joi.string()
    .valid("equal", "custom", "percentage")
    .default("equal"),
  participants: Joi.array().items(Joi.string()).min(1).required(),
  customSplits: Joi.array().items(
    Joi.object({
      participantId: Joi.string().required(),
      amount: Joi.number().positive(),
      percentage: Joi.number().min(0).max(100),
    }),
  ),
});

export const updateExpenseSchema = Joi.object({
  amount: Joi.number().positive(),
  description: Joi.string().min(1).max(200),
  date: Joi.date().iso(),
  payerId: Joi.string(),
  category: Joi.string().valid(
    "food",
    "transport",
    "entertainment",
    "utilities",
    "shopping",
    "healthcare",
    "travel",
    "education",
    "other",
  ),
  splitType: Joi.string().valid("equal", "custom", "percentage"),
  participants: Joi.array().items(Joi.string()).min(1),
  customSplits: Joi.array().items(
    Joi.object({
      participantId: Joi.string().required(),
      amount: Joi.number().positive(),
      percentage: Joi.number().min(0).max(100),
    }),
  ),
});
