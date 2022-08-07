const express = require('express')
const cors = require('cors')
const app = express()
const https = require('https');
const fs = require('fs');
const request = require('request');

app.use(express.urlencoded({ extended: false }))
app.use(express.json())
app.use(cors())


app.get('/favicon.ico', (req, res) => res.status(204).end());

app.get('/:id', function(req, res){
    let twitterid = req.params.id
    let result
    request('https://api.animemoe.us/twitter-video-downloader/v2/?id='+twitterid, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            let importedJSON = JSON.parse(body);
            let videos = importedJSON.data.videos
            videos.map((e, i) => {
                if(i===0){
                    twitterURL = e.url
                }
            })
            console.log("Twitter URL is: "+twitterURL)
            let filename ="temp/"+twitterid+".mp4"
            const file = fs.createWriteStream(filename);
            https.get(twitterURL, function(response) {
                response.pipe(file);
                file.on("finish", () => {
                    file.close();
                    console.log("Download Completed");
                });
            });
            const stream = fs.createReadStream(filename);
            const formData = {'files[]': stream,};
            request.post({url:'https://pomf.lain.la/upload.php', formData: formData}, function optionalCallback(err, httpResponse, body) {
                if (err) {
                    result = "upload failed"
                    return console.error('upload failed:', err);
                }
                console.log('Upload successful!  Server responded with:', body);
                let bodyJSON = JSON.parse(body);
                let mp4 = bodyJSON.files[0].url
                let size = bodyJSON.files[0].size
                if(size > 0){
                    console.log(mp4)
                    result = mp4
                }else{
                    result = "empty file";
                }
            });
            fs.unlinkSync(filename)
            res.send(result);
        }
    })
});
app.listen(3000, () => console.log('server is running'))
