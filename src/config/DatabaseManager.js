import { Sequelize } from 'sequelize';
import config from './sequelize.cjs';

class DatabaseManager {
    constructor() {
        this.sequelize = null;
    }

    initialize() {
        if(this.sequelize) return;
        const env = process.env.NODE_ENV || 'development';
        const dbConfig = config[env];
        this.sequelize = new Sequelize(
            dbConfig.database,
            dbConfig.username,
            dbConfig.password,
            {
                host: dbConfig.host,
                dialect: dbConfig.dialect,
                logging: false,
            }
        );
    }

    async connect() {
        if(!this.sequelize) {
            this.initialize();
        }
        try {
            await this.sequelize.authenticate();
            console.log('Connection has been established successfully.');
            return this.sequelize;
        } catch(error) {
            console.error('Unable to connect to the database:', error);
            throw error;
        }
    }

    getInstance() {
        if(!this.sequelize) {
            this.initialize();
        }
        return this.sequelize;
    }
}

const dbManager = new DatabaseManager();
export default dbManager;
