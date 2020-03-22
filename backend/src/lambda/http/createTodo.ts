import 'source-map-support/register'
import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda'
import * as AWS from 'aws-sdk'
import * as uuid from 'uuid'

const responseHeader = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Credentials': true
}

import { getUserId } from '../utils'
import { createLogger } from '../../utils/logger'

const createTodoLogger = createLogger('createTodo')

const docClient = new AWS.DynamoDB.DocumentClient()
const todosTable = process.env.TODOS_TABLE
const todosS3AttachmentBucket = process.env.TODOS_ATTACHMENTS_S3_BUCKET
const awsRegion = process.env.REGION

import { CreateTodoRequest } from '../../requests/CreateTodoRequest'

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  createTodoLogger.info('Processing event', { event })

  const todoId = uuid.v4()
  const createdAt = (new Date()).toISOString()
  const newTodo: CreateTodoRequest = JSON.parse(event.body)

  let newItem

  try {
    const userId = getUserId(event)

    if (!userId) {
      const message = 'Unable to get userId'

      createTodoLogger.error(message)

      throw message
    }

    newItem = {
      todoId,
      userId,
      createdAt,
      attachmentUrl: `https://${ todosS3AttachmentBucket }.s3${ awsRegion ? `.${ awsRegion }` : '' }.amazonaws.com/${ todoId }`,
      ...newTodo
    }

    await docClient.put({
      TableName: todosTable,
      Item: newItem
    }).promise()
  } catch (error) {
    createTodoLogger.error('Error while trying to put todo', {
      error,
      tableName: todosTable,
      item: newItem
     })

    return {
      statusCode: 500,
      headers: responseHeader,
      body: JSON.stringify({ error })
    }
  }

  return {
    statusCode: 201,
    headers: responseHeader,
    body: JSON.stringify({ item: newItem })
  }
}
