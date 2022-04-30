require('dotenv').config();
// Load the AWS SDK for Node.js
var AWS = require('aws-sdk');
const {body, validationResult} = require('express-validator');
// Set the region 
AWS.config.update({region: 'us-west-2'});
const bcrypt = require('bcrypt');

const docClient = new AWS.DynamoDB.DocumentClient({
	accessKeyId: process.env.DYNAMODB_ACCESSKEYID,
  	secretAccessKey: process.env.DYNAMODB_SECRETACCESSKEY,
  	endpoint: process.env.DYNAMODB_ENDPOINT,
	region: 'us-west-2'
});


const addUser = async (username, email, password) => {
  saltRounds = 10;
  saltAndHash = await bcrypt.hash(password, saltRounds);
  console.log(saltAndHash);
  const params = {
    TransactItems: [{
      Put: {
        TableName: "assignment_1",
        Item: {
          username: `${username}`,
          email: `${email}`,
          password: `${saltAndHash}`
        },
        ConditionExpression: "attribute_not_exists(username)",
      }
    }, {
        Put: {
          TableName: "assignment_1",
          Item: {
            username: `EMAIL#${email}`
          },
          ConditionExpression: "attribute_not_exists(username)"
        }
      }
    ]
  };

  const res = await docClient.transactWrite(params).promise();
  //console.log(res);
  return res;
}

const addBlogPost = async (username, title, content) => {
  const params = {
    TableName: 'assignment_1',
    Key: {
      username: `${username}`
    },
    UpdateExpression: 'SET posts = list_append(if_not_exists(posts, :empty_list), :vals)',
    ExpressionAttributeValues: {
      ":vals": [{
        "title": `${title}`,
        "content": `${content}`,
        "id" : `${username}_${Date.now()}`
      }],
      ":empty_list": []
    }
  };

 const res = await docClient.update(params).promise();
 return res;
}

module.exports = {
  addUser,
  addBlogPost
}
addBlogPost("dynamotester4", "blog test id2", "this blog is a test").then(res => console.log(res));
//addUser("dynamotester4", "dynamotester4@test.com", "thisshouldbehashed").then(res => console.log(res));
