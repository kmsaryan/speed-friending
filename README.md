# Speed-Friending

## Port Management

- **Backend Port**: Defined in `.env` as `BACKEND_PORT`. Default is `5000`.
- **Frontend Port**: React development server runs on `3000` by default. Ensure it does not conflict with the backend.

## How to Start the Server

1. **Set Up Environment Variables**  
   Create a `.env` file in the root directory for the backend:
   ```plaintext
   BACKEND_PORT=5000
   ```
   Create a `.env` file in the `frontend` directory:
   ```plaintext
   REACT_APP_API_BASE_URL=http://localhost:5000
   ```

2. **Initialize the Database**  
   Run the following command to initialize the database:
   ```bash
   node database/init.js
   ```
   You should see the message: `Database initialized successfully.`

3. **Start the Backend Server**  
   Run the following command:
   ```bash
   npm start
   ```

4. **Start the Frontend**  
   Navigate to the `frontend` directory and run:
   ```bash
   npm start
   ```

## How to Stop the Server

1. **Stop the Backend**  
   Press `Ctrl + C` in the terminal where the backend is running.

2. **Stop the Frontend**  
   Press `Ctrl + C` in the terminal where the frontend is running.

3. **Verify Ports Are Free**  
   Check if any process is using the backend port (`5000`) or frontend port (`3000`):
   ```bash
   netstat -ano | findstr :5000
   netstat -ano | findstr :3000
   ```
   Terminate any process using:
   ```bash
   taskkill /PID <PID> /F
   ```
   Replace `<PID>` with the process ID from the previous command.

---

Feel free to update this file with additional instructions as needed.