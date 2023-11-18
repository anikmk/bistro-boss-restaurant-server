const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;

// middlewarej
app.use(cors());
app.use(express.json());

// bistroBoss
// 3YTWLant6KXhoXEA


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@anik.34iapyi.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    const menuCollection = client.db("bistroDB").collection("menu")
    const reviewsCollection = client.db("bistroDB").collection("reviews")
    const cartCollection = client.db("bistroDB").collection("carts")
    app.get('/menu',async(req,res)=>{
      const result = await menuCollection.find().toArray();
      res.send(result);
    })
    app.get('/reviews',async(req,res)=>{
      const result = await reviewsCollection.find().toArray();
      res.send(result);
    })

    // cart related api
    app.get('/carts',async(req,res)=>{
      const email = req.query.email;
      const query = {email:email}
      const result = await cartCollection.find(query).toArray();
      res.send(result);
    })
    app.post('/carts',async(req,res)=>{
      const cartItem = req.body;
      const result = await cartCollection.insertOne(cartItem);
      res.send(result); 
    })
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/',(req,res)=>{
    res.send('boss is setting')
})
app.listen(port,()=>{
    console.log(`boss is setting on port ${port}`)
})