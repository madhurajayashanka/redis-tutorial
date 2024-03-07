const express = require('express');
const axios = require('axios');
const redis = require('redis');

const app = express();
const client = redis.createClient();

const EXPIRATION_TIME = 10; // 10 seconds

client.on('error', (err) => {
    console.error('Redis error:', err);
});

// API endpoint to fetch data
app.get('/photos', async (req, res) => {
    try {
        // Check if data is cached in Redis
        client.get('photos', async (error, data) => {
            if (error) throw error;

            if (data) {
                console.log('Data is cached in Redis');
                // If data is cached, return it
                res.send(JSON.parse(data));
            } else {
                console.log('Data is not cached in Redis');
                // If data is not cached, fetch it from the internet
                const response = await axios.get('https://jsonplaceholder.typicode.com/photos');
                const fetchedData = response.data;

                // Cache the fetched data in Redis for 1 hour (3600 seconds)
                client.setex('photos', EXPIRATION_TIME, JSON.stringify(fetchedData));

                res.send(fetchedData);
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
