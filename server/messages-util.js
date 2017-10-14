(function(global, factory) {
    'use strict';

    if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        global.utils = factory();
    }
}(this, function() {
    var messages = [];
    var messageID = 0;
    return {
        getMessages: function(number) {
            var requiredMessages = []
            for (var i = number; i < messages.length; i++) 
                requiredMessages.push(messages[i].message);
            return requiredMessages;
        },
        
		getMessagesId: function(number) {
            var requiredMessages = []
            for (var i = number; i < messages.length; i++) 
                requiredMessages.push(messages[i].id);
            return requiredMessages;
        },
        
		addMessage: function(message) {
            messages.push({
                id: ++messageID,
                message: message
            });
            return messageID;
        },
        
		deleteMessage: function(id) {
            for (i = messages.length - 1; i >= 0; i--) {
                if (messages[i].id == id) {
                    messages.splice(i, 1);
                    return id;
                }
            }
            return -1;
        },
        
		getMessagesCount: function() {
            return messages.length;
        },
        
		lastmessageID: function() {
            if (messages.length == 0)
                return 0;
            return messages[messages.length - 1].id;
        }
    };
}));   