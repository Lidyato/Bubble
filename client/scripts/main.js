window.Babble = {
    messages: [],

// Register the user and update the server
    register: function(userInfo) {
        saveToLocalStorage(userInfo, '');
		console.log("Register:" +getLocalStorage().userInfo.name);
    },

// Send request to server for next message
    getMessages: function(counter, callback) {
        sendRequestToServer('GET', 'messages?counter=' + counter, null,
        function(e) {
            var addedMessages = callback(e);
            Babble.deleteButton();
            Babble.getStats(setStats);
            Babble.getMessages(Math.max(counter + addedMessages, 0), handleMessages);
        }, function() {
            Babble.getMessages(counter, callback);
        });
    },

// Post new message to the server
    postMessage: function(message, callback) {
        sendRequestToServer('POST', 'messages', message,
        function(e) {
            callback(e);
        }, function() {
            Babble.postMessage(message, callback);
        });
    },

// Delete a message according to it's ID
    deleteMessage: function(id, callback) {
        sendRequestToServer('DELETE', 'messages/' + id, null, callback, function() {
            Babble.deleteMessage(id, callback)
        });
    },

// Chatroom Stats
    getStats: function(callback) {
        sendRequestToServer('GET', 'stats', null,
        function(e) {
            callback(e);
        }, function() {
            Babble.getStats(callback);
        });
    },

// Check if the user is anonymous, callback function for post.	
    checkForAnonymous: function(messageID) {
        if (getLocalStorage().userInfo.name === '')
            Babble.messages.push(messageID);
    },

// Delete Button
    deleteButton: function() {
        for (var i = Babble.messages.length - 1; i >= 0; i--) {
            if (addDeleteMessage(Babble.messages[i]) === true) {
                Babble.messages.splice(i, 1);
            }
        }
    }
};

// On page loading
window.addEventListener('load', function() {

    var form = document.querySelector('.js-growable');
    logIn(form);
    makeGrowable(document.querySelector('.expanding-textarea'));
    sendChatMessage(form);
});

// Before unloading a page
window.addEventListener('beforeunload', function() {
    var form = document.querySelector('.js-growable');
    navigator.sendBeacon(form.action + 'logout'); // send logout message to server (so that it can update the users counter)
});

 // Get babble item from local storage
function getLocalStorage() {
    return JSON.parse(localStorage.getItem("babble"));
}

// Save user info and current message to local storage
function saveToLocalStorage(userInfo, message) {
    var user = {
        currentMessage: message,
        userInfo: userInfo
    };
    localStorage.setItem("babble", JSON.stringify(user));
}

// Make text area growable
function makeGrowable(container) {
    if (container != null) {
        var area = container.querySelector('textarea');
        var copyQuerySelector = container.querySelector('span');
        area.addEventListener('input', function(e) {
            copyQuerySelector.textContent = area.value;
            saveToLocalStorage(getLocalStorage().userInfo, area.value);
        });
    }
}

// User Info struct: name and email
function UserInfo(name, email) {
    this.name = name;
    this.email = email;
}

// On login
function logIn(form) {
    var clientUser = getLocalStorage();
    if (typeof(clientUser) === 'undefined' || clientUser === null) { // Code for localStorage + getting the username
        var modal = document.querySelector('.modal-popup');
        modal.style.display = 'block';
        modal.style.visibility = 'visible';
        var modalConfirm = modal.querySelector('.confirm').addEventListener('click', function() {
            register(new UserInfo(document.querySelector('#name').value, document.querySelector('#email').value));
            document.querySelector('.modal-popup').style.display = 'none';
            document.querySelector('.modal-popup').style.visibility = 'hidden';
            Babble.getStats(setStats);
            Babble.getMessages(0, handleMessages);
        });
        var modalAnnonimize = modal.querySelector('.annonimize').addEventListener('click', function() {
            register(new UserInfo('', ''));
            document.querySelector('.modal-popup').style.display = 'none';
            document.querySelector('.modal-popup').style.visibility = 'hidden';
            Babble.getStats(setStats);
            Babble.getMessages(0, handleMessages);
        });
    } else {
        var currentMessage = clientUser.currentMessage;
        register(new UserInfo(clientUser.userInfo.name, clientUser.userInfo.email));
        
		var localStorage = getLocalStorage();
        saveToLocalStorage(localStorage.userInfo, currentMessage);
		
        document.querySelector('.modal-popup').style.visibility = 'hidden';
        
        form.elements[0].value = clientUser.currentMessage;
        Babble.getStats(setStats);
        Babble.getMessages(0, handleMessages);
    }
}

// Register the user and update the server about the new user
function register(userInfo) {
    var form = document.querySelector("form");
    Babble.register(userInfo);
    sendRequestToServer('GET', 'login', null,
    function(e) {
        var userId = e.id;
        document.querySelector('.modal-popup').style.visibility = 'hidden';
    }, function() {
        register(userInfo);
    });
}

// Message struct
function Message(name, email, message, timestamp) {
    this.name = name;
    this.email = email;
    this.message = message;
    this.timestamp = timestamp;
}


