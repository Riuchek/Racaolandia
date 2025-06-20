import { solveSimplexStructured } from '~/server/utils/simplex'

interface SimplexRequest {
  objective: 'maximize' | 'minimize'
  variables: string[]
  objectiveCoefficients: number[]
  constraints: Array<{
    coefficients: number[]
    operator: string
    value: number
  }>
}

interface SimplexResponse {
  success: boolean
  solution?: {
    optimalValue: number
    optimalSolution: Record<string, number>
    iterations: number
  }
  error?: string
}

export default defineEventHandler(async (event): Promise<SimplexResponse> => {
  try {
    const body = await readBody(event) as SimplexRequest
    
    if (!body.variables || body.variables.length === 0) {
      return {
        success: false,
        error: 'Pelo menos uma variável é necessária'
      }
    }

    if (!body.constraints || body.constraints.length === 0) {
      return {
        success: false,
        error: 'Pelo menos uma restrição é necessária'
      }
    }

    if (!body.objectiveCoefficients || body.objectiveCoefficients.length !== body.variables.length) {
      return {
        success: false,
        error: 'Coeficientes da função objetivo devem corresponder ao número de variáveis'
      }
    }

    if (body.objectiveCoefficients.every(coef => coef === 0)) {
      return {
        success: false,
        error: 'A função objetivo não pode ter todos os coeficientes zero'
      }
    }

    for (const constraint of body.constraints) {
      if (constraint.coefficients.length !== body.variables.length) {
        return {
          success: false,
          error: 'Coeficientes das restrições devem corresponder ao número de variáveis'
        }
      }
    }

    const solution = solveSimplexStructured(
      body.objective === 'maximize',
      body.variables,
      body.objectiveCoefficients,
      body.constraints
    )

    return {
      success: true,
      solution
    }

  } catch (error: any) {
    console.error('Simplex error:', error)
    return {
      success: false,
      error: error.message || 'Erro interno do servidor'
    }
  }
}) 