import mysql from "@mysql/xdevapi";

export default async function getMysqlSession()
{
    return await mysql.getSession({
        host:process.env.DB_HOST,
        password: process.env.DB_PWD,
        user:process.env.DB_USER,
        port: +process.env.DB_PORT
    });
}