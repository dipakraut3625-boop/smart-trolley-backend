require("dotenv").config();

const express = require("express");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const fs = require("fs");
const billsDir = path.join(__dirname, "bills");

if (!fs.existsSync(billsDir)) {
  fs.mkdirSync(billsDir);
}

// ================= MIDDLEWARE =================
app.use(express.json());

// Serve PDF bills
app.use("/bills", express.static(path.join(__dirname, "bills")));

// Serve frontend files
app.use(express.static(path.join(__dirname, "public")));

// Attach socket to app
app.set("io", io);

// ================= ROUTES =================
const billRoutes = require("./routes/billRoutes");
app.use("/api", billRoutes);

// Home
app.get("/", (req, res) => {
  res.send("🚀 Smart Trolley Backend Running");
});

// Bill page
app.get("/bill/:id", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "bill.html"));
});

// Admin dashboard
app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin.html"));
});

// ================= SOCKET.IO =================
io.on("connection", (socket) => {
  console.log("🟢 New client connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("🔴 Client disconnected:", socket.id);
  });
});

// ================= SERVER =================
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});