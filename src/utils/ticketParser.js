import { v4 as uuidv4 } from 'uuid';

/**
 * Parses the requirements and converts them into ticket data
 * @returns {Array} Array of ticket objects
 */
export function parseTickets() {
  const now = new Date();
  
  // Global Terminology Changes
  const terminologyTickets = [
    {
      id: uuidv4(),
      title: "Rename 'Enhancement' to 'Enrichment' in UI",
      description: "Find and replace all instances of 'Enhancement' with 'Enrichment' throughout the UI.",
      status: "todo",
      category: "terminology",
      section: "Global Changes",
      isSubtask: false,
      parentId: null,
      createdAt: now,
      updatedAt: now
    },
    {
      id: uuidv4(),
      title: "Rename 'Connection' to 'Route' in UI",
      description: "Find and replace all instances of 'Connection' with 'Route' throughout the UI.",
      status: "todo",
      category: "terminology",
      section: "Global Changes",
      isSubtask: false,
      parentId: null,
      createdAt: now,
      updatedAt: now
    }
  ];
  
  // Supply Partners
  const supplyPartnersMainId = uuidv4();
  const supplyPartnersTickets = [
    {
      id: supplyPartnersMainId,
      title: "Supply Partners - Main Table Screen",
      description: "Update the Supply Partners main table screen with appropriate metrics and controls.",
      status: "todo",
      category: "supply-partners",
      section: "Main Table Screen",
      isSubtask: false,
      parentId: null,
      createdAt: now,
      updatedAt: now
    },
    {
      id: uuidv4(),
      title: "Update metrics columns",
      description: "Use the same metrics columns as the Supply Tags page: Ad Requests, Fill Rate, Impressions, Media Cost, Revenue",
      status: "todo",
      category: "supply-partners",
      section: "Main Table Screen",
      isSubtask: true,
      parentId: supplyPartnersMainId,
      createdAt: now,
      updatedAt: now
    },
    {
      id: uuidv4(),
      title: "Add Date Picker",
      description: "Add a Date Picker in the top-right, same as on Supply Tags page",
      status: "todo",
      category: "supply-partners",
      section: "Main Table Screen",
      isSubtask: true,
      parentId: supplyPartnersMainId,
      createdAt: now,
      updatedAt: now
    },
    {
      id: uuidv4(),
      title: "Use customizable schema",
      description: "Ensure the table uses a customizable schema from src/lib/client/components/data-table/column-schemas",
      status: "todo",
      category: "supply-partners",
      section: "Main Table Screen",
      isSubtask: true,
      parentId: supplyPartnersMainId,
      createdAt: now,
      updatedAt: now
    }
  ];
  
  // Supply Partners - Edit Drawer
  const supplyPartnersEditId = uuidv4();
  const supplyPartnersEditTickets = [
    {
      id: supplyPartnersEditId,
      title: "Supply Partners - Edit Drawer/Page",
      description: "Create the edit drawer/page for Supply Partner details with multiple tabs.",
      status: "todo",
      category: "supply-partners",
      section: "Edit Drawer",
      isSubtask: false,
      parentId: null,
      createdAt: now,
      updatedAt: now
    },
    {
      id: uuidv4(),
      title: "Settings Tab",
      description: "Create Settings tab with Name field as text input and Active/Inactive toggle slider",
      status: "todo",
      category: "supply-partners",
      section: "Edit Drawer",
      isSubtask: true,
      parentId: supplyPartnersEditId,
      createdAt: now,
      updatedAt: now
    },
    {
      id: uuidv4(),
      title: "Enrichments Tab",
      description: "Create Enrichments tab with Inherited Enrichments display and Partner Level Enrichments (same functionality as 'Tag Level Request Enhancements' in the Supply Tags screen)",
      status: "todo",
      category: "supply-partners",
      section: "Edit Drawer",
      isSubtask: true,
      parentId: supplyPartnersEditId,
      createdAt: now,
      updatedAt: now
    },
    {
      id: uuidv4(),
      title: "Supply Tags Tab",
      description: "Create Supply Tags tab with a table listing all tags belonging to this supply partner. Table should be the same as used on Supply Tags screen, but optimized for in-drawer usage. Clicking on a row should open that tag's details in a new tab.",
      status: "todo",
      category: "supply-partners",
      section: "Edit Drawer",
      isSubtask: true,
      parentId: supplyPartnersEditId,
      createdAt: now,
      updatedAt: now
    }
  ];
  
  // Supply Packages
  const supplyPackagesMainId = uuidv4();
  const supplyPackagesTickets = [
    {
      id: supplyPackagesMainId,
      title: "Supply Packages - Main Table Screen",
      description: "Update the Supply Packages main table screen with appropriate metrics.",
      status: "todo",
      category: "supply-packages",
      section: "Main Table Screen",
      isSubtask: false,
      parentId: null,
      createdAt: now,
      updatedAt: now
    },
    {
      id: uuidv4(),
      title: "Update metrics columns",
      description: "Use the same metrics columns as the Supply Tags page: Ad Requests, Fill Rate, Impressions, Media Cost, Revenue",
      status: "todo",
      category: "supply-packages",
      section: "Main Table Screen",
      isSubtask: true,
      parentId: supplyPackagesMainId,
      createdAt: now,
      updatedAt: now
    }
  ];
  
  // Supply Packages - Edit Drawer
  const supplyPackagesEditId = uuidv4();
  const supplyPackagesEditTickets = [
    {
      id: supplyPackagesEditId,
      title: "Supply Packages - Edit Drawer/Page",
      description: "Create the edit drawer/page for Supply Package details with Targeting tab.",
      status: "todo",
      category: "supply-packages",
      section: "Edit Drawer",
      isSubtask: false,
      parentId: null,
      createdAt: now,
      updatedAt: now
    },
    {
      id: uuidv4(),
      title: "Use filter builder",
      description: "Use same filter builder as Supply Tags Targeting Tab",
      status: "todo",
      category: "supply-packages",
      section: "Edit Drawer",
      isSubtask: true,
      parentId: supplyPackagesEditId,
      createdAt: now,
      updatedAt: now
    },
    {
      id: uuidv4(),
      title: "Add Supply Tag Targeting section",
      description: "Add 'Supply Tag Targeting' section above filters with radio button group: Include All Tags, Include Specific Tags, Exclude Specific Tags",
      status: "todo",
      category: "supply-packages",
      section: "Edit Drawer",
      isSubtask: true,
      parentId: supplyPackagesEditId,
      createdAt: now,
      updatedAt: now
    },
    {
      id: uuidv4(),
      title: "Implement tag selection modal",
      description: "If Include/Exclude Specific Tags is selected, open modal with searchable table of supply tags and checkbox column to select tags. After selection, show summary and provide Edit option.",
      status: "todo",
      category: "supply-packages",
      section: "Edit Drawer",
      isSubtask: true,
      parentId: supplyPackagesEditId,
      createdAt: now,
      updatedAt: now
    },
    {
      id: uuidv4(),
      title: "Add confirmation prompt",
      description: "Show confirmation prompt if the user switches targeting types (e.g., from Include to Exclude), warning that it will reset selected tags",
      status: "todo",
      category: "supply-packages",
      section: "Edit Drawer",
      isSubtask: true,
      parentId: supplyPackagesEditId,
      createdAt: now,
      updatedAt: now
    }
  ];
  
  // Data Persistence & UX
  const persistenceId = uuidv4();
  const persistenceTickets = [
    {
      id: persistenceId,
      title: "Data Persistence & UX",
      description: "Implement data persistence and UX improvements for all screens.",
      status: "todo",
      category: "supply-partners",
      section: "General",
      isSubtask: false,
      parentId: null,
      createdAt: now,
      updatedAt: now
    },
    {
      id: uuidv4(),
      title: "Use Edit Drawer or Page",
      description: "All screens (Supply Partners + Supply Packages) must use an Edit Drawer or Page",
      status: "todo",
      category: "supply-partners",
      section: "General",
      isSubtask: true,
      parentId: persistenceId,
      createdAt: now,
      updatedAt: now
    },
    {
      id: uuidv4(),
      title: "Temporary edits until Save",
      description: "All edits to a record should be temporary until 'Save' is clicked. No automatic saves. Allows adops to configure entire record before persisting changes.",
      status: "todo",
      category: "supply-partners",
      section: "General",
      isSubtask: true,
      parentId: persistenceId,
      createdAt: now,
      updatedAt: now
    }
  ];
  
  // Combine all tickets
  return [
    ...terminologyTickets,
    ...supplyPartnersTickets,
    ...supplyPartnersEditTickets,
    ...supplyPackagesTickets,
    ...supplyPackagesEditTickets,
    ...persistenceTickets
  ];
} 