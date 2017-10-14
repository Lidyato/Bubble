'use strict';

let assert = require('assert');
let users = require('../../server/users-util');

describe('User', function() {
    it('should load the users module', function() {
        assert.notEqual(null, users);
    });
    it('should have no users logged in', function() {
        let usersCount = users.getUsers();
        assert.deepEqual(0,usersCount);
    });
    it ('should have one user logged in', function() {
        let usersCount = users.addUser();
        assert.deepEqual(1,usersCount);
    });
    it ('should have two users logged in', function() {
        let usersCount = users.addUser();
        assert.deepEqual(2,usersCount);
    });
    it ('should have one user logged in, after user signed out', function() {
        users.deleteUser();
        let usersCount = users.getUsers();
        assert.deepEqual(1,usersCount);
    });
});
