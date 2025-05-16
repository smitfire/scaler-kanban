<script setup>
import { ref, onMounted, computed } from 'vue';
import Board from './components/Board.vue';
import TaskCreationDump from './components/TaskCreationDump.vue';
import { supabase } from './supabase'; // Import Supabase client

const tickets = ref([]);
const loading = ref(true);
const errorMsg = ref(''); // For Supabase errors
const filterCategory = ref('all');
const showTaskDumpModal = ref(false); // Renamed for clarity: controls modal visibility

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
    // This message will be displayed in App.vue, TaskCreationDump has its own success message.
    // You might want to clear this or use a different ref if TaskCreationDump handles all success UX for this flow.
    // For now, clearing it to avoid duplicate success messages.
    // errorMsg.value = `Successfully added ${successfulAdds} tickets.`; 
  }
  // No explicit fetchTickets() here, as tickets are pushed individually.
  // Consider re-fetching if strict order or full consistency after batch is paramount.
  loading.value = false;
  // After batch add, close the modal
  showTaskDumpModal.value = false; 
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
  <div class="container mx-auto px-4 py-8 relative min-h-screen">
    <header class="mb-6">
      <div class="flex justify-between items-center mb-4">
        <h1 class="text-3xl font-bold text-gray-800">Nick kanban board</h1>
        <div class="flex items-center space-x-2">
            <label for="category-filter" class="text-sm font-medium text-gray-700">Filter by:</label>
            <select id="category-filter" v-model="filterCategory" class="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
              <option v-for="category_item in categories" :key="category_item.id" :value="category_item.id">{{ category_item.label }}</option>
            </select>
        </div>
      </div>
      
      <!-- Prominent Task Creation Dump Button -->
      <div class="mt-6 mb-6 text-left"> <!-- Changed to text-left, or use text-center for centered button -->
        <button 
          @click="showTaskDumpModal = true"
          title="Paste text to automatically create multiple tasks using AI."
          class="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-transform transform hover:scale-105"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6 mr-3">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          AI Task Creation Dump
        </button>
      </div>
    </header>
    
    <!-- Task Creation Dump Modal -->
    <div v-if="showTaskDumpModal" class="fixed inset-0 bg-gray-800 bg-opacity-75 transition-opacity flex items-center justify-center z-50 p-4">
      <div class="relative bg-white rounded-lg shadow-xl transform transition-all sm:max-w-2xl sm:w-full">
        <div class="absolute top-0 right-0 pt-4 pr-4">
          <button @click="showTaskDumpModal = false" type="button" class="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            <span class="sr-only">Close</span>
            <svg class="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div class="p-6">
          <TaskCreationDump :onAddMultipleTickets="handleAddMultipleTickets" @close-modal="showTaskDumpModal = false" />
        </div>
      </div>
    </div>

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