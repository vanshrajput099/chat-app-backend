import 'dotenv/config';
import { connectDatabase } from './db/db.config.js';
import { server } from './app.js';

connectDatabase().then(() => {
    server.listen(process.env.PORT, () => {
        console.log("Database is connected , Server Started");
    });
}).catch((error) => {
    console.log('Database connection failed:', error);
});
