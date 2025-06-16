const mysql=require("mysql2");


const connection=mysql.createConnection({
    host:"localhost",
    user:"root",
    password:"root123",
    database:"kanban_db",
    port:3306

});
connection.connect((err)=>{
    if(err)console.log('database connection error',err);
    else console.log("DataBase Connection Successfull....");
    
});

module.exports=connection;