import 'source-map-support/register'
import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda'
import * as AWS from 'aws-sdk'

const responseHeader = { 'Access-Control-Allow-Origin': '*' }

import { getUserId } from '../utils'
import { createLogger } from '../../utils/logger'

const deleteTodoLogger = createLogger('deleteTodo')

const docClient = new AWS.DynamoDB.DocumentClient()
const todosTable = process.env.TODOS_TABLE
const todosIdIndex = process.env.TODOS_ID_INDEX

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  deleteTodoLogger.info('Processing event', { event })

  const todoId = event.pathParameters.todoId

  if (!todoId) {
    const message = 'Missing todoId'

    deleteTodoLogger.error(message)

    return {
      statusCode: 400,
      headers: responseHeader,
      body: JSON.stringify({ error: message })
    }
  }

  try {
    const userId = getUserId(event)

    if (!userId) {
      const message = 'Unable to get userId'

      deleteTodoLogger.error(message)

      throw message
    }

    // query to get the todo to delete, to get it's range key
    const todos = await docClient.query({
      TableName: todosTable,
      IndexName: todosIdIndex,
      KeyConditionExpression: 'todoId=:todoId AND userId=:userId',
      ExpressionAttributeValues: {
        ':todoId': todoId,
        ':userId': userId
      },
      ScanIndexForward: false
    }).promise()

    if (!todos || (todos.Items && todos.Items.length <= 0)) {
      throw {
        statusCode: 404,
        message: 'No records found'
      }
    }

    const todo = todos.Items[0]
    const { createdAt } = todo

    await docClient.delete({
      TableName: todosTable,
      Key: {
        userId,
        createdAt
      }
    }).promise()
  } catch (error) {
    deleteTodoLogger.info('Error while trying to delete todo', {
      error,
      tableName: todosTable,
      todoId
     })

    return {
      statusCode: error.statusCode || 501,
      headers: responseHeader,
      body: JSON.stringify({ error })
    }
  }

  return {
    statusCode: 200,
    headers: responseHeader,
    body: JSON.stringify({})
  }
}
