import 'source-map-support/register'

import { decode } from 'jsonwebtoken'

import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda'

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const
    token = event.headers.Authorization,
    decodedToken = decode(token)

  console.log(decodedToken)

  return {
    statusCode: 201,
    headers: {
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({
      items: []
    })
  }
}
