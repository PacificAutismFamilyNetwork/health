import AWS = require('aws-sdk');
import { UsersDao } from './ddb/users-dao';

const db = new AWS.DynamoDB.DocumentClient({ region: 'us-west-2' });

/**
 * Creates a new user profile after the user confirms their signup.
 */
export const handler = async (event: any = {}, context: any, callback: any): Promise<any> => {
    console.log("Creating user profile...");
    console.log(event);

    var isFirstUser = true

    const userName = event["userName"];
    const email = event["request"]["userAttributes"]["email"];
    // const name = event["request"]["userAttributes"]["name"];

    var ssm = new AWS.SSM({region: 'us-west-2'});
    await ssm.getParameter({
        Name: "FirstUser",
    }).promise().then((data) => {
        isFirstUser = false
    }).catch(error => {
        console.error('First User!')
    });;
    
    const dao = new UsersDao(db);

    if (isFirstUser) {
        await ssm.putParameter({
            DataType: 'text',
            Name: 'FirstUser',
            Type: 'String',
            Value: 'FirstUserCreated',
        }).promise()
        await dao.createUser({
            email: email,
            patient_ids: [],
            user_id: userName,
            user_type: "ADMIN"
        });  
    } else {
        await dao.createUser({
            email: email,
            patient_ids: [],
            user_id: userName,
            user_type: "UNCLASSIFIED"
        });  
    }

    // Return to Amazon Cognito
    callback(null, event);
};
