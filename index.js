const express = require("express");
const cors = require("cors");
const app = express();
const PORT = 3001;

const itemsRoute = require("./routes/items");
app.use(cors());

app.use(express.json());
app.use("/api/items", itemsRoute);

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
