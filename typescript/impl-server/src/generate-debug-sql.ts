import fs from 'fs';
const prompt: any = require('prompt'); //eslint-disable-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-var-requires

prompt.start();

async function getSingleProperty(name: string): Promise<string> {
    return new Promise<string>((
        resolve: (value: string) => void,
        reject: (reason?: Error) => void,
    ) => {
        prompt.get([{
            name,
            validator: /^[a-zA-Z0-9\-]*$/,
            warning: `'${name}' must be only letters, numbers, or dashes`,
        }], function (err: Error, result: any) { //eslint-disable-line @typescript-eslint/no-explicit-any
            if (err) {
                return reject(err);
            }
            resolve(result[name]);
        });
    });
}

async function getTableName(): Promise<string> {
    return await getSingleProperty('tableName');
}

async function getColumnNames(): Promise<string[]> {
    const columnNames: string[] = [];
    let empty: boolean = false;
    while (!empty) {
        const columnName: string = await getSingleProperty('columnName');
        if (!(!columnName || columnName.length === 0)) {
            columnNames.push(columnName);
        } else {
            empty = true;
            break;
        }
    }
    return columnNames;
}

(async () => {
    const tableName: string = await getTableName();
    const columnNames: string[] = await getColumnNames();

    const resultProjection: string = columnNames
        .map((col: string) => `MAX("${col}") as "${col}"`)
        .join(',\n  ');

    const resultMapping: string = columnNames
        .map((col: string) => `(CASE WHEN "column" = '${col}' THEN "value" ELSE NULL END) AS "${col}"`)
        .join(',\n    ');

    const sql: string = `
SELECT 
  "pk", 
  "updated_at", 
  ${resultProjection}
FROM (
  SELECT 
    "database_id" as "pk", 
    "timestamp" as "updated_at",
    ${resultMapping} 
  FROM messages_last as m1
  WHERE "table_name" = '${tableName}'
) as m2
GROUP BY pk;`.substring(1);
    fs.writeFileSync(__dirname + '/debug.sql', sql);

})();