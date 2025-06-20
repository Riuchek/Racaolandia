import { matrix, Matrix, multiply, subtract, add, divide, index, range, subset, zeros, ones } from 'mathjs'

interface SimplexResult {
  optimalValue: number
  optimalSolution: Record<string, number>
  iterations: number
}

interface Constraint {
  coefficients: number[]
  operator: string
  value: number
}

export function solveSimplexStructured(
  maximize: boolean,
  variables: string[],
  objectiveCoefficients: number[],
  constraints: Constraint[]
): SimplexResult {
  // Convert constraints to matrix form
  const { A, b } = convertConstraintsToMatrix(constraints)
  
  // Check if we need two-phase simplex
  const needsTwoPhase = b.some(value => value < 0) || !maximize
  
  if (needsTwoPhase) {
    return solveTwoPhaseSimplex(maximize, variables, objectiveCoefficients, A, b)
  } else {
    // Convert to standard form
    const { tableau, basicVars } = convertToStandardForm(A, b, objectiveCoefficients, maximize)
    
    // Run Simplex algorithm
    const { optimalValue, solution, iterations } = runSimplex(tableau, basicVars, variables, maximize)
    
    return {
      optimalValue,
      optimalSolution: solution,
      iterations
    }
  }
}

function solveTwoPhaseSimplex(
  maximize: boolean,
  variables: string[],
  objectiveCoefficients: number[],
  A: Matrix,
  b: number[]
): SimplexResult {
  const m = A.size()[0] 
  const n = A.size()[1] 
  
  
  const phase1Tableau = matrix(zeros(m + 1, n + m + 1))
  
  
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      phase1Tableau.set([i, j], A.get([i, j]))
    }
    
    phase1Tableau.set([i, n + i], 1)
    
    phase1Tableau.set([i, n + m], b[i])
  }
  
  
  for (let j = 0; j < n; j++) {
    let sum = 0
    for (let i = 0; i < m; i++) {
      sum += A.get([i, j])
    }
    phase1Tableau.set([m, j], -sum)
  }
  
  
  const phase1BasicVars = range(n, n + m).toArray() as number[]
  
  
  const phase1Result = runSimplex(phase1Tableau, phase1BasicVars, variables, false)
  
  
  if (Math.abs(phase1Result.optimalValue) > 1e-10) {
    throw new Error('Problema não possui solução viável')
  }
  
  
  const phase2Tableau = matrix(zeros(m + 1, n + m + 1))
  
  
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n + m + 1; j++) {
      phase2Tableau.set([i, j], phase1Tableau.get([i, j]))
    }
  }
  
  
  for (let j = 0; j < n; j++) {
    phase2Tableau.set([m, j], maximize ? -objectiveCoefficients[j] : objectiveCoefficients[j])
  }
  
  
  const phase2BasicVars = [...phase1BasicVars]
  
  
  const phase2Result = runSimplex(phase2Tableau, phase2BasicVars, variables, maximize)
  
  return {
    optimalValue: phase2Result.optimalValue,
    optimalSolution: phase2Result.solution,
    iterations: phase1Result.iterations + phase2Result.iterations
  }
}

function convertConstraintsToMatrix(constraints: Constraint[]): { A: Matrix, b: number[] } {
  const m = constraints.length
  const n = constraints[0].coefficients.length
  

  let additionalConstraints = 0
  constraints.forEach(constraint => {
    if (constraint.operator === '=') {
      additionalConstraints++ 
    }
  })
  
  const totalConstraints = m + additionalConstraints
  const A = matrix(zeros(totalConstraints, n))
  const b: number[] = []
  
  let currentRow = 0
  
  constraints.forEach((constraint, originalRow) => {
    
    for (let col = 0; col < n; col++) {
      let coeff = constraint.coefficients[col]
      
      
      if (constraint.operator === '>=') {
        coeff = -coeff 
      }
      
      A.set([currentRow, col], coeff)
    }
    
    
    let rhs = constraint.value
    if (constraint.operator === '>=') {
      rhs = -rhs 
    }
    b.push(rhs)
    
    currentRow++
    
    
    if (constraint.operator === '=') {
      for (let col = 0; col < n; col++) {
        A.set([currentRow, col], -constraint.coefficients[col])
      }
      b.push(-constraint.value)
      currentRow++
    }
  })
  
  return { A, b }
}

export function solveSimplex(
  objective: string,
  variables: string[],
  constraints: string[],
  maximize: boolean
): SimplexResult {
  
  const objectiveCoeffs = parseObjective(objective, variables)
  
  
  const { A, b } = parseConstraints(constraints, variables)
  
  
  const { tableau, basicVars } = convertToStandardForm(A, b, objectiveCoeffs, maximize)
  
  
  const { optimalValue, solution, iterations } = runSimplex(tableau, basicVars, variables, maximize)
  
  return {
    optimalValue,
    optimalSolution: solution,
    iterations
  }
}

