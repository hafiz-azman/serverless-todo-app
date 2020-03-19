import 'source-map-support/register'
import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda'
import * as AWS from 'aws-sdk'

const responseHeader = { 'Access-Control-Allow-Origin': '*' }

import { createLogger } from '../../utils/logger'

const deleteTodoLogger = createLogger('deleteTodo')

const docClient = new AWS.DynamoDB.DocumentClient()
const todosTable = process.env.TODOS_TABLE

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
    await docClient.delete({
      TableName: todosTable,
      Key: { id: todoId }
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
    body: {}
  }
}
