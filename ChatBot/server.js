
const express = require('express');
const bodyParser = require('body-parser')
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const mongoose = require('mongoose');
//var cors = require('cors');
const cors = require('cors');
app.use((req, res, next) => {
	//Qual site tem permissão de realizar a conexão, no exemplo abaixo está o "*" indicando que qualquer site pode fazer a conexão
    res.header("Access-Control-Allow-Origin", "*");
	//Quais são os métodos que a conexão pode realizar na API
    res.header("Access-Control-Allow-Methods", 'GET,PUT,POST,DELETE');
    app.use(cors());
    next();
});
const mongourl = "mongodb+srv://AKIAWB6PQW4OTPYP357J:Pn9iq3+GUlWKnLl8ZQSBNEMvzi6bU3VezjrAmvpq@chatbot.a3su7.mongodb.net/chatbot?authSource=%24external&authMechanism=MONGODB-AWS";

const schema = mongoose.Schema({ // Construi a estrura do banco usando ordenando por "date=now"
    name : {
        type:String,
        default: '',
    },
    message : {
        type:String,
        default: '',
    },
    date : {
        type:Date,
        default: Date.now,
    }
}) 

  mongoose.connect(mongourl, { useNewUrlParser: true, useUnifiedTopology: true} ,(err) => {
    console.log('mongodb connected', err);
    });
    



var Message = mongoose.model('Message',schema)

app.use(express.static(__dirname));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }))
  
  
app.get('/messages', (req, res) => {
    Message.find({}, (err, messages) => {
        res.send(messages);
    }).sort( { date : 1 } )     //forçando o banco a trazer o ultimo valor inserido.
})
app.get('/messages/:user', (req, res) => {  //GET- Vai buscar a mensagem no banco usando o "name" como base.
    var user = req.params.user
    Message.find({name: user},(err, messages)=> {          
      res.send(messages);  
    }).sort( { date : -1 } )
  })



app.post('/messages', async (req, res) => {
  try{
    var message = new Message(req.body);

    var savedMessage = await message.save()
      console.log('saved');

    var censored = await Message.findOne({message:'badword'});  //POST- Vai salval a mensagem no banco usando como base o req.body
      if(censored)
        await Message.remove({_id: censored.id})
      else
        io.emit('message', req.body);
      res.sendStatus(200);
  }
  catch (error){
    res.sendStatus(500);
    return console.log('error',error);
  }
  finally{
    console.log('Message Posted')
  }

})
  io.on('connection', () =>{
    console.log('a user is connected')
  })
  
  mongoose.connect(mongourl ,{useMongoClient : true} ,(err) => {
    console.log('mongodb connected',err);
  })
  
  var server = http.listen(3002, () => {
    console.log('server is running on port', server.address().port);
  });