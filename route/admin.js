
import express from "express";
import cloudinary from 'cloudinary'
import nodemailer from 'nodemailer';
import admin from "../model/admin.js";
import { randomUUID } from 'crypto'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import Usermodel from '../model/users.js'
import twoFactor from "../model/twoFactor.js";
import kyc from "../model/kyc.js";
import bank from "../model/bank.js";
import rate from "../model/rate.js";


  const transporter = nodemailer.createTransport({
    port: 465,               // true for 465, false for other ports
    host: "smtppro.zoho.com",
       auth: {
            user:'hello@jupitapp.co',
            pass:'re84P3TdZxPA'
            // pass:'ii84NsMqT9Xv'
         },
    secure: true,
    });

const router = express.Router();

router.get('/',(req,res)=>{

    console.log('Welcome to AdminDashboard');
    
    
});
router.post('/checklogin',(req,res)=>{

    admin.findOne({username:req.body.username},(err,docs)=>{
        if(err){
            res.status(400).send(err)
        }
        else if(docs){
            const validPassword = bcrypt.compareSync(req.body.password, docs.password);

            if(validPassword){
                jwt.sign({admin:docs},'secretkey',(err,token)=>{
                    res.json({
                        token,
                        docs,
                        'status':true
                    }),
                   "Stack",{
                       expiresIn:"1h"
                   }
                })
               
            }
            else{
                res.status(400).send({"message":'Invalid Password',"status":false});
            }
            
        }
        else if(!docs){
            res.status(400).send({"message":'Invalid Username',"status":false});
        }
    })
    
    
});

router.post('/onboard/new',(req,res)=>{

    admin.findOne({username:req.body.username},async (err,docs)=>{
        if(err){
            res.status(400).send(err);
        }
        else if(docs){
            res.status(400).send('Username Already Exist');
        }
        else if(!docs){
            admin.findOne({email:req.body.email},async (err,docs)=>{
                if(err){
                    res.status(400).send(err);
                }
                else if(docs){
                    res.status(400).send('Email Already Exist');
                }
                else if(!docs){
                    let password = randomUUID();
                    const salt =  bcrypt.genSaltSync(10);
                    let createAdmin =   await admin.create({
                        firstname:req.body.firstname,
                        lastname:req.body.lastname,
                        email:req.body.email,
                        username:req.body.username,
                        password:bcrypt.hashSync(password, salt),
                    });

                    console.log(req.body)
        
                    if(createAdmin){
                        // await SendPasswordMail(password,req.body.email);
                        const mailData = {
                            from: 'hello@jupitapp.co',  // sender address
                            to: req.body.email,   // list of receivers
                            subject: 'Onboarding@jupitapp.co <One Time Password>',
                            text: 'That was easy!',
                            html: `
                                    <div style="width:100%;height:100vh;background-color:#f5f5f5; display:flex;justify-content:center;align-items:center">
                                        <div style="width:100%; height:70%;background-color:#fff;border-bottom-left-radius:15px;border-bottom-right-radius:15px;">
                                            <hr style="width:100%;height:5px;background-color:#1c1c93"/>
                                            <div style="width:100%;text-align:center">
                                                    <img src="<img src="https://res.cloudinary.com/jupit/image/upload/v1648472935/ocry642pieozdbopltnx.png" />
                                            </div>   
                                            <div style="width:100%;text-align:center;margin-top:20px">
                                                <h2 style="font-family:candara">DEFAULT PASSWORD  </h2>
                                            <div>   
                                            <div style="width:100%;padding-left:20px;text-align:center;padding-top:10px">
                                                <hr style="background-color:#f5f5f5;width:95%"/>
                                            <div>
                                                <div style="width:100%; text-align:center">
                                                    <p style="font-family:candara;padding:10px;font-size:16px">Dear Admin,<br/> Congratulations on the creation of your administrative account on the jupit platform.</p>
                                                    <p style="font-family:candara;padding:10px;font-size:16px>Kindly find below your One Time Password, which should be change upon your successful login to your dashboard.</p>
                                                    <p style="font-family:candara;padding:10px;font-size:20px">OTP:<b>${password}</b><p>
                                                    <p style="font-family:candara;font-weight:bold;margin-top:5px;font-size:16px">If you did not make this request, then ignore the email</p>
                                                   
                                                </div>
                                        
                                            </div>
                                            </div>
                    
                                            <div >
                                            <p style="color:#9DA8B6">If you have any questions, please contact support@jupitapp.co</p>
                                            </div>
                                        </div>
                            
                                    </div>
                                `
                          };
                    
                        transporter.sendMail(mailData, function (err, info) {
                            if(err){
                                console.log(err);
                                // res.status(400).send(err)
                                res.status(400).send({"message":"An Error Occurred","callback":err})
                            }
                            
                            else{
                                
                                res.send({"message":"Admin Creation was Successful..OTP has been sent to the registered Email","callback":info,"status":true})
                                
                            }
                              
                         });
                    }
                    else{
                        res.status(400).send('Admin Creation was Unsuccessful..Contact Dev Team')
                    }
                }
            })

        }
    })
    
    
});

