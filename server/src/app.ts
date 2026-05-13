import express from 'express';
import cors from 'cors';
import daysRouter from './routes/days.ts';
import periodsRouter from './routes/periods.ts';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/days', daysRouter);
app.use('/api/days/:dayId/periods', periodsRouter);

export default app;
