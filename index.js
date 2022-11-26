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
    const productOrderCollection = db.collection('products-order');


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

    app.post('/users/social', async (req, res) => {
      const data = req.body;
      const uid = data.uid;

      const query = { uid: uid }
      const isExist = await usersCollection.findOne(query);

      if (!isExist) {
        const result = await usersCollection.insertOne(data);
        return res.send(result);
      }
      else {
        return res.send({ acknowledged: true });
      }

      res.send({});
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

    app.get('/products/id/:id', async (req, res) => {
      const id = req.params.id;

      let query = { _id: ObjectId(id) }
      const result = await productsCollection.findOne(query);

      res.send(result);
    });

    app.get('/products/email/:email', async (req, res) => {
      const email = req.params.email;

      let query = { author: email }
      const result = await productsCollection.find(query).toArray();

      res.send(result);
    });

    app.get('/products/categories', async (req, res) => {
      const id = req.query.catID;
      const userID = req.query.userID;

      const products = await productsCollection.find({ category: id }).toArray();


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

    app.post('/products', async (req, res) => {
      const data = req.body;
      const result = await productsCollection.insertOne(data);

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

    app.get('/categories/id/:id', async (req, res) => {
      const id = req.params.id;

      let query = { _id: ObjectId(id) }
      const result = await productCategoryCollection.findOne(query);

      res.send(result);
    });

    app.patch('/categories', async (req, res) => {
      const id = req.query.update;
      const body = req.body;

      const query = { _id: ObjectId(id) }
      const updateDoc = {
        $set: body
      };
      const result = await productCategoryCollection.updateOne(query, updateDoc);

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
    app.get('/complaints', async (req, res) => {
      const query = {}
      const complaints = await productComplaintCollection.find(query).toArray();

      const result = []

      for (const complaint of complaints) {
        const userID = complaint.userID;
        const productID = complaint.productID;

        const user = await usersCollection.findOne({ _id: ObjectId(userID) });
        const product = await productsCollection.findOne({ _id: ObjectId(productID) });

        const newData = { ...complaint, userInfo: user, productInfo: product }

        result.push(newData);
      }

      res.send(result);
    });

    app.post('/complaints', async (req, res) => {
      const data = req.body;
      const result = await productComplaintCollection.insertOne(data);

      res.send(result);
    });

    app.delete('/complaints', async (req, res) => {
      const id = req.query.delete;

      const query = { _id: ObjectId(id) }
      const result = await productComplaintCollection.deleteOne(query);

      res.send(result);
    });


    /**
     * productsOrderCollection APIs
     */

    app.get('/orders', async (req, res) => {
      const query = {}
      const result = await productOrderCollection.find(query).toArray();

      res.send(result);
    });

    app.get('/orders/userid/:id', async (req, res) => {
      const id = req.params.id;

      let query = { userID: id }
      const result = await productOrderCollection.find(query).toArray();

      res.send(result);
    });


    app.get('/orders/get-ordered-projects-ids/:id', async (req, res) => {
      const id = req.params.id;

      let query = { userID: id }
      const result = await productOrderCollection.find(query).project({ productID: 1, _id: 0 }).toArray();

      res.send(result);
    });

    app.post('/orders', async (req, res) => {
      const data = req.body;
      const result = await productOrderCollection.insertOne(data);

      res.send(result);
    });

    app.delete('/orders', async (req, res) => {
      const id = req.query.delete;

      const query = { _id: ObjectId(id) }
      const result = await productOrderCollection.deleteOne(query);

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