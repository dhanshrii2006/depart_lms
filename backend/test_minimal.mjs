import express from 'express';

const app = express();

app.get('/health', (req, res) => {
  console.log('Health endpoint called');
  res.json({ status: 'ok' });
});

app.listen(5002, () => {
  console.log('Server running on port 5002');
});
