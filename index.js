import Express from "express"
import baseRoutes from "./routers/baseRoutes.js"
import authRoutes from "./routers/authRoutes.js"

const PORT = 80

const app =  Express()
app.use(Express.urlencoded({extended:true}))
app.use("",baseRoutes)
app.use("/auth",authRoutes)

app.listen(PORT,()=>{
    console.log(`Listening at PORT : ${PORT}`)
})

