-- Read-only preflight for the existing database/table.
-- Do not run CREATE DATABASE/TABLE or seed data: BDDProductos is already populated.
SELECT
    table_schema,
    table_name,
    column_name,
    data_type,
    character_maximum_length,
    numeric_precision,
    numeric_scale
FROM information_schema.columns
WHERE table_schema = current_schema()
  AND table_name = 'productos'
ORDER BY ordinal_position;
