import { defineEventHandler, readBody } from 'h3'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { login, password } = body

    // TODO: In a real application, you should validate against a database
    // This is just a simple example
    if (login === 'admin' && password === 'admin') {
      return {
        success: true,
        message: 'Login successful',
        user: {
          login: 'admin',
          role: 'admin'
        }
      }
    }

    return {
      success: false,
      message: 'Invalid credentials'
    }
  } catch (error) {
    return {
      success: false,
      message: 'An error occurred during login'
    }
  }
})
