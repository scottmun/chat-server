import { WebSocketGateway, WebSocketServer, SubscribeMessage, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';

class User {
    name: string;
    id: number;
    timestamp: Date;
}

@WebSocketGateway()
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {

    @WebSocketServer() server;
    users: User[] = [];

    async handleConnection(name: string) {

        // A client has connected
    }

    async handleDisconnect(user) {
    /*
        // A client has disconnected
        this.users.splice(this.users.indexOf(user), 1);

        // Notify connected clients of current users
        this.server.emit('users', this.users);
    */
    }

    @SubscribeMessage('adduser')
    async onAddUser(client, name: string) {
        const foundUser = this.findUser(name);
        if (!foundUser) {
            this.users.push({
                name: name,
                id: this.users.length,
                timestamp: new Date()
            });

            this.checkUserTimeouts();

            this.server.emit('users', this.users);
            client.broadcast.emit('users', this.users);
        } else {
            this.server.emit('rejectchat', name);
        }
    }

    @SubscribeMessage('chat')
    async onChat(client, obj: string[]) {
        const username = obj[0];
        const message = obj[1];

        let foundUser = this.findUser(username);
        if (foundUser) {
            foundUser.timestamp = new Date();
        }

        this.checkUserTimeouts();

        foundUser = this.findUser(username);
        if (foundUser) {
            client.broadcast.emit('chat', message);
        } else {
            this.server.emit('rejectchat', username);
        }
    }

    @SubscribeMessage('start-tictactoe')
    async onStartTicTacToe(client, users: object) {
        const newUsers = {
            // tslint:disable-next-line: no-string-literal
            opponent: users['username'],
            // tslint:disable-next-line: no-string-literal
            username: users['opponent']
        };
        client.broadcast.emit('start-tictactoe', newUsers);
    }

    private checkUserTimeouts(): void {
        const currentTime: Date = new Date();
        this.users = this.users.filter(user => {
            const name = user.name;
            const diff: number = (currentTime.getTime() - user.timestamp.getTime()) / 1000;
            console.log('name: ' + name + ' diff: ' + diff);
            return diff < 30 * 60; // 30 minutes
        });

        this.server.emit('users', this.users);
    }

    private findUser(username: string): User {
        return  this.users.find(user => user.name === username);
    }
}
