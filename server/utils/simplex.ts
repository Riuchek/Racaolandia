import { matrix, Matrix, multiply, subtract, add, divide, index, range, subset, zeros, ones } from 'mathjs'

interface SimplexResult {
  optimalValue: number
  optimalSolution: Record<string, number>
  iterations: number
}

export function solveSimplex(
  objective: string,
  variables: string[],
  constraints: string[],
  maximize: boolean
): SimplexResult {
  // Parse objective function
  const objectiveCoeffs = parseObjective(objective, variables)
  
  // Parse constraints
  const { A, b } = parseConstraints(constraints, variables)
  
  // Convert to standard form
  const { tableau, basicVars } = convertToStandardForm(A, b, objectiveCoeffs, maximize)
  
  // Run Simplex algorithm
  const { optimalValue, solution, iterations } = runSimplex(tableau, basicVars, variables)
  
  return {
    optimalValue,
    optimalSolution: solution,
    iterations
  }
}

function parseObjective(objective: string, variables: string[]): number[] {
  const coeffs = new Array(variables.length).fill(0)
  
  // Remove spaces and split by terms
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
  const m = A.size()[0] // number of constraints
  const n = A.size()[1] // number of variables
  
  // Create initial tableau
  const tableau = matrix(zeros(m + 1, n + m + 1))
  
  // Set constraint coefficients
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      tableau.set([i, j], A.get([i, j]))
    }
    // Add slack variables
    tableau.set([i, n + i], 1)
    // Set RHS
    tableau.set([i, n + m], b[i])
  }
  
  // Set objective function coefficients
  for (let j = 0; j < n; j++) {
    tableau.set([m, j], maximize ? -objectiveCoeffs[j] : objectiveCoeffs[j])
  }
  
  // Set basic variables (slack variables)
  const basicVars = range(n, n + m).toArray() as number[]
  
  return { tableau, basicVars }
}

function runSimplex(
  tableau: Matrix,
  basicVars: number[],
  variables: string[]
): { optimalValue: number, solution: Record<string, number>, iterations: number } {
  const m = tableau.size()[0] - 1 // number of constraints
  const n = tableau.size()[1] - 1 // total number of variables
  let iterations = 0
  const maxIterations = 1000 // Prevent infinite loops
  
  while (iterations < maxIterations) {
    // Find entering variable (most negative coefficient in objective row)
    let enteringCol = -1
    let minCoeff = 0
    
    for (let j = 0; j < n; j++) {
      const coeff = tableau.get([m, j])
      if (coeff < minCoeff) {
        minCoeff = coeff
        enteringCol = j
      }
    }
    
    // If no negative coefficients, we're done
    if (enteringCol === -1) break
    
    // Find leaving variable (minimum ratio test)
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
    
    // If no leaving variable found, problem is unbounded
    if (leavingRow === -1) {
      throw new Error('Problem is unbounded')
    }
    
    // Update basic variables
    basicVars[leavingRow] = enteringCol
    
    // Pivot
    const pivot = tableau.get([leavingRow, enteringCol])
    
    // Normalize pivot row
    for (let j = 0; j <= n; j++) {
      tableau.set([leavingRow, j], tableau.get([leavingRow, j]) / pivot)
    }
    
    // Update other rows
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
  
  // Extract solution
  const solution: Record<string, number> = {}
  const optimalValue = tableau.get([m, n])
  
  // Set all variables to 0 initially
  variables.forEach((varName, idx) => {
    solution[varName] = 0
  })
  
  // Set values for basic variables
  for (let i = 0; i < m; i++) {
    const varIdx = basicVars[i]
    if (varIdx < variables.length) {
      solution[variables[varIdx]] = tableau.get([i, n])
    }
  }
  
  return {
    optimalValue: -optimalValue, // Negate because we minimized the negative of the objective
    solution,
    iterations
  }
} 