import express, { Request, Response, NextFunction } from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';

const app = express();
const port = 3001;

// Middleware
app.use(bodyParser.json());
app.use(cors({
    origin: true
}));

// Error-handling middleware
app.use((err: Error, req: Request, res: Response, next: any): any => {
    console.error(err.stack);
    res.status(500).json({ success: false, errors: ['Internal Server error'] });
});

// Routes
app.get('/', (req: Request, res: Response) => {
    res.send('Hello');
  
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
