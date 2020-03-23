import * as uuid from 'uuid'

import { TodoItem } from '../models/TodoItem'
import { TodoUpdate } from '../models/TodoUpdate'

import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'

import { TodosAccess } from '../dataLayer/todosAccess'

import { createLogger } from '../utils/logger'

const
  todosS3AttachmentBucket = process.env.TODOS_ATTACHMENTS_S3_BUCKET,
  awsRegion = process.env.REGION

const
  todosAccess = new TodosAccess(),
  todosBusinessLogicLogger = createLogger('todos businessLogic')

export async function createTodo(userId, newTodo: CreateTodoRequest): Promise<TodoItem> {
  todosBusinessLogicLogger.info('create todo businessLogic', {
    userId,
    newTodo
  })

  const
    todoId = uuid.v4(),
    createdAt = (new Date()).toISOString(),
    todoItem: TodoItem = {
      todoId,
      userId,
      createdAt,
      done: false,
      attachmentUrl: `https://${ todosS3AttachmentBucket }.s3${ awsRegion ? `.${ awsRegion }` : '' }.amazonaws.com/${ todoId }`,
      ...newTodo
    }

  todosBusinessLogicLogger.info('create todo businessLogic item', { todoItem })

  await todosAccess.createTodo(todoItem)

  return todoItem
}

export async function getAllTodos(userId: string): Promise<TodoItem[]> {
  todosBusinessLogicLogger.info('get all todos businessLogic', { userId })

  const items = await todosAccess.getAllTodos(userId)

  todosBusinessLogicLogger.info('get all todos businessLogic items', { items })

  return items
}

export async function updateTodo(userId: string, todoId: string, updatedTodo: UpdateTodoRequest): Promise<void> {
  todosBusinessLogicLogger.info('update todo businessLogic', {
    userId,
    todoId,
    updatedTodo
  })

  // query to get the todo to delete, to get it's range key
  const result = await todosAccess.getTodo(userId, todoId)

  todosBusinessLogicLogger.info('update todo businessLogic item', { result })

  if (!result) {
    throw {
      statusCode: 404,
      message: 'No records found'
    }
  }

  const
    { createdAt } = result,
    {
      name,
      dueDate,
      done
    } = updatedTodo,
    todoItem: TodoUpdate = {
      name,
      dueDate,
      done
    }

  await todosAccess.updateTodo(userId, createdAt, todoItem)
}

export async function deleteTodo(userId: string, todoId: string): Promise<void> {
  todosBusinessLogicLogger.info('delete todo businessLogic', {
    userId,
    todoId
  })

  // query to get the todo to delete, to get it's range key
  const result = await todosAccess.getTodo(userId, todoId)

  todosBusinessLogicLogger.info('delete todo businessLogic item', { result })

  if (!result) {
    throw {
      statusCode: 404,
      message: 'No records found'
    }
  }

  const { createdAt } = result

  await todosAccess.deleteTodo(userId, createdAt)
}

export function generateTodoUploadUrl(todoId: string) {
  todosBusinessLogicLogger.info('generate todo upload url businessLogic', { todoId })

  const uploadUrl = todosAccess.getTodoAttachmentUploadSignedUrl(todoId)

  todosBusinessLogicLogger.info('generate todo upload url businessLogic uploadUrl', { uploadUrl })

  return uploadUrl
}