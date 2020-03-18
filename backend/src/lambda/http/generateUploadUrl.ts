import 'source-map-support/register'
import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda'
import * as AWS from 'aws-sdk'

const responseHeader = { 'Access-Control-Allow-Origin': '*' }

const s3 = new AWS.S3({ signatureVersion: 'v4' })

const bucketName = process.env.TODOS_ATTACHMENTS_S3_BUCKET
const urlExpiration =  process.env.SIGNED_URL_EXPIRATION

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const todoId = event.pathParameters.todoId

  if (!todoId) {
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
