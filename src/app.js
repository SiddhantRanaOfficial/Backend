import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app = express()

// Registering middlewares

app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true
}))

app.use(express.json({
  limit: "16kb"
}))

app.use(express.urlencoded({ extended: true, limit: "16kb" }))

app.use(express.static("public"))

app.use(cookieParser())

// Routes import

import userRouter from './routes/user.routes.js'

// Routes declaration

app.use("/api/v1/users", userRouter)

app.get("/", (req, res) => {
  res.send("Hello G")
}
)

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500
  const message = err.message || "Internal server error"
  console.error("========== ERROR ==========");
  console.error("Message:", err.message);
  console.error("Status Code:", err.statusCode);
  console.error("Stack:", err.stack);
  console.error("===========================");
  return res.status(statusCode).json({
    statusCode,
    data: err.data ?? null,
    success: false,
    errors: err.errors || [],
    message
  })
})


export { app }
