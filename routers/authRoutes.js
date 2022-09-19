import { Router } from "express";
import {loginUser, registerUser} from "../controllers/auth.js"

import dotEnv from "dotenv"
import jwt from "jsonwebtoken";
dotEnv.config()

const authRoutes = Router();

authRoutes.post("/register",registerUser);
authRoutes.post("/login",loginUser);

function authenticateToken(req,res,next){
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(" ")[1];

    if(token === null) return res.sendStatus(401)
    jwt.verify(token,process.env.ACCESS_TOKEN_SECRET,(err,user)=>{
        if(err) return res.status(403).json({hasErrors:true,errorType:"auth",errors: {user:"Invalid User"}});
        req.user = user;
        next();
    })
}

export default authRoutes
