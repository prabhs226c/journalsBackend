import { Router } from "express";
import jwt from "jsonwebtoken";
import {deleteJournal, getJournals, getSingleJournal, saveJournal, updateJournal} from "../controllers/journals.js";

const baseRoutes = Router();

baseRoutes.get("/journals",authenticateToken,getJournals);
baseRoutes.get("/journal/:id",authenticateToken,getSingleJournal);
baseRoutes.delete("/journal/:id",authenticateToken,deleteJournal);
baseRoutes.put("/journal/:id",authenticateToken,updateJournal);
baseRoutes.post("/journal",authenticateToken,saveJournal);


function authenticateToken(req,res,next){
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(" ")[1];

    if(token === null) return res.sendStatus(401)
    jwt.verify(token,process.env.ACCESS_TOKEN_SECRET,(err,user)=>{
        if(err) return res.status(403).json({hasErrors:true,errors: {user:"Invalid User"}});
        req.user = user;
        next();
    })
}
export default baseRoutes
