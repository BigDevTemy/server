import express from "express";
import Usermodel from '../model/users.js';
import KycModel from '../model/kyc.js';
import WebHook from "../model/webhook.js";
import TwoFactor from "../model/twoFactor.js";
import PinCreation from '../model/setup_pin.js'
import Notification from "../model/notification.js";
import Kyc from '../model/kyc.js'
import IdCardVerification from '../model/idcardverification.js'
import Walletmodel from '../model/wallet_transactions.js'
import Bankmodel from "../model/bank.js";
import axios from "axios";
import crypto from 'crypto';
import querystring from 'querystring';
import random from 'random-number';
import nodemailer from 'nodemailer';
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import path from 'path';
import AWS from 'aws-sdk'
import multer from "multer";
import { cwd } from "process";
import SpeakEasy from 'speakeasy'

import cloudinary from 'cloudinary'
import changepassword from "../model/changepassword.js";
import session from "../model/session.js";
import { readdirSync } from "fs";
import NodeDateTime from 'node-datetime';
import idcardverification from "../model/idcardverification.js";
import bank from "../model/bank.js";
cloudinary.config({ 
    cloud_name: 'jupit', 
    api_key: '848134193962787', 
    api_secret: '57S453gwuBc1_vypuLOcqYQ2V5o' 
  });

const upload = multer({ dest: 'uploads/' })
   // user: 'bigdevtemy@gmail.com',
            // pass: 'vyafmhqbffkiawrc',
const transporter = nodemailer.createTransport({
    port: 465,               // true for 465, false for other ports
    host: "smtppro.zoho.com",
       auth: {
            user:'hello@jupitapp.co',
            pass:'w6vBmv6624eW'
            // pass:'ii84NsMqT9Xv'
         },
    secure: true,
    });
    

const router = express.Router();



