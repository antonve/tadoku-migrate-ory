const { Client } = require("pg");

// These are local dev secrets, do not commit production secrets
const client = new Client({
  user: "postgres",
  host: "localhost",
  database: "immersion",
  password: "foobar",
  port: 9090,
});

async function main() {
  client.connect();

  try {
    const res = await client.query(
      `select * from old.users where new_id is not null`
    );

    console.log("begin;");

    for (let i = 0; i < res.rows.length; i++) {
      const user = res.rows[i];
      const earliestLog = await client.query(
        `select min(created_at) at time zone 'utc' as min from logs where user_id = '${user.new_id}' group by user_id`
      );

      if (earliestLog.rows.length == 0) {
        continue;
      }

      console.log(
        `update identities set created_at = '${earliestLog.rows[0].min.toISOString()}' where id = '${
          user.new_id
        }';`
      );
    }
  } catch (err) {
    console.log(err.stack);
  }

  client.end();
  console.log("commit;");
}

main();