// Handle new messages received from server
function handleMessages(messagesList)  {
    var addedMessages = 0;
    for (i = 0; i < messagesList.length; i++) {
        var message = messagesList[i];
        var messageElement = document.querySelector('#message_' + message.id);
        if (typeof(messageElement) === 'undefined' || messageElement === null) {
            addNewMessage(message.id, message.avatar, message.name, message.email, message.message, message.timestamp);
            addedMessages++;
        } else {
            messageElement.parentNode.removeChild(messageElement)
            addedMessages--;
        }
    }
    return addedMessages;
}

// Add new message to the list
function addNewMessage(id, avatar, name, email, message, messageTime) {
    var dateTime = new Date(messageTime);
    var avatarUrl;

    if (avatar === '')
        avatarUrl = 'images/anonymous.png'
	else
		avatarUrl = avatar;

    var ol = document.getElementById("messages-board");
    var li = document.createElement("li");
    var img = document.createElement("img");
    var div = document.createElement("div");
    var header = document.createElement("header");
    var cite = document.createElement("cite");
    var time = document.createElement("time");
    var p = document.createElement("p");
    var hours = dateTime.getHours().toString();
    var minutes = dateTime.getMinutes().toString();
    if (minutes.length < 2)
        minutes = '0' + minutes;

    img.setAttribute("class", "avatar");
    img.setAttribute("alt", "");
    img.setAttribute("src", avatarUrl);

    cite.textContent = name;

    time.innerHTML = hours + ':' + minutes;
    time.setAttribute("datetime", dateTime);

    header.setAttribute("class", "message-header");
    header.appendChild(cite);
    header.appendChild(time);

    p.textContent = message;

    div.setAttribute("tabIndex", "0");
    div.setAttribute("class", "message-body");
    div.appendChild(header);
    div.appendChild(p);

    li.setAttribute("id", 'message_' + id);
    li.setAttribute("class", "message");
    li.appendChild(img);
    li.appendChild(div);

    ol.appendChild(li);
    
    if (email !== '' && email === getLocalStorage().userInfo.email)
        addDeleteMessage({id: id});
}

// Delete measseg by  meesage ID
function addDeleteMessage(messageID) {
    var id = messageID.id;

    var m = document.querySelector('#message_' + id);
    var messageHeader = document.querySelector('#message_' + id + ' header');
    var delButton = document.querySelector('#message_' + id + ' header button');

    if (typeof(messageHeader) === 'undefined' || messageHeader === null || delButton !== null)
        return false;

    var div = document.querySelector('#message_' + id + ' .message-body');
    var del = document.createElement("button");

    del.setAttribute("tabIndex", "0");
    del.setAttribute("aria-label", "Delete message #" + id);
    del.addEventListener("focusout", function() {
        del.style.display = "none";
        del.style.visibility = "hidden";
    });

    del.addEventListener("click", function() {
        Babble.deleteMessage(id, function(e) { });
    });

    div.addEventListener("focusin", function() {
        del.style.display = "inline";
        del.style.visibility = "visible";
    });

    div.addEventListener("mouseenter", function() {
        del.style.display = "inline";
        del.style.visibility = "visible";
    });

    div.addEventListener("mouseleave", function() {
        del.style.display = "none";
        del.style.visibility = "hidden";
    });

    messageHeader.appendChild(del);
    return true;
}

// Set stats info of the chat
function setStats(chatInfo) {
    document.querySelector('.users-counter').textContent = chatInfo.users;
    document.querySelector('.messages-counter').textContent = chatInfo.messages;
}

// Send requests to the server and initial handle of its response
function sendRequestToServer(method, action, data, callback, errorCallback) {
    var xhr = new XMLHttpRequest();
    xhr.open(method, 'http://localhost:9000/' + action);
    if (method.toUpperCase() === 'POST') {
        xhr.setRequestHeader('Content-type', 'application/json; charset=utf-8');
    }
    xhr.addEventListener('load', function (e) {
        if (xhr.status == 200) {
            if (callback) {
                callback(JSON.parse(e.target.responseText));
            }
        } else {
            console.error('received the following status from server: ' + xhr.status);
            console.log('received the following status from server: ' + xhr.status);
        }
    });
    xhr.addEventListener('error', function (e) {
        if (errorCallback) {
            errorCallback();
        }
    });
    xhr.send(JSON.stringify(data));
}

// Submit chat message
function sendChatMessage(form) {
    form.addEventListener('submit', function(e) {
        e.preventDefault();

        var clientUser = getLocalStorage();
        var username = clientUser.userInfo.name === '' ? "Anonymous" : clientUser.userInfo.name;
        
		var message = {
            name: username,
            email: clientUser.userInfo.email,
            message: form.elements[0].value,
            timestamp: Date.now()
        }
		
        Babble.postMessage(message, Babble.checkForAnonymous);
        form.elements[0].value = '';
        var copyQuerySelector = form.querySelector('span');
        copyQuerySelector.textContent = '';
        saveToLocalStorage(clientUser.userInfo, '');
    });
}