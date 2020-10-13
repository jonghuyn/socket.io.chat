
# Socket.IO Chat

A simple chat demo for socket.io with redis

## How to use

```
$ npm ci
$ npm start
```

And point your browser to `http://localhost:3000`. Optionally, specify
a port by supplying the `PORT` env variable.

## Features

- Multiple users can join a chat room by each entering a unique username
on website load.
- Users can type chat messages to the chat room.
- A notification is sent to all users when a user joins or leaves
the chatroom.
- The product chat room using redis publish and subscribe funciton
- The goal of this project is to create a prototype of a comment system. Consider extending the function using socket.io.
