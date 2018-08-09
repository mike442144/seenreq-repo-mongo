'use strict';
const expect = require('chai').expect;
const sinon = require('sinon');
const rewire = require('rewire');
const MongoRepo = rewire('../index.js');

describe('mongo repo testing', ()=> {
	let mongoRepo;
	let fakeMongo = null;
	let fakeCollection;
	let fakeDb;
	let fakeFind;

	before(()=>{  
		fakeCollection= {
			createIndex: sinon.spy(), 
			find: sinon.fake.returns(fakeFind), 
			insertMany: sinon.fake.resolves()
		};

		fakeDb= {
			collection: sinon.fake.returns(fakeCollection), 
			dropCollection:  sinon.fake.resolves()
		};
	});

	beforeEach(()=>{
		mongoRepo = new MongoRepo();
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
			mongoRepo.initialize().then(() => {
				expect(fakeDb.collection.calledOnce).to.be.true;
				expect(fakeCollection.createIndex.calledOnce).to.be.true;
				mongoRestore();
				done();
			});
		});

		it('should catch error if connect failed', (done)=>{
			fakeMongo = {connect: sinon.fake.rejects(new Error('fake error')) };
			let mongoRestore = MongoRepo.__set__('MongoClient', fakeMongo);
			mongoRepo.initialize().catch(e => {
				expect(e.message).to.eql('fake error');
				mongoRestore();
				done();
			});
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
			mongoRepo.setByKeys([]).then( (rst) => {
				expect(rst).to.be.undefined;
				return mongoRepo.setByKeys(['key1', 'key2']);
			}).then( () => {
				expect(fakeCollection.insertMany.calledOnce).to.be.true;
				expect(fakeCollection.insertMany.calledWith([{key: 'key1'},{key:'key2'}])).to.be.true;
				done();
			}).catch( (e) => {
				console.error(e);
				expect(true).to.be.false;
			});
		});
	});

	describe('dispose()', ()=>{
		it('should dispose mongodb connection', (done)=>{
			mongoRepo.db = fakeDb;
			mongoRepo.dispose().then(() => {
				expect(fakeDb.dropCollection.calledOnce).to.be.true;
				expect(fakeDb.close.called).to.be.true;
				done();
			});
		});

		it('should close connection if error', (done)=>{
			fakeDb.dropCollection = sinon.fake.rejects(new Error('fake error'));
			mongoRepo.db = fakeDb;

			mongoRepo.dispose().then(() => {
				expect(fakeDb.dropCollection.calledOnce).to.be.true;
				expect(fakeDb.close.calledOnce).to.be.true;
				done();
			}).catch( () => {
				expect(fakeDb.close.calledOnce).to.be.true;
				done();
			});
		});

		it('should only close mongo connection', (done)=>{
			fakeDb.dropCollection = sinon.spy();
			mongoRepo.db = fakeDb;
			mongoRepo.clearOnQuit = false;
			mongoRepo.dispose().then( () => {
				expect(fakeDb.dropCollection.called).to.be.false;
				expect(fakeDb.close.calledOnce).to.be.true;
				done();
			}).catch( () => {
				expect(true).to.be.false;
				done();
			});
		});
	});

});
