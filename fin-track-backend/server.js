import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from './db.js';

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'FINTRACK_SUPER_SECRET_KEY_2026';
const allowedOrigins = new Set([
  'http://localhost:4200',
  'http://127.0.0.1:4200',
  process.env.CLIENT_ORIGIN
].filter(Boolean));

app.use(express.json());
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error('Origin not allowed by CORS'));
  }
}));

async function ensureDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS system_operators (
      id BIGSERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS transactions (
      id BIGSERIAL PRIMARY KEY,
      user_id BIGINT NOT NULL REFERENCES system_operators(id) ON DELETE CASCADE,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      date DATE NOT NULL,
      amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
      type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
      status TEXT NOT NULL DEFAULT 'Completed',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

function normalizeTransaction(row) {
  return {
    id: Number(row.id),
    description: row.description,
    category: row.category,
    date: row.date,
    amount: Number(row.amount),
    type: row.type,
    status: row.status,
    createdAt: row.created_at
  };
}

function signToken(operator) {
  return jwt.sign(
    {
      id: operator.id,
      username: operator.username,
      email: operator.email
    },
    JWT_SECRET,
    { expiresIn: '8h' }
  );
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: 'Authentication token is required.' });
  }

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Session expired. Please log in again.' });
  }
}

app.get('/', (req, res) => {
  res.status(200).json({
    name: 'FinTrack API',
    database: 'Supabase PostgreSQL',
    status: 'running'
  });
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const username = req.body.username?.trim().toLowerCase();
    const email = req.body.email?.trim().toLowerCase();
    const { password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Username, email, and password are required.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const createdOperator = await pool.query(
      `INSERT INTO system_operators (username, email, password)
       VALUES ($1, $2, $3)
       RETURNING id, username, email`,
      [username, email, hashedPassword]
    );

    return res.status(201).json({
      message: 'Account created successfully.',
      user: createdOperator.rows[0]
    });
  } catch (error) {
    if (error?.code === '23505') {
      return res.status(409).json({ message: 'An account with this username or email already exists.' });
    }

    console.error('Registration error:', error);
    return res.status(500).json({ message: 'Registration failed. Please try again.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const username = req.body.username?.trim().toLowerCase();
    const { password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required.' });
    }

    const operatorResult = await pool.query(
      'SELECT id, username, email, password FROM system_operators WHERE username = $1',
      [username]
    );
    const operator = operatorResult.rows[0];

    if (!operator) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const passwordMatches = await bcrypt.compare(password, operator.password);
    if (!passwordMatches) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const user = {
      id: Number(operator.id),
      username: operator.username,
      email: operator.email
    };

    return res.status(200).json({
      message: 'Authentication successful.',
      token: signToken(user),
      user
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Login failed. Please try again.' });
  }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const operatorResult = await pool.query(
      'SELECT id, username, email FROM system_operators WHERE id = $1',
      [req.user.id]
    );
    const operator = operatorResult.rows[0];

    if (!operator) {
      return res.status(404).json({ message: 'Account not found.' });
    }

    return res.status(200).json({
      id: Number(operator.id),
      username: operator.username,
      email: operator.email
    });
  } catch (error) {
    console.error('Current user error:', error);
    return res.status(500).json({ message: 'Could not load current user.' });
  }
});

app.get('/api/transactions', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, description, category, date, amount, type, status, created_at
       FROM transactions
       WHERE user_id = $1
       ORDER BY date DESC, id DESC`,
      [req.user.id]
    );

    return res.status(200).json(result.rows.map(normalizeTransaction));
  } catch (error) {
    console.error('Transaction list error:', error);
    return res.status(500).json({ message: 'Could not load transactions.' });
  }
});

app.post('/api/transactions', authenticateToken, async (req, res) => {
  try {
    const description = req.body.description?.trim();
    const category = req.body.category?.trim();
    const status = req.body.status?.trim() || 'Completed';
    const amount = Number(req.body.amount);
    const { date, type } = req.body;

    if (!description || !category || !date || !type || !Number.isFinite(amount)) {
      return res.status(400).json({ message: 'Description, category, date, amount, and type are required.' });
    }

    if (!['income', 'expense'].includes(type)) {
      return res.status(400).json({ message: 'Transaction type must be income or expense.' });
    }

    if (amount <= 0) {
      return res.status(400).json({ message: 'Amount must be greater than zero.' });
    }

    const createdTransaction = await pool.query(
      `INSERT INTO transactions (user_id, description, category, date, amount, type, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, description, category, date, amount, type, status, created_at`,
      [req.user.id, description, category, date, amount, type, status]
    );

    return res.status(201).json({
      message: 'Transaction created successfully.',
      transaction: normalizeTransaction(createdTransaction.rows[0])
    });
  } catch (error) {
    console.error('Transaction create error:', error);
    return res.status(500).json({ message: 'Could not save transaction.' });
  }
});

ensureDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`FinTrack API running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Database initialization failed:', error);
    process.exit(1);
  });
