# Project Title

Neo4j API Demo

## Description

Small app demonstrating api/frontend integration with Neo4j.

### Web Interface
The web interface displays the graph of all employees and their relationships to each other. It provides the ability to add employees, modify employees, and delete employees.

This app is hosted for demonstration purposes at http://ramnode.entropy6.com:3001/.

### API Calls

* POST /employee {employeeId: [number], name: [string], supervisorId: [number (optional)]}
	* Adds an employee node, and optionally a worksFor relationship with another employee node.
* GET /employee
	* Returns all employee nodes
* DEL /employee {employeeId: [number]}
	* Deletes an employee node and all edges
* Get /graph
	* Returns the full graph of employees and their relationships

## License

This project is licensed under the MIT License