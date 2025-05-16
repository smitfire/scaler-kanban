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
      console.error('Error fetching tickets:', error);
      errorMsg.value = `Failed to load tickets: ${error.message}`;
      tickets.value = [];
    } else {
      tickets.value = data || [];
    }
  } catch (err) {
    console.error('Supabase call failed during fetch:', err);
    errorMsg.value = `An unexpected error occurred: ${err.message}`;
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
  // Assuming updatedTicketData contains at least the id and fields to be updated
  const { id, ...fieldsToUpdate } = updatedTicketData;

  if (!id) {
    console.error("Update failed: Ticket ID is missing.");
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
      console.error('Error updating ticket:', error);
      errorMsg.value = `Failed to update ticket: ${error.message}`;
      // Optionally, re-fetch to revert optimistic update or ensure consistency
      // await fetchTickets(); 
    } else if (data && data.length > 0) {
      const index = tickets.value.findIndex(t => t.id === id);
      if (index !== -1) {
        tickets.value[index] = { ...tickets.value[index], ...data[0] };
      } else {
        // If not found, might be a new ticket or an issue, re-fetch for safety
        await fetchTickets();
      }
    } else {
       // If no data is returned but no error, it's unusual. Re-fetch.
       await fetchTickets();
    }
  } catch (err) {
    console.error('Supabase call failed during update:', err);
    errorMsg.value = `An unexpected error occurred: ${err.message}`;
  } finally {
    loading.value = false;
  }
}

// Handle ticket status changes (e.g., from drag and drop in Board component)
async function updateTicketStatus(ticketId, newStatus) {
  if (!ticketId) {
    console.error("Status update failed: Ticket ID is missing.");
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
      console.error('Error updating ticket status:', error);
      errorMsg.value = `Failed to update status: ${error.message}`;
      // Optionally, re-fetch
      // await fetchTickets();
    } else if (data && data.length > 0) {
      const index = tickets.value.findIndex(t => t.id === ticketId);
      if (index !== -1) {
         tickets.value[index] = { ...tickets.value[index], ...data[0] };
      } else {
        await fetchTickets();
      }
    } else {
      await fetchTickets();
    }
  } catch (err) {
    console.error('Supabase call failed during status update:', err);
    errorMsg.value = `An unexpected error occurred: ${err.message}`;
  } finally {
    loading.value = false;
  }
}

// Placeholder for adding a new ticket
// You'll need to call this function from your UI (e.g., a button in Board.vue or a new component)
// and pass the necessary ticket data.
// import { v4 as uuidv4 } from 'uuid'; // If you need to generate ID client-side for some reason
async function handleAddTicket(newTicketDetails) {
  // Example: newTicketDetails = { title: 'New Task', description: 'Details', category: 'supply-partners', status: 'todo' }
  loading.value = true;
  errorMsg.value = '';
  try {
    const ticketToInsert = {
      // id: uuidv4(), // Supabase can auto-generate UUID if column default is set, or use client-generated like in seed
      ...newTicketDetails,
      is_subtask: newTicketDetails.is_subtask || false,
      parent_id: newTicketDetails.parent_id || null,
      // created_at and updated_at will be handled by Supabase or triggers
    };

    const { data, error } = await supabase
      .from('tickets')
      .insert([ticketToInsert])
      .select();

    if (error) {
      console.error('Error adding ticket:', error);
      errorMsg.value = `Failed to add ticket: ${error.message}`;
    } else if (data && data.length > 0) {
      tickets.value.push(data[0]); // Add to local list
      // Or await fetchTickets();
    }
  } catch (err) {
    console.error('Supabase call failed during add:', err);
    errorMsg.value = `An unexpected error occurred: ${err.message}`;
  } finally {
    loading.value = false;
  }
}

// Placeholder for deleting a ticket
// You'll need to call this from your UI
async function handleDeleteTicket(ticketId) {
  if (!ticketId) {
    console.error("Delete failed: Ticket ID is missing.");
    errorMsg.value = "Delete failed: Ticket ID is missing.";
    return;
  }
  // Optional: Confirm deletion with user
  // if (!confirm('Are you sure you want to delete this ticket?')) return;

  loading.value = true;
  errorMsg.value = '';
  try {
    const { error } = await supabase
      .from('tickets')
      .delete()
      .eq('id', ticketId);

    if (error) {
      console.error('Error deleting ticket:', error);
      errorMsg.value = `Failed to delete ticket: ${error.message}`;
    } else {
      tickets.value = tickets.value.filter(t => t.id !== ticketId); // Remove from local list
      // Or await fetchTickets();
    }
  } catch (err) {
    console.error('Supabase call failed during delete:', err);
    errorMsg.value = `An unexpected error occurred: ${err.message}`;
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
        <!-- Add Ticket Button Example (you'll need to style and position this appropriately) -->
        <!-- <button @click="() => handleAddTicket({ title: 'Test Add ' + Date.now(), status: 'todo', category: 'terminology' })" class="bg-blue-500 text-white px-3 py-1 rounded">Add Test Ticket</button> -->
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
      <div v-if="loading && !tickets.length" class="flex justify-center items-center h-64">
        <p class="text-gray-500">Loading tickets...</p>
      </div>
      <div v-if="errorMsg" class="my-4 p-3 bg-red-100 text-red-700 border border-red-300 rounded">
        <strong>Error:</strong> {{ errorMsg }}
      </div>
      <Board 
        v-if="!loading || tickets.length" 
        :tickets="filteredTickets"
        @update-ticket="updateTicket" 
        @update-status="updateTicketStatus"
        <!-- You might need to pass handleAddTicket and handleDeleteTicket as props or handle events -->
        <!-- Example: @delete-ticket-event="handleDeleteTicket" -->
      />
       <div v-if="!loading && !tickets.length && !errorMsg" class="text-center py-8">
        <p class="text-gray-500">No tickets found. Try adding one!</p>
      </div>
    </main>
  </div>
</template> 