import 'dotenv/config';
import DatabaseManager from './src/config/DatabaseManager.js';
import app from './src/app.js';

// Connect to Database
DatabaseManager.connect()
  .then(() => {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to connect to the database:', err);
    process.exit(1);
  });

