import 'source-map-support/register'
import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda'
import * as AWS from 'aws-sdk'

const responseHeader = { 'Access-Control-Allow-Origin': '*' }

import { getUserId } from '../utils'
import { createLogger } from '../../utils/logger'

const updateTodoLogger = createLogger('updateTodo')

const docClient = new AWS.DynamoDB.DocumentClient()
const todosTable = process.env.TODOS_TABLE

import { UpdateTodoRequest } from '../../requests/UpdateTodoRequest'

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  updateTodoLogger.info('Processing event', { event })

  const
    todoId = event.pathParameters.todoId,
    updatedTodo: UpdateTodoRequest = JSON.parse(event.body),
    { name, dueDate, done } = updatedTodo

  try {
    const userId = getUserId(event)

    if (!userId) {
      const message = 'Unable to get userId'

      updateTodoLogger.error(message)

      throw message
    }

    await docClient.update({
      TableName: todosTable,
      Key: { id: todoId },
      UpdateExpression: 'set name=:name, dueDate=:dueDate, done=:done',
      ExpressionAttributeValues: {
        ':name': name,
        ':dueDate': dueDate,
        ':done': done,
      }
    }).promise()
  } catch (error) {
    updateTodoLogger.error('Error while trying to update todo', {
      error,
      tableName: todosTable,
      updatedTodo
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
    body: {}
  }
}
