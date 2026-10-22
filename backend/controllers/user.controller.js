import asyncHandler from '../utilis/asyncHandler.js'
import ApiError from '../utilis/apiError.js';

const userRegister = asyncHandler(async (req, res)=>{
    const { name , email } = req.body;
    if(name == "" || email == ""){
        throw new ApiError(
            "must fill the requiements",
            400,
            false
        )
    };

    
})