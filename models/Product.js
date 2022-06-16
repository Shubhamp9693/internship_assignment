const mongoose = require('mongoose')

const productSchema = new mongoose.Schema({
    name: { type: String },
    quantity: { type: Number },
    price: { type: Number },
    _createdBy: { type: String }
})

module.exports = mongoose.model('Product', productSchema)