/*
    This is to test static formatting parameters,
    such as schema name and table name.
*/

-- We schema/table we should use the SQL Name syntax (with tilde):
SELECT ${column~} FROM ${schema~}.${table~}
