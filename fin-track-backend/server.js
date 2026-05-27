import express from 'express';
import pool from './db.js'; // Note the .js extension
import bcrypt from 'bcryptjs';
import cors from 'cors';

const app = express();
app.use(express.json());
app.use(cors());

// Inside server.js
app.post('/api/auth/register', async (req, res) => {
  // ADD username here
  const { username, email, password } = req.body; 
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Make sure your "User" table has a 'username' column
    const query = 'INSERT INTO "User" (username, email, password) VALUES ($1, $2, $3)';
    await pool.query(query, [username, email, hashedPassword]);
    
    res.status(201).json({ message: 'User registered successfully!' });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: 'Registration failed.' });
  }
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));