router.get('/sendmail',(req,res)=>{
    const mailData = {
        from: '<Jupit>hello@jupitapp.co',  // sender address
        to: 'hademylola@gmail.com',   // list of receivers
        subject: 'Email Verification <jupit.app>',
        text: 'That was easy!',
        html: `
                <div style="width:100%;height:100vh;background-color:#f5f5f5; display:flex;justify-content:center;align-items:center">
                    <div style="width:100%; height:70%;background-color:#fff;border-bottom-left-radius:15px;border-bottom-right-radius:15px;">
                        <hr style="width:100%;height:5px;background-color:#1c1c93"/>
                        <div style="width:100%;text-align:center">
                                <img src="https://res.cloudinary.com/jupit/image/upload/v1648472935/ocry642pieozdbopltnx.png" />
                        </div>   
                        <div style="width:100%;text-align:center;margin-top:20px">
                            <h2 style="font-family:candara">Email Verification  </h2>
                        <div>   
                        <div style="width:100%;padding-left:20px;text-align:center;padding-top:10px">
                            <hr style="background-color:#f5f5f5;width:95%"/>
                        <div>
                            <div style="width:100%; text-align:center">
                                <p style="font-family:candara;padding:10px;font-size:16px">To verify your email address, kindly click on the button below</p>
                                <p style="font-family:candara;font-weight:bold;margin-top:5px;font-size:16px">If you did not make this request, then ignore the email</p>
                                <a href="https://myjupit.herokuapp.com/users/jupit/emailverification/e9p5ikica6f19gdsmqta/qvrse/" style="cursor:pointer"><button style="width:100%;height:40px;font-family:candara;font-size:18px;font-weight:bold;cursor:pointer;background-color:#ffc857;border:1px solid #ffc857">Verify Email Address</button></a>
                            </div>
                            <div style="width:100%; text-align:center">
                            <p style="font-family:candara;padding:5px">If you have trouble paste below link in your browser</p>
                            <p style="font-family:candara;padding:5px;color:#1c1c93;font-weight:bold">https://myjupit.herokuapp.com/users/jupit/emailverification/e9p5ikica6f19gdsmqta/qvrse</p>
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
            console.log("mailErr",err);
            res.send({"message":"An Error Occurred","callback":err})
        }
        
        else{
            

            
            res.send({"message":"Kindly Check Mail for Account Verification Link","callback":info,"status":true})
            
        }
          
     });
    

})


router.post('/save/pin',middlewareVerify,(req,res)=>{
    let userid = req.body.userid;
    // console.log(req.body)
    PinCreation.findOne({userid:userid}, async function(err,docs){
        if(err){
            // console.log(err)
            res.status(400).send(err);
            
        
        }
        else if(docs){
            // console.log('Keeper',docs)
            if(docs.code === req.body.otp){

                const salt =  bcrypt.genSaltSync(10);
                let encryptedpin =  bcrypt.hashSync(req.body.createdpin, salt)
                //let update = Usermodel.findOneAndUpdate({_id:userid},[{'Pin_Created':true},{'wallet_pin':req.body.createdpin}]).exec();
                let update = await Usermodel.updateMany({_id:userid},{ $set: { Pin_Created: true,wallet_pin:encryptedpin } });
                if(update){
                    // console.log("Update Errr")
                    res.send({'message':'Pin Successfully Saved','status':true});
                }
                else{
                    res.status(400).send('Pin Creation was Unsuccessful');
                }
            }
            else{
                res.status(400).send('Invalid Token');
            }
        }
        else if(!docs){
            res.status(400).send('Internal Server Error')
        }
    })
})
router.post('/sendOTP/wallet/pin/creation',middlewareVerify,(req,res)=>{

    let userid = req.body.userid;
    
    const random = Math.floor(1000 + Math.random() * 9000);
    PinCreation.findOne({userid:userid},function(err,docs){
        if(err){
            res.status(400).send(err);
        }
        else if(docs){
            
            let updateCode =   PinCreation.findOneAndUpdate({userid:userid},{'code':random}).exec();
            if(updateCode){

                const mailData = {
                    from: 'Jupit <hello@jupitapp.co>',  // sender address
                    to: req.body.email,   // list of receivers
                    subject: 'WALLET PIN CREATION CODE',
                    text: 'That was easy!',
                    html: `
                            <!DOCTYPE HTML PUBLIC "-//W3C//DTD XHTML 1.0 Transitional //EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
                            <html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
                            
                            <head>
                            <!--[if gte mso 9]>
                            <xml>
                            <o:OfficeDocumentSettings>
                                <o:AllowPNG/>
                                <o:PixelsPerInch>96</o:PixelsPerInch>
                            </o:OfficeDocumentSettings>
                            </xml>
                            <![endif]-->
                            <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
                            <meta name="viewport" content="width=device-width, initial-scale=1.0">
                            <meta name="x-apple-disable-message-reformatting">
                            <!--[if !mso]><!-->
                            <meta http-equiv="X-UA-Compatible" content="IE=edge">
                            <!--<![endif]-->
                            <title></title>
                            
                            <style type="text/css">
                                @media only screen and (min-width: 620px) {
                                .u-row {
                                    width: 600px !important;
                                }
                                .u-row .u-col {
                                    vertical-align: top;
                                }
                                .u-row .u-col-100 {
                                    width: 600px !important;
                                }
                                }
                                
                                @media (max-width: 620px) {
                                .u-row-container {
                                    max-width: 100% !important;
                                    padding-left: 0px !important;
                                    padding-right: 0px !important;
                                }
                                .u-row .u-col {
                                    min-width: 320px !important;
                                    max-width: 100% !important;
                                    display: block !important;
                                }
                                .u-row {
                                    width: calc(100% - 40px) !important;
                                }
                                .u-col {
                                    width: 100% !important;
                                }
                                .u-col>div {
                                    margin: 0 auto;
                                }
                                }
                                
                                body {
                                margin: 0;
                                padding: 0;
                                }
                                
                                table,
                                tr,
                                td {
                                vertical-align: top;
                                border-collapse: collapse;
                                }
                                
                                p {
                                margin: 0;
                                }
                                
                                .ie-container table,
                                .mso-container table {
                                table-layout: fixed;
                                }
                                
                                * {
                                line-height: inherit;
                                }
                                
                                a[x-apple-data-detectors='true'] {
                                color: inherit !important;
                                text-decoration: none !important;
                                }
                                
                                table,
                                td {
                                color: #000000;
                                }
                                
                                a {
                                color: #0000ee;
                                text-decoration: underline;
                                }
                            </style>
                            
                            
                            
                            <!--[if !mso]><!-->
                            <link href="https://fonts.googleapis.com/css?family=Cabin:400,700" rel="stylesheet" type="text/css">
                            <!--<![endif]-->
                            
                            </head>
                            
                            <body class="clean-body u_body" style="margin: 0;padding: 0;-webkit-text-size-adjust: 100%;background-color: #f9f9f9;color: #000000">
                            <!--[if IE]><div class="ie-container"><![endif]-->
                            <!--[if mso]><div class="mso-container"><![endif]-->
                            <table style="border-collapse: collapse;table-layout: fixed;border-spacing: 0;mso-table-lspace: 0pt;mso-table-rspace: 0pt;vertical-align: top;min-width: 320px;Margin: 0 auto;background-color: #f9f9f9;width:100%" cellpadding="0" cellspacing="0">
                                <tbody>
                                <tr style="vertical-align: top">
                                    <td style="word-break: break-word;border-collapse: collapse !important;vertical-align: top">
                                    <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" style="background-color: #f9f9f9;"><![endif]-->
                            
                            
                                    <div class="u-row-container" style="padding: 0px;background-color: transparent">
                                        <div class="u-row" style="Margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: transparent;">
                                        <div style="border-collapse: collapse;display: table;width: 100%;background-color: transparent;">
                                            <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px;background-color: transparent;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:600px;"><tr style="background-color: transparent;"><![endif]-->
                            
                                            <!--[if (mso)|(IE)]><td align="center" width="600" style="width: 600px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;" valign="top"><![endif]-->
                                            <div class="u-col u-col-100" style="max-width: 320px;min-width: 600px;display: table-cell;vertical-align: top;">
                                            <div style="width: 100% !important;">
                                                <!--[if (!mso)&(!IE)]><!-->
                                                <div style="padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;">
                                                <!--<![endif]-->
                            
                                                <table style="font-family:'Cabin',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                                                    <tbody>
                                                    <tr>
                                                        <td style="overflow-wrap:break-word;word-break:break-word;padding:10px;font-family:'Cabin',sans-serif;" align="left">
                            
                                                        <div style="color: #afb0c7; line-height: 170%; text-align: center; word-wrap: break-word;">
                                                            <p style="font-size: 14px; line-height: 170%;"><span style="font-size: 14px; line-height: 23.8px;"></span></p>
                                                        </div>
                            
                                                        </td>
                                                    </tr>
                                                    </tbody>
                                                </table>
                            
                                                <!--[if (!mso)&(!IE)]><!-->
                                                </div>
                                                <!--<![endif]-->
                                            </div>
                                            </div>
                                            <!--[if (mso)|(IE)]></td><![endif]-->
                                            <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
                                        </div>
                                        </div>
                                    </div>
                            
                            
                            
                                    <div class="u-row-container" style="padding: 0px;background-color: transparent">
                                        <div class="u-row" style="Margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: #ffffff;">
                                        <div style="border-collapse: collapse;display: table;width: 100%;background-color: transparent;">
                                            <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px;background-color: transparent;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:600px;"><tr style="background-color: #ffffff;"><![endif]-->
                            
                                            <!--[if (mso)|(IE)]><td align="center" width="600" style="width: 600px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;" valign="top"><![endif]-->
                                            <div class="u-col u-col-100" style="max-width: 320px;min-width: 600px;display: table-cell;vertical-align: top;">
                                            <div style="width: 100% !important;">
                                                <!--[if (!mso)&(!IE)]><!-->
                                                <div style="padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;">
                                                <!--<![endif]-->
                            
                                                <table style="font-family:'Cabin',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                                                    <tbody>
                                                    <tr>
                                                        <td style="overflow-wrap:break-word;word-break:break-word;padding:20px;font-family:'Cabin',sans-serif;" align="left">
                            
                                                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                                            <tr>
                                                            <td style="padding-right: 0px;padding-left: 0px;" align="center">
                            
                                                            <img align="center" border="0" src="https://res.cloudinary.com/jupit/image/upload/v1656160429/JUPIT-Logo-Wordmark_1_jo6ivd.png" alt="Image" title="Image" style="outline: none;text-decoration: none;-ms-interpolation-mode: bicubic;clear: both;display: inline-block !important;border: none;height: auto;float: none;width: 32%;max-width: 179.2px;"
                                                            width="179.2" />
                            
                                                            </td>
                                                            </tr>
                                                        </table>
                            
                                                        </td>
                                                    </tr>
                                                    </tbody>
                                                </table>
                            
                                                <!--[if (!mso)&(!IE)]><!-->
                                                </div>
                                                <!--<![endif]-->
                                            </div>
                                            </div>
                                            <!--[if (mso)|(IE)]></td><![endif]-->
                                            <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
                                        </div>
                                        </div>
                                    </div>
                            
                            
                            
                                    <div class="u-row-container" style="padding: 0px;background-color: transparent">
                                        <div class="u-row" style="Margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: #003399;">
                                        <div style="border-collapse: collapse;display: table;width: 100%;background-color: transparent;">
                                            <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px;background-color: transparent;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:600px;"><tr style="background-color: #003399;"><![endif]-->
                            
                                            <!--[if (mso)|(IE)]><td align="center" width="600" style="width: 600px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;" valign="top"><![endif]-->
                                            <div class="u-col u-col-100" style="max-width: 320px;min-width: 600px;display: table-cell;vertical-align: top;">
                                            <div style="width: 100% !important;">
                                                <!--[if (!mso)&(!IE)]><!-->
                                                <div style="padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;">
                                                <!--<![endif]-->
                            
                                                <table style="font-family:'Cabin',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                                                    <tbody>
                                                    <tr>
                                                        <td style="overflow-wrap:break-word;word-break:break-word;padding:40px 10px 10px;font-family:'Cabin',sans-serif;" align="left">
                            
                                                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                                            <tr>
                                                            <td style="padding-right: 0px;padding-left: 0px;" align="center">
                            
                                                                <img align="center" border="0" src="https://cdn.templates.unlayer.com/assets/1597218650916-xxxxc.png" alt="Image" title="Image" style="outline: none;text-decoration: none;-ms-interpolation-mode: bicubic;clear: both;display: inline-block !important;border: none;height: auto;float: none;width: 26%;max-width: 150.8px;"
                                                                width="150.8" />
                            
                                                            </td>
                                                            </tr>
                                                        </table>
                            
                                                        </td>
                                                    </tr>
                                                    </tbody>
                                                </table>
                            
                                                <table style="font-family:'Cabin',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                                                    <tbody>
                                                    <tr>
                                                        <td style="overflow-wrap:break-word;word-break:break-word;padding:10px;font-family:'Cabin',sans-serif;" align="left">
                            
                                                        <div style="color: #e5eaf5; line-height: 140%; text-align: center; word-wrap: break-word;">
                                                            <p style="font-size: 14px; line-height: 140%;"><strong>WALLET PIN CREATION</strong></p>
                                                        </div>
                            
                                                        </td>
                                                    </tr>
                                                    </tbody>
                                                </table>
                            
                                                <table style="font-family:'Cabin',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                                                    <tbody>
                                                    <tr>
                                                        <td style="overflow-wrap:break-word;word-break:break-word;padding:0px 10px 31px;font-family:'Cabin',sans-serif;" align="left">
                            
                                                        <div style="color: #e5eaf5; line-height: 140%; text-align: center; word-wrap: break-word;">
                                                            <p style="font-size: 14px; line-height: 140%;"><span style="font-size: 28px; line-height: 39.2px;"><strong><span style="line-height: 39.2px; font-size: 28px;">Wallet Pin Creation Code</span></strong>
                                                            </span>
                                                            </p>
                                                        </div>
                            
                                                        </td>
                                                    </tr>
                                                    </tbody>
                                                </table>
                            
                                                <!--[if (!mso)&(!IE)]><!-->
                                                </div>
                                                <!--<![endif]-->
                                            </div>
                                            </div>
                                            <!--[if (mso)|(IE)]></td><![endif]-->
                                            <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
                                        </div>
                                        </div>
                                    </div>
                            
                            
                            
                                    <div class="u-row-container" style="padding: 0px;background-color: transparent">
                                        <div class="u-row" style="Margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: #ffffff;">
                                        <div style="border-collapse: collapse;display: table;width: 100%;background-color: transparent;">
                                            <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px;background-color: transparent;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:600px;"><tr style="background-color: #ffffff;"><![endif]-->
                            
                                            <!--[if (mso)|(IE)]><td align="center" width="600" style="width: 600px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;" valign="top"><![endif]-->
                                            <div class="u-col u-col-100" style="max-width: 320px;min-width: 600px;display: table-cell;vertical-align: top;">
                                            <div style="width: 100% !important;">
                                                <!--[if (!mso)&(!IE)]><!-->
                                                <div style="padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;">
                                                <!--<![endif]-->
                            
                                                <table style="font-family:'Cabin',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                                                    <tbody>
                                                    <tr>
                                                        <td style="overflow-wrap:break-word;word-break:break-word;padding:33px 55px;font-family:'Cabin',sans-serif;" align="left">
                            
                                                        <div style="line-height: 160%; text-align: center; word-wrap: break-word;">
                                                            <p style="font-size: 14px; line-height: 160%;"><span style="font-size: 22px; line-height: 35.2px;">Dear User, </span></p>
                                                            <p style="font-size: 14px; line-height: 160%;"><span style="font-size: 18px; line-height: 28.8px;">Your wallet pin creation is almost finalized, kindly use the code below to confirm the process on your app.</span></p>
                                                            <p style="font-size: 14px; line-height: 160%;">&nbsp;</p>
                                                            <p style="font-size: 14px; line-height: 160%;"><span style="font-family: 'arial black', 'avant garde', arial; font-size: 14px; line-height: 22.4px;"><strong><span style="font-size: 24px; line-height: 38.4px;">${random} </span></strong>
                                                            </span>
                                                            </p>
                                                        </div>
                            
                                                        </td>
                                                    </tr>
                                                    </tbody>
                                                </table>
                            
                                                <table style="font-family:'Cabin',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                                                    <tbody>
                                                    <tr>
                                                        <td style="overflow-wrap:break-word;word-break:break-word;padding:33px 55px 60px;font-family:'Cabin',sans-serif;" align="left">
                            
                                                        <div style="line-height: 160%; text-align: center; word-wrap: break-word;">
                                                            <p style="line-height: 160%; font-size: 14px;"><span style="font-size: 18px; line-height: 28.8px;">Thanks,</span></p>
                                                            <p style="line-height: 160%; font-size: 14px;"><span style="font-size: 18px; line-height: 28.8px;">The Jupit Support Team</span></p>
                                                        </div>
                            
                                                        </td>
                                                    </tr>
                                                    </tbody>
                                                </table>
                            
                                                <!--[if (!mso)&(!IE)]><!-->
                                                </div>
                                                <!--<![endif]-->
                                            </div>
                                            </div>
                                            <!--[if (mso)|(IE)]></td><![endif]-->
                                            <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
                                        </div>
                                        </div>
                                    </div>
                            
                            
                            
                                    <div class="u-row-container" style="padding: 0px;background-color: transparent">
                                        <div class="u-row" style="Margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: #e5eaf5;">
                                        <div style="border-collapse: collapse;display: table;width: 100%;background-color: transparent;">
                                            <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px;background-color: transparent;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:600px;"><tr style="background-color: #e5eaf5;"><![endif]-->
                            
                                            <!--[if (mso)|(IE)]><td align="center" width="600" style="width: 600px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;" valign="top"><![endif]-->
                                            <div class="u-col u-col-100" style="max-width: 320px;min-width: 600px;display: table-cell;vertical-align: top;">
                                            <div style="width: 100% !important;">
                                                <!--[if (!mso)&(!IE)]><!-->
                                                <div style="padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;">
                                                <!--<![endif]-->
                            
                                                <table style="font-family:'Cabin',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                                                    <tbody>
                                                    <tr>
                                                        <td style="overflow-wrap:break-word;word-break:break-word;padding:41px 55px 18px;font-family:'Cabin',sans-serif;" align="left">
                            
                                                        <div style="color: #003399; line-height: 160%; text-align: center; word-wrap: break-word;">
                                                            <p style="font-size: 14px; line-height: 160%;"><span style="font-size: 20px; line-height: 32px;"><strong>Get in touch</strong></span></p>
                                                            <p style="font-size: 14px; line-height: 160%;">+2348088213177</p>
                                                            <p style="font-size: 14px; line-height: 160%;"><span style="font-size: 16px; line-height: 25.6px; color: #000000;"><a rel="noopener" href="mailto:support@jupitapp.co" target="_blank">support@jupitapp.co</a></span></p>
                                                            <p style="font-size: 14px; line-height: 160%;"><span style="font-size: 16px; line-height: 25.6px; color: #000000;">https://www.jupitapp.co</span></p>
                                                        </div>
                            
                                                        </td>
                                                    </tr>
                                                    </tbody>
                                                </table>
                            
                                                <table style="font-family:'Cabin',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                                                    <tbody>
                                                    <tr>
                                                        <td style="overflow-wrap:break-word;word-break:break-word;padding:10px 10px 33px;font-family:'Cabin',sans-serif;" align="left">
                            
                                                        <div align="center">
                                                            <div style="display: table; max-width:244px;">
                                                            <!--[if (mso)|(IE)]><table width="244" cellpadding="0" cellspacing="0" border="0"><tr><td style="border-collapse:collapse;" align="center"><table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse; mso-table-lspace: 0pt;mso-table-rspace: 0pt; width:244px;"><tr><![endif]-->
                            
                            
                                                            <!--[if (mso)|(IE)]><td width="32" style="width:32px; padding-right: 17px;" valign="top"><![endif]-->
                                                            
                                                            <!--[if (mso)|(IE)]></td><![endif]-->
                            
                                                            <!--[if (mso)|(IE)]><td width="32" style="width:32px; padding-right: 17px;" valign="top"><![endif]-->
                                                           
                                                            <!--[if (mso)|(IE)]></td><![endif]-->
                            
                                                            <!--[if (mso)|(IE)]><td width="32" style="width:32px; padding-right: 17px;" valign="top"><![endif]-->
                                                            <table align="left" border="0" cellspacing="0" cellpadding="0" width="32" height="32" style="border-collapse: collapse;table-layout: fixed;border-spacing: 0;mso-table-lspace: 0pt;mso-table-rspace: 0pt;vertical-align: top;margin-right: 17px">
                                                                <tbody>
                                                                <tr style="vertical-align: top">
                                                                    <td align="left" valign="middle" style="word-break: break-word;border-collapse: collapse !important;vertical-align: top">
                                                                    <a href="https://instagram.com/jupit.app" title="Instagram" target="_blank">
                                                                        <img src="https://cdn.tools.unlayer.com/social/icons/circle-black/instagram.png" alt="Instagram" title="Instagram" width="32" style="outline: none;text-decoration: none;-ms-interpolation-mode: bicubic;clear: both;display: block !important;border: none;height: auto;float: none;max-width: 32px !important">
                                                                    </a>
                                                                    </td>
                                                                </tr>
                                                                </tbody>
                                                            </table>
                                                            <!--[if (mso)|(IE)]></td><![endif]-->
                            
                                                            <!--[if (mso)|(IE)]><td width="32" style="width:32px; padding-right: 17px;" valign="top"><![endif]-->
                                                            
                                                            <!--[if (mso)|(IE)]></td><![endif]-->
                            
                                                            <!--[if (mso)|(IE)]><td width="32" style="width:32px; padding-right: 0px;" valign="top"><![endif]-->
                                                            <table align="left" border="0" cellspacing="0" cellpadding="0" width="32" height="32" style="border-collapse: collapse;table-layout: fixed;border-spacing: 0;mso-table-lspace: 0pt;mso-table-rspace: 0pt;vertical-align: top;margin-right: 0px">
                                                                <tbody>
                                                                <tr style="vertical-align: top">
                                                                    <td align="left" valign="middle" style="word-break: break-word;border-collapse: collapse !important;vertical-align: top">
                                                                    <a href="mailto:support@jupitapp.co" title="Email" target="_blank">
                                                                        <img src="https://cdn.tools.unlayer.com/social/icons/circle-black/email.png" alt="Email" title="Email" width="32" style="outline: none;text-decoration: none;-ms-interpolation-mode: bicubic;clear: both;display: block !important;border: none;height: auto;float: none;max-width: 32px !important">
                                                                    </a>
                                                                    </td>
                                                                </tr>
                                                                </tbody>
                                                            </table>
                                                            <!--[if (mso)|(IE)]></td><![endif]-->
                            
                            
                                                            <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
                                                            </div>
                                                        </div>
                            
                                                        </td>
                                                    </tr>
                                                    </tbody>
                                                </table>
                            
                                                <!--[if (!mso)&(!IE)]><!-->
                                                </div>
                                                <!--<![endif]-->
                                            </div>
                                            </div>
                                            <!--[if (mso)|(IE)]></td><![endif]-->
                                            <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
                                        </div>
                                        </div>
                                    </div>
                            
                            
                            
                                    <div class="u-row-container" style="padding: 0px;background-color: transparent">
                                        <div class="u-row" style="Margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: #003399;">
                                        <div style="border-collapse: collapse;display: table;width: 100%;background-color: transparent;">
                                            <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px;background-color: transparent;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:600px;"><tr style="background-color: #003399;"><![endif]-->
                            
                                            <!--[if (mso)|(IE)]><td align="center" width="600" style="width: 600px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;" valign="top"><![endif]-->
                                            <div class="u-col u-col-100" style="max-width: 320px;min-width: 600px;display: table-cell;vertical-align: top;">
                                            <div style="width: 100% !important;">
                                                <!--[if (!mso)&(!IE)]><!-->
                                                <div style="padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;">
                                                <!--<![endif]-->
                            
                                                <table style="font-family:'Cabin',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                                                    <tbody>
                                                    <tr>
                                                        <td style="overflow-wrap:break-word;word-break:break-word;padding:10px;font-family:'Cabin',sans-serif;" align="left">
                            
                                                        <div style="color: #fafafa; line-height: 180%; text-align: center; word-wrap: break-word;">
                                                            <p style="font-size: 14px; line-height: 180%;"><span style="font-size: 16px; line-height: 28.8px;">Copyrights &copy; jupitapp</span></p>
                                                        </div>
                            
                                                        </td>
                                                    </tr>
                                                    </tbody>
                                                </table>
                            
                                                <!--[if (!mso)&(!IE)]><!-->
                                                </div>
                                                <!--<![endif]-->
                                            </div>
                                            </div>
                                            <!--[if (mso)|(IE)]></td><![endif]-->
                                            <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
                                        </div>
                                        </div>
                                    </div>
                            
                            
                                    <!--[if (mso)|(IE)]></td></tr></table><![endif]-->
                                    </td>
                                </tr>
                                </tbody>
                            </table>
                            <!--[if mso]></div><![endif]-->
                            <!--[if IE]></div><![endif]-->
                            </body>
                            
                            </html>



                        `
                  };
    
                transporter.sendMail(mailData, function (err, info) {
                    if(err){
                        // console.log(err);
                        res.send({"message":"An Error Occurred","callback":err})
                    }
                    
                    else{
                        
                        res.send({"message":"Code has been Sent","callback":info,"status":true})
                        
                    }
                      
                 });



            }
            else{
                res.status(400).send('Internal Server Error');
            }
        }
        else if(!docs){
            PinCreation.create({
                userid:userid,
                code:random
            })


            const mailData = {
                from: 'Jupit <hello@jupitapp.co>',  // sender address
                to: req.body.email,   // list of receivers
                subject: 'WALLET PIN CREATION',
                text: 'That was easy!',
                html: `
                        <!DOCTYPE HTML PUBLIC "-//W3C//DTD XHTML 1.0 Transitional //EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
                        <html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
                        
                        <head>
                        <!--[if gte mso 9]>
                        <xml>
                        <o:OfficeDocumentSettings>
                            <o:AllowPNG/>
                            <o:PixelsPerInch>96</o:PixelsPerInch>
                        </o:OfficeDocumentSettings>
                        </xml>
                        <![endif]-->
                        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <meta name="x-apple-disable-message-reformatting">
                        <!--[if !mso]><!-->
                        <meta http-equiv="X-UA-Compatible" content="IE=edge">
                        <!--<![endif]-->
                        <title></title>
                        
                        <style type="text/css">
                            @media only screen and (min-width: 620px) {
                            .u-row {
                                width: 600px !important;
                            }
                            .u-row .u-col {
                                vertical-align: top;
                            }
                            .u-row .u-col-100 {
                                width: 600px !important;
                            }
                            }
                            
                            @media (max-width: 620px) {
                            .u-row-container {
                                max-width: 100% !important;
                                padding-left: 0px !important;
                                padding-right: 0px !important;
                            }
                            .u-row .u-col {
                                min-width: 320px !important;
                                max-width: 100% !important;
                                display: block !important;
                            }
                            .u-row {
                                width: calc(100% - 40px) !important;
                            }
                            .u-col {
                                width: 100% !important;
                            }
                            .u-col>div {
                                margin: 0 auto;
                            }
                            }
                            
                            body {
                            margin: 0;
                            padding: 0;
                            }
                            
                            table,
                            tr,
                            td {
                            vertical-align: top;
                            border-collapse: collapse;
                            }
                            
                            p {
                            margin: 0;
                            }
                            
                            .ie-container table,
                            .mso-container table {
                            table-layout: fixed;
                            }
                            
                            * {
                            line-height: inherit;
                            }
                            
                            a[x-apple-data-detectors='true'] {
                            color: inherit !important;
                            text-decoration: none !important;
                            }
                            
                            table,
                            td {
                            color: #000000;
                            }
                            
                            a {
                            color: #0000ee;
                            text-decoration: underline;
                            }
                        </style>
                        
                        
                        
                        <!--[if !mso]><!-->
                        <link href="https://fonts.googleapis.com/css?family=Cabin:400,700" rel="stylesheet" type="text/css">
                        <!--<![endif]-->
                        
                        </head>
                        
                        <body class="clean-body u_body" style="margin: 0;padding: 0;-webkit-text-size-adjust: 100%;background-color: #f9f9f9;color: #000000">
                        <!--[if IE]><div class="ie-container"><![endif]-->
                        <!--[if mso]><div class="mso-container"><![endif]-->
                        <table style="border-collapse: collapse;table-layout: fixed;border-spacing: 0;mso-table-lspace: 0pt;mso-table-rspace: 0pt;vertical-align: top;min-width: 320px;Margin: 0 auto;background-color: #f9f9f9;width:100%" cellpadding="0" cellspacing="0">
                            <tbody>
                            <tr style="vertical-align: top">
                                <td style="word-break: break-word;border-collapse: collapse !important;vertical-align: top">
                                <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" style="background-color: #f9f9f9;"><![endif]-->
                        
                        
                                <div class="u-row-container" style="padding: 0px;background-color: transparent">
                                    <div class="u-row" style="Margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: transparent;">
                                    <div style="border-collapse: collapse;display: table;width: 100%;background-color: transparent;">
                                        <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px;background-color: transparent;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:600px;"><tr style="background-color: transparent;"><![endif]-->
                        
                                        <!--[if (mso)|(IE)]><td align="center" width="600" style="width: 600px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;" valign="top"><![endif]-->
                                        <div class="u-col u-col-100" style="max-width: 320px;min-width: 600px;display: table-cell;vertical-align: top;">
                                        <div style="width: 100% !important;">
                                            <!--[if (!mso)&(!IE)]><!-->
                                            <div style="padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;">
                                            <!--<![endif]-->
                        
                                            <table style="font-family:'Cabin',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                                                <tbody>
                                                <tr>
                                                    <td style="overflow-wrap:break-word;word-break:break-word;padding:10px;font-family:'Cabin',sans-serif;" align="left">
                        
                                                    <div style="color: #afb0c7; line-height: 170%; text-align: center; word-wrap: break-word;">
                                                        <p style="font-size: 14px; line-height: 170%;"><span style="font-size: 14px; line-height: 23.8px;"></span></p>
                                                    </div>
                        
                                                    </td>
                                                </tr>
                                                </tbody>
                                            </table>
                        
                                            <!--[if (!mso)&(!IE)]><!-->
                                            </div>
                                            <!--<![endif]-->
                                        </div>
                                        </div>
                                        <!--[if (mso)|(IE)]></td><![endif]-->
                                        <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
                                    </div>
                                    </div>
                                </div>
                        
                        
                        
                                <div class="u-row-container" style="padding: 0px;background-color: transparent">
                                    <div class="u-row" style="Margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: #ffffff;">
                                    <div style="border-collapse: collapse;display: table;width: 100%;background-color: transparent;">
                                        <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px;background-color: transparent;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:600px;"><tr style="background-color: #ffffff;"><![endif]-->
                        
                                        <!--[if (mso)|(IE)]><td align="center" width="600" style="width: 600px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;" valign="top"><![endif]-->
                                        <div class="u-col u-col-100" style="max-width: 320px;min-width: 600px;display: table-cell;vertical-align: top;">
                                        <div style="width: 100% !important;">
                                            <!--[if (!mso)&(!IE)]><!-->
                                            <div style="padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;">
                                            <!--<![endif]-->
                        
                                            <table style="font-family:'Cabin',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                                                <tbody>
                                                <tr>
                                                    <td style="overflow-wrap:break-word;word-break:break-word;padding:20px;font-family:'Cabin',sans-serif;" align="left">
                        
                                                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                                        <tr>
                                                        <td style="padding-right: 0px;padding-left: 0px;" align="center">
                        
                                                        <img align="center" border="0" src="https://res.cloudinary.com/jupit/image/upload/v1656160429/JUPIT-Logo-Wordmark_1_jo6ivd.png" alt="Image" title="Image" style="outline: none;text-decoration: none;-ms-interpolation-mode: bicubic;clear: both;display: inline-block !important;border: none;height: auto;float: none;width: 32%;max-width: 179.2px;"
                                                        width="179.2" />
                        
                                                        </td>
                                                        </tr>
                                                    </table>
                        
                                                    </td>
                                                </tr>
                                                </tbody>
                                            </table>
                        
                                            <!--[if (!mso)&(!IE)]><!-->
                                            </div>
                                            <!--<![endif]-->
                                        </div>
                                        </div>
                                        <!--[if (mso)|(IE)]></td><![endif]-->
                                        <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
                                    </div>
                                    </div>
                                </div>
                        
                        
                        
                                <div class="u-row-container" style="padding: 0px;background-color: transparent">
                                    <div class="u-row" style="Margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: #003399;">
                                    <div style="border-collapse: collapse;display: table;width: 100%;background-color: transparent;">
                                        <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px;background-color: transparent;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:600px;"><tr style="background-color: #003399;"><![endif]-->
                        
                                        <!--[if (mso)|(IE)]><td align="center" width="600" style="width: 600px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;" valign="top"><![endif]-->
                                        <div class="u-col u-col-100" style="max-width: 320px;min-width: 600px;display: table-cell;vertical-align: top;">
                                        <div style="width: 100% !important;">
                                            <!--[if (!mso)&(!IE)]><!-->
                                            <div style="padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;">
                                            <!--<![endif]-->
                        
                                            <table style="font-family:'Cabin',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                                                <tbody>
                                                <tr>
                                                    <td style="overflow-wrap:break-word;word-break:break-word;padding:40px 10px 10px;font-family:'Cabin',sans-serif;" align="left">
                        
                                                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                                        <tr>
                                                        <td style="padding-right: 0px;padding-left: 0px;" align="center">
                        
                                                            <img align="center" border="0" src="https://cdn.templates.unlayer.com/assets/1597218650916-xxxxc.png" alt="Image" title="Image" style="outline: none;text-decoration: none;-ms-interpolation-mode: bicubic;clear: both;display: inline-block !important;border: none;height: auto;float: none;width: 26%;max-width: 150.8px;"
                                                            width="150.8" />
                        
                                                        </td>
                                                        </tr>
                                                    </table>
                        
                                                    </td>
                                                </tr>
                                                </tbody>
                                            </table>
                        
                                            <table style="font-family:'Cabin',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                                                <tbody>
                                                <tr>
                                                    <td style="overflow-wrap:break-word;word-break:break-word;padding:10px;font-family:'Cabin',sans-serif;" align="left">
                        
                                                    <div style="color: #e5eaf5; line-height: 140%; text-align: center; word-wrap: break-word;">
                                                        <p style="font-size: 14px; line-height: 140%;"><strong>WALLET PIN CREATION</strong></p>
                                                    </div>
                        
                                                    </td>
                                                </tr>
                                                </tbody>
                                            </table>
                        
                                            <table style="font-family:'Cabin',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                                                <tbody>
                                                <tr>
                                                    <td style="overflow-wrap:break-word;word-break:break-word;padding:0px 10px 31px;font-family:'Cabin',sans-serif;" align="left">
                        
                                                    <div style="color: #e5eaf5; line-height: 140%; text-align: center; word-wrap: break-word;">
                                                        <p style="font-size: 14px; line-height: 140%;"><span style="font-size: 28px; line-height: 39.2px;"><strong><span style="line-height: 39.2px; font-size: 28px;">Wallet Pin Creation Code</span></strong>
                                                        </span>
                                                        </p>
                                                    </div>
                        
                                                    </td>
                                                </tr>
                                                </tbody>
                                            </table>
                        
                                            <!--[if (!mso)&(!IE)]><!-->
                                            </div>
                                            <!--<![endif]-->
                                        </div>
                                        </div>
                                        <!--[if (mso)|(IE)]></td><![endif]-->
                                        <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
                                    </div>
                                    </div>
                                </div>
                        
                        
                        
                                <div class="u-row-container" style="padding: 0px;background-color: transparent">
                                    <div class="u-row" style="Margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: #ffffff;">
                                    <div style="border-collapse: collapse;display: table;width: 100%;background-color: transparent;">
                                        <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px;background-color: transparent;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:600px;"><tr style="background-color: #ffffff;"><![endif]-->
                        
                                        <!--[if (mso)|(IE)]><td align="center" width="600" style="width: 600px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;" valign="top"><![endif]-->
                                        <div class="u-col u-col-100" style="max-width: 320px;min-width: 600px;display: table-cell;vertical-align: top;">
                                        <div style="width: 100% !important;">
                                            <!--[if (!mso)&(!IE)]><!-->
                                            <div style="padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;">
                                            <!--<![endif]-->
                        
                                            <table style="font-family:'Cabin',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                                                <tbody>
                                                <tr>
                                                    <td style="overflow-wrap:break-word;word-break:break-word;padding:33px 55px;font-family:'Cabin',sans-serif;" align="left">
                        
                                                    <div style="line-height: 160%; text-align: center; word-wrap: break-word;">
                                                        <p style="font-size: 14px; line-height: 160%;"><span style="font-size: 22px; line-height: 35.2px;">Dear User, </span></p>
                                                        <p style="font-size: 14px; line-height: 160%;"><span style="font-size: 18px; line-height: 28.8px;">Your wallet pin creation is almost finalized, kindly use the code below to confirm the process on your app.</span></p>
                                                        <p style="font-size: 14px; line-height: 160%;">&nbsp;</p>
                                                        <p style="font-size: 14px; line-height: 160%;"><span style="font-family: 'arial black', 'avant garde', arial; font-size: 14px; line-height: 22.4px;"><strong><span style="font-size: 24px; line-height: 38.4px;">${random} </span></strong>
                                                        </span>
                                                        </p>
                                                    </div>
                        
                                                    </td>
                                                </tr>
                                                </tbody>
                                            </table>
                        
                                            <table style="font-family:'Cabin',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                                                <tbody>
                                                <tr>
                                                    <td style="overflow-wrap:break-word;word-break:break-word;padding:33px 55px 60px;font-family:'Cabin',sans-serif;" align="left">
                        
                                                    <div style="line-height: 160%; text-align: center; word-wrap: break-word;">
                                                        <p style="line-height: 160%; font-size: 14px;"><span style="font-size: 18px; line-height: 28.8px;">Thanks,</span></p>
                                                        <p style="line-height: 160%; font-size: 14px;"><span style="font-size: 18px; line-height: 28.8px;">The Jupit Support Team</span></p>
                                                    </div>
                        
                                                    </td>
                                                </tr>
                                                </tbody>
                                            </table>
                        
                                            <!--[if (!mso)&(!IE)]><!-->
                                            </div>
                                            <!--<![endif]-->
                                        </div>
                                        </div>
                                        <!--[if (mso)|(IE)]></td><![endif]-->
                                        <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
                                    </div>
                                    </div>
                                </div>
                        
                        
                        
                                <div class="u-row-container" style="padding: 0px;background-color: transparent">
                                    <div class="u-row" style="Margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: #e5eaf5;">
                                    <div style="border-collapse: collapse;display: table;width: 100%;background-color: transparent;">
                                        <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px;background-color: transparent;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:600px;"><tr style="background-color: #e5eaf5;"><![endif]-->
                        
                                        <!--[if (mso)|(IE)]><td align="center" width="600" style="width: 600px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;" valign="top"><![endif]-->
                                        <div class="u-col u-col-100" style="max-width: 320px;min-width: 600px;display: table-cell;vertical-align: top;">
                                        <div style="width: 100% !important;">
                                            <!--[if (!mso)&(!IE)]><!-->
                                            <div style="padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;">
                                            <!--<![endif]-->
                        
                                            <table style="font-family:'Cabin',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                                                <tbody>
                                                <tr>
                                                    <td style="overflow-wrap:break-word;word-break:break-word;padding:41px 55px 18px;font-family:'Cabin',sans-serif;" align="left">
                        
                                                    <div style="color: #003399; line-height: 160%; text-align: center; word-wrap: break-word;">
                                                        <p style="font-size: 14px; line-height: 160%;"><span style="font-size: 20px; line-height: 32px;"><strong>Get in touch</strong></span></p>
                                                        <p style="font-size: 14px; line-height: 160%;">+2348088213177</p>
                                                        <p style="font-size: 14px; line-height: 160%;"><span style="font-size: 16px; line-height: 25.6px; color: #000000;"><a rel="noopener" href="mailto:support@jupitapp.co" target="_blank">support@jupitapp.co</a></span></p>
                                                        <p style="font-size: 14px; line-height: 160%;"><span style="font-size: 16px; line-height: 25.6px; color: #000000;">https://www.jupitapp.co</span></p>
                                                    </div>
                        
                                                    </td>
                                                </tr>
                                                </tbody>
                                            </table>
                        
                                            <table style="font-family:'Cabin',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                                                <tbody>
                                                <tr>
                                                    <td style="overflow-wrap:break-word;word-break:break-word;padding:10px 10px 33px;font-family:'Cabin',sans-serif;" align="left">
                        
                                                    <div align="center">
                                                        <div style="display: table; max-width:244px;">
                                                        <!--[if (mso)|(IE)]><table width="244" cellpadding="0" cellspacing="0" border="0"><tr><td style="border-collapse:collapse;" align="center"><table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse; mso-table-lspace: 0pt;mso-table-rspace: 0pt; width:244px;"><tr><![endif]-->
                        
                        
                                                        <!--[if (mso)|(IE)]><td width="32" style="width:32px; padding-right: 17px;" valign="top"><![endif]-->
                                                        <table align="left" border="0" cellspacing="0" cellpadding="0" width="32" height="32" style="border-collapse: collapse;table-layout: fixed;border-spacing: 0;mso-table-lspace: 0pt;mso-table-rspace: 0pt;vertical-align: top;margin-right: 17px">
                                                            <tbody>
                                                            <tr style="vertical-align: top">
                                                                <td align="left" valign="middle" style="word-break: break-word;border-collapse: collapse !important;vertical-align: top">
                                                                <a href="https://facebook.com/" title="Facebook" target="_blank">
                                                                    <img src="https://cdn.tools.unlayer.com/social/icons/circle-black/facebook.png" alt="Facebook" title="Facebook" width="32" style="outline: none;text-decoration: none;-ms-interpolation-mode: bicubic;clear: both;display: block !important;border: none;height: auto;float: none;max-width: 32px !important">
                                                                </a>
                                                                </td>
                                                            </tr>
                                                            </tbody>
                                                        </table>
                                                        <!--[if (mso)|(IE)]></td><![endif]-->
                        
                                                        <!--[if (mso)|(IE)]><td width="32" style="width:32px; padding-right: 17px;" valign="top"><![endif]-->
                                                        <table align="left" border="0" cellspacing="0" cellpadding="0" width="32" height="32" style="border-collapse: collapse;table-layout: fixed;border-spacing: 0;mso-table-lspace: 0pt;mso-table-rspace: 0pt;vertical-align: top;margin-right: 17px">
                                                            <tbody>
                                                            <tr style="vertical-align: top">
                                                                <td align="left" valign="middle" style="word-break: break-word;border-collapse: collapse !important;vertical-align: top">
                                                                <a href="https://linkedin.com/" title="LinkedIn" target="_blank">
                                                                    <img src="https://cdn.tools.unlayer.com/social/icons/circle-black/linkedin.png" alt="LinkedIn" title="LinkedIn" width="32" style="outline: none;text-decoration: none;-ms-interpolation-mode: bicubic;clear: both;display: block !important;border: none;height: auto;float: none;max-width: 32px !important">
                                                                </a>
                                                                </td>
                                                            </tr>
                                                            </tbody>
                                                        </table>
                                                        <!--[if (mso)|(IE)]></td><![endif]-->
                        
                                                        <!--[if (mso)|(IE)]><td width="32" style="width:32px; padding-right: 17px;" valign="top"><![endif]-->
                                                        <table align="left" border="0" cellspacing="0" cellpadding="0" width="32" height="32" style="border-collapse: collapse;table-layout: fixed;border-spacing: 0;mso-table-lspace: 0pt;mso-table-rspace: 0pt;vertical-align: top;margin-right: 17px">
                                                            <tbody>
                                                            <tr style="vertical-align: top">
                                                                <td align="left" valign="middle" style="word-break: break-word;border-collapse: collapse !important;vertical-align: top">
                                                                <a href="https://instagram.com/jupit.app" title="Instagram" target="_blank">
                                                                    <img src="https://cdn.tools.unlayer.com/social/icons/circle-black/instagram.png" alt="Instagram" title="Instagram" width="32" style="outline: none;text-decoration: none;-ms-interpolation-mode: bicubic;clear: both;display: block !important;border: none;height: auto;float: none;max-width: 32px !important">
                                                                </a>
                                                                </td>
                                                            </tr>
                                                            </tbody>
                                                        </table>
                                                        <!--[if (mso)|(IE)]></td><![endif]-->
                        
                                                        <!--[if (mso)|(IE)]><td width="32" style="width:32px; padding-right: 17px;" valign="top"><![endif]-->
                                                        
                                                        <!--[if (mso)|(IE)]></td><![endif]-->
                        
                                                        <!--[if (mso)|(IE)]><td width="32" style="width:32px; padding-right: 0px;" valign="top"><![endif]-->
                                                        <table align="left" border="0" cellspacing="0" cellpadding="0" width="32" height="32" style="border-collapse: collapse;table-layout: fixed;border-spacing: 0;mso-table-lspace: 0pt;mso-table-rspace: 0pt;vertical-align: top;margin-right: 0px">
                                                            <tbody>
                                                            <tr style="vertical-align: top">
                                                                <td align="left" valign="middle" style="word-break: break-word;border-collapse: collapse !important;vertical-align: top">
                                                                <a href="mailto:support@jupitapp.co" title="Email" target="_blank">
                                                                    <img src="https://cdn.tools.unlayer.com/social/icons/circle-black/email.png" alt="Email" title="Email" width="32" style="outline: none;text-decoration: none;-ms-interpolation-mode: bicubic;clear: both;display: block !important;border: none;height: auto;float: none;max-width: 32px !important">
                                                                </a>
                                                                </td>
                                                            </tr>
                                                            </tbody>
                                                        </table>
                                                        <!--[if (mso)|(IE)]></td><![endif]-->
                        
                        
                                                        <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
                                                        </div>
                                                    </div>
                        
                                                    </td>
                                                </tr>
                                                </tbody>
                                            </table>
                        
                                            <!--[if (!mso)&(!IE)]><!-->
                                            </div>
                                            <!--<![endif]-->
                                        </div>
                                        </div>
                                        <!--[if (mso)|(IE)]></td><![endif]-->
                                        <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
                                    </div>
                                    </div>
                                </div>
                        
                        
                        
                                <div class="u-row-container" style="padding: 0px;background-color: transparent">
                                    <div class="u-row" style="Margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: #003399;">
                                    <div style="border-collapse: collapse;display: table;width: 100%;background-color: transparent;">
                                        <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px;background-color: transparent;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:600px;"><tr style="background-color: #003399;"><![endif]-->
                        
                                        <!--[if (mso)|(IE)]><td align="center" width="600" style="width: 600px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;" valign="top"><![endif]-->
                                        <div class="u-col u-col-100" style="max-width: 320px;min-width: 600px;display: table-cell;vertical-align: top;">
                                        <div style="width: 100% !important;">
                                            <!--[if (!mso)&(!IE)]><!-->
                                            <div style="padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;">
                                            <!--<![endif]-->
                        
                                            <table style="font-family:'Cabin',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                                                <tbody>
                                                <tr>
                                                    <td style="overflow-wrap:break-word;word-break:break-word;padding:10px;font-family:'Cabin',sans-serif;" align="left">
                        
                                                    <div style="color: #fafafa; line-height: 180%; text-align: center; word-wrap: break-word;">
                                                        <p style="font-size: 14px; line-height: 180%;"><span style="font-size: 16px; line-height: 28.8px;">Copyrights &copy; jupitapp</span></p>
                                                    </div>
                        
                                                    </td>
                                                </tr>
                                                </tbody>
                                            </table>
                        
                                            <!--[if (!mso)&(!IE)]><!-->
                                            </div>
                                            <!--<![endif]-->
                                        </div>
                                        </div>
                                        <!--[if (mso)|(IE)]></td><![endif]-->
                                        <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
                                    </div>
                                    </div>
                                </div>
                        
                        
                                <!--[if (mso)|(IE)]></td></tr></table><![endif]-->
                                </td>
                            </tr>
                            </tbody>
                        </table>
                        <!--[if mso]></div><![endif]-->
                        <!--[if IE]></div><![endif]-->
                        </body>
                        
                        </html>

                      
                     `
              };

            transporter.sendMail(mailData, function (err, info) {
                if(err){
                    // console.log(err);
                    res.send({"message":"An Error Occurred","callback":err})
                }
                
                else{
                    
                    res.send({"message":"Code has been Sent","callback":info,"status":true})
                    
                }
                  
             });
        }
    })

})

router.post('/2FA',middlewareVerify,(req,res)=>{

    TwoFactor.findOne({userid:req.body.userid},function(err,docs){
        if(err){
            res.status(400).send(err)
        }
        else if(docs){
            res.send('Proceed...UserAlreadyPreActivated')
        }
        else if(!docs){
            const secret = SpeakEasy.generateSecret({
                name:'User',
                issuer:'Jupit App'
            })
            
           let TOTP = TwoFactor.create({
                userid:req.body.userid,
                ascii:secret.ascii,
                hex:secret.hex,
                base32:secret.base32,
                otpauth_url:secret.otpauth_url = SpeakEasy.otpauthURL({
                    secret:secret.ascii,
                    label: encodeURIComponent(req.body.email),
                    issuer:'Jupit  App'
                })
                
            })
            if(TOTP){
                res.send('Activated')
            }
            else{
                res.status(400).send('An Error Occurred')
            }
        }
    })
   
})

router.post('/activate/2FA',middlewareVerify,(req,res)=>{
    const {userid,token} = req.body
    const secret = TwoFactor.findOne({userid:userid},async function(err,docs){
        if(err){
            res.send(err)
        }
        else if(docs){
            let secret = docs.base32;

            const verified = SpeakEasy.totp.verify({secret,encoding:'base32',token:token})
            // const verified = SpeakEasy.totp.verify({secret,encoding:'base32',token:token,window:1})
            if(verified){
                const new2fa = await TwoFactor.findOneAndUpdate({userid:userid},{activated:true},{
                    new: true,
                    upsert: true // Make this update into an upsert
                  })

                 const data = await Usermodel.findOneAndUpdate({_id:userid},{TWOFA:true},{
                    new: true,
                    upsert: true // Make this update into an upsert
                  })
                  
                
                res.send({message:"2FA Successfully Activated",data:data,new2fa:new2fa})
            }
            else{
                res.status(400).send("2FA Successfully Failed..Try Another Token")
            }
            
        }
        else if(!docs){
            res.status(400).send("User cannot be Authenticated..")
        }
    })
})


router.post('/login/2FA',(req,res)=>{
    const {email,token,password} = req.body

        Usermodel.findOne({email:email},async (err,docs)=>{
            if(err){
                res.status(400).send(err)
            }
            else if(docs){
                const validPassword = bcrypt.compareSync(password, docs.password);
                if(validPassword){
                    await TwoFactor.findOne({userid:docs._id},async function(err,fa_docs){
                        if(err){
                            res.status(400).send(err)
                            // console.log(err)
                        }
                        else if(fa_docs){
                            let secret = fa_docs.base32;
                            const verified = SpeakEasy.totp.verify({secret,encoding:'base32',token:token,window:1})
                            
                            if(verified){
                                var dt = NodeDateTime.create();
                                var formatted = dt.format('Y-m-d H:M:S');
                                
                                Usermodel.findOneAndUpdate({_id:docs._id},{$set:{loginTime:formatted}})
                        await signsuccessmail(docs.email,docs.username,formatted);
                                jwt.sign({user:docs},'secretkey',{expiresIn:'1h'},(err,token)=>{
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
                                res.status(403).send('Invalid Token...2FA Failed')
                                // console.log('Invalid Token...2FA Failed')
                            }
                            
                        }
                    }).clone().catch(function(err){ console.log(err)});
                    
                }
            }
        })
            
            
            
       
    
})

router.get('/kyc',(req,res)=>{
    // console.log(path.basename(path.resolve(`${'./aws.json'}`)));
    // console.log(process.cwd())
    res.send('Welcome to jupit server');
});

router.post('/users/kyc',(req,res)=>{
   
    Kyc.findOne({userid:req.body.userid},function(err,docs){
        if(err){
            res.status(400).send(err);
        }
        else if(docs){
            res.send(docs)
        }
    })
})





router.post('/users/getIdcardverification',middlewareVerify,(req,res)=>{
   
    IdCardVerification.find({$and:[{userid:req.body.userid},{status:'Verified'}]},(err,docs)=>{
        if(err){
            console.log(err)
            res.status(400).send(err);
        }
        else if(docs){
            res.send(docs)
        }
        else if(!docs){
            res.send('Unverified')
        }
    })
})




router.post('/users/bank',middlewareVerify,(req,res)=>{
   
    Bankmodel.findOne({email:req.body.email},(err,docs)=>{
        if(err){
            console.log(err)
            res.status(400).send(err);
        }
        else if(docs){
            res.send(docs)
        }
    })
})

router.post('/get2FA',middlewareVerify,(req,res)=>{
    TwoFactor.findOne({userid:req.body.userid},function(err,docs){
        if(err){
            res.status(403).send(err);
        }
        else{
            res.send(docs)
        }
    })
})

router.post('/users/2fa',middlewareVerify,(req,res)=>{
   
    TwoFactor.findOne({userid:req.body.userid},function(err,docs){
        if(err){
            res.status(403).send(err);
        }
        else if(docs){
            res.send(docs)
        }
    })
})

router.post('/users/idcardverification',(req,res)=>{
    
    // console.log("app",req.body.items.CapturedImage);
  
   
    // AWS.config.loadFromPath(`${process.env.PWD}/route/aws.json`);

    // var s3Bucket = new AWS.S3( { params: {Bucket: 'idcardverification'} } );
    // const buf = Buffer.from(req.body.items.CapturedImage.replace(/^data:image\/\w+;base64,/, ""),'base64')

    // var data = {
    //     Key: req.body.items.userid, 
    //     Body: buf,
    //     ContentEncoding: 'base64',
    //     ContentType: 'image/jpeg'
    //   };
    var uploadStr = req.body.items.CapturedImage;
    IdCardVerification.findOne({userid:req.body.items.userid},function(err,docs){
        if(err){
            res.status(400).send(err)
        }
        else if(docs){
            if(docs.status === "Pending"){
                res.status(400).send("Your IDCard Verification Is Already In Progress")
            }
            else if(docs.status === "rejected"){

                cloudinary.v2.uploader.upload(uploadStr, {
                    overwrite: true,
                    invalidate: true
                },
                    function (error, result) {
                        if(error){
                            // res.json(error)
                            // console.log(error)
                            res.status(400).send('Upload Document Error...Pls try again')
                        }
                        if(result){
                            IdCardVerification.create({
                                cardnumber:req.body.items.cardNumber,
                                cardtype:req.body.items.cardType,
                                imagepath:result.secure_url,
                                userid:req.body.items.userid,
                                firstname:req.body.items.firstname,
                                lastname:req.body.items.lastname,
                                dob:req.body.items.dob,
                                status:'Pending',
                                base64:uploadStr,
                                email:req.body.items.email
                            })
                            res.send("Verification Successfully Submitted")
                        }
                        
                        
                    });
 
            }
            else if(docs.status === "Verified"){
                res.status(400).send("Previous Submission Has Already been Resolved")
            }
        }
        else if(!docs){


            cloudinary.v2.uploader.upload(uploadStr, {
                overwrite: true,
                invalidate: true
            },
                function (error, result) {
                    if(error){
                        // res.json(error)
                        // console.log('error',error)
                        res.status(400).send('Upload Document Error...Pls try again')
                    }
                    if(result){
                        IdCardVerification.create({
                            cardnumber:req.body.items.cardNumber,
                            cardtype:req.body.items.cardType,
                            imagepath:result.secure_url,
                            userid:req.body.items.userid,
                            firstname:req.body.items.firstname,
                            lastname:req.body.items.lastname,
                            dob:req.body.items.dob,
                            status:'Pending'
                        })
                        res.send("Verification Successfully Submitted")
                    }
                    
                   
                });

           

        }
    })




    
    
})


router.get('/users/test',middlewareVerify,(req,res)=>{
    res.json({
        "Message":"Header Is Present",
        "token":req.token

    })
})
router.get('/users',async(req,res,next)=>{
    
    const bearerHeader = req.headers['authorization'];
    

    if(typeof bearerHeader === "undefined" || bearerHeader === ""){
        res.sendStatus(403)
    }
    else{
        Usermodel.find({},(err,users)=>{
            if(err){
                res.json({
                    'message':err,
                    'status':false
                })
            }
            else if(users){
                res.send({
                    'message':users,
                    'status':true,
                    authData
                })
            }
            else{
                res.send({
                    'message':'NO User Found',
                    'status':true,
                    authData
                })
            }
        })
        
        
    //   jwt.verify(bearerHeader,'secretkey',(err,authData)=>{
    //         if(err){
    //             console.log(err)
    //             res.sendStatus(403);
    //         }
    //         else{

                
                
    //         }
    //     })

    }
    
    // if(typeof bearerHeader !== "undefined"){
    //     const bearerToken = bearerHeader.split(' ')[1];
    //     req.token = bearerToken;
    //     console.log('token',req.token)
    // }
    // else{
    //     res.sendStatus(403);
    // }
    

});

router.post('/users/refresh',middlewareVerify,(req,res)=>{
   
    
    Usermodel.findOne({_id:req.body._id},async function(err,docs){
        if(err){
            res.status(403).send(err)
        }
        if(docs){
           await bank.findOne({email:docs.email},(err,docs_bank)=>{
                if(err){
                    res.status(400).send('Internal Server Error')
                }
                else if(docs_bank){
                    res.send({
                        'user':docs,
                        'bankCheck':true
                    })
                }
                else{
                    res.send({
                        'user':docs,
                        'bankCheck':false
                    })
                }
           }).clone().catch(function(err){ console.log(err)});
            
        }
        else if(!docs){
            res.status(403).send('User Not Found')
        }
    })
})

router.post('/users/test',middlewareVerify,(req,res)=>{
    // console.log(req.body)
})


router.post('/users/login',(req,res)=>{
//   console.log(req.body)
    Usermodel.findOne({email:req.body.email},async (err,docs)=>{
        if(err){
            res.send({
                'message':err,
                'status':false
            })
        }
        else if(docs){

            if(docs.Status !== "Active"){
                res.status(400).send("Account Blocked...Contact Administrator");
                return false;
            }
            
            if(!docs.email_verification){
                res.status(400).send('Email Verification is pending on this account');
                return false;
            }
            
            const validPassword = bcrypt.compareSync(req.body.password, docs.password);
            // console.log(validPassword)
            if (validPassword) {
                if(docs.TWOFA){
                    res.send('Token is Required')
                }
                else{
                    
                    var dt = NodeDateTime.create();
                    var formatted = dt.format('Y-m-d H:M:S');
                    console.log(formatted)
                    Usermodel.findOneAndUpdate({_id:docs._id},{$set:{loginTime:formatted}})
                        await signsuccessmail(docs.email,docs.username,formatted);
                    jwt.sign({user:docs},'secretkey',{expiresIn:'1h'},(err,token)=>{
                        res.json({
                            token,
                            docs,
                            'status':true
                        })
                    })
                }
               
            
            } else {
                // res.sendStatus(404).send({'message':'Invalid Password',
                // 'status':false})
                // res.send({
                //     'message':'Invalid Password',
                //     'status':false
                // })
                // res.statusMessage = "Invalid Password";
                // res.send(400).end();

                res.status(400).send('Invalid Password');
            }
             
        }
        else{
            // res.sendStatus(404).send({'message':'Invalid Username',
            //     'status':false})
            res.status(400).send('Invalid Email Address');
           
        }
    })
    // res.send('Login Successful')
});



async function signsuccessmail(email,username,time){
    
    const mailData = {
        from: 'Jupit <hello@jupitapp.co>',  // sender address
        to: email,   // list of receivers
        subject: 'Login Successful',
        text: 'That was easy!',
        html: `
                  
                    <!DOCTYPE HTML PUBLIC "-//W3C//DTD XHTML 1.0 Transitional //EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
                    <html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
                    
                    <head>
                    <!--[if gte mso 9]>
                    <xml>
                    <o:OfficeDocumentSettings>
                        <o:AllowPNG/>
                        <o:PixelsPerInch>96</o:PixelsPerInch>
                    </o:OfficeDocumentSettings>
                    </xml>
                    <![endif]-->
                    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <meta name="x-apple-disable-message-reformatting">
                    <!--[if !mso]><!-->
                    <meta http-equiv="X-UA-Compatible" content="IE=edge">
                    <!--<![endif]-->
                    <title></title>
                    
                    <style type="text/css">
                        @media only screen and (min-width: 620px) {
                        .u-row {
                            width: 600px !important;
                        }
                        .u-row .u-col {
                            vertical-align: top;
                        }
                        .u-row .u-col-100 {
                            width: 600px !important;
                        }
                        }
                        
                        @media (max-width: 620px) {
                        .u-row-container {
                            max-width: 100% !important;
                            padding-left: 0px !important;
                            padding-right: 0px !important;
                        }
                        .u-row .u-col {
                            min-width: 320px !important;
                            max-width: 100% !important;
                            display: block !important;
                        }
                        .u-row {
                            width: calc(100% - 40px) !important;
                        }
                        .u-col {
                            width: 100% !important;
                        }
                        .u-col>div {
                            margin: 0 auto;
                        }
                        }
                        
                        body {
                        margin: 0;
                        padding: 0;
                        }
                        
                        table,
                        tr,
                        td {
                        vertical-align: top;
                        border-collapse: collapse;
                        }
                        
                        p {
                        margin: 0;
                        }
                        
                        .ie-container table,
                        .mso-container table {
                        table-layout: fixed;
                        }
                        
                        * {
                        line-height: inherit;
                        }
                        
                        a[x-apple-data-detectors='true'] {
                        color: inherit !important;
                        text-decoration: none !important;
                        }
                        
                        table,
                        td {
                        color: #000000;
                        }
                        
                        a {
                        color: #0000ee;
                        text-decoration: underline;
                        }
                    </style>
                    
                    
                    
                    <!--[if !mso]><!-->
                    <link href="https://fonts.googleapis.com/css?family=Cabin:400,700" rel="stylesheet" type="text/css">
                    <!--<![endif]-->
                    
                    </head>
                    
                    <body class="clean-body u_body" style="margin: 0;padding: 0;-webkit-text-size-adjust: 100%;background-color: #f9f9f9;color: #000000">
                    <!--[if IE]><div class="ie-container"><![endif]-->
                    <!--[if mso]><div class="mso-container"><![endif]-->
                    <table style="border-collapse: collapse;table-layout: fixed;border-spacing: 0;mso-table-lspace: 0pt;mso-table-rspace: 0pt;vertical-align: top;min-width: 320px;Margin: 0 auto;background-color: #f9f9f9;width:100%" cellpadding="0" cellspacing="0">
                        <tbody>
                        <tr style="vertical-align: top">
                            <td style="word-break: break-word;border-collapse: collapse !important;vertical-align: top">
                            <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" style="background-color: #f9f9f9;"><![endif]-->
                    
                    
                            <div class="u-row-container" style="padding: 0px;background-color: transparent">
                                <div class="u-row" style="Margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: transparent;">
                                <div style="border-collapse: collapse;display: table;width: 100%;background-color: transparent;">
                                    <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px;background-color: transparent;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:600px;"><tr style="background-color: transparent;"><![endif]-->
                    
                                    <!--[if (mso)|(IE)]><td align="center" width="600" style="width: 600px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;" valign="top"><![endif]-->
                                    <div class="u-col u-col-100" style="max-width: 320px;min-width: 600px;display: table-cell;vertical-align: top;">
                                    <div style="width: 100% !important;">
                                        <!--[if (!mso)&(!IE)]><!-->
                                        <div style="padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;">
                                        <!--<![endif]-->
                    
                                        <table style="font-family:'Cabin',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                                            <tbody>
                                            <tr>
                                                <td style="overflow-wrap:break-word;word-break:break-word;padding:10px;font-family:'Cabin',sans-serif;" align="left">
                    
                                                <div style="color: #afb0c7; line-height: 170%; text-align: center; word-wrap: break-word;">
                    
                                                </div>
                    
                                                </td>
                                            </tr>
                                            </tbody>
                                        </table>
                    
                                        <!--[if (!mso)&(!IE)]><!-->
                                        </div>
                                        <!--<![endif]-->
                                    </div>
                                    </div>
                                    <!--[if (mso)|(IE)]></td><![endif]-->
                                    <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
                                </div>
                                </div>
                            </div>
                    
                    
                    
                            <div class="u-row-container" style="padding: 0px;background-color: transparent">
                                <div class="u-row" style="Margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: #ffffff;">
                                <div style="border-collapse: collapse;display: table;width: 100%;background-color: transparent;">
                                    <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px;background-color: transparent;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:600px;"><tr style="background-color: #ffffff;"><![endif]-->
                    
                                    <!--[if (mso)|(IE)]><td align="center" width="600" style="width: 600px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;" valign="top"><![endif]-->
                                    <div class="u-col u-col-100" style="max-width: 320px;min-width: 600px;display: table-cell;vertical-align: top;">
                                    <div style="width: 100% !important;">
                                        <!--[if (!mso)&(!IE)]><!-->
                                        <div style="padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;">
                                        <!--<![endif]-->
                    
                                        <table style="font-family:'Cabin',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                                            <tbody>
                                            <tr>
                                                <td style="overflow-wrap:break-word;word-break:break-word;padding:20px;font-family:'Cabin',sans-serif;" align="left">
                    
                                                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                                    <tr>
                                                    <td style="padding-right: 0px;padding-left: 0px;" align="center">
                    
                                                        <img align="center" border="0" src="https://res.cloudinary.com/jupit/image/upload/v1656160429/JUPIT-Logo-Wordmark_1_jo6ivd.png" alt="Image" title="Image" style="outline: none;text-decoration: none;-ms-interpolation-mode: bicubic;clear: both;display: inline-block !important;border: none;height: auto;float: none;width: 32%;max-width: 179.2px;"
                                                        width="179.2" />
                                                       

                    
                                                    </td>
                                                    </tr>
                                                </table>
                    
                                                </td>
                                            </tr>
                                            </tbody>
                                        </table>
                    
                                        <!--[if (!mso)&(!IE)]><!-->
                                        </div>
                                        <!--<![endif]-->
                                    </div>
                                    </div>
                                    <!--[if (mso)|(IE)]></td><![endif]-->
                                    <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
                                </div>
                                </div>
                            </div>
                    
                    
                    
                            <div class="u-row-container" style="padding: 0px;background-color: transparent">
                                <div class="u-row" style="Margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: #003399;">
                                <div style="border-collapse: collapse;display: table;width: 100%;background-color: transparent;">
                                    <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px;background-color: transparent;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:600px;"><tr style="background-color: #003399;"><![endif]-->
                    
                                    <!--[if (mso)|(IE)]><td align="center" width="600" style="width: 600px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;" valign="top"><![endif]-->
                                    <div class="u-col u-col-100" style="max-width: 320px;min-width: 600px;display: table-cell;vertical-align: top;">
                                    <div style="width: 100% !important;">
                                        <!--[if (!mso)&(!IE)]><!-->
                                        <div style="padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;">
                                        <!--<![endif]-->
                    
                                        <table style="font-family:'Cabin',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                                            <tbody>
                                            <tr>
                                                <td style="overflow-wrap:break-word;word-break:break-word;padding:40px 10px 10px;font-family:'Cabin',sans-serif;" align="left">
                    
                                                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                                    <tr>
                                                    <td style="padding-right: 0px;padding-left: 0px;" align="center">
                    
                                                        <img align="center" border="0" src="https://cdn.templates.unlayer.com/assets/1597218650916-xxxxc.png" alt="Image" title="Image" style="outline: none;text-decoration: none;-ms-interpolation-mode: bicubic;clear: both;display: inline-block !important;border: none;height: auto;float: none;width: 26%;max-width: 150.8px;"
                                                        width="150.8" />
                    
                                                    </td>
                                                    </tr>
                                                </table>
                    
                                                </td>
                                            </tr>
                                            </tbody>
                                        </table>
                    
                                        <table style="font-family:'Cabin',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                                            <tbody>
                                            <tr>
                                                <td style="overflow-wrap:break-word;word-break:break-word;padding:10px;font-family:'Cabin',sans-serif;" align="left">
                    
                                                <div style="color: #e5eaf5; line-height: 140%; text-align: center; word-wrap: break-word;">
                                                    <p style="font-size: 14px; line-height: 140%;"><strong>LOGIN SUCCESS NOTIFICATION !</strong></p>
                                                </div>
                    
                                                </td>
                                            </tr>
                                            </tbody>
                                        </table>
                    
                                        <table style="font-family:'Cabin',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                                            <tbody>
                                            <tr>
                                                <td style="overflow-wrap:break-word;word-break:break-word;padding:0px 10px 31px;font-family:'Cabin',sans-serif;" align="left">
                    
                                                <div style="color: #e5eaf5; line-height: 140%; text-align: center; word-wrap: break-word;">
                                                    <p style="font-size: 14px; line-height: 140%;"><span style="font-size: 28px; line-height: 39.2px;"><strong><span style="line-height: 39.2px; font-size: 28px;">Login Success Notification</span></strong>
                                                    </span>
                                                    </p>
                                                </div>
                    
                                                </td>
                                            </tr>
                                            </tbody>
                                        </table>
                    
                                        <!--[if (!mso)&(!IE)]><!-->
                                        </div>
                                        <!--<![endif]-->
                                    </div>
                                    </div>
                                    <!--[if (mso)|(IE)]></td><![endif]-->
                                    <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
                                </div>
                                </div>
                            </div>
                    
                    
                    
                            <div class="u-row-container" style="padding: 0px;background-color: transparent">
                                <div class="u-row" style="Margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: #ffffff;">
                                <div style="border-collapse: collapse;display: table;width: 100%;background-color: transparent;">
                                    <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px;background-color: transparent;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:600px;"><tr style="background-color: #ffffff;"><![endif]-->
                    
                                    <!--[if (mso)|(IE)]><td align="center" width="600" style="width: 600px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;" valign="top"><![endif]-->
                                    <div class="u-col u-col-100" style="max-width: 320px;min-width: 600px;display: table-cell;vertical-align: top;">
                                    <div style="width: 100% !important;">
                                        <!--[if (!mso)&(!IE)]><!-->
                                        <div style="padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;">
                                        <!--<![endif]-->
                    
                                        <table style="font-family:'Cabin',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                                            <tbody>
                                            <tr>
                                                <td style="overflow-wrap:break-word;word-break:break-word;padding:33px 55px;font-family:'Cabin',sans-serif;" align="left">
                    
                                                <div style="line-height: 160%; text-align: center; word-wrap: break-word;">
                                                    <p style="font-size: 14px; line-height: 160%;"><span style="font-size: 22px; line-height: 35.2px;">Hi ${username},</span></p>
                                                    <p style="font-size: 14px; line-height: 160%;"><span style="font-size: 18px; line-height: 28.8px;">You have successfully logged In to your jupit account @ ${time}.</span></p>
                                                    <p style="font-size: 14px; line-height: 160%;"><span style="font-size: 18px; line-height: 28.8px;">Feel free to relate any thing you have as a challenge with us. </span></p>
                                                </div>
                    
                                                </td>
                                            </tr>
                                            </tbody>
                                        </table>
                    
                                        <table style="font-family:'Cabin',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                                            <tbody>
                                            <tr>
                                                <td style="overflow-wrap:break-word;word-break:break-word;padding:33px 55px;font-family:'Cabin',sans-serif;" align="left">
                    
                                                <div style="line-height: 160%; text-align: center; word-wrap: break-word;">
                                                    <p style="line-height: 160%; font-size: 14px;"><span style="line-height: 22.4px; font-size: 14px;"><em><span style="color: #e03e2d;">If you did not authorize this logging process, kindly click on the button below to engage our support team.</span></em>
                                                    </span>
                                                    </p>
                                                </div>
                    
                                                </td>
                                            </tr>
                                            </tbody>
                                        </table>
                    
                                        <table style="font-family:'Cabin',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                                            <tbody>
                                            <tr>
                                                <td style="overflow-wrap:break-word;word-break:break-word;padding:10px;font-family:'Cabin',sans-serif;" align="left">
                    
                                                <div align="center">
                                                    <!--[if mso]><table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-spacing: 0; border-collapse: collapse; mso-table-lspace:0pt; mso-table-rspace:0pt;font-family:'Cabin',sans-serif;"><tr><td style="font-family:'Cabin',sans-serif;" align="center"><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="https://myjupit.herokuapp.com/users/jupit/emailverification/e9p5ikica6f19gdsmqta/qvrse/" style="height:46px; v-text-anchor:middle; width:193px;" arcsize="8.5%" stroke="f" fillcolor="#ff6600"><w:anchorlock/><center style="color:#FFFFFF;font-family:'Cabin',sans-serif;"><![endif]-->
                                                    <a href="mailto:support@jupitapp.co" target="_blank" style="box-sizing: border-box;display: inline-block;font-family:'Cabin',sans-serif;text-decoration: none;-webkit-text-size-adjust: none;text-align: center;color: #FFFFFF; background-color: #ff6600; border-radius: 4px;-webkit-border-radius: 4px; -moz-border-radius: 4px; width:auto; max-width:100%; overflow-wrap: break-word; word-break: break-word; word-wrap:break-word; mso-border-alt: none;">
                                                    <span style="display:block;padding:14px 44px 13px;line-height:120%;"><span style="font-size: 16px; line-height: 19.2px;">MAIL US NOW.</span></span>
                                                    </a>
                                                    <!--[if mso]></center></v:roundrect></td></tr></table><![endif]-->
                                                </div>
                    
                                                </td>
                                            </tr>
                                            </tbody>
                                        </table>
                    
                                        <table style="font-family:'Cabin',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                                            <tbody>
                                            <tr>
                                                <td style="overflow-wrap:break-word;word-break:break-word;padding:33px 55px 60px;font-family:'Cabin',sans-serif;" align="left">
                    
                                                <div style="line-height: 160%; text-align: center; word-wrap: break-word;">
                                                    <p style="line-height: 160%; font-size: 14px;"><span style="font-size: 18px; line-height: 28.8px;">Thanks,</span></p>
                                                    <p style="line-height: 160%; font-size: 14px;"><span style="font-size: 18px; line-height: 28.8px;">The Support Team</span></p>
                                                </div>
                    
                                                </td>
                                            </tr>
                                            </tbody>
                                        </table>
                    
                                        <!--[if (!mso)&(!IE)]><!-->
                                        </div>
                                        <!--<![endif]-->
                                    </div>
                                    </div>
                                    <!--[if (mso)|(IE)]></td><![endif]-->
                                    <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
                                </div>
                                </div>
                            </div>
                    
                    
                    
                            <div class="u-row-container" style="padding: 0px;background-color: transparent">
                                <div class="u-row" style="Margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: #e5eaf5;">
                                <div style="border-collapse: collapse;display: table;width: 100%;background-color: transparent;">
                                    <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px;background-color: transparent;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:600px;"><tr style="background-color: #e5eaf5;"><![endif]-->
                    
                                    <!--[if (mso)|(IE)]><td align="center" width="600" style="width: 600px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;" valign="top"><![endif]-->
                                    <div class="u-col u-col-100" style="max-width: 320px;min-width: 600px;display: table-cell;vertical-align: top;">
                                    <div style="width: 100% !important;">
                                        <!--[if (!mso)&(!IE)]><!-->
                                        <div style="padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;">
                                        <!--<![endif]-->
                    
                                        <table style="font-family:'Cabin',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                                            <tbody>
                                            <tr>
                                                <td style="overflow-wrap:break-word;word-break:break-word;padding:41px 55px 18px;font-family:'Cabin',sans-serif;" align="left">
                    
                                                <div style="color: #003399; line-height: 160%; text-align: center; word-wrap: break-word;">
                                                    <p style="font-size: 14px; line-height: 160%;"><span style="font-size: 20px; line-height: 32px;"><strong>Get in touch</strong></span></p>
                                                    <p style="font-size: 14px; line-height: 160%;">+2348088213177</p>
                                                    <p style="font-size: 14px; line-height: 160%;"><span style="font-size: 16px; line-height: 25.6px; color: #000000;"><a rel="noopener" href="mailto:support@jupit.com" target="_blank">support@jupitapp.co</a></span></p>
                                                    <p style="font-size: 14px; line-height: 160%;"><span style="font-size: 16px; line-height: 25.6px; color: #000000;">https://www.jupitapp.co</span></p>
                                                </div>
                    
                                                </td>
                                            </tr>
                                            </tbody>
                                        </table>
                    
                                        <table style="font-family:'Cabin',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                                            <tbody>
                                            <tr>
                                                <td style="overflow-wrap:break-word;word-break:break-word;padding:10px 10px 33px;font-family:'Cabin',sans-serif;" align="left">
                    
                                                <div align="center">
                                                    <div style="display: table; max-width:97px;">
                                                    <!--[if (mso)|(IE)]><table width="97" cellpadding="0" cellspacing="0" border="0"><tr><td style="border-collapse:collapse;" align="center"><table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse; mso-table-lspace: 0pt;mso-table-rspace: 0pt; width:97px;"><tr><![endif]-->
                    
                    
                                                    <!--[if (mso)|(IE)]><td width="32" style="width:32px; padding-right: 17px;" valign="top"><![endif]-->
                                                    <table align="left" border="0" cellspacing="0" cellpadding="0" width="32" height="32" style="border-collapse: collapse;table-layout: fixed;border-spacing: 0;mso-table-lspace: 0pt;mso-table-rspace: 0pt;vertical-align: top;margin-right: 17px">
                                                        <tbody>
                                                        <tr style="vertical-align: top">
                                                            <td align="left" valign="middle" style="word-break: break-word;border-collapse: collapse !important;vertical-align: top">
                                                            <a href="https://www.instagram.com/jupit.app/" title="Instagram" target="_blank">
                                                                <img src="https://cdn.tools.unlayer.com/social/icons/circle-black/instagram.png" alt="Instagram" title="Instagram" width="32" style="outline: none;text-decoration: none;-ms-interpolation-mode: bicubic;clear: both;display: block !important;border: none;height: auto;float: none;max-width: 32px !important">
                                                            </a>
                                                            </td>
                                                        </tr>
                                                        </tbody>
                                                    </table>
                                                    <!--[if (mso)|(IE)]></td><![endif]-->
                    
                                                    <!--[if (mso)|(IE)]><td width="32" style="width:32px; padding-right: 0px;" valign="top"><![endif]-->
                                                    <table align="left" border="0" cellspacing="0" cellpadding="0" width="32" height="32" style="border-collapse: collapse;table-layout: fixed;border-spacing: 0;mso-table-lspace: 0pt;mso-table-rspace: 0pt;vertical-align: top;margin-right: 0px">
                                                        <tbody>
                                                        <tr style="vertical-align: top">
                                                            <td align="left" valign="middle" style="word-break: break-word;border-collapse: collapse !important;vertical-align: top">
                                                            <a href="mailto:support@jupitapp.co" title="Email" target="_blank">
                                                                <img src="https://cdn.tools.unlayer.com/social/icons/circle-black/email.png" alt="Email" title="Email" width="32" style="outline: none;text-decoration: none;-ms-interpolation-mode: bicubic;clear: both;display: block !important;border: none;height: auto;float: none;max-width: 32px !important">
                                                            </a>
                                                            </td>
                                                        </tr>
                                                        </tbody>
                                                    </table>
                                                    <!--[if (mso)|(IE)]></td><![endif]-->
                    
                    
                                                    <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
                                                    </div>
                                                </div>
                    
                                                </td>
                                            </tr>
                                            </tbody>
                                        </table>
                    
                                        <!--[if (!mso)&(!IE)]><!-->
                                        </div>
                                        <!--<![endif]-->
                                    </div>
                                    </div>
                                    <!--[if (mso)|(IE)]></td><![endif]-->
                                    <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
                                </div>
                                </div>
                            </div>
                    
                    
                    
                            <div class="u-row-container" style="padding: 0px;background-color: transparent">
                                <div class="u-row" style="Margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: #003399;">
                                <div style="border-collapse: collapse;display: table;width: 100%;background-color: transparent;">
                                    <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px;background-color: transparent;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:600px;"><tr style="background-color: #003399;"><![endif]-->
                    
                                    <!--[if (mso)|(IE)]><td align="center" width="600" style="width: 600px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;" valign="top"><![endif]-->
                                    <div class="u-col u-col-100" style="max-width: 320px;min-width: 600px;display: table-cell;vertical-align: top;">
                                    <div style="width: 100% !important;">
                                        <!--[if (!mso)&(!IE)]><!-->
                                        <div style="padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;">
                                        <!--<![endif]-->
                    
                                        <table style="font-family:'Cabin',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                                            <tbody>
                                            <tr>
                                                <td style="overflow-wrap:break-word;word-break:break-word;padding:10px;font-family:'Cabin',sans-serif;" align="left">
                    
                                                <div style="color: #fafafa; line-height: 180%; text-align: center; word-wrap: break-word;">
                                                    <p style="font-size: 14px; line-height: 180%;"><span style="font-size: 16px; line-height: 28.8px;">Copyrights &copy; jupitapp</span></p>
                                                </div>
                    
                                                </td>
                                            </tr>
                                            </tbody>
                                        </table>
                    
                                        <!--[if (!mso)&(!IE)]><!-->
                                        </div>
                                        <!--<![endif]-->
                                    </div>
                                    </div>
                                    <!--[if (mso)|(IE)]></td><![endif]-->
                                    <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
                                </div>
                                </div>
                            </div>
                    
                    
                            <!--[if (mso)|(IE)]></td></tr></table><![endif]-->
                            </td>
                        </tr>
                        </tbody>
                    </table>
                    <!--[if mso]></div><![endif]-->
                    <!--[if IE]></div><![endif]-->
                    </body>
                    
                    </html>


            `
      };

    transporter.sendMail(mailData, function (err, info) {
        if(err){
            console.log(err);
            //res.status(400).send({"message":"An Error Occurred","callback":err})
        }
        
    })
}



router.post('/user/getAllTransactions',middlewareVerify,(req,res)=>{
    
    Walletmodel.find(
        {
            $or:[
               
                    {
                        from_address:req.body.addressBTC,
                        
                    },
                    {
                        to_address:req.body.addressBTC,
                        
                    },
                    {
                        from_address:req.body.addressUSDT,
                        
                    },
                    {
                        to_address:req.body.addressUSDT,
                        
                    },
                    {
                        serial:req.body.virtual_account
                    }

                ]
        }
    ,function(err,docs){
        if(err){
            res.status(400).send(err)
        }
        else if(docs){
            // console.log(docs)
            res.send(docs)
        }
        else if(!docs){
            res.send('Empty')
        }
    }).sort({date_created:-1})
})


router.post('/customer_webhook', (req,res)=>{
   
    // res.send(req.body)
    console.log(req.body)
    res.status(200).end();
    if(req.body.event){

        // saveNotificationNEW(req.body);
        let Notify =  Notification.create({
                            type:"3",
                            orderid:req.body.data.customer_id,
                            transfertype:req.body.event,
                            asset:'WebhookCallBack',
                            from_address:req.body.data.identification.account_number,
                            to_address:req.body.data.identification.bvn,
                            status:'Transaction Completed',
                            read:'unread',
                            date_created:new Date(),
                            initiator:req.body.data.email,
        
                        })
        
        updateWebHook(req.body);
        saveWebHook(req.body); 
        
    }
   
    
})

router.get('/users/test/hook',async (req,res)=>{
    let customer_code = "CUS_70tg6oyphbuaue6";
    let callback_email = "hademylola@gmail.com";
     await KycModel.findOneAndUpdate({customercode:customer_code,'level2.email':callback_email},{'level2.$.event_status':"TEST SUCCESS"},null,(err,docs)=>{
        if(err){
            // console.log('Error',err)
        }
        else{
            // console.log('Updated',docs)
            res.send(docs)
        }
        process.exit(0)
    }).clone().catch(function(err){ console.log(err)});

    
})

router.get('/users/jupit/resetpassword/:id/resetpword/:code',(req,res)=>{
   console.log("code",req.params.code)
   console.log("userid",req.params.id)
    session.find({$and:[{userid:req.params.id},{code:req.params.code}]},async(err,docs)=>{
        if(err){
            res.status(400).send(err)
        }
        else if(docs){
        //    console.log(docs)
            if(docs.status === "Completed"){
                res.json({
                    message:"This Link has Expired",
                    status:false
                })
            }
            else if(docs.status === "Pending"){
                //res.redirect(`https://app-rust-one.vercel.app/user/resetpassword/${req.params.code}/${req.params.id}`);
                res.redirect(`https://app-rust-one.vercel.app/user/changepassword/${req.params.code}/${req.params.id}`);
            }
            else{
                // console.log('code not found')
                await session.create({
                    userid:req.params.id,
                    status:'Pending',
                    code:req.params.code
                })
    
                //res.redirect(`https://app-rust-one.vercel.app/user/resetpassword/${req.params.code}/${req.params.id}`);
                res.redirect(`https://app-rust-one.vercel.app/user/changepassword/${req.params.code}/${req.params.id}`);
            }
        }
        else if(!docs){
            res.json({
                message:"Internal Server Error....Revist the Link and retry",
                status:false
            })
        }
  
    })

})


