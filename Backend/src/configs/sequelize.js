import { Sequelize } from "sequelize";
import { DB_NAME, DB_USER, DB_PASSWORD, DB_HOST } from "./env.js";

const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  host: DB_HOST,
  dialect: "mysql",
  timezone: "+07:00",
  dialectOptions: {
    dateStrings: true,
    charset: 'utf8mb4',
    typeCast: true
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
    afterCreate: (conn, done) => {
      conn.query("SET time_zone = '+07:00'", (err) => {
        done(err, conn);
      });
    }
  },
  define: {
    timestamps: true,
    underscored: false,      
    freezeTableName: true,
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci'
  }
});

export default sequelize;
