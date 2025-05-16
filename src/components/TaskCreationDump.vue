<template>
  <div>
    <h2 class="text-2xl font-bold mb-4 text-gray-800">Task Creation Dump</h2>
    <p class="text-sm text-gray-600 mb-4">
      Paste a block of text describing tasks, and the AI will attempt to create tickets.
    </p>
    <textarea
      v-model="rawText"
      rows="10"
      class="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow"
      placeholder="Paste your task descriptions here..."
    ></textarea>
    <div class="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
      <button
        type="button"
        @click="generateTickets"
        :disabled="isLoading || !rawText.trim()"
        class="inline-flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:col-start-2 sm:text-sm disabled:opacity-50"
      >
        <span v-if="isLoading">Processing...</span>
        <span v-else>Generate Tickets</span>
      </button>
      <button 
        type="button"
        @click="emits('close-modal')" 
        class="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:mt-0 sm:col-start-1 sm:text-sm"
      >
        Cancel
      </button>
    </div>
    <div v-if="errorMsg" class="mt-4 p-3 bg-red-100 text-red-700 border border-red-300 rounded-md text-sm">
      <strong>Error:</strong> {{ errorMsg }}
    </div>
    <div v-if="successMsg" class="mt-4 p-3 bg-green-100 text-green-700 border border-green-300 rounded-md text-sm">
      {{ successMsg }}
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({
  onAddMultipleTickets: {
    type: Function,
    required: true,
  },
});

const emits = defineEmits(['close-modal']);

const rawText = ref('');
const isLoading = ref(false);
const errorMsg = ref('');
const successMsg = ref('');

// This is a placeholder for the actual Anthropic API key if we were to use it client-side (NOT RECOMMENDED)
// The actual key will be used in the Netlify serverless function.
// const anthropicApiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;

async function generateTickets() {
  if (!rawText.value.trim()) {
    errorMsg.value = 'Please paste some text to generate tickets.';
    return;
  }

  isLoading.value = true;
  errorMsg.value = '';
  successMsg.value = '';

  try {
    // console.log('Sending to Netlify function:', rawText.value);
    // console.log('VITE_ANTHROPIC_API_KEY (available client-side if set, for info only):', import.meta.env.VITE_ANTHROPIC_API_KEY);

    const response = await fetch('/.netlify/functions/create-tickets-from-text', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: rawText.value }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(errorData.message || `Server responded with status ${response.status}`);
    }

    const result = await response.json();
    // console.log('Received from Netlify function:', result);

    if (result.error) {
      throw new Error(result.error);
    }

    if (result.tickets && result.tickets.length > 0) {
      await props.onAddMultipleTickets(result.tickets);
      successMsg.value = `${result.tickets.length} ticket(s) submitted successfully! Check the board.`;
      rawText.value = '';
    } else {
      errorMsg.value = 'AI did not return any tickets. Try rephrasing your text.';
    }

  } catch (err) {
    console.error('Error generating tickets:', err);
    errorMsg.value = err.message || 'An unexpected error occurred.';
  } finally {
    isLoading.value = false;
  }
}
</script> 