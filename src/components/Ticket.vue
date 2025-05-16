<script setup>
import { ref } from 'vue';

const props = defineProps({
  ticket: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['update-ticket']);

// For showing/hiding ticket details
const isExpanded = ref(false);
const toggleExpand = () => {
  isExpanded.value = !isExpanded.value;
};

// For drag and drop functionality
const handleDragStart = (e) => {
  e.dataTransfer.setData('ticketId', props.ticket.id);
  e.dataTransfer.effectAllowed = 'move';
};
</script>

<template>
  <div 
    :class="[
      'ticket-card', 
      ticket.status,
      ticket.category,
      { 'ml-4': ticket.isSubtask }
    ]"
    draggable="true"
    @dragstart="handleDragStart"
    @click="toggleExpand"
  >
    <div class="flex justify-between items-start">
      <div>
        <div class="flex gap-2 mb-1">
          <!-- Category badge -->
          <span 
            :class="[
              'badge', 
              {
                'bg-terminology/20 text-terminology': ticket.category === 'terminology',
                'bg-supply-partners/20 text-supply-partners': ticket.category === 'supply-partners',
                'bg-supply-packages/20 text-supply-packages': ticket.category === 'supply-packages'
              }
            ]"
          >
            {{ ticket.category === 'terminology' ? 'Terminology' : 
               ticket.category === 'supply-partners' ? 'Supply Partners' : 
               ticket.category === 'supply-packages' ? 'Supply Packages' : 
               'Other' }}
          </span>
          
          <!-- Section badge if available -->
          <span v-if="ticket.section" class="badge bg-gray-100 text-gray-600">
            {{ ticket.section }}
          </span>
        </div>
        
        <h3 class="font-medium text-gray-800">{{ ticket.title }}</h3>
      </div>
      
      <!-- Subtask indicator -->
      <div v-if="ticket.isSubtask" class="text-xs text-gray-500">
        Subtask
      </div>
    </div>
    
    <!-- Expanded content -->
    <div v-if="isExpanded" class="mt-3 pt-3 border-t border-gray-100">
      <p class="text-sm text-gray-600 whitespace-pre-line">{{ ticket.description }}</p>
      
      <div class="mt-3 text-xs text-gray-500">
        <div>Created: {{ new Date(ticket.createdAt).toLocaleDateString() }}</div>
        <div>Updated: {{ new Date(ticket.updatedAt).toLocaleDateString() }}</div>
      </div>
    </div>
  </div>
</template> 