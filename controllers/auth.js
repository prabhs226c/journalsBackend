import getMysqlSession from "../Database/mysqlSession.js";
import {genSalt,compare as comparePasswords,hash} from "bcrypt";
import jwt from "jsonwebtoken";

async function registerUser(req,res)
{
    const NAME = req.body.name;
    const EMAIL = req.body.email;
    const PASSWORD = req.body.password;

    const EMAIL_REGEX = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/
    const FORM_ERRORS = {};

    /** verifying form for errors */
    if(!NAME) FORM_ERRORS.name = "Name is a required field";
    if(!EMAIL) FORM_ERRORS.email = "Email is a required field";
    if(EMAIL && !EMAIL_REGEX.test(EMAIL)) FORM_ERRORS.email = "Invalid email id";
    if(!PASSWORD) FORM_ERRORS.password = "Password is a required field";
    if(PASSWORD && PASSWORD.length < 8) FORM_ERRORS.password = "Minimum length for password is 8";

    if(Object.keys(FORM_ERRORS).length > 0) return res.status(200).json({hasErrors:true,errors:FORM_ERRORS});
    else{
        /** checking if user already exists */
        const USER = await getUser(EMAIL);
        if(USER && USER.length >0) return res.json({hasErrors:true,errors:{email:"This email is already registered"}});
        else {
            /** saving the user in database if it doesn't exist */
            const USER_SAVED = await saveUser(NAME,EMAIL,PASSWORD);
            if(USER_SAVED) return res.status(200).json({hasErrors:false,msg:"You have been registered"});
            else return res.status(200).json({hasErrors:true,msg:"Your account could not be created"});
        }
    }
}

async function loginUser(req,res){
    const EMAIL = req.body.email;
    const PASSWORD = req.body.password;
    const FORM_ERRORS = {};

    /** verify login form */
    if(!EMAIL) FORM_ERRORS.email = "Email is a required field";
    if(!PASSWORD) FORM_ERRORS.password = "Password is a required field";

    if(Object.keys(FORM_ERRORS).length > 0) return res.status(200).json({hasErrors:true,errors:FORM_ERRORS});
    else{
        const USER = await getUser(EMAIL);
        if(!USER || USER.length === 0) return res.status(401).json({hasErrors:true,errors:{user:"Invalid User/Password"}}); //user not found
        else{
            const VERIFIED = await comparePasswords(PASSWORD,USER[3]);
            if(!VERIFIED) return res.status(401).json({hasErrors:true,errors:{user:"Invalid User/Password"}}); //password not matched
            else{ //generate token and send to user
                const TOKEN_PAYLOAD = {id:USER[0],name:USER[1],darkTheme:USER[4]};
                const ACCESS_TOKEN = jwt.sign(TOKEN_PAYLOAD,process.env.ACCESS_TOKEN_SECRET);

                return res.status(200).json({hasErrors:false,access_token:ACCESS_TOKEN});
            }
        }
    }
}

async function getUser(email)
{
    const SESSION = await getMysqlSession()
    const TABLE = SESSION.getSchema(process.env.DB_NAME).getTable(process.env.USERS_TABLE);
    const ROWS = await TABLE.select()
        .where('email = :v')
        .bind('v',email)
        .execute();
    await SESSION.close();
    return ROWS.fetchOne();
}

async function saveUser(name,email,password)
{
    const SALT = await genSalt(10);
    const PASSWORD_HASH = await hash(password,SALT);

    const SESSION = await getMysqlSession();
    const TABLE   = await SESSION.getSchema(process.env.DB_NAME).getTable(process.env.USERS_TABLE);
    const ROW_INSERTED = await TABLE.insert('name','email','password')
        .values(name,email,PASSWORD_HASH)
        .execute();
    await SESSION.close();
    return ROW_INSERTED.getAffectedItemsCount() > 0;
}

export {registerUser,loginUser}