import 'source-map-support/register'
import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda'

const responseHeader = { 'Access-Control-Allow-Origin': '*' }

import { getUserId } from '../utils'
import { createLogger } from '../../utils/logger'

import { deleteTodo } from '../../businessLogic/todos'

const deleteTodoLambdaLogger = createLogger('deleteTodo')

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  deleteTodoLambdaLogger.info('Processing event', { event })

  const todoId = event.pathParameters.todoId

  if (!todoId) {
    const message = 'Missing todoId'

    deleteTodoLambdaLogger.error(message)

    return {
      statusCode: 400,
      headers: responseHeader,
      body: JSON.stringify({ error: message })
    }
  }

  let userId

  try {
    userId = getUserId(event)

    await deleteTodo(userId, todoId)
  } catch (error) {
    deleteTodoLambdaLogger.info('Error while trying to delete todo', {
      error,
      userId,
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
