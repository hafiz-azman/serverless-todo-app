import 'source-map-support/register'
import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda'
import * as AWS from 'aws-sdk'
import * as uuid from 'uuid'

const responseHeader = { 'Access-Control-Allow-Origin': '*' }

import { getUserId } from '../utils'
import { createLogger } from '../../utils/logger'

const createTodoLogger = createLogger('createTodo')

const docClient = new AWS.DynamoDB.DocumentClient()
const todosTable = process.env.TODOS_TABLE

import { CreateTodoRequest } from '../../requests/CreateTodoRequest'

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  createTodoLogger.info('Processing event', { event })

  const todoId = uuid.v4()
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
      id: todoId,
      userId,
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
    StatusCode: 201,
    headers: responseHeader,
    body: JSON.stringify({ newItem })
  }
}
