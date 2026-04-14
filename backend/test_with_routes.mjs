import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

const app = express();

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get('/api/health', (req, res) => {
  console.log('Health endpoint called');
  res.json({ status: 'ok' });
});

app.listen(5002, () => {
  console.log('Server running on port 5002');
});
