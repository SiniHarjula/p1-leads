//Built-in Node.js modules
const path = require("path");
const fs = require("fs");

//Third party modules
const express = require("express");
const app = express();

//Port setup
const PORT = process.env.PORT || 3000;
const DATA = path.join(__dirname, "leads.json");

//Middleware configuration
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

//Data helper functions
//Reads the leads from 'leads.json'
function readLeads() {
  if(!fs.existsSync(DATA)) return [];
  return JSON.parse(fs.readFileSync(DATA, "utf8"));
}

//Writes the leads array back to 'leads.json'
function writeLeads(leads){
  fs.writeFileSync(DATA, JSON.stringify(leads,null,2))
}

// API routes
//Handle GET requests to '/api/leads' to read and filter all leads
app.get("/api/leads", (req, res) => {
  const q = (req.query.q || "").toLowerCase();
  const status = (req.query.status || "").toLowerCase();
  let list = readLeads();
  if (q) list = list.filter(l => (l.name + l.company).toLowerCase().includes(q));
  if (status) list = list.filter(l => l.status.toLowerCase() === status);
  res.json(list);
});

//Handle POST requests to '/api/leads' to create a new lead
app.post("/api/leads", (req, res) => {
  const {name, email, company, source, notes} = req.body;
  if (!name || !email) return res.status(400).json({ error: "Name and email are required"});
  const leads = readLeads();
  const lead = {id: Date.now().toString(), name, email, company: company || "", source: source || "", notes: notes || "", status: "New", createdAt: new Date().toISOString()};
  leads.push(lead);
  writeLeads(leads);
  res.status(201).json(lead);
});

//Handle PATCH requests to '/api/leads/:id' to update a lead
app.patch("/api/leads/:id", (req, res) => {
  const leads = readLeads();
  const idx = leads.findIndex(l => l.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Not found" });
  
  const allowed = ["status", "notes"];
  for (const k of allowed) {
    if (req.body[k] !== undefined) {
      leads[idx][k] = req.body[k];
    }
  }
  writeLeads(leads);
  res.json(leads[idx]);
});

//Root Route
//Handle GET requests to the root URL
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));

//Server start
//Start the server and listen for connections on the defined PORT
app.listen(PORT, () => console.log(`Server on http://localhost:${PORT}`));