$('#submitEmployee').on('click', function (evt, ui) {
	let employeeName = $('#employeeName').val();
	let supervisorId = $('#supervisorSelect').val();

	let employeeId = parseInt(selectedEmployee) || getMaxEmployeeId() + 1;
	fetch('/employee', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({employeeId, name: employeeName, supervisorId})
	}).then(data => {
		updateGraph();
	});
});

$('#deleteEmployee').on('click', function(evt, ui) {
	let employeeId = selectedEmployee;
	if (employeeId) {
		employeeId = parseInt(employeeId);
		fetch('/employee', {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({employeeId})
		}).then(data => {
			updateGraph();
		});
	}
});

function getMaxEmployeeId() {
	return graphData.filter(item => item.group === 'nodes').reduce((result, item) => {
		let employeeId = parseInt(item.data.id.slice(1));
		return employeeId > result ? employeeId : result;
	}, 0);
}

let cy = cytoscape({
	container: document.getElementById('cyto-container'),
	layout: {
		name: 'concentric'
	},
	style: [{
		"selector": "node",
		"style": {
			"label": "data(label)",
			"color": "white"
			}
		},
		{
			"selector": "edge",
			"style": {
				"target-arrow-shape": "triangle",
				"target-arrow-color": "white",
				"curve-style": "straight",
				"line-color": "white"
			}
		}]
});

let selectedEmployee = null;
cy.on('click', 'node', function(evt) {
	var node = evt.target;
	selectedEmployee = node.id().slice(1);
	$('#employeeName').val(node.data('label'));
	$('#supervisorSelect').val(supervisorMap[selectedEmployee] || '');
	$('#submitEmployee').text('Update Employee');
	$('#deleteEmployee').show();
});

cy.on('click', function(evt) {
	if (evt.target == cy) {
		selectedEmployee = null;
		$('#employeeName').val('');
		$('#supervisorSelect').val('');
		$('#deleteEmployee').hide();
		$('#submitEmployee').text('Add Employee');
	}
});

let supervisorMap = {};
let graphData = [];
function updateGraph() {
	fetch('/graph').then(response => response.json())
		.then(data => {
			graphData = data;
			supervisorMap = data.filter(item => item.group === 'edges').reduce((result, item) => ({...result, [item.data.source.slice(1)]: item.data.target.slice(1)}), {});
			let supervisorList = data.filter(item => item.group === 'nodes').reduce((result, item) => [...result, [item.data.id, item.data.label]], []);
			$('#supervisorSelect').html('<option value="">[None]</option>');
			supervisorList.forEach(pair => {
				$('#supervisorSelect').append(`<option value="${pair[0].slice(1)}">${pair[1]}</option>`);
			});
			cy.remove('node, edge');
			cy.add(data);
			let layout = cy.layout({name: 'cose'});
			layout.run();
		});
}
updateGraph();
