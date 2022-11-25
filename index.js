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
    const productComplaintCollection = db.collection('products-complaint');


    /**
     * usersCollection APIs
     */
    app.get('/users', async (req, res) => {
      let query = {}
      const result = await usersCollection.find(query).toArray();

      res.send(result);
    });

    app.get('/users/role/:id', async (req, res) => {
      const id = req.params.id;

      const query = { role: id }
      const result = await usersCollection.find(query).toArray();

      res.send(result);
    });

    app.get('/users/uid/:id', async (req, res) => {
      const id = req.params.id;

      const query = { uid: id }
      const result = await usersCollection.findOne(query);

      res.send(result);
    });

    app.post('/users', async (req, res) => {
      const data = req.body;
      const result = await usersCollection.insertOne(data);

      res.send(result);
    });

    app.patch('/users', async (req, res) => {
      const id = req.query.update;
      const body = req.body;

      const query = { _id: ObjectId(id) }
      const updateDoc = {
        $set: body
      };
      const result = await usersCollection.updateOne(query, updateDoc);

      res.send(result);
    });

    app.delete('/users', async (req, res) => {
      const id = req.query.delete;

      const query = { _id: ObjectId(id) }
      const result = await usersCollection.deleteOne(query);

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

    app.get('/products/categories/:id', async (req, res) => {
      const id = req.params.id;

      const query = { category: id }
      const products = await productsCollection.find(query).toArray();

      const result = []

      for (const product of products) {
        const authorID = product.author;
        const categoryID = product.category;

        const author = await usersCollection.findOne({ _id: ObjectId(authorID) });
        const category = await productCategoryCollection.findOne({ _id: ObjectId(categoryID) });

        const newProduct = { ...product, categoryInfo: category, authorInfo: author }

        result.push(newProduct);
      }

      res.send(result);
    });

    app.patch('/products', async (req, res) => {
      const id = req.query.update;
      const body = req.body;

      const query = { _id: ObjectId(id) }
      const updateDoc = {
        $set: body
      };
      const result = await productsCollection.updateOne(query, updateDoc);

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
      const query = {}
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


    /**
     * productComplaintCollection APIs
     */
    app.get('/complaint', async (req, res) => {
      const query = {}
      const result = await productComplaintCollection.find(query).toArray();

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