const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const stripe = require("stripe")(process.env.STRIPE_SK);
const jwt = require('jsonwebtoken');

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


const verifyJWT = (req, res, next) => {
  const authorization = req.headers.authorization;

  if (!authorization) {
    return res.status(401).send({ message: 'Unauthorize access' });
  }

  const token = authorization.split(' ')['1']

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decode) => {
    if (err) {
      return res.status(403).send({ message: 'Forbidden access' });
    }

    req.decode = decode;
    next();
  });
}



const run = async () => {
  try {
    const db = client.db('antique-watches');
    const usersCollection = db.collection('users');
    const productsCollection = db.collection('products');
    const productCategoryCollection = db.collection('products-category');
    const productComplaintCollection = db.collection('products-complaint');
    const productOrderCollection = db.collection('products-order');



    app.post("/create-payment-intent", async (req, res) => {
      const booking = req.body;
      const price = booking.price;
      const amount = price * 100;

      const paymentIntent = await stripe.paymentIntents.create({
        currency: "usd",
        amount: amount,
        "payment_method_types": [
          "card"
        ]
      });

      res.send({
        clientSecret: paymentIntent.client_secret,
      });
    });



    // Verify Admin
    const verifyAdmin = async (req, res, next) => {
      const email = req?.headers?.email;

      const query = { email: email }
      const user = await usersCollection.findOne(query);

      if (user?.role !== 'admin') {
        return res.status(403).send({ message: 'forbidden access' })
      }

      next();
    }


    app.post('/jwt', async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1d' });
      res.send({ token });
    });


    /**
     * usersCollection APIs
     */
    /* app.get('/users', verifyJWT, async (req, res) => {
      let query = {}
      const result = await usersCollection.find(query).toArray();

      res.send(result);
    }); */

    app.get('/users/role/:role', verifyJWT, verifyAdmin, async (req, res) => {
      const id = req.params.role;

      const query = { role: id }
      const result = await usersCollection.find(query).toArray();

      res.send(result);
    });

    app.get('/users/uid/:id', verifyJWT, async (req, res) => {
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

    app.patch('/users', verifyJWT, verifyAdmin, async (req, res) => {
      const id = req.query.update;
      const body = req.body;

      const query = { _id: ObjectId(id) }
      const updateDoc = {
        $set: body
      };
      const result = await usersCollection.updateOne(query, updateDoc);

      res.send(result);
    });

    app.delete('/users', verifyJWT, verifyAdmin, async (req, res) => {
      const id = req.query.delete;

      const query = { _id: ObjectId(id) }
      const result = await usersCollection.deleteOne(query);

      res.send(result);
    });

    /**
     * productsCollection APIs
     */
    app.get('/products', verifyJWT, verifyAdmin, async (req, res) => {
      let query = {}
      const result = await productsCollection.find(query).toArray();

      res.send(result);
    });

    app.get('/products/id/:id', verifyJWT, async (req, res) => {
      const id = req.params.id;

      let query = { _id: ObjectId(id) }
      const result = await productsCollection.findOne(query);

      res.send(result);
    });

    app.get('/products/email/:email', verifyJWT, async (req, res) => {
      const email = req.params.email;

      let query = { author: email }
      const result = await productsCollection.find(query).toArray();

      res.send(result);
    });

    // Function
    const getProductInfo = async (product, userID) => {
      const id = product._id;
      const authorID = product.author;
      const categoryID = product.category;


      const author = ObjectId.isValid(authorID) ? await usersCollection.findOne({ _id: ObjectId(authorID) }) : undefined;
      const category = ObjectId.isValid(categoryID) ? await productCategoryCollection.findOne({ _id: ObjectId(categoryID) }) : undefined;

      if (author && category) {
        const query = {
          $and: [
            { productID: id.toString() }, { userID: userID }
          ]
        }
        const currentUserOrdered = await productOrderCollection.findOne(query);

        const result = {
          ...product,
          categoryInfo: category,
          authorInfo: author,
          currentUser: {
            loggedIn: userID || 'undefined',
            orderd: currentUserOrdered ? true : false,
          }
        }

        return result;
      }

      return undefined;
    }

    // === Done
    app.get('/products/categories', verifyJWT, async (req, res) => {
      const id = req.query.catID;
      const userID = req.query.userID;

      const query = {
        $and: [
          { category: id }, { itemStatus: 'unsold' }
        ]
      }

      const products = await productsCollection.find(query).toArray();

      const result = []

      for (const product of products) {
        const getInfo = await getProductInfo(product, userID);

        if (getInfo) {
          result.push(getInfo);
        }
      }

      res.send(result);
    });


    // public api === Done
    app.get('/products/advertise', async (req, res) => {
      const userID = req.query.userID;

      const query = {
        $and: [
          { advertise: "true" }, { itemStatus: "unsold" }
        ]
      }

      const products = await productsCollection.find(query).toArray();

      const result = []

      for (const product of products) {
        const getInfo = await getProductInfo(product, userID);

        if (getInfo) {
          result.push(getInfo);
        }
      }

      res.send(result);
    });


    app.post('/products', verifyJWT, async (req, res) => {
      const data = req.body;
      const result = await productsCollection.insertOne(data);

      res.send(result);
    });

    app.patch('/products', verifyJWT, async (req, res) => {
      const id = req.query.update;
      const body = req.body;

      const query = { _id: ObjectId(id) }
      const updateDoc = {
        $set: body
      };
      const result = await productsCollection.updateOne(query, updateDoc);

      res.send(result);
    });

    app.delete('/products', verifyJWT, async (req, res) => {
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

    app.post('/categories', verifyAdmin, verifyAdmin, async (req, res) => {
      const data = req.body;
      const result = await productCategoryCollection.insertOne(data);

      res.send(result);
    });

    app.get('/categories/id/:id', verifyAdmin, verifyAdmin, async (req, res) => {
      const id = req.params.id;

      let query = { _id: ObjectId(id) }
      const result = await productCategoryCollection.findOne(query);

      res.send(result);
    });

    app.patch('/categories', verifyAdmin, verifyAdmin, async (req, res) => {
      const id = req.query.update;
      const body = req.body;

      const query = { _id: ObjectId(id) }
      const updateDoc = {
        $set: body
      };
      const result = await productCategoryCollection.updateOne(query, updateDoc);

      res.send(result);
    });

    app.delete('/categories', verifyAdmin, verifyAdmin, async (req, res) => {
      const id = req.query.delete;

      const query = { _id: ObjectId(id) }
      const result = await productCategoryCollection.deleteOne(query);

      res.send(result);
    });


    /**
     * productComplaintCollection APIs
     */
    // === Done
    app.get('/complaints', verifyJWT, verifyAdmin, async (req, res) => {
      const query = {}
      const complaints = await productComplaintCollection.find(query).toArray();

      const result = []

      for (const complaint of complaints) {
        const userID = complaint.userID;
        const productID = complaint.productID;

        const user = ObjectId.isValid(userID) ? await usersCollection.findOne({ _id: ObjectId(userID) }) : undefined;
        const product = ObjectId.isValid(productID) ? await productsCollection.findOne({ _id: ObjectId(productID) }) : undefined;

        if (user && product) {
          const newData = { ...complaint, userInfo: user, productInfo: product }

          result.push(newData);
        }
      }

      res.send(result);
    });

    app.post('/complaints', verifyJWT, async (req, res) => {
      const data = req.body;
      const result = await productComplaintCollection.insertOne(data);

      res.send(result);
    });

    app.delete('/complaints', verifyJWT, verifyAdmin, async (req, res) => {
      const id = req.query.delete;

      const query = { _id: ObjectId(id) }
      const result = await productComplaintCollection.deleteOne(query);

      res.send(result);
    });


    /**
     * productsOrderCollection APIs
     */

    /* app.get('/orders', async (req, res) => {
      const query = {}
      const result = await productOrderCollection.find(query).toArray();

      res.send(result);
    }); */

    app.get('/orders/:id', verifyJWT, async (req, res) => {
      const id = req.params.id;

      const query = { _id: ObjectId(id) }
      const result = await productOrderCollection.findOne(query);

      res.send(result);
    });

    // === Done
    app.get('/orders/userid/:id', verifyJWT, async (req, res) => {
      const id = req.params.id;

      let query = { userID: id }
      const orders = await productOrderCollection.find(query).toArray();

      const result = []

      for (const order of orders) {
        const userID = order.userID;
        const productID = order.productID;

        const user = await usersCollection.findOne({ _id: ObjectId(userID) });
        const product = await productsCollection.findOne({ _id: ObjectId(productID) });

        if (user && product) {
          const newData = { ...order, userInfo: user, productInfo: product }

          result.push(newData);
        }
      }

      res.send(result);
    });

    /* app.get('/orders/get-ordered-projects-ids/:id', async (req, res) => {
      const id = req.params.id;

      let query = { userID: id }
      const result = await productOrderCollection.find(query).project({ productID: 1, _id: 0 }).toArray();

      res.send(result);
    }); */

    app.post('/orders', verifyJWT, async (req, res) => {
      const data = req.body;
      const result = await productOrderCollection.insertOne(data);

      res.send(result);
    });

    app.patch('/orders/payment-confirm', verifyJWT, async (req, res) => {
      const orderID = req.query.orderID;
      const productID = req.query.productID;
      const data = req.body;


      const updateDoc = {
        $set: {
          purchased: data
        }
      };
      const order = await productOrderCollection.updateOne({ _id: ObjectId(orderID) }, updateDoc);

      const productUpdateDoc = {
        $set: {
          itemStatus: 'sold',
          advertise: 'false'
        }
      }
      const product = await productsCollection.updateOne({ _id: ObjectId(productID) }, productUpdateDoc);

      if (product && order) {
        res.send(order);
      }

    });

    app.delete('/orders', verifyJWT, async (req, res) => {
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