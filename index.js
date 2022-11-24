const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();

const port = process.env.PORT || 5000;
const app = express();

app.use(cors());
app.use(express.json());

const user = process.env.DB_USER;
const pass = process.env.DB_PASS;

const uri = `mongodb+srv://${user}:${pass}@cluster0.rbe1w.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1
});

const run = async () => {
  try {
    const db = client.db('antique-watches');
    const usersCollection = db.collection('users');
    const productsCollection = db.collection('products');
    const productCategoryCollection = db.collection('products-category');


    /**
     * usersCollection APIs
     */
    app.get('/users', async (req, res) => {
      const role = req.query.role;

      let query = {}

      if (role) {
        query = { role: role }
      }

      const result = await usersCollection.find(query).toArray();

      res.send(result);
    });

    app.post('/users', async (req, res) => {
      const data = req.body;
      const result = await usersCollection.insertOne(data);

      res.send(result);
    });


    /**
     * productsCollection APIs
     */
    app.get('/products', async (req, res) => {
      let query = {}
      const result = await productsCollection.find(query).toArray();

      res.send(result);
    });

    app.post('/products', async (req, res) => {
      const data = req.body;
      const result = await productsCollection.insertOne(data);

      res.send(result);
    });

    app.delete('/products', async (req, res) => {
      const id = req.query.delete;

      const query = { _id: ObjectId(id) }
      const result = await productsCollection.deleteOne(query);

      res.send(result);
    });


    /**
     * productCategoryCollection APIs
     */
    app.get('/categories', async (req, res) => {
      let query = {}
      const result = await productCategoryCollection.find(query).toArray();

      res.send(result);
    });

    app.post('/categories', async (req, res) => {
      const data = req.body;
      const result = await productCategoryCollection.insertOne(data);

      res.send(result);
    });

    app.delete('/categories', async (req, res) => {
      const id = req.query.delete;

      const query = { _id: ObjectId(id) }
      const result = await productCategoryCollection.deleteOne(query);

      res.send(result);
    });

  }
  finally {

  }
}
run().catch(err => console.error(err));


app.get('/', (req, res) => {
  res.send('The server is Running...');
});

app.listen(port, () => {
  console.log(`The server running on ${port}`);
});