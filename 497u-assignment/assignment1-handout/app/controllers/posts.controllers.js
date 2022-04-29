//const Post = require("../models/post");
const ddbPut = require("../dynamo/ddb_putitem");
const ddbGet = require("../dynamo/ddb_getitem");


const homeStartingContent =
	'The home pages lists all the blogs from all the users.';

const composePost = (req, res) => {
	/*const post = new Post({
    username: req.user.username,
		title: req.body.postTitle,
		content: req.body.postBody
	});

	post.save();*/
	ddbPut.addBlogPost(req.user.username, req.body.postTitle, req.body.postBody)
	res.redirect('/post');
};

const displayAllPosts = async (req, res) => {
	/*Post.find({}, function(err, posts) {
		res.render('home', {
			startingContent: homeStartingContent,
			posts: posts
		});
	});*/

	const allPosts = await ddbGet.getAllPosts();

	

	res.render('home', {
		startingContent: homeStartingContent,
		posts: allPosts
	});

};
async function displayPost (req, res)  {
	const requestedPostId = req.params.postId;

	/*Post.findOne({ _id: requestedPostId }, function(err, post) {
		res.render('post', {
			title: post.title,
			content: post.content
		});
	});*/

	const post = await ddbGet.getPostById(requestedPostId);

	res.render('post', {
		title: post.title,
		content: post.content
	});
};

module.exports = {
	displayAllPosts,
	displayPost,
    composePost
};