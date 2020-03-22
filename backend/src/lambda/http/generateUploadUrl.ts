import 'source-map-support/register'
import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda'
import * as AWS from 'aws-sdk'

const responseHeader = { 'Access-Control-Allow-Origin': '*' }

import { createLogger } from '../../utils/logger'

const generateUploadUrlLogger = createLogger('generateUploadUrl')

const s3 = new AWS.S3({ signatureVersion: 'v4' })

const bucketName = process.env.TODOS_ATTACHMENTS_S3_BUCKET
const urlExpiration =  process.env.SIGNED_URL_EXPIRATION

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  generateUploadUrlLogger.info('Processing event', { event })

  const todoId = event.pathParameters.todoId

  if (!todoId) {
    const message = 'Missing todoId'

    generateUploadUrlLogger.error(message)

    return {
      statusCode: 400,
      headers: responseHeader,
      body: JSON.stringify({ error: 'Missing todoId' })
    }
  }

  let uploadUrl

  try {
    uploadUrl = s3.getSignedUrl('putObject', {
      Bucket: bucketName,
      Key: todoId,
      Expires: urlExpiration
    })
  } catch (error) {
    generateUploadUrlLogger.error('Error while trying to get signed url s3', {
      error,
      bucketName,
      todoId,
      urlExpiration
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
    body: JSON.stringify({ uploadUrl })
  }
}
