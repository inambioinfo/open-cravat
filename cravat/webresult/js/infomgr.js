function InfoMgr () {
	this.datas = {};
	this.columnnoss = {};
	this.columnss = {};
	this.colModels = {};
	this.columngroupss = {};
	this.columngroupkeys = {};
	this.colgroupkeytotitle = {};
	this.stats = {};
	this.statuss = {};
	this.jobinfo = {};
	this.widgetReq = {};
}

InfoMgr.prototype.getStatus = function (jobId) {
	var self = this;
	self.jobId = jobId;
}


InfoMgr.prototype.count = function (dbPath, tabName, callback) {
	$.get('/result/service/count', {tab: tabName, dbpath: dbPath, filter: JSON.stringify(filterJson)}).done(function (jsonResponseData) {
		var msg = jsonResponseData['n'];
		callback(msg);
    });
}

InfoMgr.prototype.load = function (loadKey, tabName, callback, callbackArgs, fJson) {
	if (loadKey == null) {
		return;
	}
	var toks = loadKey.split('_');
	this.fetchtype = 'job';
	if (toks[2] == '+' || toks[2] == '-') {
		this.fetchtype = 'single';
	}
	if (tabName == 'info') {
		this.fetchtype = 'info';
	}
	var self = this;
	if (this.fetchtype == 'job') {
		if (jobDataLoadingDiv == null) {
			drawingRetrievingDataDiv(tabName);
		}
		$.ajax({
			url: '/result/service/result', 
			type: 'get',
			async: true,
			data: {job_id: loadKey, tab: tabName, dbpath: dbPath, confpath: confPath, filter: JSON.stringify(fJson)},
			success: function (jsonResponseData) {
				self.store(self, tabName, jsonResponseData, callback, callbackArgs);
				writeLogDiv(tabName + ' data loaded');
			}
	    });
	} else if (this.fetchtype == 'single') {
		$.get('/result/service/query', {mutation: onemut, dbcolumn: true}).done(function (jsonResponseData) {
	    	self.datas[tabName] = [jsonResponseData];
	    	self.jobinfo = {}
	    	self.jobinfo['inputcoordinate'] = 'genomic';
	    	if (callback != null) {
	    		callback(callbackArgs);
	    	}
		});
	} else if (this.fetchtype == 'info') {
		$.get('/result/service/status', {jobid: jobId, dbpath: dbPath}).done(function (jsonResponseData) {
			self.jobinfo = jsonResponseData;
			if (callback != null) {
				callback(callbackArgs);
			}
	    });
	}
}

InfoMgr.prototype.store = function (self, tabName, jsonResponseData, callback, callbackArgs) {
	resetTab[tabName] = true;
	if (Object.keys(jsonResponseData).length == 0) {
		if (callback != null) {
			callback(callbackArgs);
		} else {
			return;
		}
	}
	self.datas[tabName] = jsonResponseData['data'];
	self.colModels[tabName] = jsonResponseData['columns'];
	self.stats[tabName] = jsonResponseData['stat'];
	self.statuss[tabName] = jsonResponseData['status'];
	if (tabName == 'gene') {
		self.geneRows = {};
		for (var i = 0; i < self.datas[tabName].length; i++) {
			var row = self.datas[tabName][i];
			self.geneRows[row[0]] = row;
		}
	}
	var colModel = self.colModels[tabName];
	var columnnos = {};
	var columngroups = {};
	var columns = [];
	for (var i = 0; i < colModel.length; i++) {
		var colsInGroup = colModel[i]['colModel'];
		for (var j = 0; j < colsInGroup.length; j++) {
			var column = colsInGroup[j];
			columns.push(column);
			column['sortType'] =
				function (row1, row2, dataIndx) {
					var val1 = row1[dataIndx];
					var val2 = row2[dataIndx];
					var decision = -1;
					if (val1 == null) {
						if (val2 == null) {
							decision = 0;
						} else {
							if (ascendingSort[dataIndx]) {
								decision = 1;
							} else {
								decision = -1;
							}
						};
					} else {
						if (val2 == null) {
							if (ascendingSort[dataIndx]) {
								decision = -1;
							} else {
								decision = 1;
							}
						} else if (val1 < val2) {
							decision = -1;
						} else if (val1 > val2) {
							decision = 1;
						} else if (val1 == val2) {
							decision = 0;
						};
					};
					return decision;
				};
			column['render'] = function (ui) {
				var val = ui.rowData[ui.dataIndx];
				if (val == null) {
					val = '';
				}
				var content = '' + val;
				if (content != '' && content.indexOf('http') > -1) {
					content = '<a href="' + content + '" target="_blank">' +
						val + '</a>';
				}
				return '<span title="' + val + '">' + content + '</span>'};
			var columnKey = column['col'];
			var columnNo = column['dataIndx'];
			columnnos[columnKey] = columnNo;
			var columnGroup = column['colgroup'];
			var columnGroupKey = column['colgroupkey'];
			if (columngroups[columnGroup] == undefined) {
				columngroups[columnGroup] = [];
			}
			columngroups[columnGroup].push(columnKey);
			self.columngroupkeys[columnGroup] = columnGroupKey;
			self.colgroupkeytotitle[columnGroupKey] = columnGroup;
		}
	}
	self.columnss[tabName] = columns;
	self.columnnoss[tabName] = columnnos;
	self.columngroupss[tabName] = columngroups;
	
	if (callback != null) {
		callback(callbackArgs);
	}
	
	if (jobDataLoadingDiv != null) {
		jobDataLoadingDiv.parentElement.removeChild(jobDataLoadingDiv);
		jobDataLoadingDiv = null;
	}
}

InfoMgr.prototype.getData = function (tabName) {
	return this.datas[tabName];
}

InfoMgr.prototype.getColumns = function (tabName) {
	return this.columnss[tabName];
}

InfoMgr.prototype.getColModel = function (tabName) {
	return this.colModels[tabName];
}

InfoMgr.prototype.getColumnGroups = function (tabName) {
	return this.columngroupss[tabName];
}

InfoMgr.prototype.getColumnByName = function (tabName, columnName) {
	if (tabName == 'variant') {
		tabName = 'info';
	}
	return this.columnss[tabName][this.columnnoss[tabName][columnName]];
}

InfoMgr.prototype.getColumnNos = function (tabName) {
	if (Object.keys(this.columnnoss).length == 0) {
		return undefined;
	} else {
		return this.columnnoss[tabName];
	}
}

InfoMgr.prototype.getColumnNo = function (tabName, col) {
	if (Object.keys(this.columnnoss).length == 0) {
		return undefined;
	} else {
		return this.columnnoss[tabName][col];
	}
}

InfoMgr.prototype.getStat = function (tabName) {
	return this.stats[tabName];
}

InfoMgr.prototype.getJobInfo = function (tabName) {
	return this.jobinfo;
}

InfoMgr.prototype.getRowValue = function (tabName, row, col) {
	var val = null;
	if (Object.keys(this.columnnoss).length > 0) {
		val = row[this.columnnoss[tabName][col]];
	} else {
		val = row[col];
	}
	return val;
}

InfoMgr.prototype.getGeneRowValue = function (hugo) {
	var val = null;
	if (Object.keys(this.columnnoss).length > 0) {
		val = row[this.columnnoss[tabName][col]];
	} else {
		val = row[col];
	}
	return val;
}
