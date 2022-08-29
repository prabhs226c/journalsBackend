import { Router } from "express";

const baseroutes = Router();

baseroutes.post("/",(req,res)=>{
    res.json(req.body)
})

export default baseroutes
