import * as AWS from 'aws-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'

// use require as workaround compiler complaining:
// Property 'DocumentClient' does not exist on type 'PatchedAWSClientConstructor<ClientConfiguration, typeof DynamoDB>'
const AWSXRay = require('aws-xray-sdk')

import { TodoItem } from '../models/TodoItem'
import { TodoUpdate } from '../models/TodoUpdate'

import { createLogger } from '../utils/logger'

const
  XAWS = AWSXRay.captureAWS(AWS),
  todosAccessLogger = createLogger('todosAccess')

export class TodosAccess {
  constructor(
    // dynamodb
    private readonly docClient: DocumentClient = new XAWS.DynamoDB.DocumentClient(),
    private readonly todosTable = process.env.TODOS_TABLE,
    private readonly todosIdIndex = process.env.TODOS_ID_INDEX,

    // s3
    private readonly s3 = new XAWS.S3({ signatureVersion: 'v4' }),
    private readonly bucketName = process.env.TODOS_ATTACHMENTS_S3_BUCKET,
    private readonly urlExpiration = process.env.SIGNED_URL_EXPIRATION
  ) {
    todosAccessLogger.info('constructing TodosAccess class', {
      todosTable,
      todosIdIndex
    })
  }

  // dynamo db accesses

  async createTodo(todoItem: TodoItem): Promise<void> {
    todosAccessLogger.info('creating new todo', { todoItem })

    await this.docClient.put({
      TableName: this.todosTable,
      Item: todoItem
    }).promise()
  }

  async getTodo(userId: string, todoId: string): Promise<TodoItem> {
    todosAccessLogger.info('getting a todo', {
      userId,
      todoId
    })

    let todoItem

    const result = await this.docClient.query({
      TableName: this.todosTable,
      IndexName: this.todosIdIndex,
      KeyConditionExpression: 'todoId=:todoId AND userId=:userId',
      ExpressionAttributeValues: {
        ':todoId': todoId,
        ':userId': userId
      },
      ScanIndexForward: false
    }).promise()

    const { Items } = result

    if (Items && Items.length) {
      [ todoItem ] = Items
    }

    return todoItem
  }

  async getAllTodos(userId: string): Promise<TodoItem[]> {
    todosAccessLogger.info('getting all todos', { userId })

    let todoItems = []

    const result = await this.docClient.query({
      TableName: this.todosTable,
      IndexName: this.todosIdIndex,
      KeyConditionExpression: 'userId=:userId',
      ExpressionAttributeValues: { ':userId': userId },
      ScanIndexForward: false
    }).promise()

    const { Items } = result

    if (Items && Items.length) {
      todoItems = Items
    }

    return todoItems
  }

  async updateTodo(userId: string, createdAt: string, todoItem: TodoUpdate): Promise<void> {
    todosAccessLogger.info('updating todo', {
      userId,
      createdAt,
      todoItem
    })

    const {
      name,
      dueDate,
      done
    } = todoItem

    await this.docClient.update({
      TableName: this.todosTable,
      Key: {
        userId,
        createdAt
      },
      UpdateExpression: 'set #todoName=:todoName, dueDate=:dueDate, done=:done',
      ExpressionAttributeNames: { '#todoName': 'name' },
      ExpressionAttributeValues: {
        ':todoName': name,
        ':dueDate': dueDate,
        ':done': done
      }
    }).promise()
  }

  async deleteTodo(userId: string, createdAt: string): Promise<void> {
    todosAccessLogger.info('deleting todo', {
      userId,
      createdAt
    })

    await this.docClient.delete({
      TableName: this.todosTable,
      Key: {
        userId,
        createdAt
      }
    }).promise()
  }

  // s3 bucket accesses

  getTodoAttachmentUploadSignedUrl(todoId: string): string {
    todosAccessLogger.info('getting todo attachment upload signed url', { todoId })

    const uploadUrl = this.s3.getSignedUrl('putObject', {
      Bucket: this.bucketName,
      Key: todoId,
      Expires: this.urlExpiration
    })

    todosAccessLogger.info('getting todo attachment upload signed url uploadUrl', { uploadUrl })

    return uploadUrl
  }
}