function parseObjective(objective: string, variables: string[]): number[] {
  const coeffs = new Array(variables.length).fill(0)
  
  
  const terms = objective.replace(/\s+/g, '').split(/[+-]/)
  
  terms.forEach(term => {
    if (!term) return
    
    variables.forEach((varName, idx) => {
      if (term.includes(varName)) {
        const coeff = term.replace(varName, '')
        coeffs[idx] = coeff ? parseFloat(coeff) : 1
      }
    })
  })
  
  return coeffs
}

function parseConstraints(constraints: string[], variables: string[]): { A: Matrix, b: number[] } {
  const A = matrix(zeros(constraints.length, variables.length))
  const b: number[] = []
  
  constraints.forEach((constraint, row) => {
    const [leftSide, rightSide] = constraint.split(/[<=>]/)
    const terms = leftSide.replace(/\s+/g, '').split(/[+-]/)
    
    terms.forEach(term => {
      if (!term) return
      
      variables.forEach((varName, col) => {
        if (term.includes(varName)) {
          const coeff = term.replace(varName, '')
          A.set([row, col], coeff ? parseFloat(coeff) : 1)
        }
      })
    })
    
    b.push(parseFloat(rightSide.trim()))
  })
  
  return { A, b }
}

function convertToStandardForm(
  A: Matrix,
  b: number[],
  objectiveCoeffs: number[],
  maximize: boolean
): { tableau: Matrix, basicVars: number[] } {
  const m = A.size()[0] 
  const n = A.size()[1] 
  
  
  const tableau = matrix(zeros(m + 1, n + m + 1))
  

  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      tableau.set([i, j], A.get([i, j]))
    }
    tableau.set([i, n + i], 1)
    tableau.set([i, n + m], b[i])
  }
  
  for (let j = 0; j < n; j++) {
    tableau.set([m, j], maximize ? -objectiveCoeffs[j] : objectiveCoeffs[j])
  }
  
  const basicVars = range(n, n + m).toArray() as number[]
  
  return { tableau, basicVars }
}

function runSimplex(
  tableau: Matrix,
  basicVars: number[],
  variables: string[],
  maximize: boolean
): { optimalValue: number, solution: Record<string, number>, iterations: number } {
  const m = tableau.size()[0] - 1 
  const n = tableau.size()[1] - 1 
  let iterations = 0
  const maxIterations = 1000 
  
  for (let i = 0; i < m; i++) {
    if (tableau.get([i, n]) < 0) {
      throw new Error('Problema não possui solução viável inicial. Considere usar o método das duas fases.')
    }
  }
  
  while (iterations < maxIterations) {
    let enteringCol = -1
    let minCoeff = 0
    
    for (let j = 0; j < n; j++) {
      const coeff = tableau.get([m, j])
      if (coeff < minCoeff) {
        minCoeff = coeff
        enteringCol = j
      }
    }
    
    if (enteringCol === -1) break
    
    let leavingRow = -1
    let minRatio = Infinity
    
    for (let i = 0; i < m; i++) {
      const pivot = tableau.get([i, enteringCol])
      if (pivot > 0) {
        const ratio = tableau.get([i, n]) / pivot
        if (ratio < minRatio) {
          minRatio = ratio
          leavingRow = i
        }
      }
    }
    
    if (leavingRow === -1) {
      throw new Error('Problema é ilimitado - a função objetivo pode crescer indefinidamente')
    }
    
    basicVars[leavingRow] = enteringCol
    
    const pivot = tableau.get([leavingRow, enteringCol])
    
    for (let j = 0; j <= n; j++) {
      tableau.set([leavingRow, j], tableau.get([leavingRow, j]) / pivot)
    }
    
    for (let i = 0; i <= m; i++) {
      if (i !== leavingRow) {
        const factor = tableau.get([i, enteringCol])
        for (let j = 0; j <= n; j++) {
          const newValue = tableau.get([i, j]) - factor * tableau.get([leavingRow, j])
          tableau.set([i, j], newValue)
        }
      }
    }
    
    iterations++
  }
  
  if (iterations >= maxIterations) {
    throw new Error('Algoritmo simplex não convergiu em 1000 iterações')
  }
  

  const solution: Record<string, number> = {}
  const optimalValue = tableau.get([m, n])
  

  variables.forEach((varName, idx) => {
    solution[varName] = 0
  })
  

  for (let i = 0; i < m; i++) {
    const varIdx = basicVars[i]
    if (varIdx < variables.length) {
      solution[variables[varIdx]] = tableau.get([i, n])
    }
  }
  
  return {
    optimalValue: maximize ? optimalValue : -optimalValue, 
    solution,
    iterations
  }
} 