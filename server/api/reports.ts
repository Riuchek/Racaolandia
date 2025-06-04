import { defineEventHandler, readBody } from 'h3'
import { saveReport } from '../utils/database'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { objective, variables, constraints } = body

    if (!objective || !variables || !constraints) {
      return {
        success: false,
        message: 'Missing required fields'
      }
    }

    const result = saveReport(objective, variables, constraints)

    return {
      success: true,
      message: 'Report saved successfully',
      reportId: result.lastInsertRowid
    }
  } catch (error) {
    console.error('Error saving report:', error)
    return {
      success: false,
      message: 'Error saving report'
    }
  }
}) 