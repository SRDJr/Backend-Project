import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {User} from "../models/user.js";
import {uploadOnCloudinary} from "../../config/uploadOnCloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

const generateAccessAndRefreshToken = async (userId) => {
    try{
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken;
        const refreshToken = user.generateRdefreshToken;

        user.refreshToken = refreshToken;
        await user.save({validateBeforeSave: false});

        return {accessToken, refreshToken};
    }
    catch(err){
        throw new ApiError(500, "Something went wrong!! Please try logging in after some time.");
    }
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
    const userExists = await User.find(({
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
    const coverImage = null;
    if(coverImageLocalPath){
        coverImage = await uploadOnCloudinary(coverImageLocalPath);
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

export const logInUser = asyncHandler(async (req, res) => {
    //step 1: get details from frontend
    //step 2: check username or email
    //step 3: find the user
    //step 4: verify password
    //step 5: generate access and refresh tokens
    //step 6: send cookies

    //step 1
    const{username, email, password} = req.body;

    //step 2
    if(!username || !email){
        throw new ApiError(400, "username or email is required!!");
    }
    if(!password){
        throw new ApiError(400, "Password is required!!");
    }

    //step 3
    const user = await User.findOne(({
        $or: [{username}, {email}]
    }));

    if(!user){
        throw new ApiError(404, "User not found!!");
    }

    //step 4
    const isValidPassword = await user.isPasswordCorrect(password);

    if(!isValidPassword){
        throw new ApiError(401, "Invalid Password!!");
    }

    //step 5
    const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id);

    //step 6
    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    const options = {
        httpOnly: true,
        secure: true
    };

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(200, {
            user: loggedInUser, accessToken, refreshToken
        }, "User logged in successfully")
    )

})

export const logOutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(
        new ApiResponse(200, {}, "User logged out successfully")
    )
})

export const refreshAccessToken = asyncHandler(async (req, res) => {
    
    const userRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if(!userRefreshToken){
        throw new ApiError(401, "Unauthorized Request !");
    }
    
    try {
        const decodedRefreshToken = jwt.verify(userRefreshToken, process.env.REFRESH_TOKEN_SECRET);
    
        const user = await User.findById(decodedRefreshToken?._id);
    
        if(!user){
            throw new ApiError(401, "Invalid Refresh Token !");
        }
    
        if(userRefreshToken != user?.refreshToken){
            throw new ApiError(401, "Invalid Refresh Token !");
        }
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        const {newAccessToken, newRefreshToken} = await generateAccessAndRefreshToken(user._id);
    
        return res
        .status(200)
        .cookie("accessToken", newAccessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(200, 
                {accessToken: newAccessToken,
                 refreshToken: newRefreshToken},
                "Access token refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token !");
    }

})

export const changeCurrentPassword = asyncHandler(async (req, res) => {
    
    const {oldPassword, newPassword, confPassword} = req.body;

    if(newPassword !== confPassword){
        throw new ApiError(400, "Both Passwords must match !");
    }

    const user = User.findById(req.user?._id);

    const isValidPassword = await user.isPasswordCorrect(oldPassword);

    if(!isValidPassword){
        throw new ApiError(400, "Invalid Password !");
    }

    user.password = newPassword;
    await user.save({validateBeforeSave: false});

    return res
    .status(200)
    .json(
        new ApiResponse(200,{},
            "Password changed successfully"
        )
    )
})

export const getCurrentUser = asyncHandler(async (req, res) => {
    return res
    .status(200)
    .json(
        new ApiResponse(200,
            req.user,
            "Current User fetched successfully"
        )
    )
})

export const updateAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path;
    
    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is missing !");
    }

    const newAvatar = await uploadOnCloudinary(avatarLocalPath);

    if(!newAvatar.url){
        throw new ApiError(500, "Something went wrong while uploading the Avatar file !");
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: newAvatar.url
            }
        },
        {
            new: true
        }
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200,
            user, 
            "Avatar updated successfully"
        )
    )
})

export const updateCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path;
    
    if(!coverImageLocalPath){
        throw new ApiError(400, "Cover Image file is missing !");
    }

    const newCoverImage = await uploadOnCloudinary(coverImageLocalPath);

    if(!newCoverImage.url){
        throw new ApiError(500, "Something went wrong while uploading the Cover Image file !");
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: newCoverImage.url
            }
        },
        {
            new: true
        }
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200,
            user, 
            "Cover Image updated successfully"
        )
    )
})