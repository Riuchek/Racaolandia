<script lang="ts" setup>
const constraints = ref<string>('')
const variable = ref<string>('')
const constraintsList = ref<string[]>([])
const variablesList = ref<string[]>([])
const objective = ref('maximize')
const loading = ref(false)
const error = ref(false)
const success = ref(false)
const solution = ref<{
  optimalValue: number
  optimalSolution: Record<string, number>
  iterations: number
} | null>(null)

const addConstraint = () => {
  constraintsList.value.push(constraints.value)
}

const removeConstraint = (index: number) => {
  constraintsList.value.splice(index, 1)
}

const addVariable = () => {
  variablesList.value.push(variable.value)
}

const removeVariable = (index: number) => {
  variablesList.value.splice(index, 1)
}

const constraintsValues = ref<number[]>([])
const constraintsOperators = ref<string[]>([])

const handleSubmit = async () => {
  loading.value = true
  error.value = false
  success.value = false
  solution.value = null

  try {
    // Format constraints with operators and values
    const formattedConstraints = constraintsList.value.map((constraint, index) => {
      return `${constraint} ${constraintsOperators.value[index]} ${constraintsValues.value[index]}`
    })

    const response = await $fetch('/api/reports', {
      method: 'POST',
      body: {
        objective: objective.value,
        variables: variablesList.value,
        constraints: formattedConstraints,
        maximize: objective.value === 'maximize'
      }
    }) as { success?: boolean, solution?: any }

    if (response && response.success) {
      success.value = true
      solution.value = response.solution
    } else {
      error.value = true
    }
  } catch (err) {
    error.value = true
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-2xl w-full space-y-8 bg-white p-8 rounded-lg shadow">
      <div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
          RaçãoLandia - Simplex
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600">
          Digite suas variaveis e restrições.
        </p>
      </div>

      <form class="mt-8 space-y-6" @submit.prevent="handleSubmit">
        <div class="flex justify-center gap-6 mt-4">
          <label class="inline-flex items-center">
            <input
              type="radio"
              class="form-radio text-indigo-600"
              name="objective"
              value="maximize"
              v-model="objective"
            />
            <span class="ml-2 text-gray-700">Maximizar</span>
          </label>
          <label class="inline-flex items-center">
            <input
              type="radio"
              class="form-radio text-indigo-600"
              name="objective"
              value="minimize"
              v-model="objective"
            />
            <span class="ml-2 text-gray-700">Minimizar</span>
          </label>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700">Variáveis</label>
          <div v-for="(variable, index) in variablesList" :key="index" class="mt-2 flex gap-2">
            <input
              v-model="variablesList[index]"
              type="text"
              placeholder="ração"
              class="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
            <button
              type="button"
              @click="removeVariable(index)"
              class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Remover
            </button>
          </div>
          <button
            type="button"
            @click="addVariable"
            class="mt-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Adicionar Variável
          </button>
        </div>

        <div class="rounded-md shadow-sm space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700">Restrições</label>
            <p v-if="variablesList.length === 0" class="mt-2 text-sm text-gray-500">
              Adicione pelo menos uma variável antes de criar restrições
            </p>

            <div v-else v-for="(constraint, index) in constraintsList" :key="index" class="mt-2 flex gap-2">
              <input
                v-model="constraintsList[index]"
                type="text"
                :placeholder="`Ex: ${variablesList.join(' + ')}`"
                class="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
              <select
                v-model="constraintsOperators[index]"
                class="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="<">Maior que (<)</option>
                <option value=">">Menor que (>)</option>
                <option value="=">Igual a (=)</option>
                <option value=">=">Maior ou igual a (>=)</option>
                <option value="<=">Menor ou igual a (<=)</option>
              </select>
              <input
                v-model="constraintsValues[index]"
                type="number"
                placeholder="10"
                class="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
              <button
                type="button"
                @click="removeConstraint(index)"
                class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Remover
              </button>
            </div>

            <button
              type="button"
              @click="addConstraint"
              :disabled="variablesList.length === 0"
              class="mt-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Adicionar Restrição
            </button>
          </div>
        </div>

        <div>
          <button
            type="submit"
            :disabled="loading"
            class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ loading ? 'Otimizando...' : 'Otimizar' }}
          </button>
        </div>

        <div v-if="error" class="rounded-md bg-red-50 p-4">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
              </svg>
            </div>
            <div class="ml-3">
              <h3 class="text-sm font-medium text-red-800">Erro ao otimizar</h3>
              <div class="mt-2 text-sm text-red-700">
                <p>Ocorreu um erro ao processar a otimização. Verifique suas restrições e tente novamente.</p>
              </div>
            </div>
          </div>
        </div>

        <div v-if="solution" class="rounded-md bg-green-50 p-4">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>
            </div>
            <div class="ml-3">
              <h3 class="text-sm font-medium text-green-800">Solução Ótima Encontrada</h3>
              <div class="mt-2 text-sm text-green-700">
                <p class="font-medium">Valor Ótimo: {{ solution.optimalValue.toFixed(2) }}</p>
                <p class="mt-1">Solução:</p>
                <ul class="list-disc pl-5 mt-1">
                  <li v-for="(value, variable) in solution.optimalSolution" :key="variable">
                    {{ variable }} = {{ value.toFixed(2) }}
                  </li>
                </ul>
                <p class="mt-1">Iterações: {{ solution.iterations }}</p>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  </div>
</template> 