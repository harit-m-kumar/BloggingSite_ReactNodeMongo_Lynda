import express from 'express';
import path from 'path';
import { MongoClient } from 'mongodb';
import { db, connectToDB } from './db.js';
import fs, { rmSync } from 'fs';
import 'dotenv/config';
import admin from 'firebase-admin';

import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const credentials = JSON.parse(
    fs.readFileSync('./credentials.json')
);
admin.initializeApp({
    credential: admin.credential.cert(credentials)
});

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, '../build')));

app.get(/^(?!\/api).+/, (req, res) => {
    res.sendFile(path.join(__dirname, '../build/index.html'));
});

app.use(async (req, res, next) => {
    const { authtoken } = req.headers;
    if (authtoken) {
        try {
            const user = await admin.auth().verifyIdToken(authtoken);
            req.user = user;
        } catch (e) {
            res.sendStatus(400)
        }
    }
    req.user = req.user || {};
    next();
})

// app.get('/hello', (req, res) => {
//     res.send('Hello!');
// });

/*
* Temporary in-memory database
*/

let articlesInfo = [
    {
        name: "learn-react",
        upvotes: 0,
        comments: []
    },
    {
        name: "learn-node",
        upvotes: 0,
        comments: []
    },
    {
        name: "mongodb",
        upvotes: 0,
        comments: []
    }
];

app.get('/api/articles/:name', async (req, res) => {
    const name = req.params.name;
    const uid = req.user;
    const article = await db.collection('articles').findOne({ name });
    if (article) {
        const upvoteIds = article.upvoteIds || [];
        article.canUpvote = uid && !upvoteIds.includes(uid);
        res.json(article);
    } else {
        res.sendStatus(404);
    }
})

//applies to below upvote req
app.use((req, res, next) => {
    if (req.user) {
        next();
    } else {
        res.sendStatus(401);
    }
})

app.put('/api/articles/:name/upvote', async (req, res) => {
    const { name } = req.params;
    const { uid } = req.user;
    //in case of local database
    // const requiredArticleIndex = articlesInfo.findIndex(
    //     (article) => article.name === name
    // )

    const article = await db.collection('articles').findOne({ name });

    if (article) {
        const upvoteIds = article.upvoteIds || [];
        const canUpvote = uid && !upvoteIds.includes(uid);
        if (canUpvote) {
            await db.collection('articles').updateOne({ name }, {
                $inc: { upvotes: 1 },
                $push: { upvoteIds: uid }
                // $set : { upvotes : 100}
            })
        
        }
    }
    
    const updatedArticle = await db.collection('articles').findOne({ name });

    if (updatedArticle) {
        //article.upvotes += 1;
        // res.send(`The article ${name} has ${article.upvotes} upvotes`);
        //res.json(`The article ${name} has ${article.upvotes} upvotes`);
        res.json(updatedArticle);
    } else {
        res.send(`The article does not exist`);
    }
});

app.post('/api/articles/:name/comments', async (req, res) => {
    const name = req.params.name;
    const body = req.body;
    const email = req.user;

    // const requiredArticleIndex = articlesInfo.findIndex( In case of hardcode database
    //     (article) => article.name === name
    // )

    //Imp : There is a small difference in the below line from that of the tutorial
    await db.collection('articles').updateOne({ name }, {
        $push: { comments: body },
        // $set : { upvotes : 100}
    });

    const article = await db.collection('articles').findOne({ name });

    if (article) {
        //res.send(`The article ${name} has ${article.comments} comments`);
        res.json(article);
    } else {
        res.send(`The article does not exist`);
    }
})

app.post('/hello', (req, res) => {
    res.send('Hello!');
    console.log(req.body.teamId);
});

app.get('/hello/:name/goodbye/:otherName', (req, res) => {
    const { name } = req.params;
    console.log(req.params);
    res.send(`Hello${name}`)
});

const PORT = process.env.PORT || 8000;

connectToDB(() => {
    console.log("Successfully connected to database");
    app.listen(PORT, () => {
        console.log("Server is listening on port", PORT);
    });
})
// "scripts": {
//     //"test": "echo \"Error: no test specified\" && exit 1"

//   },