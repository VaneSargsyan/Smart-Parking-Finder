const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// Fake database
let parkings = [
  { id: 1, name: "Abovyan St", lat: 40.1792, lng: 44.4991, free: 5 },
  { id: 2, name: "Sayat-Nova Ave", lat: 40.181, lng: 44.505, free: 0 },
  { id: 3, name: "Mashtots Ave", lat: 40.175, lng: 44.49, free: 10 },
];

// GET all parkings
app.get("/parkings", (req, res) => {
  res.json(parkings);
});

// TAKE spot
app.post("/parkings/:id/take", (req, res) => {
  const id = parseInt(req.params.id);

  parkings = parkings.map(p =>
    p.id === id && p.free > 0 ? { ...p, free: p.free - 1 } : p
  );

  res.json(parkings);
});

// FREE spot
app.post("/parkings/:id/free", (req, res) => {
  const id = parseInt(req.params.id);

  parkings = parkings.map(p =>
    p.id === id ? { ...p, free: p.free + 1 } : p
  );

  res.json(parkings);
});

app.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
}); 

app.get("/", (req, res) => {
  res.send("Parking API is working 🚗");
});