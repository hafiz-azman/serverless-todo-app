import 'source-map-support/register'
import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda'
import * as AWS from 'aws-sdk'

const responseHeader = { 'Access-Control-Allow-Origin': '*' }

import { getUserId } from '../utils'
import { createLogger } from '../../utils/logger'

const getTodosLogger = createLogger('getTodo')

const docClient = new AWS.DynamoDB.DocumentClient()
const todosTable = process.env.TODOS_TABLE
const todosIdIndex = process.env.TODOS_ID_INDEX

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  getTodosLogger.info('Processing event', { event })

  let userId, todos

  try {
    const userId = getUserId(event)

    if (!userId) {
      const message = 'Unable to get userId'

      getTodosLogger.error(message)

      throw message
    }

    todos = await docClient.query({
      TableName: todosTable,
      IndexName: todosIdIndex,
      KeyConditionExpression: 'userId=:userId',
      ExpressionAttributeValues: { ':userId': userId },
      ScanIndexForward: false
    }).promise()
  } catch (error) {
    getTodosLogger.error('Error while trying to get todos', {
      error,
      tableName: todosTable,
      userId
    })

    return {
      statusCode: 500,
      headers: responseHeader,
      body: JSON.stringify({ error })
    }
  }

  return {
    statusCode: 200,
    headers: responseHeader,
    body: JSON.stringify({ items: todos && todos.Items ? todos.Items :  [] })
  }
}
