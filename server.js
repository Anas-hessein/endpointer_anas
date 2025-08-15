const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})

.then(() => console.log("✅ Connected to MongoDB Atlas"))
.catch(err => console.error("❌ MongoDB connection error:", err));

const recipeSchema = new mongoose.Schema({
    title: String,
    ingredients: [String],
    instructions: String
});

const Recipe = mongoose.model("Recipe", recipeSchema);

app.post("/recipes", async (req, res) => {
    const recipe = new Recipe(req.body);
    await recipe.save();
    res.json({ message: "Recipe added!"});
});

app.get("/recipes", async (req, res) => {
    const recipes = await Recipe.find();
    res.json(recipes);
});

app.put("/recipes/:id", async (req, res) => {
    await Recipe.findByIdAndUpdate(req.params.id, req.body);
    res.json({ message: "Recipe updated!"});
});

app.delete("/recipes/:id", async (req, res) => {
    await Recipe.findByIdAndDelete(req.params.id);
    res.json({ message: "Recipe deleted!"});
});

app.listen(3000, () => console.log("🚀 Server running on port 3000"));
