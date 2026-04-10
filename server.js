const express = require('express');
const cors = require('cors');
const app = express();

// This allows your GitHub Pages site to talk to this backend
app.use(cors()); 
// This lets the server read incoming JSON data
app.use(express.json()); 

// --- THIS IS YOUR SECRET VAULT ---
function convert2DTo3D(inputData) {
    // PASTE YOUR SECRET LOGIC HERE
    // For example: taking 2D wall coordinates and adding height
    // No one will ever see this code!
    
    let processed3DData = { 
        success: true, 
        message: "Calculated successfully", 
        data: inputData // Replace with actual calculated 3D output
    };
    return processed3DData;
}
// ---------------------------------

// This is the "endpoint" your frontend will call
app.post('/api/generate-3d', (req, res) => {
    const user2DPlan = req.body; // The 2D data sent from the browser
    
    // Run the secret logic
    const final3DModel = convert2DTo3D(user2DPlan);
    
    // Send the result back to the browser
    res.json(final3DModel); 
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
