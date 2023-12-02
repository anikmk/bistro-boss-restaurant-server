require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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
    const userCollection = client.db("bistroDB").collection("users")
    const menuCollection = client.db("bistroDB").collection("menu")
    const reviewsCollection = client.db("bistroDB").collection("reviews")
    const cartCollection = client.db("bistroDB").collection("carts")

    // jwt releted api
    app.post('/jwt',async(req,res)=>{
      const user = req.body;
      const token = jwt.sign(user,process.env.ACCESS_TOKEN_SECRET,{expiresIn:'1h'});
      res.send({token});
    })
    //  middleware verify Token
    const verifyToken = (req,res,next) => {
      // console.log('inside verify token',req.headers.authorization);
      if(!req.headers.authorization){
        return res.status(401).send({message: 'unauthorized access'});
      }
      const token = req.headers.authorization.split(' ')[1];
      jwt.verify(token,process.env.ACCESS_TOKEN_SECRET,(err,decoded)=>{
        if(err){
          return res.status(401).send({message:'unauthorized acoount'})
        }
        req.decoded = decoded;
        next();
      })
    }
    // use verify admin after verifyToken
    const verifyAdmin = async(req,res,next) => {
      const email = req.decoded.email;
      const query = {email: email};
      const user = await userCollection.findOne(query);
      const isAdmin = user?.role === 'admin';
      if(!isAdmin){
        return res.status(403).send({message:'forbidden access'})
      }
      next();
    }
    // user releted api
    app.get('/users', verifyToken, verifyAdmin,async(req,res)=>{
      const result = await userCollection.find().toArray();
      res.send(result);

    })

    app.get('/users/admin/:email', verifyToken, async(req,res)=>{
      const email = req.params.email;
      if(email !== req.decoded.email){
        return res.status(403).send({message:'forbidden access'})
      }
      const query = {email: email};
      const user = await userCollection.findOne(query);
      let admin = false;
      if(user){
        admin = user?.role === 'admin';
      }
      res.send({admin});
    })

    app.post('/users',async(req,res)=>{
      const userInfo = req.body;
      // insert email if user dose not exist
      const query = {email: userInfo.email}
      const existingUser = await userCollection.findOne(query);
      if(existingUser){
        return res.send({message:"user already exists",insertedId: null})
      }
      const result = await userCollection.insertOne(userInfo);
      res.send(result);
    })
    app.patch('/users/admin/:id', verifyToken,verifyAdmin,async(req,res)=>{
      const id = req.params.id;
      const filter = {_id: new ObjectId(id)}
      const updatedDoc = {
        $set: {
          role:'admin'
        }
      }
      const result = await userCollection.updateOne(filter,updatedDoc);
      res.send(result);
    })

    app.delete('/users/:id', verifyToken,verifyAdmin,async(req,res)=>{
      const id = req.params.id;
      const query = {_id: new ObjectId(id)}
      const result = await userCollection.deleteOne(query);
      res.send(result);
    })
    // menu releted apis

    app.get('/menu',async(req,res)=>{
      const result = await menuCollection.find().toArray();
      res.send(result);
    })
    app.get('/menu/:id',async(req,res)=>{
      const id = req.params.id;
      const query = {_id: new ObjectId(id)}
      const result = await menuCollection.findOne(query);
      res.send(result);
    })

    app.post('/menu', verifyToken,verifyAdmin, async(req,res)=>{
      const item = req.body;
      const result = await menuCollection.insertOne(item);
      res.send(result);
    })
    app.patch('/menu/:id',async(req,res)=>{
      const item = req.body;
      const id = req.params.id;
      const filter = {_id: new ObjectId(id)}
      const updatedDoc = {
        $set:{
          name: item.name,
          category: item.category,
          price:item.price,
          recipe:item.recipe,
          image:item.image
        }
      }
      const result = await menuCollection.updateOne(filter,updatedDoc);
      res.send(result);
    })

    app.delete('/menu/:id', verifyToken,verifyAdmin, async(req,res)=>{
      const id = req.params.id;
      const query = {_id: new ObjectId(id)}
      const result = await menuCollection.deleteOne(query);
      res.send(result);
    })

    // reviews releted api
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
    app.delete('/carts/:id',async(req,res)=>{
      const id = req.params.id;
      const query = {_id: new ObjectId(id)}
      const result = await cartCollection.deleteOne(query);
      res.send(result);
    })
    // payment intent
    app.post('/create-payment-intent',async(req,res)=>{
      const {price} = req.body;
      const amount = parseInt(price*100);
      console.log(amount,'insite the amount')
      const paymentIntent = await stripe.paymentIntents.create({
        amount:amount,
        currency:'usd',
        payment_method_types: ["card"]
      });
      res.send({
        clientSecret:paymentIntent.client_secret
      })

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