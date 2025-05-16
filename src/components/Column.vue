<script setup>
import { ref } from 'vue';
import Ticket from './Ticket.vue';

const props = defineProps({
  id: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  color: {
    type: String,
    required: true
  },
  tickets: {
    type: Array,
    required: true
  }
});

const emit = defineEmits(['drop', 'update-ticket']);

// Drag and drop functionality
const isDragOver = ref(false);

const handleDragOver = (e) => {
  e.preventDefault();
  isDragOver.value = true;
};

const handleDragLeave = () => {
  isDragOver.value = false;
};

const handleDrop = (e) => {
  e.preventDefault();
  isDragOver.value = false;
  
  const ticketId = e.dataTransfer.getData('ticketId');
  if (ticketId) {
    emit('drop', ticketId, props.id);
  }
};
</script>

<template>
  <div 
    class="ticket-column"
    :class="{ 'border-2 border-dashed border-primary': isDragOver }"
    @dragover="handleDragOver"
    @dragleave="handleDragLeave"
    @drop="handleDrop"
  >
    <div class="flex items-center mb-4">
      <div :class="['w-4 h-4 rounded-full mr-2', color]"></div>
      <h2 class="text-lg font-semibold text-gray-700">{{ title }}</h2>
      <span class="ml-2 bg-gray-200 text-gray-700 text-xs font-medium px-2 py-0.5 rounded-full">
        {{ tickets.length }}
      </span>
    </div>
    
    <div class="space-y-3">
      <Ticket
        v-for="ticket in tickets"
        :key="ticket.id"
        :ticket="ticket"
        @update-ticket="$emit('update-ticket', $event)"
      />
      
      <div v-if="tickets.length === 0" class="text-center py-8 text-gray-400 italic">
        No tickets in this column
      </div>
    </div>
  </div>
</template> 