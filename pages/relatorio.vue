<script lang="ts" setup>
const constraints = ref<string>('')
const variable = ref<string>('')
const constraintsList = ref<string[]>([])
const variablesList = ref<string[]>([])
const objective = ref('maximize')

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

const handleSubmit = () => {
  
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

        <div class="rounded-md shadow-sm space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700">Restrições</label>

            <div v-for="(constraint, index) in constraintsList" :key="index" class="mt-2 flex gap-2">
              <input
                v-model="constraintsList[index]"
                type="text"
                placeholder="e.g., ração + peixe <= 10"
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
              class="mt-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Adicionar Restrição
            </button>

          </div>
        </div>

        <div>
            <label class="block text-sm font-medium text-gray-700">Variaveis</label>
            <div v-for="(variable, index) in variablesList" :key="index" class="mt-2 flex gap-2">
              <input
                v-model="variablesList[index]"
                type="text"
                placeholder="e.g., ração, peixe, etc."
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
              Adicionar Variavel
            </button>
          </div>
        <div>
          <button
            type="submit"
            class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Resolver
          </button>
        </div>
      </form>
    </div>
  </div>
</template> 