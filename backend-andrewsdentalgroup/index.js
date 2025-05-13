require('dotenv').config(); // Carrega variáveis do .env
const express = require('express');
const { Client } = require('pg');

const app = express();
const PORT = 3000;

// Função para conectar ao Supabase usando um schema específico
async function getClientForSchema(schema) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });
  await client.connect();
  await client.query(`SET search_path TO ${schema}`); // Define o schema
  return client;
}

// Rota que busca dados da tabela 'users' do schema andrewsdentalgroup
app.get('/andrewsdentalgroup/users', async (req, res) => {
  try {
    const client = await getClientForSchema('andrewsdentalgroup');
    const result = await client.query('SELECT * FROM users');
    await client.end();
    res.json(result.rows); // Retorna os dados
  } catch (error) {
    console.error('Erro na consulta:', error);
    res.status(500).json({ error: 'Erro ao acessar os dados' });
  }
});

// Inicia o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
