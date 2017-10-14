var http = require('http'),
    https = require('https'),
    url = require('url'),
    usersUtils = require('./users-util'),
    messagesUtils = require('./messages-util');
	MD5 = require('./MD5');


var Babble = {
		// Methods for RESTful API acceps
        methods: [ 'GET', 'POST', 'DELETE', 'OPTIONS' ], 
		// Pathnames RESTful API recognizes
        pathnames: [ 'messages', 'stats', 'login', 'logout' ], 
        messagesClients: [],
        statsClients: []
};

function UserMessagesRequest(response, counter) {
        this.response = response;
		this.timestamp = new Date().getTime();
        this.counter = counter;  
}

http.createServer(function (request, response) {
        var requestedUrl = url.parse(request.url, true);
        var queryObject = requestedUrl.query;
        var pathname = requestedUrl.pathname;
        if (pathname.indexOf('?') >= 0) {	
                pathname = pathname.substring(0, pathname.indexOf('?'));
        }
        var pathnameArray = pathname.split('/');
        var messageID = '/';
        if (pathnameArray.length > 2) {
                messageID += pathnameArray[2];
        }

        response.setHeader('Access-Control-Allow-Origin', '*');
        response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
        response.setHeader("Access-Control-Allow-Headers", "Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers");
		
		var error  = checkForErrors(request);
		if (!error){
            switch (requestedUrl.href) {
                case "/login":
                    userLogin(request, response);
					break;
					
                case "/logout": 
                    userLogout(request, response);                          
					break;
					
                case "/messages?counter=" + queryObject.counter: 
                    getMessagesReq(request, response, queryObject)
					break;

                case "/messages":
					postMessage(request, response);
					break;
					
                case "/messages" + messageID: 
					deleteMessage(request, response, messageID);
					break;
					
                case "/stats": // get stats request
					getStatsReq(response);
					break;
					
                default:
                    defaultCase(response);
            }
		}
		else {
			response.writeHead(error, { 'Content-Type': 'application/json; charset=utf-8' });
			response.end();
		}

}).listen(9000, 'localhost');

console.log('Server running.');
 
setInterval(function() {
	// close out requests older than 30 seconds
	var expiration = new Date().getTime() - 30000;
	var response;
	for (var i = Babble.messagesClients.length - 1; i>= 0; i--) {
		if (Babble.messagesClients[i].timestamp < expiration) {
			response = Babble.messagesClients[i].response;
			response.end(JSON.stringify([]));
		}
	}
}, 1000);

// Handle errors and send appropriate status code
function checkForErrors(request) {
	var requestedUrl = url.parse(request.url, true);
	var queryObject = requestedUrl.query;
    var pathname = requestedUrl.pathname;
    if (pathname.indexOf('?') >= 0) {	
        pathname = pathname.substring(0, pathname.indexOf('?'));
    }
    var pathnameArray = pathname.split('/');
    var messageID = '/';
    if (pathnameArray.length > 2) {
        messageID += pathnameArray[2];
    }
	
	// For non-existent URLs (not found)	
    if (!Babble.pathnames.includes(pathnameArray[1]) 
				|| pathnameArray.length < 2 
				|| pathnameArray.length > 3 
				|| (pathnameArray.length === 3 && pathnameArray[1] !== Babble.pathnames[0])) { 
            return 404;
			
	// When the sent data is bad
    } else if (pathnameArray.length === 3 && (!Number.isInteger(parseInt(pathnameArray[2], 10)) 
				|| parseInt(pathnameArray[2], 10) < 1 
				|| parseInt(pathnameArray[2], 10) > messagesUtils.messageID()) 
				|| (requestedUrl.search !== '' && (typeof requestedUrl.query.counter === "undefined" || !Number.isInteger(parseInt(requestedUrl.query.counter, 10))))) {
            return 400;
			
	// For OPTIONS request
    } else if (request.method === "OPTIONS") { 
            return 204;
			
	// When the HTTP method is bad for certain URL (method not allowed)
	} else if (!Babble.methods.includes(request.method) 
		|| (!(request.method === Babble.methods[0]) && (requestedUrl.href === '/login' || requestedUrl.href === ("/messages?counter=" + queryObject.counter) || requestedUrl.href === "/stats")) 
		|| (!(request.method === Babble.methods[1]) && (requestedUrl.href === '/logout' || requestedUrl.href === "/messages")) 
		|| (!(request.method === Babble.methods[2]) && (requestedUrl.href === ("/messages" + messageID)))) {
			console.log("request.method = " + request.method);
			console.log("Babble.methods[0] = " + Babble.methods[0]);
			console.log("Babble.methods[1] = " + Babble.methods[1]);
			console.log("Babble.methods[2]" + Babble.methods[2]);
			console.log("requestedUrl.href = " + requestedUrl.href);

            return 405;

	// If no error occured return 0
	} else {
			return 0;
	}
};

