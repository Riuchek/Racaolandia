<script lang="ts" setup>
const objective = ref('maximize')
const loading = ref(false)
const error = ref('')
const success = ref(false)
const solution = ref<{
  optimalValue: number
  optimalSolution: Record<string, number>
  iterations: number
} | null>(null)

const variablesList = ref<string[]>(['x1', 'x2'])
const newVariable = ref('')

const constraintsList = ref<Array<{
  coefficients: number[]
  operator: string
  value: number
}>>([
  { coefficients: [1, 1], operator: '<=', value: 10 },
  { coefficients: [2, 1], operator: '<=', value: 15 }
])

const objectiveCoefficients = ref<number[]>([3, 4])

const addVariable = () => {
  if (newVariable.value.trim()) {
    variablesList.value.push(newVariable.value.trim())
    newVariable.value = ''
    
    objectiveCoefficients.value.push(0)
    
    constraintsList.value.forEach(constraint => {
      constraint.coefficients.push(0)
    })
  }
}

const removeVariable = (index: number) => {
  if (variablesList.value.length > 1) {
    variablesList.value.splice(index, 1)
    objectiveCoefficients.value.splice(index, 1)
    
    constraintsList.value.forEach(constraint => {
      constraint.coefficients.splice(index, 1)
    })
  }
}

const addConstraint = () => {
  const newCoefficients = new Array(variablesList.value.length).fill(0)
  constraintsList.value.push({
    coefficients: newCoefficients,
    operator: '<=',
    value: 0
  })
}

const removeConstraint = (index: number) => {
  if (constraintsList.value.length > 1) {
    constraintsList.value.splice(index, 1)
  }
}

const updateConstraintCoefficient = (constraintIndex: number, variableIndex: number, value: string) => {
  const numValue = parseFloat(value) || 0
  constraintsList.value[constraintIndex].coefficients[variableIndex] = numValue
}

const updateObjectiveCoefficient = (index: number, value: string) => {
  const numValue = parseFloat(value) || 0
  objectiveCoefficients.value[index] = numValue
}

const handleSubmit = async () => {
  loading.value = true
  error.value = ''
  success.value = false
  solution.value = null

  try {
    if (variablesList.value.length === 0) {
      throw new Error('Adicione pelo menos uma variável')
    }

    if (constraintsList.value.length === 0) {
      throw new Error('Adicione pelo menos uma restrição')
    }

    if (objectiveCoefficients.value.every(coef => coef === 0)) {
      throw new Error('A função objetivo não pode ter todos os coeficientes zero')
    }

    const simplexData = {
      objective: objective.value,
      variables: variablesList.value,
      objectiveCoefficients: objectiveCoefficients.value,
      constraints: constraintsList.value.map(constraint => ({
        coefficients: constraint.coefficients,
        operator: constraint.operator,
        value: constraint.value
      }))
    }

    const response = await $fetch<{
      success: boolean
      solution?: {
        optimalValue: number
        optimalSolution: Record<string, number>
        iterations: number
      }
      error?: string
    }>('/api/simplex', {
      method: 'POST',
      body: simplexData
    })

    if (response.success && response.solution) {
      solution.value = response.solution
      success.value = true
    } else {
      throw new Error(response.error || 'Erro desconhecido')
    }

  } catch (err: any) {
    error.value = err.message || 'Erro ao processar a otimização'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  objectiveCoefficients.value = [3, 4]
})
</script>

