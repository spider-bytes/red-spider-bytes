DROP VIEW IF EXISTS messages_last;
CREATE VIEW messages_last
AS
SELECT m2.*,
       (
           SELECT m3.value
           from messages as m3
           WHERE m3."timestamp" = m2."timestamp"
             AND m3.database_id = m2.database_id
             AND m3.group_id = m2.group_id
             AND m3.table_name = m2.table_name
             AND m3."row" = m2."row"
             AND m3."column" = m2."column"
       ) as value
FROM (
         SELECT MAX(m1."timestamp") as "timestamp",
                m1.database_id,
                m1.group_id,
                m1.table_name,
                m1."row",
                m1."column"
         FROM messages as m1
         GROUP BY m1.database_id, m1.group_id, m1.table_name, m1."row", m1."column"
     ) as m2;