router.get('/users/jupit/changepassword/:code/qvrse/:id',(req,res)=>{

   session.find({$and:[{userid:req.params.id},{code:req.params.code}]},async(err,docs)=>{
        if(err){
            res.status(400).send(err)
        }
        else if(docs){
        //    console.log(docs)
            if(docs.status === "Completed"){
                res.json({
                    message:"This Link has Expired",
                    status:false
                })
            }
            else if(docs.status === "Pending"){
                res.redirect(`https://app-rust-one.vercel.app/user/changepassword/${req.params.code}/${req.params.id}`);
            }
            else{
                // console.log('code not found')
                await session.create({
                    userid:req.params.id,
                    status:'Pending',
                    code:req.params.code
                })
    
                res.redirect(`https://app-rust-one.vercel.app/user/changepassword/${req.params.code}/${req.params.id}`);
            }
            
        }
        else if(!docs){
            // console.log('HereSaved')
            await session.create({
                userid:req.params.id,
                status:'Pending',
                code:req.params.code
            })

            res.redirect(`https://jupitapp.vercel.app/user/changepassword/${req.params.code}/${req.params.id}`);
        }
   })
    // const item = {
    //     code:req.params.code,
    //     userid: req.params.id,
        
    // }
    // passwordSess.push(item);

    // console.log('passwordSess',req.session)
    // req.session.cookie.expires = false;
    
})

