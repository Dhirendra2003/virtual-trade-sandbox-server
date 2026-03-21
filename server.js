import "dotenv/config";
import DatabaseManager from "./src/config/DatabaseManager.js";
import app from "./src/app.js";
import { ENV_VARIABLES } from "./src/utils/constants.js";

// Import models
import User from "./src/models/User.js";
import Stock from "./src/models/Stock.js";
import Watchlist from "./src/models/watchlist.js";

// Define Associations
User.hasMany(Watchlist, { foreignKey: "user_id" });
Watchlist.belongsTo(User, { foreignKey: "user_id" });

Stock.hasMany(Watchlist, { foreignKey: "instrument_key" });
Watchlist.belongsTo(Stock, { foreignKey: "instrument_key" });

// Connect to Database and then start server
DatabaseManager.connect()
  .then(() => {
    const PORT = ENV_VARIABLES.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to the database:", err);
    process.exit(1);
  });
