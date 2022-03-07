#!/usr/bin/env node
import { App } from '@aws-cdk/core';
import { HealthPlatformLambdaStack } from '../lib/lambda-stack';
import { HealthPlatformDynamoStack } from '../lib/dynamodb-stack';
import { HealthPlatformAppSyncStack } from '../lib/appsync-stack';
import { HealthPlatformCognitoStack } from '../lib/cognito-stack';
import { HealthPlatformIotStack } from '../lib/iot-stack';
import { HealthPlatformSearchStack } from '../lib/search-stack';

const app = new App();
const ddb = new HealthPlatformDynamoStack(app, 'HealthPlatformDynamoStack');
const cognito = new HealthPlatformCognitoStack(app, 'HealthPlatformCognitoStack');
const lambdaStack = new HealthPlatformLambdaStack(app, 'HealthPlatformLambdaStack');
new HealthPlatformIotStack(app, 'HealthPlatformIotStack');
const searchStack = new HealthPlatformSearchStack(app, "HealthPlatformSearchStack", ddb.eventDetailsTable);

new HealthPlatformAppSyncStack(app, 'HealthPlatformAppSyncStack', cognito.UserPoolId, lambdaStack, searchStack);
