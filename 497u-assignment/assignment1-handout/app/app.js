//require('dotenv').config();
const express = require('express');
const config = require('./config/config');
const compression = require ('compression');
const helmet = require('helmet');
const https= require("https");
const fs = require('fs')
const ddbGet = require("./dynamo/ddb_getitem")
const bcrypt = require("bcrypt");




const bodyParser = require('body-parser');
//const mongoose = require('mongoose');
const session = require('express-session');
// passport stuff: NEW
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;


//redis setup
let RedisStore = require("connect-redis")(session)



const ioRedis = require("ioredis")

const ioredis = new ioRedis({
	port : 6379,
	host : "redis-assign1.gkjgwl.ng.0001.usw2.cache.amazonaws.com"
})






const User = require("./models/user");

const userRouter = require('./routes/user.routes');
const postRouter = require('./routes/post.routes');


const app = express();

app.set('view engine', 'ejs');
app.use(helmet());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(compression());
app.use(express.static('public'));

  
app.set('trust proxy', 1); // trust first proxy

const port = config.get('port') || 3000;
const blogDB = config.get('db.name')

const blog_db_url =
	config.get('db.db_url') +
	config.get('db.password') +
	config.get('db.host') +
	blogDB +
	'?retryWrites=true&w=majority';



//setup this app to use Redis for it's session storage
app.use(
	session({
		store : new RedisStore({client : ioredis}),
		saveUninitialized : false,
		secret : config.get("secret"),
		cookie: {
			secure : false,
			httpOnly : false,
			maxAge : 1000 * 60 * 60
		},
		resave : false
	})
)

app.use(passport.initialize());
app.use(passport.session());

// Passport database connection: NEW
// connecting to the db
/*const AWSdb = require('dynamodb').AWSdb({
	accessKeyId: process.env.DYNAMODB_ACCESSKEYID,
  	secretAccessKey: process.env.DYNAMODB_SECRETACCESSKEY,
  	endpoint: process.env.DYNAMODB_ENDPOINT
});*/

// maybe we need this? removing for now
//passport.use(User.createStrategy());

passport.serializeUser((user, done) =>{
	done(null, user.id);
});

passport.deserializeUser((login, done) =>  {
	/*AWSdb.getItem('user', login, null, {}, (err, item) => {
		done(err, item);
	});*/

	//may need an await?
	const item = ddbGet.getUser(login);
	done(err, item);

	//User.findById(id, function(err, user) {
	//	done(err, user);
	//});
});

passport.use(new LocalStrategy((user, pass, done) => {
	/*AWSdb.getItem('user', user, null, {}, (err, item) => {
		const message = 'Login Failed';
		if (err){
			return done(err);
		}
		if (item && User.hash(pass, item.salt) === item.hash) {
			return done(null, item);
		}
    	return done(null, false, { message });
	});*/

	const dbUser = ddbGet.getUser(user);
	bcrypt.compare(password, dbUser.password, function(err, res) {
		if (err) return done(err);
		if (res === false){
			return done(null, false);
		} else {
			return done(null, dbUser);
		}
	})
}));
// Passport database connection: END OF NEW passport stuff

app.use(function(req, res, next) {
	res.locals.isAuthenticated=req.isAuthenticated();
	next();
});

app.use('/user', userRouter);

app.use('/post', postRouter);

app.all('*', function(req, res) {
  res.redirect("/post/about");
});

const server = https.createServer({
	key: fs.readFileSync('key.pem'),
	cert: fs.readFileSync('cert.pem')
}, app).listen(port,() => {
console.log('Listening ...Server started on port ' + port);
})
/*const http = require('http');

// const hostname = '127.0.0.1';

// const server = http.createServer((req, res) => {
//   res.statusCode = 200;
//   res.setHeader('Content-Type', 'text/plain');
//   res.end('Hello World');
// });

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});*/

module.exports = app;
