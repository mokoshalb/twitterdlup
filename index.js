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
                    const stream = fs.createReadStream(filename);
                    const formData = {'files[]': stream,};
                    request.post({url:'https://pomf.lain.la/upload.php', formData: formData}, function optionalCallback(err, httpResponse, body) {
                        if (err) {
                            return console.error('upload failed:', err);
                        }
                        //console.log('Upload successful!  Server responded with:', body);
                        let bodyJSON = JSON.parse(body);
                        let mp4 = bodyJSON.files[0].url
                        let size = bodyJSON.files[0].size
                        if(size > 0){
                            console.log(mp4)
                            res.send(mp4);
                        }else{
                            res.send("empty file");
                        }
                        fs.unlink(filename, function (err) {
                            if (err) throw err;
                            // if no error, file has been deleted successfully
                            console.log('File deleted!');
                        });
                    });
                });
            });
        }
    })
});

app.get('/download/:url', function (req, res) {
	if(!req.params.url){
		return res.status(400).send({error: "URL missing"});
	}
	let url = Buffer.from(req.params.url, 'base64').toString('utf-8');
	let filename ="temp/"+req.params.url+".mp4"
	const file = fs.createWriteStream(filename);
	https.get(url, function(response) {
		response.pipe(file);
		file.on("finish", () => {
			file.close();
			console.log("Download Completed");
			const stream = fs.createReadStream(filename);
			const formData = {'files[]': stream,};
			request.post({url:'https://pomf.lain.la/upload.php', formData: formData}, function optionalCallback(err, httpResponse, body) {
				if(err){
					return console.error('upload failed:', err);
				}
				let bodyJSON = JSON.parse(body);
				let mp4 = bodyJSON.files[0].url
				let size = bodyJSON.files[0].size
				if(size > 0){
					console.log(mp4)
					res.send(mp4);
				}else{
					console.log("null")
					res.send("null");
				}
				fs.unlink(filename, function (err) {
					if (err) throw err;
					console.log('File deleted!');
				});
			});
		});
    });
});

app.listen(process.env.PORT ||3000, () => console.log('server is running'))
