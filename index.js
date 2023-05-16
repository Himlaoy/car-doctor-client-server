const express = require('express')
const app = express()
require('dotenv').config()
const jwt = require('jsonwebtoken')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors')
const port = process.env.PORT || 5000


app.use(cors())
app.use(express.json())



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.6ogtg9l.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});


const verifyJwt = (req, res, next)=>{
    const authorization = req.headers.authorization
    if(!authorization){
        return res.status(401).send({error:true, message: 'unauthorized access'})
    }
    const token = authorization.split(' ')[1]

    jwt.verify(token, process.env.DB_USER_SECRET, (error, decoded)=>{
        if(error){
            res.status(403).send({error:true, message:'you are not verified'})
        }
        req.decoded= decoded
       
        next()
    })


}



async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();

        const carDoctorCollection = client.db('carDoctorDB').collection('doctor')
        const carBookingCollection = client.db('carDoctorDB').collection('carDoctor')

        app.post('/jwt', (req,res)=>{
            const user = req.body
            // console.log(user)
            const token = jwt.sign(user, process.env.DB_USER_SECRET,{
                expiresIn:"1h"
            })
            // console.log(token)
            res.send({token})
        })

        app.get('/services', async(req, res)=>{
            const cursor = carDoctorCollection.find()
            const result = await cursor.toArray()
            res.send(result)

        })

        app.get('/services/:id', async (req, res)=>{
            const id = req.params.id
            const query = {_id: new ObjectId(id)}
            const option = {
                projection:{title:1, img:1 , price:1, service_id:1}
            }
            const result = await carDoctorCollection.findOne(query, option)
            res.send(result)
        })

        // car booking

        app.get('/bookings', verifyJwt, async(req,res)=>{
            console.log( req)
            const decoded = req.decoded

            if(decoded.email !== req.query.email){
                return res.send({error:1, message: "forbidden access"})
            }

            let query = {}
            if(req.query?.email){
                query={email: req.query.email}
            }
            const result = await carBookingCollection.find(query).toArray()
            res.send(result)
            
        })

        app.post('/bookings', async(req,res)=>{
            const booking = req.body
            // console.log(booking)
            const result = await carBookingCollection.insertOne(booking)
            res.send(result)
        })

        app.patch('/bookings/:id', async (req, res)=>{
            const id = req.params.id
            const filter = {_id: new ObjectId(id)}
            const updateBook = req.body
            const updateDoc = {
                $set:{
                    status: updateBook.status
                }
            }
            const result = await carBookingCollection.updateOne(filter, updateDoc)
            res.send(result)
        })

        app.delete('/bookings/:id', async(req, res)=>{
            const id = req.params.id
            const query = {_id: new ObjectId(id)}
            const result = await carBookingCollection.deleteOne(query)
            console.log(result)
            res.send(result)
            
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



app.get('/', (req, res) => {
    res.send('amar car doctor ra ready')
})

app.listen(port, () => {
    console.log(`my car doctor is ready on port : ${port}`)
})