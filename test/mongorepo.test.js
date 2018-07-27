'use strict';
const expect = require('chai').expect;
const sinon = require('sinon');
const rewire = require('rewire');
const MongoRepo = rewire('../index.js');

describe('mongo repo testing', ()=> {
	let callback;
	let mongoRepo;
	let fakeMongo = null;
	let fakeCollection;
	let fakeDb;
	let fakeFind;

	before(()=>{  
		fakeCollection= {
			createIndex: sinon.spy(), 
			find: sinon.fake.returns(fakeFind), 
			insertMany: function(docsToInsert, callback){
				callback(docsToInsert);
			},
		};

		fakeDb= {
			collection: sinon.fake.returns(fakeCollection), 
			dropCollection:  sinon.fake.resolves()
		};
	});

	beforeEach(()=>{
		mongoRepo = new MongoRepo();
		callback = sinon.spy();
		fakeDb.close = sinon.spy();
	});

	afterEach(() => {
	});

	describe('constructor()', ()=>{
		it('should create a mongo repo without args', ()=>{
			expect(mongoRepo.clearOnQuit).to.be.true;
			expect(mongoRepo.options).to.eql({
				url:'mongodb://localhost:27017/seenreq',
				collection: 'seenreq'
			});
		});
		it('should create a mongo repo with args', ()=>{
			mongoRepo = new MongoRepo({
				url: 'mongodb://localhost:28888/seenreq',
				clearOnQuit: false
			});
			expect(mongoRepo.clearOnQuit).to.be.false;
			expect(mongoRepo.options).to.eql({
				url: 'mongodb://localhost:28888/seenreq',
				collection: 'seenreq',
				clearOnQuit: false
			});
		});
	});

	describe('initialize()', ()=>{
		it('should initialize mongo db connection', (done)=>{
			fakeMongo = {connect: sinon.fake.resolves(fakeDb) };
			let mongoRestore = MongoRepo.__set__('MongoClient', fakeMongo);
			mongoRepo.initialize(callback);
			setTimeout(() => {
				expect(fakeDb.collection.calledOnce).to.be.true;
				expect(fakeCollection.createIndex.calledOnce).to.be.true;
				expect(callback.calledOnce).to.be.true;
				expect(callback.getCall(0).args[0]).to.be.undefined;
	
				mongoRestore();
				done();
			}, 0);
		});

		it('should catch error if connect failed', (done)=>{
			fakeMongo = {connect: sinon.fake.rejects(new Error('fake error')) };
			let mongoRestore = MongoRepo.__set__('MongoClient', fakeMongo);
			mongoRepo.initialize(callback);
			setTimeout(() => {
				expect(callback.calledOnce).to.be.true;
				expect(callback.getCall(0).args[0]).to.be.an('error');

				mongoRestore();
				done();
			},0);
		});
	});

	describe('getByKeys()', ()=>{
		it('should get mongodb values', ()=>{
			// mongoRepo.getByKeys(['key1'], callback);

		});
        
	});


	describe('setByKeys()', ()=>{
		it('should set mongodb values', (done)=>{
			mongoRepo.db = fakeDb;
			mongoRepo.setByKeys([], callback);
			mongoRepo.setByKeys(['key1', 'key2'], callback);
			setTimeout(() => {
				expect(callback.calledTwice).to.be.true;
				expect(callback.getCall(0).args[0]).to.be.undefined;
				expect(callback.getCall(1).args[0]).to.eql([ { key: 'key1' }, { key: 'key2' }]);
				done();
			}, 0);
		});
	});

	describe('dispose()', ()=>{
		it('should dispose mongodb connection', (done)=>{
			mongoRepo.db = fakeDb;

			mongoRepo.dispose();
			
			setTimeout(() => {	
				expect(fakeDb.dropCollection.calledOnce).to.be.true;
				expect(fakeDb.close.called).to.be.true;
				done();
			}, 0);
		});

		it('should close connection if error', (done)=>{
			fakeDb.dropCollection = sinon.fake.rejects(new Error('fake error'));
			mongoRepo.db = fakeDb;

			mongoRepo.dispose();
			setTimeout(() => {
				expect(fakeDb.dropCollection.calledOnce).to.be.true;
				expect(fakeDb.close.calledOnce).to.be.true;
				done();
			}, 0);
		});

		it('should only close mongo connection', (done)=>{
			fakeDb.dropCollection = sinon.spy();
			mongoRepo.db = fakeDb;
			mongoRepo.clearOnQuit = false;
			mongoRepo.dispose();
			
			setTimeout(() => {
				expect(fakeDb.dropCollection.called).to.be.false;
				expect(fakeDb.close.calledOnce).to.be.true;
				done();
			}, 0);
		});
	});

});