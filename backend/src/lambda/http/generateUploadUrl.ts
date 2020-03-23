import 'source-map-support/register'
import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda'

const responseHeader = { 'Access-Control-Allow-Origin': '*' }

import { createLogger } from '../../utils/logger'

import { generateTodoUploadUrl } from '../../businessLogic/todos'

const generateUploadUrlLambdaLogger = createLogger('generateUploadUrl')

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  generateUploadUrlLambdaLogger.info('Processing event', { event })

  const todoId = event.pathParameters.todoId

  if (!todoId) {
    const message = 'Missing todoId'

    generateUploadUrlLambdaLogger.error(message)

    return {
      statusCode: 400,
      headers: responseHeader,
      body: JSON.stringify({ error: 'Missing todoId' })
    }
  }

  let uploadUrl

  try {
    uploadUrl = generateTodoUploadUrl(todoId)
  } catch (error) {
    generateUploadUrlLambdaLogger.error('Error while trying to get signed url s3', { error })

    return {
      statusCode: 500,
      headers: responseHeader,
      body: JSON.stringify({ error })
    }
  }

  return {
    statusCode: 200,
    headers: responseHeader,
    body: JSON.stringify({ uploadUrl })
  }
}
