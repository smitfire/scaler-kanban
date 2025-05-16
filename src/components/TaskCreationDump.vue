<template>
  <div class="my-6 p-4 border border-gray-300 rounded-lg shadow">
    <h2 class="text-xl font-semibold mb-3 text-gray-700">Task Creation Dump</h2>
    <p class="text-sm text-gray-600 mb-3">
      Paste a block of text describing tasks, and the AI will attempt to create tickets.
    </p>
    <textarea
      v-model="rawText"
      rows="10"
      class="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
      placeholder="Paste your task descriptions here..."
    ></textarea>
    <button
      @click="generateTickets"
      :disabled="isLoading || !rawText.trim()"
      class="mt-3 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
    >
      <span v-if="isLoading">Processing...</span>
      <span v-else>Generate Tickets</span>
    </button>
    <div v-if="errorMsg" class="mt-3 p-3 bg-red-100 text-red-700 border border-red-300 rounded-md">
      <strong>Error:</strong> {{ errorMsg }}
    </div>
    <div v-if="successMsg" class="mt-3 p-3 bg-green-100 text-green-700 border border-green-300 rounded-md">
      {{ successMsg }}
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({
  // This function will be passed from App.vue to add multiple tickets
  onAddMultipleTickets: {
    type: Function,
    required: true,
  },
});

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
      await props.onAddMultipleTickets(result.tickets); // Call the batch add function
      successMsg.value = `${result.tickets.length} ticket(s) generated and submitted successfully!`;
      rawText.value = ''; // Clear input after success
    } else {
      errorMsg.value = 'AI did not return any tickets. Try rephrasing your text or check the format.';
    }

  } catch (err) {
    console.error('Error generating tickets:', err);
    errorMsg.value = err.message || 'An unexpected error occurred.';
  } finally {
    isLoading.value = false;
  }
}
</script> 