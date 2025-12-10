// import express from "express";
// import cors from "cors";
// import cookieParser from "cookie-parser";
// import Clientrouter from "./routes/client.route.js"
// import MenuRouter from "./routes/menu.route.js"
// import AdminRouter from "./routes/admin.route.js"

// const app = express();

// app.use(
//   cors({
//     origin:process.env.CORS_ORIGIN.split(",").map((e)=>e.trim()),
//     sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
//     credentials: true,
//   })
// );

// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));
// app.use(express.static("public"));
// app.use(cookieParser());

// app.use("/client",Clientrouter);
// app.use("/home",MenuRouter);
// app.use("/admin",AdminRouter);

// export { app };
// app.js or server.js - Add this to your main server file
import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";

// Import routes
import clientRoutes from "./routes/client.route.js";
import notificationRoutes from "./routes/notification.route.js";
// import Clientrouter from "./routes/client.route.js"
import MenuRouter from "./routes/menu.route.js"
import AdminRouter from "./routes/admin.route.js"
// ... other routes

import { startAllCrons } from "./utils/cron/index.js";

dotenv.config();

const app = express();
const server = http.createServer(app);

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTENED_URL,
    credentials: true
  }
});

// Make io globally available for NotificationService
global.io = io;

// Middleware
app.use(cors({
  origin: process.env.FRONTENED_URL,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
app.use("/client", clientRoutes);
app.use("/notifications", notificationRoutes);
app.use("/home",MenuRouter);
app.use("/admin",AdminRouter);

// ... other routes

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join user's personal room
  socket.on('join', (userId) => {
    socket.join(`user_${userId}`);
    console.log(`User ${userId} joined room`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Start CRON jobs
startAllCrons();

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal server error"
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(` Server running on port ${PORT}`);
  console.log(` Socket.IO ready`);
  console.log(` Push notifications configured`);
});
export { app };

