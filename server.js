const dotenv = require("dotenv");
const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const swaggerJsDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

dotenv.config();
const app = express();
app.use(express.json());

mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ Connected to MongoDB Atlas"))
  .catch((err) => console.error("MongoDB error:", err));


const UserSchema = new mongoose.Schema({
  username: String,
  password: String,
});
const User = mongoose.model("User", UserSchema);

const RecipeSchema = new mongoose.Schema({
  title: String,
  description: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});
const Recipe = mongoose.model("Recipe", RecipeSchema);

const authenticate = (req, res, next) => {
  const token = req.header("Authorization")?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Access denied" });
  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    next();
  } catch {
    res.status(400).json({ error: "Invalid token" });
  }
};

const swaggerOptions = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Recipe API",
            version: "1.0.0",
            description: "A simple API with Recipe CRUD"
        },
        servers: [
            { url: "http://localhost:8080" }, 
            { url: process.env.RAILWAY_STATIC_URL || "http://localhost:3000" } // Railway
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT"
                },
            },
        },
        security: [{ bearerAuth: [] }]
    },
    apis: ["./server.js"],
};
const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));



app.post("/auth/register", async (req, res) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        const user = new User({ username: req.body.username, password: hashedPassword});
        await user.save();
        res.json({ message: "User registered!"});
    } catch (err) {
        res.status(400).json({ error: "Username already exists"});
    }
});

app.post("/auth/login", async (req, res) => {
    const user = await User.findOne({ username: req.body.username });
    if (!user) return res.status(400).json({ error: "User not found"});

    const isPasswordValid = await bcrypt.compare(req.body.password, user.password);
    if (!isPasswordValid) return res.status(401).json({ error: "Invalid password"});

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h"});
    res.json({ token });
});

app.get("/users/me", authMiddleware, async (req, res) => {
    const user = await User.findById(req.userId).select("-password");
    res.json(user);
});

app.get("/recipes", authMiddleware, async (req, res) => {
    const recipes = await Recipe.find({ createdBy: req.userId });
    res.json(recipes);
});

app.get("/recipes/:id", authMiddleware, async (req, res) => {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ error: "Recipe not found"});
    res.json(recipe);
});

app.post("/recipes", authMiddleware, async (req, res) => {
    const recipe = new Recipe({ ...req.body, createdBy: req.userId });
    await recipe.save();
    res.json({ message: "Recipe added!" });
});

app.put("/recipes/:id", authMiddleware, async (req, res) => {
    await Recipe.findByIdAndUpdate(req.params.id, req.body);
    res.json({ message: "Recipe updated!" });
});

app.delete("/recipes/:id", authMiddleware, async (req, res) => {
    await Recipe.findByIdAndDelete(req.params.id);
    res.json({ message: "Recipe deleted!" });
});

app.listen(8080, () => console.log("🚀 Server running on port 8080"));