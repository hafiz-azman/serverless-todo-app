import 'source-map-support/register'
import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda'

const responseHeader = { 'Access-Control-Allow-Origin': '*' }

import { CreateTodoRequest } from '../../requests/CreateTodoRequest'

import { getUserId } from '../utils'
import { createLogger } from '../../utils/logger'

import { createTodo } from '../../businessLogic/todos'

const createTodoLambdaLogger = createLogger('createTodoLambda')

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  createTodoLambdaLogger.info('Processing event', { event })

  const newTodo: CreateTodoRequest = JSON.parse(event.body)

  let todoItem, userId

  try {
    userId = getUserId(event)
    todoItem = await createTodo(userId, newTodo)
  } catch (error) {
    createTodoLambdaLogger.error('Error while trying to put todo', {
      error,
      userId,
      newTodo
    })

    return {
      statusCode: error.statusCode || 500,
      headers: responseHeader,
      body: JSON.stringify({ error })
    }
  }

  return {
    statusCode: 201,
    headers: responseHeader,
    body: JSON.stringify({ item: todoItem })
  }
}
