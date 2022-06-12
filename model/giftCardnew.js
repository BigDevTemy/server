import double from '@mongoosejs/double';
import mongoose from 'mongoose'

const giftcardSchema = mongoose.Schema({
    brandname:{
        type:'String',
        
    },
    image_url:{type:'String'},
    countries : {type:Array, "default":[]},
    rate : {type:Array,"default":[]},
    date_created:{
        type:Date

    },
    buyrate:{type:double},
    sellrate:{type:double},
    updated: { type: Date, default: Date.now },
})


export default mongoose.model('Giftcardnew', giftcardSchema);