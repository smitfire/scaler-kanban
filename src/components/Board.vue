<script setup>
import { ref, computed } from 'vue';
import Column from './Column.vue';

const props = defineProps({
  tickets: {
    type: Array,
    required: true
  }
});

const emit = defineEmits(['update-ticket', 'update-status']);

// Define the columns for the board
const columns = [
  { id: 'todo', title: 'Todo', color: 'bg-todo' },
  { id: 'inProgress', title: 'In Progress', color: 'bg-inProgress' },
  { id: 'done', title: 'Done', color: 'bg-done' }
];

// Group tickets by status
const ticketsByStatus = computed(() => {
  const grouped = {
    todo: [],
    inProgress: [],
    done: []
  };
  
  props.tickets.forEach(ticket => {
    if (grouped[ticket.status]) {
      grouped[ticket.status].push(ticket);
    } else {
      // Default to todo if status is invalid
      grouped.todo.push({...ticket, status: 'todo'});
    }
  });
  
  return grouped;
});

// Handle ticket dropped in a column
const handleDrop = (ticketId, newStatus) => {
  emit('update-status', ticketId, newStatus);
};
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    <Column
      v-for="column in columns"
      :key="column.id"
      :id="column.id"
      :title="column.title"
      :color="column.color"
      :tickets="ticketsByStatus[column.id]"
      @drop="handleDrop"
      @update-ticket="$emit('update-ticket', $event)"
    />
  </div>
</template> 