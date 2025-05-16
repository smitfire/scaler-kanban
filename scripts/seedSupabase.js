import { createClient } from '@supabase/supabase-js';
import { parseTickets } from '../src/utils/ticketParser.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Configure dotenv to load .env from the project root
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Error: Supabase URL and Anon Key are required.");
  console.error("Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env file.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function seedData() {
  let ticketsToSeed = parseTickets();

  console.log('Transforming ticket data for Supabase...');
  const transformedTickets = ticketsToSeed.map(ticket => ({
    id: ticket.id, // Use the pre-generated UUID
    title: ticket.title,
    description: ticket.description,
    status: ticket.status,
    category: ticket.category,
    section: ticket.section,
    is_subtask: ticket.isSubtask, // Convert camelCase to snake_case
    parent_id: ticket.parentId,   // Convert camelCase to snake_case
    // Ensure createdAt and updatedAt are ISO strings for Supabase
    created_at: ticket.createdAt instanceof Date ? ticket.createdAt.toISOString() : new Date(ticket.createdAt).toISOString(),
    updated_at: ticket.updatedAt instanceof Date ? ticket.updatedAt.toISOString() : new Date(ticket.updatedAt).toISOString(),
  }));

  console.log('Deleting existing tickets from Supabase table...');
  const { error: deleteError } = await supabase
    .from('tickets')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // A condition to delete all rows

  if (deleteError) {
    console.error('Error deleting existing tickets:', deleteError.message);
    // Depending on the error, you might want to stop here or proceed with caution.
    // For a first seed, if the table is empty, this error might not be critical.
  } else {
    console.log('Existing tickets deleted successfully (or table was empty).');
  }

  console.log(`Attempting to seed ${transformedTickets.length} tickets into Supabase...`);
  const { data, error: insertError } = await supabase
    .from('tickets')
    .insert(transformedTickets)
    .select(); // .select() will return the inserted rows

  if (insertError) {
    console.error('Error seeding data into Supabase:');
    console.error('Message:', insertError.message);
    if (insertError.details) console.error('Details:', insertError.details);
    if (insertError.hint) console.error('Hint:', insertError.hint);
    // Log the first problematic ticket data for debugging if possible
    // This part is tricky because the error might not directly point to a single ticket in a batch.
  } else {
    console.log('Data seeded successfully to Supabase!');
    console.log(`Inserted ${data ? data.length : 0} tickets.`);
  }
}

seedData()
  .then(() => console.log('Seeding process finished.'))
  .catch(err => {
    console.error('Unhandled error during seeding process:', err.message);
    if (err.stack) console.error(err.stack);
  }); 