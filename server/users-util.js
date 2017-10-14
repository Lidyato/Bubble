(function(global, factory) {
    'use strict';

    if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        global.utils = factory();
    }
}(this, function() {
    var users = 0;
    var userId = 0;
    return {
        getUsers: function() {
            return users;
        },
        addUser: function() {
            ++users;
            return ++userId;
        },
        deleteUser: function() {
            if (users > 0)
                --users;
        }
    };
}));   