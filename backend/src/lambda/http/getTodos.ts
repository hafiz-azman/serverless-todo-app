import 'source-map-support/register'
import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda'

const responseHeader = { 'Access-Control-Allow-Origin': '*' }

import { getUserId } from '../utils'
import { createLogger } from '../../utils/logger'

import { getAllTodos } from '../../businessLogic/todos'

const getTodosLambdaLogger = createLogger('getTodo')

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  getTodosLambdaLogger.info('Processing event', { event })

  let userId, todos

  try {
    const userId = getUserId(event)

    todos = await getAllTodos(userId)
  } catch (error) {
    getTodosLambdaLogger.error('Error while trying to get todos', {
      error,
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
    body: JSON.stringify({ items: todos })
  }
}
