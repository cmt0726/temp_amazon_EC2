require('dotenv').config();
// Load the AWS SDK for Node.js
var AWS = require('aws-sdk');
// Set the region 
//AWS.config.update({region: 'us-west-2'});

const docClient = new AWS.DynamoDB.DocumentClient({
	accessKeyId: process.env.DYNAMODB_ACCESSKEYID,
  	secretAccessKey: process.env.DYNAMODB_SECRETACCESSKEY,
  	endpoint: process.env.DYNAMODB_ENDPOINT,
	region: 'us-west-2'
});

const getPostsFromUser = async (user) => {
	const params = {
		TableName: 'assignment_1',
		Key: {
			'username': `${user}`
		},
		ProjectionExpression: 'posts'
	};

	const res = await docClient.get(params).promise();
	//console.log(res);

	return res.Item.posts;
}

const getUser = async (username) => {
	const params = {
		TableName: "assignment_1",
		Key: {
			'username': `${username}`
		}
	};

	const res = await docClient.get(params).promise();
	return res.Item;
}

const getAllPosts = async () => {
	const params = {
		TableName: 'assignment_1',
		ProjectionExpression: 'posts'
	};

	const res = await docClient.scan(params).promise();
	const allPosts = res.Items

	let allRealPosts = [];
	for (let i in allPosts){
		if (allPosts[i].posts){
			for(let j in allPosts[i].posts)
			allRealPosts.push(allPosts[i].posts[j]);
		}
	}

	return allRealPosts;
}

//Not a big fan of having to do it this way, but is a limitation of DynamoDB and our DB Schema
const getPostById = async (id) => {
	const username = id.split("_");
	const posts = await getPostsFromUser(username[0]);
	let target;

	for (let i in posts){
		if (posts[i].id == id){
			//console.log(posts[i]);
			target = posts[i];
		}
	}
	if (!target){
		target = null;
	}

	return target;
}

//getPostById("dynamotester2_1651179996084").then(res => console.log(res));
//console.log(process.env.DYNAMODB_ENDPOINT);
//getUser("admin").then(res => console.log(res));
//getAllPosts().then(res => console.log(res));

module.exports = {
	getPostsFromUser,
	getAllPosts,
	getPostById,
	getUser
}

