"use strict";
/**
fairly complex sql query to try:

SELECT
    c.customer_id,
    c.first_name,
    c.last_name,
    COUNT(o.order_id) AS num_orders,
    SUM(oi.quantity * oi.price) AS total_spent
FROM
    customers c
    LEFT JOIN orders o ON c.customer_id = o.customer_id
    LEFT JOIN order_items oi ON o.order_id = oi.order_id
WHERE
    o.order_date BETWEEN '2022-01-01' AND '2022-12-31'
GROUP BY
    c.customer_id
HAVING
    num_orders > 0
ORDER BY
    total_spent DESC, num_orders DESC
LIMIT 10;

 */
Object.defineProperty(exports, "__esModule", { value: true });
const node_fetch_1 = require("node-fetch");
const node_sql_parser_1 = require("node-sql-parser");
const parser = new node_sql_parser_1.Parser();
// check if the SQL query is valid by trying to parse it
const isSqlQueryValid = (sqlQuery) => {
    try {
        parser.parse(sqlQuery);
        console.log('SQL query is valid');
        return true;
    }
    catch (error) {
        console.log('SQL query is invalid');
        return false;
    }
};
// translate the SQL query using OpenAI's davinci model
async function translateSQL(sqlQuery, OPENAI_KEY) {
    // check if the SQL query is valid
    if (!isSqlQueryValid(sqlQuery)) {
        return { fullTranslation: null, tldrTranslation: null, error: 'Invalid SQL query' };
    }
    try {
        const response = await (0, node_fetch_1.default)(`https://api.openai.com/v1/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${OPENAI_KEY}`,
            },
            body: JSON.stringify({
                model: 'text-davinci-003',
                prompt: `Explain in detail and in English, the following SQL query: ${sqlQuery} \n`,
                temperature: 0.1,
                max_tokens: 1024,
                top_p: 0.1,
                frequency_penalty: 0,
                presence_penalty: 0,
            }),
        });
        const data = await response.json();
        if (data.error) {
            return { fullTranslation: null, tldrTranslation: null, error: 'Invalid API key' };
        }
        const tldrResponse = await queryTldr(sqlQuery, OPENAI_KEY);
        return {
            fullTranslation: data.choices[0].text,
            tldrTranslation: tldrResponse,
            error: null,
        };
    }
    catch (error) {
        return { fullTranslation: null, tldrTranslation: null, error: 'Generic error' };
    }
}
exports.default = translateSQL;
async function queryTldr(sqlQuery, OPENAI_KEY) {
    try {
        const response = await (0, node_fetch_1.default)(`https://api.openai.com/v1/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${OPENAI_KEY}`,
            },
            body: JSON.stringify({
                model: 'text-davinci-003',
                prompt: `Explain shortly in less than 200 characters and in English, the following SQL query: ${sqlQuery} \n`,
                temperature: 0.1,
                max_tokens: 500,
                top_p: 0.1,
                frequency_penalty: 0,
                presence_penalty: 0,
            }),
        });
        const data = await response.json();
        return data.choices[0].text;
    }
    catch (error) {
        return null;
    }
}
//# sourceMappingURL=translateQuery.js.map