router.post('/getCode/password',(req,res)=>{
    session.findOne({'userid':req.body.userid,'status':'Pending'},(err,docs)=>{
        if(err){
            res.status(400).send(err)
        }
        else if(docs){
            res.send(docs.code)
        }
        else if(!docs){
            res.status(400).send('Internal Server Error..Kindly Click on the Link again');
        }
    })
})

router.post('/user/changepassword/data',async (req,res)=>{
            // console.log(req.body);
            const salt =  bcrypt.genSaltSync(10);
            let newpassword =  bcrypt.hashSync(req.body.password, salt)
            
            let updated  = await Usermodel.findOneAndUpdate({'_id':req.body.userid},{$set:{'password':newpassword}}).exec();
            if(updated){

                let sessionUpdated = await session.findOneAndUpdate({'userid':req.body.userid,'code':req.body.code},{$set:{'status':'Completed'}}).exec();
                
                if(sessionUpdated){
                    res.send({
                        "message":"Updated",
                        "status":true
                    })
                }
                else{

                    res.send({
                        "message":"Session was Not Updated",
                        "status":false
                    })

                }
                
            }
            else{
                res.send({
                    "message":"Error",
                    "status":false
                })

            }
   
})


router.get('/users/jupit/emailverification/e9p5ikica6f19gdsmqta/qvrse/:id',(req,res)=>{
    
   
    Usermodel.findOne({_id: req.params.id },   async function (err, docs) {
        if (err){
            // console.log(err)
            res.send({"err":err})
        }
        else{
            if(docs.email_verification){
                res.send({"message":"Email has Already Been Verified"})
            }
            else{

                const usdt_add =  await createUSDTWalletAddress(req.params.id);
                        // console.log('usdt',usdt_add);
                        if(usdt_add[0]){
                            const btc_add = await createBTCWalletAddress(req.params.id);
                            // console.log('btc_add',btc_add);
                            if(btc_add[0]){
                                let userid = req.params.id;
                                Usermodel.findOne({_id:userid},async (err,docs)=>{
                                    if(err){
                                        res.send({
                                            "Errormessage":err
                                        })
                                    }
                                    else if(docs){
                                        // let update =  Usermodel.findOneAndUpdate({_id:docs._id},{$set:{'email_verification':true}},{new: true},async (err,documents)=>{
                                        //                 if(err){
                                        //                    res.send({
                                        //                        "UpdateError":err
                                        //                    })
                                        //                 }
                                        //                 else if(documents){
    
                                        //                    await createKyc(documents._id,documents.email,documents.phonenumber);
                                        //                     res.redirect('https://app-rust-one.vercel.app/client/signin')
                                                        
                                        //                         // res.send({
                                        //                         //     "message":"Virtual Acct Successfully Updated",
                                        //                         //     "status":documents
                                        //                         // })
                                                          
                                        //                 }
                                        //                 else if(!documents){
                                        //                     res.send({
                                        //                         "message":"Virtual Acct Update Failed ",
                                        //                         "status":false
                                        //                     })
                                        //                 }
                                        //             })
                                       

                                        const vitualaccount = await createvirtualaccount(docs.firstname,docs.lastname,docs._id);
                                        console.log('VirtualAccount',vitualaccount);
                                        if(vitualaccount[0]){
                                            console.log(docs._id)
                                            console.log(vitualaccount[1])
                                               let update =  Usermodel.findOneAndUpdate({_id:docs._id},{$set:{'virtual_account':vitualaccount[1],'email_verification':true}},{new: true},async (err,documents)=>{
                                                    if(err){
                                                       res.send({
                                                           "UpdateError":err
                                                       })
                                                    }
                                                    else if(documents){

                                                       await createKyc(documents._id,documents.email,documents.phonenumber);
                                                        res.redirect('https://app-rust-one.vercel.app/client/signin')
                                                    
                                                            // res.send({
                                                            //     "message":"Virtual Acct Successfully Updated",
                                                            //     "status":documents
                                                            // })
                                                      
                                                    }
                                                    else if(!documents){
                                                        res.send({
                                                            "message":"Virtual Acct Update Failed ",
                                                            "status":false
                                                        })
                                                    }
                                                })
                                            }
                                            else{
                                                res.send({
                                                    "Errormessage":"Account Generation Error",
                                                    "status":false,
                                                    "error":vitualaccount[1]
                                                })
                                            }
                                   
                                        }
                                        else if(!docs){
                                            res.send({
                                                "Errormessage":"Forbidden",
                                                "status":false
                                            })
                                        }
                                })
                                

                                
                                // return false;
                                // if(vitualaccount[0]){
                                //     Usermodel.findOneAndUpdate({_id: req.params.id}, {$set:{email_verification:true}}, {new: true},  async (err, doc) => {
                                //         if (err) {
                                //             res.send({"Errormessage":err,"status":false});
                                //         }
                                //         else{
                                //             createKyc(docs._id,docs.email,docs.phonenumber);
                                //             res.redirect('https://jupitapp.vercel.app/client/signin')
                                //         }
                                        
                                //     });
                                // }
                                // else{
                                //     res.send({"ErrorMessage":vitualaccount[1],"status":false});
                                // }
                                
                               
                            }
                            else{
                                res.send({"ErrorMessage":'Unable to create BTC Wallet Address..pls try again'})
                            }

                        }
                        else{
                                res.send({"ErrorMessage":'Unable to create USDT Wallet Address..pls try again'})
                        }



                // if(docs){
                //       Usermodel.findOneAndUpdate({_id: req.params.id}, {$set:{email_verification:true}}, {new: true},  async (err, doc) => {
                //         if (err) {
                //             res.send({"Errormessage":err,"status":false});
                //         }
                        
                //     });
                // }
                // else{
                //     res.send({"message":"Internal Server Error..try again","status":false})
                // }
                     
            }
        }
    }).clone().catch(function(err){ console.log(err);return [false,err]});
})

