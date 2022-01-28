const express = require('express');
const app=express();
const cors= require('cors');
require('dotenv').config()
const { MongoClient } = require('mongodb');
const port=process.env.PORT || 5000;
const ObjectId = require("mongodb").ObjectId;
const admin = require("firebase-admin");
app.use(cors())
app.use(express.json());

// verify token 

// const serviceAccount =JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
const serviceAccount = require('./foodLover-firebase-adminsdk.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// dATABASE CONNECTING 
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.imlla.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });


// verify token 
async function verifyToken(req,res,next){

    if(req?.headers?.authorization?.startsWith('Bearer ')){
        const token=req?.headers?.authorization?.split(' ')[1];
    try{
        const decodedUser=await admin.auth().verifyIdToken(token);
        req.decodedEmail=decodedUser.email
    }
    catch{

    }
    
    }

    next()
}

async function run(){

    try{
            await client.connect();
            const database= client.db('foodLoverInfo');
            const foodCollection=database.collection('addFoods')
            const userCollection=database.collection('users')
   
   
// food adding POST AIP
app.post('/addFoods',async(req,res)=>{
    const newFood=req.body;
    const result= await foodCollection.insertOne(newFood);
    res.json(result)
})

// get food api
app.get('/addFoods',async(req,res)=>{
    const result=await foodCollection.find({}).toArray();
    res.send(result)
})

// delete comming food 
app.delete("/addFoods/:id", async (req, res) => {
    const id=req.params.id;
    const query={_id:ObjectId(id)};
    const result=await foodCollection.deleteOne(query)
    res.json(result)
  });

// user save database
app.post('/users',async(req,res)=>{
    const user=req.body;
    const result=await userCollection.insertOne(user);
    res.json(result)
})

// admin email varify
app.get('/users/:email',async (req,res)=>{
    const email= req.params.email;
    const query={email:email};
    const user=await userCollection.findOne(query);
    let isAdmin=false;
    if(user?.role==='admin'){
        isAdmin=true
    }
    res.json({admin:isAdmin})
})

// make admin
   app.put('/users/makeAdmin',verifyToken,async (req,res)=>{
       const user=req.body;
       const requester=req.decodedEmail;
       if(requester){
           const requsterAccount=await userCollection.findOne({email:requester})
        if(requsterAccount.role==='admin'){
            const filter={email:user.email};
       const updateDoc={$set:{role:'admin'}};
       const result=await userCollection.updateOne(filter,updateDoc)
       res.json(result)
        }
        }
        else{
            res.status(403).json({message:'You do not have access to make admin.'})
        }


       
   })
   
        }
    finally{
            // await client.close()
    }
}
run().catch(console.dir)





app.get('/', (req,res)=>{
    res.send("Welcome to Server.")
})

app.listen(port,()=>{
    console.log('Wellcome!')
})