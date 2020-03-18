import 'source-map-support/register'
import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda'
import * as AWS from 'aws-sdk'

const responseHeader = { 'Access-Control-Allow-Origin': '*' }

const docClient = new AWS.DynamoDB.DocumentClient()
const todosTable = process.env.TODOS_TABLE

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const todoId = event.pathParameters.todoId

  if (!todoId) {
    return {
      statusCode: 400,
      headers: responseHeader,
      body: JSON.stringify({ error: 'Missing todoId' })
    }
  }

  try {
    await docClient.delete({
      TableName: todosTable,
      Key: { id: todoId }
    }).promise()
  } catch (error) {
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
