import express from "express"
import "dotenv/config"
import cors from "cors"
import http from "http"
import { connectDb } from "./lib/db.js"
import userRouter from "./routes/userRoutes.js"
import msgRoute from "./routes/messageRoutes.js"
import { Server } from "socket.io"
const corsOptions = {
    origin: function (origin, callback) {
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
};


const app = express()
const server = http.createServer(app)

export const io = new Server(server, {
    cors: { origin: "*" }
})

//Store online user
export const userSocketMap = {}
io.on('connection', (socket) => {
    const userId = socket.handshake.query.userId;
    console.log('userConnected', userId)
    if (userId) userSocketMap[userId] = socket.id

    io.emit('getOnlineUsers', Object.keys(userSocketMap));
    socket.on("updateOnlineVisibility", ({ userId, isOnlineVisible }) => {
        socket.broadcast.emit("receiveOnlineVisibilityUpdate", { userId, isOnlineVisible });
    });

    socket.on('disconnect', () => {
        console.log('User offline', userId)
        delete userSocketMap[userId]
        io.emit('getOnlineUsers', Object.keys(userSocketMap));
    })
})

//Middleware
app.use(express.json({ limit: "4mb" }))
app.use(cors(corsOptions));

app.use("/api/auth", userRouter);
app.use("/api/messages", msgRoute);


//Db
await connectDb();

const PORT = process.env.PORT || 5000

server.listen(PORT, () => {
    console.log(`server started at ${PORT}`)
})