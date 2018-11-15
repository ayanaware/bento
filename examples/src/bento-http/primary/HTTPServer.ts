'use strict';

import * as http from 'http';

import { ComponentAPI, SubscribeEvent, Variable } from '@ayana/bento';
import { HitCounter } from './HitCounter';

import { Logger } from '@ayana/logger';

const log = Logger.get('HTTPServer');

export class HTTPServer {
	public api: ComponentAPI;
	public name: string = 'HTTPServer';

	// tells bento: "Don't load me till after you load HitCounter"
	public dependencies: string[] = ['HitCounter'];

	@Variable({
		type: 'number',
		name: 'port',
		default: 8080,
	})
	private port: number;

	private server: http.Server;

	async onLoad() {
		this.server = new http.Server();

		// fancy way to forward component events (this also means other components can listen for HTTPServer request now)
		this.api.forwardEvents(this.server, ['request']);

		this.server.on('listening', () => {
			log.info(`Ready! Serving on 'http://127.0.0.1:${this.port}'`);
			if (this.port === 8080) log.info(`Run 'PORT=num node path/to/example' to specify a custom port`);
		});

		this.server.listen(this.port, '127.0.0.1');
	}

	// example of using decorator & reference to register an event, alternative can be seen in Spy secondary component
	@SubscribeEvent(HTTPServer, 'request')
	handleRequest(req: http.IncomingMessage, res: http.ServerResponse) {
		const remoteAddress = req.connection.remoteAddress;
		const remotePort = req.connection.remotePort;

		// example of accessing methods on a primary component
		const counter = this.api.getPrimary<HitCounter>(HitCounter);
		counter.incrementHit(1);

		// lets emit a component event!
		// Emits the component event httpHit from HTTPServer
		this.api.emit('httpHit', remoteAddress, remotePort);

		res.end(`Hello! I've been hit ${counter.getTotalHits()} times now!`);
	}
}