router.post('/users/register',(req,res)=>{
    

    Usermodel.findOne({email:req.body.email},function(err,docs){
        if(err){
            res.status(400).send(err);
        }
        else{
            if(docs){
                if(docs.email_verification){
                    
                    res.status(400).send("Email Account Already Exist");
                }
                else{
                    res.status(400).send("Email Verification pending On this Account")
                    // res.send({"message":"Email Verification pending On this Account","status":false})
                }
               
            }
            else{
                Usermodel.findOne({username:req.body.username},function(err,docs){
                    if(err){
                        res.status(400).send(err);
                    }
                    else if(docs){
                        res.status(400).send("Username Already Exist");

                    }
                    else{
                        Usermodel.findOne({phonenumber:req.body.phonenumber},function(err,docs){
                            if(err){
                                res.status(400).send(err);
                            }
                            else if(docs){
                                res.status(400).send("Phonenumber Already In use");
                            }
                            else if(!docs){
                                createUser();
                            }

                        })

                        
                    }
                })
                
            }
        }
    })



    
   async function createUser(){

    

       try{
            const salt =  bcrypt.genSaltSync(10);
            const user = await Usermodel.create({
            username:req.body.username,
            email:req.body.email,
            password: bcrypt.hashSync(req.body.password, salt),
            phonenumber:req.body.phonenumber,
            email_verification:false,
            firstname:req.body.firstname,
            lastname:req.body.lastname,
            virtual_account:"pending"
            
        })
        
      
        // Usermodel.updateOne(
        //     {_id: user._id}, 
        //     {$push: {naira_wallet: {"balance": 0,"address":"020ccccsssssss"}}},{new: true, upsert: true }).exec();
        //     res.sendStatus(200)

        
        // const usdt_add = createUSDTWalletAddress(user._id);
        // const btc_add = createBTCWalletAddress(user._id);

        

        Usermodel.findByIdAndUpdate(user._id, { 
            $push: { 
                    naira_wallet: {"balance":0,"address":"00000"},
                    
                } 
            }).exec();

            const mailData = {
                from: 'Jupit <hello@jupitapp.co>',  // sender address
                to: req.body.email,   // list of receivers
                subject: 'Email Verification',
                text: 'That was easy!',
                html: `

                        
                <!DOCTYPE HTML PUBLIC "-//W3C//DTD XHTML 1.0 Transitional //EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
                <html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
                
                <head>
                <!--[if gte mso 9]>
                <xml>
                <o:OfficeDocumentSettings>
                    <o:AllowPNG/>
                    <o:PixelsPerInch>96</o:PixelsPerInch>
                </o:OfficeDocumentSettings>
                </xml>
                <![endif]-->
                <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <meta name="x-apple-disable-message-reformatting">
                <!--[if !mso]><!-->
                <meta http-equiv="X-UA-Compatible" content="IE=edge">
                <!--<![endif]-->
                <title></title>
                
                <style type="text/css">
                    @media only screen and (min-width: 620px) {
                    .u-row {
                        width: 600px !important;
                    }
                    .u-row .u-col {
                        vertical-align: top;
                    }
                    .u-row .u-col-100 {
                        width: 600px !important;
                    }
                    }
                    
                    @media (max-width: 620px) {
                    .u-row-container {
                        max-width: 100% !important;
                        padding-left: 0px !important;
                        padding-right: 0px !important;
                    }
                    .u-row .u-col {
                        min-width: 320px !important;
                        max-width: 100% !important;
                        display: block !important;
                    }
                    .u-row {
                        width: calc(100% - 40px) !important;
                    }
                    .u-col {
                        width: 100% !important;
                    }
                    .u-col>div {
                        margin: 0 auto;
                    }
                    }
                    
                    body {
                    margin: 0;
                    padding: 0;
                    }
                    
                    table,
                    tr,
                    td {
                    vertical-align: top;
                    border-collapse: collapse;
                    }
                    
                    p {
                    margin: 0;
                    }
                    
                    .ie-container table,
                    .mso-container table {
                    table-layout: fixed;
                    }
                    
                    * {
                    line-height: inherit;
                    }
                    
                    a[x-apple-data-detectors='true'] {
                    color: inherit !important;
                    text-decoration: none !important;
                    }
                    
                    table,
                    td {
                    color: #000000;
                    }
                    
                    a {
                    color: #0000ee;
                    text-decoration: underline;
                    }
                </style>
                
                
                
                <!--[if !mso]><!-->
                <link href="https://fonts.googleapis.com/css?family=Cabin:400,700" rel="stylesheet" type="text/css">
                <!--<![endif]-->
                
                </head>
                
                <body class="clean-body u_body" style="margin: 0;padding: 0;-webkit-text-size-adjust: 100%;background-color: #f9f9f9;color: #000000">
                <!--[if IE]><div class="ie-container"><![endif]-->
                <!--[if mso]><div class="mso-container"><![endif]-->
                <table style="border-collapse: collapse;table-layout: fixed;border-spacing: 0;mso-table-lspace: 0pt;mso-table-rspace: 0pt;vertical-align: top;min-width: 320px;Margin: 0 auto;background-color: #f9f9f9;width:100%" cellpadding="0" cellspacing="0">
                    <tbody>
                    <tr style="vertical-align: top">
                        <td style="word-break: break-word;border-collapse: collapse !important;vertical-align: top">
                        <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" style="background-color: #f9f9f9;"><![endif]-->
                
                
                        <div class="u-row-container" style="padding: 0px;background-color: transparent">
                            <div class="u-row" style="Margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: transparent;">
                            <div style="border-collapse: collapse;display: table;width: 100%;background-color: transparent;">
                                <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px;background-color: transparent;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:600px;"><tr style="background-color: transparent;"><![endif]-->
                
                                <!--[if (mso)|(IE)]><td align="center" width="600" style="width: 600px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;" valign="top"><![endif]-->
                                <div class="u-col u-col-100" style="max-width: 320px;min-width: 600px;display: table-cell;vertical-align: top;">
                                <div style="width: 100% !important;">
                                    <!--[if (!mso)&(!IE)]><!-->
                                    <div style="padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;">
                                    <!--<![endif]-->
                
                                    <table style="font-family:'Cabin',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                                        <tbody>
                                        <tr>
                                            <td style="overflow-wrap:break-word;word-break:break-word;padding:10px;font-family:'Cabin',sans-serif;" align="left">
                
                                            <div style="color: #afb0c7; line-height: 170%; text-align: center; word-wrap: break-word;">
                                                <p style="font-size: 14px; line-height: 170%;"><span style="font-size: 14px; line-height: 23.8px;"></span></p>
                                            </div>
                
                                            </td>
                                        </tr>
                                        </tbody>
                                    </table>
                
                                    <!--[if (!mso)&(!IE)]><!-->
                                    </div>
                                    <!--<![endif]-->
                                </div>
                                </div>
                                <!--[if (mso)|(IE)]></td><![endif]-->
                                <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
                            </div>
                            </div>
                        </div>
                
                
                
                        <div class="u-row-container" style="padding: 0px;background-color: transparent">
                            <div class="u-row" style="Margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: #ffffff;">
                            <div style="border-collapse: collapse;display: table;width: 100%;background-color: transparent;">
                                <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px;background-color: transparent;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:600px;"><tr style="background-color: #ffffff;"><![endif]-->
                
                                <!--[if (mso)|(IE)]><td align="center" width="600" style="width: 600px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;" valign="top"><![endif]-->
                                <div class="u-col u-col-100" style="max-width: 320px;min-width: 600px;display: table-cell;vertical-align: top;">
                                <div style="width: 100% !important;">
                                    <!--[if (!mso)&(!IE)]><!-->
                                    <div style="padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;">
                                    <!--<![endif]-->
                
                                    <table style="font-family:'Cabin',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                                        <tbody>
                                        <tr>
                                            <td style="overflow-wrap:break-word;word-break:break-word;padding:20px;font-family:'Cabin',sans-serif;" align="left">
                
                                            <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                                <tr>
                                                <td style="padding-right: 0px;padding-left: 0px;" align="center">
                
                                                <img align="center" border="0" src="https://res.cloudinary.com/jupit/image/upload/v1656160429/JUPIT-Logo-Wordmark_1_jo6ivd.png" alt="Image" title="Image" style="outline: none;text-decoration: none;-ms-interpolation-mode: bicubic;clear: both;display: inline-block !important;border: none;height: auto;float: none;width: 32%;max-width: 179.2px;"
                                                width="179.2" />
                
                                                </td>
                                                </tr>
                                            </table>
                
                                            </td>
                                        </tr>
                                        </tbody>
                                    </table>
                
                                    <!--[if (!mso)&(!IE)]><!-->
                                    </div>
                                    <!--<![endif]-->
                                </div>
                                </div>
                                <!--[if (mso)|(IE)]></td><![endif]-->
                                <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
                            </div>
                            </div>
                        </div>
                
                
                
                        <div class="u-row-container" style="padding: 0px;background-color: transparent">
                            <div class="u-row" style="Margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: #003399;">
                            <div style="border-collapse: collapse;display: table;width: 100%;background-color: transparent;">
                                <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px;background-color: transparent;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:600px;"><tr style="background-color: #003399;"><![endif]-->
                
                                <!--[if (mso)|(IE)]><td align="center" width="600" style="width: 600px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;" valign="top"><![endif]-->
                                <div class="u-col u-col-100" style="max-width: 320px;min-width: 600px;display: table-cell;vertical-align: top;">
                                <div style="width: 100% !important;">
                                    <!--[if (!mso)&(!IE)]><!-->
                                    <div style="padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;">
                                    <!--<![endif]-->
                
                                    <table style="font-family:'Cabin',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                                        <tbody>
                                        <tr>
                                            <td style="overflow-wrap:break-word;word-break:break-word;padding:40px 10px 10px;font-family:'Cabin',sans-serif;" align="left">
                
                                            <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                                <tr>
                                                <td style="padding-right: 0px;padding-left: 0px;" align="center">
                
                                                    <img align="center" border="0" src="https://cdn.templates.unlayer.com/assets/1597218650916-xxxxc.png" alt="Image" title="Image" style="outline: none;text-decoration: none;-ms-interpolation-mode: bicubic;clear: both;display: inline-block !important;border: none;height: auto;float: none;width: 26%;max-width: 150.8px;"
                                                    width="150.8" />
                
                                                </td>
                                                </tr>
                                            </table>
                
                                            </td>
                                        </tr>
                                        </tbody>
                                    </table>
                
                                    <table style="font-family:'Cabin',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                                        <tbody>
                                        <tr>
                                            <td style="overflow-wrap:break-word;word-break:break-word;padding:10px;font-family:'Cabin',sans-serif;" align="left">
                
                                            <div style="color: #e5eaf5; line-height: 140%; text-align: center; word-wrap: break-word;">
                                                <p style="font-size: 14px; line-height: 140%;"><strong>E M A I L&nbsp;V E R I F I C A T I O N!</strong></p>
                                            </div>
                
                                            </td>
                                        </tr>
                                        </tbody>
                                    </table>
                
                                    <table style="font-family:'Cabin',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                                        <tbody>
                                        <tr>
                                            <td style="overflow-wrap:break-word;word-break:break-word;padding:0px 10px 31px;font-family:'Cabin',sans-serif;" align="left">
                
                                            <div style="color: #e5eaf5; line-height: 140%; text-align: center; word-wrap: break-word;">
                                                <p style="font-size: 14px; line-height: 140%;"><span style="font-size: 28px; line-height: 39.2px;"><strong><span style="line-height: 39.2px; font-size: 28px;">Verify Your E-mail Address </span></strong>
                                                </span>
                                                </p>
                                            </div>
                
                                            </td>
                                        </tr>
                                        </tbody>
                                    </table>
                
                                    <!--[if (!mso)&(!IE)]><!-->
                                    </div>
                                    <!--<![endif]-->
                                </div>
                                </div>
                                <!--[if (mso)|(IE)]></td><![endif]-->
                                <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
                            </div>
                            </div>
                        </div>
                
                
                
                        <div class="u-row-container" style="padding: 0px;background-color: transparent">
                            <div class="u-row" style="Margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: #ffffff;">
                            <div style="border-collapse: collapse;display: table;width: 100%;background-color: transparent;">
                                <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px;background-color: transparent;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:600px;"><tr style="background-color: #ffffff;"><![endif]-->
                
                                <!--[if (mso)|(IE)]><td align="center" width="600" style="width: 600px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;" valign="top"><![endif]-->
                                <div class="u-col u-col-100" style="max-width: 320px;min-width: 600px;display: table-cell;vertical-align: top;">
                                <div style="width: 100% !important;">
                                    <!--[if (!mso)&(!IE)]><!-->
                                    <div style="padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;">
                                    <!--<![endif]-->
                
                                    <table style="font-family:'Cabin',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                                        <tbody>
                                        <tr>
                                            <td style="overflow-wrap:break-word;word-break:break-word;padding:33px 55px;font-family:'Cabin',sans-serif;" align="left">
                
                                            <div style="line-height: 160%; text-align: center; word-wrap: break-word;">
                                                <p style="font-size: 14px; line-height: 160%;"><span style="font-size: 22px; line-height: 35.2px;">Hi, </span></p>
                                                <p style="font-size: 14px; line-height: 160%;"><span style="font-size: 18px; line-height: 28.8px;">You're almost ready to get started. Please click on the button below to verify your email address and enjoy crypto exchange services! </span></p>
                                            </div>
                
                                            </td>
                                        </tr>
                                        </tbody>
                                    </table>
                
                                    <table style="font-family:'Cabin',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                                        <tbody>
                                        <tr>
                                            <td style="overflow-wrap:break-word;word-break:break-word;padding:10px;font-family:'Cabin',sans-serif;" align="left">
                
                                            <div align="center">
                                                <!--[if mso]><table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-spacing: 0; border-collapse: collapse; mso-table-lspace:0pt; mso-table-rspace:0pt;font-family:'Cabin',sans-serif;"><tr><td style="font-family:'Cabin',sans-serif;" align="center"><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="https://myjupit.herokuapp.com/users/jupit/emailverification/e9p5ikica6f19gdsmqta/qvrse/" style="height:46px; v-text-anchor:middle; width:235px;" arcsize="8.5%" stroke="f" fillcolor="#ff6600"><w:anchorlock/><center style="color:#FFFFFF;font-family:'Cabin',sans-serif;"><![endif]-->
                                                <a href="https://myjupit.herokuapp.com/users/jupit/emailverification/e9p5ikica6f19gdsmqta/qvrse/${user._id}" target="_blank" style="box-sizing: border-box;display: inline-block;font-family:'Cabin',sans-serif;text-decoration: none;-webkit-text-size-adjust: none;text-align: center;color: #FFFFFF; background-color: #ff6600; border-radius: 4px;-webkit-border-radius: 4px; -moz-border-radius: 4px; width:auto; max-width:100%; overflow-wrap: break-word; word-break: break-word; word-wrap:break-word; mso-border-alt: none;">
                                                <span style="display:block;padding:14px 44px 13px;line-height:120%;"><span style="font-size: 16px; line-height: 19.2px;"><strong><span style="line-height: 19.2px; font-size: 16px;">VERIFY YOUR EMAIL</span></strong>
                                                </span>
                                                </span>
                                                </a>
                                                <!--[if mso]></center></v:roundrect></td></tr></table><![endif]-->
                                            </div>
                
                                            </td>
                                        </tr>
                                        </tbody>
                                    </table>
                
                                    <table style="font-family:'Cabin',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                                        <tbody>
                                        <tr>
                                            <td style="overflow-wrap:break-word;word-break:break-word;padding:33px 55px 60px;font-family:'Cabin',sans-serif;" align="left">
                
                                            <div style="line-height: 160%; text-align: center; word-wrap: break-word;">
                                                <p style="line-height: 160%; font-size: 14px;"><span style="font-size: 18px; line-height: 28.8px;">Thanks,</span></p>
                                                <p style="line-height: 160%; font-size: 14px;"><span style="font-size: 18px; line-height: 28.8px;">The Support Team</span></p>
                                            </div>
                
                                            </td>
                                        </tr>
                                        </tbody>
                                    </table>
                
                                    <!--[if (!mso)&(!IE)]><!-->
                                    </div>
                                    <!--<![endif]-->
                                </div>
                                </div>
                                <!--[if (mso)|(IE)]></td><![endif]-->
                                <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
                            </div>
                            </div>
                        </div>
                
                
                
                        <div class="u-row-container" style="padding: 0px;background-color: transparent">
                            <div class="u-row" style="Margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: #e5eaf5;">
                            <div style="border-collapse: collapse;display: table;width: 100%;background-color: transparent;">
                                <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px;background-color: transparent;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:600px;"><tr style="background-color: #e5eaf5;"><![endif]-->
                
                                <!--[if (mso)|(IE)]><td align="center" width="600" style="width: 600px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;" valign="top"><![endif]-->
                                <div class="u-col u-col-100" style="max-width: 320px;min-width: 600px;display: table-cell;vertical-align: top;">
                                <div style="width: 100% !important;">
                                    <!--[if (!mso)&(!IE)]><!-->
                                    <div style="padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;">
                                    <!--<![endif]-->
                
                                    <table style="font-family:'Cabin',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                                        <tbody>
                                        <tr>
                                            <td style="overflow-wrap:break-word;word-break:break-word;padding:41px 55px 18px;font-family:'Cabin',sans-serif;" align="left">
                
                                            <div style="color: #003399; line-height: 160%; text-align: center; word-wrap: break-word;">
                                                <p style="font-size: 14px; line-height: 160%;"><span style="font-size: 20px; line-height: 32px;"><strong>Get in touch</strong></span></p>
                                                <p style="font-size: 14px; line-height: 160%;">+2348088213177</p>
                                                <p style="font-size: 14px; line-height: 160%;"><span style="font-size: 16px; line-height: 25.6px; color: #000000;"><a rel="noopener" href="mailto:support@jupitapp.co" target="_blank">support@jupitapp.co</a></span></p>
                                                <p style="font-size: 14px; line-height: 160%;"><span style="font-size: 16px; line-height: 25.6px; color: #000000;">https://www.jupitapp.co</span></p>
                                            </div>
                
                                            </td>
                                        </tr>
                                        </tbody>
                                    </table>
                
                                    <table style="font-family:'Cabin',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                                        <tbody>
                                        <tr>
                                            <td style="overflow-wrap:break-word;word-break:break-word;padding:10px 10px 33px;font-family:'Cabin',sans-serif;" align="left">
                
                                            <div align="center">
                                                <div style="display: table; max-width:244px;">
                                                <!--[if (mso)|(IE)]><table width="244" cellpadding="0" cellspacing="0" border="0"><tr><td style="border-collapse:collapse;" align="center"><table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse; mso-table-lspace: 0pt;mso-table-rspace: 0pt; width:244px;"><tr><![endif]-->
                
                
                                                <!--[if (mso)|(IE)]><td width="32" style="width:32px; padding-right: 17px;" valign="top"><![endif]-->
                                               
                                                <!--[if (mso)|(IE)]></td><![endif]-->
                
                                                <!--[if (mso)|(IE)]><td width="32" style="width:32px; padding-right: 17px;" valign="top"><![endif]-->
                                                
                                                <!--[if (mso)|(IE)]></td><![endif]-->
                
                                                <!--[if (mso)|(IE)]><td width="32" style="width:32px; padding-right: 17px;" valign="top"><![endif]-->
                                                <table align="left" border="0" cellspacing="0" cellpadding="0" width="32" height="32" style="border-collapse: collapse;table-layout: fixed;border-spacing: 0;mso-table-lspace: 0pt;mso-table-rspace: 0pt;vertical-align: top;margin-right: 17px">
                                                    <tbody>
                                                    <tr style="vertical-align: top">
                                                        <td align="left" valign="middle" style="word-break: break-word;border-collapse: collapse !important;vertical-align: top">
                                                        <a href="https://www.instagram.com/jupit.app/" title="Instagram" target="_blank">
                                                            <img src="https://cdn.tools.unlayer.com/social/icons/circle-black/instagram.png" alt="Instagram" title="Instagram" width="32" style="outline: none;text-decoration: none;-ms-interpolation-mode: bicubic;clear: both;display: block !important;border: none;height: auto;float: none;max-width: 32px !important">
                                                        </a>
                                                        </td>
                                                    </tr>
                                                    </tbody>
                                                </table>
                                                <!--[if (mso)|(IE)]></td><![endif]-->
                
                                                <!--[if (mso)|(IE)]><td width="32" style="width:32px; padding-right: 17px;" valign="top"><![endif]-->
                                               
                                                <!--[if (mso)|(IE)]></td><![endif]-->
                
                                                <!--[if (mso)|(IE)]><td width="32" style="width:32px; padding-right: 0px;" valign="top"><![endif]-->
                                                <table align="left" border="0" cellspacing="0" cellpadding="0" width="32" height="32" style="border-collapse: collapse;table-layout: fixed;border-spacing: 0;mso-table-lspace: 0pt;mso-table-rspace: 0pt;vertical-align: top;margin-right: 0px">
                                                    <tbody>
                                                    <tr style="vertical-align: top">
                                                        <td align="left" valign="middle" style="word-break: break-word;border-collapse: collapse !important;vertical-align: top">
                                                        <a href="mailto:support@jupitapp.co" title="Email" target="_blank">
                                                            <img src="https://cdn.tools.unlayer.com/social/icons/circle-black/email.png" alt="Email" title="Email" width="32" style="outline: none;text-decoration: none;-ms-interpolation-mode: bicubic;clear: both;display: block !important;border: none;height: auto;float: none;max-width: 32px !important">
                                                        </a>
                                                        </td>
                                                    </tr>
                                                    </tbody>
                                                </table>
                                                <!--[if (mso)|(IE)]></td><![endif]-->
                
                
                                                <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
                                                </div>
                                            </div>
                
                                            </td>
                                        </tr>
                                        </tbody>
                                    </table>
                
                                    <!--[if (!mso)&(!IE)]><!-->
                                    </div>
                                    <!--<![endif]-->
                                </div>
                                </div>
                                <!--[if (mso)|(IE)]></td><![endif]-->
                                <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
                            </div>
                            </div>
                        </div>
                
                
                
                        <div class="u-row-container" style="padding: 0px;background-color: transparent">
                            <div class="u-row" style="Margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: #003399;">
                            <div style="border-collapse: collapse;display: table;width: 100%;background-color: transparent;">
                                <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px;background-color: transparent;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:600px;"><tr style="background-color: #003399;"><![endif]-->
                
                                <!--[if (mso)|(IE)]><td align="center" width="600" style="width: 600px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;" valign="top"><![endif]-->
                                <div class="u-col u-col-100" style="max-width: 320px;min-width: 600px;display: table-cell;vertical-align: top;">
                                <div style="width: 100% !important;">
                                    <!--[if (!mso)&(!IE)]><!-->
                                    <div style="padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;">
                                    <!--<![endif]-->
                
                                    <table style="font-family:'Cabin',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                                        <tbody>
                                        <tr>
                                            <td style="overflow-wrap:break-word;word-break:break-word;padding:10px;font-family:'Cabin',sans-serif;" align="left">
                
                                            <div style="color: #fafafa; line-height: 180%; text-align: center; word-wrap: break-word;">
                                                <p style="font-size: 14px; line-height: 180%;"><span style="font-size: 16px; line-height: 28.8px;">Copyrights &copy; jupitapp</span></p>
                                            </div>
                
                                            </td>
                                        </tr>
                                        </tbody>
                                    </table>
                
                                    <!--[if (!mso)&(!IE)]><!-->
                                    </div>
                                    <!--<![endif]-->
                                </div>
                                </div>
                                <!--[if (mso)|(IE)]></td><![endif]-->
                                <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
                            </div>
                            </div>
                        </div>
                
                
                        <!--[if (mso)|(IE)]></td></tr></table><![endif]-->
                        </td>
                    </tr>
                    </tbody>
                </table>
                <!--[if mso]></div><![endif]-->
                <!--[if IE]></div><![endif]-->
                </body>
                
                </html>


                      
                    `
              };

            transporter.sendMail(mailData, function (err, info) {
                if(err){
                    console.log(err);
                    res.send({"message":"An Error Occurred","callback":err})
                }
                
                else{
                    

                    
                    res.send({"message":"Kindly Check Mail for Account Verification Link","callback":info,"status":true})
                    
                }
                  
             });
            

            // res.send({"message":"User Successfully Registered"})


      
       }
       catch(err){
        // console.log(err)
        res.send(err.message)
       }
  
   }
  
})