router.get('/get/all/users',middlewareVerify,(req,res)=>{
    Usermodel.find({},(err,docs)=>{
        if(err){
            res.status(400).send({
                "message":err,
                "status":false
            })
        }
        else if(docs){
            res.send({
                "message":docs,
                "status":true
            })
        }
    })
})




async function parseJwt(token){
    try {
        return  JSON.parse(atob(token.split(".")[1]));
      } catch (e) {
        return null;
      }
  }




async function middlewareVerify(req,res,next){
    const bearerHeader = req.headers['authorization'];
    if(typeof bearerHeader === "undefined" || bearerHeader === ""){
        res.status(403).send('Forbidden Request');
    }
    else{
        
        let decodedJwt = await parseJwt(bearerHeader);
        // console.log('Decoded',decodedJwt.user.password);
        console.log(decodedJwt);
        if(!decodedJwt){
            res.status(403).send({"message":"Forbidden Request"});
            return false;
        }
        admin.findOne({email:decodedJwt.admin.email},(err,docs)=>{
            if(err){
                console.log(err)
                res.status(403).send({"message":"Forbidden Request"});
            }
            else if(docs){
                
                if(docs.password === decodedJwt.admin.password){
                    req.token = bearerHeader;
                    next();
                }
                if(docs.password != decodedJwt.admin.password){
                    console.log('Wrong password');
                    res.status(403).send({"message":"Password Expired"});
                }
                // if(docs.SessionMonitor === "Active"){
                //     req.token = bearerHeader;
                //     next();
                // }
                // if(docs.SessionMonitor != "Active"){
                //     console.log('Account Blocked');
                //     res.sendStatus(403);
                // }
                
                // const validPassword = bcrypt.compareSync(password, docs.password);
            }
            else if(!docs){
                res.status(403).send({"message":"Forbidden Request"});
            }
        })
        
    }
}

router.post('/get/all/users/id', async(req,res)=>{

    let userdetails = await fetchUserDetails(req.body.id);
    
    
    if(userdetails){
        let gettwofactor = await fetchtwofactor(req.body.id);
        let getkyc = await fetchkyc(req.body.id);
        let getbank = await fetchbank(userdetails.email);
        let rate = await fetchrate();

        res.send({
            "status":true,
            "detail":userdetails,
            "twofactor":gettwofactor,
            "kyc":getkyc,
            "bank":getbank,
            "rate":rate
            
        })
    }
    else{
        res.status(400).send({"message":"Invalid Request"})
    }

})

async function fetchUserDetails(userid){
   let result =  Usermodel.findOne({_id:userid},async(err,docs)=>{
        if(err){
            // res.status(400).send({"message":err})
            console.log(err)
            return [err,false]
        }
        else if(docs){
            // res.json(docs)
            console.log(docs)
            return [docs,true]
        }
        else if(!docs){
            // res.status(400).send({"message":"Invalid Request"});
            return ["Invalid Request",false]
        }
    
    }).clone().catch(function(err){ console.log(err)});

    return result;

    
}

