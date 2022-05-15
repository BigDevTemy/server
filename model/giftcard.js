import mongoose from 'mongoose'

const giftcardSchema = mongoose.Schema({
    cardname:{
        type:'String',
        unique:true,
        required: [true, "Required"],
    },
    currency : { type : Array , "default" : [] },
    cardType : { type : Array , "default" : [] },
    rate : { type : Array , "default" : [] },
    date_created:{
        type:Date

    },
    
    updated: { type: Date, default: Date.now },
})


export default mongoose.model('Giftcard', giftcardSchema);