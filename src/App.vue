<script setup>
import { ref, onMounted, computed } from 'vue';
import Board from './components/Board.vue';
import TaskCreationDump from './components/TaskCreationDump.vue';
import { supabase } from './supabase'; // Import Supabase client

const tickets = ref([]);
const loading = ref(true);
const errorMsg = ref(''); // For Supabase errors
const filterCategory = ref('all');
const showTaskDump = ref(false); // For toggling the new component

// Categories for filtering
const categories = [
  { id: 'all', label: 'All Categories' },
  { id: 'terminology', label: 'Global Terminology' },
  { id: 'supply-partners', label: 'Supply Partners' },
  { id: 'supply-packages', label: 'Supply Packages' }
];

// Helper to convert Supabase snake_case to camelCase for UI
function supabaseToCamelCase(ticket) {
  if (!ticket) return null;
  return {
    ...ticket,
    parentId: ticket.parent_id,
    isSubtask: ticket.is_subtask, 
  };
}

// Helper to convert UI camelCase to Supabase snake_case for DB operations
function camelCaseToSupabase(ticketDetails) {
  if (!ticketDetails) return null;
  const forSupabase = { ...ticketDetails };

  if (forSupabase.hasOwnProperty('parentId')) {
    forSupabase.parent_id = forSupabase.parentId;
    delete forSupabase.parentId;
  }
  if (forSupabase.hasOwnProperty('isSubtask')) {
    forSupabase.is_subtask = forSupabase.isSubtask;
    delete forSupabase.isSubtask;
  }
  // created_at and updated_at are generally handled by DB or set directly in ISOString format
  if (forSupabase.createdAt && forSupabase.createdAt instanceof Date) {
    forSupabase.created_at = forSupabase.createdAt.toISOString();
    // delete forSupabase.createdAt; // Keep if your DB schema doesn't auto-set it on insert and you rely on this value
  }
  if (forSupabase.updatedAt && forSupabase.updatedAt instanceof Date) {
    forSupabase.updated_at = forSupabase.updatedAt.toISOString();
    // delete forSupabase.updatedAt; // Keep if your DB schema doesn't auto-set it on update and you rely on this value
  }
  return forSupabase;
}

async function fetchTickets() {
  loading.value = true;
  errorMsg.value = '';
  try {
    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .order('category', { ascending: true })
      .order('section', { ascending: true })
      .order('parent_id', { ascending: true, nullsFirst: true })
      .order('title', { ascending: true });

    if (error) {
      console.error('Fetch error:', error.message);
      errorMsg.value = `Failed to load tickets: ${error.message}`;
      tickets.value = [];
    } else {
      tickets.value = (data || []).map(supabaseToCamelCase);
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
  const { id, ...camelCaseFieldsToUpdate } = updatedTicketData;
  if (!id) {
    errorMsg.value = "Update failed: Ticket ID is missing.";
    return;
  }

  const fieldsToUpdateForSupabase = camelCaseToSupabase(camelCaseFieldsToUpdate);

  loading.value = true;
  errorMsg.value = '';
  try {
    const { data, error } = await supabase
      .from('tickets')
      .update({ ...fieldsToUpdateForSupabase, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select();

    if (error) {
      console.error('Update error:', error.message);
      errorMsg.value = `Failed to update ticket: ${error.message}`;
      await fetchTickets(); 
    } else if (data && data.length > 0) {
      const updatedFromSupabase = supabaseToCamelCase(data[0]);
      const index = tickets.value.findIndex(t => t.id === id);
      if (index !== -1) tickets.value[index] = { ...tickets.value[index], ...updatedFromSupabase };
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
      await fetchTickets();
    } else if (data && data.length > 0) {
      const updatedFromSupabase = supabaseToCamelCase(data[0]);
      const index = tickets.value.findIndex(t => t.id === ticketId);
      if (index !== -1) tickets.value[index] = { ...tickets.value[index], ...updatedFromSupabase };
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

// Function to add a single ticket (can be reused by batch add)
async function addSingleTicket(newTicketDetails) { // Expects camelCase input
  const ticketToInsertForSupabase = camelCaseToSupabase(newTicketDetails);
  // Ensure ID is not sent if DB auto-generates and conflicts occur, or ensure it's unique if client-generated.
  // For LLM generated tickets, we might not have an ID yet, or might want to generate one.
  // delete ticketToInsertForSupabase.id; // If Supabase auto-generates IDs and you don't want to specify.

  const { data, error } = await supabase.from('tickets').insert([ticketToInsertForSupabase]).select();
  if (error) {
    console.error('Add single ticket error:', error.message, 'Details:', newTicketDetails);
    throw new Error(`Failed to add ticket '${newTicketDetails.title}': ${error.message}`);
  }
  if (data && data.length > 0) {
    return supabaseToCamelCase(data[0]);
  }
  return null;
}

// Modified handleAddTicket to use addSingleTicket (primarily for manual single additions if needed)
async function handleAddTicket(newTicketDetails) {
  loading.value = true; errorMsg.value = '';
  try {
    const addedTicket = await addSingleTicket(newTicketDetails);
    if (addedTicket) {
      tickets.value.push(addedTicket);
    }
  } catch (err) {
    console.error('Add exception:', err.message); errorMsg.value = err.message || `An unexpected error occurred during add.`;
  } finally { loading.value = false; }
}

// New function to handle adding multiple tickets from the dump
async function handleAddMultipleTickets(ticketsToAdd) { // Expects an array of camelCase ticket objects
  if (!ticketsToAdd || ticketsToAdd.length === 0) return;
  loading.value = true;
  errorMsg.value = '';
  let successfulAdds = 0;
  let failedAdds = [];

  for (const ticketDetail of ticketsToAdd) {
    try {
      // Important: LLM might not provide IDs or correct parent_ids initially.
      // We might need a pre-processing step if LLM generates parent tasks and subtasks together
      // to assign temporary client-side IDs to parents and then use those for parent_id in subtasks.
      // For now, assuming LLM provides flat structure or parent_id can be resolved.
      const addedTicket = await addSingleTicket(ticketDetail);
      if (addedTicket) {
        tickets.value.push(addedTicket);
        successfulAdds++;
      }
    } catch (err) {
      console.error(`Failed to add one of the tickets: ${ticketDetail.title}`, err.message);
      failedAdds.push({ title: ticketDetail.title, error: err.message });
    }
  }

  if (failedAdds.length > 0) {
    errorMsg.value = `Successfully added ${successfulAdds} tickets. Failed to add ${failedAdds.length} tickets. Check console for details.`;
  } else if (successfulAdds > 0) {
    // Optionally, set a success message for the dump component to show
  }
  // No explicit fetchTickets() here, as tickets are pushed individually.
  // Consider re-fetching if strict order or full consistency after batch is paramount.
  loading.value = false;
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
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <p class="text-gray-600">
          Track development tasks for the Bold Exchange Portal
        </p>
        <button 
          @click="showTaskDump = !showTaskDump"
          class="mb-4 px-4 py-2 text-sm font-medium text-white bg-gray-600 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
        >
          {{ showTaskDump ? 'Hide' : 'Show' }} Task Creation Dump
        </button>
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
    
    <TaskCreationDump v-if="showTaskDump" :onAddMultipleTickets="handleAddMultipleTickets" />

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