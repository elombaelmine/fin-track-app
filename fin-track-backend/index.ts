import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const PORT = 3000;
const JWT_SECRET = 'FINTRACK_SUPER_SECRET_KEY_2026';

// Handle modern ES Module directory paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(process.cwd(), 'database.json');

app.use(cors({ origin: 'http://localhost:4200' }));
app.use(bodyParser.json());

// ==========================================
// DATABASE UTILITY METHODS
// ==========================================

// Helper to safely read data from database.json file
function readDatabase(): { systemOperators: any[]; transactions: any[] } {
  try {
    if (!fs.existsSync(DB_FILE)) {
      // If file doesn't exist yet, seed it with clean empty tables
      const initialData = { systemOperators: [], transactions: [] };
      fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
      return initialData;
    }
    const rawData = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(rawData);
  } catch (error) {
    console.error('Error reading file database:', error);
    return { systemOperators: [], transactions: [] };
  }
}

// Helper to write data out to database.json file
function writeDatabase(data: { systemOperators: any[]; transactions: any[] }) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing to file database:', error);
  }
}

// ==========================================
// AUTHENTICATION ENDPOINTS
// ==========================================

// Register Route
app.post('/api/auth/register', async (req, res): Promise<any> => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'All parameters are required.' });
    }

    const db = readDatabase();
    
    const userExists = db.systemOperators.find(u => u.email === email.toLowerCase());
    if (userExists) {
      return res.status(400).json({ message: 'An operator with this email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newOperator = {
      id: db.systemOperators.length + 1,
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      password: hashedPassword,
      createdAt: new Date()
    };

    // Push to table array and commit save to local drive file
    db.systemOperators.push(newOperator);
    writeDatabase(db);

    console.log(`💾 Operator saved to database.json: ${email}`);
    return res.status(201).json({ message: 'Account token provisioned successfully!' });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error processing registration.' });
  }
});

// Login Route
app.post('/api/auth/login', async (req, res): Promise<any> => {
  try {
    const { username, password } = req.body; // Expecting username from the frontend payload

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and security key are required.' });
    }

    const db = readDatabase();
    
    // Look up the operator record using the username key
    const operator = db.systemOperators.find(u => u.username === username.toLowerCase());
    if (!operator) {
      return res.status(404).json({ message: 'Operator credentials not found.' });
    }

    // Compare encrypted passwords
    const isMatch = await bcrypt.compare(password, operator.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid security credentials.' });
    }

    // Sign session token
    const token = jwt.sign(
      { id: operator.id, username: operator.username, email: operator.email },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    return res.status(200).json({
      message: 'Authentication successful',
      token: token,
      user: { username: operator.username, email: operator.email }
    });
  } catch (error) {
    return res.status(500).json({ message: 'Authentication runtime error.' });
  }
});

// Confirm API status page
app.get('/', (req, res) => {
  res.status(200).send(`
    <div style="font-family: system-ui, sans-serif; text-align: center; padding: 50px; background: #f8fafc; min-height: 100vh;">
      <div style="background: white; max-width: 500px; margin: 0 auto; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); border: 1px solid #e2e8f0;">
        <span style="font-size: 48px;">💾</span>
        <h1 style="color: #3b30e5; margin: 16px 0 8px 0;">FinTrack File Database Engine</h1>
        <p style="color: #64748b; margin: 0 0 24px 0; font-size: 14px;">The system is listening and actively tracking database.json storage links.</p>
        <div style="display: inline-block; background: #d1fae5; color: #065f46; padding: 6px 12px; border-radius: 20px; font-weight: 600; font-size: 12px;">
          Persisted Memory Active
        </div>
      </div>
    </div>
  `);
});

app.listen(PORT, () => {
  console.log(`🚀 FinTrack Secure Backend running on http://localhost:${PORT}`);
});