router.post('/tester',async (req,res)=>{

    let x = await createUSDTWalletAddress(req.body.userid)
    res.send(x)
})

async function createUSDTWalletAddress(userid){
    
    let rand = random(option_rand);
    var option_rand = {
            min: 48886
            , max: 67889
            , integer: true
        }
    function buildChecksumUSDT(params, secret, t, r, postData) {
        const p = params || [];
        p.push(`t=${t}`, `r=${r}`);
        if (!!postData) {
            if (typeof postData === 'string') {
                    p.push(postData);
            } else {
                    p.push(JSON.stringify(postData));
            }
        }
        p.sort();
        p.push(`secret=${secret}`);
        return crypto.createHash('sha256').update(p.join('&')).digest('hex');
    }

    // var secret="51bEgEHrotG69PFScrPTt1gR8Wv";
    //var secret="3jNct6qzbmDNiFtCr6gyQGsQANFS";
    var secret="3jNct6qzbmDNiFtCr6gyQGsQANFS";
    var time = Math.floor(new Date().getTime() / 1000)
    var postData = {"count":1};

    var buildUSDT = buildChecksumUSDT(null,secret,time,rand,postData);
    const params ={
        "count": 1,}
    
    
        const parameters = {
            t:time,
            r:rand,
        }
        const get_request_args = querystring.stringify(parameters);
        
        // const base_url = "http://demo.thresh0ld.com"
        const url = 'https://vault.thresh0ld.com/v1/sofa/wallets/196649/addresses?'+get_request_args
    
        
     let result = await axios.post(url,params,{ 
        headers: {
            'Content-Type': 'application/json',
            // 'X-API-CODE':'2C38687sm5kTnyFWD',
            // 'X-API-CODE':'4nrsvq2xgf2QXtoyC',
            'X-API-CODE':'4nrsvq2xgf2QXtoyC',
            'X-CHECKSUM':buildUSDT,
            'User-Agent': 'Node.js/16.7.0 (Windows 10; x64)'
        }
    })
    .then(res=>{
        Usermodel.findByIdAndUpdate(userid, { 
            $push: { 
                    
                    usdt_wallet: {"balance":0,"address":res.data.addresses[0]},
                } 
            }).exec();

            return [true,'successful'];
        
    })
    .catch((error)=>{
        // console.log('error_usdt',console.log(error.response))
        return [false,error.response];
       
    })

    return result;
}



async function createvirtualaccount(firstname,lastname,userid){

    
    //const url = "https://sandbox.purplepayapp.com/dev_api/v1/test/deposit/create_new_account_number";
    const url = "https://live.purplepayapp.com/v1/deposit/create_new_account_number";
    // const url = "https://api.purplepayapp.com/dev_api/v1/test/deposit/create_new_account_number";
            const params ={
                "first_name":firstname,
                "last_name":lastname,
                "bvn":""
            }
            let response = [];
             let endresult  = await axios.post(url,params,{ 
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'bearer 8f9838f22b7d7545562135370af912f21204178229f1820bed178cd58578120301602c200c58b2894a6c5be2d0b55e40c451845739c4f197692aefc579078d2a'
                    }
                })
                .then(res=>{
                    console.log("acct",res.data);
                    if(res.data.status){
                        return [ true,res.data.data.account_number];
                    }
                    else{
                        return [ false,res.data.message];
                    } 
                    
                })
                .catch((error)=>{
                    console.log('errorxxx',error)
                    return [false,error];
                })

                return endresult;

            
}


async function createBTCWalletAddress(userid){
        
    let rand = random(option_rand);
    var option_rand = {
            min: 48886
            , max: 67889
            , integer: true
        }
    function buildChecksum(params, secret, t, r, postData) {
    const p = params || [];
    p.push(`t=${t}`, `r=${r}`);
    if (!!postData) {
        if (typeof postData === 'string') {
                p.push(postData);
        } else {
                p.push(JSON.stringify(postData));
        }
    }
    p.sort();
    p.push(`secret=${secret}`);
    return crypto.createHash('sha256').update(p.join('&')).digest('hex');
    }

    // var secret="2awjZJeeVhtG23tepAzv5tcMYYN";
    var secret="3MfESNefnjWQv42PGxhWyg8VtS4H";
    var time = Math.floor(new Date().getTime() / 1000)
    var postData = {"count":1};

    var build = buildChecksum(null,secret,time,rand,postData);

    const params ={
    "count": 1}


    const parameters = {
        t:time,
        r:rand,
    }
    const get_request_args = querystring.stringify(parameters);

    const base_url = "http://demo.thresh0ld.com"
    const url = 'https://vault.thresh0ld.com/v1/sofa/wallets/136821/addresses?'+get_request_args


    let result = await axios.post(url,params,{ 
    headers: {
        'Content-Type': 'application/json',
        // 'X-API-CODE':'55JbxSP6xosFTkFvg',
        'X-API-CODE':'5acGjgQXSHQQJBTWk',
        'X-CHECKSUM':build,
        'User-Agent': 'Node.js/16.7.0 (Windows 10; x64)'
    }
    })
    .then(res=>{
        
        Usermodel.findByIdAndUpdate(userid, { 
            $push: { 
                    
                    btc_wallet: {"balance":0,"address":res.data.addresses[0]},
                } 
            }).exec();

            return [true,'success'];
    })
    .catch((error)=>{
        // console.log('error',error.response)
        return [false,error.response];
        
        
    })

    return result;
}

async function createKyc(userid,email,phonenumber){
    try{
        const kyc= await  KycModel.create({
            userid:userid
        })

        createCustomerCode(kyc._id,email,phonenumber);

        // KycModel.findByIdAndUpdate(kyc._id, { 
        //     $push: { 
        //             level1: {"status":"verified"}, 
        //         } 
        //     }).exec();


    }
    catch(err){
        res.send({
            "message":"An Error Occurred",
            "error":err,
            "status":false
        })
        // console.log(err)
    }
}

function createCustomerCode(kyc_id,email,phonenumber){
    // console.log(kyc_id,email,phonenumber)
    const url ="https://api.paystack.co/customer";
    const params = {
        "email":email,
        "phonenumber":phonenumber
    }
    axios.post(url,params,{
        headers: {
            'Content-Type': 'application/json',
            'Authorization':'Bearer sk_live_e17b8c11ebd06acf37e6999d97ce43e7b1711a57'
           
        }
    })
    .then(res=>{
         console.log('CustomerCode',res.data.data.customer_code);
        // console.log('res',res)
        KycModel.findByIdAndUpdate(kyc_id, { 
            $push: { 
                   
                    level1:{
                        "email":email,
                        "status":"Verified"
                    },
                    level2:{
                        "email":email,
                        "customer_code":res.data.data.customer_code,
                        "integration":res.data.data.integration,
                        "event_status":"undefined"
                    },
                    level3:{
                        "idcard_type":'undefined',
                        "uniqueNumber":'undefined', 
                        "callbackStatus":'undefined',
                        "status":false
                        
                    }
                    
                } 
            }).exec();
             console.log('Kyc Successfully Created')
            // res.send({"SuccessMessage":"EmailAddress Verified","status":true});
    })
    .catch((err)=>{
        // res.send({
        //     "message":"An Error Occurred",
        //     "error":err,
        //     "status":false
        // })
        // console.log(err)
    })
}


router.post('/users/validate/acountnumber',middlewareVerify,(req,res)=>{
    const account_number = req.body.account_number;
    const bank_code = req.body.bank_code;
    const parameters = {
        account_number:account_number,
        bank_code:bank_code,
    }
    const get_request_args = querystring.stringify(parameters);
    const url = "https://api.paystack.co/bank/resolve?"+get_request_args
    axios.get(url,{
        headers:{
            'Content-Type':'application/json',
            'Authorization':'Bearer sk_live_e17b8c11ebd06acf37e6999d97ce43e7b1711a57'
        }
    })
    .then(result=>{
    //    console.log(result)
         if(result.data.message === "Account number resolved"){
             res.send({
                 "Message":" Account Resolved",
                 "data":result.data
             })
         }
         
       
    })
    .catch((err)=>{
        res.status(400).send('Account Unresolved')
        // console.log(err)
    })


});



router.post('/users/validate/bvntoaccount/kyc/level2',middlewareVerify, async(req,res)=>{


    const account_number = req.body.account_number;
    const bankcode = req.body.bankcode;
    const bvn = req.body.bvn;
    // const customer_code = req.body.customer_code
    const emailaddress = req.body.email
    // console.log(account_number,bankcode,bvn,customer_code)

    let CreateCustomerCode = await customer_code_fetch(emailaddress)
        if(CreateCustomerCode[1]){
            // res.send(CreateCustomerCode[0])

            // Usermodel.findOneAndUpdate({email:emailaddress})
            const updateCustomerCode = await Usermodel.findOneAndUpdate({email:emailaddress},{customer_code:CreateCustomerCode[0]},{
                new: true,
                upsert: true // Make this update into an upsert
              })

              Bankmodel.findOne({email:req.body.email},async function(err,docs){
                if(err){
                    res.status(400).send('Internal Server Error')
                }
                else if(docs){
                    Bankmodel.findOneAndUpdate({email:req.body.email},{bvn:req.body.bvn,account_number:req.body.account_number,account_name:req.body.account_name,bank_code:req.body.bankcode},null,async(err)=>{
                        if(err){
                            res.status(400).send('Error Updating Bank Details')
                        }
                    })
                }
                else if(!docs){
                    const bankdetails = await Bankmodel.create({
                        email:req.body.email,
                        bvn:req.body.bvn,
                        account_number:req.body.account_number,
                        account_name:req.body.account_name,
                        bank_code:req.body.bankcode
                        
                    })
                }
              })
              


            const url = `https://api.paystack.co/customer/${CreateCustomerCode[0]}/identification`;
            const params={
                "country": "NG",
                "type": "bank_account",
                "account_number": account_number,
                "bvn": bvn,
                "bank_code": bankcode,
                "first_name": "",
                "last_name": ""
            }
            axios.post(url,params,{
                headers: {
                    "Content-Type": "application/json",
                    'Authorization':'Bearer sk_live_e17b8c11ebd06acf37e6999d97ce43e7b1711a57' 
                }
            })
            .then(result=>{

                res.send({
                    "message":result.data
                })
                
            })
            .catch((err)=>{
                res.send({
                    "err":err.response.data
                })
                // err.response ? console.log("errData",err.response.data) :console.log("errAll",err)
                
            })
        }
        else{
            res.status(400).send(err);
        }

    return false;
    

});

async function customer_code_fetch(emailaddress){
    const url = `https://api.paystack.co/customer`;
    const params={
        "email":emailaddress,
        "first_name":"",
        "last_name":"",
        "phone":""
    }
    let cust_code = await axios.post(url,params,{
        headers: {
            "Content-Type": "application/json",
            'Authorization':'Bearer sk_live_e17b8c11ebd06acf37e6999d97ce43e7b1711a57' 
        }
    })
    .then(result=>{
        // console.log(result.data.data.customer_code)
        return [result.data.data.customer_code,true];
        
    })
    .catch((err)=>{
        console.log(err.response)
        return[ err.response,false];
        
        
    })
    return cust_code;
}

async function saveWebHook (json){
    
        const webhook = await WebHook.create({
            event:json.event,
            customerid:json.data.customer_id,
            customercode:json.data.customer_code,
            email:json.data.email,
            bvn:json.data.identification.bvn,
            accountnumber:json.data.identification.account_number,
            bankcode:json.data.identification.bank_code
        })

        if(webhook){
            return[true,"WebhookSaved"];
        }
        else{
            return[false,"Webhook Failed"];
        }

    
        
        
    
}
async function saveNotificationNEW (json){
    
        // let Notify = await Notification.create({
        //                     type:"3",
        //                     orderid:json.data.customer_id,
        //                     transfertype:json.event,
        //                     asset:'Webhook CallBack',
        //                     from_address:json.data.identification.account_number,
        //                     to_address:json.data.identification.bvn,
        //                     status:'Transaction Completed',
        //                     read:'unread',
        //                     date_created:new Date(),
        //                     initiator:json.data.email,
        
        //                 })

                        let Notify = await Notification.create({
                            type:"3",
                            orderid:"json.data.customer_id",
                            transfertype:"json.event",
                            asset:'Webhook CallBack',
                            from_address:"json.data.identification.account_number",
                            to_address:"json.data.identification.bvn",
                            status:'Transaction Completed',
                            read:'unread',
                            date_created:new Date(),
                            initiator:"json.data.email",
        
                        })

                if(Notify){
                    return [true];
                
                }
                else{
                    return [false];
                }
             
    
}

async function updateWebHook(json){
    
   
    let bankwebhook = await Bankmodel.findOneAndUpdate({email:json.data.email},{status:json.event},null,(err)=>{
        if(err){
            return [false,err]
        }
        
    }).clone().catch(function(err){ console.log(err);return [false,err]});

    let res = await KycModel.findOneAndUpdate ({customercode:json.data.customer_code,'level2.email':json.data.email},{'level2.$.event_status':json.event},null,async(err)=>{
        if(err){
            // console.log('Error',err)
            return [false,err]
        }
        
        process.exit(0)
    }).clone().catch(function(err){ console.log(err);return [false,err]});

    return [true,"Saved"];
    
   
}

