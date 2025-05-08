const express = require("express");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");

const app = express();
const PORT = 3000;
const JWT_SECRET = "your_jwt_secret"; // Replace with environment variable in production
const USERS_FILE = path.join(__dirname, "users.json");

app.use(cors());
app.use(express.json());

function loadUsers() {
    if (!fs.existsSync(USERS_FILE)) return [];
    const data = fs.readFileSync(USERS_FILE, "utf-8");
    return JSON.parse(data);
}

function saveUsers(users) {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

// Sign up
app.post("/api/signup", async (req, res) => {
    const { email, password } = req.body;
    const users = loadUsers();
    if (users.find(u => u.email === email)) {
        return res.status(400).send("User already exists");
    }
    const hash = await bcrypt.hash(password, 10);
    users.push({ email, password: hash, library: [] });
    saveUsers(users);
    res.status(201).send("User created");
});

// Log in
app.post("/api/login", async (req, res) => {
    const { email, password } = req.body;
    const users = loadUsers();
    const user = users.find(u => u.email === email);
    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).send("Invalid credentials");
    }
    const token = jwt.sign({ email }, JWT_SECRET);
    res.json({ token });
});

// Your Library (requires auth)
app.get("/api/library", (req, res) => {
    const auth = req.headers.authorization;
    if (!auth) return res.status(401).send("Missing token");

    try {
        const token = auth.split(" ")[1];
        const { email } = jwt.verify(token, JWT_SECRET);
        const users = loadUsers();
        const user = users.find(u => u.email === email);
        if (!user) return res.status(404).send("User not found");
        res.json(user.library);
    } catch {
        res.status(401).send("Invalid token");
    }
});

// Home route
app.get("/api/home", (req, res) => {
    res.send("🎵 Welcome to Music Home!");
});

app.listen(PORT, () => console.log("Server running at http://localhost:" + PORT));
