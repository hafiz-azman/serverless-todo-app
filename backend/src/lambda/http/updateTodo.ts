import 'source-map-support/register'
import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda'
import * as AWS from 'aws-sdk'

const responseHeader = { 'Access-Control-Allow-Origin': '*' }

import { getUserId } from '../utils'
import { createLogger } from '../../utils/logger'

const updateTodoLogger = createLogger('updateTodo')

const docClient = new AWS.DynamoDB.DocumentClient()
const todosTable = process.env.TODOS_TABLE
const todosIdIndex = process.env.TODOS_ID_INDEX

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

    await docClient.update({
      TableName: todosTable,
      Key: {
        userId,
        createdAt
      },
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
    body: JSON.stringify({})
  }
}
