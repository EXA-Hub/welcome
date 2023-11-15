import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs'; // Import fs module
import url from 'url';

const app = express();
const port = 5000;

app.use(cors()); // Enable CORS
app.use(express.json()); // for parsing application/json
app.use(express.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

// Check if uploads directory exists, if not, create it
const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}
// Serve static files from the React build
app.use(express.static(path.join(__dirname, 'build')));

// Serve the React build for any other routes
app.get('/main', (req, res) => {
    res.sendFile(path.join(__dirname + '/build/index.html'));
});

app.use((req, res, next) => {
    if (req.socket.remoteAddress === "::1") {
        next();
    } else return res.sendStatus(403);
});


// Set up storage engine with multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir)
    },
    filename: function (req, file, cb) {
        cb(null, 'file-' + Date.now() + path.extname(file.originalname)) // Use the original file extension
    }
});

const upload = multer({ storage: storage });

// Handle file upload route
app.post('/upload', upload.single('file'), (req, res) => {
    console.log(req.file);
    res.send({ filePath: req.file.filename }); // Send the filename back to the client
});

// Serve static files from the uploads directory
app.use('/', express.static(uploadDir)); // Change this line

app.get('/test', (req, res) => {
    if (req.query.testCode === "ZAMPX") {
        res.send('this is the host');
    } else return res.sendStatus(403);
});

app.post('/stateSave', (req, res) => {
    const data = req.body; // Get the data from the request body
    fs.writeFile('state.json', JSON.stringify(data), (err) => { // Write the data to state.json
        if (err) {
            console.error(err);
            res.status(500).send('An error occurred while saving the state.');
        } else {
            res.send('State saved successfully.');
        }
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
    import('./cmds.js');
    import("./discord.js");
});