import Express from "express"
import base_route from "./routers/baseroutes.js"
import authRoutes from "./routers/authRoutes.js"

const PORT = 80

const app =  Express()
app.use(Express.urlencoded({extended:true}))
app.use("",base_route)
app.use("/auth",authRoutes)

app.listen(PORT,()=>{
    console.log(`Listening at PORT: ${PORT}`)
})

