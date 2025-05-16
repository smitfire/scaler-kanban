# Bold Collective Kanban Board

A lightweight, client-side Kanban board application for tracking development tasks for the Bold Exchange Portal.

## Features

- Three-column Kanban board (Todo, In Progress, Done)
- Drag and drop tickets between columns
- Hierarchical ticket structure with subtasks
- Filtering by category
- Fully responsive design
- Data persistence using localStorage

## Design Decisions

### Tech Stack

- **Vue.js**: Chosen for its lightweight nature, reactivity system, and component-based architecture, making it perfect for building interactive UIs like a Kanban board.
- **Tailwind CSS**: Used for utility-first styling to create a clean, responsive design without writing custom CSS.
- **Vite**: Selected as the build tool for fast development and optimized production builds.
- **localStorage**: For data persistence without requiring a backend server.

### Data Structure

Tickets are structured to represent the hierarchical nature of tasks:

```javascript
{
  id: String,           // Unique identifier
  title: String,        // Short description of the task
  description: String,  // Detailed description
  status: String,       // "todo", "inProgress", "done"
  category: String,     // e.g., "Global Terminology", "Supply Partners", "Supply Packages"
  section: String,      // e.g., "Main Table Screen", "Edit Drawer", etc.
  isSubtask: Boolean,   // Whether this is a subtask of another ticket
  parentId: String,     // ID of parent ticket if this is a subtask
  createdAt: Date,      // When the ticket was created
  updatedAt: Date       // When the ticket was last updated
}
```

### UI/UX Considerations

- **Card-based Design**: Each ticket is represented as a card with clear visual hierarchy.
- **Color Coding**: Different categories have distinct colors for quick identification.
- **Responsive Layout**: Adapts to different screen sizes (desktop, tablet, mobile).
- **Progress Indicators**: Visual feedback for task completion.

### Extensibility

The application is designed to be easily extensible:
- Additional columns can be added by modifying the columns array
- New ticket properties can be included by extending the ticket data model
- The filtering system can be expanded to include more criteria

## Getting Started

1. Clone the repository
2. Run `npm install` to install dependencies
3. Run `npm run dev` to start the development server
4. Open your browser to the displayed URL (typically http://localhost:5173) 