async function fetchrate (){
    let result = await rate.find({},(err,docs)=>{
        if(err){
            return [err,false]
        }
        else{
            return [docs,true]
        }
    }).clone().catch(function(err){ console.log(err)});
    return result;
}

async function fetchtwofactor(userid){
    let result = await twoFactor.findOne({userid:userid},(err,docs)=>{
        if(err){
            // res.status(400).send({"message":err})
            return [err,false]
        }
        else if(docs){
            // res.json(docs)
            return [docs,true]
        }
        else if(!docs){
            // res.status(400).send({"message":"Invalid Request"});
            return ["Not Activated",false]
        }
    }).clone().catch(function(err){ console.log(err)});

    return result;
}

async function fetchkyc(userid){
    let result = await kyc.findOne({userid:userid},(err,docs)=>{
        if(err){
            // res.status(400).send({"message":err})
            return [err,false]
        }
        else if(docs){
            // res.json(docs)
            return [docs,true]
        }
        else if(!docs){
            // res.status(400).send({"message":"Invalid Request"});
            return ["KYC Error",false]
        }
    }).clone().catch(function(err){ console.log(err)});

    return result;
}


async function fetchbank(email){
    let result = await bank.findOne({email:email},(err,docs)=>{
        if(err){
            // res.status(400).send({"message":err})
            return [err,false]
        }
        else if(docs){
            // res.json(docs)
            return [docs,true]
        }
        else if(!docs){
            // res.status(400).send({"message":"Invalid Request"});
            return ["KYC Error",false]
        }
    }).clone().catch(function(err){ console.log(err)});

    return result;
}

router.post('/manual/wallet/credit',async (req,res)=>{
   
    if(req.body.modalTitle === "BTC Wallet Balance"){
        console.log('btc',req.body.title)
        let AddFund = await Usermodel.findOneAndUpdate({_id:req.body.userid},{$inc:{'btc_wallet.0.balance':parseFloat(req.body.value).toFixed(8)}}).exec();
        if(AddFund){
            res.send({
                "message":"Wallet Successfully Updated",
                "status":true
            })
        }
        else{
            res.send({
                "message":"Wallet Update Error",
                "status":false
            })
        }
    
    }
    else if(req.body.modalTitle === "USDT Wallet Balance"){
        console.log('usdt',req.body.title)
        let AddFund = await Usermodel.findOneAndUpdate({_id:req.body.userid},{$inc:{'usdt_wallet.0.balance':parseFloat(req.body.value).toFixed(6)}}).exec();
        if(AddFund){
            res.send({
                "message":"Wallet Successfully Updated",
                "status":true
            })
        }
        else{
            res.send({
                "message":"Wallet Update Error",
                "status":false
            })
        }
    
    }
    else if(req.body.modalTitle === "Naira Wallet Balance"){
        console.log('naiara',req.body.userid)
        let AddFund = await Usermodel.findOneAndUpdate({_id:req.body.userid},{$inc:{'naira_wallet.0.balance':parseFloat(req.body.value)}}).exec();
        if(AddFund){
            res.send({
                "message":"Wallet Successfully Updated",
                "status":true
            })
        }
        else{
            res.send({
                "message":"Wallet Update Error",
                "status":false
            })
        }
    
    }
    
   
})

router.get('/set/rate',async(req,res)=>{
    let btc_rate=
    [
        {
            "buy":0
        },
        {
            "sell":0
        }

    ]

    let usdt_rate=
    [
        {
            "buy":0
        },
        {
            "sell":0
        }

    ]
    let giftcard_rate=
    [
        {
            "buy":0
        },
        {
            "sell":0
        }

    ]

    
    let initial = "JupitRateBard"
    let initialiseRate = await rate.create({
        initialization:initial
    })
    if (initialiseRate){
        
            btc_rate.forEach(d => {
                    
                rate.findOneAndUpdate({initialization:initial},{$push:{
                btc:d
            }},(err,docs)=>{
                if(err){
                    res.send(err);
                }
                
            })
            
        }); 
        usdt_rate.forEach(d => {
                    
                    rate.findOneAndUpdate({initialization:initial},{$push:{
                    usdt:d
                        }},(err,docs)=>{
                            if(err){
                                res.send(err);
                            }
                            
                        })
        
            }); 
        giftcard_rate.forEach(d => {
                    
            rate.findOneAndUpdate({initialization:initial},{$push:{
            giftcard:d
                }},(err,docs)=>{
                    if(err){
                        res.send(err);
                    }
                    
                })
        
        }); 

        res.send('Completed');


    }
    else{
        res.send('An Error Occurred')
    }
})

