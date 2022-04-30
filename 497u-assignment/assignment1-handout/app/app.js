require('dotenv').config();
const express = require('express');
const config = require('./config/config');
const compression = require ('compression');
const helmet = require('helmet');
const https= require("https");
const fs = require('fs')
const ddbGet = require("./dynamo/ddb_getitem")
const bcrypt = require("bcrypt");




const bodyParser = require('body-parser');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local');


//redis setup
let RedisStore = require("connect-redis")(session)



const ioRedis = require("ioredis")

const ioredis = new ioRedis({
	port : 6379,
	host : "redis-assign1.gkjgwl.ng.0001.usw2.cache.amazonaws.com"
})








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



//for some reason does not like secret being in .env
//setup this app to use Redis for it's session storage
app.use(
	session({
		store : new RedisStore({client : ioredis}),
		saveUninitialized : false,
		secret : 'ConnorRolandCole',
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

passport.serializeUser((user, done) =>{
	done(null, user.id);
});

passport.deserializeUser(async (login, done) =>  {
	const item = await ddbGet.getUser(login);
	done(err, item);
});

strategy = new LocalStrategy(async (user, pass, done) => {
    	console.log('Using Defined Local Strat');
	const dbUser = await ddbGet.getUser(user);
	bcrypt.compare(pass, dbUser.password, function(err, res) {
		if (err) return done(err);
		if (res === false){
			return done(null, false, {message: 'passwords dont match'});
		} else {
			return done(null, dbUser);
		}
	})
});
passport.use(strategy);


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

module.exports = app;
