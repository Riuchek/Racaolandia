import solver from 'javascript-lp-solver'

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

    const model: any = {
      optimize: 'obj',
      opType: body.objective === 'maximize' ? 'max' : 'min',
      constraints: {},
      variables: {},
    }

    body.constraints.forEach((constraint, i) => {
      const cname = `c${i}`
      model.constraints[cname] = {}
      if (constraint.operator === '<=' || constraint.operator === '≤') {
        model.constraints[cname].max = constraint.value
      } else if (constraint.operator === '>=') {
        model.constraints[cname].min = constraint.value
      } else if (constraint.operator === '=') {
        model.constraints[cname].equal = constraint.value
      }
    })

    body.variables.forEach((v, vIdx) => {
      model.variables[v] = { obj: body.objectiveCoefficients[vIdx] }
      body.constraints.forEach((constraint, cIdx) => {
        const cname = `c${cIdx}`
        model.variables[v][cname] = constraint.coefficients[vIdx]
      })
    })

    const result = solver.Solve(model)
    console.log('Solver result:', result)
    
    if (!result.feasible) {
      return { success: false, error: 'Problema não possui solução viável' }
    }

    const optimalSolution: Record<string, number> = {}
    body.variables.forEach(v => {
      optimalSolution[v] = typeof result[v] === 'number' ? result[v] : 0
    })

    const optimalValue = typeof result.result === 'number' ? result.result : 0

    return {
      success: true,
      solution: {
        optimalValue,
        optimalSolution,
        iterations: result.iterations || 0
      }
    }
  } catch (error: any) {
    console.error('Simplex error:', error)
    return {
      success: false,
      error: error.message || 'Erro interno do servidor'
    }
  }
}) 