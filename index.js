const neo4j = require('neo4j-driver');
const driver = neo4j.driver("bolt://localhost", neo4j.auth.basic("neo4j", "neo4k"), {disableLosslessIntegers: true});

const fs = require('fs');
const express = require('express');
const app = express();
const port = 3000;

app.use(express.json());

app.use(express.static('public'));

app.get('/employee', (req, res) => {
	let session = driver.session();
	session
		.run('MATCH (n:Employee) RETURN n.name AS name, n.employeeId AS employeeId')
		.then(function (result) {
			let results = [];
			result.records.forEach(function (record) {
				let [name, employeeId] = [record.get('name'), record.get('employeeId')];
				results.push({name, employeeId});
			});
			res.send(results);
			session.close();
		})
		.catch(function (error) {
			console.log(error);
		});
});

app.delete('/employee', (req, res) => {
	let session = driver.session();
	let employeeId = req.body.employeeId;
	session
		.run('MATCH (n:Employee {employeeId: $employeeId}) DETACH DELETE n', {employeeId})
		.then(function (result) {
			let results = [];
			result.records.forEach(function (record) {
				let [name, employeeId] = [record.get('name'), record.get('employeeId')];
				results.push({name, employeeId});
			});
			res.send(results);
			session.close();
		})
		.catch(function (error) {
			console.log(error);
		});
});

app.post('/employee', async (req, res) => {
	let [name, employeeId, supervisorId] = [req.body.name, req.body.employeeId, req.body.supervisorId];
	let session = driver.session();
	let response;
	try {
		let result = await session
			.run(
				`MERGE (employee:Employee {employeeId: $employeeId})
				SET employee.name = $name
				RETURN employee.name AS name, employee.employeeId AS employeeId`,
				{name, employeeId}
			);
		result.records.forEach(function (record) {
			let [name, employeeId] = [record.get('name'), record.get('employeeId')];
			response = {name, employeeId};
		});

		if (supervisorId) {
			await session.run(
				`MATCH (:Employee {employeeId: $employee1})-[r:worksFor]->()
				DELETE r`,
				{employee1: employeeId}
			);
			await session.run(
				`MATCH (emp1:Employee {employeeId: $employee1}), (emp2:Employee {employeeId: $employee2})
				MERGE (emp1)-[r:worksFor]->(emp2)
				RETURN r`,
				{employee1: employeeId, employee2: parseInt(supervisorId)}
			)
			res.send(response);
			session.close();

		} else {
			await session.run(
				`MATCH (:Employee {employeeId: $employee1})-[r:worksFor]->()
				DELETE r`,
				{employee1: employeeId}
			)
			res.send(response);
			session.close();
		}
	} catch (error) {
		session.close();
		console.log(error);
	}
});

app.get('/graph', (req, res) => {
	let session = driver.session();
	let nodes, edges;
	session.run('MATCH (n:Employee) RETURN n.name AS name, n.employeeId AS employeeId')
	.then((results) => {nodes = results; return session.run('MATCH ()-[r:worksFor]->() RETURN startNode(r).employeeId AS source, endNode(r).employeeId AS target, id(r) as id')})
	.then((edges) => {
		let results = [];
		nodes.records.forEach(function (record) {
			let [name, employeeId] = [record.get('name'), record.get('employeeId')];
			results.push({ group: 'nodes', data: { id: `n${employeeId}`, label: name }, classes: 'center-center' });
		});
		edges.records.forEach(function (record) {
			let [source, target, id] = [record.get('source'), record.get('target'), record.get('id')];
			results.push({ group: 'edges', data: { id: `e${id}`, source: `n${source}`, target: `n${target}`} });
		});
		res.send(results);
		session.close();
	})
	.catch(function (error) {
		console.log(error);
	});
});

app.listen(port, () => console.log(`App listening on port ${port}.`))

driver.close();