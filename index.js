import Express from "express"
import baseRoutes from "./routers/baseRoutes.js"
import authRoutes from "./routers/authRoutes.js"
import cors from "cors";
import bodyParser from "body-parser";

const PORT = 81

const app =  Express()
app.use(cors())
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())
app.use(Express.urlencoded({extended:true}))
app.use("",baseRoutes)
app.use("/auth",authRoutes)

app.listen(PORT,()=>{
    console.log(`Listening at PORT : ${PORT}`)
})

