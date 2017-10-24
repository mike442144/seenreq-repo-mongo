
'use strict'

const Repo = require("seenreq/repo")
, MongoClient = require('mongodb').MongoClient

class MongoRepo extends Repo{
    constructor(options) {
	super(options);

	let defaultOptions = {
	    url:'mongodb://localhost:27017/seenreq',
            collection: 'seenreq'
	}
	
	this.options = Object.assign({},defaultOptions, options);
	this.clearOnQuit = options.clearOnQuit !== false;
    }

    initialize(callback){
	MongoClient.connect(this.options.url).then(db=> {
	    this.db=db;
	    callback();
	}).catch(callback);
    }
    
    /* 
     * 
     * @return Array represents if hit. e.g. [1,1,0,0,1,0]
     */
    getByKeys(keys, callback) {
	this.db.collection(this.options.collection).find({
	    key:{
		$in: keys
	    }
	}).toArray((e,docs)=>{
	    if(e){
		return callback(e);
	    }

	    let rst = keys.map(key=>docs.some(doc=>doc.key===key));
	    callback(null, rst);
	});
    }

    setByKeys(keys, callback) {
	let docsToInsert = keys.map( key => {
            return {key};
	});

	if (docsToInsert.length === 0) {
	    return callback();
	}
	
	this.db.collection(this.options.collection).insertMany(docsToInsert, callback);
    }
        
    dispose() {
	if (this.clearOnQuit) {
            this.db.dropCollection(this.options.collection, err => {
		if (err)
                    throw err;
		
		this.db.close();
            });
	} else {
            this.db.close();
	}
    }
}

module.exports = MongoRepo;
