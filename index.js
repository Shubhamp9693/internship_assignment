const express = require('express')
const mongoose = require('mongoose')
var jwt = require('jsonwebtoken');
const dotenv = require('dotenv')
const csvParser = require("csv-parser")
const fs = require("fs");

const User = require('./models/User')
const Product = require('./models/Product')
const uploadFile = require('./multer');

dotenv.config()
const app = express()
mongoose.connect('mongodb+srv://user:user@cluster0.jos9u.mongodb.net/?retryWrites=true&w=majority', {
    useNewUrlParser: true,
})

app.use(express.json())

app.get('/signup', async (req, res) => {
    const data = req.body
    let user = await User.find({ username: data.username })
    console.log(user)
    if(user.length > 0){
        res.send('User Available')
    } else {
        user = new User({
            firstName: data.firstName,
            lastName: data.lastName,
            username: data.username,
            password: data.password,
        })
        await user.save()
        res.sendStatus(200)
    }
})

app.get('/login', async (req, res) => {
    const data = req.body
    let user = await User.find({ username: data.username })
    if (user.length === 0){
        res.send('User does not exists')
    } else {
        user = user[0]
        if(data.password !== user.password){
            res.send("Password Wrong")
        } else {
            var token = jwt.sign({ username: data.username }, process.env.JWT_KEY)
            res.json({ token })
        }
    }
})

app.use(async (req,res,next) => {
    const token = req.header('Authorization').substring(7)
    let decodedToken
    try {
        decodedToken = jwt.verify(token, process.env.JWT_KEY)
    } catch(err) {
        res.send('Invalid token')
    }
    const user = await User.find({ username: decodedToken.username })
    if (user.length === 0) {
        res.send('User does not exists')
    }
    req.user = user[0]
    next()
})

app.post('/uploadproducts', uploadFile.single('csv'), async (req, res, next) => {
    let results = []
    fs.createReadStream(req.file.path)
        .pipe(csvParser())
        .on("data", (data) => {
            data._createdBy = req.user.username
            results.push(data)
        })
        .on("end", () => {
            Product.insertMany(results)
            res.sendStatus(200)
        });
})
app.get('/fetchUserList', async (req, res) => {
    const users = await User.find({}).select('username')
    res.json(users)
})
app.get('/fetchUserDetails', (req,res) => {
    res.json(req.user)
})
app.get('/fetchProductList', async (req,res) => {
    const products = await Product.find({_createdBy: req.user.username})
    res.json(products)
})


app.listen(3000)