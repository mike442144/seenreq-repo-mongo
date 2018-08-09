
'use strict';

const Repo = require('seenreq/repo');
const MongoClient = require('mongodb').MongoClient;

class MongoRepo extends Repo{
	constructor(options) {
		super(options);

		const defaultOptions = {
			url:'mongodb://localhost:27017/seenreq',
			collection: 'seenreq'
		};
		
		this.options = Object.assign({},defaultOptions, options);
		this.clearOnQuit = options.clearOnQuit !== false;
	}

	initialize(){
		return MongoClient.connect(this.options.url).then(db=> {
			db.collection(this.options.collection).createIndex({key: 1},{unique:true});
			this.db=db;
		});
	}
	
	/* 
	 * 
	 * @return Array represents if hit. e.g. [1,1,0,0,1,0]
	 * toSet :: [Document] -> Set
	 * hit :: [a] -> Set -> [Boolean]
	 */
	getByKeys(keys) {
		const toSet = (docs) => new Set(docs.map(doc => doc.key));
		const hit = (keys, set) => keys.map(key => set.has(key) );
		
		return this.db.collection(this.options.collection)
			.find({key:{$in: keys}} )
			.toArray()
			.then( (docs) => hit(keys, toSet(docs)) );
	}

	setByKeys(keys) {
		let docsToInsert = keys.map( key => {
			return {key};
		});

		if (docsToInsert.length === 0) {
			return Promise.resolve();
		}
		
		return this.db.collection(this.options.collection).insertMany(docsToInsert);
	}
	
	dispose() {
		if (this.clearOnQuit) {
			return this.db.dropCollection(this.options.collection).then(() => this.db.close() );
		} else {
			this.db.close();
			return Promise.resolve();
		}
	}
}

module.exports = MongoRepo;
