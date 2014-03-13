/*
	Hospital Information Demonstrator
	Author: Chris Casey
	Copyright 2014 CPC Computer Solutions Ltd.
 
   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at
 
       http://www.apache.org/licenses/LICENSE-2.0
 
   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/
EWD.sockets.log=false;
EWD.application = {
  name: 'aboutMyHospital',
  currentPanel:'',
  previousPanel:'',
  currentList:{},
  framework:'bootstrap',
  
  onStartup: function() {
  }
};
var convertFtoStringDateUS= function(x) {
	var x=x.toString();
	var t=x.slice(8,11);
	if (t.length==1) t=t+'0:00'
	else if (t.length==2) t=t+':00'
	else if (t.length==3) t=t.slice(0,2)+':'+t.slice(2)+'0'
	else t=t.slice(0,1)+':'+t.slice(2,4);
	x=x.slice(3,5)+'/'+x.slice(5,7)+'/'+(parseInt(x.slice(0,3))+1700)+' '+t; 
	return x
	}

/*
$(document).ready(function() {
  EWD.isReady();
});
*/
var swapPanel= function(pnl) {
	console.log('swapping to '+pnl);
	var oldp=$('#'+EWD.application.currentPanel)
	var newp=$('#'+pnl)
	hideDetail();
	oldp.hide();
	newp.show();	
	EWD.application.currentPanel=pnl;
	return;
};
var showDetail = function() {
	$('#vitalGraphHolder').hide();
	$('#listHolder').removeClass('col-sm-12').addClass('col-sm-8');
	$('#detailHolder').show();
};
var hideDetail = function() {
	$('#listHolder').removeClass('col-sm-8').addClass('col-sm-12');
	$('#detailHolder').hide();
	$('#vitalGraphHolder').hide();
};
var getLoc=function(location) {
	//location.coords.latitude
}
dogetloc=function() {navigator.geolocation.getCurrentPosition(getLoc);}
	//take any Vista table format JSON object and make it a table
dispJSON = function(jobj,debug) {
	var jtext='<table class="table table-condensed table-striped "><tbody>';
	var del='<tr><td>',dela='</td></tr>',deli='</td><td>' ;
	var inTable=false
	function jsDebug(p,x) {console.log(p+':'+x)};
	function jsInside(jobj) {
		for (var i in jobj) {
			if (debug) jsDebug(1,i+' '+typeof jobj[i]);
			if (typeof jobj[i] == 'object') {
				if (inTable) {
					if (debug) jsDebug(4,typeof i);
					if ((i>0)) {
						if (debug) jsDebug(5,i)
					}
					else {
						//jtext=jtext+'</tbody></table></tr>';
						inTable=false;
					}
				}
				if (jobj[i].E !==undefined) {
					if (debug) jsDebug(2,i);
					if (jobj[i][1] !=undefined) {
						jtext=jtext+del+i+deli;
						var space='';
						for (var cl=1;(jobj[i][cl]);cl++) {
							jtext=jtext+space+jobj[i][cl];
							space=' ';
							};
						jtext=jtext+dela;
						continue;					
					};
					jtext=jtext+del+i+deli+jobj[i].E+dela;
					continue;
				}
				if (debug) EWD.loop=jobj[i];
				if (jobj[i] instanceof Array) {
					 //jtext=jtext+'<tr><table class="table table-condensed"><th>'+i+'</th><tbody>'
					 inTable=true;
					if (debug) {
					 jsDebug(3,i+' is array');
					 }
				}
				jsInside(jobj[i]);
				}
			else {
				jtext=jtext+del+i+deli+jobj[i]+dela;
				};
		}
	};
	jsInside(jobj);
	return jtext+'</tbody></table>';
};
var toggle=function(e) {
	e.preventDefault();
	$('.active').toggleClass('active', false);
	var current=e.currentTarget.id;
	$('#'+current).toggleClass("active", true);
	return;
};
EWD.onSocketsReady = function() {
	EWD.sockets.sendMessage({
			type: 'wifiQuery',
			params: {prefix: ''}
	});

	$("#selectedHospital").select2({
		placeholder: "Hospital name",
		minimumInputLength: 4,
		query: function (query) {
		  EWD.application.select2H = {callback: query.callback,};
		  EWD.sockets.sendMessage({
			type: 'hospitalQuery',
			params: {prefix: query.term,final:false}
		  });
		}
	})
	.on('change',function(e) {
		EWD.sockets.sendMessage({
			type: 'hospitalQuery',
			params: {prefix:e.added.text,final:true}
		})
	})
	$("#selectedPostCode").select2({
		minimumInputLength: 2,
		placeholder: "PostCode",
		query: function (query) {
		  EWD.application.select2P = {callback: query.callback,};
		  EWD.sockets.sendMessage({
			type: 'postCodeQuery',
			params: {prefix: query.term,final:false}
		  });
		}
	})
	.on('change',function(e) {
		EWD.sockets.sendMessage({
			type: 'postCodeQuery',
			params: {prefix:e.added.text,final:true}
		})
	})
	$("#selectedCity").select2({
		minimumInputLength: 4,
		placeholder: "Town/City",
		query: function (query) {
		  EWD.application.select2C = {callback: query.callback,};
		  EWD.sockets.sendMessage({
			type: 'cityQuery',
			params: {prefix: query.term,final:false}
		  });
		}
	})
	.on('change',function(e) {
		EWD.sockets.sendMessage({
			type: 'cityQuery',
			params: {prefix:e.added.text,final:true}
		})
	})
	$("#selectedTrust").select2({
		minimumInputLength: 3,
		placeholder: "Trust",
		query: function (query) {
		  EWD.application.select2T = {callback: query.callback,};
		  EWD.sockets.sendMessage({
			type: 'trustQuery',
			params: {prefix: query.term,final:false}
		  });
		}
	})
	.on('change',function(e) {
		EWD.sockets.sendMessage({
			type: 'trustQuery',
			params: {prefix:e.added.text,final:true}
		})
	})
	//
	  // Login form button handler
	  $('body').on( 'click', '#loginBtn', function(event) {
		event.preventDefault(); event.stopPropagation();
		$('#loginModalPanel').show();
	  });
	  $('body').on( 'click', '#loginFormBtn', function(event) {
		event.preventDefault(); event.stopPropagation();
		EWD.sockets.submitForm({
		  fields: {
			username: $('#username').val(),
			password: $('#password').val()
		  },
		  messageType: 'EWD.form.login'
		}); 
	  });
	  $('body').on( 'click', '#loadDataBtn', function(event) {
		event.preventDefault();
		event.stopPropagation(); // prevent default bootstrap behavior
		$('#loadDataPanel').show();
	  });
	$('body').on('click','#loadDataFormBtn', function(event) {
		event.preventDefault(); event.stopPropagation(); // prevent default bootstrap behavior
		dumpData=$('#dataDump').val();
		dumpDataJson=CSV2JSON(dumpData);
		EWD.sockets.sendMessage({
			type: 'loadDumpData',
			params: {
				table: $('#dumptableName').val(),
				data: dumpDataJson
			}
		});
	});

	$('body').on('click','#wifiFormBtn', function(event) {
		event.preventDefault(); event.stopPropagation(); // prevent default bootstrap behavior
		EWD.sockets.sendMessage({
			type: 'saveWifiData',
			params: {
				id: $('#wifiFormHospitalId').text(),
				intId: $('#wifiFormHospitalIntId').text(),
				Exists: $('#wifiFormCb1').is(':checked'),
				Open: $('#wifiFormCb2').is(':checked'),
				Free: $('#wifiFormCb3').is(':checked'),
				Cost: $('#wifiCost').val(),
				EditedBy: $('#EditedByName').val(),
				Comment: $('#wifiComment').val(),
			}
		});
	});
};

