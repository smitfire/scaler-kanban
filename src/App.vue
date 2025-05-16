<script setup>
import { ref, onMounted, computed } from 'vue';
import { v4 as uuidv4 } from 'uuid';
import Board from './components/Board.vue';
import { parseTickets } from './utils/ticketParser';

const tickets = ref([]);
const loading = ref(true);
const filterCategory = ref('all');

// Categories for filtering
const categories = [
  { id: 'all', label: 'All Categories' },
  { id: 'terminology', label: 'Global Terminology' },
  { id: 'supply-partners', label: 'Supply Partners' },
  { id: 'supply-packages', label: 'Supply Packages' }
];

// Load tickets from localStorage or initialize with default data
onMounted(() => {
  const savedTickets = localStorage.getItem('tickets');
  
  if (savedTickets) {
    tickets.value = JSON.parse(savedTickets);
  } else {
    // Parse the initial tickets from requirements
    tickets.value = parseTickets();
  }
  
  loading.value = false;
});

// Save tickets to localStorage whenever they change
const saveTickets = () => {
  localStorage.setItem('tickets', JSON.stringify(tickets.value));
};

// Filter tickets by category
const filteredTickets = computed(() => {
  if (filterCategory.value === 'all') {
    return tickets.value;
  }
  return tickets.value.filter(ticket => ticket.category === filterCategory.value);
});

// Handle ticket updates
const updateTicket = (updatedTicket) => {
  const index = tickets.value.findIndex(t => t.id === updatedTicket.id);
  if (index !== -1) {
    tickets.value[index] = updatedTicket;
    saveTickets();
  }
};

// Handle ticket status changes
const updateTicketStatus = (ticketId, newStatus) => {
  const ticket = tickets.value.find(t => t.id === ticketId);
  if (ticket) {
    ticket.status = newStatus;
    ticket.updatedAt = new Date();
    saveTickets();
  }
};
</script>

<template>
  <div class="container mx-auto px-4 py-8">
    <header class="mb-8">
      <h1 class="text-3xl font-bold text-gray-800 mb-4">Bold Collective Kanban Board</h1>
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <p class="text-gray-600">
          Track development tasks for the Bold Exchange Portal
        </p>
        <div class="flex items-center space-x-2">
          <label for="category-filter" class="text-sm font-medium text-gray-700">Filter by:</label>
          <select 
            id="category-filter" 
            v-model="filterCategory"
            class="border border-gray-300 rounded-md px-3 py-1 text-sm"
          >
            <option v-for="category in categories" :key="category.id" :value="category.id">
              {{ category.label }}
            </option>
          </select>
        </div>
      </div>
    </header>
    
    <main>
      <div v-if="loading" class="flex justify-center items-center h-64">
        <p class="text-gray-500">Loading tickets...</p>
      </div>
      <Board 
        v-else
        :tickets="filteredTickets"
        @update-ticket="updateTicket"
        @update-status="updateTicketStatus"
      />
    </main>
  </div>
</template> 