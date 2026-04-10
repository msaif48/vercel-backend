const express = require('express');
const cors = require('cors');
const app = express();

// 1. Security: Allow your GitHub Pages website to talk to this server
app.use(cors()); 

// 2. Format: Tell the server to accept JSON data from the browser
app.use(express.json()); 

// --- THIS IS YOUR SECRET VAULT ---
// Nobody on the internet can see this math!
function convert2DTo3D(inputData) {
    // PASTE YOUR REAL 2D-TO-3D MATH LOGIC HERE.
    // For now, it just sends a success message back.
    
    let processed3DData = { 
        success: true, 
        message: "Calculated successfully by the secure backend!", 
        data: inputData // Replace this with your actual calculated 3D output
    };
    return processed3DData;
}
// ---------------------------------

// 3. The Endpoint: This is the exact door your frontend will knock on
app.post('/api/generate-3d', (req, res) => {
    const user2DPlan = req.body; // The 2D data sent from the browser
    
    // Run the secret logic
    const final3DModel = convert2DTo3D(user2DPlan);
    
    // Send the finished 3D result back to the browser
    res.json(final3DModel); 
});

// 4. Start the server
app.get('/', (req, res) => {
    res.send("✅ The Secure Backend is live and running!");
});
// -------------------------------------------------------

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Secure Server running on port ${PORT}`));
