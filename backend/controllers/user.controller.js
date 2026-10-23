
import asyncHandler from "../utilis/asyncHandler.js";
import ApiError from "../utilis/apiError.js";
import ApiResponse from "../utilis/apiResponse.js";
import { pool } from "../db/index.js";

export const userRegister = asyncHandler(async (req, res) => {
  const { name, email } = req.body;

  if (!name?.trim() || !email?.trim()) {
    throw new ApiError(400, "Name and email are required");
  }

  const result = await pool.query(
    `INSERT INTO public.users (name, email)
     VALUES ($1, $2)
     RETURNING id, name, email, created_at`,
    [name.trim(), email.trim().toLowerCase()]
  );

  return res.status(201).json(
    new ApiResponse(
      201,
      result.rows[0],
      "User registered successfully"
    )
  );
});
