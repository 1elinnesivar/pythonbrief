// Supabase Configuration
const SUPABASE_URL = 'https://iurejnwwhotcnzlfuywz.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1cmVqbnd3aG90Y256bGZ1eXd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4NjkxNTcsImV4cCI6MjA3MTQ0NTE1N30.HzPDhmaOw5Z1BGARMkh5uFKn7wN3b-e9x34nyNaUGeg'

// Initialize Supabase client
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Export for use in other modules
window.supabase = supabase
