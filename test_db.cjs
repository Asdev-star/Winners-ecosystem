require('dotenv/config'); const {Client}=require('pg'); const c=new Client({connectionString:process.env.DATABASE_URL}); c.connect().then(()= connected');c.end();}).catch(e= 
