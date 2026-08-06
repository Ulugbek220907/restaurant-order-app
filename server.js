const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// In-memory order store (simple MVP, no database needed)
let orders = [];
let nextId = 1;

// Make will POST here with the parsed order data
// Expected body: { "seat": "5", "items": ["2x Lag'mon", "1x Cola"], "waiter": "Aziz" }
app.post("/order", (req, res) => {
  const { seat, items, waiter } = req.body;

  if (!seat || !items) {
    return res.status(400).json({ error: "seat and items are required" });
  }

  const order = {
    id: nextId++,
    seat,
    items: Array.isArray(items) ? items : [items],
    waiter: waiter || "Unknown",
    time: new Date().toISOString(),
    status: "new"
  };

  orders.unshift(order); // newest first
  console.log("New order received:", order);
  res.json({ success: true, order });
});

// Frontend polls this to get current orders
app.get("/orders", (req, res) => {
  res.json(orders);
});

// Mark an order as done (optional, for kitchen use)
app.post("/order/:id/done", (req, res) => {
  const id = parseInt(req.params.id);
  const order = orders.find(o => o.id === id);
  if (!order) return res.status(404).json({ error: "not found" });
  order.status = "done";
  res.json({ success: true });
});

// Clear all orders (optional utility)
app.post("/orders/clear", (req, res) => {
  orders = [];
  res.json({ success: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Restaurant order server running on port ${PORT}`);
});
