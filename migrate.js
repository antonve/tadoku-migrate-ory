const fetch = require("node-fetch");
const { Client } = require("pg");

// These are local dev secrets, do not commit production secrets
const client = new Client({
  user: "postgres",
  host: "localhost",
  database: "immersion",
  password: "foobar",
  port: 9090,
});

const kratosAdminRoot = "http://account.langlog.be/private";

async function main() {
  client.connect();

  try {
    const res = await client.query(
      `select * from old.users where new_id is null`
    );
    for (let i = 0; i < res.rows.length; i++) {
      await createUser(res.rows[i]);
      console.log(`${i + 1} / ${res.rows.length}`);
    }
  } catch (err) {
    console.log(err.stack);
  }

  client.end();
  console.log("finished");
}

async function createUser(user) {
  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      schema_id: "user",
      traits: {
        email: user.email,
        display_name: user.display_name,
      },
      credentials: {
        password: {
          config: {
            hashed_password: user.password.toString("utf8"),
          },
        },
      },
      verifiable_addresses: [
        {
          value: user.email,
          verified: true,
          via: "email",
          status: "completed",
        },
      ],
    }),
  };

  await fetch(`${kratosAdminRoot}/admin/identities`, options)
    .then((response) => {
      if (response.status != 201) {
        throw new Error(
          `could not create user with email "${user.email}": ${response.statusText}`
        );
      }
      response.json();
    })
    .then(async (response) => {
      await updateAccount(user, response.id);
      console.log(`Migrated ${user.email}:${response.id}`);
    })
    .catch((err) => console.error(err));
}

function updateAccount(user, id) {
  return client.query(`update old.users set new_id = $1 where id = $2`, [
    id,
    user.id,
  ]);
}

main();