router.post('/set/rate/btc',middlewareVerify,(req,res)=>{
    let btc_sell_rate = req.body.amount
    let initial = "JupitRateBard"

    if(req.body.type === "BTC_SELL"){
        
        let x = rate.findOneAndUpdate({initialization:initial},{$set:{'btc.1.sell':req.body.btc_sell}},(err,docs)=>{
            if(err){
                res.send(err);
            }
            else{
                res.send({
                    "message":"BTC Sell Rate Successfully Saved",
                    "docs":docs
                })
            }
        })
    }

    if(req.body.type === "BTC_BUY"){
        
        let x = rate.findOneAndUpdate({initialization:initial},{$set:{'btc.0.buy':req.body.btc_buy}},(err,docs)=>{
            if(err){
                res.send(err);
            }
            else{
                res.send({
                    "message":"BTC Buy Rate Successfully Saved",
                    "docs":docs
                })
            }
        })
    }

    
})



router.post('/set/rate/usdt',middlewareVerify,(req,res)=>{
    let btc_sell_rate = req.body.amount
    let initial = "JupitRateBard"

    if(req.body.type === "USDT_SELL"){
        
        let x = rate.findOneAndUpdate({initialization:initial},{$set:{'usdt.0.sell':req.body.usdt_sell}},(err,docs)=>{
            if(err){
                res.send(err);
            }
            else{
                res.send({
                    "message":"USDT Sell Rate Successfully Saved",
                    "docs":docs
                })
            }
        })
    }

    if(req.body.type === "USDT_BUY"){
        
        let x = rate.findOneAndUpdate({initialization:initial},{$set:{'usdt.1.buy':req.body.usdt_buy}},(err,docs)=>{
            if(err){
                res.send(err);
            }
            else{
                res.send({
                    "message":"USDT Buy Rate Successfully Saved",
                    "docs":docs
                })
            }
        })
    }

    
})


router.post('/set/rate/giftcard',middlewareVerify,(req,res)=>{
    let btc_sell_rate = req.body.amount
    let initial = "JupitRateBard"

    if(req.body.type === "GIFTCARD_SELL"){
        
        let x = rate.findOneAndUpdate({initialization:initial},{$set:{'giftcard.1.sell':req.body.giftcard_sell}},(err,docs)=>{
            if(err){
                res.send(err);
            }
            else{
                res.send({
                    "message":"GIFTCARD Sell Rate Successfully Saved",
                    "docs":docs
                })
            }
        })
    }

    if(req.body.type === "GIFTCARD_BUY"){
        
        let x = rate.findOneAndUpdate({initialization:initial},{$set:{'giftcard.0.buy':req.body.giftcard_buy}},(err,docs)=>{
            if(err){
                res.send(err);
            }
            else{
                res.send({
                    "message":"GIFTCARD Buy Rate Successfully Saved",
                    "docs":docs
                })
            }
        })
    }

    
})

router.post('/set/password',(req,res)=>{

    const salt =  bcrypt.genSaltSync(10);
    let newpassword =  bcrypt.hashSync(req.body.password, salt)
     
   let x = admin.findOneAndUpdate({_id:req.body.userid},{$set:{password:newpassword,changepassword:true}},(err,docs)=>{
       if(err){
           res.status(400).send({"message":err,"status":false})
       }
       else if(docs){
           res.send({"message":'Password Successfully Updated',"status":true})
       }
       else if(!docs){
        res.status(400).send({"message":'Internal Server Error',"status":false})
       }
   })
})


export default router