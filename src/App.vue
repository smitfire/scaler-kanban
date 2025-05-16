<script setup>
import { ref, onMounted, computed } from 'vue';
// import { v4 as uuidv4 } from 'uuid'; // We'll use Supabase-generated or pre-seeded IDs
import Board from './components/Board.vue';
// import { parseTickets } from './utils/ticketParser'; // Data will come from Supabase
import { supabase } from './supabase'; // Import Supabase client

const tickets = ref([]);
const loading = ref(true);
const errorMsg = ref(''); // For Supabase errors
const filterCategory = ref('all');

// Categories for filtering
const categories = [
  { id: 'all', label: 'All Categories' },
  { id: 'terminology', label: 'Global Terminology' },
  { id: 'supply-partners', label: 'Supply Partners' },
  { id: 'supply-packages', label: 'Supply Packages' }
];

async function fetchTickets() {
  loading.value = true;
  errorMsg.value = '';
  try {
    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Fetch error:', error.message);
      errorMsg.value = `Failed to load tickets: ${error.message}`;
      tickets.value = [];
    } else {
      tickets.value = data || [];
    }
  } catch (err) {
    console.error('Fetch exception:', err.message);
    errorMsg.value = `An unexpected error occurred during fetch.`;
    tickets.value = [];
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  fetchTickets();
});

// Filter tickets by category
const filteredTickets = computed(() => {
  if (filterCategory.value === 'all') {
    return tickets.value;
  }
  return tickets.value.filter(ticket => ticket.category === filterCategory.value);
});

// Handle ticket updates (e.g., title, description change from Board component)
async function updateTicket(updatedTicketData) {
  const { id, ...fieldsToUpdate } = updatedTicketData;
  if (!id) {
    errorMsg.value = "Update failed: Ticket ID is missing.";
    return;
  }
  loading.value = true;
  errorMsg.value = '';
  try {
    const { data, error } = await supabase
      .from('tickets')
      .update({ ...fieldsToUpdate, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select();
    if (error) {
      console.error('Update error:', error.message);
      errorMsg.value = `Failed to update ticket: ${error.message}`;
      await fetchTickets(); // Re-fetch to ensure UI consistency on error
    } else if (data && data.length > 0) {
      const index = tickets.value.findIndex(t => t.id === id);
      if (index !== -1) tickets.value[index] = { ...tickets.value[index], ...data[0] };
      else await fetchTickets();
    } else {
      await fetchTickets();
    }
  } catch (err) {
    console.error('Update exception:', err.message);
    errorMsg.value = `An unexpected error occurred during update.`;
  } finally {
    loading.value = false;
  }
}

// Handle ticket status changes (e.g., from drag and drop in Board component)
async function updateTicketStatus(ticketId, newStatus) {
  if (!ticketId) {
    errorMsg.value = "Status update failed: Ticket ID is missing.";
    return;
  }
  loading.value = true;
  errorMsg.value = '';
  try {
    const { data, error } = await supabase
      .from('tickets')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', ticketId)
      .select();
    if (error) {
      console.error('Status update error:', error.message);
      errorMsg.value = `Failed to update status: ${error.message}`;
      await fetchTickets(); // Re-fetch for consistency
    } else if (data && data.length > 0) {
      const index = tickets.value.findIndex(t => t.id === ticketId);
      if (index !== -1) tickets.value[index] = { ...tickets.value[index], ...data[0] };
      else await fetchTickets();
    } else {
      await fetchTickets();
    }
  } catch (err) {
    console.error('Status update exception:', err.message);
    errorMsg.value = `An unexpected error occurred during status update.`;
  } finally {
    loading.value = false;
  }
}

// Placeholder for adding a new ticket
// You'll need to call this function from your UI (e.g., a button in Board.vue or a new component)
// and pass the necessary ticket data.
// import { v4 as uuidv4 } from 'uuid'; // If you need to generate ID client-side for some reason
async function handleAddTicket(newTicketDetails) {
  loading.value = true;
  errorMsg.value = '';
  try {
    const ticketToInsert = {
      ...newTicketDetails,
      is_subtask: newTicketDetails.is_subtask || false,
      parent_id: newTicketDetails.parent_id || null,
    };
    const { data, error } = await supabase
      .from('tickets')
      .insert([ticketToInsert])
      .select();
    if (error) {
      console.error('Add error:', error.message);
      errorMsg.value = `Failed to add ticket: ${error.message}`;
    } else if (data && data.length > 0) {
      tickets.value.push(data[0]);
    }
  } catch (err) {
    console.error('Add exception:', err.message);
    errorMsg.value = `An unexpected error occurred during add.`;
  } finally {
    loading.value = false;
  }
}

// Placeholder for deleting a ticket
// You'll need to call this from your UI
async function handleDeleteTicket(ticketId) {
  if (!ticketId) {
    errorMsg.value = "Delete failed: Ticket ID is missing.";
    return;
  }
  // Optional: Confirm deletion with user
  // if (!confirm('Are you sure you want to delete this ticket?')) return;

  loading.value = true;
  errorMsg.value = '';
  try {
    const { error } = await supabase.from('tickets').delete().eq('id', ticketId);
    if (error) {
      console.error('Delete error:', error.message);
      errorMsg.value = `Failed to delete ticket: ${error.message}`;
    } else {
      tickets.value = tickets.value.filter(t => t.id !== ticketId);
    }
  } catch (err) {
    console.error('Delete exception:', err.message);
    errorMsg.value = `An unexpected error occurred during delete.`;
  } finally {
    loading.value = false;
  }
}

</script>

<template>
  <div class="container mx-auto px-4 py-8">
    <header class="mb-8">
      <h1 class="text-3xl font-bold text-gray-800 mb-4">Bold Collective Kanban Board</h1>
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <p class="text-gray-600">
          Track development tasks for the Bold Exchange Portal
        </p>
        <!-- Example Add Ticket Button - you'll need to style and integrate this better -->
        <!-- <button 
          @click="() => handleAddTicket({ title: 'Test Add ' + Date.now(), status: 'todo', category: 'terminology', description: 'A test ticket' })" 
          class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          Add Test Ticket
        </button> -->
        <div class="flex items-center space-x-2">
          <label for="category-filter" class="text-sm font-medium text-gray-700">Filter by:</label>
          <select 
            id="category-filter" 
            v-model="filterCategory"
            class="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option v-for="category in categories" :key="category.id" :value="category.id">
              {{ category.label }}
            </option>
          </select>
        </div>
      </div>
    </header>
    
    <main>
      <div v-if="loading && !tickets.length" class="flex justify-center items-center h-64">
        <p class="text-gray-500 text-lg">Loading tickets...</p>
      </div>
      <div v-if="errorMsg" class="my-4 p-4 bg-red-100 text-red-700 border border-red-400 rounded-md shadow-sm">
        <strong>Error:</strong> {{ errorMsg }}
      </div>
      
      <Board 
        v-if="(!loading && tickets.length) || (loading && tickets.length)" 
        :tickets="filteredTickets"
        @update-ticket="updateTicket" 
        @update-status="updateTicketStatus"
        @add-ticket-event="handleAddTicket" 
        @delete-ticket-event="handleDeleteTicket"
      />
      <!-- Note: The Board component will need to emit @add-ticket-event and @delete-ticket-event -->
      <!-- These events should pass the necessary data (ticket details for add, ticketId for delete) -->

       <div v-if="!loading && !tickets.length && !errorMsg" class="text-center py-10">
        <p class="text-gray-500 text-lg">No tickets found. Try adding one!</p>
        <!-- You could place an add button here as well -->
      </div>
    </main>
  </div>
</template> 