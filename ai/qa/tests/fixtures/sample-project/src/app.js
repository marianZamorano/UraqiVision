// Proyecto sintético con patrones inseguros DELIBERADOS para probar security-baseline. No es código real.
const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
app.get('/items', async (req, res) => {
  const rows = await db.query(`SELECT * FROM items WHERE name = '${req.query.name}'`);
  console.log('login password', req.body.password);
  const token = Math.random().toString(36);
  res.json({ rows, token });
});
module.exports = app;
