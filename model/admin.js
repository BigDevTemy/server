import mongoose from 'mongoose'

const adminSchema = mongoose.Schema({
    firstname:{
        type:'String',
       
        required: [true, "Required"],
    },
    lastname:{
        type:'String',
        
        required: [true, "Required"],
    },
    username:{
        type:'String',
        unique:true,
        required: [true, "Required"],
    },
    email:{
        type:'String',
        required: [true, "Required"],
        unique:true,
        lowercase: true,
        match: [/\S+@\S+\.\S+/, 'is invalid']
    },
    password:{
        type:'String',
        required: [true, "Required"],
    },
    role:{
        type:'String'

    },
    roleid:{
        type:Number
    },
    previledge:{
        type:Array, "default":[]
    },
    status:{
        type:'String'
    },
    changepassword:{
        type:Boolean
    },
    loginTime:{
        type:'String'
    },
    reauthorization:{
        type:Date
    },
    updated: { type: Date, default: Date.now },
})

// const User = mongoose.model('User',userSchema);
// module.exports = User;

// module.exports = mongoose.model('User',userSchema)
export default mongoose.model('Admin', adminSchema);