import asyncHandler from '../utilis/asyncHandler.js'
import ApiError from '../utilis/apiError.js';
import ApiResponse from '../utilis/apiResponse.js'
import { pool } from '../db/index.js'

const userRegister = asyncHandler(async (req, res)=>{
    const { name , email } = req.body;
    if(name == "" || email == ""){
        throw new ApiError(
            400,
            "must fill the requiements",
        )
    };

    try{
        const result = await pool.query(
            `INSERT INTO public.users (name, email)
            VALUES ($1 $2 $3)
            RETURNING id, name, email, created_at`,
            [name, email]
        );

        return new ApiResponse(
            201,
            "user is registered",
            result.row[0]
        )
    } catch(error){
        console.error(`error while registering the user ${error}`);
    }
    
});