<template>
  <div class="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-4xl mx-auto">
      <div class="bg-white rounded-lg shadow-lg p-8">
        <div class="text-center mb-8">
          <h1 class="text-3xl font-bold text-gray-900 mb-2">
            Calculadora Simplex - RaçãoLandia
          </h1>
          <p class="text-gray-600">
            Resolva problemas de programação linear com o método simplex
          </p>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-8">
          <div class="bg-blue-50 p-6 rounded-lg">
            <h2 class="text-xl font-semibold text-gray-900 mb-4">Função Objetivo</h2>
            
            <div class="flex items-center gap-4 mb-4">
              <label class="text-sm font-medium text-gray-700">Objetivo:</label>
              <div class="flex gap-4">
                <label class="inline-flex items-center">
                  <input
                    type="radio"
                    v-model="objective"
                    value="maximize"
                    class="form-radio text-blue-600"
                  />
                  <span class="ml-2">Maximizar</span>
                </label>
                <label class="inline-flex items-center">
                  <input
                    type="radio"
                    v-model="objective"
                    value="minimize"
                    class="form-radio text-blue-600"
                  />
                  <span class="ml-2">Minimizar</span>
                </label>
              </div>
            </div>

            <div class="flex items-center gap-2 flex-wrap">
              <span class="text-sm font-medium">Z =</span>
              <div v-for="(variable, index) in variablesList" :key="index" class="flex items-center gap-1">
                <input
                  :value="objectiveCoefficients[index]"
                  @input="updateObjectiveCoefficient(index, ($event.target as HTMLInputElement).value)"
                  type="number"
                  step="0.01"
                  class="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                  placeholder="0"
                />
                <span class="text-sm">{{ variable }}</span>
                <span v-if="index < variablesList.length - 1" class="text-sm">+</span>
              </div>
            </div>
          </div>

          <div class="bg-green-50 p-6 rounded-lg">
            <h2 class="text-xl font-semibold text-gray-900 mb-4">Variáveis</h2>
            
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              <div v-for="(variable, index) in variablesList" :key="index" class="flex items-center gap-2">
                <span class="text-sm font-medium">{{ variable }}</span>
                <button
                  type="button"
                  @click="removeVariable(index)"
                  :disabled="variablesList.length <= 1"
                  class="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 disabled:opacity-50"
                >
                  Remover
                </button>
              </div>
            </div>

            <div class="flex gap-2">
              <input
                v-model="newVariable"
                type="text"
                placeholder="Nome da nova variável"
                class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                type="button"
                @click="addVariable"
                class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Adicionar Variável
              </button>
            </div>
          </div>

          <div class="bg-yellow-50 p-6 rounded-lg">
            <h2 class="text-xl font-semibold text-gray-900 mb-4">Restrições</h2>
            
            <div v-for="(constraint, constraintIndex) in constraintsList" :key="constraintIndex" class="mb-4 p-4 bg-white rounded border">
              <div class="flex items-center gap-2 flex-wrap">
                <div v-for="(variable, variableIndex) in variablesList" :key="variableIndex" class="flex items-center gap-1">
                  <input
                    :value="constraint.coefficients[variableIndex]"
                    @input="updateConstraintCoefficient(constraintIndex, variableIndex, ($event.target as HTMLInputElement).value)"
                    type="number"
                    step="0.01"
                    class="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                    placeholder="0"
                  />
                  <span class="text-sm">{{ variable }}</span>
                  <span v-if="variableIndex < variablesList.length - 1" class="text-sm">+</span>
                </div>
                
                <select
                  v-model="constraint.operator"
                  class="px-3 py-1 border border-gray-300 rounded text-sm"
                >
                  <option value="<=">≤</option>
                  <option value=">=">≥</option>
                  <option value="=">=</option>
                </select>
                
                <input
                  v-model="constraint.value"
                  type="number"
                  step="0.01"
                  class="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                  placeholder="0"
                />
                
                <button
                  type="button"
                  @click="removeConstraint(constraintIndex)"
                  :disabled="constraintsList.length <= 1"
                  class="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 disabled:opacity-50"
                >
                  Remover
                </button>
              </div>
            </div>

            <button
              type="button"
              @click="addConstraint"
              class="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
            >
              Adicionar Restrição
            </button>
          </div>

          <div class="text-center">
            <button
              type="submit"
              :disabled="loading"
              class="px-8 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-lg font-medium"
            >
              {{ loading ? 'Calculando...' : 'Resolver com Simplex' }}
            </button>
          </div>
        </form>

        <div v-if="error" class="mt-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
              </svg>
            </div>
            <div class="ml-3">
              <h3 class="text-sm font-medium text-red-800">Erro</h3>
              <div class="mt-2 text-sm text-red-700">
                <p>{{ error }}</p>
              </div>
            </div>
          </div>
        </div>

        <div v-if="solution" class="mt-6 p-6 bg-green-50 border border-green-200 rounded-md">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>
            </div>
            <div class="ml-3 flex-1">
              <h3 class="text-lg font-medium text-green-800 mb-2">Solução Ótima Encontrada</h3>
              <div class="space-y-2 text-sm text-green-700">
                <p class="font-medium">
                  Valor Ótimo: <span class="text-lg">{{ solution.optimalValue.toFixed(2) }}</span>
                </p>
                <div>
                  <p class="font-medium mb-1">Solução:</p>
                  <div class="grid grid-cols-2 md:grid-cols-3 gap-2">
                    <div v-for="(value, variable) in solution.optimalSolution" :key="variable" class="bg-white px-3 py-1 rounded">
                      {{ variable }} = {{ value.toFixed(2) }}
                    </div>
                  </div>
                </div>
                <p>Iterações realizadas: {{ solution.iterations }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template> 