async function SendMail(address,status){
    if(status === "customeridentification.success"){
        const mailData = {
            from: 'Jupit <hello@jupitapp.co>',  // sender address
            to: address,   // list of receivers
            subject: 'Account  Verification <jupit.app>',
            text: 'That was easy!',
            html: `
                    
            <!DOCTYPE HTML PUBLIC "-//W3C//DTD XHTML 1.0 Transitional //EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
            <html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
            
            <head>
            <!--[if gte mso 9]>
            <xml>
            <o:OfficeDocumentSettings>
                <o:AllowPNG/>
                <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
            </xml>
            <![endif]-->
            <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta name="x-apple-disable-message-reformatting">
            <!--[if !mso]><!-->
            <meta http-equiv="X-UA-Compatible" content="IE=edge">
            <!--<![endif]-->
            <title></title>
            
            <style type="text/css">
                @media only screen and (min-width: 620px) {
                .u-row {
                    width: 600px !important;
                }
                .u-row .u-col {
                    vertical-align: top;
                }
                .u-row .u-col-100 {
                    width: 600px !important;
                }
                }
                
                @media (max-width: 620px) {
                .u-row-container {
                    max-width: 100% !important;
                    padding-left: 0px !important;
                    padding-right: 0px !important;
                }
                .u-row .u-col {
                    min-width: 320px !important;
                    max-width: 100% !important;
                    display: block !important;
                }
                .u-row {
                    width: calc(100% - 40px) !important;
                }
                .u-col {
                    width: 100% !important;
                }
                .u-col>div {
                    margin: 0 auto;
                }
                }
                
                body {
                margin: 0;
                padding: 0;
                }
                
                table,
                tr,
                td {
                vertical-align: top;
                border-collapse: collapse;
                }
                
                p {
                margin: 0;
                }
                
                .ie-container table,
                .mso-container table {
                table-layout: fixed;
                }
                
                * {
                line-height: inherit;
                }
                
                a[x-apple-data-detectors='true'] {
                color: inherit !important;
                text-decoration: none !important;
                }
                
                table,
                td {
                color: #000000;
                }
                
                a {
                color: #0000ee;
                text-decoration: underline;
                }
            </style>
            
            
            
            <!--[if !mso]><!-->
            <link href="https://fonts.googleapis.com/css?family=Cabin:400,700" rel="stylesheet" type="text/css">
            <!--<![endif]-->
            
            </head>
            
            <body class="clean-body u_body" style="margin: 0;padding: 0;-webkit-text-size-adjust: 100%;background-color: #f9f9f9;color: #000000">
            <!--[if IE]><div class="ie-container"><![endif]-->
            <!--[if mso]><div class="mso-container"><![endif]-->
            <table style="border-collapse: collapse;table-layout: fixed;border-spacing: 0;mso-table-lspace: 0pt;mso-table-rspace: 0pt;vertical-align: top;min-width: 320px;Margin: 0 auto;background-color: #f9f9f9;width:100%" cellpadding="0" cellspacing="0">
                <tbody>
                <tr style="vertical-align: top">
                    <td style="word-break: break-word;border-collapse: collapse !important;vertical-align: top">
                    <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" style="background-color: #f9f9f9;"><![endif]-->
            
            
                    <div class="u-row-container" style="padding: 0px;background-color: transparent">
                        <div class="u-row" style="Margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: transparent;">
                        <div style="border-collapse: collapse;display: table;width: 100%;background-color: transparent;">
                            <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px;background-color: transparent;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:600px;"><tr style="background-color: transparent;"><![endif]-->
            
                            <!--[if (mso)|(IE)]><td align="center" width="600" style="width: 600px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;" valign="top"><![endif]-->
                            <div class="u-col u-col-100" style="max-width: 320px;min-width: 600px;display: table-cell;vertical-align: top;">
                            <div style="width: 100% !important;">
                                <!--[if (!mso)&(!IE)]><!-->
                                <div style="padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;">
                                <!--<![endif]-->
            
                                <table style="font-family:'Cabin',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                                    <tbody>
                                    <tr>
                                        <td style="overflow-wrap:break-word;word-break:break-word;padding:10px;font-family:'Cabin',sans-serif;" align="left">
            
                                        <div style="color: #afb0c7; line-height: 170%; text-align: center; word-wrap: break-word;">
                                            <p style="font-size: 14px; line-height: 170%;"><span style="font-size: 14px; line-height: 23.8px;"></span></p>
                                        </div>
            
                                        </td>
                                    </tr>
                                    </tbody>
                                </table>
            
                                <!--[if (!mso)&(!IE)]><!-->
                                </div>
                                <!--<![endif]-->
                            </div>
                            </div>
                            <!--[if (mso)|(IE)]></td><![endif]-->
                            <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
                        </div>
                        </div>
                    </div>
            
            
            
                    <div class="u-row-container" style="padding: 0px;background-color: transparent">
                        <div class="u-row" style="Margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: #ffffff;">
                        <div style="border-collapse: collapse;display: table;width: 100%;background-color: transparent;">
                            <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px;background-color: transparent;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:600px;"><tr style="background-color: #ffffff;"><![endif]-->
            
                            <!--[if (mso)|(IE)]><td align="center" width="600" style="width: 600px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;" valign="top"><![endif]-->
                            <div class="u-col u-col-100" style="max-width: 320px;min-width: 600px;display: table-cell;vertical-align: top;">
                            <div style="width: 100% !important;">
                                <!--[if (!mso)&(!IE)]><!-->
                                <div style="padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;">
                                <!--<![endif]-->
            
                                <table style="font-family:'Cabin',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                                    <tbody>
                                    <tr>
                                        <td style="overflow-wrap:break-word;word-break:break-word;padding:20px;font-family:'Cabin',sans-serif;" align="left">
            
                                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                            <tr>
                                            <td style="padding-right: 0px;padding-left: 0px;" align="center">
            
                                            <img align="center" border="0" src="https://res.cloudinary.com/jupit/image/upload/v1656160429/JUPIT-Logo-Wordmark_1_jo6ivd.png" alt="Image" title="Image" style="outline: none;text-decoration: none;-ms-interpolation-mode: bicubic;clear: both;display: inline-block !important;border: none;height: auto;float: none;width: 32%;max-width: 179.2px;"
                                            width="179.2" />
            
                                            </td>
                                            </tr>
                                        </table>
            
                                        </td>
                                    </tr>
                                    </tbody>
                                </table>
            
                                <!--[if (!mso)&(!IE)]><!-->
                                </div>
                                <!--<![endif]-->
                            </div>
                            </div>
                            <!--[if (mso)|(IE)]></td><![endif]-->
                            <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
                        </div>
                        </div>
                    </div>
            
            
            
                    <div class="u-row-container" style="padding: 0px;background-color: transparent">
                        <div class="u-row" style="Margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: #003399;">
                        <div style="border-collapse: collapse;display: table;width: 100%;background-color: transparent;">
                            <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px;background-color: transparent;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:600px;"><tr style="background-color: #003399;"><![endif]-->
            
                            <!--[if (mso)|(IE)]><td align="center" width="600" style="width: 600px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;" valign="top"><![endif]-->
                            <div class="u-col u-col-100" style="max-width: 320px;min-width: 600px;display: table-cell;vertical-align: top;">
                            <div style="width: 100% !important;">
                                <!--[if (!mso)&(!IE)]><!-->
                                <div style="padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;">
                                <!--<![endif]-->
            
                                <table style="font-family:'Cabin',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                                    <tbody>
                                    <tr>
                                        <td style="overflow-wrap:break-word;word-break:break-word;padding:40px 10px 10px;font-family:'Cabin',sans-serif;" align="left">
            
                                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                            <tr>
                                            <td style="padding-right: 0px;padding-left: 0px;" align="center">
            
                                                <img align="center" border="0" src="https://cdn.templates.unlayer.com/assets/1597218650916-xxxxc.png" alt="Image" title="Image" style="outline: none;text-decoration: none;-ms-interpolation-mode: bicubic;clear: both;display: inline-block !important;border: none;height: auto;float: none;width: 26%;max-width: 150.8px;"
                                                width="150.8" />
            
                                            </td>
                                            </tr>
                                        </table>
            
                                        </td>
                                    </tr>
                                    </tbody>
                                </table>
            
                                <table style="font-family:'Cabin',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                                    <tbody>
                                    <tr>
                                        <td style="overflow-wrap:break-word;word-break:break-word;padding:10px;font-family:'Cabin',sans-serif;" align="left">
            
                                        <div style="color: #e5eaf5; line-height: 140%; text-align: center; word-wrap: break-word;">
                                            <p style="font-size: 14px; line-height: 140%;"><strong>ACCOUNT VERIFICATION (KYC LEVEL 2)</strong></p>
                                        </div>
            
                                        </td>
                                    </tr>
                                    </tbody>
                                </table>
            
                                <table style="font-family:'Cabin',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                                    <tbody>
                                    <tr>
                                        <td style="overflow-wrap:break-word;word-break:break-word;padding:0px 10px 31px;font-family:'Cabin',sans-serif;" align="left">
            
                                        <div style="color: #e5eaf5; line-height: 140%; text-align: center; word-wrap: break-word;">
                                            <p style="font-size: 14px; line-height: 140%;"><span style="font-size: 28px; line-height: 39.2px;"><strong><span style="line-height: 39.2px; font-size: 28px;">ACCOUNT VERIFICATION</span></strong>
                                            </span>
                                            </p>
                                        </div>
            
                                        </td>
                                    </tr>
                                    </tbody>
                                </table>
            
                                <!--[if (!mso)&(!IE)]><!-->
                                </div>
                                <!--<![endif]-->
                            </div>
                            </div>
                            <!--[if (mso)|(IE)]></td><![endif]-->
                            <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
                        </div>
                        </div>
                    </div>
            
            
            
                    <div class="u-row-container" style="padding: 0px;background-color: transparent">
                        <div class="u-row" style="Margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: #ffffff;">
                        <div style="border-collapse: collapse;display: table;width: 100%;background-color: transparent;">
                            <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px;background-color: transparent;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:600px;"><tr style="background-color: #ffffff;"><![endif]-->
            
                            <!--[if (mso)|(IE)]><td align="center" width="600" style="width: 600px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;" valign="top"><![endif]-->
                            <div class="u-col u-col-100" style="max-width: 320px;min-width: 600px;display: table-cell;vertical-align: top;">
                            <div style="width: 100% !important;">
                                <!--[if (!mso)&(!IE)]><!-->
                                <div style="padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;">
                                <!--<![endif]-->
            
                                <table style="font-family:'Cabin',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                                    <tbody>
                                    <tr>
                                        <td style="overflow-wrap:break-word;word-break:break-word;padding:33px 55px;font-family:'Cabin',sans-serif;" align="left">
            
                                        <div style="line-height: 160%; text-align: center; word-wrap: break-word;">
                                            <p style="font-size: 14px; line-height: 160%;"><span style="font-size: 22px; line-height: 35.2px;">Dear User, </span></p>
                                            <p style="font-size: 14px; line-height: 160%;"><span style="font-size: 18px; line-height: 28.8px;">Trust this mail meets you well?</span></p>
                                            <p style="font-size: 14px; line-height: 160%;">&nbsp;</p>
                                            <p style="font-size: 14px; line-height: 160%;"><span style="font-size: 18px; line-height: 28.8px;">Kindly find below status for your account verification on our platform.</span></p>
                                        </div>
            
                                        </td>
                                    </tr>
                                    </tbody>
                                </table>

                                <table style="font-family:'Cabin',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                                    <tbody>
                                    <tr>
                                        <td style="overflow-wrap:break-word;word-break:break-word;padding:10px;font-family:'Cabin',sans-serif;" align="left">
            
                                        <div align="center">
                                            <strong>Email Address</strong> : ${address}<br/>
                                            <strong>Status</strong>: <span style="color: #003300">Success<span>
                                        </div>
            
                                        </td>
                                    </tr>
                                    </tbody>
                                </table>
            
                                <table style="font-family:'Cabin',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                                    <tbody>
                                    <tr>
                                        <td style="overflow-wrap:break-word;word-break:break-word;padding:33px 55px 60px;font-family:'Cabin',sans-serif;" align="left">
            
                                        <div style="line-height: 160%; text-align: center; word-wrap: break-word;">
                                            <p style="line-height: 160%; font-size: 14px;"><span style="font-size: 18px; line-height: 28.8px;">Thanks,</span></p>
                                            <p style="line-height: 160%; font-size: 14px;"><span style="font-size: 18px; line-height: 28.8px;">The Jupit Support Team</span></p>
                                        </div>
            
                                        </td>
                                    </tr>
                                    </tbody>
                                </table>
            
                                <!--[if (!mso)&(!IE)]><!-->
                                </div>
                                <!--<![endif]-->
                            </div>
                            </div>
                            <!--[if (mso)|(IE)]></td><![endif]-->
                            <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
                        </div>
                        </div>
                    </div>
            
            
            
                    <div class="u-row-container" style="padding: 0px;background-color: transparent">
                        <div class="u-row" style="Margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: #e5eaf5;">
                        <div style="border-collapse: collapse;display: table;width: 100%;background-color: transparent;">
                            <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px;background-color: transparent;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:600px;"><tr style="background-color: #e5eaf5;"><![endif]-->
            
                            <!--[if (mso)|(IE)]><td align="center" width="600" style="width: 600px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;" valign="top"><![endif]-->
                            <div class="u-col u-col-100" style="max-width: 320px;min-width: 600px;display: table-cell;vertical-align: top;">
                            <div style="width: 100% !important;">
                                <!--[if (!mso)&(!IE)]><!-->
                                <div style="padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;">
                                <!--<![endif]-->
            
                                <table style="font-family:'Cabin',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                                    <tbody>
                                    <tr>
                                        <td style="overflow-wrap:break-word;word-break:break-word;padding:41px 55px 18px;font-family:'Cabin',sans-serif;" align="left">
            
                                        <div style="color: #003399; line-height: 160%; text-align: center; word-wrap: break-word;">
                                            <p style="font-size: 14px; line-height: 160%;"><span style="font-size: 20px; line-height: 32px;"><strong>Get in touch</strong></span></p>
                                            <p style="font-size: 14px; line-height: 160%;">+2348088213177</p>
                                            <p style="font-size: 14px; line-height: 160%;"><span style="font-size: 16px; line-height: 25.6px; color: #000000;"><a rel="noopener" href="mailto:support@jupitapp.co" target="_blank">support@jupitapp.co</a></span></p>
                                            <p style="font-size: 14px; line-height: 160%;"><span style="font-size: 16px; line-height: 25.6px; color: #000000;">https://www.jupitapp.co</span></p>
                                        </div>
            
                                        </td>
                                    </tr>
                                    </tbody>
                                </table>
            
                                <table style="font-family:'Cabin',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                                    <tbody>
                                    <tr>
                                        <td style="overflow-wrap:break-word;word-break:break-word;padding:10px 10px 33px;font-family:'Cabin',sans-serif;" align="left">
            
                                        <div align="center">
                                            <div style="display: table; max-width:244px;">
                                            <!--[if (mso)|(IE)]><table width="244" cellpadding="0" cellspacing="0" border="0"><tr><td style="border-collapse:collapse;" align="center"><table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse; mso-table-lspace: 0pt;mso-table-rspace: 0pt; width:244px;"><tr><![endif]-->
            
            
                                            <!--[if (mso)|(IE)]><td width="32" style="width:32px; padding-right: 17px;" valign="top"><![endif]-->
                                            
                                            <!--[if (mso)|(IE)]></td><![endif]-->
            
                                            <!--[if (mso)|(IE)]><td width="32" style="width:32px; padding-right: 17px;" valign="top"><![endif]-->
                                           
                                            <!--[if (mso)|(IE)]></td><![endif]-->
            
                                            <!--[if (mso)|(IE)]><td width="32" style="width:32px; padding-right: 17px;" valign="top"><![endif]-->
                                            <table align="left" border="0" cellspacing="0" cellpadding="0" width="32" height="32" style="border-collapse: collapse;table-layout: fixed;border-spacing: 0;mso-table-lspace: 0pt;mso-table-rspace: 0pt;vertical-align: top;margin-right: 17px">
                                                <tbody>
                                                <tr style="vertical-align: top">
                                                    <td align="left" valign="middle" style="word-break: break-word;border-collapse: collapse !important;vertical-align: top">
                                                    <a href="https://instagram.com/jupit.app" title="Instagram" target="_blank">
                                                        <img src="https://cdn.tools.unlayer.com/social/icons/circle-black/instagram.png" alt="Instagram" title="Instagram" width="32" style="outline: none;text-decoration: none;-ms-interpolation-mode: bicubic;clear: both;display: block !important;border: none;height: auto;float: none;max-width: 32px !important">
                                                    </a>
                                                    </td>
                                                </tr>
                                                </tbody>
                                            </table>
                                            <!--[if (mso)|(IE)]></td><![endif]-->
            
                                            <!--[if (mso)|(IE)]><td width="32" style="width:32px; padding-right: 17px;" valign="top"><![endif]-->
                                            
                                            <!--[if (mso)|(IE)]></td><![endif]-->
            
                                            <!--[if (mso)|(IE)]><td width="32" style="width:32px; padding-right: 0px;" valign="top"><![endif]-->
                                            <table align="left" border="0" cellspacing="0" cellpadding="0" width="32" height="32" style="border-collapse: collapse;table-layout: fixed;border-spacing: 0;mso-table-lspace: 0pt;mso-table-rspace: 0pt;vertical-align: top;margin-right: 0px">
                                                <tbody>
                                                <tr style="vertical-align: top">
                                                    <td align="left" valign="middle" style="word-break: break-word;border-collapse: collapse !important;vertical-align: top">
                                                    <a href="mailto:support@jupitapp.co" title="Email" target="_blank">
                                                        <img src="https://cdn.tools.unlayer.com/social/icons/circle-black/email.png" alt="Email" title="Email" width="32" style="outline: none;text-decoration: none;-ms-interpolation-mode: bicubic;clear: both;display: block !important;border: none;height: auto;float: none;max-width: 32px !important">
                                                    </a>
                                                    </td>
                                                </tr>
                                                </tbody>
                                            </table>
                                            <!--[if (mso)|(IE)]></td><![endif]-->
            
            
                                            <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
                                            </div>
                                        </div>
            
                                        </td>
                                    </tr>
                                    </tbody>
                                </table>
            
                                <!--[if (!mso)&(!IE)]><!-->
                                </div>
                                <!--<![endif]-->
                            </div>
                            </div>
                            <!--[if (mso)|(IE)]></td><![endif]-->
                            <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
                        </div>
                        </div>
                    </div>
            
            
            
                    <div class="u-row-container" style="padding: 0px;background-color: transparent">
                        <div class="u-row" style="Margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: #003399;">
                        <div style="border-collapse: collapse;display: table;width: 100%;background-color: transparent;">
                            <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px;background-color: transparent;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:600px;"><tr style="background-color: #003399;"><![endif]-->
            
                            <!--[if (mso)|(IE)]><td align="center" width="600" style="width: 600px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;" valign="top"><![endif]-->
                            <div class="u-col u-col-100" style="max-width: 320px;min-width: 600px;display: table-cell;vertical-align: top;">
                            <div style="width: 100% !important;">
                                <!--[if (!mso)&(!IE)]><!-->
                                <div style="padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;">
                                <!--<![endif]-->
            
                                <table style="font-family:'Cabin',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                                    <tbody>
                                    <tr>
                                        <td style="overflow-wrap:break-word;word-break:break-word;padding:10px;font-family:'Cabin',sans-serif;" align="left">
            
                                        <div style="color: #fafafa; line-height: 180%; text-align: center; word-wrap: break-word;">
                                            <p style="font-size: 14px; line-height: 180%;"><span style="font-size: 16px; line-height: 28.8px;">Copyrights &copy; jupitapp</span></p>
                                        </div>
            
                                        </td>
                                    </tr>
                                    </tbody>
                                </table>
            
                                <!--[if (!mso)&(!IE)]><!-->
                                </div>
                                <!--<![endif]-->
                            </div>
                            </div>
                            <!--[if (mso)|(IE)]></td><![endif]-->
                            <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
                        </div>
                        </div>
                    </div>
            
            
                    <!--[if (mso)|(IE)]></td></tr></table><![endif]-->
                    </td>
                </tr>
                </tbody>
            </table>
            <!--[if mso]></div><![endif]-->
            <!--[if IE]></div><![endif]-->
            </body>
            
            </html>
            `
          };
          transporter.sendMail(mailData, function (err, info) {
            if(err){
               
                // res.send({"message":"An Error Occurred","callback":err})
                console.log('Mailer Failed')
            }
            
            else{
            
                console.log('Mailer Success')
                
            }
              
         });
    
    }
    else{
            const mailData = {
                from: 'Jupit<hello@jupit.app>',  // sender address
                to: address,   // list of receivers
                subject: 'Bank Account  Verification',
                text: 'That was easy!',
                html: `
                        
                        <div style="width:100%;height:100vh;background-color:#f5f5f5; display:flex;justify-content:center;align-items:center">
                            <div style="width:50%; height:60%;background-color:#fff;border-bottom-left-radius:15px;border-bottom-right-radius:15px;">
                                <hr style="width:100%;height:5px;background-color:#1c1c93"/>
                                <div style="width:100%;text-align:center">
                                    <img src="https://jupit-asset.s3.us-east-2.amazonaws.com/manual/logo.png" />
                                </div>   
                                <div style="width:100%;text-align:center;margin-top:20px">
                                    <h2 style="font-family:candara">Account Verification  </h2>
                                <div>   
                                <div style="width:100%;padding-left:20px;text-align:center;padding-top:10px">
                                    <hr style="background-color:#f5f5f5;width:95%"/>
                                <div>
                                <div style="width:100%; text-align:left;">
                                    <div style="font-family:candara;padding:10px">
                                        <p style="padding-bottom: 20px;">Dear <strong>Customer</strong>,</p>

                                        <p style="padding-bottom: 20px;">Trust this mail meet you well?</p>

                                        <p style="padding-bottom: 20px;">Kindly find below response for your account verification on our app platform.</p>

                                        <p style="padding-bottom: 20px;">
                                                - <strong>Email Address</strong> : ${address}<br/>
                                                - <strong>Status</strong>: <span style="color: #FF0000">Failed<span>

                                        </p>

                                        <p style="padding-bottom: 20px;">

                                        Thanks For Choosing Us

                                        </p>

                                    </div>
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
                
                    // res.send({"message":"An Error Occurred","callback":err})
                    console.log('Mailer Failed')
                }
                
                else{
                
                    console.log('Mailer Success')
                    
                }
              
             });
    
    }
    
   
}

router.post('/users/resetpassword',(req,res)=>{

   const random = Math.floor(1000 + Math.random() * 9000);

    Usermodel.findOne({email:req.body.email},(err,docs)=>{
        if(err){
            res.status(400).send({"message":err,"status":false})
        }
        else if(docs){

            const mailData = {
                from: 'Jupit <hello@jupitapp.co>',  // sender address
                to: req.body.email,   // list of receivers
                subject: 'Jupit <jupitapp.co>',
                text: 'That was easy!',
                html: `
                        <!DOCTYPE HTML PUBLIC "-//W3C//DTD XHTML 1.0 Transitional //EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
                        <html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
                        
                        <head>
                        <!--[if gte mso 9]>
                        <xml>
                        <o:OfficeDocumentSettings>
                            <o:AllowPNG/>
                            <o:PixelsPerInch>96</o:PixelsPerInch>
                        </o:OfficeDocumentSettings>
                        </xml>
                        <![endif]-->
                        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <meta name="x-apple-disable-message-reformatting">
                        <!--[if !mso]><!-->
                        <meta http-equiv="X-UA-Compatible" content="IE=edge">
                        <!--<![endif]-->
                        <title></title>
                        
                        <style type="text/css">
                            @media only screen and (min-width: 620px) {
                            .u-row {
                                width: 600px !important;
                            }
                            .u-row .u-col {
                                vertical-align: top;
                            }
                            .u-row .u-col-100 {
                                width: 600px !important;
                            }
                            }
                            
                            @media (max-width: 620px) {
                            .u-row-container {
                                max-width: 100% !important;
                                padding-left: 0px !important;
                                padding-right: 0px !important;
                            }
                            .u-row .u-col {
                                min-width: 320px !important;
                                max-width: 100% !important;
                                display: block !important;
                            }
                            .u-row {
                                width: calc(100% - 40px) !important;
                            }
                            .u-col {
                                width: 100% !important;
                            }
                            .u-col>div {
                                margin: 0 auto;
                            }
                            }
                            
                            body {
                            margin: 0;
                            padding: 0;
                            }
                            
                            table,
                            tr,
                            td {
                            vertical-align: top;
                            border-collapse: collapse;
                            }
                            
                            p {
                            margin: 0;
                            }
                            
                            .ie-container table,
                            .mso-container table {
                            table-layout: fixed;
                            }
                            
                            * {
                            line-height: inherit;
                            }
                            
                            a[x-apple-data-detectors='true'] {
                            color: inherit !important;
                            text-decoration: none !important;
                            }
                            
                            table,
                            td {
                            color: #000000;
                            }
                            
                            a {
                            color: #0000ee;
                            text-decoration: underline;
                            }
                        </style>
                        
                        
                        
                        <!--[if !mso]><!-->
                        <link href="https://fonts.googleapis.com/css?family=Cabin:400,700" rel="stylesheet" type="text/css">
                        <!--<![endif]-->
                        
                        </head>
                        
                        <body class="clean-body u_body" style="margin: 0;padding: 0;-webkit-text-size-adjust: 100%;background-color: #f9f9f9;color: #000000">
                        <!--[if IE]><div class="ie-container"><![endif]-->
                        <!--[if mso]><div class="mso-container"><![endif]-->
                        <table style="border-collapse: collapse;table-layout: fixed;border-spacing: 0;mso-table-lspace: 0pt;mso-table-rspace: 0pt;vertical-align: top;min-width: 320px;Margin: 0 auto;background-color: #f9f9f9;width:100%" cellpadding="0" cellspacing="0">
                            <tbody>
                            <tr style="vertical-align: top">
                                <td style="word-break: break-word;border-collapse: collapse !important;vertical-align: top">
                                <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" style="background-color: #f9f9f9;"><![endif]-->
                        
                        
                                <div class="u-row-container" style="padding: 0px;background-color: transparent">
                                    <div class="u-row" style="Margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: transparent;">
                                    <div style="border-collapse: collapse;display: table;width: 100%;background-color: transparent;">
                                        <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px;background-color: transparent;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:600px;"><tr style="background-color: transparent;"><![endif]-->
                        
                                        <!--[if (mso)|(IE)]><td align="center" width="600" style="width: 600px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;" valign="top"><![endif]-->
                                        <div class="u-col u-col-100" style="max-width: 320px;min-width: 600px;display: table-cell;vertical-align: top;">
                                        <div style="width: 100% !important;">
                                            <!--[if (!mso)&(!IE)]><!-->
                                            <div style="padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;">
                                            <!--<![endif]-->
                        
                                            <table style="font-family:'Cabin',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                                                <tbody>
                                                <tr>
                                                    <td style="overflow-wrap:break-word;word-break:break-word;padding:10px;font-family:'Cabin',sans-serif;" align="left">
                        
                                                    <div style="color: #afb0c7; line-height: 170%; text-align: center; word-wrap: break-word;">
                                                        <p style="font-size: 14px; line-height: 170%;"><span style="font-size: 14px; line-height: 23.8px;"></span></p>
                                                    </div>
                        
                                                    </td>
                                                </tr>
                                                </tbody>
                                            </table>
                        
                                            <!--[if (!mso)&(!IE)]><!-->
                                            </div>
                                            <!--<![endif]-->
                                        </div>
                                        </div>
                                        <!--[if (mso)|(IE)]></td><![endif]-->
                                        <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
                                    </div>
                                    </div>
                                </div>
                        
                        
                        
                                <div class="u-row-container" style="padding: 0px;background-color: transparent">
                                    <div class="u-row" style="Margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: #ffffff;">
                                    <div style="border-collapse: collapse;display: table;width: 100%;background-color: transparent;">
                                        <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px;background-color: transparent;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:600px;"><tr style="background-color: #ffffff;"><![endif]-->
                        
                                        <!--[if (mso)|(IE)]><td align="center" width="600" style="width: 600px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;" valign="top"><![endif]-->
                                        <div class="u-col u-col-100" style="max-width: 320px;min-width: 600px;display: table-cell;vertical-align: top;">
                                        <div style="width: 100% !important;">
                                            <!--[if (!mso)&(!IE)]><!-->
                                            <div style="padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;">
                                            <!--<![endif]-->
                        
                                            <table style="font-family:'Cabin',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                                                <tbody>
                                                <tr>
                                                    <td style="overflow-wrap:break-word;word-break:break-word;padding:20px;font-family:'Cabin',sans-serif;" align="left">
                        
                                                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                                        <tr>
                                                        <td style="padding-right: 0px;padding-left: 0px;" align="center">
                        
                                                        <img align="center" border="0" src="https://res.cloudinary.com/jupit/image/upload/v1656160429/JUPIT-Logo-Wordmark_1_jo6ivd.png" alt="Image" title="Image" style="outline: none;text-decoration: none;-ms-interpolation-mode: bicubic;clear: both;display: inline-block !important;border: none;height: auto;float: none;width: 32%;max-width: 179.2px;"
                                                        width="179.2" />
                        
                                                        </td>
                                                        </tr>
                                                    </table>
                        
                                                    </td>
                                                </tr>
                                                </tbody>
                                            </table>
                        
                                            <!--[if (!mso)&(!IE)]><!-->
                                            </div>
                                            <!--<![endif]-->
                                        </div>
                                        </div>
                                        <!--[if (mso)|(IE)]></td><![endif]-->
                                        <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
                                    </div>
                                    </div>
                                </div>
                        
                        
                        
                                <div class="u-row-container" style="padding: 0px;background-color: transparent">
                                    <div class="u-row" style="Margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: #003399;">
                                    <div style="border-collapse: collapse;display: table;width: 100%;background-color: transparent;">
                                        <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px;background-color: transparent;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:600px;"><tr style="background-color: #003399;"><![endif]-->
                        
                                        <!--[if (mso)|(IE)]><td align="center" width="600" style="width: 600px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;" valign="top"><![endif]-->
                                        <div class="u-col u-col-100" style="max-width: 320px;min-width: 600px;display: table-cell;vertical-align: top;">
                                        <div style="width: 100% !important;">
                                            <!--[if (!mso)&(!IE)]><!-->
                                            <div style="padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;">
                                            <!--<![endif]-->
                        
                                            <table style="font-family:'Cabin',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                                                <tbody>
                                                <tr>
                                                    <td style="overflow-wrap:break-word;word-break:break-word;padding:40px 10px 10px;font-family:'Cabin',sans-serif;" align="left">
                        
                                                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                                        <tr>
                                                        <td style="padding-right: 0px;padding-left: 0px;" align="center">
                        
                                                            <img align="center" border="0" src="https://cdn.templates.unlayer.com/assets/1597218650916-xxxxc.png" alt="Image" title="Image" style="outline: none;text-decoration: none;-ms-interpolation-mode: bicubic;clear: both;display: inline-block !important;border: none;height: auto;float: none;width: 26%;max-width: 150.8px;"
                                                            width="150.8" />
                        
                                                        </td>
                                                        </tr>
                                                    </table>
                        
                                                    </td>
                                                </tr>
                                                </tbody>
                                            </table>
                        
                                            <table style="font-family:'Cabin',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                                                <tbody>
                                                <tr>
                                                    <td style="overflow-wrap:break-word;word-break:break-word;padding:10px;font-family:'Cabin',sans-serif;" align="left">
                        
                                                    <div style="color: #e5eaf5; line-height: 140%; text-align: center; word-wrap: break-word;">
                                                        <p style="font-size: 14px; line-height: 140%;"><strong>PASSWORD RESET</strong></p>
                                                    </div>
                        
                                                    </td>
                                                </tr>
                                                </tbody>
                                            </table>
                        
                                            <table style="font-family:'Cabin',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                                                <tbody>
                                                <tr>
                                                    <td style="overflow-wrap:break-word;word-break:break-word;padding:0px 10px 31px;font-family:'Cabin',sans-serif;" align="left">
                        
                                                    <div style="color: #e5eaf5; line-height: 140%; text-align: center; word-wrap: break-word;">
                                                        <p style="font-size: 14px; line-height: 140%;"><span style="font-size: 28px; line-height: 39.2px;"><strong><span style="line-height: 39.2px; font-size: 28px;">Password Reset</span></strong>
                                                        </span>
                                                        </p>
                                                    </div>
                        
                                                    </td>
                                                </tr>
                                                </tbody>
                                            </table>
                        
                                            <!--[if (!mso)&(!IE)]><!-->
                                            </div>
                                            <!--<![endif]-->
                                        </div>
                                        </div>
                                        <!--[if (mso)|(IE)]></td><![endif]-->
                                        <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
                                    </div>
                                    </div>
                                </div>
                        
                        
                        
                                <div class="u-row-container" style="padding: 0px;background-color: transparent">
                                    <div class="u-row" style="Margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: #ffffff;">
                                    <div style="border-collapse: collapse;display: table;width: 100%;background-color: transparent;">
                                        <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px;background-color: transparent;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:600px;"><tr style="background-color: #ffffff;"><![endif]-->
                        
                                        <!--[if (mso)|(IE)]><td align="center" width="600" style="width: 600px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;" valign="top"><![endif]-->
                                        <div class="u-col u-col-100" style="max-width: 320px;min-width: 600px;display: table-cell;vertical-align: top;">
                                        <div style="width: 100% !important;">
                                            <!--[if (!mso)&(!IE)]><!-->
                                            <div style="padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;">
                                            <!--<![endif]-->
                        
                                            <table style="font-family:'Cabin',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                                                <tbody>
                                                <tr>
                                                    <td style="overflow-wrap:break-word;word-break:break-word;padding:33px 55px;font-family:'Cabin',sans-serif;" align="left">
                        
                                                    <div style="line-height: 160%; text-align: center; word-wrap: break-word;">
                                                        <p style="font-size: 14px; line-height: 160%;"><span style="font-size: 22px; line-height: 35.2px;">Dear User, </span></p>
                                                        <p style="font-size: 14px; line-height: 160%;"><span style="font-size: 18px; line-height: 28.8px;">Trust this mail meets you well?</span></p>
                                                        <p style="font-size: 14px; line-height: 160%;">&nbsp;</p>
                                                        <p style="font-size: 14px; line-height: 160%;"><span style="font-size: 18px; line-height: 28.8px;">Kindly click on the button below to reset your password.</span></p>
                                                    </div>
                        
                                                    </td>
                                                </tr>
                                                </tbody>
                                            </table>

                                            <table style="font-family:'Cabin',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                                                <tbody>
                                                <tr>
                                                    <td style="overflow-wrap:break-word;word-break:break-word;padding:10px;font-family:'Cabin',sans-serif;" align="left">
                        
                                                    <div align="center">
                                                        <!--[if mso]><table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-spacing: 0; border-collapse: collapse; mso-table-lspace:0pt; mso-table-rspace:0pt;font-family:'Cabin',sans-serif;"><tr><td style="font-family:'Cabin',sans-serif;" align="center"><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="https://myjupit.herokuapp.com/users/jupit/emailverification/e9p5ikica6f19gdsmqta/qvrse/" style="height:46px; v-text-anchor:middle; width:235px;" arcsize="8.5%" stroke="f" fillcolor="#ff6600"><w:anchorlock/><center style="color:#FFFFFF;font-family:'Cabin',sans-serif;"><![endif]-->
                                                        <a href="https://myjupit.herokuapp.com/users/jupit/resetpassword/${docs._id}/resetpword/${random}" target="_blank" style="box-sizing: border-box;display: inline-block;font-family:'Cabin',sans-serif;text-decoration: none;-webkit-text-size-adjust: none;text-align: center;color: #FFFFFF; background-color: #ff6600; border-radius: 4px;-webkit-border-radius: 4px; -moz-border-radius: 4px; width:auto; max-width:100%; overflow-wrap: break-word; word-break: break-word; word-wrap:break-word; mso-border-alt: none;">
                                                        <span style="display:block;padding:14px 44px 13px;line-height:120%;"><span style="font-size: 16px; line-height: 19.2px;"><strong><span style="line-height: 19.2px; font-size: 16px;">RESET PASSWORD</span></strong>
                                                        </span>
                                                        </span>
                                                        </a>
                                                        <!--[if mso]></center></v:roundrect></td></tr></table><![endif]-->
                                                    </div>
                        
                                                    </td>
                                                </tr>
                                                </tbody>
                                            </table>
                        
                                            <table style="font-family:'Cabin',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                                                <tbody>
                                                <tr>
                                                    <td style="overflow-wrap:break-word;word-break:break-word;padding:33px 55px 60px;font-family:'Cabin',sans-serif;" align="left">
                        
                                                    <div style="line-height: 160%; text-align: center; word-wrap: break-word;">
                                                        <p style="line-height: 160%; font-size: 14px;"><span style="font-size: 18px; line-height: 28.8px;">Thanks,</span></p>
                                                        <p style="line-height: 160%; font-size: 14px;"><span style="font-size: 18px; line-height: 28.8px;">The Jupit Support Team</span></p>
                                                    </div>
                        
                                                    </td>
                                                </tr>
                                                </tbody>
                                            </table>
                        
                                            <!--[if (!mso)&(!IE)]><!-->
                                            </div>
                                            <!--<![endif]-->
                                        </div>
                                        </div>
                                        <!--[if (mso)|(IE)]></td><![endif]-->
                                        <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
                                    </div>
                                    </div>
                                </div>
                        
                        
                        
                                <div class="u-row-container" style="padding: 0px;background-color: transparent">
                                    <div class="u-row" style="Margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: #e5eaf5;">
                                    <div style="border-collapse: collapse;display: table;width: 100%;background-color: transparent;">
                                        <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px;background-color: transparent;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:600px;"><tr style="background-color: #e5eaf5;"><![endif]-->
                        
                                        <!--[if (mso)|(IE)]><td align="center" width="600" style="width: 600px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;" valign="top"><![endif]-->
                                        <div class="u-col u-col-100" style="max-width: 320px;min-width: 600px;display: table-cell;vertical-align: top;">
                                        <div style="width: 100% !important;">
                                            <!--[if (!mso)&(!IE)]><!-->
                                            <div style="padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;">
                                            <!--<![endif]-->
                        
                                            <table style="font-family:'Cabin',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                                                <tbody>
                                                <tr>
                                                    <td style="overflow-wrap:break-word;word-break:break-word;padding:41px 55px 18px;font-family:'Cabin',sans-serif;" align="left">
                        
                                                    <div style="color: #003399; line-height: 160%; text-align: center; word-wrap: break-word;">
                                                        <p style="font-size: 14px; line-height: 160%;"><span style="font-size: 20px; line-height: 32px;"><strong>Get in touch</strong></span></p>
                                                        <p style="font-size: 14px; line-height: 160%;">+2348088213177</p>
                                                        <p style="font-size: 14px; line-height: 160%;"><span style="font-size: 16px; line-height: 25.6px; color: #000000;"><a rel="noopener" href="mailto:support@jupitapp.co" target="_blank">support@jupitapp.co</a></span></p>
                                                        <p style="font-size: 14px; line-height: 160%;"><span style="font-size: 16px; line-height: 25.6px; color: #000000;">https://www.jupitapp.co</span></p>
                                                    </div>
                        
                                                    </td>
                                                </tr>
                                                </tbody>
                                            </table>
                        
                                            <table style="font-family:'Cabin',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                                                <tbody>
                                                <tr>
                                                    <td style="overflow-wrap:break-word;word-break:break-word;padding:10px 10px 33px;font-family:'Cabin',sans-serif;" align="left">
                        
                                                    <div align="center">
                                                        <div style="display: table; max-width:244px;">
                                                        <!--[if (mso)|(IE)]><table width="244" cellpadding="0" cellspacing="0" border="0"><tr><td style="border-collapse:collapse;" align="center"><table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse; mso-table-lspace: 0pt;mso-table-rspace: 0pt; width:244px;"><tr><![endif]-->
                        
                        
                                                        <!--[if (mso)|(IE)]><td width="32" style="width:32px; padding-right: 17px;" valign="top"><![endif]-->
                                                        
                                                        <!--[if (mso)|(IE)]></td><![endif]-->
                        
                                                        <!--[if (mso)|(IE)]><td width="32" style="width:32px; padding-right: 17px;" valign="top"><![endif]-->
                                                       
                                                        <!--[if (mso)|(IE)]></td><![endif]-->
                        
                                                        <!--[if (mso)|(IE)]><td width="32" style="width:32px; padding-right: 17px;" valign="top"><![endif]-->
                                                        <table align="left" border="0" cellspacing="0" cellpadding="0" width="32" height="32" style="border-collapse: collapse;table-layout: fixed;border-spacing: 0;mso-table-lspace: 0pt;mso-table-rspace: 0pt;vertical-align: top;margin-right: 17px">
                                                            <tbody>
                                                            <tr style="vertical-align: top">
                                                                <td align="left" valign="middle" style="word-break: break-word;border-collapse: collapse !important;vertical-align: top">
                                                                <a href="https://instagram.com/jupit.app" title="Instagram" target="_blank">
                                                                    <img src="https://cdn.tools.unlayer.com/social/icons/circle-black/instagram.png" alt="Instagram" title="Instagram" width="32" style="outline: none;text-decoration: none;-ms-interpolation-mode: bicubic;clear: both;display: block !important;border: none;height: auto;float: none;max-width: 32px !important">
                                                                </a>
                                                                </td>
                                                            </tr>
                                                            </tbody>
                                                        </table>
                                                        <!--[if (mso)|(IE)]></td><![endif]-->
                        
                                                        <!--[if (mso)|(IE)]><td width="32" style="width:32px; padding-right: 17px;" valign="top"><![endif]-->
                                                        
                                                        <!--[if (mso)|(IE)]></td><![endif]-->
                        
                                                        <!--[if (mso)|(IE)]><td width="32" style="width:32px; padding-right: 0px;" valign="top"><![endif]-->
                                                        <table align="left" border="0" cellspacing="0" cellpadding="0" width="32" height="32" style="border-collapse: collapse;table-layout: fixed;border-spacing: 0;mso-table-lspace: 0pt;mso-table-rspace: 0pt;vertical-align: top;margin-right: 0px">
                                                            <tbody>
                                                            <tr style="vertical-align: top">
                                                                <td align="left" valign="middle" style="word-break: break-word;border-collapse: collapse !important;vertical-align: top">
                                                                <a href="mailto:support@jupitapp.co" title="Email" target="_blank">
                                                                    <img src="https://cdn.tools.unlayer.com/social/icons/circle-black/email.png" alt="Email" title="Email" width="32" style="outline: none;text-decoration: none;-ms-interpolation-mode: bicubic;clear: both;display: block !important;border: none;height: auto;float: none;max-width: 32px !important">
                                                                </a>
                                                                </td>
                                                            </tr>
                                                            </tbody>
                                                        </table>
                                                        <!--[if (mso)|(IE)]></td><![endif]-->
                        
                        
                                                        <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
                                                        </div>
                                                    </div>
                        
                                                    </td>
                                                </tr>
                                                </tbody>
                                            </table>
                        
                                            <!--[if (!mso)&(!IE)]><!-->
                                            </div>
                                            <!--<![endif]-->
                                        </div>
                                        </div>
                                        <!--[if (mso)|(IE)]></td><![endif]-->
                                        <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
                                    </div>
                                    </div>
                                </div>
                        
                        
                        
                                <div class="u-row-container" style="padding: 0px;background-color: transparent">
                                    <div class="u-row" style="Margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: #003399;">
                                    <div style="border-collapse: collapse;display: table;width: 100%;background-color: transparent;">
                                        <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px;background-color: transparent;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:600px;"><tr style="background-color: #003399;"><![endif]-->
                        
                                        <!--[if (mso)|(IE)]><td align="center" width="600" style="width: 600px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;" valign="top"><![endif]-->
                                        <div class="u-col u-col-100" style="max-width: 320px;min-width: 600px;display: table-cell;vertical-align: top;">
                                        <div style="width: 100% !important;">
                                            <!--[if (!mso)&(!IE)]><!-->
                                            <div style="padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;">
                                            <!--<![endif]-->
                        
                                            <table style="font-family:'Cabin',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                                                <tbody>
                                                <tr>
                                                    <td style="overflow-wrap:break-word;word-break:break-word;padding:10px;font-family:'Cabin',sans-serif;" align="left">
                        
                                                    <div style="color: #fafafa; line-height: 180%; text-align: center; word-wrap: break-word;">
                                                        <p style="font-size: 14px; line-height: 180%;"><span style="font-size: 16px; line-height: 28.8px;">Copyrights &copy; jupitapp</span></p>
                                                    </div>
                        
                                                    </td>
                                                </tr>
                                                </tbody>
                                            </table>
                        
                                            <!--[if (!mso)&(!IE)]><!-->
                                            </div>
                                            <!--<![endif]-->
                                        </div>
                                        </div>
                                        <!--[if (mso)|(IE)]></td><![endif]-->
                                        <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
                                    </div>
                                    </div>
                                </div>
                        
                        
                                <!--[if (mso)|(IE)]></td></tr></table><![endif]-->
                                </td>
                            </tr>
                            </tbody>
                        </table>
                        <!--[if mso]></div><![endif]-->
                        <!--[if IE]></div><![endif]-->
                        </body>
                        
                        </html>



                    `
              };

            transporter.sendMail(mailData, function (err, info) {
                if(err){
                    res.status(400).send({message:"Mailer Error",status:false})
                    // res.send({"message":"An Error Occurred","callback":err})
                    console.log('Mailer Failed')
                }
                
                else{
                
                        res.send({"message":"Password link has been sent to your mailbox.","status":true})
                        console.log('Mailer Success')
                    
                }
              
             });
    
        }
        else if(!docs){
            res.status(400).send({message:"Email address is not registered",status:false})
        }
    })
})

function verifyToken(res,req,next){
    // console.log(req.headers['authorization'])
    next();
    // const bearerHeader = req.headers['authorization'];
    // res.send({
    //     "message":req.headers
    // })
    // if(typeof bearerHeader !== "undefined"){
    //     const bearerToken = bearerHeader.split(' ')[1];
    //     req.token = bearerToken;
    //     next();
    // }
    // else{
    //     res.sendStatus(403);
    // }
}

async function comparePassword(hashedPassword,requestPassword){
    
    const validPassword = await bcrypt.compare(requestPassword, hashedPassword);
      if (validPassword) {
        //   console.log('Password is Correct');
        return true  
       
      } else {
            
        // console.log('Password is Incorrect');
        return false;
      }

      

}

// const parseJwt = (token) => {
//     try {
//       return JSON.parse(atob(token.split(".")[1]));
//     } catch (e) {
//       return null;
//     }
//   };

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
         res.sendStatus(403);
         return false;
    }
    else{
        let decodedJwt = await parseJwt(bearerHeader);
      
        if(!decodedJwt){
            res.status(403).send({"message":"Forbidden Request."});
            return false;
           
        }
        if(decodedJwt){
            const expiration = new Date(decodedJwt.exp * 1000);
            const now = new Date();
            const Oneminute = 1000 * 60 * 1;
            if( expiration.getTime() - now.getTime() < Oneminute ){
                 res.status(403).send('Token Expired');
                 return false;
                
            }
            else{
                Usermodel.findOne({email:decodedJwt.user.email},(err,docs)=>{
                    if(err){
                     res.status(403).send({"message":"Internal Server Error"});
                     return false;
                         
                    } 
                    else if(docs){
                         if(docs.password != decodedJwt.user.password ){
                             res.status(403).send("Password Expired");
                             return false;
                             
                         }
                         if(docs.Status != "Active"){
                             res.status(403).send("Account Blocked");
                             return false;
                            
                         }
                    }
                    else if(!docs){
                     res.status(403).send({"message":"Internal Server Error"});
                     return false;
                        
                    }
                 })

            }
        }
        
        

        req.token = bearerHeader;
        next();
        

    
    }
}


export default router;