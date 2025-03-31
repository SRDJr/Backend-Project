import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {User} from "../models/user.js";
import {uploadOnCloudinary} from "../../config/uploadOnCloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

export const registerUser = asyncHandler(async (req, res) => {
    //step1 : get user details from frontend
    //step 2: validation (like not empty)
    //step 3: check if user already exists (username or email)
    //step 4: check for images and avatar
    //step 5: upload images to cloudinary
    //step 6: create user object - create entry in database
    //step 7: remove password and refresh token fields from response
    //step 8: check for user creation
    //step 9: return response

    //step 1
    const {username, fullname, email, password} = req.body

    //step 2
    if(fullname == ""){
        throw new ApiError(400, "Full Name is required!!");
    }
    else if(username == ""){
        throw new ApiError(400, "User Name is required!!");
    }
    else if(email == ""){
        throw new ApiError(400, "Email is required!!");
    }
    else if(password == ""){
        throw new ApiError(400, "Password is required!!");
    }
    else if(!isValidEmail(email)){
        throw new ApiError(400, "Invalid email!!");
    }

    //step 3
    const userExists = User.find(({
        $or: [{username}, {email}]
    }));

    if(userExists){
        throw new ApiError(409, "User already exists!");
    }

    //step 4
    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;
    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar is required!!");
    }

    //step 5
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    if(coverImageLocalPath){
        const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    } 

    //step 6
    const user = await User.create({
        fullname,
        avatar: avatar.url, 
        coverImage: coverImage?.url || "",
        email,
        password,
        username
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    if(!createdUser){
        throw new ApiError(500, "Something went wrong while registering the user");
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User Registered Successfully!!")
    )

})