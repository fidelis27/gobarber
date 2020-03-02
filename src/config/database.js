require('dotenv/config');
require('sequelize');

module.exports = {
  dialect: 'postgres',
  host: 'ec2-52-207-93-32.compute-1.amazonaws.com',
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  define: {
    timestamps: true,
    underscored: true,
    underscoredAll: true,
  },
  protocol: 'postgres',
  dialectOptions: {
    ssl: true,
  },
};
