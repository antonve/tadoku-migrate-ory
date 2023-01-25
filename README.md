# tadoku-migrate-ory

## How to migrate

1. Load data with `kubectl exec -it postgres-immersion-0 -- env PGPASSWORD=$PGPASSWORD psql $DATABASE -U $PGUSER < ./backup_tadoku_prod_20230125_015624.pgdump` with the correct parameters. Make sure this creates a new schema `old`.
2. Add new fields to store the new UUIDs
  ```sql
  alter table old.contests add column new_id uuid default (uuid_generate_v4());
  alter table old.contest_logs add column new_id uuid default (uuid_generate_v4());
  alter table old.users add column new_id uuid default null;
  ```
3. Check if the configuration is correct in `migrate.js`
3. Run the migration script `pnpm run migrate`
4. There might be some conflicting users, you can ignore those.
5. Generate the query to fix the `created_at` timestamps and apply it kratos db `pnpm run kratos | pbcopy`
