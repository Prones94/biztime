/** Database setup for BizTime. */
const { Client } = require("pg")

const DB_URI =
  process.env.NODE_ENV === "test"
    ? "postgresql://localhost/biztime_test"
    : "postgresql://localhost/biztime";

const client = new Client({connectionString: DB_URI})

client.connect()

module.exports = client
