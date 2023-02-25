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

import fetch from 'node-fetch';
import { Parser } from 'node-sql-parser';
const parser = new Parser();

// check if the SQL query is valid by trying to parse it
const isSqlQueryValid = (sqlQuery: string) => {
  try {
    parser.parse(sqlQuery);
    return true;
  } catch (error) {
    return false;
  }
};

// translate the SQL query using OpenAI's davinci model
export default async function translateSQL(sqlQuery: string, OPENAI_KEY: string) {
  
  // check if the SQL query is valid
  if (!isSqlQueryValid(sqlQuery)) {
    return { fullTranslation: null, tldrTranslation: null, error: 'Invalid SQL query'};
  }

  try {
    const response = await fetch(`https://api.openai.com/v1/completions`, {
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
    const data: any = await response.json();

    // if the response has "error" in it, it means the API key is invalid
    if(data.error) {
      return { fullTranslation: null, tldrTranslation: null, error: 'Invalid API key'};
    }

    const tldrResponse = await queryTldr(sqlQuery, OPENAI_KEY);
    
    return {
      fullTranslation: data.choices[0].text,
      tldrTranslation: tldrResponse,
      error: null,
    };
  } catch (error) {
    return { fullTranslation: null, tldrTranslation: null, error: 'Generic error'};
  }
}

async function queryTldr(sqlQuery: string, OPENAI_KEY: string) {
  try {
    const response = await fetch(`https://api.openai.com/v1/completions`, {
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
    const data: any = await response.json();
    return data.choices[0].text;
  } catch (error) {
    return null;
  }
}