// User Login case
function userLogin (request, response){
	response.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        while (Babble.messagesClients.length > 0) {  
			var client = Babble.messagesClients.pop();
			client.response.end(JSON.stringify([ ]));
		}
		response.end(JSON.stringify({id: usersUtils.addUser()}));
};

// User Logout case
function userLogout (request, response){
	response.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
	usersUtils.deleteUser();
	while (Babble.messagesClients.length > 0) {
		var client = Babble.messagesClients.pop();
		client.response.end(JSON.stringify([ ]));
	}

	response.end(); 
};

// Get /messages?counter=XX case
function getMessagesReq (request, response, queryObject){
	response.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        if (messagesUtils.getMessagesCount() > queryObject.counter) {
			var messages = messagesUtils.getMessages(queryObject.counter);
			var ids = messagesUtils.getMessagesId(queryObject.counter);
			var fullMessages = [];
			for (var i = 0; i < messages.length; i++) {
				fullMessages.push({
				id: ids[i],
				name: messages[i].name,
				email: messages[i].email,
				avatar: messages[i].avatar,
				message: messages[i].message,
				timestamp: messages[i].timestamp
			});
		}
		response.end(JSON.stringify(fullMessages));
		
		} else {
			Babble.messagesClients.push(new UserMessagesRequest(response, queryObject.counter));
		}
};

// Post a message case
function postMessage (request, response){
	var requestBody = '';
    request.on('data', function (chunk) {
        requestBody += chunk.toString();
    });
    request.on('end', function () {
        var receivedMessage = JSON.parse(requestBody);
        var encoding = MD5.MD5(receivedMessage.email);
        var options = {
            host: 'en.gravatar.com',
            path: '/' + encoding + '.json',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36'
			}
        }
        https.get(options, function (res) {
			var body = '';
            res.on('data', function (chunk) {
                body += chunk;
            });
            res.on('end', function () {
                var avatarUrl = '';
                try {
                    avatarUrl = JSON.parse(body).entry[0].thumbnailUrl;
                } catch (err) {
                    avatarUrl = '';
                }
                                                              
                response.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                var id = messagesUtils.addMessage({
                    name: receivedMessage.name,
                    email: receivedMessage.email,
                    avatar: avatarUrl,
                    message: receivedMessage.message,
                    timestamp: receivedMessage.timestamp
                });

				while (Babble.messagesClients.length > 0) {
                     var client = Babble.messagesClients.pop();
					 var messages = messagesUtils.getMessages(client.counter);
					 var ids = messagesUtils.getMessagesId(client.counter);
					 var fullMessages = [];
					 for (var i = 0; i < messages.length; i++) {
						fullMessages.push({
							id: ids[i],
							name: messages[i].name,
							email: messages[i].email,
							avatar: messages[i].avatar,
							message: messages[i].message,
							timestamp: messages[i].timestamp
						});
					}
					client.response.end(JSON.stringify(fullMessages));
				}
				response.end(JSON.stringify({id: id}));
			});
		});
	});
};

// Delete a message case
function deleteMessage (request, response, messageID){
	messageID = messageID.substring(1);
	response.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
	var deletedID = messagesUtils.deleteMessage(messageID);
	
	while (Babble.messagesClients.length > 0) {
		var client = Babble.messagesClients.pop();
		client.response.end(JSON.stringify([{id: messageID}]));
	}
	response.end(JSON.stringify(deletedID >= 0));
};

// Get stats case
function getStatsReq (response){
	response.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
	response.end(JSON.stringify({users: usersUtils.getUsers(), messages: messagesUtils.getMessagesCount()}));
};

// Default case
function defaultCase (response){
	response.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
	response.end();
};