EWD.onSocketMessage = function(messageObj) {
	console.log('message received: '+messageObj.type);
	if (messageObj.type === 'EWD.form.login') {
		$('#loginModalPanel').hide();
		return;
	}
	if (messageObj.type === 'loggedInAs') {
		if (messageObj.message.adminUser) {
			$('#loadDataBtn').show();
			$('#wifiFormBtn').show();
		}
		return;
	}
	if (messageObj.type === 'cityMatches') {
		EWD.application.select2C.results = messageObj.message;
		EWD.application.select2C.callback(EWD.application.select2C);
		return;
	}
	if (messageObj.type === 'hospitalMatches') {
		EWD.application.select2H.results = messageObj.message;
		EWD.application.select2H.callback(EWD.application.select2H);
		return;
	}
	if (messageObj.type === 'postCodeMatches') {
		EWD.application.select2P.results = messageObj.message;
		EWD.application.select2P.callback(EWD.application.select2P);
		return;
	}
	if (messageObj.type === 'trustMatches') {
		EWD.application.select2T.results = messageObj.message;
		EWD.application.select2T.callback(EWD.application.select2T);
		return;
	}
	if (messageObj.type === 'hospitalSummaryList') {
		//console.log('hospitalList: '+ JSON.stringify(messageObj,2));
		var aaData=[];
		EWD.application.currentList={};
		var data=messageObj.message;
		for (var i=0;i<data.length;i++) {
			var wifi='unknown';
			if (data[i].data.wifi) wifi=data[i].data.wifi.exists;
			aaData.push(
				[
				data[i].id,
				data[i].hospitalId,
				data[i].name,
				data[i].data.Address_line_4,
				wifi
				]
				);
			EWD.application.currentList[data[i].hospitalId]=data[i].data;
			EWD.application.currentList[data[i].hospitalId].id=data[i].id;
		};
		var hospitalListTableDT=$('#hospitalListTable').dataTable({
			'bDestroy':true,
			'aaData': aaData,
			'aoColumns': [
				{'bVisible':false},{'sTitle':'hospital Id'},{'sTitle':'Name'},{'sTitle':'Town'},{'sTitle':'Wifi Enabled'}
			]
		}).css('width','');
		$(hospitalListTableDT.fnGetNodes()).click(function(e){
			e.preventDefault();
			e.stopPropagation();
			var thisHospId=e.currentTarget.firstChild.textContent;
			var thisHosp=EWD.application.currentList[thisHospId];
			$('#wifiFormHospitalName').text(thisHosp.Hospital_Name);
			$('#wifiFormHospitalId').text(thisHospId);
			$('#wifiFormHospitalIntId').text(thisHosp.id);
			$('#wifiFormCb1').prop('checked',false)
			$('#wifiFormCb2').prop('checked',false)
			$('#wifiFormCb3').prop('checked',false)
			$('#wifiCost').val('');
			$('#EditedByName').val('');
			$('#wifiComment').val('');

			if (thisHosp.wifi) {
				$('#wifiFormCb1').prop('checked',thisHosp.wifi.exists);
				$('#wifiFormCb2').prop('checked',thisHosp.wifi.open);
				$('#wifiFormCb3').prop('checked',thisHosp.wifi.free);
				$('#wifiCost').val(thisHosp.wifi.cost);
				$('#EditedByName').val(thisHosp.wifi.editedBy);
				$('#wifiComment').val(thisHosp.wifi.comment);
			}
			$('#addWifiForm').show();
			showDetail();
			//EWD.application.oneHospital={};
			//oneHospital={};
		});
		return;
	}

	//catch any uncaught messages
	console.log('unknown message '+JSON.stringify(messageObj));
};
