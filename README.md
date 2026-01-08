# TSH Booking

This project is submitted as a zipped exam product for review by a lecturer and exam censor.

## Local development setup

### Prerequisites

- Node.js installed
- Docker installed (required for local Supabase database)

### Getting started

1. **Install dependencies**:

   ```bash
   npm install
   ```

2. **Start the local Supabase database** (runs on `127.0.0.1:54323`):

   ```bash
   npx supabase start
   ```

3. **Seed the database**:

   ```bash
   npm run seed
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```

The application will be available at [http://localhost:3000](http://localhost:3000).

### Note

The zipped project submission includes an `.env` file with all necessary environment variables configured, allowing the project to be run locally. The GitHub repository does not include the `.env` file.
